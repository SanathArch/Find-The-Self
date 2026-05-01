import { jsPDF } from 'jspdf';
import { Interest, Path, Dimension } from './types';
import { DIMS } from './constants';

export async function downloadPDF(data: {
  ints: string[];
  isc: { name: string; why: string; scores: Record<string, number>; total: number }[];
  agg: Record<string, number>;
  ps: (Path & { score: number })[];
  topW: string[];
  thread: string;
  combos: { a: string; b: string; desc: string; score: number }[];
}) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const PW = 210, M = 20;
  let y = 0;
  const GOLD: [number, number, number] = [201, 168, 76];
  const BG: [number, number, number] = [13, 13, 13];
  const TXT: [number, number, number] = [240, 237, 230];
  const MUT: [number, number, number] = [136, 136, 136];

  const fillBg = () => { doc.setFillColor(...BG); doc.rect(0, 0, PW, 297, 'F'); };
  const newPage = () => { doc.addPage(); fillBg(); y = 22; };
  const chk = (n: number) => { if (y + n > 275) newPage(); };
  const hline = (col?: [number, number, number]) => { doc.setDrawColor(...(col || GOLD)); doc.setLineWidth(0.25); doc.line(M, y, PW - M, y); };
  
  const h1 = (t: string) => { chk(14); doc.setFont('helvetica', 'bold'); doc.setFontSize(20); doc.setTextColor(...GOLD); doc.text(t, M, y); y += 9; };
  const h2 = (t: string) => { chk(10); doc.setFont('helvetica', 'bold'); doc.setFontSize(12); doc.setTextColor(...GOLD); doc.text(t, M, y); y += 7; };
  
  const body = (t: string, col?: [number, number, number]) => {
    doc.setFont('helvetica', 'normal'); doc.setFontSize(10); doc.setTextColor(...(col || TXT));
    const ls = doc.splitTextToSize(t, PW - M * 2); chk(ls.length * 5 + 2); doc.text(ls, M, y); y += ls.length * 5 + 2;
  };

  const sm = (t: string, col?: [number, number, number]) => {
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(...(col || MUT));
    const ls = doc.splitTextToSize(t, PW - M * 2); chk(ls.length * 4 + 1); doc.text(ls, M, y); y += ls.length * 4 + 1;
  };

  const bar = (pct: number, w?: number) => {
    const bw = w || (PW - M * 2);
    doc.setFillColor(42, 42, 42); doc.roundedRect(M, y, bw, 2.5, 1, 1, 'F');
    if (pct > 0) { doc.setFillColor(...GOLD); doc.roundedRect(M, y, bw * (pct / 100), 2.5, 1, 1, 'F'); }
    y += 5;
  };

  // COVER
  fillBg(); y = 46;
  doc.setFillColor(36, 22, 4);
  doc.roundedRect(M - 4, y - 8, PW - M * 2 + 8, 58, 3, 3, 'F');
  doc.setFont('helvetica', 'bold'); doc.setFontSize(24); doc.setTextColor(...GOLD);
  doc.text('Golden Thread Report', PW / 2, y + 7, { align: 'center' });
  doc.setFont('helvetica', 'italic'); doc.setFontSize(10); doc.setTextColor(200, 190, 160);
  const tl = doc.splitTextToSize(data.thread, PW - M * 2 - 8);
  doc.text(tl, PW / 2, y + 19, { align: 'center' });
  y += 64;
  doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(...MUT);
  doc.text(`Generated ${new Date().toLocaleDateString()}`, PW / 2, y, { align: 'center' });
  y += 8;
  if (data.topW.length) {
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(...GOLD);
    doc.text('Core themes:  ' + data.topW.join('  ·  '), PW / 2, y, { align: 'center' });
    y += 8;
  }

  // PAGE 2: Interests
  newPage(); h1('Your Interests & Scores'); y += 3; hline(); y += 5;
  data.isc.forEach((item, i) => {
    chk(26);
    doc.setFont('helvetica', 'bold'); doc.setFontSize(10); doc.setTextColor(...TXT);
    doc.text(`${String(i + 1).padStart(2, '0')}  ${item.name}`, M, y);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(...GOLD);
    doc.text(`${item.total.toFixed(1)}/10`, PW - M, y, { align: 'right' });
    y += 5; bar(Math.round((item.total / 10) * 100));
    if (item.why) sm(`"${item.why.slice(0, 150)}${item.why.length > 150 ? '...' : ''}"`);
    const ds = DIMS.map(d => `${d.l}: ${item.scores[d.k] || 5}`).join('   ');
    sm(ds, [75, 75, 75]); y += 3;
  });
  y += 3; hline(); y += 5; h2('Dimension Averages');
  DIMS.forEach(d => {
    chk(9);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(...TXT);
    doc.text(d.l, M, y);
    doc.setTextColor(...GOLD); doc.text(`${data.agg[d.k].toFixed(1)}/10`, PW - M, y, { align: 'right' });
    y += 4; bar(Math.round((data.agg[d.k] / 10) * 100));
  });

  // PAGE 3: Combinations
  newPage(); h1('Interest Synergy Map');
  body('How each pair of your interests amplifies the other — sorted by synergy strength.', MUT);
  y += 3; hline(); y += 6;
  data.combos.forEach((c, idx) => {
    chk(32);
    doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(...GOLD);
    doc.text(`${c.a}  ↔  ${c.b}`, M, y);
    const str = Math.min(5, Math.max(1, Math.round(c.score * 5)));
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8);
    doc.text('●'.repeat(str) + '○'.repeat(5 - str), PW - M, y, { align: 'right' });
    y += 6;
    const plain = c.desc.replace(/\*\*/g, '');
    sm(plain);
    y += 3;
    if (idx < data.combos.length - 1) { doc.setDrawColor(42, 42, 42); doc.setLineWidth(0.15); doc.line(M, y, PW - M, y); y += 4; }
  });

  // PAGE 4: Paths
  newPage(); h1('Your Best-Fit Paths');
  body('Ranked by alignment with your scores across all four dimensions.', MUT);
  y += 3; hline(); y += 6;
  data.ps.forEach((p, i) => {
    const pct = Math.round((p.score / 30) * 100);
    chk(28);
    if (i === 0) { doc.setFillColor(36, 22, 4); doc.roundedRect(M - 3, y - 4, PW - M * 2 + 6, 25, 2, 2, 'F'); doc.setDrawColor(...GOLD); doc.setLineWidth(0.25); doc.roundedRect(M - 3, y - 4, PW - M * 2 + 6, 25, 2, 2, 'S'); }
    doc.setFont('helvetica', 'normal'); doc.setFontSize(7); doc.setTextColor(...GOLD);
    doc.text(i === 0 ? '✦ BEST MATCH' : '#' + String(i + 1).padStart(2, '0'), M, y);
    doc.setFont('helvetica', 'bold'); doc.setFontSize(11); doc.setTextColor(...TXT);
    y += 5; doc.text(p.n, M, y);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(...MUT);
    doc.text(`${pct}% match`, PW - M, y, { align: 'right' });
    y += 5; sm(p.d); bar(pct); y += 4;
  });

  doc.save('golden-thread-report.pdf');
}

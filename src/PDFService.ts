import { jsPDF } from 'jspdf';
import { Interest, Path, Dimension } from './types';
import { DIMS } from './constants';

export async function generatePDFBlob(data: {
  ints: string[];
  isc: { name: string; why: string; scores: Record<string, number>; total: number }[];
  agg: Record<string, number>;
  ps: (Path & { score: number })[];
  topW: string[];
  thread: string;
  moat: string;
  combos: { a: string; b: string; desc: string; score: number }[];
}, userName?: string): Promise<Blob> {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const PW = 210, M = 20;
  let y = 0;
  
  // Theme Colors
  const CREAM: [number, number, number] = [249, 248, 244];
  const INK: [number, number, number] = [44, 44, 36];
  const OLIVE: [number, number, number] = [90, 90, 64];
  const SAGE: [number, number, number] = [140, 147, 122];
  const TAN: [number, number, number] = [235, 231, 223];

  const fillBg = () => { doc.setFillColor(...CREAM); doc.rect(0, 0, PW, 297, 'F'); };
  const newPage = () => { doc.addPage(); fillBg(); y = 22; };
  const chk = (n: number) => { if (y + n > 275) newPage(); };
  const hline = (col?: [number, number, number]) => { doc.setDrawColor(...(col || TAN)); doc.setLineWidth(0.2); doc.line(M, y, PW - M, y); };
  
  const h1 = (t: string) => { 
    chk(14); 
    doc.setFont('times', 'italic'); doc.setFontSize(22); doc.setTextColor(...OLIVE); 
    doc.text(t, PW / 2, y, { align: 'center' }); 
    y += 10; 
  };
  
  const h2 = (t: string) => { 
    chk(10); 
    doc.setFont('helvetica', 'bold'); doc.setFontSize(12); doc.setTextColor(...OLIVE); 
    doc.text(t, M, y); 
    y += 7; 
  };
  
  const body = (t: string, col?: [number, number, number]) => {
    doc.setFont('helvetica', 'normal'); doc.setFontSize(10); doc.setTextColor(...(col || INK));
    const ls = doc.splitTextToSize(t, PW - M * 2); chk(ls.length * 5 + 2); doc.text(ls, M, y); y += ls.length * 5 + 2;
  };

  const sm = (t: string, col?: [number, number, number]) => {
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(...(col || SAGE));
    const ls = doc.splitTextToSize(t, PW - M * 2); chk(ls.length * 4 + 1); doc.text(ls, M, y); y += ls.length * 4 + 1;
  };

  const drawSlider = (val: number, label: string, xOffset: number, width: number) => {
    doc.setFontSize(8); doc.setTextColor(...SAGE);
    doc.text(label, xOffset, y);
    doc.setTextColor(...OLIVE); doc.setFont('helvetica', 'bold');
    doc.text(val.toString(), xOffset + width, y, { align: 'right' });
    y += 2;
    doc.setFillColor(...TAN); doc.roundedRect(xOffset, y, width, 1.5, 0.5, 0.5, 'F');
    doc.setFillColor(...OLIVE); doc.roundedRect(xOffset, y, width * (val / 10), 1.5, 0.5, 0.5, 'F');
    y += 6;
  };

  // COVER
  fillBg(); y = 50;
  // Logo placeholder (the circle/thread icon)
  doc.setDrawColor(...OLIVE); doc.circle(PW / 2, y, 12, 'S');
  doc.line(PW / 2 - 6, y + 6, PW / 2, y - 6);
  doc.line(PW / 2, y - 6, PW / 2 + 6, y + 6);
  y += 25;

  doc.setFont('times', 'bolditalic'); doc.setFontSize(32); doc.setTextColor(...INK);
  const titleText = userName ? `${userName}'s Golden Thread` : 'Your Golden Thread';
  doc.text(titleText, PW / 2, y, { align: 'center' });
  y += 15;

  
  doc.setFont('times', 'italic'); doc.setFontSize(14); doc.setTextColor(...OLIVE);
  const threadText = doc.splitTextToSize(data.thread, PW - M * 2 - 10);
  doc.text(threadText, PW / 2, y, { align: 'center' });
  y += threadText.length * 7 + 10;

  doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(...SAGE);
  doc.text(`A journey discovered on ${new Date().toLocaleDateString()}`, PW / 2, y, { align: 'center' });
  y += 15;

  if (data.topW.length) {
    const themes = data.topW.map(w => w.toUpperCase()).join('  •  ');
    doc.setFont('helvetica', 'bold'); doc.setFontSize(8); doc.setTextColor(...OLIVE);
    doc.text(themes, PW / 2, y, { align: 'center' });
  }

  // PAGE 2: The Curiosity Audit (Testimonial Section)
  newPage(); 
  h1('The Curiosity Audit');
  sm('Your raw entries and the sparks that lead to your discovery.', [120, 120, 110]);
  y += 5;

  data.isc.forEach((item, i) => {
    chk(45);
    // Card Background
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(...TAN);
    doc.roundedRect(M - 2, y - 4, PW - M * 2 + 4, 40, 2, 2, 'FD');
    
    doc.setFont('helvetica', 'bold'); doc.setFontSize(11); doc.setTextColor(...OLIVE);
    doc.text(`${item.name}`, M, y + 2);
    
    doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(...OLIVE);
    doc.text(`${item.total.toFixed(1)}/10`, PW - M, y + 2, { align: 'right' });
    
    y += 8;
    doc.setFont('helvetica', 'italic'); doc.setFontSize(9); doc.setTextColor(...INK);
    const whyText = doc.splitTextToSize(`"${item.why || 'No spark recorded.'}"`, PW - M * 2 - 4);
    doc.text(whyText, M, y);
    y += whyText.length * 4.5 + 4;

    // Sliders
    const sliderW = (PW - M * 2 - 10) / 2;
    const startY = y;
    drawSlider(item.scores.energy, 'Energy Audit', M, sliderW);
    drawSlider(item.scores.leverage, 'Leverage', M, sliderW);
    
    const secondColY = startY;
    y = secondColY;
    drawSlider(item.scores.skill, 'Competence', M + sliderW + 10, sliderW);
    drawSlider(item.scores.longevity, 'Longevity', M + sliderW + 10, sliderW);
    
    y += 4;
  });

  // PAGE 3: Strategy & Moat
  newPage();
  h1('Your Dimension Profile');
  sm('Aggregate alignment across all four core pillars of the Golden Thread.', [120, 120, 110]);
  y += 5;

  // Simple visual representation of Dimension Averages
  const chartW = PW - M * 2;
  DIMS.forEach((d, i) => {
    chk(15);
    const val = data.agg[d.k] || 5;
    doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(...INK);
    doc.text(d.l, M, y);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(...SAGE);
    doc.text(`${val.toFixed(1)}/10`, PW - M, y, { align: 'right' });
    y += 2;
    doc.setFillColor(...TAN); doc.roundedRect(M, y, chartW, 2, 0.5, 0.5, 'F');
    doc.setFillColor(...SAGE); doc.roundedRect(M, y, chartW * (val / 10), 2, 0.5, 0.5, 'F');
    y += 8;
  });

  y += 5;
  h2('Your Unique Moat');
  body(data.moat);
  y += 8;

  h2('Best-Fit Paths');
  data.ps.slice(0, 3).forEach((p, i) => {
    chk(30);
    const pct = Math.round((p.score / 30) * 100);
    doc.setFillColor(255, 255, 255); // White bg
    doc.setDrawColor(...(i === 0 ? [90, 90, 64] : TAN));
    doc.roundedRect(M - 2, y - 4, PW - M * 2 + 4, 22, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold'); doc.setFontSize(10); doc.setTextColor(...OLIVE);
    doc.text(p.n, M, y + 2);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(...SAGE);
    doc.text(`${pct}% Match`, PW - M, y + 2, { align: 'right' });

    y += 6;
    doc.setFontSize(8); doc.setTextColor(...INK);
    const desc = doc.splitTextToSize(p.d, PW - M * 2 - 4);
    doc.text(desc, M, y);
    y += desc.length * 4 + 4;
  });


  // PAGE 4: Synergy Map
  newPage();
  h1('Interest Synergy Map');
  y += 5;
  data.combos.slice(0, 6).forEach((c, idx) => {
    chk(25);
    doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(...OLIVE);
    doc.text(`${c.a} + ${c.b}`, M, y);
    
    const str = Math.min(5, Math.max(1, Math.round(c.score * 5)));
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(...OLIVE);
    doc.text('✦'.repeat(str) + '✧'.repeat(5 - str), PW - M, y, { align: 'right' });
    
    y += 4;
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5); doc.setTextColor(...INK);
    const plain = c.desc.replace(/\*\*/g, '');
    const comboDesc = doc.splitTextToSize(plain, PW - M * 2);
    doc.text(comboDesc, M, y);
    y += comboDesc.length * 4 + 6;
    
    doc.setDrawColor(...TAN); doc.line(M, y - 2, PW - M, y - 2);
    y += 2;
  });

  // Footer on last page
  doc.setFont('times', 'italic'); doc.setFontSize(8); doc.setTextColor(...SAGE);
  doc.text('"The people most at risk aren\'t the generalists. They\'re the ones who went too narrow, too early."', PW / 2, 285, { align: 'center' });

  return doc.output('blob');
}


import JSZip from 'jszip';
import { generatePDFBlob } from './PDFService';

export async function downloadGoldenThreadZip(data: any, userName?: string) {
  const zip = new JSZip();
  const safeName = userName?.trim().replace(/[^a-z0-9]/gi, '_') || "Explorer";

  // Create folders
  const mainFolder = zip.folder("the golden thread");
  const mindMapFolder = zip.folder("Personality Mind Map");

  // Generate PDF
  const pdfBlob = await generatePDFBlob(data, userName);
  if (mainFolder) {
    mainFolder.file("report.pdf", pdfBlob);
  }

  // Add individual interest analysis to Mind Map folder as separate MD files
  if (mindMapFolder && data.isc) {
    data.isc.forEach((item: any) => {
      const interestMd = `# ${item.name}\n\n## Why\n${item.why}\n\n## Deep Dive Analysis\n${data.deepDives?.[item.name] || 'Analysis pending...'}\n`;
      mindMapFolder.file(`${item.name.replace(/\//g, '-')}.md`, interestMd);
    });

    // Add Connectivity/Mind Map main file
    mindMapFolder.file("Personality_Mind_Map.md", data.mindMap);
  }

  // Generate ZIP and trigger download
  const content = await zip.generateAsync({ type: "blob" });
  const url = URL.createObjectURL(content);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${safeName}_Golden_Thread_Report_Bundle.zip`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

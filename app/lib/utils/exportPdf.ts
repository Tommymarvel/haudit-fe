import { toPng } from 'html-to-image';
import jsPDF from 'jspdf';

const MARGIN = 32; // px margin on each side in the PDF

export async function exportToPdf(element: HTMLElement, filename: string): Promise<void> {
  const dataUrl = await toPng(element, {
    cacheBust: true,
    pixelRatio: 2,
    filter: (node) => {
      if (node instanceof HTMLElement && node.hasAttribute('data-pdf-exclude')) return false;
      if (node instanceof HTMLImageElement && !node.complete) return false;
      return true;
    },
  });

  const img = new Image();
  img.src = dataUrl;
  await new Promise<void>((resolve) => { img.onload = () => resolve(); });

  const pxW = element.scrollWidth;
  const pxH = element.scrollHeight;
  const orientation = pxW > pxH ? 'landscape' : 'portrait';

  const pdf = new jsPDF({
    orientation,
    unit: 'px',
    format: [pxW + MARGIN * 2, pxH + MARGIN * 2],
  });
  pdf.addImage(dataUrl, 'PNG', MARGIN, MARGIN, pxW, pxH);
  pdf.save(filename);
}

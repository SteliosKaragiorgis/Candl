import html2canvas from 'html2canvas';
import type { RefObject } from 'react';

export function useShareCard() {
  const captureCard = async (cardRef: RefObject<HTMLElement>): Promise<HTMLCanvasElement> => {
    if (!cardRef.current) throw new Error('Card ref not ready');
    // Wait for all fonts (Inter etc.) to finish loading so html2canvas
    // renders text correctly instead of falling back to system fonts.
    await document.fonts.ready;
    return html2canvas(cardRef.current, {
      backgroundColor: '#0d0d0d',
      scale: 2,
      useCORS: true,
      allowTaint: false,
      logging: false,
    });
  };

  const handleDownload = (canvas: HTMLCanvasElement) => {
    const link = document.createElement('a');
    link.download = 'candl-trade.png';
    link.href = canvas.toDataURL('image/png', 1.0);
    link.click();
  };

  const handleShare = async (cardRef: RefObject<HTMLElement>, caption?: string) => {
    const canvas = await captureCard(cardRef);
    const blob = await new Promise<Blob>(resolve =>
      canvas.toBlob(b => resolve(b!), 'image/png', 1.0),
    );
    const file = new File([blob], 'candl-trade.png', { type: 'image/png' });

    if (navigator.share && navigator.canShare({ files: [file] })) {
      await navigator.share({
        title: 'My trade on Candl.',
        text: caption || 'Check out this trade',
        files: [file],
      });
    } else {
      handleDownload(canvas);
    }
  };

  const handleCopyImage = async (cardRef: RefObject<HTMLElement>) => {
    const canvas = await captureCard(cardRef);
    canvas.toBlob(blob => {
      if (!blob) return;
      navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
    });
  };

  return { handleShare, handleCopyImage, handleDownload, captureCard };
}

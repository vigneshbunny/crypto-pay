import { useEffect, useRef } from "react";

interface QRCodeDisplayProps {
  value: string;
  size?: number;
}

export default function QRCodeDisplay({ value, size = 256 }: QRCodeDisplayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!value || !canvasRef.current) return;

    // Simple QR code generation (in production, use a proper QR code library)
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return;

    // Clear canvas
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, size, size);

    // Draw a simple pattern representing QR code
    ctx.fillStyle = '#000000';
    const moduleSize = size / 25;
    
    // Draw corner squares
    for (let i = 0; i < 7; i++) {
      for (let j = 0; j < 7; j++) {
        if ((i === 0 || i === 6 || j === 0 || j === 6) || (i >= 2 && i <= 4 && j >= 2 && j <= 4)) {
          ctx.fillRect(i * moduleSize, j * moduleSize, moduleSize, moduleSize);
          ctx.fillRect((18 + i) * moduleSize, j * moduleSize, moduleSize, moduleSize);
          ctx.fillRect(i * moduleSize, (18 + j) * moduleSize, moduleSize, moduleSize);
        }
      }
    }

    // Draw some random pattern for data
    for (let i = 8; i < 17; i++) {
      for (let j = 8; j < 17; j++) {
        if (Math.random() > 0.5) {
          ctx.fillRect(i * moduleSize, j * moduleSize, moduleSize, moduleSize);
        }
      }
    }

  }, [value, size]);

  return (
    <div className="w-full h-full bg-white border-2 border-gray-200 rounded-2xl flex items-center justify-center">
      <canvas
        ref={canvasRef}
        width={size}
        height={size}
        className="max-w-full max-h-full rounded-xl"
      />
    </div>
  );
}

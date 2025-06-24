import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";

interface QRCodeDisplayProps {
  value: string;
  size?: number;
}

export default function QRCodeDisplay({
  value,
  size = 256,
}: QRCodeDisplayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!value || !canvasRef.current) return;

    const generateQRCode = async () => {
      try {
        setIsLoading(true);
        await QRCode.toCanvas(canvasRef.current!, value, {
          width: size,
          margin: 2,
          color: {
            dark: "#000000",
            light: "#FFFFFF",
          },
        });
      } catch (error) {
        console.error("Error generating QR code:", error);
      } finally {
        setIsLoading(false); // Ensure loading state is updated
      }
    };

    generateQRCode();
  }, [value, size]);

  return (
    <div className="w-full h-full bg-white border-2 border-gray-200 rounded-2xl flex items-center justify-center">
      {isLoading ? (
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
        <canvas ref={canvasRef} className="max-w-full max-h-full rounded-xl" />
      )}
    </div>
  );
}

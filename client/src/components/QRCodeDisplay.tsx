import { useEffect, useRef } from "react";
import * as QRCodeLib from "qrcode";
import { QRCodeSkeleton } from "@/components/ui/skeleton";

interface QRCodeDisplayProps {
  value: string;
  size?: number;
}

export default function QRCodeDisplay({
  value,
  size = 256,
}: QRCodeDisplayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!value || !canvasRef.current) return;
    QRCodeLib.toCanvas(canvasRef.current, value, {
      width: size,
      margin: 2,
      color: {
        dark: "#000000",
        light: "#ffffff",
      },
    }).catch(() => {
      // Optionally handle error
    });
  }, [value, size, canvasRef.current]);

  if (!value) {
    return <QRCodeSkeleton size={size} />;
  }

  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size}
      style={{ display: "block", margin: "0 auto", background: "#fff", borderRadius: 16 }}
      aria-label="Wallet QR Code"
    />
  );
}

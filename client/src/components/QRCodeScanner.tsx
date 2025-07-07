import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Camera, AlertCircle, CheckCircle, Upload, QrCode } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ShimmerSkeleton } from "@/components/ui/skeleton";

interface QRCodeScannerProps {
  onScan: (address: string) => void;
  showUseButton?: boolean;
}

export default function QRCodeScanner({ onScan, showUseButton = false }: QRCodeScannerProps) {
  const { toast } = useToast();
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scannerRef = useRef<any>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isScanning, setIsScanning] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  const [scannedAddress, setScannedAddress] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [scanMode, setScanMode] = useState<'camera' | 'upload'>('camera');

  useEffect(() => {
    if (scanMode === 'camera') {
      initializeScanner();
    } else {
      cleanup();
    }
    return () => cleanup();
  }, [scanMode]);

  const initializeScanner = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      streamRef.current = stream;
      setHasPermission(true);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await new Promise((resolve) => {
          if (videoRef.current) {
            videoRef.current.onloadedmetadata = resolve;
          }
        });
        if (videoRef.current) {
          videoRef.current.play();
        }
        const QrScanner = (await import('qr-scanner')).default;
        scannerRef.current = new QrScanner(
          videoRef.current,
          (result: any) => {
            handleScanSuccess(result.data || result);
          },
          {
            highlightScanRegion: true,
            highlightCodeOutline: true,
          }
        );
        await scannerRef.current.start();
        setIsScanning(true);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to initialize camera');
      setHasPermission(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleScanSuccess = (data: string) => {
    if (data.startsWith('T') && data.length === 34) {
      setScannedAddress(data);
      onScan(data);
      toast({
        title: "Address scanned!",
        description: "Valid TRX address detected",
      });
      if (scannerRef.current) {
        scannerRef.current.stop();
      }
      setIsScanning(false);
    } else {
      toast({
        title: "Invalid QR Code",
        description: "Please scan a valid TRX wallet address",
        variant: "destructive",
      });
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      setIsLoading(true);
      setError(null);
      const QrScanner = (await import('qr-scanner')).default;
      const result = await QrScanner.scanImage(file);
      if (result) {
        handleScanSuccess(result);
      } else {
        setError('No QR code found in the uploaded image');
        toast({
          title: "No QR Code Found",
          description: "The uploaded image doesn't contain a valid QR code",
          variant: "destructive",
        });
      }
    } catch (err: any) {
      setError('Failed to process uploaded image');
      toast({
        title: "Upload Failed",
        description: "Failed to process the uploaded image",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const cleanup = () => {
    if (scannerRef.current) {
      scannerRef.current.stop();
      scannerRef.current.destroy();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
  };

  const handleScanAgain = () => {
    setScannedAddress("");
    setError(null);
    if (scanMode === 'camera') {
      initializeScanner();
    } else {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Mode Selection */}
      <div className="flex justify-center space-x-2 mb-2">
        <Button
          variant={scanMode === 'camera' ? 'default' : 'outline'}
          onClick={() => setScanMode('camera')}
          size="sm"
        >
          <Camera className="w-4 h-4 mr-1" /> Camera
        </Button>
        <Button
          variant={scanMode === 'upload' ? 'default' : 'outline'}
          onClick={() => setScanMode('upload')}
          size="sm"
        >
          <Upload className="w-4 h-4 mr-1" /> Upload
        </Button>
      </div>
      {/* Scanner or Upload */}
      {scanMode === 'camera' && (
        <div className="flex flex-col items-center">
          {isLoading ? (
            <ShimmerSkeleton className="h-64 w-64 rounded-xl" />
          ) : error ? (
            <div className="text-red-500 flex flex-col items-center">
              <AlertCircle className="w-8 h-8 mb-2" />
              <p>{error}</p>
              <Button onClick={handleScanAgain} size="sm" className="mt-2">Try Again</Button>
            </div>
          ) : scannedAddress ? (
            <div className="flex flex-col items-center">
              <CheckCircle className="w-8 h-8 text-green-500 mb-2" />
              <p className="font-mono text-green-700 mb-2">{scannedAddress}</p>
              {showUseButton && (
                <Button onClick={() => onScan(scannedAddress)} size="sm" className="mb-2">Use Address</Button>
              )}
              <Button onClick={handleScanAgain} size="sm" variant="outline">Scan Again</Button>
            </div>
          ) : (
            <video ref={videoRef} className="rounded-xl w-64 h-64 bg-black" />
          )}
        </div>
      )}
      {scanMode === 'upload' && (
        <div className="flex flex-col items-center">
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            onChange={handleFileUpload}
            className="hidden"
          />
          <Button onClick={() => fileInputRef.current?.click()} size="sm" className="mb-2">
            <Upload className="w-4 h-4 mr-1" /> Upload Image
          </Button>
          {isLoading ? (
            <ShimmerSkeleton className="h-64 w-64 rounded-xl" />
          ) : error ? (
            <div className="text-red-500 flex flex-col items-center">
              <AlertCircle className="w-8 h-8 mb-2" />
              <p>{error}</p>
              <Button onClick={handleScanAgain} size="sm" className="mt-2">Try Again</Button>
            </div>
          ) : scannedAddress ? (
            <div className="flex flex-col items-center">
              <CheckCircle className="w-8 h-8 text-green-500 mb-2" />
              <p className="font-mono text-green-700 mb-2">{scannedAddress}</p>
              {showUseButton && (
                <Button onClick={() => onScan(scannedAddress)} size="sm" className="mb-2">Use Address</Button>
              )}
              <Button onClick={handleScanAgain} size="sm" variant="outline">Scan Again</Button>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
} 
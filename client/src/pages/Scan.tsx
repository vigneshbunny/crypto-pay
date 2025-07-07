import { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import QrScanner from "qr-scanner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Camera, Upload, QrCode, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Scan() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scannerRef = useRef<QrScanner | null>(null);

  const [mode, setMode] = useState<"none" | "camera" | "upload">("none");
  const [address, setAddress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cameraRequested, setCameraRequested] = useState(false);

  // Camera start trigger when video element is ready
  useEffect(() => {
    if (mode === "camera" && cameraRequested && videoRef.current) {
      startCameraScanNow();
    }
  }, [mode, cameraRequested]);

  useEffect(() => {
    return () => {
      stopScanner();
    };
  }, []);

  const stopScanner = () => {
    if (scannerRef.current) {
      scannerRef.current.stop();
      scannerRef.current.destroy();
      scannerRef.current = null;
    }
  };

  const extractTRX = (text: string) => {
    const match = text.match(/T[A-Za-z0-9]{33}/);
    return match ? match[0] : null;
  };

  const handleScanSuccess = (text: string) => {
    const trx = extractTRX(text);
    if (trx) {
      setAddress(trx);
      stopScanner();
      toast({
        title: "TRX Address Found!",
        description: `Address: ${trx.slice(0, 6)}...${trx.slice(-6)}`,
      });
    } else {
      setError("No valid TRX address found.");
      toast({
        title: "Invalid Address",
        description: "Please scan a valid TRX wallet address",
        variant: "destructive",
      });
    }
  };

  const startCameraScan = () => {
    setError(null);
    setAddress(null);
    setCameraRequested(true);
    setMode("camera");
  };

  const startCameraScanNow = async () => {
    try {
      const video = videoRef.current;
      if (!video) throw new Error("Video ref not ready");

      const scanner = new QrScanner(
        video,
        (result) => handleScanSuccess(result.data),
        { highlightScanRegion: true }
      );

      scannerRef.current = scanner;
      await scanner.start();
    } catch (err: any) {
      console.error(err);
      setError("Camera error: " + (err.message || "Unknown"));
      toast({
        title: "Camera Error",
        description: "Failed to access camera. Please check permissions.",
        variant: "destructive",
      });
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setMode("upload");
    setError(null);
    setAddress(null);

    try {
      const result = await QrScanner.scanImage(file);
      handleScanSuccess(result);
    } catch (err: any) {
      console.error(err);
      setError("Image scan failed: " + err.message);
      toast({
        title: "Scan Failed",
        description: "Failed to scan QR code from image",
        variant: "destructive",
      });
    }
  };

  const useScannedAddress = () => {
    if (address) {
      console.log("Saving address to sessionStorage:", address);
      sessionStorage.setItem('scannedAddress', address);
      
      // Verify the address was saved
      const savedAddress = sessionStorage.getItem('scannedAddress');
      console.log("Verification - saved address:", savedAddress);
      
      // Small delay to ensure sessionStorage is set
      setTimeout(() => {
        console.log("Address saved, navigating to /send");
        setLocation('/send');
      }, 100);
    } else {
      console.log("No address to save");
    }
  };

  const reset = () => {
    stopScanner();
    setMode("none");
    setAddress(null);
    setError(null);
    setCameraRequested(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-white shadow-sm border-b">
        <div className="flex items-center justify-between p-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation('/dashboard')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <h1 className="text-lg font-semibold">Scan QR Code</h1>
          <div className="w-10"></div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {mode === "none" && (
          <Card>
            <CardContent className="p-6">
              <div className="text-center space-y-6">
                <div className="space-y-2">
                  <QrCode className="h-16 w-16 text-primary mx-auto" />
                  <h2 className="text-xl font-semibold">Scan QR Code</h2>
                  <p className="text-gray-600">Choose how you want to scan the QR code</p>
                </div>
                
                <div className="space-y-3">
                  <Button
                    onClick={startCameraScan}
                    className="w-full h-12 text-lg"
                    size="lg"
                  >
                    <Camera className="h-5 w-5 mr-2" />
                    Use Camera
                  </Button>
                  
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    variant="outline"
                    className="w-full h-12 text-lg"
                    size="lg"
                  >
                    <Upload className="h-5 w-5 mr-2" />
                    Upload Image
                  </Button>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </div>
            </CardContent>
          </Card>
        )}

        {mode === "camera" && (
          <Card>
            <CardContent className="p-4">
              <div className="space-y-4">
                <div className="relative bg-black rounded-lg overflow-hidden aspect-square">
                  <video 
                    ref={videoRef} 
                    className="w-full h-full object-cover"
                    playsInline
                    muted
                    autoPlay
                  />
                  
                  {/* Scanning overlay - only animated line */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="border-2 border-white border-opacity-30 rounded-lg w-64 h-64 relative">
                      {/* Only the animated scanning line */}
                      <div className="absolute left-0 w-full h-0.5 bg-yellow-400 animate-bounce"></div>
                    </div>
                  </div>

                  {/* Scanning status */}
                  <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-75 text-white px-4 py-2 rounded-full">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                      Ready to scan
                    </div>
                  </div>
                </div>

                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-3">
                    Point your camera at a TRX wallet QR code
                  </p>
                  <Button
                    onClick={reset}
                    variant="outline"
                    className="w-full"
                  >
                    Stop Camera
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {error && (
          <Card>
            <CardContent className="p-4">
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <AlertCircle className="h-6 w-6 text-red-500 mx-auto mb-2" />
                <p className="text-red-600">{error}</p>
                <Button onClick={reset} className="mt-3" variant="outline">
                  Try Again
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {address && (
          <Card className="mb-20">
            <CardContent className="p-4">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-500 mx-auto mb-2" />
                <p className="text-green-600 font-medium">Address Found!</p>
                <div className="flex items-center justify-center gap-2 mt-1">
                  <span className="text-sm text-gray-600">{address.slice(0, 6)}...{address.slice(-6)}</span>
                  <Button size="icon" variant="ghost" onClick={() => {navigator.clipboard.writeText(address); toast({title: 'Copied!', description: 'Address copied to clipboard'});}}><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16h8M8 12h8m-8-4h8m2 4a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2z" /></svg></Button>
                </div>
                
                <div className="mt-3 space-x-2">
                  <Button type="button" onClick={useScannedAddress} size="sm">
                    Use Address
                  </Button>
                  <Button onClick={reset} variant="outline" size="sm">
                    Scan Again
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
} 
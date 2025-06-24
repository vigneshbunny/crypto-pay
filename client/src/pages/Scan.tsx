
import { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Camera, Upload, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import QrScanner from "qr-scanner";

export default function Scan() {
  const [, setLocation] = useLocation();
  const [manualAddress, setManualAddress] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [qrScanner, setQrScanner] = useState<QrScanner | null>(null);
  const [hasCamera, setHasCamera] = useState<boolean | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const { toast } = useToast();

  // Check camera availability on component mount
  useEffect(() => {
    const checkCamera = async () => {
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          setHasCamera(false);
          return;
        }
        
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(device => device.kind === 'videoinput');
        setHasCamera(videoDevices.length > 0);
      } catch (error) {
        console.error('Error checking camera:', error);
        setHasCamera(false);
      }
    };
    
    checkCamera();
  }, []);

  const startCamera = async () => {
    if (!videoRef.current) {
      toast({
        title: "Error",
        description: "Video element not ready",
        variant: "destructive",
      });
      return;
    }

    try {
      // Check if browser supports getUserMedia
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        toast({
          title: "Camera Not Supported",
          description: "Your browser doesn't support camera access. Try using the image upload option.",
          variant: "destructive",
        });
        return;
      }

      setIsScanning(true);

      const scanner = new QrScanner(
        videoRef.current,
        (result) => {
          console.log('QR Code detected:', result.data);
          handleQRCodeDetected(result.data);
        },
        {
          preferredCamera: 'environment',
          highlightScanRegion: true,
          highlightCodeOutline: true,
          maxScansPerSecond: 5,
        }
      );

      await scanner.start();
      setQrScanner(scanner);

      toast({
        title: "Camera started",
        description: "Point your camera at a QR code to scan",
      });
    } catch (error: any) {
      console.error('Error starting camera:', error);
      setIsScanning(false);
      
      let errorMessage = "Unable to access camera.";
      
      if (error.name === 'NotAllowedError') {
        errorMessage = "Camera permission denied. Please allow camera access and try again.";
      } else if (error.name === 'NotFoundError') {
        errorMessage = "No camera found on this device.";
      } else if (error.name === 'NotSupportedError') {
        errorMessage = "Camera not supported in this browser.";
      } else if (error.name === 'NotReadableError') {
        errorMessage = "Camera is already in use by another application.";
      }
      
      toast({
        title: "Camera Error",
        description: errorMessage + " Try using the image upload option instead.",
        variant: "destructive",
      });
    }
  };

  const stopCamera = () => {
    if (qrScanner) {
      qrScanner.stop();
      qrScanner.destroy();
      setQrScanner(null);
    }
    setIsScanning(false);
  };

  const handleQRCodeDetected = (data: string) => {
    console.log('Processing QR data:', data);
    
    // Stop scanning
    stopCamera();
    
    // Extract wallet address from QR code data
    let address = data;
    
    // Handle different QR code formats
    if (data.startsWith('tron:')) {
      address = data.replace('tron:', '');
    } else if (data.startsWith('TR') || data.startsWith('T')) {
      address = data;
    } else {
      // Try to extract TRON address from the data
      const tronMatch = data.match(/T[A-Za-z1-9]{33}/);
      if (tronMatch) {
        address = tronMatch[0];
      }
    }
    
    // Validate TRON address format
    if (address.length === 34 && (address.startsWith('T'))) {
      toast({
        title: "QR Code Scanned!",
        description: `Address: ${address.slice(0, 6)}...${address.slice(-6)}`,
      });
      
      // Navigate to send page with the scanned address
      setLocation(`/send?address=${encodeURIComponent(address)}`);
    } else {
      toast({
        title: "Invalid QR Code",
        description: "This doesn't appear to be a valid TRON wallet address.",
        variant: "destructive",
      });
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      try {
        const result = await QrScanner.scanImage(file);
        handleQRCodeDetected(result);
      } catch (error) {
        toast({
          title: "No QR Code Found",
          description: "Could not detect a QR code in the uploaded image.",
          variant: "destructive",
        });
      }
    }
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [qrScanner]);

  return (
    <div className="pb-20">
      <div className="flex items-center p-6 border-b border-gray-100">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => setLocation('/send')}
          className="mr-4 p-0"
        >
          <ArrowLeft className="h-6 w-6 text-gray-600" />
        </Button>
        <h1 className="text-xl font-bold text-gray-900">Scan QR Code</h1>
      </div>

      <div className="p-6">
        {/* QR Scanner */}
        <div className="bg-gray-100 rounded-2xl p-8 mb-6 text-center relative">
          {isScanning ? (
            <div className="relative">
              <video
                ref={videoRef}
                className="w-full h-64 bg-black rounded-xl object-cover"
                autoPlay
                playsInline
                muted
                style={{ transform: 'scaleX(-1)' }} // Mirror the video for better UX
              />
              <div className="absolute top-4 right-4">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={stopCamera}
                  className="rounded-full"
                >
                  <X size={16} />
                </Button>
              </div>
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
                <p className="text-white text-sm bg-black bg-opacity-50 px-3 py-1 rounded">
                  Point camera at QR code
                </p>
              </div>
              
              {/* Scanning overlay */}
              <div className="absolute inset-0 pointer-events-none">
                <div className="flex items-center justify-center h-full">
                  <div className="w-48 h-48 border-4 border-white rounded-2xl relative">
                    <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-blue-500 rounded-tl-xl"></div>
                    <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-blue-500 rounded-tr-xl"></div>
                    <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-blue-500 rounded-bl-xl"></div>
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-blue-500 rounded-br-xl"></div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="w-48 h-48 bg-gray-200 rounded-xl mx-auto mb-4 flex items-center justify-center">
                <Camera className="text-gray-400" size={64} />
              </div>
              <p className="text-gray-600 mb-4">Scan a QR code to get the wallet address</p>
              <p className="text-sm text-gray-500 mb-4">
                Camera access required for live scanning
              </p>
            </>
          )}

          {!isScanning && (
            <div className="flex flex-col sm:flex-row justify-center gap-3">
              <Button 
                variant="default" 
                onClick={startCamera} 
                className="flex-1 sm:flex-none"
                disabled={hasCamera === false}
              >
                <Camera className="mr-2" size={16} />
                {hasCamera === null ? "Checking Camera..." : hasCamera ? "Start Camera" : "Camera Not Available"}
              </Button>
              <Button variant="outline" className="relative overflow-hidden flex-1 sm:flex-none">
                <Upload className="mr-2" size={16} />
                Upload Image
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
              </Button>
            </div>
          )}
          
          {hasCamera === false && (
            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                Camera not available on this device. Use the "Upload Image" option to scan QR codes from your photo gallery.
              </p>
            </div>
          )}
        </div>

        {/* Recent Addresses */}
        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Recent Addresses</h3>
          <div className="space-y-2">
            <Card>
              <CardContent className="p-3">
                <p className="font-mono text-sm text-gray-800">TKzx...mg2Ax</p>
                <p className="text-xs text-gray-500">Last sent 2 days ago</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3">
                <p className="font-mono text-sm text-gray-800">TPuK...3xYz</p>
                <p className="text-xs text-gray-500">Last sent 1 week ago</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Manual Entry */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-700">Enter Address Manually</h3>
          <Input
            placeholder="Enter TRX address (e.g., TKzx...mg2Ax)"
            value={manualAddress}
            onChange={(e) => setManualAddress(e.target.value)}
            className="font-mono text-sm"
          />
          <Button 
            variant="default"
            onClick={() => setLocation(`/send?address=${encodeURIComponent(manualAddress)}`)}
            disabled={!manualAddress.trim()}
            className="w-full py-3 rounded-xl font-semibold"
          >
            Continue to Send
          </Button>
        </div>
      </div>
    </div>
  );
}

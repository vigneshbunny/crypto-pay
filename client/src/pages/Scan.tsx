
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
  const videoRef = useRef<HTMLVideoElement>(null);
  const { toast } = useToast();

  const startCamera = async () => {
    if (!videoRef.current) return;

    try {
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
        }
      );

      await scanner.start();
      setQrScanner(scanner);
      setIsScanning(true);

      toast({
        title: "Camera started",
        description: "Point your camera at a QR code to scan",
      });
    } catch (error) {
      console.error('Error starting camera:', error);
      toast({
        title: "Camera Error",
        description: "Unable to access camera. Please check permissions.",
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
  }, []);

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
            </div>
          ) : (
            <>
              <div className="w-48 h-48 bg-gray-200 rounded-xl mx-auto mb-4 flex items-center justify-center">
                <Camera className="text-gray-400" size={64} />
              </div>
              <p className="text-gray-600 mb-4">Position the QR code within the frame</p>
            </>
          )}

          {!isScanning && (
            <div className="flex justify-center gap-3">
              <Button variant="outline" onClick={startCamera}>
                <Camera className="mr-2" size={16} />
                Start Camera
              </Button>
              <Button variant="outline" className="relative overflow-hidden">
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

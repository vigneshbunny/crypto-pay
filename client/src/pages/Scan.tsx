import { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Camera, Upload, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Scan() {
  const [, setLocation] = useLocation();
  const [manualAddress, setManualAddress] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const { toast } = useToast();

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      setStream(mediaStream);
      setIsScanning(true);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play();
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      toast({
        title: "Camera Error",
        description: "Unable to access camera. Please check permissions.",
        variant: "destructive",
      });
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsScanning(false);
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // For now, show a message that this feature is coming soon
      toast({
        title: "Feature Coming Soon",
        description: "QR code image upload will be available in the next update.",
      });
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
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-48 h-48 border-2 border-white rounded-xl opacity-50"></div>
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
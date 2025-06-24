import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Camera } from "lucide-react";
import { useState } from "react";

export default function Scan() {
  const [, setLocation] = useLocation();
  const [manualAddress, setManualAddress] = useState("");

  return (
    <div className="pb-20">
      <div className="flex items-center p-6 border-b border-gray-100">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => setLocation('/dashboard')}
          className="mr-4 p-0"
        >
          <ArrowLeft className="h-6 w-6 text-gray-600" />
        </Button>
        <h1 className="text-xl font-bold text-gray-900">Scan QR Code</h1>
      </div>

      <div className="relative h-96 bg-black">
        {/* Camera viewfinder mockup */}
        <div className="w-full h-full bg-gray-900 flex items-center justify-center">
          <div className="text-white text-center">
            <p className="mb-2">Camera view would appear here</p>
            <p className="text-sm opacity-75">QR scanner functionality requires camera permissions</p>
          </div>
        </div>
        
        {/* Scan overlay */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-64 h-64 border-4 border-white rounded-2xl relative">
            <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-primary rounded-tl-xl"></div>
            <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-primary rounded-tr-xl"></div>
            <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-primary rounded-bl-xl"></div>
            <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-primary rounded-br-xl"></div>
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="text-center mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            Position QR code within the frame
          </h2>
          <p className="text-gray-600">Scan a TRX address or payment request</p>
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

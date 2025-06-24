import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import QRCodeDisplay from "@/components/QRCodeDisplay";
import { ArrowLeft, Copy, Share, Download, Info } from "lucide-react";

export default function Receive() {
  const [, setLocation] = useLocation();
  const { wallet } = useAuth();
  const { toast } = useToast();

  const copyToClipboard = async () => {
    if (wallet?.address) {
      await navigator.clipboard.writeText(wallet.address);
      toast({
        title: "Address copied!",
        description: "Wallet address has been copied to clipboard.",
      });
    }
  };

  const shareAddress = async () => {
    if (navigator.share && wallet?.address) {
      try {
        await navigator.share({
          title: 'My Wallet Address',
          text: `Send TRX or USDT to this address: ${wallet.address}`,
        });
      } catch (error) {
        copyToClipboard();
      }
    } else {
      copyToClipboard();
    }
  };

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
        <h1 className="text-xl font-bold text-gray-900">Receive Crypto</h1>
      </div>

      <div className="p-6">
        <div className="text-center mb-8">
          {/* QR Code Display */}
          <div className="w-64 h-64 mx-auto mb-6">
            <QRCodeDisplay value={wallet?.address || ''} size={256} />
          </div>
          
          <p className="text-sm text-gray-600 mb-4">
            Scan this QR code to receive TRX or USDT (TRC-20)
          </p>
        </div>

        {/* Wallet Address */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Your TRX Address
          </label>
          <Card className="bg-gray-50 border-2 border-dashed border-gray-300">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <p className="font-mono text-sm text-gray-800 break-all mr-2">
                  {wallet?.address || 'Loading...'}
                </p>
                <Button 
                  variant="ghost"
                  size="sm"
                  onClick={copyToClipboard}
                  className="flex-shrink-0 p-0"
                >
                  <Copy className="text-primary hover:text-blue-700 transition-colors" size={20} />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Important Notes */}
        <Card className="bg-yellow-50 border-yellow-200 mb-6">
          <CardContent className="p-4">
            <div className="flex items-start">
              <Info className="text-warning mr-3 mt-1 flex-shrink-0" size={16} />
              <div className="text-sm text-yellow-800">
                <p className="font-medium mb-2">Important Notes:</p>
                <ul className="space-y-1 list-disc list-inside">
                  <li>Only send TRX or USDT (TRC-20) to this address</li>
                  <li>Sending other cryptocurrencies may result in permanent loss</li>
                  <li>Minimum deposit amount: 1 TRX</li>
                  <li>Network confirmations required: 19 blocks</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Share Options */}
        <div className="space-y-3">
          <Button 
            variant="outline"
            onClick={shareAddress}
            className="w-full py-3 rounded-xl font-semibold"
          >
            <Share className="mr-2" size={16} />
            Share Address
          </Button>
          
          <Button 
            onClick={() => {
              // In a real app, this would trigger QR code download
              toast({
                title: "QR Code saved",
                description: "QR code has been saved to your downloads.",
              });
            }}
            className="w-full py-3 rounded-xl font-semibold"
          >
            <Download className="mr-2" size={16} />
            Save QR Code
          </Button>
        </div>
      </div>
    </div>
  );
}

import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useWallet } from "@/hooks/useWallet";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Copy, Download } from "lucide-react";
import QRCodeDisplay from "@/components/QRCodeDisplay";
import { useToast } from "@/hooks/use-toast";

export default function Receive() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { wallet } = useWallet(user?.id || 0);
  const { toast } = useToast();

  const copyToClipboard = async () => {
    if (wallet?.address) {
      try {
        await navigator.clipboard.writeText(wallet.address);
        toast({
          title: "Address Copied!",
          description: "Wallet address copied to clipboard",
        });
      } catch (err) {
        toast({
          title: "Copy Failed",
          description: "Failed to copy address to clipboard",
          variant: "destructive",
        });
      }
    }
  };

  const downloadQRCode = async () => {
    if (!wallet?.address) return;
    try {
      // Create a canvas with branding
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      canvas.width = 400;
      canvas.height = 500;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#000000';
      ctx.font = 'bold 24px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('CryptoWallet', canvas.width / 2, 40);
      ctx.font = '16px Arial';
      ctx.fillText('Your TRX Wallet Address', canvas.width / 2, 70);
      const QRCode = (await import('qrcode')).default;
      const qrDataURL = await QRCode.toDataURL(wallet.address, {
        width: 300,
        margin: 2,
        color: { dark: '#000000', light: '#ffffff' }
      });
      const qrImage = new Image();
      qrImage.src = qrDataURL;
      await new Promise((resolve) => { qrImage.onload = resolve; });
      ctx.drawImage(qrImage, 50, 90, 300, 300);
      ctx.font = '12px monospace';
      ctx.fillText('Address:', canvas.width / 2, 420);
      ctx.fillText(wallet.address, canvas.width / 2, 440);
      ctx.font = '10px Arial';
      ctx.fillStyle = '#666666';
      ctx.fillText('Scan this QR code to get the wallet address', canvas.width / 2, 470);
      const link = document.createElement('a');
      link.download = `cryptowallet-qr-${wallet.address.slice(0, 8)}.png`;
      link.href = canvas.toDataURL();
      link.click();
      toast({
        title: "QR Code Downloaded!",
        description: "QR code with branding saved to your device",
      });
    } catch (error) {
      console.error('Download error:', error);
      toast({
        title: "Download Failed",
        description: "Failed to download QR code",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
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
          <h1 className="text-lg font-semibold">Receive</h1>
          <div className="w-10"></div>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 pt-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-center space-y-6">
              {/* QR Code Display */}
              <div className="flex justify-center">
                {wallet?.address ? (
                  <QRCodeDisplay value={wallet.address} size={300} />
                ) : (
                  <div className="text-gray-500">No wallet address available</div>
                )}
              </div>
              {/* QR Title */}
              <div className="text-lg font-semibold text-gray-800">TRX Wallet QR</div>
              {/* Wallet Address */}
              {wallet?.address && (
                <div className="mt-2">
                  <p className="font-mono text-base text-gray-700 break-all">{wallet.address}</p>
                </div>
              )}
              {/* Action Buttons */}
              {wallet?.address && (
                <div className="flex space-x-3 mt-4 justify-center">
                  <Button onClick={copyToClipboard} className="flex-1 max-w-xs">
                    <Copy className="w-4 h-4 mr-2" />Copy
                  </Button>
                  <Button onClick={downloadQRCode} variant="outline" className="flex-1 max-w-xs">
                    <Download className="w-4 h-4 mr-2" />Download Image
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        {/* Precautions - now outside the Card */}
        <div className="mt-6 mb-24 bg-yellow-50 border border-yellow-200 rounded p-4 text-left text-yellow-800 text-sm space-y-2">
          <div><b>Precaution:</b> This QR is for <b>TRX only</b>. Only send TRX to this address. Sending other coins may result in loss.</div>
          <div>When sending, always select <b>TRX</b> as the token.</div>
        </div>
      </div>
    </div>
  );
}

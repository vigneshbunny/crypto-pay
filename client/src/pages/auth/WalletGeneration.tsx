import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Settings } from "lucide-react";

export default function WalletGeneration() {
  const [, setLocation] = useLocation();
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        const newProgress = prev + Math.random() * 15;
        if (newProgress >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            setLocation('/dashboard');
          }, 1000);
          return 100;
        }
        return newProgress;
      });
    }, 200);

    return () => clearInterval(interval);
  }, [setLocation]);

  return (
    <div className="p-6 pt-12">
      <div className="text-center">
        <div className="w-24 h-24 bg-gradient-to-br from-primary to-blue-600 rounded-full mx-auto mb-6 flex items-center justify-center">
          <Settings className="text-white text-3xl animate-spin" size={48} />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-3">Generating Your Wallet</h2>
        <p className="text-gray-600 mb-6">Creating secure TRX wallet address...</p>
        
        <div className="bg-gray-200 rounded-full h-2 mb-4">
          <div 
            className="bg-primary h-2 rounded-full transition-all duration-300" 
            style={{ width: `${progress}%` }}
          />
        </div>
        
        <div className="text-sm text-gray-500 space-y-1">
          <p>• Generating cryptographic keys</p>
          <p>• Creating wallet address</p>
          <p>• Securing private keys</p>
        </div>
      </div>
    </div>
  );
}

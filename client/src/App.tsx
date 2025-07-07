import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useWallet } from "@/hooks/useWallet";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState } from "react";
import { TooltipProvider } from "@/components/ui/tooltip";
import BottomNavigation from "@/components/BottomNavigation";
import { ShimmerSkeleton } from "@/components/ui/skeleton";
import { queryClient } from "@/lib/queryClient";

// Pages
import Login from "@/pages/auth/Login";
import Register from "@/pages/auth/Register";
import WalletGeneration from "@/pages/auth/WalletGeneration";
import Dashboard from "@/pages/Dashboard";
import Send from "@/pages/Send";
import Receive from "@/pages/Receive";
import Scan from "@/pages/Scan";
import History from "@/pages/History";
import Settings from "@/pages/Settings";
import NotFound from "@/pages/not-found";

function AppContent() {
  const [location] = useLocation();
  const { user, isLoading: authLoading } = useAuth();
  const { walletLoading } = useWallet(user?.id || 0);
  const { toast } = useToast();
  const [isNavigating, setIsNavigating] = useState(false);

  // Show loading during navigation
  useEffect(() => {
    setIsNavigating(true);
    const timer = setTimeout(() => setIsNavigating(false), 300);
    return () => clearTimeout(timer);
  }, [location]);

  // Show loading states
  if (authLoading || isNavigating) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="p-6 space-y-6">
          <div className="space-y-4">
            <ShimmerSkeleton className="h-8 w-48" />
            <ShimmerSkeleton className="h-4 w-32" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <ShimmerSkeleton className="h-32 rounded-xl" />
            <ShimmerSkeleton className="h-32 rounded-xl" />
          </div>
          <div className="space-y-3">
            <ShimmerSkeleton className="h-5 w-24" />
            <div className="grid grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="text-center space-y-2">
                  <ShimmerSkeleton className="h-12 w-12 rounded-full mx-auto" />
                  <ShimmerSkeleton className="h-3 w-12 mx-auto" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Auth pages
  if (!user) {
    switch (location) {
      case "/login":
        return <Login />;
      case "/register":
        return <Register />;
      case "/wallet-generation":
        return <WalletGeneration />;
      default:
        return <Login />;
    }
  }

  // Main app pages
  const renderPage = () => {
    switch (location) {
      case "/dashboard":
        return <Dashboard />;
      case "/send":
        return <Send />;
      case "/receive":
        return <Receive />;
      case "/scan":
        return <Scan />;
      case "/history":
        return <History />;
      case "/settings":
        return <Settings />;
      default:
        return <NotFound />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {renderPage()}
      <BottomNavigation />
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AppContent />
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

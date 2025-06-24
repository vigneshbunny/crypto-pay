import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import Login from "@/pages/auth/Login";
import Register from "@/pages/auth/Register";
import WalletGeneration from "@/pages/auth/WalletGeneration";
import Dashboard from "@/pages/Dashboard";
import Send from "@/pages/Send";
import Receive from "@/pages/Receive";
import History from "@/pages/History";
import Scan from "@/pages/Scan";
import Settings from "@/pages/Settings";
import BottomNavigation from "@/components/BottomNavigation";
import NotFound from "@/pages/not-found";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto bg-white min-h-screen relative">
      <Switch>
        {!isAuthenticated ? (
          <>
            <Route path="/" component={Login} />
            <Route path="/login" component={Login} />
            <Route path="/register" component={Register} />
            <Route path="/wallet-generation" component={WalletGeneration} />
          </>
        ) : (
          <>
            <Route path="/" component={Dashboard} />
            <Route path="/dashboard" component={Dashboard} />
            <Route path="/send" component={Send} />
            <Route path="/receive" component={Receive} />
            <Route path="/history" component={History} />
            <Route path="/scan" component={Scan} />
            <Route path="/settings" component={Settings} />
          </>
        )}
        <Route component={NotFound} />
      </Switch>
      
      {isAuthenticated && <BottomNavigation />}
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;

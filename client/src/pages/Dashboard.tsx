import { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useWallet } from "@/hooks/useWallet";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Bell, 
  Settings as SettingsIcon, 
  ArrowUp, 
  ArrowDown, 
  QrCode,
  TrendingUp,
  Send,
  Download,
  History,
  RefreshCw,
  TrendingDown
} from "lucide-react";
import { 
  DashboardSkeleton, 
  BalanceSkeleton, 
  TransactionSkeleton,
  ShimmerSkeleton 
} from "@/components/ui/skeleton";

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const { 
    wallet, 
    walletLoading, 
    transactions, 
    transactionsLoading, 
    updateBalances, 
    updateBalancesLoading, 
    refetchTransactions,
    refetchWallet 
  } = useWallet(user?.id || 0);

  // Pull to refresh state
  const [isPulling, setIsPulling] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const touchStartY = useRef(0);
  const currentY = useRef(0);
  const isRefreshing = useRef(false);

  const [trxUsd, setTrxUsd] = useState<number | null>(null);
  const [priceLoading, setPriceLoading] = useState(true);

  const updateBalancesMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/wallet/${user?.id}/update-balances`, {
        method: 'POST',
      });
      return res.json();
    },
    onSuccess: () => {
      refetchTransactions();
    },
  });

  // Pull to refresh functionality
  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      if (window.scrollY === 0) {
        touchStartY.current = e.touches[0].clientY;
        currentY.current = e.touches[0].clientY;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (window.scrollY === 0 && !isRefreshing.current) {
        currentY.current = e.touches[0].clientY;
        const distance = Math.max(0, currentY.current - touchStartY.current);
        
        if (distance > 0) {
          e.preventDefault();
          setPullDistance(distance);
          setIsPulling(distance > 50);
        }
      }
    };

    const handleTouchEnd = async () => {
      if (isPulling && !isRefreshing.current) {
        isRefreshing.current = true;
        setIsPulling(false);
        setPullDistance(0);
        // Trigger refresh
        if (updateBalancesMutation) {
          await updateBalancesMutation.mutateAsync();
        }
        if (refetchWallet) {
          await refetchWallet();
        }
        if (refetchTransactions) {
          await refetchTransactions();
        }
        setTimeout(() => {
          isRefreshing.current = false;
        }, 1000);
      } else {
        setIsPulling(false);
        setPullDistance(0);
      }
    };

    document.addEventListener('touchstart', handleTouchStart, { passive: false });
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd);

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isPulling, updateBalancesMutation, refetchWallet, refetchTransactions]);

  useEffect(() => {
    async function fetchTrxPrice() {
      setPriceLoading(true);
      try {
        const res = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=tron&vs_currencies=usd");
        const data = await res.json();
        setTrxUsd(data.tron.usd);
      } catch (e) {
        setTrxUsd(0.28); // fallback
      } finally {
        setPriceLoading(false);
      }
    }
    fetchTrxPrice();
  }, []);

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-6)}`;
  };

  const formatAmount = (amount: string) => {
    const num = parseFloat(amount);
    return num.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 6,
    });
  };

  const getTotalValue = () => {
    if (!wallet) return 0;
    const TRX_TO_USD = trxUsd ?? 0.28;
    const trxValue = parseFloat(wallet.balances.TRX || '0') * TRX_TO_USD;
    const usdtValue = parseFloat(wallet.balances.USDT || '0'); // USDT is 1:1 USD
    return trxValue + usdtValue;
  };

  // Show skeleton when auth is loading or user is not authenticated
  if (authLoading || !isAuthenticated || !user) {
    return <DashboardSkeleton />;
  }

  // Show skeleton only when wallet is completely loading and no data available
  if (walletLoading && !wallet) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="pb-20">
      {/* Pull to refresh indicator */}
      {isPulling && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-white text-black p-4 text-center border-b border-gray-200">
          <RefreshCw className="w-5 h-5 mx-auto animate-spin text-black" />
          <p className="text-sm mt-1">Pull to refresh...</p>
        </div>
      )}

      {/* Header */}
      <div className="bg-gray-50 p-6 pt-12">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-semibold text-black">Welcome</h1>
            <p className="text-black opacity-90">{user?.email?.split('@')[0] || 'User'}</p>
          </div>
          <div className="flex space-x-3">
            <Button 
              variant="ghost" 
              size="sm" 
              className="w-10 h-10 bg-gray-200 bg-opacity-50 rounded-full p-0"
            >
              <Bell className="text-lg text-black" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setLocation('/settings')}
              className="w-10 h-10 bg-gray-200 bg-opacity-50 rounded-full p-0"
            >
              <SettingsIcon className="text-lg text-black" />
            </Button>
          </div>
        </div>

        {/* Total Balance Card */}
        <Card className="bg-white border border-gray-200 shadow-none rounded-xl">
          <CardContent className="p-5">
            <p className="text-sm text-black opacity-90 mb-1">Total Portfolio Value</p>
            <div className="flex items-end space-x-3">
              <span className="text-3xl font-bold text-black">
                ${getTotalValue().toFixed(2)}
              </span>
              <span className="text-green-600 bg-green-100 px-2 py-1 rounded text-xs font-medium flex items-center">
                <TrendingUp size={12} className="mr-1" />
                +5.67%
              </span>
            </div>
            <p className="text-xs text-black opacity-75 mt-1">Last 24 hours</p>

            {/* Display wallet address */}
            {wallet?.address && (
              <div className="mt-3 pt-3 border-t border-gray-200">
                <p className="text-xs text-black opacity-75 mb-1">Your TRX Address</p>
                <div className="font-mono text-sm bg-gray-100 px-3 py-2 rounded-lg text-black">
                  {formatAddress(wallet.address)}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="px-6 mt-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-3 gap-4">
              <Button 
                variant="ghost" 
                onClick={() => setLocation('/send')}
                className="flex flex-col items-center p-3 h-auto hover:bg-gray-50"
              >
                <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mb-2">
                  <Send className="text-red-500 text-lg" />
                </div>
                <span className="text-sm font-medium text-gray-700">Send</span>
              </Button>

              <Button 
                variant="ghost" 
                onClick={() => setLocation('/receive')}
                className="flex flex-col items-center p-3 h-auto hover:bg-gray-50"
              >
                <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center mb-2">
                  <Download className="text-green-500 text-lg" />
                </div>
                <span className="text-sm font-medium text-gray-700">Receive</span>
              </Button>

              <Button 
                variant="ghost" 
                onClick={() => setLocation('/scan')}
                className="flex flex-col items-center p-3 h-auto hover:bg-gray-50"
              >
                <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center mb-2">
                  <QrCode className="text-primary text-lg" />
                </div>
                <span className="text-sm font-medium text-gray-700">Scan</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Assets */}
      <div className="px-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Your Assets</h2>
          <div className="flex space-x-2">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={async () => {
                await updateBalancesMutation.mutateAsync();
                if (refetchWallet) await refetchWallet();
                if (refetchTransactions) await refetchTransactions();
              }}
              disabled={updateBalancesMutation.isPending}
              className="text-primary text-sm font-medium"
            >
              {updateBalancesMutation.isPending ? "Refreshing..." : "Refresh"}
            </Button>
          </div>
        </div>

        {/* TRX Asset */}
        <Card className="mb-3">
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center mr-4">
                <span className="text-white font-bold text-lg">T</span>
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900">TRON</h3>
                    <p className="text-sm text-gray-500">TRX</p>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-gray-900">
                      {walletLoading ? (
                        <ShimmerSkeleton className="h-6 w-20" />
                      ) : (
                        formatAmount(wallet?.balances.TRX || '0')
                      )}
                    </div>
                    <div className="text-sm text-gray-500">
                      {walletLoading || priceLoading ? (
                        <ShimmerSkeleton className="h-4 w-16" />
                      ) : (
                        (parseFloat(wallet?.balances.TRX || '0') * (trxUsd ?? 0.28)).toFixed(2)
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* USDT Asset */}
        <Card className="mb-3">
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mr-4">
                <span className="text-white font-bold text-lg">U</span>
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900">Tether USD</h3>
                    <p className="text-sm text-gray-500">USDT</p>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-gray-900">
                      {walletLoading ? (
                        <ShimmerSkeleton className="h-6 w-20" />
                      ) : (
                        formatAmount(wallet?.balances.USDT || '0')
                      )}
                    </div>
                    <div className="text-sm text-gray-500">
                      ${walletLoading ? (
                        <ShimmerSkeleton className="h-4 w-16" />
                      ) : (
                        parseFloat(wallet?.balances.USDT || '0').toFixed(2)
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions */}
      <div className="px-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Recent Transactions</h2>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setLocation('/history')}
            className="text-primary text-sm font-medium"
          >
            View All
          </Button>
        </div>

        {transactions.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <History className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No transactions yet</p>
              <p className="text-sm text-gray-400 mt-1">Your transaction history will appear here</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {transactions.slice(0, 3).map((transaction) => (
              <Card key={transaction.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        transaction.type === 'send' ? 'bg-red-100' : 'bg-green-100'
                      }`}>
                        {transaction.type === 'send' ? (
                          <ArrowUp className="h-5 w-5 text-red-500" />
                        ) : (
                          <ArrowDown className="h-5 w-5 text-green-500" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 capitalize">
                          {transaction.type} {transaction.tokenType}
                        </p>
                        <div className="text-sm text-gray-500">
                          {formatAddress(transaction.toAddress)}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-semibold ${
                        transaction.type === 'send' ? 'text-red-600' : 'text-green-600'
                      }`}>
                        {transaction.type === 'send' ? '-' : '+'}{formatAmount(transaction.amount)} {transaction.tokenType}
                      </p>
                      <p className="text-sm text-gray-500">
                        {new Date(transaction.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useWallet } from "@/hooks/useWallet";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Bell, 
  Settings as SettingsIcon, 
  ArrowUp, 
  ArrowDown, 
  QrCode,
  TrendingUp
} from "lucide-react";

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { wallet, updateBalances, updateBalancesLoading, transactions } = useWallet(user?.id || 0);

  useEffect(() => {
    if (user?.id) {
      updateBalances();
    }
  }, [user?.id]);

  const trxBalance = parseFloat(wallet?.balances?.TRX || '0');
  const usdtBalance = parseFloat(wallet?.balances?.USDT || '0');
  
  // Mock USD conversion rates (in production, fetch from price API)
  const trxUsdRate = 0.79;
  const totalValueUsd = (trxBalance * trxUsdRate) + usdtBalance;

  const recentTransactions = transactions.slice(0, 3);

  return (
    <div className="pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-blue-600 p-6 pt-12 text-white">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-semibold">Good Morning</h1>
            <p className="opacity-90">{user?.email?.split('@')[0] || 'User'}</p>
          </div>
          <div className="flex space-x-3">
            <Button 
              variant="ghost" 
              size="sm" 
              className="w-10 h-10 bg-white bg-opacity-20 rounded-full p-0"
            >
              <Bell className="text-lg" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setLocation('/settings')}
              className="w-10 h-10 bg-white bg-opacity-20 rounded-full p-0"
            >
              <SettingsIcon className="text-lg" />
            </Button>
          </div>
        </div>

        {/* Total Balance Card */}
        <Card className="bg-white bg-opacity-10 backdrop-blur border-0">
          <CardContent className="p-5">
            <p className="text-sm opacity-90 mb-1">Total Portfolio Value</p>
            <div className="flex items-end space-x-3">
              <span className="text-3xl font-bold">
                ${totalValueUsd.toFixed(2)}
              </span>
              <span className="text-green-300 bg-green-500 bg-opacity-20 px-2 py-1 rounded text-xs font-medium flex items-center">
                <TrendingUp size={12} className="mr-1" />
                +5.67%
              </span>
            </div>
            <p className="text-xs opacity-75 mt-1">Last 24 hours</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="px-6 -mt-8 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-3 gap-4">
              <Button 
                variant="ghost" 
                onClick={() => setLocation('/send')}
                className="flex flex-col items-center p-3 h-auto hover:bg-gray-50"
              >
                <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mb-2">
                  <ArrowUp className="text-red-500 text-lg" />
                </div>
                <span className="text-sm font-medium text-gray-700">Send</span>
              </Button>
              
              <Button 
                variant="ghost" 
                onClick={() => setLocation('/receive')}
                className="flex flex-col items-center p-3 h-auto hover:bg-gray-50"
              >
                <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center mb-2">
                  <ArrowDown className="text-green-500 text-lg" />
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
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => updateBalances()}
            disabled={updateBalancesLoading}
            className="text-primary text-sm font-medium"
          >
            {updateBalancesLoading ? "Refreshing..." : "Refresh"}
          </Button>
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
                    <p className="font-semibold text-gray-900">
                      {trxBalance.toFixed(2)} TRX
                    </p>
                    <p className="text-sm text-gray-500">
                      ${(trxBalance * trxUsdRate).toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* USDT Asset */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mr-4">
                <span className="text-white font-bold text-sm">USDT</span>
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900">Tether USD</h3>
                    <p className="text-sm text-gray-500">USDT (TRC-20)</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">
                      {usdtBalance.toFixed(2)} USDT
                    </p>
                    <p className="text-sm text-gray-500">
                      ${usdtBalance.toFixed(2)}
                    </p>
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

        {recentTransactions.length > 0 ? (
          <Card>
            <CardContent className="p-0 divide-y divide-gray-100">
              {recentTransactions.map((transaction) => (
                <div key={transaction.id} className="p-4 flex items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-3 ${
                    transaction.type === 'receive' 
                      ? 'bg-green-50' 
                      : 'bg-red-50'
                  }`}>
                    {transaction.type === 'receive' ? (
                      <ArrowDown className="text-green-500" size={16} />
                    ) : (
                      <ArrowUp className="text-red-500" size={16} />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">
                          {transaction.type === 'receive' ? 'Received' : 'Sent'} {transaction.tokenType}
                        </p>
                        <p className="text-sm text-gray-500">
                          {new Date(transaction.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className={`font-semibold ${
                          transaction.type === 'receive' ? 'text-green-500' : 'text-red-500'
                        }`}>
                          {transaction.type === 'receive' ? '+' : '-'}
                          {parseFloat(transaction.amount).toFixed(2)} {transaction.tokenType}
                        </p>
                        <p className="text-xs text-gray-500 capitalize">
                          {transaction.status}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-gray-500">No transactions yet</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

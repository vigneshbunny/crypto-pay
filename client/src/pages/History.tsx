import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useWallet } from "@/hooks/useWallet";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import TransactionItem from "@/components/TransactionItem";
import { ArrowLeft } from "lucide-react";

type FilterType = 'all' | 'sent' | 'received';

export default function History() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { transactions, transactionsLoading } = useWallet(user?.id || 0);
  const [filter, setFilter] = useState<FilterType>('all');

  const filteredTransactions = transactions.filter(tx => {
    if (filter === 'all') return true;
    return tx.type === filter.slice(0, -2); // 'sent' -> 'send', 'received' -> 'receive'
  });

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
        <h1 className="text-xl font-bold text-gray-900">Transaction History</h1>
      </div>

      {/* Filter Tabs */}
      <div className="px-6 py-4 border-b border-gray-100">
        <div className="flex space-x-4">
          {[
            { key: 'all', label: 'All' },
            { key: 'sent', label: 'Sent' },
            { key: 'received', label: 'Received' },
          ].map((tab) => (
            <Button
              key={tab.key}
              variant={filter === tab.key ? "default" : "secondary"}
              size="sm"
              onClick={() => setFilter(tab.key as FilterType)}
              className="px-4 py-2 rounded-full text-sm font-medium"
            >
              {tab.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Transactions List */}
      <div className="px-6 py-4">
        {transactionsLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                    </div>
                    <div className="space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-20"></div>
                      <div className="h-3 bg-gray-200 rounded w-16"></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredTransactions.length > 0 ? (
          <div className="space-y-4">
            {filteredTransactions.map((transaction) => (
              <TransactionItem key={transaction.id} transaction={transaction} />
            ))}
            
            {/* Load More */}
            <div className="mt-6 text-center">
              <Button variant="ghost" className="text-primary font-medium">
                Load More Transactions
              </Button>
            </div>
          </div>
        ) : (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-gray-500">
                {filter === 'all' 
                  ? 'No transactions yet' 
                  : `No ${filter} transactions`
                }
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

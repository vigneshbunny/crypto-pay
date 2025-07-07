import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useWallet } from "@/hooks/useWallet";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Plus, Send, Download, Clock, CheckCircle, XCircle, RefreshCw, TrendingUp, TrendingDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import TransactionItem from "@/components/TransactionItem";
import { TransactionSkeleton, ShimmerSkeleton } from "@/components/ui/skeleton";

const recordTransactionSchema = z.object({
  txHash: z.string().min(1, "Transaction hash is required"),
  fromAddress: z.string().min(1, "From address is required"),
  amount: z.string().refine((val) => {
    const num = parseFloat(val);
    return !isNaN(num) && num > 0;
  }, "Amount must be greater than 0"),
  tokenType: z.enum(['TRX', 'USDT']),
});

export default function History() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { 
    transactions, 
    transactionsLoading, 
    refetchTransactions 
  } = useWallet(user?.id || 0);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const form = useForm({
    resolver: zodResolver(recordTransactionSchema),
    defaultValues: {
      txHash: '',
      fromAddress: '',
      amount: '',
      tokenType: 'TRX' as 'TRX' | 'USDT',
    },
  });

  const recordTransactionMutation = useMutation({
    mutationFn: async (data: z.infer<typeof recordTransactionSchema>) => {
      const res = await apiRequest('POST', '/api/transactions/receive-manual', {
        userId: user?.id,
        ...data,
      });
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Transaction recorded!",
        description: "The received transaction has been added to your history.",
      });
      setIsDialogOpen(false);
      form.reset();
      refetchTransactions();
    },
    onError: (error: any) => {
      toast({
        title: "Failed to record transaction",
        description: error.message || "Please check the transaction details and try again.",
        variant: "destructive",
      });
    },
  });

  const detectTransactionsMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', `/api/wallet/${user?.id}/detect-transactions`);
      return res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Transaction detection completed!",
        description: data.message || "Checked for new received transactions.",
      });
      refetchTransactions();
    },
    onError: (error: any) => {
      toast({
        title: "Failed to detect transactions",
        description: error.message || "Could not check for new transactions.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: z.infer<typeof recordTransactionSchema>) => {
    recordTransactionMutation.mutate(data);
  };

  const formatAmount = (amount: string) => {
    const num = parseFloat(amount);
    return num.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 6,
    });
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-6)}`;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'text-green-600 bg-green-50';
      case 'pending':
        return 'text-yellow-600 bg-yellow-50';
      case 'failed':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation('/dashboard')}
              className="p-2"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Transaction History</h1>
              <p className="text-sm text-gray-600">View all your transactions</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => detectTransactionsMutation.mutate()}
            disabled={detectTransactionsMutation.isPending}
            className="p-2"
          >
            <RefreshCw className={`h-5 w-5 ${detectTransactionsMutation.isPending ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      <div className="p-6">
        {transactionsLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <TransactionSkeleton key={i} />
            ))}
          </div>
        ) : transactions && transactions.length > 0 ? (
          <div className="space-y-4">
            {transactions.map((transaction) => (
              <Card key={transaction.id} className="overflow-hidden">
                <CardContent className="p-0">
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          transaction.type === 'send' ? 'bg-red-100' : 'bg-green-100'
                        }`}>
                          {transaction.type === 'send' ? (
                            <TrendingDown className="h-5 w-5 text-red-600" />
                          ) : (
                            <TrendingUp className="h-5 w-5 text-green-600" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 capitalize">
                            {transaction.type} {transaction.tokenType}
                          </p>
                          <div className="text-sm text-gray-500">
                            {new Date(transaction.createdAt).toLocaleString()}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-semibold text-lg ${
                          transaction.type === 'send' ? 'text-red-600' : 'text-green-600'
                        }`}>
                          {transaction.type === 'send' ? '-' : '+'}
                          {formatAmount(transaction.amount)} {transaction.tokenType}
                        </p>
                        <div className="flex items-center justify-end space-x-1 mt-1">
                          {getStatusIcon(transaction.status)}
                          <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(transaction.status)}`}>
                            {transaction.status}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Transaction Details */}
                    <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-500 mb-1">From</p>
                          <p className="font-mono text-gray-900">
                            {formatAddress(transaction.fromAddress)}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500 mb-1">To</p>
                          <p className="font-mono text-gray-900">
                            {formatAddress(transaction.toAddress)}
                          </p>
                        </div>
                      </div>
                      
                      <div className="border-t border-gray-200 pt-3">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-gray-500 mb-1">Transaction Hash</p>
                            <p className="font-mono text-gray-900 text-xs break-all">
                              {transaction.txHash}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-500 mb-1">Confirmations</p>
                            <p className="text-gray-900">
                              {transaction.confirmations}/19
                            </p>
                          </div>
                        </div>
                      </div>

                      {transaction.gasUsed && transaction.gasPrice && (
                        <div className="border-t border-gray-200 pt-3">
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <p className="text-gray-500 mb-1">Gas Used</p>
                              <p className="text-gray-900">
                                {parseInt(transaction.gasUsed).toLocaleString()}
                              </p>
                            </div>
                            <div>
                              <p className="text-gray-500 mb-1">Gas Price</p>
                              <p className="text-gray-900">
                                {parseFloat(transaction.gasPrice).toFixed(2)} TRX
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-12 text-center">
              <div className="space-y-4">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
                  <TrendingUp className="h-8 w-8 text-gray-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    No transactions yet
                  </h3>
                  <p className="text-gray-500 mb-6">
                    Your transaction history will appear here once you make your first transaction.
                  </p>
                  <div className="space-y-3">
                    <Button
                      onClick={() => setLocation('/send')}
                      className="w-full"
                    >
                      Send Crypto
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setLocation('/receive')}
                      className="w-full"
                    >
                      Receive Crypto
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

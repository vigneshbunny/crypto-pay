import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useWallet } from "@/hooks/useWallet";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Send as SendIcon, QrCode, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { InputSkeleton, ButtonSkeleton, ShimmerSkeleton } from "@/components/ui/skeleton";

export default function Send() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const { wallet, walletLoading, transactions } = useWallet(user?.id || 0);
  const queryClient = useQueryClient();

  const [recipientAddress, setRecipientAddress] = useState("");
  const [amount, setAmount] = useState("");
  const [tokenType, setTokenType] = useState("TRX");
  const [gasFee, setGasFee] = useState("1.1");
  const [gasFeeLoading, setGasFeeLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const addressProcessedRef = useRef(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const optimisticPrevWalletRef = useRef<any>(null);
  const [pendingSends, setPendingSends] = useState<{ amount: number; tokenType: string }[]>([]);

  // On mount, always check for scannedAddress in sessionStorage and set it if present (do NOT remove it automatically)
  useEffect(() => {
    const scannedAddress = sessionStorage.getItem("scannedAddress");
    if (scannedAddress && !recipientAddress) {
      setRecipientAddress(scannedAddress);
      toast({
        title: "Address loaded!",
        description: "Scanned address has been added to the recipient field",
      });
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, []);

  // Remove confirmed/failed pending sends on wallet/transaction update
  useEffect(() => {
    if (!transactions) return;
    setPendingSends((prev) => prev.filter(pending => {
      // If there is a matching pending send that is now confirmed or failed, remove it
      const stillPending = transactions.some(tx =>
        tx.type === 'send' &&
        tx.tokenType === pending.tokenType &&
        parseFloat(tx.amount) === pending.amount &&
        tx.status === 'pending'
      );
      return stillPending;
    }));
  }, [transactions]);

  const sendTransactionMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/transactions/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user?.id,
          recipientAddress,
          amount,
          tokenType,
        }),
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to send transaction');
      }
      
      return res.json();
    },
    onMutate: async () => {
      // No optimistic update here anymore
    },
    onSuccess: () => {
      toast({
        title: "Transaction sent!",
        description: "Your transaction has been submitted successfully.",
      });
      setLocation('/history');
      // After a successful send, clear the scanned address from sessionStorage
      sessionStorage.removeItem("scannedAddress");
    },
    onError: (error: Error) => {
      // Revert optimistic update
      const prevWallet = optimisticPrevWalletRef.current;
      if (prevWallet) queryClient.setQueryData([`/api/wallet/${user?.id}`], prevWallet);
      toast({
        title: "Transaction failed",
        description: error.message || "Failed to send transaction",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    const getGasFee = async () => {
      setIsSubmitting(true);
      setGasFeeLoading(true);
      try {
        const res = await fetch(`/api/gas-fee/${tokenType}`);
        const data = await res.json();
        setGasFee(data.gasFee);
      } catch (error) {
        console.error('Error fetching gas fee:', error);
        setGasFee("0");
      } finally {
        setIsSubmitting(false);
        setGasFeeLoading(false);
      }
    };

    if (tokenType) {
      getGasFee();
    }
  }, [tokenType]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!recipientAddress.trim()) {
      toast({
        title: "Invalid address",
        description: "Please enter a valid recipient address",
        variant: "destructive",
      });
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      toast({
        title: "Invalid amount",
        description: "Please enter a valid amount",
        variant: "destructive",
      });
      return;
    }

    const available = tokenType === 'TRX' 
      ? parseFloat(wallet?.balances.TRX || '0')
      : parseFloat(wallet?.balances.USDT || '0');
    if (parseFloat(amount) > available) {
      toast({
        title: "Insufficient balance",
        description: `You do not have enough ${tokenType} to send this amount.`,
        variant: "destructive",
      });
      return;
    }

    // Add to pendingSends immediately
    setPendingSends((prev) => [...prev, { amount: parseFloat(amount), tokenType }]);

    // Optimistically update balance instantly
    const prevWallet = queryClient.getQueryData([`/api/wallet/${user?.id}`]);
    let newWallet = prevWallet ? JSON.parse(JSON.stringify(prevWallet)) : null;
    const amt = parseFloat(amount);
    if (newWallet && newWallet.balances) {
      if (tokenType === 'TRX') {
        // Use proper decimal arithmetic to avoid floating-point errors
        const newBalance = Math.round((parseFloat(newWallet.balances.TRX) - amt) * 1000000) / 1000000;
        newWallet.balances.TRX = newBalance.toString();
      } else if (tokenType === 'USDT') {
        // Use proper decimal arithmetic to avoid floating-point errors
        const newBalance = Math.round((parseFloat(newWallet.balances.USDT) - amt) * 1000000) / 1000000;
        newWallet.balances.USDT = newBalance.toString();
      }
      queryClient.setQueryData([`/api/wallet/${user?.id}`], newWallet);
    }
    optimisticPrevWalletRef.current = prevWallet;

    // After a successful send, clear the scanned address from sessionStorage
    sessionStorage.removeItem("scannedAddress");
    sendTransactionMutation.mutate();
  };

  // Also clear scannedAddress if the user manually changes the recipient field
  const handleRecipientChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setRecipientAddress(newValue);
    
    // Only clear session storage if there was a scanned address and user is typing
    const scannedAddress = sessionStorage.getItem("scannedAddress");
    if (scannedAddress && newValue !== scannedAddress) {
      sessionStorage.removeItem("scannedAddress");
    }
  };

  const formatAmount = (amount: string) => {
    const num = parseFloat(amount);
    if (isNaN(num)) return '0.00';
    
    // For whole numbers, don't add unnecessary decimals
    if (Number.isInteger(num)) {
      return num.toLocaleString('en-US');
    }
    
    return num.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 6,
    });
  };

  const formatAmountForDisplay = (amount: string) => {
    const num = parseFloat(amount);
    if (isNaN(num)) return '0.00';
    
    // For display purposes, show up to 6 decimal places but trim trailing zeros
    const formatted = num.toFixed(6).replace(/\.?0+$/, '');
    return formatted === '' ? '0' : formatted;
  };

  const formatGasFee = (fee: string, tokenType: string) => {
    if (tokenType === 'USDT' && fee.includes('~')) {
      return fee; // Already in range format
    }
    return fee;
  };

  const getDisplayedBalance = () => {
    if (!wallet) return 0;
    let base = tokenType === 'TRX'
      ? parseFloat(wallet.balances.TRX || '0')
      : parseFloat(wallet.balances.USDT || '0');
    
    // Subtract all local pending sends using proper decimal arithmetic
    for (const pending of pendingSends) {
      if (pending.tokenType === tokenType) {
        // Use multiplication and division to avoid floating-point errors
        base = Math.round((base - pending.amount) * 1000000) / 1000000;
      }
    }
    return Math.max(0, base);
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-white border-b border-gray-200 p-4">
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
            <h1 className="text-xl font-bold text-gray-900">Send Crypto</h1>
            <p className="text-sm text-gray-600">Transfer TRX or USDT to another wallet</p>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Available Balance</p>
                {walletLoading ? (
                  <ShimmerSkeleton className="h-6 w-24" />
                ) : (
                  <p className="text-2xl font-bold text-gray-900">
                    {formatAmount(getDisplayedBalance().toString())} {tokenType}
                  </p>
                )}
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600 mb-1">Gas Fee</p>
                {gasFeeLoading ? (
                  <ShimmerSkeleton className="h-6 w-16 ml-auto" />
                ) : (
                  <div>
                    <p className="text-lg font-semibold text-gray-900">
                      {formatGasFee(gasFee, tokenType)}
                    </p>
                    {tokenType === 'USDT' && (
                      <p className="text-xs text-orange-600 mt-1">
                        *Fees vary by network conditions
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2 relative">
                <Label htmlFor="tokenType">Token Type</Label>
                {walletLoading ? (
                  <InputSkeleton />
                ) : (
                  <Select value={tokenType} onValueChange={(value: "TRX" | "USDT") => setTokenType(value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select token type" />
                    </SelectTrigger>
                    <SelectContent className="z-50">
                      <SelectItem value="TRX">TRX</SelectItem>
                      <SelectItem value="USDT">USDT</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </div>

              <div className="space-y-2 mt-8">
                <Label htmlFor="recipientAddress">Recipient Address</Label>
                <div className="flex space-x-2">
                  <Input
                    id="recipientAddress"
                    placeholder="Enter TRX address"
                    value={recipientAddress}
                    onChange={handleRecipientChange}
                    className="flex-1"
                    ref={inputRef}
                  />
                  <Button
                    variant="outline"
                    onClick={() => setLocation('/scan')}
                    className="px-3"
                  >
                    <QrCode className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="amount">Amount</Label>
                {walletLoading ? (
                  <InputSkeleton />
                ) : (
                  <div className="relative">
                    <Input
                      id="amount"
                      type="number"
                      placeholder="0.00"
                      value={amount}
                      onChange={(e) => {
                        const value = e.target.value;
                        // Only update if it's a valid number or empty
                        if (value === '' || !isNaN(parseFloat(value))) {
                          setAmount(value);
                        }
                      }}
                      step="0.000001"
                      min="0"
                      className="pr-16"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const maxBalance = getDisplayedBalance();
                        if (tokenType === 'TRX') {
                          // For TRX, subtract gas fee
                          const gasFeeNum = parseFloat(gasFee);
                          const maxAmount = Math.max(0, maxBalance - gasFeeNum);
                          setAmount(maxAmount.toFixed(6));
                        } else {
                          // For USDT, use full balance (gas is paid in TRX)
                          setAmount(maxBalance.toFixed(6));
                        }
                      }}
                      className="absolute right-1 top-1 h-8 px-2 text-xs"
                    >
                      MAX
                    </Button>
                  </div>
                )}
              </div>

              {amount && parseFloat(amount) > 0 && (
                <Card className="bg-gray-50 border-gray-200">
                  <CardContent className="p-4">
                    <h4 className="font-semibold text-gray-900 mb-3">Transaction Summary</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Amount:</span>
                        <span className="font-medium">
                          {formatAmountForDisplay(amount)} {tokenType}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Gas Fee:</span>
                        <span className="font-medium">{formatGasFee(gasFee, tokenType)}</span>
                      </div>
                      <div className="border-t border-gray-200 pt-2">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Total Cost:</span>
                          <span className="font-semibold">
                            {tokenType === 'TRX' 
                              ? `${(parseFloat(amount) + parseFloat(gasFee)).toFixed(6)} TRX`
                              : `${formatAmountForDisplay(amount)} USDT + ${formatGasFee(gasFee, tokenType)} TRX`
                            }
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={sendTransactionMutation.isPending || !recipientAddress || !amount}
              >
                {sendTransactionMutation.isPending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Sending...
                  </>
                ) : (
                  "Send"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="bg-yellow-50 border-yellow-200">
          <CardContent className="p-4">
            <div className="flex items-start space-x-3">
              <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-yellow-800">
                <div className="font-medium mb-2">Important Notes:</div>
                <ul className="space-y-1 list-disc list-inside">
                  <li>Double-check the recipient address before sending</li>
                  <li>Transactions are irreversible once confirmed</li>
                  <li>Gas fees are required for all transactions</li>
                  <li>Minimum transaction amount: 0.000001 {tokenType}</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

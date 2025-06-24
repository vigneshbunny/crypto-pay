import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/hooks/useAuth";
import { useWallet } from "@/hooks/useWallet";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, QrCode, AlertCircle } from "lucide-react";

const sendSchema = z.object({
  tokenType: z.enum(['TRX', 'USDT']),
  recipientAddress: z.string().min(1, "Recipient address is required"),
  amount: z.string().refine((val) => {
    const num = parseFloat(val);
    return !isNaN(num) && num > 0;
  }, "Amount must be greater than 0"),
});

export default function Send() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { wallet, sendTransaction, sendTransactionLoading, sendTransactionError } = useWallet(user?.id || 0);
  const { toast } = useToast();
  const [showError, setShowError] = useState(false);

  const form = useForm({
    resolver: zodResolver(sendSchema),
    defaultValues: {
      tokenType: 'USDT' as 'TRX' | 'USDT',
      recipientAddress: '',
      amount: '',
    },
  });

  const selectedToken = form.watch('tokenType');
  const amount = form.watch('amount');

  // Get gas fee estimate
  const { data: gasFeeData } = useQuery({
    queryKey: [`/api/gas-fee/${selectedToken}`],
    enabled: !!selectedToken,
  });

  const trxBalance = parseFloat(wallet?.balances?.TRX || '0');
  const usdtBalance = parseFloat(wallet?.balances?.USDT || '0');
  const gasFee = parseFloat(gasFeeData?.gasFee || '0');
  const amountNum = parseFloat(amount || '0');

  const totalCost = selectedToken === 'TRX' ? amountNum + gasFee : amountNum;
  const totalUsd = selectedToken === 'TRX' 
    ? (totalCost * 0.79).toFixed(2)
    : (amountNum + (gasFee * 0.79)).toFixed(2);

  const onSubmit = (data: z.infer<typeof sendSchema>) => {
    setShowError(false);
    
    sendTransaction(data, {
      onSuccess: () => {
        toast({
          title: "Transaction sent!",
          description: "Your transaction has been submitted to the network.",
        });
        setLocation('/dashboard');
      },
      onError: (error: any) => {
        setShowError(true);
        toast({
          title: "Transaction failed",
          description: error.message || "Failed to send transaction",
          variant: "destructive",
        });
      },
    });
  };

  const setMaxAmount = () => {
    if (selectedToken === 'TRX') {
      const maxAmount = Math.max(0, trxBalance - gasFee);
      form.setValue('amount', maxAmount.toFixed(6));
    } else {
      form.setValue('amount', usdtBalance.toFixed(6));
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
        <h1 className="text-xl font-bold text-gray-900">Send Crypto</h1>
      </div>

      <div className="p-6 space-y-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Coin Selection */}
            <FormField
              control={form.control}
              name="tokenType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-gray-700 mb-3">Select Coin</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="space-y-2"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="TRX" id="trx" />
                        <Label htmlFor="trx" className="flex items-center p-4 bg-white rounded-xl border-2 border-gray-200 cursor-pointer hover:border-primary transition-colors flex-1">
                          <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center mr-3">
                            <span className="text-white font-bold">T</span>
                          </div>
                          <div className="flex-1">
                            <p className="font-semibold text-gray-900">TRON (TRX)</p>
                            <p className="text-sm text-gray-500">Balance: {trxBalance.toFixed(2)} TRX</p>
                          </div>
                        </Label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="USDT" id="usdt" />
                        <Label htmlFor="usdt" className="flex items-center p-4 bg-white rounded-xl border-2 border-gray-200 cursor-pointer hover:border-primary transition-colors flex-1">
                          <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center mr-3">
                            <span className="text-white font-bold text-xs">USDT</span>
                          </div>
                          <div className="flex-1">
                            <p className="font-semibold text-gray-900">Tether USD (USDT)</p>
                            <p className="text-sm text-gray-500">Balance: {usdtBalance.toFixed(2)} USDT</p>
                          </div>
                        </Label>
                      </div>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Recipient Address */}
            <FormField
              control={form.control}
              name="recipientAddress"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Recipient Address</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input 
                        placeholder="Enter TRX address" 
                        className="px-4 py-3 pr-12 rounded-xl"
                        {...field} 
                      />
                      <Button 
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 p-0"
                      >
                        <QrCode className="text-gray-400 hover:text-primary" size={20} />
                      </Button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Amount */}
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input 
                        type="number"
                        step="0.000001"
                        placeholder="0.00" 
                        className="px-4 py-3 pr-16 rounded-xl"
                        {...field} 
                      />
                      <Button 
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={setMaxAmount}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-primary text-sm font-medium"
                      >
                        MAX
                      </Button>
                    </div>
                  </FormControl>
                  {amount && (
                    <p className="text-sm text-gray-500 mt-1">
                      ≈ ${(amountNum * (selectedToken === 'TRX' ? 0.79 : 1)).toFixed(2)} USD
                    </p>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Gas Fee Estimation */}
            <Card className="bg-gray-50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Network Fee</span>
                  <span className="text-sm font-semibold text-gray-900">
                    ~{gasFee} TRX
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Estimated Time</span>
                  <span className="text-sm text-gray-500">~3 seconds</span>
                </div>
              </CardContent>
            </Card>

            {/* Total */}
            {amount && (
              <div className="border-t border-gray-200 pt-4">
                <div className="flex items-center justify-between">
                  <span className="text-lg font-semibold text-gray-900">Total</span>
                  <div className="text-right">
                    <p className="text-lg font-bold text-gray-900">
                      {selectedToken === 'TRX' 
                        ? `${totalCost.toFixed(6)} TRX`
                        : `${amountNum.toFixed(6)} USDT + ${gasFee} TRX`
                      }
                    </p>
                    <p className="text-sm text-gray-500">≈ ${totalUsd} USD</p>
                  </div>
                </div>
              </div>
            )}

            {/* Send Button */}
            <Button 
              type="submit"
              className="w-full py-4 rounded-xl font-semibold"
              disabled={sendTransactionLoading}
            >
              {sendTransactionLoading ? "Sending..." : "Send Now"}
            </Button>

            {/* Error Message Display */}
            {(showError && sendTransactionError) && (
              <Card className="bg-red-50 border-red-200">
                <CardContent className="p-4">
                  <div className="flex items-start">
                    <AlertCircle className="text-red-500 mr-3 mt-1 flex-shrink-0" size={16} />
                    <div className="text-sm text-red-800">
                      <p className="font-medium">Transaction Failed</p>
                      <p>{(sendTransactionError as any)?.message || 'Unknown error occurred'}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </form>
        </Form>
      </div>
    </div>
  );
}

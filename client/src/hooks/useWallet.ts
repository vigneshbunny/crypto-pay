import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { WalletData, Transaction } from "@/types/wallet";

export function useWallet(userId: number) {
  const queryClient = useQueryClient();

  const walletQuery = useQuery<WalletData>({
    queryKey: [`/api/wallet/${userId}`],
    enabled: !!userId,
  });

  const transactionsQuery = useQuery<Transaction[]>({
    queryKey: [`/api/transactions/${userId}`],
    enabled: !!userId,
  });

  const updateBalancesMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', `/api/wallet/${userId}/update-balances`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/wallet/${userId}`] });
    },
  });

  const sendTransactionMutation = useMutation({
    mutationFn: async (data: {
      toAddress: string;
      amount: string;
      tokenType: 'TRX' | 'USDT';
    }) => {
      const res = await apiRequest('POST', '/api/transactions/send', {
        userId,
        ...data,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/wallet/${userId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/transactions/${userId}`] });
    },
  });

  return {
    wallet: walletQuery.data,
    walletLoading: walletQuery.isLoading,
    transactions: transactionsQuery.data || [],
    transactionsLoading: transactionsQuery.isLoading,
    updateBalances: updateBalancesMutation.mutate,
    updateBalancesLoading: updateBalancesMutation.isPending,
    sendTransaction: sendTransactionMutation.mutate,
    sendTransactionLoading: sendTransactionMutation.isPending,
    sendTransactionError: sendTransactionMutation.error,
  };
}

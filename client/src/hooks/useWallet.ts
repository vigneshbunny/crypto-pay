import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest, getQueryFn } from "@/lib/queryClient";
import type { WalletData, Transaction } from "@/types/wallet";
import { useEffect } from "react";
import { io as clientIo, Socket } from 'socket.io-client';

export function useWallet(userId: number) {
  const queryClient = useQueryClient();

  const walletQuery = useQuery<WalletData>({
    queryKey: [`/api/wallet/${userId}`],
    queryFn: getQueryFn({ on401: "returnNull" }),
    enabled: !!userId,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    staleTime: 30000, // 30 seconds
  });

  const transactionsQuery = useQuery<Transaction[]>({
    queryKey: [`/api/transactions/${userId}`],
    queryFn: getQueryFn({ on401: "returnNull" }),
    enabled: !!userId,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    staleTime: 30000, // 30 seconds
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

  // Always update and refetch balances and transactions on mount (site refresh)
  useEffect(() => {
    if (userId) {
      updateBalancesMutation.mutateAsync().finally(() => {
        walletQuery.refetch();
        transactionsQuery.refetch();
      });
    }
  }, [userId]);

  // WebSocket for real-time updates
  useEffect(() => {
    if (!userId) return;
    const backendUrl = window.location.origin.startsWith('http') ? window.location.origin.replace(/^http/, 'ws') : 'ws://localhost:5000';
    const socket: Socket = clientIo(backendUrl);
    socket.emit('join', { room: `user-${userId}` });
    socket.on('wallet-update', (data) => {
      if (data.userId === userId) {
        walletQuery.refetch();
        transactionsQuery.refetch();
      }
    });
    return () => {
      socket.disconnect();
    };
  }, [userId]);

  // Optimistically update balance after send
  const sendTransactionMutation = useMutation({
    mutationFn: async (data: {
      recipientAddress: string;
      amount: string;
      tokenType: 'TRX' | 'USDT';
    }) => {
      const res = await apiRequest('POST', '/api/transactions/send', {
        userId,
        ...data,
      });
      return res.json();
    },
    onMutate: async (data) => {
      // Optimistically update wallet balance
      await queryClient.cancelQueries({ queryKey: [`/api/wallet/${userId}`] });
      const prevWallet = queryClient.getQueryData([`/api/wallet/${userId}`]);
      const prevWalletTyped = prevWallet as WalletData | undefined;
      if (prevWalletTyped && prevWalletTyped.balances) {
        const newWallet = JSON.parse(JSON.stringify(prevWalletTyped));
        if (data.tokenType === 'TRX') {
          newWallet.balances.TRX = (parseFloat(newWallet.balances.TRX) - parseFloat(data.amount)).toString();
        } else if (data.tokenType === 'USDT') {
          newWallet.balances.USDT = (parseFloat(newWallet.balances.USDT) - parseFloat(data.amount)).toString();
        }
        queryClient.setQueryData([`/api/wallet/${userId}`], newWallet);
      }
      return { prevWallet };
    },
    onError: (err, data, context) => {
      // Rollback on error
      if (context?.prevWallet) {
        queryClient.setQueryData([`/api/wallet/${userId}`], context.prevWallet);
      }
    },
    onSuccess: () => {
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
    refetchTransactions: transactionsQuery.refetch,
    refetchWallet: walletQuery.refetch,
  };
}

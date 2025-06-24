export interface WalletBalance {
  TRX: string;
  USDT: string;
}

export interface Transaction {
  id: number;
  txHash: string;
  fromAddress: string;
  toAddress: string;
  amount: string;
  tokenType: 'TRX' | 'USDT';
  type: 'send' | 'receive';
  status: 'pending' | 'confirmed' | 'failed';
  blockNumber?: string;
  gasUsed?: string;
  gasPrice?: string;
  confirmations: number;
  createdAt: string;
  confirmedAt?: string;
}

export interface WalletData {
  address: string;
  balances: WalletBalance;
}

export interface User {
  id: number;
  email: string;
}

export interface AuthData {
  user: User;
  wallet: { address: string } | null;
}

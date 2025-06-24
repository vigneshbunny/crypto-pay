import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { TronWeb } = require('tronweb');

const TRON_GRID_API = process.env.TRON_GRID_API || 'https://api.trongrid.io';
const TRON_FULL_NODE = process.env.TRON_FULL_NODE || 'https://api.trongrid.io';
const TRON_SOLIDITY_NODE = process.env.TRON_SOLIDITY_NODE || 'https://api.trongrid.io';
const TRON_EVENT_SERVER = process.env.TRON_EVENT_SERVER || 'https://api.trongrid.io';

// USDT TRC-20 contract address
const USDT_CONTRACT_ADDRESS = 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t';

export class TronService {
  private tronWeb: any;

  constructor() {
    const apiKey = process.env.TRON_API_KEY;
    if (!apiKey) {
      console.warn('TRON_API_KEY not set - some functionality may be limited');
    }
    
    this.tronWeb = new TronWeb({
      fullHost: TRON_FULL_NODE,
      headers: apiKey ? { "TRON-PRO-API-KEY": apiKey } : {},
      privateKey: process.env.TRON_PRIVATE_KEY || '01'.repeat(32)
    });
  }

  // Generate new wallet
  async generateWallet(): Promise<{ address: string; privateKey: string; publicKey: string }> {
    const account = await this.tronWeb.createAccount();
    return {
      address: account.address.base58,
      privateKey: account.privateKey,
      publicKey: account.publicKey
    };
  }

  // Get TRX balance
  async getTrxBalance(address: string): Promise<string> {
    try {
      const balance = await this.tronWeb.trx.getBalance(address);
      return this.tronWeb.fromSun(balance);
    } catch (error: any) {
      if (error.response?.status === 401) {
        console.warn('TRON API key required for balance queries');
      } else {
        console.error('Error getting TRX balance:', error.message);
      }
      return '0';
    }
  }

  // Get USDT balance
  async getUsdtBalance(address: string): Promise<string> {
    try {
      const contract = await this.tronWeb.contract().at(USDT_CONTRACT_ADDRESS);
      const balance = await contract.balanceOf(address).call();
      return this.tronWeb.toBigNumber(balance).dividedBy(1000000).toFixed(6);
    } catch (error: any) {
      if (error.response?.status === 401) {
        console.warn('TRON API key required for USDT balance queries');
      } else {
        console.error('Error getting USDT balance:', error.message);
      }
      return '0';
    }
  }

  // Estimate gas fee for TRX transfer
  async estimateTrxGasFee(): Promise<string> {
    return '15'; // TRX transfers typically cost ~15 TRX in fees
  }

  // Estimate gas fee for USDT transfer
  async estimateUsdtGasFee(): Promise<string> {
    return '28'; // USDT transfers typically cost ~28 TRX in fees
  }

  // Send TRX
  async sendTrx(fromPrivateKey: string, toAddress: string, amount: string): Promise<{ txHash: string; success: boolean; error?: string }> {
    try {
      this.tronWeb.setPrivateKey(fromPrivateKey);
      const amountSun = this.tronWeb.toSun(amount);
      
      const transaction = await this.tronWeb.trx.sendTransaction(toAddress, amountSun);
      
      if (transaction.result) {
        return { txHash: transaction.txid, success: true };
      } else {
        return { txHash: '', success: false, error: 'Transaction failed' };
      }
    } catch (error: any) {
      return { txHash: '', success: false, error: error.message };
    }
  }

  // Send USDT
  async sendUsdt(fromPrivateKey: string, toAddress: string, amount: string): Promise<{ txHash: string; success: boolean; error?: string }> {
    try {
      this.tronWeb.setPrivateKey(fromPrivateKey);
      const contract = await this.tronWeb.contract().at(USDT_CONTRACT_ADDRESS);
      
      const amountSun = this.tronWeb.toBigNumber(amount).multipliedBy(1000000);
      const transaction = await contract.transfer(toAddress, amountSun).send();
      
      if (transaction) {
        return { txHash: transaction, success: true };
      } else {
        return { txHash: '', success: false, error: 'Transaction failed' };
      }
    } catch (error: any) {
      return { txHash: '', success: false, error: error.message };
    }
  }

  // Get transaction details
  async getTransaction(txHash: string): Promise<any> {
    try {
      return await this.tronWeb.trx.getTransaction(txHash);
    } catch (error) {
      console.error('Error getting transaction:', error);
      return null;
    }
  }

  // Validate address
  isValidAddress(address: string): boolean {
    return this.tronWeb.isAddress(address);
  }

  // Check if address has sufficient balance for transaction
  async hasInsufficientBalance(address: string, amount: string, tokenType: 'TRX' | 'USDT', gasFee: string): Promise<{ insufficient: boolean; reason?: string }> {
    const trxBalance = parseFloat(await this.getTrxBalance(address));
    const gasFeeNum = parseFloat(gasFee);
    
    if (tokenType === 'TRX') {
      const totalRequired = parseFloat(amount) + gasFeeNum;
      if (trxBalance < totalRequired) {
        if (trxBalance < gasFeeNum) {
          return { insufficient: true, reason: 'Insufficient TRX for gas fees' };
        } else {
          return { insufficient: true, reason: 'Insufficient TRX balance' };
        }
      }
    } else if (tokenType === 'USDT') {
      const usdtBalance = parseFloat(await this.getUsdtBalance(address));
      if (usdtBalance < parseFloat(amount)) {
        return { insufficient: true, reason: 'Insufficient USDT balance' };
      }
      if (trxBalance < gasFeeNum) {
        return { insufficient: true, reason: 'Insufficient TRX for gas fees' };
      }
    }
    
    return { insufficient: false };
  }
}

export const tronService = new TronService();

import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { TronWeb } = require('tronweb');

const TRON_GRID_API = 'https://api.trongrid.io';
const TRON_FULL_NODE = 'https://api.trongrid.io';
const TRON_SOLIDITY_NODE = 'https://api.trongrid.io';
const TRON_EVENT_SERVER = 'https://api.trongrid.io';
const USDT_CONTRACT_ADDRESS = 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t';

export class TronService {
  private tronWeb: any;
  private USDT_CONTRACT_ADDRESS: string;

  constructor() {
    const apiKey = process.env.TRON_API_KEY;
    this.tronWeb = new TronWeb({
      fullHost: TRON_FULL_NODE,
      headers: apiKey ? { "TRON-PRO-API-KEY": apiKey } : {},
      privateKey: process.env.TRON_PRIVATE_KEY || '01'.repeat(32)
    });
    this.USDT_CONTRACT_ADDRESS = USDT_CONTRACT_ADDRESS;
    
    console.log(`Using TRON MAINNET: ${TRON_GRID_API}`);
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
      console.error('Error getting TRX balance:', error);
      
      // Handle specific error cases
      if (error.message?.includes('timeout')) {
        console.warn('TRX balance query timed out');
        return '0';
      }
      
      if (error.response?.status === 401) {
        console.warn('TRON API key required for balance queries');
        return '0';
      }
      
      // For any other error, return 0 but don't throw
      console.warn('Unknown error getting TRX balance, returning 0');
      return '0';
    }
  }

  // Get USDT balance
  async getUsdtBalance(address: string): Promise<string> {
    try {
      // First, try to get the contract
      const contract = await this.tronWeb.contract().at(this.USDT_CONTRACT_ADDRESS);
      // Convert address to hex format for contract call
      const hexAddress = this.tronWeb.address.toHex(address);
      // Then try to call balanceOf
      const balance = await contract.balanceOf(hexAddress).call();
      // Convert the balance to the correct format
      const balanceInUsdt = this.tronWeb.toBigNumber(balance).dividedBy(1000000).toFixed(6);
      console.log(`USDT balance for ${address}: ${balanceInUsdt}`);
      return balanceInUsdt;
    } catch (error: any) {
      console.error('Error getting USDT balance:', error);
      // Fallback: Try TronGrid API directly
      try {
        const apiKey = process.env.TRON_API_KEY;
        const tronGridBase = TRON_GRID_API || (TRON_FULL_NODE.includes('nile') ? 'https://nile.trongrid.io' : 'https://api.trongrid.io');
        const url = `${tronGridBase}/v1/accounts/${address}/balances`;
        const resp = await (await import('axios')).default.get(url, apiKey ? { headers: { 'TRON-PRO-API-KEY': apiKey } } : {});
        const balances = resp.data.data || [];
        const usdt = balances.find((b: any) => b.tokenId === this.USDT_CONTRACT_ADDRESS || b.token_id === this.USDT_CONTRACT_ADDRESS);
        if (usdt && usdt.amount) {
          return (parseFloat(usdt.amount) / 1e6).toFixed(6);
        }
      } catch (fallbackError) {
        console.error('Fallback TronGrid API USDT balance error:', fallbackError);
      }
      // For any error, return 0
      return '0';
    }
  }

  // Estimate gas fee for TRX transfer
  async estimateTrxGasFee(): Promise<string> {
    return '1.1'; // TRX transfers typically cost ~1.1 TRX in fees
  }

  // Estimate gas fee for USDT transfer
  async estimateUsdtGasFee(): Promise<string> {
    return '13.8~30'; // USDT transfers typically cost 13.8-30 TRX in fees (varies by network conditions)
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
      console.log('[USDT SEND] Starting USDT transfer:', { toAddress, amount });
      this.tronWeb.setPrivateKey(fromPrivateKey);
      
      console.log('[USDT SEND] Getting contract at address:', this.USDT_CONTRACT_ADDRESS);
      const contract = await this.tronWeb.contract().at(this.USDT_CONTRACT_ADDRESS);
      console.log('[USDT SEND] Contract obtained successfully');
      
      // Convert toAddress to hex format for contract call
      const hexTo = this.tronWeb.address.toHex(toAddress);
      console.log('[USDT SEND] Hex address:', hexTo);
      
      // Convert amount to the correct format (USDT has 6 decimals)
      const amountInSmallestUnit = this.tronWeb.toBigNumber(amount).multipliedBy(1000000).toString();
      console.log('[USDT SEND] Amount in smallest unit:', amountInSmallestUnit);
      
      console.log('[USDT SEND] Calling contract.transfer...');
      const transaction = await contract.transfer(hexTo, amountInSmallestUnit).send();
      console.log('[USDT SEND] Transaction result:', transaction);
      
      if (transaction) {
        return { txHash: transaction, success: true };
      } else {
        return { txHash: '', success: false, error: 'Transaction failed' };
      }
    } catch (error: any) {
      console.error('[USDT SEND] Error details:', {
        message: error.message,
        stack: error.stack,
        code: error.code,
        fullError: error
      });
      return { txHash: '', success: false, error: error.message || 'Unknown error' };
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
    
    console.log(`[BALANCE CHECK] Address: ${address}, Token: ${tokenType}, Amount: ${amount}, Gas Fee: ${gasFee}, TRX Balance: ${trxBalance}`);
    
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
      console.log(`[BALANCE CHECK] USDT Balance: ${usdtBalance}, Required: ${amount}`);
      if (usdtBalance < parseFloat(amount)) {
        return { insufficient: true, reason: 'Insufficient USDT balance' };
      }
      if (trxBalance < gasFeeNum) {
        console.log(`[BALANCE CHECK] Insufficient TRX for gas fees: ${trxBalance} < ${gasFeeNum}`);
        return { insufficient: true, reason: 'Insufficient TRX for gas fees' };
      }
    }
    
    console.log(`[BALANCE CHECK] Sufficient balance for ${tokenType} transaction`);
    return { insufficient: false };
  }

  getTronWeb() {
    return this.tronWeb;
  }
}

export const tronService = new TronService();

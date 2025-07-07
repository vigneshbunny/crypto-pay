import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { CryptoService } from "./services/cryptoService";
import { insertUserSchema, insertTransactionSchema } from "@shared/schema";
import { z } from "zod";
import { io } from './index';
import axios from 'axios';
import { tronService } from "./services/tronService";

export async function registerRoutes(app: Express): Promise<Server> {
  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Auth routes
  app.post('/api/auth/register', async (req, res) => {
    try {
      const { email, password } = insertUserSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        // Check if user has a wallet, if not, delete the incomplete user
        const existingWallet = await storage.getWalletByUserId(existingUser.id);
        if (!existingWallet) {
          console.log('Cleaning up incomplete user registration:', existingUser.email);
          // Delete the incomplete user and retry registration
          try {
            await storage.deleteUser(existingUser.id);
          } catch (deleteError) {
            console.error('Error cleaning up incomplete user:', deleteError);
          }
        } else {
          return res.status(400).json({ message: 'User already exists' });
        }
      }

      // Hash password
      const hashedPassword = CryptoService.hashPassword(password);
      
      let user;
      let wallet;
      
      try {
        // Create user
        user = await storage.createUser({ email, password: hashedPassword });
        
        // Generate wallet
        const walletData = await tronService.generateWallet();
        const encryptedPrivateKey = CryptoService.encrypt(walletData.privateKey);
        
        // Create wallet
        wallet = await storage.createWallet({
          userId: user.id,
          address: walletData.address,
          privateKeyEncrypted: encryptedPrivateKey,
          publicKey: walletData.publicKey
        });

        // Initialize balances
        await storage.upsertBalance({ walletId: wallet.id, tokenType: 'TRX', balance: 0 });
        await storage.upsertBalance({ walletId: wallet.id, tokenType: 'USDT', balance: 0 });

        res.json({ 
          user: { id: user.id, email: user.email },
          wallet: { address: wallet.address }
        });

        // After updating balances, emit wallet-update event
        io.to(`user-${user.id}`).emit('wallet-update', { userId: user.id });
      } catch (walletError) {
        // If wallet creation fails, clean up the user
        if (user) {
          try {
            await storage.deleteUser(user.id);
          } catch (cleanupError) {
            console.error('Error cleaning up user after wallet creation failure:', cleanupError);
          }
        }
        throw walletError;
      }
    } catch (error: any) {
      console.error('Registration error:', error);
      
      // More specific error handling
      if (error.message && error.message.includes('duplicate key')) {
        return res.status(400).json({ message: 'User already exists' });
      }
      
      // If it's a validation error from Zod
      if (error.name === 'ZodError') {
        return res.status(400).json({ message: 'Invalid input data' });
      }
      
      // For other errors, provide a generic message but log the details
      res.status(500).json({ message: 'Registration failed. Please try again.' });
    }
  });

  app.post('/api/auth/login', async (req, res) => {
    try {
      const { email, password } = insertUserSchema.parse(req.body);
      
      const user = await storage.getUserByEmail(email);
      if (!user || !CryptoService.verifyPassword(password, user.password)) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      const wallet = await storage.getWalletByUserId(user.id);
      
      res.json({
        user: { id: user.id, email: user.email },
        wallet: wallet ? { address: wallet.address } : null
      });
    } catch (error: any) {
      console.error('Login error:', error);
      res.status(500).json({ message: error.message || 'Login failed' });
    }
  });

  // Wallet routes
  app.get('/api/wallet/:userId', async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const wallet = await storage.getWalletByUserId(userId);
      
      if (!wallet) {
        return res.status(404).json({ message: 'Wallet not found' });
      }

      const balances = await storage.getBalancesByWalletId(wallet.id);
      
      res.json({
        address: wallet.address,
        balances: balances.reduce((acc, balance) => {
          acc[balance.tokenType] = balance.balance.toString();
          return acc;
        }, {} as Record<string, string>)
      });
    } catch (error: any) {
      console.error('Get wallet error:', error);
      res.status(500).json({ message: error.message || 'Failed to get wallet' });
    }
  });

  app.post('/api/wallet/:userId/update-balances', async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const wallet = await storage.getWalletByUserId(userId);
      if (!wallet) {
        return res.status(404).json({ message: 'Wallet not found' });
      }
      // Fetch real-time balances
      const trxBalance = await tronService.getTrxBalance(wallet.address);
      const usdtBalance = await tronService.getUsdtBalance(wallet.address);

      // Get recent transactions from blockchain to detect received transactions
      try {
        // This would require additional TRON API calls to get recent transactions
        // For now, we'll just update balances
        // TODO: Implement transaction detection from blockchain
      } catch (error) {
        console.log('Could not detect new transactions:', error);
      }

      // Update balances in database
      await storage.upsertBalance({ walletId: wallet.id, tokenType: 'TRX', balance: parseFloat(trxBalance) });
      await storage.upsertBalance({ walletId: wallet.id, tokenType: 'USDT', balance: parseFloat(usdtBalance) });

      res.json({
        TRX: trxBalance,
        USDT: usdtBalance
      });

      // After updating balances, emit wallet-update event
      io.to(`user-${userId}`).emit('wallet-update', { userId });
    } catch (error: any) {
      console.error('Update balances error:', error);
      res.status(500).json({ message: error.message || 'Failed to update balances' });
    }
  });

  // New endpoint to fetch real received transactions from blockchain
  app.post('/api/wallet/:userId/detect-transactions', async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const wallet = await storage.getWalletByUserId(userId);
      if (!wallet) {
        return res.status(404).json({ message: 'Wallet not found' });
      }
      const address = wallet.address;
      const apiKey = process.env.TRON_API_KEY;
      const isTestnet = process.env.TRON_NETWORK === 'testnet';
      const tronGridBase = isTestnet
        ? (process.env.TRON_GRID_API || 'https://nile.trongrid.io')
        : (process.env.TRON_GRID_API || 'https://api.trongrid.io');

      // 1. Fetch TRX transactions (sent and received)
      const trxUrl = `${tronGridBase}/v1/accounts/${address}/transactions?limit=100&order_by=block_timestamp,desc`;
      const trxResp = await axios.get(trxUrl, apiKey ? { headers: { 'TRON-PRO-API-KEY': apiKey } } : {});
      const trxTxs = trxResp.data.data || [];

      // 2. Fetch USDT (TRC20) transfer events (sent and received)
      const trc20Url = `${tronGridBase}/v1/accounts/${address}/transactions/trc20?limit=100&order_by=block_timestamp,desc`;
      const trc20Resp = await axios.get(trc20Url, apiKey ? { headers: { 'TRON-PRO-API-KEY': apiKey } } : {});
      const trc20Txs = trc20Resp.data.data || [];

      // Helper to get block and confirmations
      const getBlockInfo = async (blockNumber: number) => {
        // Not strictly needed for TronGrid, but you can fetch latest block if you want confirmations
        return { confirmations: 20, latestBlock: 0 };
      };

      // 3. Process TRX transactions
      for (const tx of trxTxs) {
        if (!tx.raw_data || !tx.raw_data.contract || !tx.raw_data.contract[0]) continue;
        if (tx.raw_data.contract[0].type !== 'TransferContract') continue;
        const contract = tx.raw_data.contract[0].parameter.value;
        const tronWeb = tronService.getTronWeb();
        const from = tronWeb.address.fromHex(contract.owner_address);
        const to = tronWeb.address.fromHex(contract.to_address);
        const amount = tronWeb.fromSun(contract.amount);
        const txHash = tx.txID;
        const blockNumber = tx.blockNumber || 0;
        const { confirmations } = await getBlockInfo(blockNumber);
        const type = from === address ? 'send' : to === address ? 'receive' : 'other';
        if (type === 'other') continue;
        // Check if already in DB
        const exists = await storage.getTransactionByHash(txHash);
        if (!exists) {
          await storage.createTransaction({
            userId,
            walletId: wallet.id,
            txHash,
            fromAddress: from,
            toAddress: to,
            amount: parseFloat(amount),
            tokenType: 'TRX',
            type,
            status: confirmations >= 19 ? 'confirmed' : 'pending',
            gasUsed: 0,
            gasPrice: 0,
            blockNumber,
          });
        } else {
          await storage.updateTransactionStatus(txHash, confirmations >= 19 ? 'confirmed' : 'pending', confirmations);
        }
      }

      // 4. Process USDT (TRC20) transactions
      for (const tx of trc20Txs) {
        // Only process USDT contract
        if (!tx || !tx.token_info || tx.token_info.symbol !== 'USDT') continue;
        const from = tx.from;
        const to = tx.to;
        const amount = parseFloat(tx.value) / 1e6;
        const txHash = tx.transaction_id;
        const blockNumber = tx.block_number;
        const { confirmations } = await getBlockInfo(blockNumber);
        const type = from === address ? 'send' : to === address ? 'receive' : 'other';
        if (type === 'other') continue;
        const exists = await storage.getTransactionByHash(txHash);
        if (!exists) {
          await storage.createTransaction({
            userId,
            walletId: wallet.id,
            txHash,
            fromAddress: from,
            toAddress: to,
            amount,
            tokenType: 'USDT',
            type,
            status: confirmations >= 19 ? 'confirmed' : 'pending',
            gasUsed: 0,
            gasPrice: 0,
            blockNumber,
          });
        } else {
          await storage.updateTransactionStatus(txHash, confirmations >= 19 ? 'confirmed' : 'pending', confirmations);
        }
      }

      res.json({ message: 'Transaction detection completed and synced.' });

      // After detecting transactions, emit wallet-update event
      io.to(`user-${userId}`).emit('wallet-update', { userId });
    } catch (error: any) {
      console.error('Detect transactions error:', error);
      res.status(500).json({ message: error.message || 'Failed to detect transactions' });
    }
  });

  // Transaction routes
  app.post('/api/transactions/send', async (req, res) => {
    try {
      const schema = z.object({
        userId: z.number(),
        recipientAddress: z.string(),
        amount: z.string(),
        tokenType: z.enum(['TRX', 'USDT']),
        network: z.enum(['mainnet', 'testnet']).optional()
      });
      const { userId, recipientAddress, amount, tokenType, network } = schema.parse(req.body);
      const toAddress = recipientAddress;
      // Validate address
      if (!tronService.isValidAddress(toAddress)) {
        return res.status(400).json({ message: 'Invalid recipient address' });
      }
      const wallet = await storage.getWalletByUserId(userId);
      if (!wallet) {
        return res.status(404).json({ message: 'Wallet not found' });
      }
      // Get gas fee estimate
      const gasFee = tokenType === 'TRX' 
        ? await tronService.estimateTrxGasFee()
        : await tronService.estimateUsdtGasFee();
      // Check for insufficient balance
      const insufficientCheck = await tronService.hasInsufficientBalance(
        wallet.address, 
        amount, 
        tokenType, 
        gasFee
      );
      if (insufficientCheck.insufficient) {
        return res.status(400).json({ 
          message: insufficientCheck.reason || 'Insufficient balance'
        });
      }
      // Decrypt private key
      const privateKey = CryptoService.decrypt(wallet.privateKeyEncrypted);
      // Send transaction
      const result = tokenType === 'TRX'
        ? await tronService.sendTrx(privateKey, toAddress, amount)
        : await tronService.sendUsdt(privateKey, toAddress, amount);
      if (!result.success) {
        return res.status(400).json({ message: result.error || 'Transaction failed' });
      }
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ message: error.message || 'Transaction failed' });
    }
  });

  app.get('/api/transactions/:userId', async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const transactions = await storage.getTransactionsByUserId(userId);
      
      res.json(transactions);
    } catch (error: any) {
      console.error('Get transactions error:', error);
      res.status(500).json({ message: error.message || 'Failed to get transactions' });
    }
  });

  // Gas fee estimation
  app.get('/api/gas-fee/:tokenType', async (req, res) => {
    try {
      const tokenType = req.params.tokenType as 'TRX' | 'USDT';
      
      const gasFee = tokenType === 'TRX'
        ? await tronService.estimateTrxGasFee()
        : await tronService.estimateUsdtGasFee();

      res.json({ gasFee, tokenType });
    } catch (error: any) {
      console.error('Gas fee estimation error:', error);
      res.status(500).json({ message: error.message || 'Failed to estimate gas fee' });
    }
  });

  // Record received transaction
  app.post('/api/transactions/receive', async (req, res) => {
    try {
      const schema = z.object({
        userId: z.number(),
        txHash: z.string(),
        fromAddress: z.string(),
        amount: z.string(),
        tokenType: z.enum(['TRX', 'USDT'])
      });

      const { userId, txHash, fromAddress, amount, tokenType } = schema.parse(req.body);
      
      const wallet = await storage.getWalletByUserId(userId);
      if (!wallet) {
        return res.status(404).json({ message: 'Wallet not found' });
      }

      // Check if transaction already exists
      const existingTx = await storage.getTransactionByHash(txHash);
      if (existingTx) {
        return res.json({ message: 'Transaction already recorded' });
      }

      // Create receive transaction
      const transaction = await storage.createTransaction({
        userId,
        walletId: wallet.id,
        txHash,
        fromAddress,
        toAddress: wallet.address,
        amount: parseFloat(amount),
        tokenType,
        type: 'receive',
        status: 'confirmed',
        gasUsed: 0,
        gasPrice: 0
      });

      res.json({ transaction });

      // Emit wallet-update after manual receive
      io.to(`user-${userId}`).emit('wallet-update', { userId });
    } catch (error: any) {
      console.error('Record receive transaction error:', error);
      res.status(500).json({ message: error.message || 'Failed to record transaction' });
    }
  });

  // Record received transaction manually
  app.post('/api/transactions/receive-manual', async (req, res) => {
    try {
      const schema = z.object({
        userId: z.number(),
        txHash: z.string(),
        fromAddress: z.string(),
        amount: z.string(),
        tokenType: z.enum(['TRX', 'USDT'])
      });

      const { userId, txHash, fromAddress, amount, tokenType } = schema.parse(req.body);
      
      const wallet = await storage.getWalletByUserId(userId);
      if (!wallet) {
        return res.status(404).json({ message: 'Wallet not found' });
      }

      // Check if transaction already exists
      const existingTx = await storage.getTransactionByHash(txHash);
      if (existingTx) {
        return res.json({ message: 'Transaction already recorded', transaction: existingTx });
      }

      // Create receive transaction
      const transaction = await storage.createTransaction({
        userId,
        walletId: wallet.id,
        txHash,
        fromAddress,
        toAddress: wallet.address,
        amount: parseFloat(amount),
        tokenType,
        type: 'receive',
        status: 'confirmed',
        gasUsed: 0,
        gasPrice: 0
      });

      res.json({ transaction, message: 'Transaction recorded successfully' });

      // Emit wallet-update after manual receive
      io.to(`user-${userId}`).emit('wallet-update', { userId });
    } catch (error: any) {
      console.error('Record receive transaction error:', error);
      res.status(500).json({ message: error.message || 'Failed to record transaction' });
    }
  });

  // Update transaction status
  app.put('/api/transactions/:txHash/status', async (req, res) => {
    try {
      const { txHash } = req.params;
      const { status } = req.body;
      
      // Check if transaction exists first
      const transaction = await storage.getTransactionByHash(txHash);
      if (!transaction) {
        return res.status(404).json({ message: 'Transaction not found' });
      }
      
      await storage.updateTransactionStatus(txHash, status);
      
      res.json({ message: 'Transaction status updated', status });
    } catch (error: any) {
      console.error('Update transaction status error:', error);
      res.status(500).json({ message: error.message || 'Failed to update transaction status' });
    }
  });

  // Get transaction by hash
  app.get('/api/transactions/hash/:txHash', async (req, res) => {
    try {
      const { txHash } = req.params;
      const transaction = await storage.getTransactionByHash(txHash);
      
      if (!transaction) {
        return res.status(404).json({ message: 'Transaction not found' });
      }
      
      res.json(transaction);
    } catch (error: any) {
      console.error('Get transaction by hash error:', error);
      res.status(500).json({ message: error.message || 'Failed to get transaction' });
    }
  });

  // Secure endpoint to export decrypted private key (for backup)
  app.post('/api/wallet/:userId/private-key', async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const { password } = req.body;
      // Validate user and password
      const user = await storage.getUser(userId);
      if (!user || !CryptoService.verifyPassword(password, user.password)) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }
      const wallet = await storage.getWalletByUserId(userId);
      if (!wallet) {
        return res.status(404).json({ message: 'Wallet not found' });
      }
      // Decrypt private key
      const privateKey = CryptoService.decrypt(wallet.privateKeyEncrypted);
      res.json({ privateKey });
    } catch (error: any) {
      console.error('Export private key error:', error);
      res.status(500).json({ message: error.message || 'Failed to export private key' });
    }
  });

  // Change password endpoint
  app.post('/api/user/:userId/change-password', async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const { currentPassword, newPassword } = req.body;
      if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: 'Missing password fields' });
      }
      const user = await storage.getUser(userId);
      if (!user || !CryptoService.verifyPassword(currentPassword, user.password)) {
        return res.status(401).json({ message: 'Current password is incorrect' });
      }
      const newHash = CryptoService.hashPassword(newPassword);
      await storage.updateUserPassword(userId, newHash);
      res.json({ message: 'Password updated successfully' });
    } catch (error: any) {
      console.error('Change password error:', error);
      res.status(500).json({ message: error.message || 'Failed to change password' });
    }
  });

  // Root route: redirect based on session/auth cookie
  app.get('/', (req, res) => {
    // Check for auth cookie (for SSR; client uses localStorage)
    const authCookie = req.cookies?.auth;
    if (authCookie) {
      res.redirect('/dashboard');
    } else {
      res.redirect('/login');
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

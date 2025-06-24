import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { tronService } from "./services/tronService";
import { CryptoService } from "./services/cryptoService";
import { insertUserSchema, insertTransactionSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
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
        await storage.upsertBalance({ walletId: wallet.id, tokenType: 'TRX', balance: '0' });
        await storage.upsertBalance({ walletId: wallet.id, tokenType: 'USDT', balance: '0' });

        res.json({ 
          user: { id: user.id, email: user.email },
          wallet: { address: wallet.address }
        });
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
          acc[balance.tokenType] = balance.balance;
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

      // Update balances in database
      await storage.upsertBalance({ walletId: wallet.id, tokenType: 'TRX', balance: trxBalance });
      await storage.upsertBalance({ walletId: wallet.id, tokenType: 'USDT', balance: usdtBalance });

      res.json({
        TRX: trxBalance,
        USDT: usdtBalance
      });
    } catch (error: any) {
      console.error('Update balances error:', error);
      res.status(500).json({ message: error.message || 'Failed to update balances' });
    }
  });

  // Transaction routes
  app.post('/api/transactions/send', async (req, res) => {
    try {
      const schema = z.object({
        userId: z.number(),
        toAddress: z.string(),
        amount: z.string(),
        tokenType: z.enum(['TRX', 'USDT'])
      });

      const { userId, toAddress, amount, tokenType } = schema.parse(req.body);
      
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

      // Store transaction in database
      const transaction = await storage.createTransaction({
        userId,
        walletId: wallet.id,
        txHash: result.txHash,
        fromAddress: wallet.address,
        toAddress,
        amount,
        tokenType,
        type: 'send',
        status: 'pending',
        gasUsed: gasFee,
        gasPrice: '1'
      });

      res.json({
        txHash: result.txHash,
        transaction
      });
    } catch (error: any) {
      console.error('Send transaction error:', error);
      res.status(500).json({ message: error.message || 'Failed to send transaction' });
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

  const httpServer = createServer(app);
  return httpServer;
}

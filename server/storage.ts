import { 
  users, wallets, transactions, balances,
  type User, type InsertUser, 
  type Wallet, type InsertWallet,
  type Transaction, type InsertTransaction,
  type Balance, type InsertBalance
} from "@shared/schema";
import { db, pool } from "./db";
import { eq, desc, and } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Wallet operations
  getWalletByUserId(userId: number): Promise<Wallet | undefined>;
  getWalletByAddress(address: string): Promise<Wallet | undefined>;
  createWallet(wallet: InsertWallet): Promise<Wallet>;

  // Transaction operations
  getTransactionsByUserId(userId: number, limit?: number): Promise<Transaction[]>;
  getTransactionByHash(txHash: string): Promise<Transaction | undefined>;
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  updateTransactionStatus(txHash: string, status: string, confirmations?: number, confirmedAt?: Date): Promise<void>;

  // Balance operations
  getBalancesByWalletId(walletId: number): Promise<Balance[]>;
  getBalanceByWalletAndToken(walletId: number, tokenType: string): Promise<Balance | undefined>;
  upsertBalance(balance: InsertBalance): Promise<Balance>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async deleteUser(userId: number): Promise<void> {
    await db.delete(users).where(eq(users.id, userId));
  }

  // Wallet operations
  async getWalletByUserId(userId: number): Promise<Wallet | undefined> {
    const [wallet] = await db.select().from(wallets).where(eq(wallets.userId, userId));
    return wallet || undefined;
  }

  async getWalletByAddress(address: string): Promise<Wallet | undefined> {
    const [wallet] = await db.select().from(wallets).where(eq(wallets.address, address));
    return wallet || undefined;
  }

  async createWallet(insertWallet: InsertWallet): Promise<Wallet> {
    const [wallet] = await db
      .insert(wallets)
      .values(insertWallet)
      .returning();
    return wallet;
  }

  // Transaction operations
  async getTransactionsByUserId(userId: number, limit: number = 50): Promise<Transaction[]> {
    return await db
      .select()
      .from(transactions)
      .where(eq(transactions.userId, userId))
      .orderBy(desc(transactions.createdAt))
      .limit(limit);
  }

  async getTransactionByHash(txHash: string): Promise<Transaction | undefined> {
    const [transaction] = await db.select().from(transactions).where(eq(transactions.txHash, txHash));
    return transaction || undefined;
  }

  async createTransaction(insertTransaction: InsertTransaction): Promise<Transaction> {
    const [transaction] = await db
      .insert(transactions)
      .values(insertTransaction)
      .returning();
    return transaction;
  }

  async updateTransactionStatus(txHash: string, status: string, confirmations?: number, confirmedAt?: Date): Promise<void> {
    const updateData: any = { status };
    if (confirmations !== undefined) updateData.confirmations = confirmations;
    if (confirmedAt) updateData.confirmedAt = confirmedAt;

    await db
      .update(transactions)
      .set(updateData)
      .where(eq(transactions.txHash, txHash));
  }

  // Balance operations
  async getBalancesByWalletId(walletId: number): Promise<Balance[]> {
    return await db
      .select()
      .from(balances)
      .where(eq(balances.walletId, walletId));
  }

  async getBalanceByWalletAndToken(walletId: number, tokenType: string): Promise<Balance | undefined> {
    const [balance] = await db
      .select()
      .from(balances)
      .where(and(eq(balances.walletId, walletId), eq(balances.tokenType, tokenType)));
    return balance || undefined;
  }

  async upsertBalance(insertBalance: InsertBalance): Promise<Balance> {
    // Check if balance exists first
    const existingBalance = await this.getBalanceByWalletAndToken(
      insertBalance.walletId!, 
      insertBalance.tokenType!
    );

    if (existingBalance) {
      // Update existing balance
      const [balance] = await db
        .update(balances)
        .set({
          balance: insertBalance.balance,
          // Postgres (Neon) expects a Date for timestamp columns; SQLite stores text
          lastUpdated: (pool ? (new Date() as any) : new Date().toISOString()) as any,
        })
        .where(and(
          eq(balances.walletId, insertBalance.walletId!),
          eq(balances.tokenType, insertBalance.tokenType!)
        ))
        .returning();
      return balance;
    } else {
      // Insert new balance
      const [balance] = await db
        .insert(balances)
        .values(insertBalance)
        .returning();
      return balance;
    }
  }
}

export const storage = new DatabaseStorage();

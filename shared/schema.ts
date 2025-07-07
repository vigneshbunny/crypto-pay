import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").default(sql`CURRENT_TIMESTAMP`),
});

export const wallets = sqliteTable("wallets", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").references(() => users.id).notNull(),
  address: text("address").notNull().unique(),
  privateKeyEncrypted: text("private_key_encrypted").notNull(),
  publicKey: text("public_key").notNull(),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const transactions = sqliteTable("transactions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").references(() => users.id).notNull(),
  walletId: integer("wallet_id").references(() => wallets.id).notNull(),
  txHash: text("tx_hash").notNull().unique(),
  fromAddress: text("from_address").notNull(),
  toAddress: text("to_address").notNull(),
  amount: real("amount").notNull(),
  tokenType: text("token_type").notNull(), // 'TRX' or 'USDT'
  type: text("type").notNull(), // 'send' or 'receive'
  status: text("status").notNull().default('pending'), // 'pending', 'confirmed', 'failed'
  blockNumber: text("block_number"),
  gasUsed: real("gas_used"),
  gasPrice: real("gas_price"),
  confirmations: real("confirmations").default(0),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
  confirmedAt: text("confirmed_at"),
});

export const balances = sqliteTable("balances", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  walletId: integer("wallet_id").references(() => wallets.id).notNull(),
  tokenType: text("token_type").notNull(),
  balance: real("balance").notNull().default(0),
  lastUpdated: text("last_updated").default(sql`CURRENT_TIMESTAMP`),
});

// Zod schemas
export const insertUserSchema = createInsertSchema(users).pick({
  email: true,
  password: true,
});

export const insertWalletSchema = createInsertSchema(wallets).pick({
  userId: true,
  address: true,
  privateKeyEncrypted: true,
  publicKey: true,
});

export const insertTransactionSchema = createInsertSchema(transactions).pick({
  userId: true,
  walletId: true,
  txHash: true,
  fromAddress: true,
  toAddress: true,
  amount: true,
  tokenType: true,
  type: true,
  status: true,
  blockNumber: true,
  gasUsed: true,
  gasPrice: true,
});

export const insertBalanceSchema = createInsertSchema(balances).pick({
  walletId: true,
  tokenType: true,
  balance: true,
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertWallet = z.infer<typeof insertWalletSchema>;
export type Wallet = typeof wallets.$inferSelect;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type Transaction = typeof transactions.$inferSelect;
export type InsertBalance = z.infer<typeof insertBalanceSchema>;
export type Balance = typeof balances.$inferSelect;

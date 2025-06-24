import { pgTable, text, serial, timestamp, decimal, varchar, boolean, index, unique } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const wallets = pgTable("wallets", {
  id: serial("id").primaryKey(),
  userId: serial("user_id").references(() => users.id).notNull(),
  address: text("address").notNull().unique(),
  privateKeyEncrypted: text("private_key_encrypted").notNull(),
  publicKey: text("public_key").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("wallets_user_id_idx").on(table.userId),
  index("wallets_address_idx").on(table.address),
]);

export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  userId: serial("user_id").references(() => users.id).notNull(),
  walletId: serial("wallet_id").references(() => wallets.id).notNull(),
  txHash: text("tx_hash").notNull().unique(),
  fromAddress: text("from_address").notNull(),
  toAddress: text("to_address").notNull(),
  amount: decimal("amount", { precision: 20, scale: 6 }).notNull(),
  tokenType: varchar("token_type", { length: 10 }).notNull(), // 'TRX' or 'USDT'
  type: varchar("type", { length: 10 }).notNull(), // 'send' or 'receive'
  status: varchar("status", { length: 20 }).notNull().default('pending'), // 'pending', 'confirmed', 'failed'
  blockNumber: text("block_number"),
  gasUsed: decimal("gas_used", { precision: 20, scale: 6 }),
  gasPrice: decimal("gas_price", { precision: 20, scale: 6 }),
  confirmations: decimal("confirmations").default('0'),
  createdAt: timestamp("created_at").defaultNow(),
  confirmedAt: timestamp("confirmed_at"),
}, (table) => [
  index("transactions_user_id_idx").on(table.userId),
  index("transactions_wallet_id_idx").on(table.walletId),
  index("transactions_tx_hash_idx").on(table.txHash),
  index("transactions_status_idx").on(table.status),
]);

export const balances = pgTable("balances", {
  id: serial("id").primaryKey(),
  walletId: serial("wallet_id").references(() => wallets.id).notNull(),
  tokenType: varchar("token_type", { length: 10 }).notNull(),
  balance: decimal("balance", { precision: 20, scale: 6 }).notNull().default('0'),
  lastUpdated: timestamp("last_updated").defaultNow(),
}, (table) => [
  index("balances_wallet_id_idx").on(table.walletId),
  index("balances_token_type_idx").on(table.tokenType),
  unique("balances_wallet_token_unique").on(table.walletId, table.tokenType),
]);

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

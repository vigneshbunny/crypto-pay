import { defineConfig } from "drizzle-kit";

export default defineConfig({
  out: "./migrations",
  schema: "./shared/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    host: "dpg-d1lpq895pdvs73c9emu0-a.oregon-postgres.render.com",
    port: 5432,
    user: "cryptopay_user",
    password: "RNnUdDl1rpMohUuYt9y1IUdfU8ILRffk",
    database: "cryptopay",
    ssl: true
  }
});


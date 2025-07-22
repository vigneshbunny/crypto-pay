import { defineConfig } from "drizzle-kit";
//make your changes below from database//
export default defineConfig({
  out: "./migrations",
  schema: "./shared/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    host: "hosturl...-a.oregon-postgres.render.com",
    port: 5432,
    user: "user_name",
    password: "database_pass",
    database: "database_name",
    ssl: true
  }
});


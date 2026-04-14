import { createServer } from "node:http";
import { bootstrapDatabase } from "./db/bootstrap.js";
import { pool } from "./db/pool.js";
import { env } from "./config/env.js";
import { createApp } from "./app.js";

const start = async () => {
  await bootstrapDatabase();

  const server = createServer(createApp());
  server.listen(env.port, () => {
    console.log(`auth-service listening on port ${env.port}`);
  });
};

start().catch(async (error) => {
  console.error("auth-service failed to start", error);
  await pool.end();
  process.exit(1);
});

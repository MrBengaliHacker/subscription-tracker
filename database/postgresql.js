
import pg from "pg";

import { DATABASE_URL, NODE_ENV } from "../config/env.js";

const { Pool } = pg;

// Ensure the database URL is configured
if (!DATABASE_URL) {
  throw new Error(
    "Please define DATABASE_URL in your environment file"
  );
}

// Create a pool to manage database connections
const pool = new Pool({
  connectionString: DATABASE_URL,
  max: 10,
  connectionTimeoutMillis: 5000,
});

// Verify the database connection
const connectToDatabase = async () => {
  try {
    const client = await pool.connect();

    console.log(`Connected to PostgreSQL in ${NODE_ENV} mode`);

    client.release();
  } catch (error) {
    console.error("Error connecting to database:", error);
    await pool.end();
    process.exit(1);
  }
};

export { pool };
export default connectToDatabase;
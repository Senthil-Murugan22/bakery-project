const { Pool } = require("pg");

// Use Render / cloud DB URL if available, else fallback to local
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/bakery",
  ssl: process.env.DATABASE_URL
    ? { rejectUnauthorized: false }  // required for Render / cloud DB
    : false
});

module.exports = pool;
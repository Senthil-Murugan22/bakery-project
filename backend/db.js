const { Pool } = require("pg");

const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "bakery",
  password: "postgres",
  port: 5432,
});

module.exports = pool;
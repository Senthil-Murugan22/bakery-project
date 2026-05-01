const express = require("express");
const cors = require("cors");
const bcrypt = require("bcrypt");
const pool = require("./db");

const app = express();

/* ------------------- MIDDLEWARE ------------------- */
app.use(express.json());

app.use(cors({
  origin: [
    "https://sarshomebakers.netlify.app"
  ],
  methods: ["GET", "POST"],
  credentials: true
}));

/* ------------------- INIT DB ------------------- */
const initDB = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name TEXT,
        email TEXT UNIQUE,
        password TEXT
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id SERIAL PRIMARY KEY,
        username TEXT,
        items JSON,
        total INT
      );
    `);

    console.log("Tables ready ✅");
  } catch (err) {
    console.error("DB Init Error:", err);
  }
};

/* ------------------- HEALTH CHECK ------------------- */
app.get("/", (req, res) => {
  res.send("Sweet Bakery API Running 🍰");
});

/* ------------------- SIGNUP API ------------------- */
app.post("/signup", async (req, res) => {
  const { name, email, password } = req.body;

  try {
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "All fields required"
      });
    }

    const existingUser = await pool.query(
      "SELECT * FROM users WHERE email=$1",
      [email]
    );

    if (existingUser.rows.length > 0) {
      return res.json({
        success: false,
        message: "Email already exists"
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await pool.query(
      "INSERT INTO users (name, email, password) VALUES ($1,$2,$3)",
      [name, email, hashedPassword]
    );

    res.json({
      success: true,
      message: "Signup successful"
    });

  } catch (err) {
    console.error("Signup Error:", err);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});

/* ------------------- LOGIN API ------------------- */
app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await pool.query(
      "SELECT * FROM users WHERE email=$1",
      [email]
    );

    if (user.rows.length === 0) {
      return res.json({
        success: false,
        message: "User not found"
      });
    }

    const valid = await bcrypt.compare(
      password,
      user.rows[0].password
    );

    if (valid) {
      res.json({
        success: true,
        name: user.rows[0].name
      });
    } else {
      res.json({
        success: false,
        message: "Invalid credentials"
      });
    }

  } catch (err) {
    console.error("Login Error:", err);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});

/* ------------------- CHECKOUT API ------------------- */
app.post("/checkout", async (req, res) => {
  const { username, cart, total } = req.body;

  try {
    if (!username || !cart || !total) {
      return res.status(400).json({
        success: false,
        message: "Invalid order data"
      });
    }

    await pool.query(
      "INSERT INTO orders (username, items, total) VALUES ($1, $2, $3)",
      [username, JSON.stringify(cart), total]
    );

    res.json({
      success: true,
      message: "Order placed successfully"
    });

  } catch (err) {
    console.error("Checkout Error:", err);
    res.status(500).json({
      success: false,
      message: "Error placing order"
    });
  }
});

/* ------------------- START SERVER ------------------- */
const PORT = process.env.PORT || 3000;

app.listen(PORT, async () => {
  console.log("Server running on port", PORT);
  await initDB(); // ✅ create tables automatically
});
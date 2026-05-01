const express = require("express");
const cors = require("cors");
const bcrypt = require("bcrypt");
const pool = require("./db");

const app = express();

app.use(cors());
app.use(express.json());

/* ------------------- HEALTH CHECK ------------------- */
app.get("/", (req, res) => {
  res.send("Sweet Bakery API Running 🍰");
});

/* ------------------- SIGNUP API ------------------- */
app.post("/signup", async (req, res) => {
  const { name, email, password } = req.body;

  try {
    // check existing user
    const existingUser = await pool.query(
      "SELECT * FROM users WHERE email=$1",
      [email]
    );

    if (existingUser.rows.length > 0) {
      return res.json({ success: false, message: "Email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await pool.query(
      "INSERT INTO users (name, email, password) VALUES ($1,$2,$3)",
      [name, email, hashedPassword]
    );

    res.json({ success: true, message: "Signup successful" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
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
      return res.json({ success: false, message: "User not found" });
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
      res.json({ success: false, message: "Invalid credentials" });
    }

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

/* ------------------- CHECKOUT API ------------------- */
app.post("/checkout", async (req, res) => {
  const { username, cart, total } = req.body;

  try {
    await pool.query(
      "INSERT INTO orders (username, items, total) VALUES ($1, $2, $3)",
      [username, JSON.stringify(cart), total]
    );

    res.json({ success: true, message: "Order placed successfully" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Error placing order" });
  }
});

/* ------------------- START SERVER ------------------- */
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});
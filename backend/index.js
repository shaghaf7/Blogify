const express = require("express");
const mysql = require("mysql2/promise");
const fs = require("fs");
const cors = require("cors");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const { GoogleGenerativeAI } = require("@google/generative-ai");

// Gemini API setup
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const app = express();

app.use(
  cors({
    origin: "http://localhost:5173",
    methods: "GET,POST,PUT,DELETE",
    credentials: true,
  })
);

// Parse JSON and URL-encoded bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// JWT Secret from environment
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.error("JWT_SECRET not set in .env file");
  process.exit(1);
}

// MySQL connection pool with SSL
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: {
    ca: fs.readFileSync(process.env.DB_CA_PATH),
  },
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});


// Create tables on startup if not exist
(async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    console.log("Users table ready.");

    await pool.query(`
      CREATE TABLE IF NOT EXISTS blogs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        content TEXT NOT NULL,
        author_id INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
    console.log("Blogs table ready.");
  } catch (err) {
    console.error("Error creating tables:", err);
    process.exit(1);
  }
})();

// JWT verification middleware
function verifyToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  if (!authHeader)
    return res.status(401).json({ error: "Access token required" });

  const token = authHeader.split(" ")[1]; // Expect Bearer TOKEN
  if (!token) return res.status(401).json({ error: "Access token required" });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: "Invalid token" });
    req.user = user; // Attach payload
    next();
  });
}

// Signup route
app.post("/signup", async (req, res) => {
  const { username, password, email } = req.body;
  if (!username || !password || !email) {
    return res.status(400).json({ error: "All fields required" });
  }

  if (password.length < 8) {
    return res
      .status(400)
      .json({ error: "Password must be at least 8 characters long" });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: "Invalid email format" });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 12);

    const [results] = await pool.query(
      "INSERT INTO users (username, password, email) VALUES (?, ?, ?)",
      [username, hashedPassword, email]
    );

    const token = jwt.sign(
      { id: results.insertId, username },
      JWT_SECRET,
      { expiresIn: "24h" }
    );

    res.status(201).json({
      message: "User created successfully",
      token,
      user: {
        id: results.insertId,
        username,
        email,
      },
    });
  } catch (err) {
    console.error(err);
    if (err.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ error: "Username or email already exists" });
    }
    res.status(500).json({ error: "Server error" });
  }
});

// Login route
app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password)
    return res.status(400).json({ error: "Username and password required" });

  try {
    const [results] = await pool.query(
      "SELECT id, username, password, email FROM users WHERE username = ? OR email = ?",
      [username, username]
    );

    if (results.length === 0)
      return res.status(401).json({ error: "Invalid credentials" });

    const user = results[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ error: "Invalid credentials" });

    const token = jwt.sign(
      { id: user.id, username: user.username },
      JWT_SECRET,
      { expiresIn: "24h" }
    );

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// Get all blogs (public)
app.get("/blogs", async (req, res) => {
  try {
    const [blogs] = await pool.query(`
      SELECT b.id, b.title, b.content, u.username 
      FROM blogs b
      JOIN users u ON b.author_id = u.id
      ORDER BY b.created_at DESC
    `);

    res.json({ blogs });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error fetching blogs" });
  }
});

// Add blog route (protected using localstorage )
app.post("/addblog", verifyToken, async (req, res) => {
  const { title, content } = req.body;
  if (!title || !content)
    return res.status(400).json({ error: "Title and content required" });

  try {
    const [result] = await pool.query(
      "INSERT INTO blogs (title, content, author_id) VALUES (?, ?, ?)",
      [title, content, req.user.id]
    );

    res.status(201).json({
      message: "Blog added successfully",
      blog: { id: result.insertId, title, content, author_id: req.user.id },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// Get blogs by logged-in user (protected using local storage at client side )
app.get("/myblogs", verifyToken, async (req, res) => {
  try {
    const [blogs] = await pool.query(
      "SELECT * FROM blogs WHERE author_id = ? ORDER BY created_at DESC",
      [req.user.id]
    );
    res.json({ blogs });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// Test route
app.get("/", (req, res) => {
  res.send("Hello from enhanced blog backend!");
  
});
app.post("/autoblog", verifyToken, async (req, res) => {
  const { title } = req.body;
  if (!title) {
    return res.status(400).json({ error: "Title is required" });
  }

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    const prompt = `
      Write a concise blog post (maximum 200 words) about "${title}".
      Make it engaging and clear, with a short introduction, 1–2 key points, and a closing sentence.
      Avoid overly long descriptions or unnecessary details.
    `;

    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=" + apiKey,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: prompt }],
            },
          ],
        }),
      }
    );

    const data = await response.json();

    const content =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "No content generated.";

    const [dbResult] = await pool.query(
      "INSERT INTO blogs (title, content, author_id) VALUES (?, ?, ?)",
      [title, content, req.user.id]
    );

    res.status(201).json({
      message: "Concise blog generated and saved successfully",
      blog: { id: dbResult.insertId, title, content },
    });
  } catch (err) {
    console.error("Error generating blog:", err);
    res.status(500).json({ error: "Failed to generate blog" });
  }
});

// Post an already generated blog into blogs table (protected)
app.post("/postblog", verifyToken, async (req, res) => {
  const { title, content } = req.body;

  if (!title || !content) {
    return res.status(400).json({ error: "Title and content are required" });
  }

  try {
    const [result] = await pool.query(
      "INSERT INTO blogs (title, content, author_id) VALUES (?, ?, ?)",
      [title, content, req.user.id]
    );

    res.status(201).json({
      message: "Blog posted successfully",
      blog: { id: result.insertId, title, content, author_id: req.user.id },
    });
  } catch (err) {
    console.error("Error posting blog:", err);
    res.status(500).json({ error: "Failed to post blog" });
  }
});


// Start server after DB connection test
pool
  .getConnection()
  .then((connection) => {
    connection.release();
    app.listen(3000,'0.0.0.0', () => console.log("Server running on port 3000"));
  })
  .catch((err) => {
    console.error("Database connection failed:", err);
    process.exit(1);
  });
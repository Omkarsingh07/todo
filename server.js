const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const path = require("path");
const { Pool } = require("pg");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname)));

// PostgreSQL connection (Render ka DATABASE_URL use hoga)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false, // Render ke liye required
  },
});

// Initialize database connection and table
async function initializeDatabase() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS todos (
        id SERIAL PRIMARY KEY,
        text TEXT NOT NULL,
        date DATE NOT NULL,
        completed BOOLEAN DEFAULT FALSE,
        completion_percentage INT DEFAULT 0,
        reason TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        completed_at TIMESTAMP NULL
      )
    `);
    console.log("Database initialized successfully ✅");
  } catch (error) {
    console.error("Database initialization error:", error);
    process.exit(1);
  }
}

// Routes

// Serve the main HTML file
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// Get todos for a specific date
app.get("/api/todos/:date", async (req, res) => {
  try {
    const { date } = req.params;
    const result = await pool.query(
      "SELECT * FROM todos WHERE date = $1 ORDER BY created_at ASC",
      [date]
    );
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching todos:", error);
    res.status(500).json({ error: "Failed to fetch todos" });
  }
});

// Add a new todo
app.post("/api/todos", async (req, res) => {
  try {
    const { text, date } = req.body;

    if (!text || !date) {
      return res.status(400).json({ error: "Text and date are required" });
    }

    const result = await pool.query(
      "INSERT INTO todos (text, date) VALUES ($1, $2) RETURNING *",
      [text, date]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error adding todo:", error);
    res.status(500).json({ error: "Failed to add todo" });
  }
});

// Update todo completion
app.put("/api/todos/:id/complete", async (req, res) => {
  try {
    const { id } = req.params;
    const { completionPercentage, reason } = req.body;

    if (
      completionPercentage === undefined ||
      completionPercentage < 0 ||
      completionPercentage > 100
    ) {
      return res
        .status(400)
        .json({ error: "Valid completion percentage is required" });
    }

    const result = await pool.query(
      `UPDATE todos 
       SET completed = TRUE, 
           completion_percentage = $1, 
           reason = $2, 
           completed_at = CURRENT_TIMESTAMP 
       WHERE id = $3 
       RETURNING *`,
      [completionPercentage, reason || null, id]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error updating todo:", error);
    res.status(500).json({ error: "Failed to update todo" });
  }
});

// Delete a todo
app.delete("/api/todos/:id", async (req, res) => {
  try {
    const { id } = req.params;

    await pool.query("DELETE FROM todos WHERE id = $1", [id]);

    res.json({ message: "Todo deleted successfully" });
  } catch (error) {
    console.error("Error deleting todo:", error);
    res.status(500).json({ error: "Failed to delete todo" });
  }
});

// Get statistics for a specific date
app.get("/api/stats/:date", async (req, res) => {
  try {
    const { date } = req.params;

    const result = await pool.query(
      `
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN completed = true THEN 1 ELSE 0 END) as completed,
        SUM(CASE WHEN completed = false THEN 1 ELSE 0 END) as pending
      FROM todos 
      WHERE date = $1
      `,
      [date]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error fetching stats:", error);
    res.status(500).json({ error: "Failed to fetch statistics" });
  }
});

// Start server
async function startServer() {
  await initializeDatabase();

  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

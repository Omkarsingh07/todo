const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname)));

// MySQL connection configuration
const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: 'omkar123@', // Change this to your MySQL password
    database: 'todo_app'
};

let connection;

// Initialize database connection
async function initializeDatabase() {
    try {
        // Create connection without database first
        const tempConnection = await mysql.createConnection({
            host: dbConfig.host,
            user: dbConfig.user,
            password: dbConfig.password
        });

        // Create database if it doesn't exist
        await tempConnection.execute('CREATE DATABASE IF NOT EXISTS todo_app');
        await tempConnection.end();

        // Connect to the database
        connection = await mysql.createConnection(dbConfig);
        
        // Create todos table if it doesn't exist
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS todos (
                id INT AUTO_INCREMENT PRIMARY KEY,
                text TEXT NOT NULL,
                date DATE NOT NULL,
                completed BOOLEAN DEFAULT FALSE,
                completion_percentage INT DEFAULT 0,
                reason TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                completed_at TIMESTAMP NULL
            )
        `);

        console.log('Database initialized successfully');
    } catch (error) {
        console.error('Database initialization error:', error);
        process.exit(1);
    }
}

// Routes

// Serve the main HTML file
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Get todos for a specific date
app.get('/api/todos/:date', async (req, res) => {
    try {
        const { date } = req.params;
        const [rows] = await connection.execute(
            'SELECT * FROM todos WHERE date = ? ORDER BY created_at ASC',
            [date]
        );
        res.json(rows);
    } catch (error) {
        console.error('Error fetching todos:', error);
        res.status(500).json({ error: 'Failed to fetch todos' });
    }
});

// Add a new todo
app.post('/api/todos', async (req, res) => {
    try {
        const { text, date } = req.body;
        
        if (!text || !date) {
            return res.status(400).json({ error: 'Text and date are required' });
        }

        const [result] = await connection.execute(
            'INSERT INTO todos (text, date) VALUES (?, ?)',
            [text, date]
        );

        const [newTodo] = await connection.execute(
            'SELECT * FROM todos WHERE id = ?',
            [result.insertId]
        );

        res.json(newTodo[0]);
    } catch (error) {
        console.error('Error adding todo:', error);
        res.status(500).json({ error: 'Failed to add todo' });
    }
});

// Update todo completion
app.put('/api/todos/:id/complete', async (req, res) => {
    try {
        const { id } = req.params;
        const { completionPercentage, reason } = req.body;

        if (completionPercentage === undefined || completionPercentage < 0 || completionPercentage > 100) {
            return res.status(400).json({ error: 'Valid completion percentage is required' });
        }

        await connection.execute(
            'UPDATE todos SET completed = TRUE, completion_percentage = ?, reason = ?, completed_at = CURRENT_TIMESTAMP WHERE id = ?',
            [completionPercentage, reason || null, id]
        );

        const [updatedTodo] = await connection.execute(
            'SELECT * FROM todos WHERE id = ?',
            [id]
        );

        res.json(updatedTodo[0]);
    } catch (error) {
        console.error('Error updating todo:', error);
        res.status(500).json({ error: 'Failed to update todo' });
    }
});

// Delete a todo
app.delete('/api/todos/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        await connection.execute('DELETE FROM todos WHERE id = ?', [id]);
        
        res.json({ message: 'Todo deleted successfully' });
    } catch (error) {
        console.error('Error deleting todo:', error);
        res.status(500).json({ error: 'Failed to delete todo' });
    }
});

// Get statistics for a specific date
app.get('/api/stats/:date', async (req, res) => {
    try {
        const { date } = req.params;
        
        const [stats] = await connection.execute(`
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN completed = 1 THEN 1 ELSE 0 END) as completed,
                SUM(CASE WHEN completed = 0 THEN 1 ELSE 0 END) as pending
            FROM todos 
            WHERE date = ?
        `, [date]);

        res.json(stats[0]);
    } catch (error) {
        console.error('Error fetching stats:', error);
        res.status(500).json({ error: 'Failed to fetch statistics' });
    }
});

// Start server
async function startServer() {
    await initializeDatabase();
    
    app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
        console.log('Make sure MySQL is running and update the database credentials in server.js if needed');
    });
}

startServer();

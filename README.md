# Todo App MySQL Setup

## Prerequisites
1. Make sure you have MySQL installed and running
2. Make sure you have Node.js installed

## Setup Instructions

### 1. Install MySQL (if not already installed)
- **macOS**: `brew install mysql` or download from https://dev.mysql.com/downloads/mysql/
- **Windows**: Download from https://dev.mysql.com/downloads/mysql/
- **Linux**: `sudo apt-get install mysql-server` or equivalent for your distribution

### 2. Start MySQL Service
- **macOS**: `brew services start mysql`
- **Windows**: Start MySQL service from Services
- **Linux**: `sudo systemctl start mysql`

### 3. Create MySQL User (Optional but recommended)
```sql
-- Connect to MySQL as root
mysql -u root -p

-- Create a new user for the todo app (optional)
CREATE USER 'todouser'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON todo_app.* TO 'todouser'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### 4. Update Database Configuration
Edit the `server.js` file and update the database configuration:

```javascript
const dbConfig = {
    host: 'localhost',
    user: 'root', // or 'todouser' if you created a new user
    password: 'your_mysql_password', // Your MySQL password
    database: 'todo_app'
};
```

### 5. Install Dependencies
Run the following command in the todo directory:
```bash
npm install
```

### 6. Start the Application
```bash
npm start
```

Or for development with auto-restart:
```bash
npm run dev
```

### 7. Access the Application
Open your browser and go to: http://localhost:3000

## Database Schema

The application will automatically create the database and table when you first run it. The table structure is:

```sql
CREATE TABLE todos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    text TEXT NOT NULL,
    date DATE NOT NULL,
    completed BOOLEAN DEFAULT FALSE,
    completion_percentage INT DEFAULT 0,
    reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL
);
```

## Troubleshooting

### Common Issues:

1. **Connection Error**: Make sure MySQL is running and credentials are correct
2. **Port 3000 in use**: Change the PORT in server.js or stop other services using port 3000
3. **Permission denied**: Make sure the MySQL user has proper permissions

### Check MySQL Status:
- **macOS**: `brew services list | grep mysql`
- **Linux**: `sudo systemctl status mysql`

### Reset MySQL Password:
If you forgot your MySQL password, you can reset it following MySQL documentation.

## API Endpoints

- `GET /api/todos/:date` - Get todos for a specific date
- `POST /api/todos` - Add a new todo
- `PUT /api/todos/:id/complete` - Mark todo as complete
- `DELETE /api/todos/:id` - Delete a todo
- `GET /api/stats/:date` - Get statistics for a date

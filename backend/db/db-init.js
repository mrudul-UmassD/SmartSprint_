const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Database file path
const dbPath = path.join(__dirname, 'smartsprint.db');

// Create a new database connection
const createConnection = () => {
  return new sqlite3.Database(dbPath, (err) => {
    if (err) {
      console.error('Error connecting to the database:', err.message);
    } else {
      console.log('Connected to the SQLite database.');
    }
  });
};

// Check if the database file exists
const databaseExists = () => {
  return fs.existsSync(dbPath);
};

// Initialize the database tables
const initTables = (db) => {
  return new Promise((resolve, reject) => {
    console.log('Initializing database tables...');
    
    // SQL statements for creating tables
    const createUserTable = `
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        role TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    const createProjectTable = `
      CREATE TABLE IF NOT EXISTS projects (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        status TEXT NOT NULL,
        created_by INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (created_by) REFERENCES users (id)
      )
    `;

    const createTaskTable = `
      CREATE TABLE IF NOT EXISTS tasks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT,
        status TEXT NOT NULL,
        priority TEXT NOT NULL,
        assigned_to INTEGER,
        project_id INTEGER NOT NULL,
        created_by INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (assigned_to) REFERENCES users (id),
        FOREIGN KEY (project_id) REFERENCES projects (id),
        FOREIGN KEY (created_by) REFERENCES users (id)
      )
    `;

    const createCommentTable = `
      CREATE TABLE IF NOT EXISTS comments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        content TEXT NOT NULL,
        task_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (task_id) REFERENCES tasks (id),
        FOREIGN KEY (user_id) REFERENCES users (id)
      )
    `;

    const createPerformanceLogTable = `
      CREATE TABLE IF NOT EXISTS performance_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        task_id INTEGER NOT NULL,
        time_spent INTEGER NOT NULL,
        completion_status TEXT NOT NULL,
        logged_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id),
        FOREIGN KEY (task_id) REFERENCES tasks (id)
      )
    `;

    // Execute all table creation statements
    db.serialize(() => {
      db.run(createUserTable, (err) => {
        if (err) {
          console.error('Error creating users table:', err.message);
          return reject(err);
        }
        console.log('Users table created or already exists');
      });

      db.run(createProjectTable, (err) => {
        if (err) {
          console.error('Error creating projects table:', err.message);
          return reject(err);
        }
        console.log('Projects table created or already exists');
      });

      db.run(createTaskTable, (err) => {
        if (err) {
          console.error('Error creating tasks table:', err.message);
          return reject(err);
        }
        console.log('Tasks table created or already exists');
      });

      db.run(createCommentTable, (err) => {
        if (err) {
          console.error('Error creating comments table:', err.message);
          return reject(err);
        }
        console.log('Comments table created or already exists');
      });

      db.run(createPerformanceLogTable, (err) => {
        if (err) {
          console.error('Error creating performance_logs table:', err.message);
          return reject(err);
        }
        console.log('Performance logs table created or already exists');
        resolve();
      });
    });
  });
};

// Main function to initialize the database
const initDatabase = async () => {
  try {
    const dbExists = databaseExists();
    const db = createConnection();
    
    if (!dbExists) {
      console.log('No existing database found. Creating a new one...');
    } else {
      console.log('Using existing database.');
    }
    
    await initTables(db);
    console.log('Database initialized successfully.');
    
    // Close connection after initialization
    db.close((err) => {
      if (err) {
        console.error('Error closing database connection:', err.message);
      } else {
        console.log('Database connection closed after initialization.');
      }
    });
    
    return true;
  } catch (error) {
    console.error('Database initialization failed:', error);
    return false;
  }
};

// Database helper to get a connection
const getConnection = () => {
  return createConnection();
};

module.exports = {
  initDatabase,
  getConnection
}; 
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');

// Ensure the data directory exists
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'smartsprint.db');
const db = new sqlite3.Database(dbPath);

// Initialize database
function initializeDatabase() {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Create Users table
      db.run(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          email TEXT UNIQUE NOT NULL,
          password TEXT NOT NULL,
          role TEXT NOT NULL,
          bio TEXT,
          department TEXT,
          location TEXT,
          phone TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `, (err) => {
        if (err) {
          console.error('Error creating users table:', err);
          reject(err);
          return;
        }
        console.log('Users table created or already exists');
      });

      // Create Projects table
      db.run(`
        CREATE TABLE IF NOT EXISTS projects (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          description TEXT,
          status TEXT NOT NULL,
          created_by INTEGER NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (created_by) REFERENCES users (id)
        )
      `, (err) => {
        if (err) {
          console.error('Error creating projects table:', err);
          reject(err);
          return;
        }
        console.log('Projects table created or already exists');
      });

      // Create Tasks table
      db.run(`
        CREATE TABLE IF NOT EXISTS tasks (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          title TEXT NOT NULL,
          description TEXT,
          status TEXT NOT NULL,
          priority TEXT NOT NULL,
          due_date DATETIME,
          project_id INTEGER NOT NULL,
          assigned_to INTEGER,
          created_by INTEGER NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (project_id) REFERENCES projects (id),
          FOREIGN KEY (assigned_to) REFERENCES users (id),
          FOREIGN KEY (created_by) REFERENCES users (id)
        )
      `, (err) => {
        if (err) {
          console.error('Error creating tasks table:', err);
          reject(err);
          return;
        }
        console.log('Tasks table created or already exists');
      });

      // Create Project_Users table (for users assigned to projects)
      db.run(`
        CREATE TABLE IF NOT EXISTS project_users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          project_id INTEGER NOT NULL,
          user_id INTEGER NOT NULL,
          role TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (project_id) REFERENCES projects (id),
          FOREIGN KEY (user_id) REFERENCES users (id),
          UNIQUE(project_id, user_id)
        )
      `, (err) => {
        if (err) {
          console.error('Error creating project_users table:', err);
          reject(err);
          return;
        }
        console.log('Project-Users table created or already exists');
      });

      // Create Comments table
      db.run(`
        CREATE TABLE IF NOT EXISTS comments (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          content TEXT NOT NULL,
          task_id INTEGER NOT NULL,
          user_id INTEGER NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (task_id) REFERENCES tasks (id),
          FOREIGN KEY (user_id) REFERENCES users (id)
        )
      `, (err) => {
        if (err) {
          console.error('Error creating comments table:', err);
          reject(err);
          return;
        }
        console.log('Comments table created or already exists');
      });

      // Create Performance logs table
      db.run(`
        CREATE TABLE IF NOT EXISTS performance_logs (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          task_id INTEGER NOT NULL,
          action TEXT NOT NULL,
          duration INTEGER,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users (id),
          FOREIGN KEY (task_id) REFERENCES tasks (id)
        )
      `, (err) => {
        if (err) {
          console.error('Error creating performance_logs table:', err);
          reject(err);
          return;
        }
        console.log('Performance logs table created or already exists');
      });

      // Check if users table is empty and add default admin if needed
      db.get('SELECT COUNT(*) as count FROM users', (err, row) => {
        if (err) {
          console.error('Error checking users table:', err);
          reject(err);
          return;
        }

        if (row.count === 0) {
          // Create default admin user
          const salt = bcrypt.genSaltSync(10);
          const hashedPassword = bcrypt.hashSync('admin', salt);
          
          db.run(
            'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
            ['Admin User', 'admin', hashedPassword, 'admin'],
            (err) => {
              if (err) {
                console.error('Error creating default admin user:', err);
                reject(err);
                return;
              }
              console.log('Default admin user created with credentials:');
              console.log('Username: admin');
              console.log('Password: admin');
              resolve();
            }
          );
        } else {
          resolve();
        }
      });
    });
  });
}

// Run initialization
initializeDatabase()
  .then(() => {
    console.log('Database initialized successfully.');
    db.close(() => {
      console.log('Database connection closed after initialization.');
    });
  })
  .catch((err) => {
    console.error('Database initialization failed:', err);
    db.close(() => {
      console.log('Database connection closed after initialization failure.');
    });
  });

module.exports = { db, initializeDatabase }; 
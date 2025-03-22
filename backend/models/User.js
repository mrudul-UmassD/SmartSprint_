const { getConnection } = require('../db/db-init');
const bcrypt = require('bcryptjs');

class User {
  constructor(id, name, email, password, role) {
    this.id = id;
    this.name = name;
    this.email = email;
    this.password = password;
    this.role = role;
  }

  // Find user by email
  static findByEmail(email) {
    return new Promise((resolve, reject) => {
      const db = getConnection();
      db.get('SELECT * FROM users WHERE email = ?', [email], (err, row) => {
        db.close();
        if (err) {
          return reject(err);
        }
        if (!row) {
          return resolve(null);
        }
        resolve(new User(row.id, row.name, row.email, row.password, row.role));
      });
    });
  }

  // Find user by ID
  static findById(id) {
    return new Promise((resolve, reject) => {
      const db = getConnection();
      db.get('SELECT * FROM users WHERE id = ?', [id], (err, row) => {
        db.close();
        if (err) {
          return reject(err);
        }
        if (!row) {
          return resolve(null);
        }
        resolve(new User(row.id, row.name, row.email, row.password, row.role));
      });
    });
  }

  // Get all users
  static findAll() {
    return new Promise((resolve, reject) => {
      const db = getConnection();
      db.all('SELECT id, name, email, role, created_at FROM users', [], (err, rows) => {
        db.close();
        if (err) {
          return reject(err);
        }
        resolve(rows);
      });
    });
  }

  // Create a new user
  static async create(name, email, password, role) {
    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    return new Promise((resolve, reject) => {
      const db = getConnection();
      db.run(
        'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
        [name, email, hashedPassword, role],
        function(err) {
          db.close();
          if (err) {
            return reject(err);
          }
          resolve({ id: this.lastID });
        }
      );
    });
  }

  // Update user
  static update(id, updates) {
    return new Promise((resolve, reject) => {
      // Build SQL based on fields to update
      let sql = 'UPDATE users SET ';
      const params = [];
      
      Object.keys(updates).forEach((key, i, arr) => {
        sql += `${key} = ?`;
        params.push(updates[key]);
        
        if (i < arr.length - 1) {
          sql += ', ';
        }
      });
      
      sql += ', updated_at = CURRENT_TIMESTAMP WHERE id = ?';
      params.push(id);
      
      const db = getConnection();
      db.run(sql, params, function(err) {
        db.close();
        if (err) {
          return reject(err);
        }
        resolve({ changes: this.changes });
      });
    });
  }

  // Delete user
  static delete(id) {
    return new Promise((resolve, reject) => {
      const db = getConnection();
      db.run('DELETE FROM users WHERE id = ?', [id], function(err) {
        db.close();
        if (err) {
          return reject(err);
        }
        resolve({ changes: this.changes });
      });
    });
  }

  // Check password
  async comparePassword(password) {
    return await bcrypt.compare(password, this.password);
  }

  // Return user data without password
  toJSON() {
    return {
      id: this.id,
      name: this.name,
      email: this.email,
      role: this.role
    };
  }
}

module.exports = User; 
const db = require('../db/db');
const bcrypt = require('bcryptjs');

// Define role hierarchy
const ROLE_HIERARCHY = {
  'admin': 3,
  'project_manager': 2,
  'developer': 1,
  'viewer': 0
};

class User {
  constructor(id, name, email, password, role) {
    this.id = id;
    this.name = name;
    this.email = email;
    this.password = password;
    this.role = role;
  }

  // Find user by email
  static async findByEmail(email) {
    return new Promise((resolve, reject) => {
      // Only find user if it looks like an email (contains @)
      if (!email || !email.includes('@')) {
        resolve(null);
        return;
      }
      
      db.get('SELECT * FROM users WHERE email = ?', [email], (err, user) => {
        if (err) {
          reject(err);
          return;
        }

        if (user) {
          // Add comparePassword method to user object
          user.comparePassword = async function(password) {
            return bcrypt.compare(password, this.password);
          };
        }

        resolve(user);
      });
    });
  }

  // Find user by ID
  static async findById(id) {
    return new Promise((resolve, reject) => {
      db.get('SELECT * FROM users WHERE id = ?', [id], (err, user) => {
        if (err) {
          reject(err);
          return;
        }
        
        if (user) {
          // Add comparePassword method to user object
          user.comparePassword = async function(password) {
            return bcrypt.compare(password, this.password);
          };
        }
        
        resolve(user);
      });
    });
  }

  // Find user by username (used when input is not an email)
  static async findByUsername(username) {
    return new Promise((resolve, reject) => {
      // Skip if username is empty or contains @ (which means it's an email)
      if (!username || username.includes('@')) {
        resolve(null);
        return;
      }
      
      // In this case we're checking if the email column matches this username
      // This is useful for the admin user where "admin" is used as the email/username
      db.get('SELECT * FROM users WHERE email = ?', [username], (err, user) => {
        if (err) {
          reject(err);
          return;
        }

        if (user) {
          // Add comparePassword method to user object
          user.comparePassword = async function(password) {
            return bcrypt.compare(password, this.password);
          };
        }

        resolve(user);
      });
    });
  }

  // Get all users
  static async findAll() {
    return new Promise((resolve, reject) => {
      db.all('SELECT id, name, email, role FROM users', (err, users) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(users);
      });
    });
  }

  // Create a new user
  static async create(name, email, password, role = 'developer') {
    return new Promise((resolve, reject) => {
      // Hash password
      const salt = bcrypt.genSaltSync(10);
      const hashedPassword = bcrypt.hashSync(password, salt);

      // Validate role
      if (!ROLE_HIERARCHY.hasOwnProperty(role)) {
        reject(new Error('Invalid role'));
        return;
      }

      // Insert user into database
      db.run(
        'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
        [name, email, hashedPassword, role],
        function(err) {
          if (err) {
            reject(err);
            return;
          }
          resolve({ id: this.lastID });
        }
      );
    });
  }

  // Update user password
  static async updatePassword(userId, newPassword) {
    return new Promise((resolve, reject) => {
      // Hash password
      const salt = bcrypt.genSaltSync(10);
      const hashedPassword = bcrypt.hashSync(newPassword, salt);
      
      // Update user in database
      db.run(
        'UPDATE users SET password = ? WHERE id = ?',
        [hashedPassword, userId],
        function(err) {
          if (err) {
            reject(err);
            return;
          }
          resolve({ success: this.changes > 0 });
        }
      );
    });
  }

  // Helper to check if a user can create another user with a specific role
  static canCreateUser(creatorRole, newUserRole) {
    const creatorRank = ROLE_HIERARCHY[creatorRole] || 0;
    const newUserRank = ROLE_HIERARCHY[newUserRole] || 0;
    
    // User can only create users with lower rank
    return creatorRank > newUserRank;
  }

  // Method to create a user by another user, checking permissions
  static async createByUser(creatorRole, name, email, password, role = 'developer') {
    return new Promise((resolve, reject) => {
      // Ensure creator has sufficient permissions
      if (!this.canCreateUser(creatorRole, role)) {
        reject(new Error(`Users with role '${creatorRole}' cannot create users with role '${role}'`));
        return;
      }

      // Create the user
      this.create(name, email, password, role)
        .then(resolve)
        .catch(reject);
    });
  }

  // Update user
  static async update(id, updates) {
    return new Promise((resolve, reject) => {
      // Build SQL query
      const keys = Object.keys(updates);
      const values = Object.values(updates);

      if (keys.length === 0) {
        resolve({ changes: 0 });
        return;
      }

      const setClause = keys.map(key => `${key} = ?`).join(', ');
      const sql = `UPDATE users SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;

      // Execute query
      db.run(sql, [...values, id], function(err) {
        if (err) {
          reject(err);
          return;
        }
        resolve({ changes: this.changes });
      });
    });
  }

  // Delete user
  static async delete(id) {
    return new Promise((resolve, reject) => {
      db.run('DELETE FROM users WHERE id = ?', [id], function(err) {
        if (err) {
          reject(err);
          return;
        }
        resolve({ changes: this.changes });
      });
    });
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
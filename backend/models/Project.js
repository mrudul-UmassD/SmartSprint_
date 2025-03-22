const { getConnection } = require('../db/db-init');

class Project {
  constructor(id, name, description, status, created_by) {
    this.id = id;
    this.name = name;
    this.description = description;
    this.status = status;
    this.created_by = created_by;
  }

  // Get all projects
  static findAll() {
    return new Promise((resolve, reject) => {
      const db = getConnection();
      db.all(`
        SELECT p.*, u.name as creator_name 
        FROM projects p
        LEFT JOIN users u ON p.created_by = u.id
        ORDER BY p.created_at DESC
      `, [], (err, rows) => {
        db.close();
        if (err) {
          return reject(err);
        }
        resolve(rows);
      });
    });
  }

  // Find project by ID
  static findById(id) {
    return new Promise((resolve, reject) => {
      const db = getConnection();
      db.get(`
        SELECT p.*, u.name as creator_name 
        FROM projects p
        LEFT JOIN users u ON p.created_by = u.id
        WHERE p.id = ?
      `, [id], (err, row) => {
        if (err) {
          db.close();
          return reject(err);
        }
        
        if (!row) {
          db.close();
          return resolve(null);
        }
        
        // Get tasks for this project
        db.all(`
          SELECT t.*, u.name as assignee_name
          FROM tasks t
          LEFT JOIN users u ON t.assigned_to = u.id
          WHERE t.project_id = ?
          ORDER BY t.created_at DESC
        `, [id], (err, tasks) => {
          db.close();
          if (err) {
            return reject(err);
          }
          
          row.tasks = tasks || [];
          resolve(row);
        });
      });
    });
  }

  // Create a new project
  static create(name, description, status, created_by) {
    return new Promise((resolve, reject) => {
      const db = getConnection();
      db.run(
        'INSERT INTO projects (name, description, status, created_by) VALUES (?, ?, ?, ?)',
        [name, description, status, created_by],
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

  // Update project
  static update(id, updates) {
    return new Promise((resolve, reject) => {
      // Build SQL based on fields to update
      let sql = 'UPDATE projects SET ';
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

  // Delete project
  static delete(id) {
    return new Promise((resolve, reject) => {
      const db = getConnection();
      
      // Begin transaction to delete project and its tasks
      db.serialize(() => {
        db.run('BEGIN TRANSACTION');
        
        // Delete tasks in this project first
        db.run('DELETE FROM tasks WHERE project_id = ?', [id], (err) => {
          if (err) {
            db.run('ROLLBACK');
            db.close();
            return reject(err);
          }
          
          // Then delete the project
          db.run('DELETE FROM projects WHERE id = ?', [id], function(err) {
            if (err) {
              db.run('ROLLBACK');
              db.close();
              return reject(err);
            }
            
            db.run('COMMIT');
            db.close();
            resolve({ changes: this.changes });
          });
        });
      });
    });
  }

  // Get projects by user
  static findByUser(userId) {
    return new Promise((resolve, reject) => {
      const db = getConnection();
      db.all(`
        SELECT p.*, u.name as creator_name 
        FROM projects p
        LEFT JOIN users u ON p.created_by = u.id
        WHERE p.created_by = ?
        ORDER BY p.created_at DESC
      `, [userId], (err, rows) => {
        db.close();
        if (err) {
          return reject(err);
        }
        resolve(rows);
      });
    });
  }
}

module.exports = Project; 
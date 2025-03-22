const { getConnection } = require('../db/db-init');

class Task {
  constructor(id, title, description, status, priority, assigned_to, project_id, created_by) {
    this.id = id;
    this.title = title;
    this.description = description;
    this.status = status;
    this.priority = priority;
    this.assigned_to = assigned_to;
    this.project_id = project_id;
    this.created_by = created_by;
  }

  // Get all tasks
  static findAll() {
    return new Promise((resolve, reject) => {
      const db = getConnection();
      db.all(`
        SELECT t.*, 
               u1.name as assignee_name,
               u2.name as creator_name,
               p.name as project_name
        FROM tasks t
        LEFT JOIN users u1 ON t.assigned_to = u1.id
        LEFT JOIN users u2 ON t.created_by = u2.id
        LEFT JOIN projects p ON t.project_id = p.id
        ORDER BY t.created_at DESC
      `, [], (err, rows) => {
        db.close();
        if (err) {
          return reject(err);
        }
        resolve(rows);
      });
    });
  }

  // Find task by ID
  static findById(id) {
    return new Promise((resolve, reject) => {
      const db = getConnection();
      db.get(`
        SELECT t.*, 
               u1.name as assignee_name,
               u2.name as creator_name,
               p.name as project_name
        FROM tasks t
        LEFT JOIN users u1 ON t.assigned_to = u1.id
        LEFT JOIN users u2 ON t.created_by = u2.id
        LEFT JOIN projects p ON t.project_id = p.id
        WHERE t.id = ?
      `, [id], (err, row) => {
        if (err) {
          db.close();
          return reject(err);
        }
        
        if (!row) {
          db.close();
          return resolve(null);
        }
        
        // Get comments for this task
        db.all(`
          SELECT c.*, u.name as user_name
          FROM comments c
          LEFT JOIN users u ON c.user_id = u.id
          WHERE c.task_id = ?
          ORDER BY c.created_at ASC
        `, [id], (err, comments) => {
          db.close();
          if (err) {
            return reject(err);
          }
          
          row.comments = comments || [];
          resolve(row);
        });
      });
    });
  }

  // Create a new task
  static create(title, description, status, priority, assigned_to, project_id, created_by) {
    return new Promise((resolve, reject) => {
      const db = getConnection();
      db.run(
        'INSERT INTO tasks (title, description, status, priority, assigned_to, project_id, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [title, description, status, priority, assigned_to, project_id, created_by],
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

  // Update task
  static update(id, updates) {
    return new Promise((resolve, reject) => {
      // Build SQL based on fields to update
      let sql = 'UPDATE tasks SET ';
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

  // Delete task
  static delete(id) {
    return new Promise((resolve, reject) => {
      const db = getConnection();
      
      // Begin transaction to delete task and its comments
      db.serialize(() => {
        db.run('BEGIN TRANSACTION');
        
        // Delete comments for this task first
        db.run('DELETE FROM comments WHERE task_id = ?', [id], (err) => {
          if (err) {
            db.run('ROLLBACK');
            db.close();
            return reject(err);
          }
          
          // Delete performance logs for this task
          db.run('DELETE FROM performance_logs WHERE task_id = ?', [id], (err) => {
            if (err) {
              db.run('ROLLBACK');
              db.close();
              return reject(err);
            }
            
            // Then delete the task
            db.run('DELETE FROM tasks WHERE id = ?', [id], function(err) {
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
    });
  }

  // Get tasks by user (assigned to)
  static findByAssignee(userId) {
    return new Promise((resolve, reject) => {
      const db = getConnection();
      db.all(`
        SELECT t.*, 
               u1.name as assignee_name,
               u2.name as creator_name,
               p.name as project_name
        FROM tasks t
        LEFT JOIN users u1 ON t.assigned_to = u1.id
        LEFT JOIN users u2 ON t.created_by = u2.id
        LEFT JOIN projects p ON t.project_id = p.id
        WHERE t.assigned_to = ?
        ORDER BY t.created_at DESC
      `, [userId], (err, rows) => {
        db.close();
        if (err) {
          return reject(err);
        }
        resolve(rows);
      });
    });
  }

  // Get tasks by project
  static findByProject(projectId) {
    return new Promise((resolve, reject) => {
      const db = getConnection();
      db.all(`
        SELECT t.*, 
               u1.name as assignee_name,
               u2.name as creator_name
        FROM tasks t
        LEFT JOIN users u1 ON t.assigned_to = u1.id
        LEFT JOIN users u2 ON t.created_by = u2.id
        WHERE t.project_id = ?
        ORDER BY 
          CASE 
            WHEN t.status = 'Created' THEN 1
            WHEN t.status = 'Assigned' THEN 2
            WHEN t.status = 'In Progress' THEN 3
            WHEN t.status = 'Submitted' THEN 4
            WHEN t.status = 'Under Review' THEN 5
            WHEN t.status = 'Approved' THEN 6
            WHEN t.status = 'Rejected' THEN 7
            ELSE 8
          END,
          CASE 
            WHEN t.priority = 'High' THEN 1
            WHEN t.priority = 'Medium' THEN 2
            WHEN t.priority = 'Low' THEN 3
            ELSE 4
          END,
          t.created_at DESC
      `, [projectId], (err, rows) => {
        db.close();
        if (err) {
          return reject(err);
        }
        resolve(rows);
      });
    });
  }
}

module.exports = Task; 
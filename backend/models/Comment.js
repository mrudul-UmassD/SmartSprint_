const { getConnection } = require('../db/db-init');

class Comment {
  constructor(id, content, task_id, user_id) {
    this.id = id;
    this.content = content;
    this.task_id = task_id;
    this.user_id = user_id;
  }

  // Get all comments for a task
  static findByTaskId(taskId) {
    return new Promise((resolve, reject) => {
      const db = getConnection();
      db.all(`
        SELECT c.*, u.name as user_name
        FROM comments c
        LEFT JOIN users u ON c.user_id = u.id
        WHERE c.task_id = ?
        ORDER BY c.created_at ASC
      `, [taskId], (err, rows) => {
        db.close();
        if (err) {
          return reject(err);
        }
        resolve(rows);
      });
    });
  }

  // Create a new comment
  static create(content, task_id, user_id) {
    return new Promise((resolve, reject) => {
      const db = getConnection();
      db.run(
        'INSERT INTO comments (content, task_id, user_id) VALUES (?, ?, ?)',
        [content, task_id, user_id],
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

  // Update comment
  static update(id, content) {
    return new Promise((resolve, reject) => {
      const db = getConnection();
      db.run(
        'UPDATE comments SET content = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [content, id],
        function(err) {
          db.close();
          if (err) {
            return reject(err);
          }
          resolve({ changes: this.changes });
        }
      );
    });
  }

  // Delete comment
  static delete(id) {
    return new Promise((resolve, reject) => {
      const db = getConnection();
      db.run('DELETE FROM comments WHERE id = ?', [id], function(err) {
        db.close();
        if (err) {
          return reject(err);
        }
        resolve({ changes: this.changes });
      });
    });
  }

  // Get a single comment by ID
  static findById(id) {
    return new Promise((resolve, reject) => {
      const db = getConnection();
      db.get(`
        SELECT c.*, u.name as user_name
        FROM comments c
        LEFT JOIN users u ON c.user_id = u.id
        WHERE c.id = ?
      `, [id], (err, row) => {
        db.close();
        if (err) {
          return reject(err);
        }
        if (!row) {
          return resolve(null);
        }
        resolve(row);
      });
    });
  }
}

module.exports = Comment; 
const { getConnection } = require('../db/db-init');

class PerformanceLog {
  constructor(id, user_id, task_id, time_spent, completion_status) {
    this.id = id;
    this.user_id = user_id;
    this.task_id = task_id;
    this.time_spent = time_spent;
    this.completion_status = completion_status;
  }

  // Get all logs
  static findAll() {
    return new Promise((resolve, reject) => {
      const db = getConnection();
      db.all(`
        SELECT pl.*, 
               u.name as user_name,
               t.title as task_title
        FROM performance_logs pl
        LEFT JOIN users u ON pl.user_id = u.id
        LEFT JOIN tasks t ON pl.task_id = t.id
        ORDER BY pl.logged_at DESC
      `, [], (err, rows) => {
        db.close();
        if (err) {
          return reject(err);
        }
        resolve(rows);
      });
    });
  }

  // Get logs by user
  static findByUser(userId) {
    return new Promise((resolve, reject) => {
      const db = getConnection();
      db.all(`
        SELECT pl.*, 
               u.name as user_name,
               t.title as task_title
        FROM performance_logs pl
        LEFT JOIN users u ON pl.user_id = u.id
        LEFT JOIN tasks t ON pl.task_id = t.id
        WHERE pl.user_id = ?
        ORDER BY pl.logged_at DESC
      `, [userId], (err, rows) => {
        db.close();
        if (err) {
          return reject(err);
        }
        resolve(rows);
      });
    });
  }

  // Get logs by task
  static findByTask(taskId) {
    return new Promise((resolve, reject) => {
      const db = getConnection();
      db.all(`
        SELECT pl.*, 
               u.name as user_name,
               t.title as task_title
        FROM performance_logs pl
        LEFT JOIN users u ON pl.user_id = u.id
        LEFT JOIN tasks t ON pl.task_id = t.id
        WHERE pl.task_id = ?
        ORDER BY pl.logged_at DESC
      `, [taskId], (err, rows) => {
        db.close();
        if (err) {
          return reject(err);
        }
        resolve(rows);
      });
    });
  }

  // Get logs by project
  static findByProject(projectId) {
    return new Promise((resolve, reject) => {
      const db = getConnection();
      db.all(`
        SELECT pl.*, 
               u.name as user_name,
               t.title as task_title
        FROM performance_logs pl
        LEFT JOIN users u ON pl.user_id = u.id
        LEFT JOIN tasks t ON pl.task_id = t.id
        WHERE t.project_id = ?
        ORDER BY pl.logged_at DESC
      `, [projectId], (err, rows) => {
        db.close();
        if (err) {
          return reject(err);
        }
        resolve(rows);
      });
    });
  }

  // Create a new log
  static create(user_id, task_id, time_spent, completion_status) {
    return new Promise((resolve, reject) => {
      const db = getConnection();
      db.run(
        'INSERT INTO performance_logs (user_id, task_id, time_spent, completion_status) VALUES (?, ?, ?, ?)',
        [user_id, task_id, time_spent, completion_status],
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
  
  // Get summary stats by user
  static getUserStats(userId) {
    return new Promise((resolve, reject) => {
      const db = getConnection();
      db.get(`
        SELECT 
          COUNT(*) as total_tasks,
          SUM(time_spent) as total_time,
          AVG(time_spent) as avg_time,
          COUNT(CASE WHEN completion_status = 'Completed' THEN 1 END) as completed_tasks,
          COUNT(CASE WHEN completion_status = 'Rejected' THEN 1 END) as rejected_tasks
        FROM performance_logs
        WHERE user_id = ?
      `, [userId], (err, stats) => {
        db.close();
        if (err) {
          return reject(err);
        }
        resolve(stats);
      });
    });
  }
  
  // Get summary stats by project
  static getProjectStats(projectId) {
    return new Promise((resolve, reject) => {
      const db = getConnection();
      db.get(`
        SELECT 
          COUNT(DISTINCT pl.task_id) as total_tasks,
          SUM(pl.time_spent) as total_time,
          AVG(pl.time_spent) as avg_time,
          COUNT(CASE WHEN pl.completion_status = 'Completed' THEN 1 END) as completed_tasks
        FROM performance_logs pl
        JOIN tasks t ON pl.task_id = t.id
        WHERE t.project_id = ?
      `, [projectId], (err, stats) => {
        db.close();
        if (err) {
          return reject(err);
        }
        resolve(stats);
      });
    });
  }
}

module.exports = PerformanceLog; 
const express = require('express');
const Task = require('../models/Task');
const Comment = require('../models/Comment');
const PerformanceLog = require('../models/PerformanceLog');
const { authMiddleware, roleCheck } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/tasks
// @desc    Get all tasks
// @access  Private
router.get('/', authMiddleware, async (req, res) => {
  try {
    let tasks;
    
    // Project managers see all tasks, developers see only assigned tasks
    if (req.userRole === 'project_manager') {
      tasks = await Task.findAll();
    } else {
      tasks = await Task.findByAssignee(req.userId);
    }
    
    return res.status(200).json({
      success: true,
      data: tasks
    });
  } catch (error) {
    console.error('Get tasks error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   GET /api/tasks/project/:id
// @desc    Get tasks by project ID
// @access  Private
router.get('/project/:id', authMiddleware, async (req, res) => {
  try {
    const projectId = req.params.id;
    const tasks = await Task.findByProject(projectId);
    
    return res.status(200).json({
      success: true,
      data: tasks
    });
  } catch (error) {
    console.error('Get tasks by project error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   GET /api/tasks/:id
// @desc    Get task by ID
// @access  Private
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const taskId = req.params.id;
    const task = await Task.findById(taskId);
    
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }
    
    // All authenticated users can view tasks
    return res.status(200).json({
      success: true,
      data: task
    });
  } catch (error) {
    console.error('Get task error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   POST /api/tasks
// @desc    Create a new task
// @access  Private (project managers)
router.post('/', authMiddleware, roleCheck(['project_manager']), async (req, res) => {
  try {
    const { title, description, status, priority, assigned_to, project_id } = req.body;
    
    // Validate input
    if (!title || !project_id) {
      return res.status(400).json({
        success: false,
        message: 'Task title and project ID are required'
      });
    }
    
    // Set defaults if not provided
    const taskStatus = status || 'Created';
    const taskPriority = priority || 'Medium';
    
    // Create task
    const result = await Task.create(
      title, 
      description, 
      taskStatus, 
      taskPriority, 
      assigned_to, 
      project_id, 
      req.userId
    );
    
    if (!result.id) {
      return res.status(400).json({
        success: false,
        message: 'Failed to create task'
      });
    }
    
    // Get the newly created task
    const task = await Task.findById(result.id);
    
    return res.status(201).json({
      success: true,
      data: task
    });
  } catch (error) {
    console.error('Create task error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   PUT /api/tasks/:id
// @desc    Update task
// @access  Private
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const taskId = req.params.id;
    const { title, description, status, priority, assigned_to } = req.body;
    
    // Get the task to check permissions
    const task = await Task.findById(taskId);
    
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }
    
    // Developers can only update status of their own tasks
    if (req.userRole !== 'project_manager') {
      if (task.assigned_to !== req.userId) {
        return res.status(403).json({
          success: false,
          message: 'You can only update tasks assigned to you'
        });
      }
      
      // If developer, they can only update status
      const updates = {};
      if (status) updates.status = status;
      
      // Update task
      await Task.update(taskId, updates);
      
      // If status changed to completed, log performance
      if (status && (status === 'Submitted' || status === 'Approved')) {
        await PerformanceLog.create(
          req.userId,
          taskId,
          Math.floor(Math.random() * 8) + 1, // Random hours between 1-8 for demo
          status === 'Approved' ? 'Completed' : 'Pending'
        );
      }
    } else {
      // Project managers can update everything
      const updates = {};
      if (title) updates.title = title;
      if (description !== undefined) updates.description = description;
      if (status) updates.status = status;
      if (priority) updates.priority = priority;
      if (assigned_to) updates.assigned_to = assigned_to;
      
      // Update task
      await Task.update(taskId, updates);
    }
    
    // Get updated task
    const updatedTask = await Task.findById(taskId);
    
    return res.status(200).json({
      success: true,
      data: updatedTask
    });
  } catch (error) {
    console.error('Update task error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   DELETE /api/tasks/:id
// @desc    Delete task
// @access  Private (project managers)
router.delete('/:id', authMiddleware, roleCheck(['project_manager']), async (req, res) => {
  try {
    const taskId = req.params.id;
    
    // Check if task exists
    const task = await Task.findById(taskId);
    
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }
    
    // Delete task
    const result = await Task.delete(taskId);
    
    if (!result.changes) {
      return res.status(500).json({
        success: false,
        message: 'Failed to delete task'
      });
    }
    
    return res.status(200).json({
      success: true,
      message: 'Task deleted successfully'
    });
  } catch (error) {
    console.error('Delete task error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   POST /api/tasks/:id/comments
// @desc    Add comment to task
// @access  Private
router.post('/:id/comments', authMiddleware, async (req, res) => {
  try {
    const taskId = req.params.id;
    const { content } = req.body;
    
    // Validate input
    if (!content) {
      return res.status(400).json({
        success: false,
        message: 'Comment content is required'
      });
    }
    
    // Check if task exists
    const task = await Task.findById(taskId);
    
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }
    
    // Create comment
    const result = await Comment.create(content, taskId, req.userId);
    
    if (!result.id) {
      return res.status(400).json({
        success: false,
        message: 'Failed to add comment'
      });
    }
    
    // Get the newly created comment
    const comment = await Comment.findById(result.id);
    
    return res.status(201).json({
      success: true,
      data: comment
    });
  } catch (error) {
    console.error('Add comment error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   GET /api/tasks/:id/comments
// @desc    Get comments for task
// @access  Private
router.get('/:id/comments', authMiddleware, async (req, res) => {
  try {
    const taskId = req.params.id;
    
    // Check if task exists
    const task = await Task.findById(taskId);
    
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }
    
    // Get comments
    const comments = await Comment.findByTaskId(taskId);
    
    return res.status(200).json({
      success: true,
      data: comments
    });
  } catch (error) {
    console.error('Get comments error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

module.exports = router; 
const express = require('express');
const Project = require('../models/Project');
const { authMiddleware, roleCheck } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/projects
// @desc    Get all projects
// @access  Private
router.get('/', authMiddleware, async (req, res) => {
  try {
    let projects;
    
    // Project managers see all projects, developers see only projects they created
    if (req.userRole === 'project_manager') {
      projects = await Project.findAll();
    } else {
      projects = await Project.findByUser(req.userId);
    }
    
    return res.status(200).json({
      success: true,
      data: projects
    });
  } catch (error) {
    console.error('Get projects error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   GET /api/projects/:id
// @desc    Get project by ID
// @access  Private
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const projectId = req.params.id;
    const project = await Project.findById(projectId);
    
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }
    
    // Check if user has access to this project
    if (req.userRole !== 'project_manager' && project.created_by !== req.userId) {
      return res.status(403).json({
        success: false,
        message: 'You do not have access to this project'
      });
    }
    
    return res.status(200).json({
      success: true,
      data: project
    });
  } catch (error) {
    console.error('Get project error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   POST /api/projects
// @desc    Create a new project
// @access  Private (project managers)
router.post('/', authMiddleware, roleCheck(['project_manager']), async (req, res) => {
  try {
    const { name, description, status } = req.body;
    
    // Validate input
    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Project name is required'
      });
    }
    
    // Set default status if not provided
    const projectStatus = status || 'Not Started';
    
    // Create project
    const result = await Project.create(name, description, projectStatus, req.userId);
    
    if (!result.id) {
      return res.status(400).json({
        success: false,
        message: 'Failed to create project'
      });
    }
    
    // Get the newly created project
    const project = await Project.findById(result.id);
    
    return res.status(201).json({
      success: true,
      data: project
    });
  } catch (error) {
    console.error('Create project error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   PUT /api/projects/:id
// @desc    Update project
// @access  Private (project managers)
router.put('/:id', authMiddleware, roleCheck(['project_manager']), async (req, res) => {
  try {
    const projectId = req.params.id;
    const { name, description, status } = req.body;
    
    // Build update object
    const updates = {};
    if (name) updates.name = name;
    if (description !== undefined) updates.description = description;
    if (status) updates.status = status;
    
    const result = await Project.update(projectId, updates);
    
    if (!result.changes) {
      return res.status(404).json({
        success: false,
        message: 'Project not found or no changes made'
      });
    }
    
    // Get updated project
    const project = await Project.findById(projectId);
    
    return res.status(200).json({
      success: true,
      data: project
    });
  } catch (error) {
    console.error('Update project error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   DELETE /api/projects/:id
// @desc    Delete project
// @access  Private (project managers)
router.delete('/:id', authMiddleware, roleCheck(['project_manager']), async (req, res) => {
  try {
    const projectId = req.params.id;
    
    // First check if project exists and user has access
    const project = await Project.findById(projectId);
    
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }
    
    // Delete project (cascade will delete related tasks)
    const result = await Project.delete(projectId);
    
    if (!result.changes) {
      return res.status(500).json({
        success: false,
        message: 'Failed to delete project'
      });
    }
    
    return res.status(200).json({
      success: true,
      message: 'Project deleted successfully'
    });
  } catch (error) {
    console.error('Delete project error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

module.exports = router; 
const request = require('supertest');
const express = require('express');
const projectRoutes = require('../routes/projects');
const Project = require('../models/Project');
const { authMiddleware, roleCheck } = require('../middleware/auth');

// Mock dependencies
jest.mock('../models/Project');
jest.mock('../middleware/auth', () => ({
  authMiddleware: jest.fn((req, res, next) => {
    req.userId = 1;
    req.userRole = 'project_manager';
    next();
  }),
  roleCheck: jest.fn(() => (req, res, next) => next()),
}));

// Setup express app for testing
const app = express();
app.use(express.json());
app.use('/api/projects', projectRoutes);

describe('Project Routes', () => {
  // Reset mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/projects', () => {
    it('should get all projects for project manager', async () => {
      // Mock projects data
      const mockProjects = [
        { id: 1, name: 'Project 1', status: 'In Progress' },
        { id: 2, name: 'Project 2', status: 'Not Started' },
      ];
      
      // Mock Project.findAll to return our mock projects
      Project.findAll.mockResolvedValue(mockProjects);
      
      // Test the endpoint
      const res = await request(app).get('/api/projects');
      
      // Assertions
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toEqual(mockProjects);
      expect(Project.findAll).toHaveBeenCalled();
      expect(Project.findByUser).not.toHaveBeenCalled();
    });

    it('should get user projects for non-project managers', async () => {
      // Override authMiddleware for this test to set role as developer
      authMiddleware.mockImplementationOnce((req, res, next) => {
        req.userId = 1;
        req.userRole = 'developer';
        next();
      });
      
      // Mock user projects data
      const mockUserProjects = [
        { id: 1, name: 'User Project 1', status: 'In Progress' },
      ];
      
      // Mock Project.findByUser to return our mock user projects
      Project.findByUser.mockResolvedValue(mockUserProjects);
      
      // Test the endpoint
      const res = await request(app).get('/api/projects');
      
      // Assertions
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toEqual(mockUserProjects);
      expect(Project.findAll).not.toHaveBeenCalled();
      expect(Project.findByUser).toHaveBeenCalledWith(1);
    });
  });

  describe('GET /api/projects/:id', () => {
    it('should get a project by ID', async () => {
      // Mock project data
      const mockProject = {
        id: 1,
        name: 'Test Project',
        description: 'Project description',
        status: 'In Progress',
        created_by: 1,
        tasks: [],
      };
      
      // Mock Project.findById to return our mock project
      Project.findById.mockResolvedValue(mockProject);
      
      // Test the endpoint
      const res = await request(app).get('/api/projects/1');
      
      // Assertions
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toEqual(mockProject);
      expect(Project.findById).toHaveBeenCalledWith('1');
    });

    it('should return 404 if project not found', async () => {
      // Mock Project.findById to return null (project not found)
      Project.findById.mockResolvedValue(null);
      
      // Test the endpoint
      const res = await request(app).get('/api/projects/999');
      
      // Assertions
      expect(res.statusCode).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('not found');
    });

    it('should return 403 if user has no access to the project', async () => {
      // Override authMiddleware for this test
      authMiddleware.mockImplementationOnce((req, res, next) => {
        req.userId = 2; // Different from project.created_by
        req.userRole = 'developer';
        next();
      });
      
      // Mock project data with a different creator
      const mockProject = {
        id: 1,
        name: 'Test Project',
        description: 'Project description',
        status: 'In Progress',
        created_by: 1, // Different from req.userId
      };
      
      // Mock Project.findById to return our mock project
      Project.findById.mockResolvedValue(mockProject);
      
      // Test the endpoint
      const res = await request(app).get('/api/projects/1');
      
      // Assertions
      expect(res.statusCode).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('do not have access');
    });
  });

  describe('POST /api/projects', () => {
    it('should create a new project successfully', async () => {
      // Mock Project.create to return an ID
      Project.create.mockResolvedValue({ id: 1 });
      
      // Mock project data for findById
      const mockProject = {
        id: 1,
        name: 'New Project',
        description: 'New project description',
        status: 'Not Started',
        created_by: 1,
      };
      
      // Mock Project.findById to return our mock project
      Project.findById.mockResolvedValue(mockProject);
      
      // Test the endpoint
      const res = await request(app)
        .post('/api/projects')
        .send({
          name: 'New Project',
          description: 'New project description',
        });
      
      // Assertions
      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toEqual(mockProject);
      expect(Project.create).toHaveBeenCalledWith(
        'New Project',
        'New project description',
        'Not Started',
        1
      );
    });

    it('should return 400 if name is missing', async () => {
      // Test the endpoint with missing name
      const res = await request(app)
        .post('/api/projects')
        .send({
          description: 'New project description',
        });
      
      // Assertions
      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('required');
      expect(Project.create).not.toHaveBeenCalled();
    });
  });

  describe('PUT /api/projects/:id', () => {
    it('should update a project successfully', async () => {
      // Mock Project.update to return changes
      Project.update.mockResolvedValue({ changes: 1 });
      
      // Mock updated project data
      const mockUpdatedProject = {
        id: 1,
        name: 'Updated Project',
        description: 'Updated description',
        status: 'In Progress',
        created_by: 1,
      };
      
      // Mock Project.findById to return our updated mock project
      Project.findById.mockResolvedValue(mockUpdatedProject);
      
      // Test the endpoint
      const res = await request(app)
        .put('/api/projects/1')
        .send({
          name: 'Updated Project',
          description: 'Updated description',
          status: 'In Progress',
        });
      
      // Assertions
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toEqual(mockUpdatedProject);
      expect(Project.update).toHaveBeenCalledWith('1', {
        name: 'Updated Project',
        description: 'Updated description',
        status: 'In Progress',
      });
    });

    it('should return 404 if no changes made', async () => {
      // Mock Project.update to return no changes
      Project.update.mockResolvedValue({ changes: 0 });
      
      // Test the endpoint
      const res = await request(app)
        .put('/api/projects/999')
        .send({
          name: 'Updated Project',
        });
      
      // Assertions
      expect(res.statusCode).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('not found or no changes made');
    });
  });

  describe('DELETE /api/projects/:id', () => {
    it('should delete a project successfully', async () => {
      // Mock Project.findById to return a project
      Project.findById.mockResolvedValue({
        id: 1,
        name: 'Project to Delete',
      });
      
      // Mock Project.delete to return changes
      Project.delete.mockResolvedValue({ changes: 1 });
      
      // Test the endpoint
      const res = await request(app).delete('/api/projects/1');
      
      // Assertions
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain('deleted successfully');
      expect(Project.delete).toHaveBeenCalledWith('1');
    });

    it('should return 404 if project not found', async () => {
      // Mock Project.findById to return null (project not found)
      Project.findById.mockResolvedValue(null);
      
      // Test the endpoint
      const res = await request(app).delete('/api/projects/999');
      
      // Assertions
      expect(res.statusCode).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('not found');
      expect(Project.delete).not.toHaveBeenCalled();
    });
  });
}); 
const request = require('supertest');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const express = require('express');
const User = require('../models/User');

// Mock User model
jest.mock('../models/User');

// Create express app and routes for testing
const app = express();
app.use(express.json());
require('../routes/auth')(app);

describe('Auth Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user', async () => {
      // Mock User.findByEmail to return null (user doesn't exist)
      User.findByEmail.mockResolvedValue(null);
      
      // Mock User.create to return a new user
      User.create.mockResolvedValue({
        id: 1,
        name: 'Test User',
        email: 'test@example.com',
        role: 'developer'
      });

      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test User',
          email: 'test@example.com',
          password: 'password123',
          role: 'developer'
        });

      expect(res.statusCode).toEqual(201);
      expect(res.body).toHaveProperty('token');
      expect(User.create).toHaveBeenCalled();
    });

    it('should return 400 if user already exists', async () => {
      // Mock User.findByEmail to return a user (user exists)
      User.findByEmail.mockResolvedValue({
        id: 1,
        email: 'test@example.com'
      });

      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test User',
          email: 'test@example.com',
          password: 'password123',
          role: 'developer'
        });

      expect(res.statusCode).toEqual(400);
      expect(res.body).toHaveProperty('errors');
      expect(User.create).not.toHaveBeenCalled();
    });

    it('should return 400 if required fields are missing', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test User',
          // email is missing
          password: 'password123'
        });

      expect(res.statusCode).toEqual(400);
      expect(res.body).toHaveProperty('errors');
      expect(User.create).not.toHaveBeenCalled();
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login a user with valid credentials', async () => {
      // Mock bcrypt.compare to return true
      bcrypt.compare = jest.fn().mockResolvedValue(true);
      
      // Mock User.findByEmail to return a user
      User.findByEmail.mockResolvedValue({
        id: 1,
        email: 'test@example.com',
        password: 'hashedpassword',
        role: 'developer'
      });

      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123'
        });

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('token');
    });

    it('should return 400 if user does not exist', async () => {
      // Mock User.findByEmail to return null (user doesn't exist)
      User.findByEmail.mockResolvedValue(null);

      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'password123'
        });

      expect(res.statusCode).toEqual(400);
      expect(res.body).toHaveProperty('errors');
    });

    it('should return 400 if password is incorrect', async () => {
      // Mock bcrypt.compare to return false (password incorrect)
      bcrypt.compare = jest.fn().mockResolvedValue(false);
      
      // Mock User.findByEmail to return a user
      User.findByEmail.mockResolvedValue({
        id: 1,
        email: 'test@example.com',
        password: 'hashedpassword',
        role: 'developer'
      });

      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'wrongpassword'
        });

      expect(res.statusCode).toEqual(400);
      expect(res.body).toHaveProperty('errors');
    });

    it('should login with default admin credentials on a fresh system', async () => {
      // Mock bcrypt.compare to return true
      bcrypt.compare = jest.fn().mockResolvedValue(true);
      
      // Mock User.findByEmail to return the default admin user
      User.findByEmail.mockResolvedValue({
        id: 1,
        email: 'admin',
        password: 'hashedpassword',
        role: 'admin'
      });

      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin',
          password: 'admin'
        });

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('token');
      expect(User.findByEmail).toHaveBeenCalledWith('admin');
    });
  });

  describe('GET /api/auth/user', () => {
    it('should get user data with valid token', async () => {
      // Mock jwt.verify to return decoded token
      jwt.verify = jest.fn().mockReturnValue({ user: { id: 1 } });
      
      // Mock User.findById to return a user
      User.findById.mockResolvedValue({
        id: 1,
        name: 'Test User',
        email: 'test@example.com',
        role: 'developer',
        toJSON: () => ({
          id: 1,
          name: 'Test User',
          email: 'test@example.com',
          role: 'developer'
        })
      });

      const res = await request(app)
        .get('/api/auth/user')
        .set('x-auth-token', 'valid-token');

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('id', 1);
      expect(res.body).toHaveProperty('name', 'Test User');
      expect(res.body).toHaveProperty('email', 'test@example.com');
      expect(res.body).toHaveProperty('role', 'developer');
    });

    it('should return 401 if no token is provided', async () => {
      const res = await request(app)
        .get('/api/auth/user');

      expect(res.statusCode).toEqual(401);
      expect(res.body).toHaveProperty('msg', 'No token, authorization denied');
    });

    it('should return 401 if token is invalid', async () => {
      // Mock jwt.verify to throw an error
      jwt.verify = jest.fn().mockImplementation(() => {
        throw new Error('invalid token');
      });

      const res = await request(app)
        .get('/api/auth/user')
        .set('x-auth-token', 'invalid-token');

      expect(res.statusCode).toEqual(401);
      expect(res.body).toHaveProperty('msg', 'Token is not valid');
    });
  });
}); 
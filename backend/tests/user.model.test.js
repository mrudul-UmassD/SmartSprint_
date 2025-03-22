const bcrypt = require('bcryptjs');
const User = require('../models/User');
const db = require('../db/db');

// Mock the db and bcrypt modules
jest.mock('../db/db');
jest.mock('bcryptjs');

describe('User Model', () => {
  // Setup mock for database
  let mockDbRun;
  let mockDbGet;
  let mockDbAll;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock db.run
    mockDbRun = jest.fn().mockImplementation((query, params, callback) => {
      if (callback) callback(null, { lastID: 1 });
      return Promise.resolve({ lastID: 1 });
    });
    
    // Mock db.get
    mockDbGet = jest.fn().mockImplementation((query, params, callback) => {
      if (callback) callback(null, { id: 1, name: 'Test User', email: 'test@example.com', role: 'developer' });
      return Promise.resolve({ id: 1, name: 'Test User', email: 'test@example.com', role: 'developer' });
    });
    
    // Mock db.all
    mockDbAll = jest.fn().mockImplementation((query, params, callback) => {
      if (callback) callback(null, [{ id: 1, name: 'Test User', email: 'test@example.com', role: 'developer' }]);
      return Promise.resolve([{ id: 1, name: 'Test User', email: 'test@example.com', role: 'developer' }]);
    });

    // Assign mocks to db methods
    db.run = mockDbRun;
    db.get = mockDbGet;
    db.all = mockDbAll;

    // Mock bcrypt.hash
    bcrypt.hash = jest.fn().mockResolvedValue('hashedpassword');
    
    // Mock bcrypt.compare
    bcrypt.compare = jest.fn().mockResolvedValue(true);
  });

  describe('Static Methods', () => {
    test('findById should return a user when found', async () => {
      const user = await User.findById(1);
      expect(user).toBeTruthy();
      expect(user.id).toBe(1);
      expect(db.get).toHaveBeenCalledWith(
        'SELECT * FROM users WHERE id = ?',
        [1],
        expect.any(Function)
      );
    });

    test('findByEmail should return a user when found', async () => {
      const user = await User.findByEmail('test@example.com');
      expect(user).toBeTruthy();
      expect(user.email).toBe('test@example.com');
      expect(db.get).toHaveBeenCalledWith(
        'SELECT * FROM users WHERE email = ?',
        ['test@example.com'],
        expect.any(Function)
      );
    });

    test('create should create a new user', async () => {
      const userData = {
        name: 'New User',
        email: 'new@example.com',
        password: 'password123',
        role: 'developer'
      };

      const user = await User.create(userData);
      expect(user).toBeTruthy();
      expect(user.id).toBe(1);
      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 10);
      expect(db.run).toHaveBeenCalledWith(
        'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
        ['New User', 'new@example.com', 'hashedpassword', 'developer'],
        expect.any(Function)
      );
    });

    test('canCreateUser should allow admin to create any role', () => {
      expect(User.canCreateUser('admin', 'admin')).toBe(true);
      expect(User.canCreateUser('admin', 'project_manager')).toBe(true);
      expect(User.canCreateUser('admin', 'developer')).toBe(true);
      expect(User.canCreateUser('admin', 'viewer')).toBe(true);
    });

    test('canCreateUser should allow project_manager to create developer and viewer', () => {
      expect(User.canCreateUser('project_manager', 'admin')).toBe(false);
      expect(User.canCreateUser('project_manager', 'project_manager')).toBe(false);
      expect(User.canCreateUser('project_manager', 'developer')).toBe(true);
      expect(User.canCreateUser('project_manager', 'viewer')).toBe(true);
    });

    test('canCreateUser should not allow developer to create any user', () => {
      expect(User.canCreateUser('developer', 'admin')).toBe(false);
      expect(User.canCreateUser('developer', 'project_manager')).toBe(false);
      expect(User.canCreateUser('developer', 'developer')).toBe(false);
      expect(User.canCreateUser('developer', 'viewer')).toBe(false);
    });

    test('canCreateUser should not allow viewer to create any user', () => {
      expect(User.canCreateUser('viewer', 'admin')).toBe(false);
      expect(User.canCreateUser('viewer', 'project_manager')).toBe(false);
      expect(User.canCreateUser('viewer', 'developer')).toBe(false);
      expect(User.canCreateUser('viewer', 'viewer')).toBe(false);
    });

    test('createByUser should create user with proper permissions', async () => {
      const userData = {
        name: 'New User',
        email: 'new@example.com',
        password: 'password123',
        role: 'developer'
      };

      // Mock the create method
      User.create = jest.fn().mockResolvedValue({ id: 1, ...userData, password: 'hashedpassword' });
      
      // Admin creating a developer
      const user = await User.createByUser(userData, 'admin');
      expect(user).toBeTruthy();
      expect(User.create).toHaveBeenCalledWith(userData);
    });

    test('createByUser should throw error for insufficient permissions', async () => {
      const userData = {
        name: 'New Admin',
        email: 'admin@example.com',
        password: 'password123',
        role: 'admin'
      };
      
      // Developer trying to create an admin
      await expect(User.createByUser(userData, 'developer'))
        .rejects
        .toThrow('Not authorized to create users with this role');
    });

    test('findAll should return all users', async () => {
      const users = await User.findAll();
      expect(users).toEqual([{ id: 1, name: 'Test User', email: 'test@example.com', role: 'developer' }]);
      expect(db.all).toHaveBeenCalledWith(
        'SELECT * FROM users',
        [],
        expect.any(Function)
      );
    });
  });

  describe('Instance Methods', () => {
    let user;

    beforeEach(() => {
      user = new User({
        id: 1,
        name: 'Test User',
        email: 'test@example.com',
        password: 'hashedpassword',
        role: 'developer'
      });
    });

    test('updatePassword should update password with correct current password', async () => {
      // Mock bcrypt.compare to return true (correct password)
      bcrypt.compare.mockResolvedValue(true);
      
      const result = await user.updatePassword('currentPassword', 'newPassword');
      expect(result).toBe(true);
      expect(bcrypt.compare).toHaveBeenCalledWith('currentPassword', 'hashedpassword');
      expect(bcrypt.hash).toHaveBeenCalledWith('newPassword', 10);
      expect(db.run).toHaveBeenCalledWith(
        'UPDATE users SET password = ? WHERE id = ?',
        ['hashedpassword', 1],
        expect.any(Function)
      );
    });

    test('updatePassword should not update with incorrect current password', async () => {
      // Mock bcrypt.compare to return false (incorrect password)
      bcrypt.compare.mockResolvedValue(false);
      
      const result = await user.updatePassword('wrongPassword', 'newPassword');
      expect(result).toBe(false);
      expect(bcrypt.compare).toHaveBeenCalledWith('wrongPassword', 'hashedpassword');
      expect(bcrypt.hash).not.toHaveBeenCalled();
      expect(db.run).not.toHaveBeenCalled();
    });

    test('update should update user properties', async () => {
      const updateData = {
        name: 'Updated Name',
        bio: 'New bio',
        department: 'Engineering'
      };

      // Mock the findById method to return the updated user
      User.findById = jest.fn().mockResolvedValue({
        id: 1,
        name: 'Updated Name',
        email: 'test@example.com',
        role: 'developer',
        bio: 'New bio',
        department: 'Engineering'
      });

      const updated = await user.update(updateData);
      expect(updated).toBeTruthy();
      expect(updated.name).toBe('Updated Name');
      expect(updated.bio).toBe('New bio');
      expect(updated.department).toBe('Engineering');
      expect(db.run).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE users SET'),
        expect.arrayContaining(['Updated Name', 'New bio', 'Engineering', 1]),
        expect.any(Function)
      );
    });

    test('delete should remove the user', async () => {
      await user.delete();
      expect(db.run).toHaveBeenCalledWith(
        'DELETE FROM users WHERE id = ?',
        [1],
        expect.any(Function)
      );
    });

    test('toJSON should return user data without password', () => {
      const json = user.toJSON();
      expect(json).toHaveProperty('id', 1);
      expect(json).toHaveProperty('name', 'Test User');
      expect(json).toHaveProperty('email', 'test@example.com');
      expect(json).toHaveProperty('role', 'developer');
      expect(json).not.toHaveProperty('password');
    });
  });
}); 
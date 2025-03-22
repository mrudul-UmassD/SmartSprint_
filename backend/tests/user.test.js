const User = require('../models/User');
const bcrypt = require('bcryptjs');

// Mock database
jest.mock('../db/db', () => ({
  get: jest.fn(),
  all: jest.fn(),
  run: jest.fn()
}));

// Mock bcrypt
jest.mock('bcryptjs', () => ({
  genSaltSync: jest.fn(() => 'salt'),
  hashSync: jest.fn(() => 'hashed_password'),
  compare: jest.fn()
}));

const db = require('../db/db');

describe('User Model', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Static methods', () => {
    describe('findById', () => {
      it('should find a user by ID', async () => {
        const mockUser = { id: 1, name: 'Test User', email: 'test@example.com', role: 'developer' };
        db.get.mockImplementation((sql, params, callback) => {
          callback(null, mockUser);
        });

        const user = await User.findById(1);
        expect(user).toEqual(mockUser);
        expect(db.get).toHaveBeenCalledWith('SELECT * FROM users WHERE id = ?', [1], expect.any(Function));
      });

      it('should handle errors', async () => {
        db.get.mockImplementation((sql, params, callback) => {
          callback(new Error('Database error'), null);
        });

        await expect(User.findById(1)).rejects.toThrow('Database error');
      });
    });

    describe('findByEmail', () => {
      it('should find a user by email and add comparePassword method', async () => {
        const mockUser = { id: 1, name: 'Test User', email: 'test@example.com', password: 'hashedpw', role: 'developer' };
        db.get.mockImplementation((sql, params, callback) => {
          callback(null, mockUser);
        });

        const user = await User.findByEmail('test@example.com');
        expect(user).toEqual(expect.objectContaining(mockUser));
        expect(user.comparePassword).toBeInstanceOf(Function);
        expect(db.get).toHaveBeenCalledWith('SELECT * FROM users WHERE email = ?', ['test@example.com'], expect.any(Function));
      });
    });

    describe('create', () => {
      it('should create a new user', async () => {
        db.run.mockImplementation((sql, params, callback) => {
          callback.call({ lastID: 1 }, null);
        });

        const result = await User.create('Test User', 'test@example.com', 'password123', 'developer');
        expect(result).toEqual({ id: 1 });
        expect(bcrypt.genSaltSync).toHaveBeenCalledWith(10);
        expect(bcrypt.hashSync).toHaveBeenCalledWith('password123', 'salt');
        expect(db.run).toHaveBeenCalledWith(
          'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
          ['Test User', 'test@example.com', 'hashed_password', 'developer'],
          expect.any(Function)
        );
      });

      it('should reject invalid roles', async () => {
        await expect(User.create('Test User', 'test@example.com', 'password123', 'invalid_role'))
          .rejects.toThrow('Invalid role');
        expect(db.run).not.toHaveBeenCalled();
      });
    });

    describe('canCreateUser', () => {
      it('admin should be able to create any user', () => {
        expect(User.canCreateUser('admin', 'admin')).toBe(true);
        expect(User.canCreateUser('admin', 'project_manager')).toBe(true);
        expect(User.canCreateUser('admin', 'developer')).toBe(true);
        expect(User.canCreateUser('admin', 'viewer')).toBe(true);
      });

      it('project_manager should not be able to create admin users', () => {
        expect(User.canCreateUser('project_manager', 'admin')).toBe(false);
      });

      it('project_manager should be able to create developers and viewers', () => {
        expect(User.canCreateUser('project_manager', 'developer')).toBe(true);
        expect(User.canCreateUser('project_manager', 'viewer')).toBe(true);
      });

      it('developer should not be able to create any users', () => {
        expect(User.canCreateUser('developer', 'admin')).toBe(false);
        expect(User.canCreateUser('developer', 'project_manager')).toBe(false);
        expect(User.canCreateUser('developer', 'developer')).toBe(false);
        expect(User.canCreateUser('developer', 'viewer')).toBe(false);
      });
    });

    describe('createByUser', () => {
      it('should create a user when creator has permission', async () => {
        // Mock the create method
        const createSpy = jest.spyOn(User, 'create').mockResolvedValue({ id: 1 });
        
        const result = await User.createByUser('admin', 'Test User', 'test@example.com', 'password123', 'developer');
        expect(result).toEqual({ id: 1 });
        expect(createSpy).toHaveBeenCalledWith('Test User', 'test@example.com', 'password123', 'developer');
      });

      it('should reject when creator does not have permission', async () => {
        const createSpy = jest.spyOn(User, 'create');
        
        await expect(User.createByUser('developer', 'Test User', 'test@example.com', 'password123', 'viewer'))
          .rejects.toThrow("Users with role 'developer' cannot create users with role 'viewer'");
        expect(createSpy).not.toHaveBeenCalled();
      });
    });

    describe('updatePassword', () => {
      it('should update password when current password is correct', async () => {
        // Setup mocks
        const mockUser = { id: 1, password: 'current_hashed_password' };
        jest.spyOn(User, 'findById').mockResolvedValue(mockUser);
        bcrypt.compare.mockResolvedValue(true);
        jest.spyOn(User, 'update').mockResolvedValue({ changes: 1 });

        const result = await User.updatePassword(1, 'current_password', 'new_password');
        expect(result).toEqual({ changes: 1 });
        expect(bcrypt.compare).toHaveBeenCalledWith('current_password', 'current_hashed_password');
        expect(bcrypt.genSaltSync).toHaveBeenCalledWith(10);
        expect(bcrypt.hashSync).toHaveBeenCalledWith('new_password', 'salt');
        expect(User.update).toHaveBeenCalledWith(1, { password: 'hashed_password' });
      });

      it('should reject when current password is incorrect', async () => {
        // Setup mocks
        const mockUser = { id: 1, password: 'current_hashed_password' };
        jest.spyOn(User, 'findById').mockResolvedValue(mockUser);
        bcrypt.compare.mockResolvedValue(false);

        await expect(User.updatePassword(1, 'wrong_password', 'new_password'))
          .rejects.toThrow('Current password is incorrect');
        expect(bcrypt.compare).toHaveBeenCalledWith('wrong_password', 'current_hashed_password');
        expect(User.update).not.toHaveBeenCalled();
      });

      it('should reject when user is not found', async () => {
        jest.spyOn(User, 'findById').mockResolvedValue(null);

        await expect(User.updatePassword(999, 'current_password', 'new_password'))
          .rejects.toThrow('User not found');
        expect(bcrypt.compare).not.toHaveBeenCalled();
        expect(User.update).not.toHaveBeenCalled();
      });
    });

    describe('update', () => {
      it('should update user data', async () => {
        db.run.mockImplementation((sql, params, callback) => {
          callback.call({ changes: 1 }, null);
        });

        const updates = { name: 'Updated Name', email: 'updated@example.com' };
        const result = await User.update(1, updates);
        
        expect(result).toEqual({ changes: 1 });
        expect(db.run).toHaveBeenCalledWith(
          expect.stringContaining('UPDATE users SET'),
          ['Updated Name', 'updated@example.com', 1],
          expect.any(Function)
        );
      });

      it('should handle empty updates', async () => {
        const result = await User.update(1, {});
        expect(result).toEqual({ changes: 0 });
        expect(db.run).not.toHaveBeenCalled();
      });
    });

    describe('delete', () => {
      it('should delete a user', async () => {
        db.run.mockImplementation((sql, params, callback) => {
          callback.call({ changes: 1 }, null);
        });

        const result = await User.delete(1);
        expect(result).toEqual({ changes: 1 });
        expect(db.run).toHaveBeenCalledWith('DELETE FROM users WHERE id = ?', [1], expect.any(Function));
      });
    });
  });

  describe('Instance methods', () => {
    describe('comparePassword', () => {
      it('should compare passwords correctly', async () => {
        const user = await User.findByEmail('test@example.com');
        bcrypt.compare.mockResolvedValue(true);
        
        const result = await user.comparePassword('password123');
        expect(result).toBe(true);
      });
    });
  });
}); 
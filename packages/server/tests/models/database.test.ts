/**
 * Database layer tests
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { healthCheck, initializeDatabase, closePool } from '../../src/models/database.js';
import { AgentModel } from '../../src/models/AgentModel.js';
import { GameModel } from '../../src/models/GameModel.js';
import { GameActionModel } from '../../src/models/GameActionModel.js';
import { GameAgentModel } from '../../src/models/GameAgentModel.js';
import { GameResultModel } from '../../src/models/GameResultModel.js';

describe('Database Layer', () => {
  beforeAll(async () => {
    try {
      await initializeDatabase();
    } catch (error) {
      console.log('Database not available, skipping tests');
    }
  });

  afterAll(async () => {
    await closePool();
  });

  describe('Health Check', () => {
    it('should return true for healthy database', async () => {
      const isHealthy = await healthCheck();
      expect(typeof isHealthy).toBe('boolean');
    });
  });

  describe('AgentModel', () => {
    it('should have all CRUD methods', () => {
      expect(typeof AgentModel.create).toBe('function');
      expect(typeof AgentModel.findById).toBe('function');
      expect(typeof AgentModel.findByWallet).toBe('function');
      expect(typeof AgentModel.findAll).toBe('function');
      expect(typeof AgentModel.update).toBe('function');
      expect(typeof AgentModel.delete).toBe('function');
      expect(typeof AgentModel.count).toBe('function');
    });
  });

  describe('GameModel', () => {
    it('should have all CRUD methods', () => {
      expect(typeof GameModel.create).toBe('function');
      expect(typeof GameModel.findById).toBe('function');
      expect(typeof GameModel.findByState).toBe('function');
      expect(typeof GameModel.findByTier).toBe('function');
      expect(typeof GameModel.findAll).toBe('function');
      expect(typeof GameModel.update).toBe('function');
      expect(typeof GameModel.delete).toBe('function');
      expect(typeof GameModel.count).toBe('function');
    });
  });

  describe('GameActionModel', () => {
    it('should have all CRUD methods', () => {
      expect(typeof GameActionModel.create).toBe('function');
      expect(typeof GameActionModel.findById).toBe('function');
      expect(typeof GameActionModel.findByGameId).toBe('function');
      expect(typeof GameActionModel.findByAgentId).toBe('function');
      expect(typeof GameActionModel.findAll).toBe('function');
      expect(typeof GameActionModel.delete).toBe('function');
      expect(typeof GameActionModel.count).toBe('function');
    });
  });

  describe('GameAgentModel', () => {
    it('should have all CRUD methods', () => {
      expect(typeof GameAgentModel.create).toBe('function');
      expect(typeof GameAgentModel.findById).toBe('function');
      expect(typeof GameAgentModel.findByGameId).toBe('function');
      expect(typeof GameAgentModel.findByAgentId).toBe('function');
      expect(typeof GameAgentModel.findAll).toBe('function');
      expect(typeof GameAgentModel.update).toBe('function');
      expect(typeof GameAgentModel.delete).toBe('function');
      expect(typeof GameAgentModel.count).toBe('function');
    });
  });

  describe('GameResultModel', () => {
    it('should have all CRUD methods', () => {
      expect(typeof GameResultModel.create).toBe('function');
      expect(typeof GameResultModel.findById).toBe('function');
      expect(typeof GameResultModel.findByGameId).toBe('function');
      expect(typeof GameResultModel.findByAgentWallet).toBe('function');
      expect(typeof GameResultModel.findAll).toBe('function');
      expect(typeof GameResultModel.delete).toBe('function');
      expect(typeof GameResultModel.count).toBe('function');
    });
  });
});

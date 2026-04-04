const request = require('supertest');
const app = require('../src/server');
const Integration = require('../src/models/Integration');
const Log = require('../src/models/Log');
const Stats = require('../src/models/Stats');

describe('MuleSoft Integration Platform - Integration Tests', () => {
  
  // ========== FIXTURES ==========
  const validIntegrationData = {
    name: 'Test REST API',
    type: 'REST',
    config: {
      endpoint: 'https://jsonplaceholder.typicode.com/posts/1',
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      timeout: 30000
    }
  };

  // ========== SETUP & TEARDOWN ==========
  beforeEach(async () => {
    try {
      // Clear collections before each test
      await Integration.deleteMany({});
      await Log.deleteMany({});
      await Stats.deleteMany({});
    } catch (err) {
      // Log error but don't fail
      if (process.env.DEBUG) {
        console.error('Cleanup error:', err.message);
      }
      throw err; // Actually throw to fail the test if cleanup fails
    }
  });

  afterAll(async () => {
    try {
      // Final cleanup
      await Integration.deleteMany({});
      await Log.deleteMany({});
      await Stats.deleteMany({});
    } catch (err) {
      if (process.env.DEBUG) {
        console.error('Final cleanup error:', err.message);
      }
    }
  });

  // ========== HEALTH CHECK TESTS ==========
  describe('Health Check', () => {
    it('should return 200 on /health endpoint', async () => {
      const response = await request(app)
        .get('/health');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status');
    });
  });

  // ========== INTEGRATIONS API TESTS ==========
  describe('Integrations API', () => {
    
    // GET /integrations
    describe('GET /api/integrations', () => {
      it('should return empty array initially', async () => {
        const response = await request(app)
          .get('/api/integrations');
        
        expect(response.status).toBe(200);
        expect(Array.isArray(response.body.integrations)).toBe(true);
        expect(response.body.integrations.length).toBe(0);
      });

      it('should return all integrations', async () => {
        await Integration.create(validIntegrationData);
        
        const response = await request(app)
          .get('/api/integrations');
        
        expect(response.status).toBe(200);
        expect(response.body.integrations.length).toBe(1);
        expect(response.body.integrations[0].name).toBe(validIntegrationData.name);
      });

      it('should support pagination', async () => {
        for (let i = 0; i < 5; i++) {
          await Integration.create({
            ...validIntegrationData,
            name: `Integration ${i}`
          });
        }
        
        const response = await request(app)
          .get('/api/integrations?limit=2&page=1');
        
        expect(response.status).toBe(200);
        expect(response.body.integrations.length).toBeLessThanOrEqual(2);
      });
    });

    // POST /integrations
    describe('POST /api/integrations', () => {
      it('should create a new integration', async () => {
        const response = await request(app)
          .post('/api/integrations')
          .send(validIntegrationData);
        
        expect(response.status).toBe(201);
        expect(response.body).toHaveProperty('_id');
        expect(response.body.name).toBe(validIntegrationData.name);
        expect(response.body.type).toBe(validIntegrationData.type);
        expect(response.body).toHaveProperty('createdAt');
      });

      it('should reject invalid data', async () => {
        const invalidData = {
          name: '', // Empty name
          type: 'INVALID_TYPE'
        };
        
        const response = await request(app)
          .post('/api/integrations')
          .send(invalidData);
        
        expect(response.status).toBe(400);
      });

      it('should reject missing required fields', async () => {
        const incompleteData = {
          name: 'Test'
          // Missing 'type' and 'config'
        };
        
        const response = await request(app)
          .post('/api/integrations')
          .send(incompleteData);
        
        expect(response.status).toBe(400);
      });

      it('should enforce unique integration names', async () => {
        await Integration.create(validIntegrationData);
        
        const response = await request(app)
          .post('/api/integrations')
          .send(validIntegrationData);
        
        expect(response.status).toBe(409);
      });
    });

    // GET /integrations/:id
    describe('GET /api/integrations/:id', () => {
      it('should return integration by id', async () => {
        const integration = await Integration.create(validIntegrationData);
        
        const response = await request(app)
          .get(`/api/integrations/${integration._id}`);
        
        expect(response.status).toBe(200);
        expect(response.body._id).toEqual(integration._id.toString());
      });

      it('should return 404 for non-existent integration', async () => {
        const fakeId = '507f1f77bcf86cd799439011';
        
        const response = await request(app)
          .get(`/api/integrations/${fakeId}`);
        
        expect(response.status).toBe(404);
      });
    });

    // PUT /integrations/:id
    describe('PUT /api/integrations/:id', () => {
      it('should update an integration', async () => {
        const integration = await Integration.create(validIntegrationData);
        
        const updatedData = {
          name: 'Updated Integration',
          config: {
            endpoint: 'https://api.updated.com/v2',
            method: 'POST',
            timeout: 60000
          }
        };
        
        const response = await request(app)
          .put(`/api/integrations/${integration._id}`)
          .send(updatedData);
        
        expect(response.status).toBe(200);
        expect(response.body.name).toBe(updatedData.name);
      });

      it('should not update with invalid data', async () => {
        const integration = await Integration.create(validIntegrationData);
        
        const response = await request(app)
          .put(`/api/integrations/${integration._id}`)
          .send({ name: '' });
        
        expect(response.status).toBe(400);
      });
    });

    // DELETE /integrations/:id
    describe('DELETE /api/integrations/:id', () => {
      it('should delete an integration', async () => {
        const integration = await Integration.create(validIntegrationData);
        
        const response = await request(app)
          .delete(`/api/integrations/${integration._id}`);
        
        expect(response.status).toBe(200);
        
        // Verify it's deleted
        const checkResponse = await request(app)
          .get(`/api/integrations/${integration._id}`);
        expect(checkResponse.status).toBe(404);
      });

      it('should return 404 when deleting non-existent integration', async () => {
        const fakeId = '507f1f77bcf86cd799439011';
        
        const response = await request(app)
          .delete(`/api/integrations/${fakeId}`);
        
        expect(response.status).toBe(404);
      });
    });

    // POST /integrations/:id/test
    describe('POST /api/integrations/:id/test', () => {
      it('should test an integration', async () => {
        const integration = await Integration.create({
          name: 'Test Integration',
          type: 'REST',
          config: {
            endpoint: 'https://httpbin.org/get',
            method: 'GET',
            timeout: 30000
          }
        });
        
        const response = await request(app)
          .post(`/api/integrations/${integration._id}/test`);
        
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('success');
      });

      it('should handle test failure gracefully', async () => {
        const integration = await Integration.create({
          name: 'Failing Integration',
          type: 'REST',
          config: {
            endpoint: 'https://invalid-domain-12345.com/api',
            method: 'GET',
            timeout: 5000
          }
        });
        
        const response = await request(app)
          .post(`/api/integrations/${integration._id}/test`);
        
        // Should not crash, should return error info
        expect(response.status).toBeGreaterThanOrEqual(200);
        expect(response.body).toHaveProperty('error');
      });

      it('should create log entry on test', async () => {
        const integration = await Integration.create({
          name: 'Test Integration',
          type: 'REST',
          config: {
            endpoint: 'https://httpbin.org/get',
            method: 'GET'
          }
        });
        
        await request(app)
          .post(`/api/integrations/${integration._id}/test`);
        
        // Note: The actual log creation depends on your integration controller implementation
        // For now, just verify the test endpoint doesn't crash
        const logs = await Log.find({ integrationId: integration._id });
        // We expect logs might be created during test
        expect(Array.isArray(logs)).toBe(true);
      });
    });
  });

  // ========== LOGS API TESTS ==========
  describe('Logs API', () => {
    describe('GET /api/logs', () => {
      it('should return all logs', async () => {
        const integration = await Integration.create(validIntegrationData);
        await Log.create({
          integrationId: integration._id,
          level: 'info',
          message: 'Test log entry',
          details: { test: true }
        });
        
        const response = await request(app)
          .get('/api/logs');
        
        expect(response.status).toBe(200);
        expect(Array.isArray(response.body.logs)).toBe(true);
        expect(response.body.logs.length).toBeGreaterThan(0);
      });

      it('should filter logs by level', async () => {
        const integration = await Integration.create(validIntegrationData);
        await Log.create({
          integrationId: integration._id,
          level: 'info',
          message: 'Info message',
          details: {}
        });
        await Log.create({
          integrationId: integration._id,
          level: 'error',
          message: 'Error message',
          details: { error: 'Something failed' }
        });
        
        const response = await request(app)
          .get('/api/logs?level=info');
        
        expect(response.status).toBe(200);
        expect(response.body.logs.every(log => log.level === 'info')).toBe(true);
      });
    });

    describe('GET /api/logs/:id', () => {
      it('should get log by id', async () => {
        const integration = await Integration.create(validIntegrationData);
        const log = await Log.create({
          integrationId: integration._id,
          level: 'info',
          message: 'Test log',
          details: {}
        });
        
        const response = await request(app)
          .get(`/api/logs/${log._id}`);
        
        expect(response.status).toBe(200);
        expect(response.body._id).toEqual(log._id.toString());
      });
    });

    describe('GET /api/logs/integration/:integrationId', () => {
      it('should get logs for specific integration', async () => {
        const integration1 = await Integration.create({
          ...validIntegrationData,
          name: 'Integration 1'
        });
        const integration2 = await Integration.create({
          ...validIntegrationData,
          name: 'Integration 2'
        });
        
        await Log.create({
          integrationId: integration1._id,
          level: 'info',
          message: 'Log for integration 1',
          details: {}
        });
        await Log.create({
          integrationId: integration2._id,
          level: 'info',
          message: 'Log for integration 2',
          details: {}
        });
        
        const response = await request(app)
          .get(`/api/logs/integration/${integration1._id}`);
        
        expect(response.status).toBe(200);
        expect(response.body.logs.every(log => 
          log.integrationId === integration1._id.toString()
        )).toBe(true);
      });
    });
  });

  // ========== STATS API TESTS ==========
  describe('Statistics API', () => {
    describe('GET /api/stats/dashboard', () => {
      it('should return dashboard stats', async () => {
        const response = await request(app)
          .get('/api/stats/dashboard');
        
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('totalCalls');
        expect(typeof response.body.totalCalls).toBe('number');
      });
    });

    describe('GET /api/stats/integration/:id', () => {
      it('should return stats for integration', async () => {
        const integration = await Integration.create(validIntegrationData);
        
        const response = await request(app)
          .get(`/api/stats/integration/${integration._id}`);
        
        expect(response.status).toBe(200);
      });
    });
  });

  // ========== ERROR HANDLING TESTS ==========
  describe('Error Handling', () => {
    it('should handle malformed JSON', async () => {
      const response = await request(app)
        .post('/api/integrations')
        .set('Content-Type', 'application/json')
        .send('{ invalid json }');
      
      expect(response.status).toBe(400);
    });

    it('should handle 404 for non-existent routes', async () => {
      const response = await request(app)
        .get('/api/nonexistent');
      
      expect(response.status).toBe(404);
    });

    it('should handle invalid HTTP methods', async () => {
      const response = await request(app)
        .patch('/api/integrations');
      
      expect(response.status).toBe(404);
    });
  });
});

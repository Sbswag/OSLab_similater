import test from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';

import app from '../src/app.js';
import User from '../src/models/User.js';
import SimulationHistory from '../src/models/SimulationHistory.js';
import QuizAttempt from '../src/models/QuizAttempt.js';

test('Mongoose schemas validate required fields cleanly', () => {
  const invalidUser = new User({ name: 'A', email: '', passwordHash: '' });
  const err = invalidUser.validateSync();
  assert.ok(err.errors.name);
  assert.ok(err.errors.email);
  assert.ok(err.errors.passwordHash);

  const invalidSim = new SimulationHistory({ module: 'unknown' });
  const simErr = invalidSim.validateSync();
  assert.ok(simErr.errors.userId);
  assert.ok(simErr.errors.module);

  const validAttempt = new QuizAttempt({
    userId: '507f1f77bcf86cd799439011',
    module: 'cpu-scheduling',
    score: 2,
    total: 2,
    percentage: 100
  });
  assert.equal(validAttempt.validateSync(), undefined);
});

test('API: Health check, Auth (JWT), Simulations, History, and Learning Mode', async () => {
  const health = await request(app).get('/api/health');
  assert.equal(health.status, 200);
  assert.equal(health.body.status, 'ok');

  // Register user
  const reg = await request(app).post('/api/auth/register').send({
    name: 'Test Student',
    email: 'student@oslab.edu',
    password: 'password123'
  });
  assert.equal(reg.status, 201);
  assert.ok(reg.body.token);
  assert.equal(reg.body.user.email, 'student@oslab.edu');
  const token = reg.body.token;

  // Protected /me route rejects unauthenticated
  const unauthMe = await request(app).get('/api/auth/me');
  assert.equal(unauthMe.status, 401);

  // Protected /me succeeds with JWT
  const me = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${token}`);
  assert.equal(me.status, 200);
  assert.equal(me.body.user.name, 'Test Student');

  // Login works
  const login = await request(app).post('/api/auth/login').send({
    email: 'student@oslab.edu',
    password: 'password123'
  });
  assert.equal(login.status, 200);
  assert.ok(login.body.token);

  // Run CPU simulation with save=true and compare=true
  const cpu = await request(app)
    .post('/api/simulations/cpu')
    .set('Authorization', `Bearer ${token}`)
    .send({
      algorithm: 'RR',
      timeQuantum: 2,
      includeComparison: true,
      save: true,
      title: 'Lab 1 RR Test',
      processes: [
        { pid: 'P1', arrivalTime: 0, burstTime: 5 },
        { pid: 'P2', arrivalTime: 1, burstTime: 3 }
      ]
    });
  assert.equal(cpu.status, 200);
  assert.equal(cpu.body.result.algorithm, 'RR');
  assert.equal(cpu.body.comparison.length, 5);
  assert.ok(cpu.body.savedRecord);

  // Run other modules via API
  const mem = await request(app).post('/api/simulations/memory').send({
    algorithm: 'BEST_FIT',
    blocks: [100, 500, 200, 300, 600],
    requests: [{ pid: 'P1', size: 212 }]
  });
  assert.equal(mem.status, 200);
  assert.equal(mem.body.result.metrics.allocatedCount, 1);

  const page = await request(app).post('/api/simulations/page').send({
    algorithm: 'LRU',
    frameCount: 3,
    referenceString: [7, 0, 1, 2, 0, 3]
  });
  assert.equal(page.status, 200);
  assert.equal(page.body.result.metrics.pageFaults, 5);

  const deadlock = await request(app).post('/api/simulations/deadlock').send({
    allocation: [[0, 1, 0], [2, 0, 0]],
    max: [[1, 1, 1], [3, 2, 2]],
    available: [1, 1, 2]
  });
  assert.equal(deadlock.status, 200);
  assert.equal(deadlock.body.result.isSafe, true);

  const disk = await request(app).post('/api/simulations/disk').send({
    algorithm: 'SSTF',
    head: 53,
    diskSize: 200,
    requests: [98, 183, 37]
  });
  assert.equal(disk.status, 200);
  assert.equal(disk.body.result.metrics.totalSeekTime, 162);

  const sync = await request(app).post('/api/simulations/sync').send({
    problem: 'DINING_PHILOSOPHERS',
    strategy: 'asymmetric',
    philosopherCount: 5,
    rounds: 4
  });
  assert.equal(sync.status, 200);
  assert.equal(sync.body.result.deadlockDetected, false);

  // Fetch and delete saved history
  const hist = await request(app)
    .get('/api/simulations/history')
    .set('Authorization', `Bearer ${token}`);
  assert.equal(hist.status, 200);
  assert.equal(hist.body.items.length, 1);

  const del = await request(app)
    .delete(`/api/simulations/history/${hist.body.items[0]._id}`)
    .set('Authorization', `Bearer ${token}`);
  assert.equal(del.status, 200);
  assert.equal(del.body.deleted, true);

  // Learning content + quiz + practice
  const content = await request(app).get('/api/learning/content');
  assert.equal(content.status, 200);
  assert.equal(content.body.modules.length, 6);
  assert.ok(content.body.quizzes.length >= 10);

  const quizRes = await request(app)
    .post('/api/learning/quiz')
    .set('Authorization', `Bearer ${token}`)
    .send({
      module: 'cpu-scheduling',
      answers: { 'q-cpu-1': 2, 'q-cpu-2': 1 }
    });
  assert.equal(quizRes.status, 200);
  assert.equal(quizRes.body.score, 2);
  assert.equal(quizRes.body.percentage, 100);

  const attempts = await request(app)
    .get('/api/learning/attempts')
    .set('Authorization', `Bearer ${token}`);
  assert.equal(attempts.status, 200);
  assert.equal(attempts.body.items.length, 1);

  const prac = await request(app).post('/api/learning/practice/check').send({
    problemId: 'prac-cpu-1',
    answer: '4'
  });
  assert.equal(prac.status, 200);
  assert.equal(prac.body.isCorrect, true);
});

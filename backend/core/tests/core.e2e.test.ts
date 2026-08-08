import request from 'supertest';

// --- 1) Mock Prisma via singleton BEFORE importing app ---
jest.mock('@prisma/client', () => {
  const { prismaMock } = require('./prisma-singleton');
  return { PrismaClient: jest.fn(() => prismaMock) };
});

// --- 2) Mock axios (IAM + any external requests) ---
jest.mock('axios', () => ({
  get: jest.fn().mockResolvedValue({ data: { username: 'tester', userType: 'admin' } }),
  post: jest.fn().mockResolvedValue({ data: { success: true } }),
}));

// --- 3) Import app AFTER mocks ---
import app from '../app'; // ← Update path if different
import axios from 'axios';
import { prismaMock } from './prisma-singleton';

describe('CORE E2E', () => {
  const AUTH = { Authorization: 'Bearer faketoken' };

  beforeEach(() => {
    // Default: admin user
    (axios.get as jest.Mock).mockResolvedValue({ data: { username: 'tester', userType: 'admin' } });
    jest.clearAllMocks();
  });

  // ----------------- Exam APIs -----------------

  test('POST /exam/by-eid => 200 + an exam', async () => {
    (prismaMock.exam.findUnique as any).mockResolvedValue({
      eid: 123, courseCid: 10, min_score: 12, start_time: new Date(), end_time: new Date(), duration: 60, is_valid: true,
    });

    const res = await request(app).post('/exam/by-eid').set(AUTH).send({ eid: 123 });

    expect(res.status).toBe(200);
    expect(res.body).toEqual(expect.objectContaining({ success: true }));
    expect(res.body.data).toEqual(expect.objectContaining({ eid: 123, courseCid: 10 }));
  });

  test('POST /exam/by-course (admin) => 200 + exams list', async () => {
    (prismaMock.exam.findMany as any).mockResolvedValue([
      { eid: 1, courseCid: 7, min_score: 10, start_time: new Date(), end_time: new Date(), duration: 30, is_valid: true },
      { eid: 2, courseCid: 7, min_score: 12, start_time: new Date(), end_time: new Date(), duration: 60, is_valid: false },
    ]);

    const res = await request(app).post('/exam/by-course').set(AUTH).send({ cid: 7 });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(2);
  });

  test('POST /exam/by-course (normal user + not enrolled) => 403', async () => {
    (axios.get as jest.Mock).mockResolvedValueOnce({ data: { username: 'u1', userType: 'normal' } });
    (prismaMock.student.findUnique as any).mockResolvedValue(null);

    const res = await request(app).post('/exam/by-course').set(AUTH).send({ cid: 99 });

    expect(res.status).toBe(403);
  });

  test('POST /exam/by-course (normal user + enrolled) => 200', async () => {
    (axios.get as jest.Mock).mockResolvedValueOnce({ data: { username: 'u1', userType: 'normal' } });
    (prismaMock.student.findUnique as any).mockResolvedValue({ username: 'u1', cid: 99 });
    (prismaMock.exam.findMany as any).mockResolvedValue([
      { eid: 10, courseCid: 99, min_score: 10, start_time: new Date(), end_time: new Date(), duration: 45, is_valid: true },
    ]);

    const res = await request(app).post('/exam/by-course').set(AUTH).send({ cid: 99 });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(1);
  });

  test('POST /exam/question-by-eid (admin) => 200 + questions without ans', async () => {
    (prismaMock.question.findMany as any).mockResolvedValue([
      { qid: 1, quest: 'Q1', option1: 'A', option2: 'B', option3: 'C', option4: 'D', option5: 'E' },
      { qid: 2, quest: 'Q2', option1: 'A', option2: 'B', option3: 'C', option4: 'D', option5: 'E' },
    ]);

    const res = await request(app).post('/exam/question-by-eid').set(AUTH).send({ eid: 55 });

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.questions)).toBe(true);
    expect(res.body.questions[0]).toHaveProperty('qid');
    expect(res.body.questions[0]).not.toHaveProperty('ans');
  });

  test('POST /exam => create new exam (course requester user) => 201', async () => {
    (axios.get as jest.Mock).mockResolvedValueOnce({ data: { username: 'reqUser', userType: 'normal' } });
    (prismaMock.courseRequester.findUnique as any).mockResolvedValue({ username: 'reqUser', cid: 77 });
    (prismaMock.exam.create as any).mockResolvedValue({
      eid: 700, courseCid: 77, min_score: 10, start_time: new Date('2025-02-25T08:00:00Z'),
      end_time: new Date('2025-02-25T10:00:00Z'), duration: 120, is_valid: false,
    });
    (prismaMock.question.createMany as any).mockResolvedValue({ count: 2 });
    (prismaMock.admin.findMany as any).mockResolvedValue([{ username: 'admin1' }]);
    (prismaMock.examMessage.create as any).mockResolvedValue({
      id: 1, sender: 'reqUser', reciver: 'admin1', eid: 700, text: 'please approve', date: new Date(),
    });

    const body = {
      cid: 77, min_score: 10,
      start_time: '2025-02-25T08:00:00.000Z', end_time: '2025-02-25T10:00:00.000Z',
      duration: 120, message: 'please approve',
      questions: [{ quest: 'Q1', option1: 'A', option2: 'B', ans: 1 }, { quest: 'Q2', option1: 'A', option2: 'B', option3: 'C', ans: 2 }],
    };

    const res = await request(app).post('/exam').set(AUTH).send(body);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.eid).toBe(700);
  });

  test('GET /admin/exam-message (admin) => 200 + messages array', async () => {
    (prismaMock.examMessage.findMany as any).mockResolvedValue([
      { id: 11, sender: 's1', reciver: 'tester', eid: 700, text: 'msg1', date: new Date() },
      { id: 12, sender: 's2', reciver: 'tester', eid: 701, text: 'msg2', date: new Date() },
    ]);

    const res = await request(app).get('/admin/exam-message').set(AUTH);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.messages)).toBe(true);
    expect(res.body.messages[0]).toHaveProperty('type', 'ExamMessage');
  });

  test('POST /exam/by-eid => 404 when exam not found', async () => {
    (prismaMock.exam.findUnique as any).mockResolvedValue(null);

    const res = await request(app).post('/exam/by-eid').set(AUTH).send({ eid: 99999 });

    expect(res.status).toBe(404);
  });

  test('POST /exam/by-course => 401 when no token', async () => {
    const res = await request(app).post('/exam/by-course').send({ cid: 1 });
    expect(res.status).toBe(401);
  });

  // ----------------- Owner APIs -----------------

  test('POST /owner => 403 when user is not owner', async () => {
    (axios.get as jest.Mock).mockResolvedValueOnce({ data: { username: 'x', userType: 'admin' } });

    const res = await request(app).post('/owner').set(AUTH).send({ username: 'u1', isAdmin: true });
    expect(res.status).toBe(403);
  });

  test('GET /owner/see-all => 200 (owner) + users list with isAdmin', async () => {
    (axios.get as jest.Mock).mockResolvedValueOnce({ data: { username: 'o1', userType: 'owner' } });
    (prismaMock.user.findMany as any).mockResolvedValue([
      { username: 'u1', first_name: 'a', last_name: 'b', mail: 'u1@x.com' },
      { username: 'u2', first_name: 'c', last_name: 'd', mail: 'u2@x.com' },
    ]);
    (prismaMock.admin.findMany as any).mockResolvedValue([{ username: 'u2' }]);

    const res = await request(app).get('/owner/see-all').set(AUTH);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    const u2 = res.body.data.find((u: any) => u.username === 'u2');
    expect(u2.isAdmin).toBe(true);
  });

  test('GET /owner/see-admin => 200 (owner) + message count per admin', async () => {
    (axios.get as jest.Mock).mockResolvedValueOnce({ data: { username: 'o1', userType: 'owner' } });
    (prismaMock.admin.findMany as any).mockResolvedValue([{ username: 'a1' }, { username: 'a2' }]);

    // Mock $transaction to return three numbers
    (prismaMock.$transaction as any).mockImplementation(async (_ops: any[]) => [2, 3, 5]);

    const res = await request(app).get('/owner/see-admin').set(AUTH);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body[0]).toHaveProperty('username');
    expect(res.body[0]).toHaveProperty('messageNumber');
  });

  // ----------------- Payment APIs -----------------

  test('POST /payment/pay => 200 (in test mode) + paymentUrl', async () => {
    // payController responds immediately in IS_TEST mode
    const res = await request(app).post('/payment/pay').send({ totalPrice: 123000 });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.paymentUrl).toContain('http://localhost:5170/result?Status=OK');
  });

  test('POST /payment/roll-back => 200 (in test mode) transfer from Shop to Student', async () => {
    (axios.get as jest.Mock).mockResolvedValueOnce({ data: { username: 'buyer', userType: 'normal' } });
    (prismaMock.shop.findMany as any).mockResolvedValue([{ cid: 10 }, { cid: 11 }]);
    (prismaMock.$transaction as any).mockResolvedValue(true);

    const res = await request(app).post('/payment/roll-back').set(AUTH).send({ authority: 'TEST' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(prismaMock.shop.findMany).toHaveBeenCalledWith({ where: { username: 'buyer' } });
  });

  // ----------------- User APIs (simple examples) -----------------

  test('GET /user/overview => 401 when no token', async () => {
    const res = await request(app).get('/user/overview');
    expect(res.status).toBe(401);
  });

  test('GET /user/get-message => 200 when messages exist', async () => {
    (axios.get as jest.Mock).mockResolvedValueOnce({ data: { username: 'u1', userType: 'normal' } });
    (prismaMock.message.findMany as any).mockResolvedValue([
      { sender: 'admin', reciver: 'u1', text: 'hi', date: new Date() },
    ]);

    const res = await request(app).get('/user/get-message').set(AUTH);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.messages)).toBe(true);
    expect(res.body.messages.length).toBe(1);
  });
});
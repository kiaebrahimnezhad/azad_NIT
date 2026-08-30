import request from 'supertest';

// --- 1) Mock Prisma via singleton BEFORE importing app ---
// نکته: کلاس‌های خطای واقعی (Prisma.PrismaClientKnownRequestError و ...) هم نگه داشته می‌شن
// تا کدی که با instanceof این خطاها رو تشخیص می‌ده (مثلاً userManageService.deleteUser) قابل تست باشه.
jest.mock('@prisma/client', () => {
  const { prismaMock } = require('./prisma-singleton');
  const actual = jest.requireActual('@prisma/client');
  return { ...actual, PrismaClient: jest.fn(() => prismaMock) };
});

// --- 2) Mock axios (IAM + any external requests) ---
jest.mock('axios', () => ({
  get: jest.fn().mockResolvedValue({ data: { username: 'tester', userType: 'admin' } }),
  post: jest.fn().mockResolvedValue({ data: { success: true } }),
}));

// --- 3) Import app AFTER mocks ---
import app from '../app'; // ← Update path if different
import axios from 'axios';
import { Prisma } from '@prisma/client';
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

  test('POST /exam/submit => 200 with passed:false when the score is below the minimum', async () => {
    (axios.get as jest.Mock).mockResolvedValueOnce({ data: { username: 'student1', userType: 'normal' } });
    (prismaMock.exam.findUnique as any).mockResolvedValue({
      eid: 50, min_score: 15, courseCid: 7,
      questions: [
        { qid: 1, ans: 2 },
        { qid: 2, ans: 3 },
      ],
    });
    (prismaMock.course.findUnique as any).mockResolvedValue({ name: 'Course A' });
    (prismaMock.student.findUnique as any).mockResolvedValue({ username: 'student1', cid: 7 });
    (prismaMock.user.findUnique as any).mockResolvedValue({ username: 'student1', first_name: 'A', last_name: 'B' });
    (prismaMock.$transaction as any).mockResolvedValue(true);

    const res = await request(app)
      .post('/exam/submit')
      .set(AUTH)
      .send({ eid: 50, answers: [{ qid: 1, ans: 1 }, { qid: 2, ans: 1 }] }); // هردو غلط

    expect(res.status).toBe(200);
    expect(res.body).toEqual(expect.objectContaining({ success: true, passed: false }));
  });

  test('POST /exam/submit => 500 with a clean JSON error when a DB lookup fails', async () => {
    (axios.get as jest.Mock).mockResolvedValueOnce({ data: { username: 'student1', userType: 'normal' } });
    (prismaMock.exam.findUnique as any).mockRejectedValue(new Error('DB connection lost'));

    const res = await request(app)
      .post('/exam/submit')
      .set(AUTH)
      .send({ eid: 50, answers: [] });

    // قبلاً این خطا اصلاً گرفته نمی‌شد و درخواست بدون پاسخ JSON درست می‌ترکید
    expect(res.status).toBe(500);
    expect(res.body).toEqual(expect.objectContaining({ success: false }));
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

  test('POST /owner (toDelete) => 403 when target user is an owner', async () => {
    (axios.get as jest.Mock).mockResolvedValueOnce({ data: { username: 'o1', userType: 'owner' } });
    (prismaMock.user.findUnique as any).mockResolvedValue({ username: 'o2' });
    (prismaMock.owner.findUnique as any).mockResolvedValue({ username: 'o2' });

    const res = await request(app).post('/owner').set(AUTH).send({ username: 'o2', toDelete: true });

    expect(res.status).toBe(403);
    expect(prismaMock.user.delete).not.toHaveBeenCalled();
  });

  test('POST /owner (toDelete) => 409 when target user has related records (FK constraint)', async () => {
    (axios.get as jest.Mock).mockResolvedValueOnce({ data: { username: 'o1', userType: 'owner' } });
    (prismaMock.user.findUnique as any).mockResolvedValue({ username: 'busyUser' });
    (prismaMock.owner.findUnique as any).mockResolvedValue(null);
    (prismaMock.admin.findUnique as any).mockResolvedValue(null);
    (prismaMock.user.delete as any).mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('Foreign key constraint failed', {
        code: 'P2003',
        clientVersion: '6.3.0',
      })
    );

    const res = await request(app).post('/owner').set(AUTH).send({ username: 'busyUser', toDelete: true });

    expect(res.status).toBe(409);
  });

  test('POST /owner (toDelete) => 200 when deleting a user with no related records', async () => {
    (axios.get as jest.Mock).mockResolvedValueOnce({ data: { username: 'o1', userType: 'owner' } });
    (prismaMock.user.findUnique as any).mockResolvedValue({ username: 'freeUser' });
    (prismaMock.owner.findUnique as any).mockResolvedValue(null);
    (prismaMock.admin.findUnique as any).mockResolvedValue(null);
    (prismaMock.user.delete as any).mockResolvedValue({ username: 'freeUser' });

    const res = await request(app).post('/owner').set(AUTH).send({ username: 'freeUser', toDelete: true });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('user deleted');
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

  test('GET /owner/see-all => 401 when no token (does not leak the user list)', async () => {
    const res = await request(app).get('/owner/see-all');

    expect(res.status).toBe(401);
    expect(prismaMock.user.findMany).not.toHaveBeenCalled();
  });

  test('GET /owner/see-all => 403 when caller is not owner (does not leak the user list)', async () => {
    (axios.get as jest.Mock).mockResolvedValueOnce({ data: { username: 'x', userType: 'admin' } });

    const res = await request(app).get('/owner/see-all').set(AUTH);

    expect(res.status).toBe(403);
    expect(prismaMock.user.findMany).not.toHaveBeenCalled();
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

  test('POST /courses => rotates through admins across consecutive course submissions', async () => {
    (axios.get as jest.Mock)
      .mockResolvedValueOnce({ data: { username: 'teacher1' } })
      .mockResolvedValueOnce({ data: { username: 'teacher1' } });
    (prismaMock.admin.findMany as any).mockResolvedValue([
      { username: 'admin1' },
      { username: 'admin2' },
    ]);
    (prismaMock.course.findFirst as any).mockResolvedValue(null);
    (prismaMock.course.create as any).mockResolvedValue({});
    (prismaMock.time.createMany as any).mockResolvedValue({ count: 1 });
    (prismaMock.courseRequester.create as any).mockResolvedValue({});
    (prismaMock.courseMessage.create as any).mockResolvedValue({});

    const submitCourse = () =>
      request(app)
        .post('/courses')
        .set(AUTH)
        .field('start_time', '2025-01-01T00:00:00.000Z')
        .field('end_time', '2025-01-02T00:00:00.000Z')
        .field('start_sign_up', '2024-12-01T00:00:00.000Z')
        .field('end_sign_up', '2024-12-25T00:00:00.000Z')
        .field('price', '1000')
        .field('field1', 'CS')
        .field('name', 'Course A')
        .field('times', JSON.stringify([{ day: 'Sat', start_time: 480, end_time: 600 }]))
        .attach('image', Buffer.from('fake-image-bytes'), 'test.png');

    await submitCourse();
    await submitCourse();

    const calls = (prismaMock.courseMessage.create as jest.Mock).mock.calls;
    expect(calls).toHaveLength(2);
    const reciver1 = calls[0][0].data.reciver;
    const reciver2 = calls[1][0].data.reciver;
    expect(['admin1', 'admin2']).toContain(reciver1);
    expect(['admin1', 'admin2']).toContain(reciver2);
    // نکته‌ی اصلی همینه: دو تماس پشت‌سرهم نباید به یه ادمین ثابت برن
    expect(reciver1).not.toBe(reciver2);
  });

  // ----------------- Admin/Course APIs -----------------
  // این API هم پشت صفحه‌ی عمومی جزئیات دوره (CourseDetail.tsx، بدون نیاز به لاگین)
  // و هم پشت صفحه‌ی بررسی دوره‌های در انتظار تأیید توسط ادمین (WatchCourses.tsx) قرار داره.
  // پس فقط دوره‌های هنوز تأییدنشده (is_valid=false) باید محافظت بشن.

  test('POST /admin/get-course => 200 (no token needed) for an already-approved course', async () => {
    (prismaMock.course.findUnique as any).mockResolvedValue({ cid: 3, name: 'Course A', image: 'a.png', is_valid: true });
    (prismaMock.time.findMany as any).mockResolvedValue([{ day: 'Sat', start_time: 480, end_time: 600 }]);

    const res = await request(app).post('/admin/get-course').send({ cid: 3 });

    expect(res.status).toBe(200);
    expect(res.body.course).toEqual(expect.objectContaining({ cid: 3 }));
    expect(axios.get).not.toHaveBeenCalled();
  });

  test('POST /admin/get-course => 401 when no token, for a not-yet-approved course', async () => {
    (prismaMock.course.findUnique as any).mockResolvedValue({ cid: 4, name: 'Pending course', is_valid: false });

    const res = await request(app).post('/admin/get-course').send({ cid: 4 });

    expect(res.status).toBe(401);
    expect(prismaMock.time.findMany).not.toHaveBeenCalled();
  });

  test('POST /admin/get-course => 403 when caller is a normal user, for a not-yet-approved course', async () => {
    (prismaMock.course.findUnique as any).mockResolvedValue({ cid: 4, name: 'Pending course', is_valid: false });
    (axios.get as jest.Mock).mockResolvedValueOnce({ data: { username: 'u1', userType: 'normal' } });

    const res = await request(app).post('/admin/get-course').set(AUTH).send({ cid: 4 });

    expect(res.status).toBe(403);
    expect(prismaMock.time.findMany).not.toHaveBeenCalled();
  });

  test('POST /admin/get-course => 200 (admin) + course details, for a not-yet-approved course', async () => {
    (prismaMock.course.findUnique as any).mockResolvedValue({ cid: 4, name: 'Pending course', is_valid: false });
    (axios.get as jest.Mock).mockResolvedValueOnce({ data: { username: 'a1', userType: 'admin' } });
    (prismaMock.time.findMany as any).mockResolvedValue([{ day: 'Sat', start_time: 480, end_time: 600 }]);

    const res = await request(app).post('/admin/get-course').set(AUTH).send({ cid: 4 });

    expect(res.status).toBe(200);
    expect(res.body.course).toEqual(expect.objectContaining({ cid: 4 }));
    expect(res.body.time).toHaveLength(1);
  });

  // این API فقط توسط CommentReports.tsx (پنل رسیدگی به گزارش کامنت‌های ادمین) صدا زده
  // می‌شه، نه صفحه‌ی عمومی کامنت‌ها — پس برخلاف /admin/get-comment، باید فقط ادمین باشه.

  test('POST /admin/get-message => 401 when no token', async () => {
    const res = await request(app).post('/admin/get-message').send({ commentId: 1 });

    expect(res.status).toBe(401);
    expect(prismaMock.comment.findUnique).not.toHaveBeenCalled();
  });

  test('POST /admin/get-message => 403 when caller is not admin', async () => {
    (axios.get as jest.Mock).mockResolvedValueOnce({ data: { username: 'o1', userType: 'owner' } });

    const res = await request(app).post('/admin/get-message').set(AUTH).send({ commentId: 1 });

    expect(res.status).toBe(403);
    expect(prismaMock.comment.findUnique).not.toHaveBeenCalled();
  });

  test('POST /admin/get-message => 200 (admin) + reported comment', async () => {
    (axios.get as jest.Mock).mockResolvedValueOnce({ data: { username: 'a1', userType: 'admin' } });
    (prismaMock.comment.findUnique as any).mockResolvedValue({ id: 5, text: 'reported text' });

    const res = await request(app).post('/admin/get-message').set(AUTH).send({ commentId: 5 });

    expect(res.status).toBe(200);
    expect(res.body).toEqual(expect.objectContaining({ id: 5 }));
  });

  // ----------------- Approval APIs -----------------
  // هر دو باید پیام همراهِ تأییدِ ادمین رو (که فرانت اجباری می‌فرسته) واقعاً ذخیره کنن.

  test('POST /admin/validate-course => 400 when message is missing', async () => {
    (axios.get as jest.Mock).mockResolvedValueOnce({ data: { username: 'admin1', userType: 'admin' } });

    const res = await request(app).post('/admin/validate-course').set(AUTH).send({ courseId: 7 });

    expect(res.status).toBe(400);
    expect(prismaMock.course.update).not.toHaveBeenCalled();
  });

  test('POST /admin/validate-course => 200 + notifies the requester with the approval message', async () => {
    (axios.get as jest.Mock).mockResolvedValueOnce({ data: { username: 'admin1', userType: 'admin' } });
    (prismaMock.course.findUnique as any).mockResolvedValue({ cid: 7, is_valid: false });
    (prismaMock.course.update as any).mockResolvedValue({ cid: 7, is_valid: true });
    (prismaMock.courseRequester.findMany as any).mockResolvedValue([{ username: 'reqUser' }]);
    (prismaMock.teacher.create as any).mockResolvedValue({ username: 'reqUser', cid: 7 });
    (prismaMock.courseMessage.deleteMany as any).mockResolvedValue({ count: 1 });
    (prismaMock.message.create as any).mockResolvedValue({ id: 1 });

    const res = await request(app)
      .post('/admin/validate-course')
      .set(AUTH)
      .send({ courseId: 7, message: 'دوره خوبی بود، تایید شد' });

    expect(res.status).toBe(200);
    expect(prismaMock.message.create).toHaveBeenCalledWith({
      data: {
        reciver: 'reqUser',
        sender: 'admin1',
        text: 'دوره خوبی بود، تایید شد',
        date: expect.any(Date),
      },
    });
  });

  test('POST /admin/validate-exam => 400 when message is missing', async () => {
    (axios.get as jest.Mock).mockResolvedValueOnce({ data: { username: 'admin1', userType: 'admin' } });

    const res = await request(app).post('/admin/validate-exam').set(AUTH).send({ examId: 9 });

    expect(res.status).toBe(400);
    expect(prismaMock.exam.update).not.toHaveBeenCalled();
  });

  test('POST /admin/validate-exam => 200 + notifies the requester with the approval message', async () => {
    (axios.get as jest.Mock).mockResolvedValueOnce({ data: { username: 'admin1', userType: 'admin' } });
    (prismaMock.exam.findUnique as any).mockResolvedValue({ eid: 9, is_valid: false });
    (prismaMock.exam.update as any).mockResolvedValue({ eid: 9, is_valid: true });
    (prismaMock.examMessage.findMany as any).mockResolvedValue([{ sender: 'reqUser' }]);
    (prismaMock.examMessage.deleteMany as any).mockResolvedValue({ count: 1 });
    (prismaMock.message.create as any).mockResolvedValue({ id: 1 });

    const res = await request(app)
      .post('/admin/validate-exam')
      .set(AUTH)
      .send({ examId: 9, message: 'آزمون خوبی بود، تایید شد' });

    expect(res.status).toBe(200);
    expect(prismaMock.message.create).toHaveBeenCalledWith({
      data: {
        reciver: 'reqUser',
        sender: 'admin1',
        text: 'آزمون خوبی بود، تایید شد',
        date: expect.any(Date),
      },
    });
  });

  // ----------------- Payment APIs -----------------

  test('POST /payment/pay => 200 (in test mode) + paymentUrl', async () => {
    // payController responds immediately in IS_TEST mode
    const res = await request(app).post('/payment/pay').send({ totalPrice: 123000 });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.paymentUrl).toContain('http://localhost:5170/result?Status=OK');
  });

  test('POST /payment/pay (real gateway) => ignores client-supplied totalPrice and charges the real basket total', async () => {
    const originalMerchantId = process.env.ZARINPAL_MERCHANT_ID;
    process.env.ZARINPAL_MERCHANT_ID = 'realmerchantid'; // خارج از حالت تستی

    try {
      (axios.get as jest.Mock).mockResolvedValueOnce({ data: { username: 'buyer', userType: 'normal' } });
      (prismaMock.shop.findMany as any).mockResolvedValue([{ cid: 10 }, { cid: 11 }]);
      (prismaMock.course.findMany as any).mockResolvedValue([
        { cid: 10, price: 100000 },
        { cid: 11, price: 50000 },
      ]);
      (axios.post as jest.Mock).mockResolvedValueOnce({
        data: { data: { code: 100, authority: 'AUTH123' } },
      });

      // کاربر عمداً مبلغ کمتری (۱ تومان) به‌جای مبلغ واقعی (۱۵۰٬۰۰۰) می‌فرسته
      const res = await request(app).post('/payment/pay').set(AUTH).send({ totalPrice: 1 });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      // سرور باید مبلغ واقعیِ محاسبه‌شده از سبد خرید (۱۵۰٬۰۰۰) رو به زرین‌پال بفرسته، نه عدد دستکاری‌شده
      // و آدرس بازگشت (callback_url) هم باید یه مقدار واقعی و معتبر باشه، نه undefined
      // (رفع باگ عدم تطابق اسم process.env.BASE_URL با .env)
      expect(axios.post).toHaveBeenCalledWith(
        'https://api.zarinpal.com/pg/v4/payment/request.json',
        expect.objectContaining({
          amount: 150000,
          callback_url: 'http://localhost:5170/result',
        })
      );
    } finally {
      process.env.ZARINPAL_MERCHANT_ID = originalMerchantId;
    }
  });

  test('POST /payment/pay (real gateway) => enrolls directly without Zarinpal when the whole basket is free', async () => {
    const originalMerchantId = process.env.ZARINPAL_MERCHANT_ID;
    process.env.ZARINPAL_MERCHANT_ID = 'realmerchantid';

    try {
      (axios.get as jest.Mock).mockResolvedValueOnce({ data: { username: 'buyer', userType: 'normal' } });
      (prismaMock.shop.findMany as any).mockResolvedValue([{ cid: 20 }, { cid: 21 }]);
      (prismaMock.course.findMany as any).mockResolvedValue([
        { cid: 20, price: 0 },
        { cid: 21, price: 0 },
      ]);
      (prismaMock.$transaction as any).mockResolvedValue(true);

      const res = await request(app).post('/payment/pay').set(AUTH).send({ totalPrice: 0 });

      expect(res.status).toBe(200);
      expect(res.body).toEqual(expect.objectContaining({ success: true, free: true }));
      expect(axios.post).not.toHaveBeenCalled(); // اصلاً نباید سراغ زرین‌پال بره
    } finally {
      process.env.ZARINPAL_MERCHANT_ID = originalMerchantId;
    }
  });

  test('POST /payment/pay (real gateway) => still goes through Zarinpal for a mixed free+paid basket, charging only the paid part', async () => {
    const originalMerchantId = process.env.ZARINPAL_MERCHANT_ID;
    process.env.ZARINPAL_MERCHANT_ID = 'realmerchantid';

    try {
      (axios.get as jest.Mock).mockResolvedValueOnce({ data: { username: 'buyer', userType: 'normal' } });
      (prismaMock.shop.findMany as any).mockResolvedValue([{ cid: 20 }, { cid: 21 }, { cid: 22 }]);
      (prismaMock.course.findMany as any).mockResolvedValue([
        { cid: 20, price: 0 },
        { cid: 21, price: 0 },
        { cid: 22, price: 75000 },
      ]);
      (axios.post as jest.Mock).mockResolvedValueOnce({
        data: { data: { code: 100, authority: 'AUTH_MIXED' } },
      });

      const res = await request(app).post('/payment/pay').set(AUTH).send({ totalPrice: 0 });

      expect(res.status).toBe(200);
      expect(res.body.paymentUrl).toContain('AUTH_MIXED'); // یعنی واقعاً از مسیر زرین‌پال رفته، نه مسیر رایگان
      expect(axios.post).toHaveBeenCalledWith(
        'https://api.zarinpal.com/pg/v4/payment/request.json',
        expect.objectContaining({ amount: 75000 })
      );
    } finally {
      process.env.ZARINPAL_MERCHANT_ID = originalMerchantId;
    }
  });

  test('POST /payment/pay (real gateway) => 400 when basket is empty', async () => {
    const originalMerchantId = process.env.ZARINPAL_MERCHANT_ID;
    process.env.ZARINPAL_MERCHANT_ID = 'realmerchantid';

    try {
      (axios.get as jest.Mock).mockResolvedValueOnce({ data: { username: 'buyer', userType: 'normal' } });
      (prismaMock.shop.findMany as any).mockResolvedValue([]);

      const res = await request(app).post('/payment/pay').set(AUTH).send({ totalPrice: 999999 });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(axios.post).not.toHaveBeenCalled();
    } finally {
      process.env.ZARINPAL_MERCHANT_ID = originalMerchantId;
    }
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

  test('POST /payment/roll-back (real gateway) => 200 first time, verifies with Zarinpal and records the payment', async () => {
    const originalMerchantId = process.env.ZARINPAL_MERCHANT_ID;
    process.env.ZARINPAL_MERCHANT_ID = 'realmerchantid';

    try {
      (axios.get as jest.Mock).mockResolvedValueOnce({ data: { username: 'buyer', userType: 'normal' } });
      (prismaMock.payment.findUnique as any).mockResolvedValue(null);
      (axios.post as jest.Mock).mockResolvedValueOnce({
        data: { data: { code: 100, ref_id: 987654 } },
      });
      (prismaMock.shop.findMany as any).mockResolvedValue([{ cid: 10 }]);
      (prismaMock.$transaction as any).mockResolvedValue(true);

      const res = await request(app).post('/payment/roll-back').set(AUTH).send({ authority: 'REAL_AUTH' });

      expect(res.status).toBe(200);
      expect(res.body.refId).toBe('987654');
      expect(axios.post).toHaveBeenCalledTimes(1); // زرین‌پال verify شد
    } finally {
      process.env.ZARINPAL_MERCHANT_ID = originalMerchantId;
    }
  });

  test('POST /payment/roll-back (real gateway) => 200 on a repeated call with the same authority, without re-verifying at Zarinpal', async () => {
    const originalMerchantId = process.env.ZARINPAL_MERCHANT_ID;
    process.env.ZARINPAL_MERCHANT_ID = 'realmerchantid';

    try {
      (axios.get as jest.Mock).mockResolvedValueOnce({ data: { username: 'buyer', userType: 'normal' } });
      (prismaMock.payment.findUnique as any).mockResolvedValue({
        authority: 'REAL_AUTH', username: 'buyer', ref_id: '987654', created_at: new Date(),
      });

      // مثلاً کاربر همین صفحه‌ی نتیجه رو رفرش کرده
      const res = await request(app).post('/payment/roll-back').set(AUTH).send({ authority: 'REAL_AUTH' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.refId).toBe('987654');
      expect(axios.post).not.toHaveBeenCalled(); // اصلاً دوباره از زرین‌پال verify نشد
    } finally {
      process.env.ZARINPAL_MERCHANT_ID = originalMerchantId;
    }
  });

  test('POST /payment/add => 404 when the course does not exist', async () => {
    (axios.get as jest.Mock).mockResolvedValueOnce({ data: { username: 'buyer', userType: 'normal' } });
    (prismaMock.course.findUnique as any).mockResolvedValue(null);

    const res = await request(app).post('/payment/add').set(AUTH).send({ cid: 999 });

    expect(res.status).toBe(404);
    expect(prismaMock.shop.create).not.toHaveBeenCalled();
  });

  test('POST /payment/add => 400 when the course is not yet approved', async () => {
    (axios.get as jest.Mock).mockResolvedValueOnce({ data: { username: 'buyer', userType: 'normal' } });
    (prismaMock.course.findUnique as any).mockResolvedValue({ cid: 4, is_valid: false });

    const res = await request(app).post('/payment/add').set(AUTH).send({ cid: 4 });

    expect(res.status).toBe(400);
    expect(prismaMock.shop.create).not.toHaveBeenCalled();
  });

  test('POST /payment/add => 200 when the course exists and is approved', async () => {
    (axios.get as jest.Mock).mockResolvedValueOnce({ data: { username: 'buyer', userType: 'normal' } });
    (prismaMock.course.findUnique as any).mockResolvedValue({ cid: 7, is_valid: true });
    (prismaMock.shop.create as any).mockResolvedValue({ username: 'buyer', cid: 7 });

    const res = await request(app).post('/payment/add').set(AUTH).send({ cid: 7 });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test('POST /payment/add => 409 with a clear message when the course is already in the basket', async () => {
    (axios.get as jest.Mock).mockResolvedValueOnce({ data: { username: 'buyer', userType: 'normal' } });
    (prismaMock.course.findUnique as any).mockResolvedValue({ cid: 7, is_valid: true });
    (prismaMock.shop.create as any).mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
        code: 'P2002',
        clientVersion: '6.3.0',
      })
    );

    const res = await request(app).post('/payment/add').set(AUTH).send({ cid: 7 });

    expect(res.status).toBe(409);
    expect(res.body.message).toBe('این دوره در سبد خرید شما موجود است');
  });

  // ----------------- User APIs (simple examples) -----------------

  test('GET /user/overview => 401 when no token', async () => {
    const res = await request(app).get('/user/overview');
    expect(res.status).toBe(401);
  });

  test('POST /user/update-user => 200 with a new token issued by iam when username changes', async () => {
    (axios.get as jest.Mock).mockResolvedValueOnce({ data: { username: 'oldUser', userType: 'normal' } });
    (prismaMock.user.findUnique as any).mockResolvedValue(null); // بدون تداخل نام‌کاربری/ایمیل
    (prismaMock.user.update as any).mockResolvedValue({
      username: 'newUser', first_name: 'A', last_name: 'B', father_name: 'C',
      field: 'CS', student_id: '1', phone: '0912', mail: 'a@b.com',
    });
    (prismaMock.$transaction as any).mockResolvedValue(true);
    (axios.post as jest.Mock).mockResolvedValueOnce({ data: { token: 'brand-new-jwt' } });

    const res = await request(app)
      .post('/user/update-user')
      .set(AUTH)
      .send({
        username: 'newUser', first_name: 'A', last_name: 'B', father_name: 'C',
        field: 'CS', student_id: '1', phone: '0912', mail: 'a@b.com',
      });

    expect(res.status).toBe(200);
    // توکن باید همونی باشه که iam برگردونده، نه چیزی که core خودش امضا کرده باشه
    expect(res.body.token).toBe('brand-new-jwt');
    expect(axios.post).toHaveBeenCalledWith(
      expect.stringContaining('/login/reissue-token'),
      { newUsername: 'newUser' },
      expect.objectContaining({
        // این هدر اثبات می‌کنه درخواست واقعاً از core میاد، نه یه کاربر دیگه که
        // مستقیم iam رو صدا زده — بدون این هدر iam این درخواست رو رد می‌کنه.
        headers: expect.objectContaining({
          Authorization: 'Bearer faketoken',
          'X-Internal-Secret': process.env.INTERNAL_SERVICE_SECRET,
        }),
      })
    );
    // خودِ آپدیت جدول User باید *داخل* همون تراکنشی باشه که جدول‌های مرتبط رو
    // آپدیت می‌کنه (نه یه فراخوانی جدا و قبل از اون) — یعنی همه یا هیچ‌کدوم.
    // ۱ آپدیت User + ۱۷ آپدیت جدول‌های مرتبط = ۱۸ آیتم توی آرایه‌ی $transaction.
    expect(prismaMock.$transaction).toHaveBeenCalledTimes(1);
    expect((prismaMock.$transaction as jest.Mock).mock.calls[0][0]).toHaveLength(18);
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
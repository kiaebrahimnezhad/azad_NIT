import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { app } from '../app';

const prisma = new PrismaClient();

describe('IAM E2E', () => {
  const unique = Date.now();
  const username = `user_${unique}`;
  const mail = `user_${unique}@example.com`;
  const password = 'P@ssw0rd!';
  const newPassword1 = 'N3wP@ss1!';
  const newPassword2 = 'N3wP@ss2!';

  afterAll(async () => {
    // Clean up test data (optional)
    await prisma.otp.deleteMany({ where: { mail } });
    await prisma.user.deleteMany({ where: { username } });
    await prisma.$disconnect();
  });

  it('POST /sign-up => send OTP', async () => {
    const res = await request(app)
      .post('/sign-up/')
      .send({
        username,
        password,
        first_name: 'Ali',
        last_name: 'Ahmadi',
        father_name: 'Hossein',
        field: 'CS',
        student_id: '12345',
        phone: '0912000000',
        mail,
      });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('message', 'OTP sent');

    // OTP should be saved in DB
    const otpRow = await prisma.otp.findUnique({ where: { mail } });
    expect(otpRow).toBeTruthy();
    expect(otpRow?.otp).toHaveLength(6);
  });

  it('POST /sign-up/verify-otp => commit signup', async () => {
    const otpRow = await prisma.otp.findUnique({ where: { mail } });
    expect(otpRow).toBeTruthy();

    const res = await request(app)
      .post('/sign-up/verify-otp')
      .send({ mail, otp: otpRow!.otp });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('message', 'Sign up successful');

    const user = await prisma.user.findUnique({ where: { username } });
    expect(user).toBeTruthy();
    expect(user?.verified).toBe(true);
  });

  let token = '';

  it('POST /login => get JWT', async () => {
    const res = await request(app)
      .post('/login/')
      .send({ username, password });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
    expect(res.body).toHaveProperty('userType');
    token = res.body.token;
  });

  it('GET /login/user-info => returns user info from token', async () => {
    const res = await request(app)
      .get('/login/user-info')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      username,
      userType: expect.any(String),
    });
  });

  it('POST /login/forgot-password => send OTP for reset', async () => {
    const res = await request(app)
      .post('/login/forgot-password')
      .send({ mail });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('success', true);

    const otpRow = await prisma.otp.findUnique({ where: { mail } });
    expect(otpRow).toBeTruthy();
  });

  it('POST /login/forgot-password-otp => change password with OTP', async () => {
    const otpRow = await prisma.otp.findUnique({ where: { mail } });
    expect(otpRow).toBeTruthy();

    const res = await request(app)
      .post('/login/forgot-password-otp')
      .send({ mail, otp: otpRow!.otp, newPassword: newPassword1 });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('success', true);

    // Now login with the new password
    const loginRes = await request(app)
      .post('/login/')
      .send({ username, password: newPassword1 });

    expect(loginRes.status).toBe(200);
    expect(loginRes.body).toHaveProperty('token');
    token = loginRes.body.token;
  });

  it('POST /sign-up/resetpass => change password using token (old->new)', async () => {
    const res = await request(app)
      .post('/sign-up/resetpass')
      .set('Authorization', `Bearer ${token}`)
      .send({ oldPassword: newPassword1, newPassword: newPassword2 });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('message');

    // Login with final new password
    const loginRes = await request(app)
      .post('/login/')
      .send({ username, password: newPassword2 });

    expect(loginRes.status).toBe(200);
    expect(loginRes.body).toHaveProperty('token');
  });

  // Some error tests are also useful
  it('GET /login/user-info without token => 401', async () => {
    const res = await request(app).get('/login/user-info');
    expect(res.status).toBe(401);
  });

  it('POST /login wrong password => 400', async () => {
    const res = await request(app)
      .post('/login/')
      .send({ username, password: 'WRONG_PASS' });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('message');
  });
});

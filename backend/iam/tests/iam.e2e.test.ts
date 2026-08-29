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
  const expiredOtpMail = `user_${unique}_expired@example.com`;
  const staleUsername = `stale_${unique}`;
  const renewedUsername = `renewed_${unique}`;
  const sharedMail = `shared_${unique}@example.com`;

  afterAll(async () => {
    // Clean up test data (optional)
    await prisma.otp.deleteMany({ where: { mail } });
    await prisma.otp.deleteMany({ where: { mail: expiredOtpMail } });
    await prisma.otp.deleteMany({ where: { mail: sharedMail } });
    await prisma.user.deleteMany({ where: { username } });
    await prisma.user.deleteMany({ where: { username: staleUsername } });
    await prisma.user.deleteMany({ where: { username: renewedUsername } });
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

  it('POST /sign-up => cleans up a stale unverified account under a different username sharing the same mail', async () => {
    // یه حساب قدیمی و هیچ‌وقت‌تأییدنشده با یه نام‌کاربری متفاوت ولی همون ایمیل می‌سازیم
    await prisma.user.create({
      data: {
        username: staleUsername,
        password: await bcrypt.hash('OldP@ss1!', 10),
        first_name: 'Old',
        last_name: 'User',
        field: 'CS',
        mail: sharedMail,
        verified: false,
      },
    });

    const res = await request(app)
      .post('/sign-up/')
      .send({
        username: renewedUsername,
        password: 'NewP@ss1!',
        first_name: 'New',
        last_name: 'User',
        father_name: 'Someone',
        field: 'CS',
        student_id: '999',
        phone: '0912111111',
        mail: sharedMail,
      });

    // قبلاً این درخواست به‌خاطر تلاش برای حذف رکورد قدیمی با کلید اشتباه (نام‌کاربری
    // جدید، که هنوز اصلاً وجود نداره) شکست می‌خورد؛ حالا باید موفق بشه.
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('message', 'OTP sent');

    const oldRow = await prisma.user.findUnique({ where: { username: staleUsername } });
    expect(oldRow).toBeNull(); // رکورد قدیمی درست پاک شده

    const newRow = await prisma.user.findUnique({ where: { username: renewedUsername } });
    expect(newRow).toBeTruthy();
    expect(newRow?.mail).toBe(sharedMail);
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

  it('POST /sign-up/verify-otp => 400 when the OTP has expired', async () => {
    await prisma.otp.create({
      data: {
        mail: expiredOtpMail,
        otp: '000000',
        expiration: new Date(Date.now() - 60 * 1000), // یک دقیقه پیش منقضی شده
      },
    });

    const res = await request(app)
      .post('/sign-up/verify-otp')
      .send({ mail: expiredOtpMail, otp: '000000' });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/expired/i);
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

  it('POST /login/reissue-token => 401 when no token', async () => {
    const res = await request(app)
      .post('/login/reissue-token')
      .send({ newUsername: 'someone_else' });

    expect(res.status).toBe(401);
  });

  it('POST /login/reissue-token => 400 when newUsername is missing', async () => {
    const res = await request(app)
      .post('/login/reissue-token')
      .set('Authorization', `Bearer ${token}`)
      .send({});

    expect(res.status).toBe(400);
  });

  it('POST /login/reissue-token => 401 when the old token is invalid', async () => {
    const res = await request(app)
      .post('/login/reissue-token')
      .set('Authorization', 'Bearer this.is.not.a.valid.jwt')
      .send({ newUsername: `${username}_renamed` });

    expect(res.status).toBe(401);
  });

  it('POST /login/reissue-token => 200 + a fresh token for the new username', async () => {
    const newUsername = `${username}_renamed`;

    const res = await request(app)
      .post('/login/reissue-token')
      .set('Authorization', `Bearer ${token}`)
      .send({ newUsername });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');

    // توکن برگشتی باید واقعاً برای نام‌کاربری جدید معتبر باشه
    const infoRes = await request(app)
      .get('/login/user-info')
      .set('Authorization', `Bearer ${res.body.token}`);

    expect(infoRes.status).toBe(200);
    expect(infoRes.body).toMatchObject({ username: newUsername, userType: 'normal' });
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

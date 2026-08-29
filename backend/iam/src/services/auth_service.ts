import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import * as dotenv from "dotenv";
import nodemailer from "nodemailer";

const prisma = new PrismaClient();
dotenv.config(); // Load environment variables

const secretKey = process.env.JWT_SECRET_KEY || ""; // Read key value from .env
const secretHashTemp = Number(process.env.HASH_SECRET_KEY) || 10; // Read key value from .env
let generatedOtp = 1;

export const loginUser = async (username: string, password: string) => {
  const user = await prisma.user.findUnique({ where: { username } });
  if (!user) throw new Error("User not found");

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) throw new Error("Invalid password");

  const admin = await prisma.admin.findUnique({ where: { username } });
  const owner = await prisma.owner.findUnique({ where: { username } });

  let userType = "normal";
  if (admin) userType = "admin";
  if (owner) userType = "owner";

  const token = jwt.sign({ username, userType }, secretKey, {
    expiresIn: "2h",
  });

  return { token, userType };
};

export const signUpUser = async (
  username: string,
  password: string,
  first_name: string,
  last_name: string,
  father_name: string,
  field: string,
  student_id: string,
  phone: string,
  mail: string
) => {
  // Check that required fields are not empty
  if (!username || !password || !first_name || !last_name || !field || !mail) {
    throw new Error("Required fields must not be empty");
  }

  // Check for existing user in database
  const existingUser = await prisma.user.findUnique({ where: { username } });
  if (existingUser) {
    if (existingUser.verified) {
      // If user found and verified=true, return error
      throw new Error("Username already exists. Please log in.");
    } else {
      // Otherwise (verified=false), delete the record
      await prisma.user.delete({
        where: { username },
      });
    }
  }

  // Check for existing user by mail.
  // نکته‌ی مهم: قبلاً این چک دوبار (با دو بلوک تقریباً یکسان) نوشته شده بود؛ بلوک اول
  // موقع حذف رکورد قدیمی از کلید اشتباه (username — یعنی نام‌کاربریِ ثبت‌نام *جدید*،
  // نه نام‌کاربری همون رکورد قدیمی که پیدا شده بود) استفاده می‌کرد. چون نام‌کاربری
  // جدید هنوز هیچ‌جا وجود نداره، آن حذف همیشه با خطا می‌ترکید و کل ثبت‌نام رو خراب
  // می‌کرد — دقیقاً وقتی یه ایمیل قبلاً با یه نام‌کاربریِ متفاوتِ تأییدنشده استفاده شده
  // باشه. کلید درست برای حذف این رکورد، mail هست (یا existingUserByMail.username)،
  // نه username. این دو بلوک تکراری با هم ادغام و اصلاح شدن.
  const existingUserByMail = await prisma.user.findUnique({ where: { mail } });
  if (existingUserByMail) {
    if (existingUserByMail.verified) {
      // If user found and verified=true, return error
      throw new Error("Email already exists. Please log in.");
    } else {
      // Otherwise (verified=false), delete the stale record
      await prisma.user.delete({
        where: { mail },
      });
    }
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6 digits
  await sendOtpEmail(mail, otp);
  const existingOtp = await prisma.otp.findUnique({ where: { mail } });
  if (existingOtp) {
    await prisma.otp.delete({ where: { mail } });
  }
  await prisma.otp.create({
    data: {
      mail,
      otp,
      expiration: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes expiration
    },
  });
  const hashedPassword = await bcrypt.hash(password, secretHashTemp);

  await prisma.user.create({
    data: {
      username: username,
      password: hashedPassword,
      first_name: first_name,
      last_name: last_name,
      father_name: father_name,
      field: field,
      student_id: student_id,
      phone: phone,
      mail: mail,
      verified: false,
    },
  });

  return { message: "OTP sent to email. Please verify." };
};

// Email sending function
export const sendOtpEmail = async (mail: string, otp: string) => {
  if (generatedOtp == 100) {
    // Current time minus one day
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    // Delete all records whose expiration time is earlier than one day ago
    const result = await prisma.otp.deleteMany({
      where: {
        expiration: {
          lt: oneDayAgo,
        },
      },
    });
    generatedOtp = 1;
  }
  generatedOtp = generatedOtp + 1;
  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
      user: process.env.EMAIL_NAME,
      pass: process.env.EMAIL_PASS,
    },
  });
  const mailOptions = {
    from: process.env.EMAIL_NAME,
    to: mail,
    subject: "otp",
    text: otp,
  };

  const info = await transporter.sendMail(mailOptions);
};

export const commitSignUp = async (mail: string) => {
  const updatedUser = await prisma.user.update({
    where: { mail }, // Unique column
    data: { verified: true },
  });

  return updatedUser;
};

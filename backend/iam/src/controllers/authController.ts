import { Request, Response } from "express";
import { loginUser, signUpUser, commitSignUp, sendOtpEmail } from "../services/auth_service";
import * as dotenv from "dotenv";
import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const secretKey = process.env.JWT_SECRET_KEY || ""; // Read key value from .env
const secretHashTemp = Number(process.env.HASH_SECRET_KEY) || 10; // Read key value from .env

dotenv.config(); // Load environment variables
const iamPort = process.env.IAM_PORT || 3000; // Read key value from .env
const prisma = new PrismaClient();

export const loginController = async (req: Request, res: Response) => {
  const { username, password } = req.body;
  try {
    const { token, userType } = await loginUser(username, password);
    res
      .status(200)
      .json({ message: `Login successful as ${userType}`, userType, token });
  } catch (error) {
    if (error instanceof Error) {
      // Check error type
      res.status(400).json({ message: error.message });
    } else {
      res.status(400).json({ message: "An unknown error occurred" });
    }
  }
};

export const getUserInfo = async (
  req: Request,
  res: Response
): Promise<void> => {
  // Get token from Authorization header
  const token = req.headers["authorization"]?.split(" ")[1]; // We assume token is sent as "Bearer token" in header
  if (!token) {
    res.status(401).json({ message: "توکن یافت نشد" });
    return;
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, secretKey) as {
      username: string;
      userType: string;
    };

    // Return user info
    res.status(200).json({
      username: decoded.username,
      userType: decoded.userType,
    });
  } catch (error) {
    res.status(401).json({ message: "توکن نامعتبر است" });
  }
};

export const signUpController = async (
  req: Request,
  res: Response
): Promise<void> => {
  const {
    username,
    password,
    first_name,
    last_name,
    father_name,
    field,
    student_id,
    phone,
    mail,
  } = req.body;
  try {
    const newUser = await signUpUser(
      username,
      password,
      first_name,
      last_name,
      father_name,
      field,
      student_id,
      phone,
      mail
    );
    res.status(200).json({ message: "OTP sent" });
  } catch (error) {
    if (error instanceof Error) {
      // Check error type
      res.status(400).json({ message: error.message });
    } else {
      res.status(400).json({ message: "An unknown error occurred" });
    }
  }
};

export const verifyOtpController = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { mail, otp } = req.body;

  try {
    // Check existence of OTP in database
    const otpRecord = await prisma.otp.findUnique({
      where: { mail },
    });

    if (!otpRecord) {
      throw new Error("OTP not found");
    }

    // Check OTP expiration
    if (new Date(otpRecord.expiration) < new Date()) {
      throw new Error("OTP has expired");
    }

    // Verify OTP correctness
    if (otpRecord.otp !== otp) {
      throw new Error("Invalid OTP");
    }

    // Confirm and complete sign up
    const newUser = await commitSignUp(mail);

    res.status(200).json({ message: "Sign up successful" });
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({ message: error.message });
    } else {
      res.status(400).json({ message: "An unknown error occurred" });
    }
  }
};

export const passController = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { mail } = req.body;
    if (!mail) {
      res.status(400).json({ success: false, message: "Mail is required." });
      return;
    }

    // Check user existence in User table
    const user = await prisma.user.findUnique({ where: { mail } });
    if (!user) {
      res.status(404).json({ success: false, message: "User not found." });
      return;
    }
    // Generate a random OTP (e.g., 6 digits or any other algorithm)
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    // Expiration time (e.g., 5 minutes later)
    const expirationTime = new Date(Date.now() + 5 * 60 * 1000);

    // Save in OTP table (if record exists, update it)
    await prisma.otp.upsert({
      where: { mail },
      update: {
        otp: otpCode,
        expiration: expirationTime,
      },
      create: {
        mail: mail,
        otp: otpCode,
        expiration: expirationTime,
      },
    });

    // Print OTP to console (for testing)
    await sendOtpEmail(mail, otpCode);

    // console.log(`OTP for ${mail}: `, otpCode);

    res.json({ success: true, message: "OTP sent." });
  } catch (error) {
    console.error("Error in /forgot-password:", error);
    res.status(500).json({ success: false, message: "Internal server error." });
    return;
  }
};

export const passOtpController = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { mail, otp, newPassword } = req.body;

    if (!mail || !otp || !newPassword) {
      res
        .status(400)
        .json({ success: false, message: "Mail, OTP and newPassword are required." });
      return;
    }

    const otpRecord = await prisma.otp.findUnique({ where: { mail } });
    if (!otpRecord) {
      res
        .status(404)
        .json({ success: false, message: "No OTP found for this mail." });
      return;
    }

    if (new Date(otpRecord.expiration) < new Date()) {
      res
        .status(400)
        .json({ success: false, message: "OTP has expired." });
      return;
    }

    if (otpRecord.otp !== otp) {
      res
        .status(400)
        .json({ success: false, message: "Invalid OTP." });
      return;
    }

    // Hash the user's new password
    const hashedPassword = await bcrypt.hash(newPassword, secretHashTemp);

    // Update the password in User table
    await prisma.user.update({
      where: { mail },
      data: { password: hashedPassword },
    });

    // It is better to delete the OTP record so it can't be reused
    await prisma.otp.delete({ where: { mail } });

    res.json({
      success: true,
      message: "Password updated successfully.",
    });
  } catch (error) {
    console.error("Error in /forgot-password:", error);
    res.status(500).json({ success: false, message: "Internal server error." });
    return;
  }
};

export const reissueTokenController = async (
  req: Request,
  res: Response
): Promise<void> => {
  // این endpoint وقتی لازم می‌شه که core (بعد از این‌که خودش با موفقیت نام‌کاربری یه
  // کاربر رو توی دیتابیس عوض کرده) به یه توکن JWT تازه با نام‌کاربری جدید نیاز داره.
  //
  // طبق معماری این پروژه، فقط iam اجازه داره توکن امضا کنه؛ core هرگز نباید خودش
  // مستقیم jwt.sign بزنه. برای همین core به‌جای ساختن توکن، این endpoint رو صدا
  // می‌زنه و از iam می‌خواد براش توکن تازه بسازه.
  //
  // ⚠️ باگ امنیتی بحرانی که اینجا رفع شده (پیدا شده توسط خودِ کاربر حین تست واقعی):
  // نسخه‌ی قبلی این تابع فقط چک می‌کرد توکن ارسالی *یه* توکن معتبره — بدون این‌که
  // بررسی کنه این endpoint اصلاً باید از کجا صدا زده بشه. چون iam یه سرویس مستقل و
  // مستقیماً روی شبکه در دسترسه (نه فقط از طریق core)، هر کاربر لاگین‌شده‌ای (حتی
  // یه کاربر عادی تازه‌ثبت‌نامی) می‌تونست مستقیم همین endpoint رو با توکن خودش و
  // newUsername دلخواه (مثلاً نام‌کاربری یک ادمین/owner موجود) صدا بزنه و یه توکن
  // کاملاً معتبر برای *آن حساب دیگر* بگیره — بدون دونستن رمزش! یعنی یه ارتقای سطح
  // دسترسی کامل (privilege escalation)، چون هیچ‌جا رابطه‌ی بین صاحب واقعیِ توکن و
  // newUsername درخواستی بررسی نمی‌شد.
  //
  // راه‌حل: این endpoint دیگه با «هر توکن معتبر» قابل‌فراخوانی نیست — فقط با یه
  // کلید مخفیِ داخلی (INTERNAL_SERVICE_SECRET) که فقط core و iam ازش خبر دارن و
  // هیچ‌وقت به فرانت/مرورگر داده نمی‌شه. یعنی این endpoint عملاً فقط بین سرویس‌ها
  // (server-to-server) قابل‌استفاده‌ست، نه توسط کاربر نهایی — دقیقاً همون فرضی که
  // قبلاً (اشتباهاً) بدون اجرا شدنش در نظر گرفته بودیم.
  const internalSecret = req.headers["x-internal-secret"];
  if (!internalSecret || internalSecret !== process.env.INTERNAL_SERVICE_SECRET) {
    res.status(403).json({ message: "این مسیر فقط برای فراخوانی داخلی سرویس‌هاست" });
    return;
  }

  const token = req.headers["authorization"]?.split(" ")[1];
  if (!token) {
    res.status(401).json({ message: "توکن ارسال نشده است" });
    return;
  }

  const { newUsername } = req.body as { newUsername?: string };
  if (!newUsername) {
    res.status(400).json({ message: "newUsername الزامی است" });
    return;
  }

  try {
    // اعتبارسنجی توکن قبلی — فقط برای اطمینان از این‌که یه نشست واقعی و منقضی‌نشده
    // پشت این درخواسته (یه محافظت اضافه، مستقل از چک بالا).
    jwt.verify(token, secretKey);
  } catch {
    res.status(401).json({ message: "توکن نامعتبر است" });
    return;
  }

  try {
    // نقش کاربر رو خودِ iam از روی جداول Admin/Owner خودش تعیین می‌کنه (دقیقاً همون
    // منطقی که loginUser هم استفاده می‌کنه) — چون core قبل از رسیدن به اینجا خودش
    // با موفقیت نام‌کاربری رو توی دیتابیس (و از جمله جدول Admin/Owner، اگه کاربر
    // ادمین/owner بوده) عوض کرده، این مقدار درست منعکس‌کننده‌ی نقش واقعی کاربره.
    const admin = await prisma.admin.findUnique({ where: { username: newUsername } });
    const owner = await prisma.owner.findUnique({ where: { username: newUsername } });

    let userType = "normal";
    if (admin) userType = "admin";
    if (owner) userType = "owner";

    const newToken = jwt.sign({ username: newUsername, userType }, secretKey, {
      expiresIn: "2h",
    });

    res.status(200).json({ token: newToken });
  } catch (error) {
    console.error("reissueTokenController error:", error);
    res.status(500).json({ message: "خطای داخلی سرور" });
  }
};

export const resetPassController = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { oldPassword, newPassword } = req.body;
  const token = req.headers["authorization"]?.split(" ")[1];

  if (!token) {
    res.status(401).json({ message: "توکن ارسال نشده است" });
    return; // Important: must return
  }

  try {
    // ✅ Verify locally instead of HTTP call to own service
    const decoded = jwt.verify(token, secretKey) as {
      username: string;
      userType: string;
    };
    const requesterUsername = decoded.username;

    // 2) Find user
    const user = await prisma.user.findUnique({
      where: { username: requesterUsername },
    });

    if (!user) {
      res.status(404).json({ message: "کاربر پیدا نشد" });
      return;
    }

    // 3) Check old password
    const isOldPasswordCorrect = await bcrypt.compare(oldPassword, user.password);
    if (!isOldPasswordCorrect) {
      res.status(400).json({ message: "پسورد قدیمی صحیح نیست" });
      return;
    }

    // 4) Hash new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    // 5) Update
    await prisma.user.update({
      where: { username: requesterUsername },
      data: { password: hashedNewPassword },
    });

    res.status(200).json({ message: "پسورد با موفقیت تغییر یافت" });
  } catch (error) {
    // If token is invalid
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({ message: "توکن نامعتبر است" });
      return;
    }
    console.error("Error in changePasswordController:", error);
    res.status(500).json({ message: "خطای داخلی سرور" });
  }
};

import { Request, Response } from "express";
import axios from "axios";
import { PrismaClient, Prisma } from "@prisma/client";
import * as dotenv from "dotenv";
import jwt from 'jsonwebtoken';

dotenv.config();

const prisma = new PrismaClient();
const iamPort = process.env.IAM_PORT || 3000;
const secretKey = process.env.JWT_SECRET_KEY || ""; 

export const getUserOverview = async (
  req: Request,
  res: Response
): Promise<void> => {
  const token = req.headers["authorization"]?.split(" ")[1];
  if (!token) {
    res.status(401).json({ message: "توکن ارسال نشده است" });
    return;
  }

  try {
    /* ---- 1) Get user information from IAM service ---- */
    const { data: userInfo } = await axios.get(
      `http://localhost:${iamPort}/login/user-info`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const currentUsername = userInfo.username as string;   // ← a fixed name

    /* ---- 2) Messages ---- */
    const courseMessage = await prisma.courseMessage.findMany({
      where: {
        OR: [{ sender: currentUsername }, { reciver: currentUsername }],
      },
    });

    const examMessage = await prisma.examMessage.findMany({
      where: {
        OR: [{ sender: currentUsername }, { reciver: currentUsername }],
      },
    });

    const commentMessage = await prisma.commentReviewMessage.findMany({
      where: {
        OR: [{ sender: currentUsername }, { reciver: currentUsername }],
      },
    });

    /* ---- 3) Requested courses ---- */
    type ReqWithCourse = Prisma.CourseRequesterGetPayload<{
      include: { course: true };
    }>;

    const requested: ReqWithCourse[] = await prisma.courseRequester.findMany({
      where: { username: currentUsername },
      include: { course: true },
    });

    /* ---- 4) Enrolled courses ---- */
    type EnrWithCourse = Prisma.StudentGetPayload<{
      include: { course: true };
    }>;

    const enrolled: EnrWithCourse[] = await prisma.student.findMany({
      where: { username: currentUsername },
      include: { course: true },
    });

    /* ---- 5) Response ---- */
    res.status(200).json({
      success: true,
      data: {
        courseMessage,
        commentMessage,
        examMessage,
        requestedCourses: requested.map((r) => r.course),
        enrolledCourses: enrolled.map((e) => e.course),
      },
    });
  } catch (err) {
    console.error("getUserOverview error:", err);
    res.status(500).json({ success: false, message: "Internal Server Error" });
    return;
  }
};


// Helper to extract username from token
async function getCurrentUsername(req: Request, res: Response): Promise<string | null> {
  const auth = req.headers["authorization"];
  const token = typeof auth === 'string' ? auth.split(" ")[1] : null;
  if (!token) {
    res.status(401).json({ message: "توکن ارسال نشده است" });
    return null;
  }
  try {
    const { data: userInfo } = await axios.get(
      `http://localhost:${iamPort}/login/user-info`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return userInfo.username as string;
  } catch (err: any) {
    console.error("IAM error:", err.response?.data || err.message);
    res.status(401).json({ message: "توکن نامعتبر است" });
    return null;
  }
}


export const getUserController = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const currentUsername = await getCurrentUsername(req, res);
    if (!currentUsername) return;

    const user = await prisma.user.findUnique({
      where: { username: currentUsername },
      select: {
        username: true,
        first_name: true,
        last_name: true,
        father_name: true,
        field: true,
        student_id: true,
        phone: true,
        mail: true,
      },
    });

    if (!user) {
      res.status(404).json({ message: 'کاربر پیدا نشد' });
      return;
    }

    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'خطای داخلی سرور' });
    return;
  }
};


export const updateUserController = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const currentUsername = await getCurrentUsername(req, res);
    if (!currentUsername) return;

    const {
      username: newUsername,
      first_name,
      last_name,
      father_name,
      field,
      student_id,
      phone,
      mail,
    } = req.body as {
      username?: string;
      first_name: string;
      last_name: string;
      father_name: string;
      field: string;
      student_id: string;
      phone: string;
      mail: string;
    };

    // 1) Check new username
    if (newUsername && newUsername !== currentUsername) {
      const exists = await prisma.user.findUnique({ where: { username: newUsername } });
      if (exists) {
        res.status(409).json({ message: 'نام کاربری جدید قبلاً استفاده شده است' });
        return;
      }
    }

    // 2) Check email
    if (mail) {
      const mailOwner = await prisma.user.findUnique({ where: { mail } });
      if (mailOwner &&
          mailOwner.username !== currentUsername &&
          mailOwner.username !== newUsername) {
        res.status(409).json({ message: 'ایمیل قبلاً استفاده شده است' });
        return;
      }
    }

    // 3) Update the user itself
    const updated = await prisma.user.update({
      where: { username: currentUsername },
      data: {
        username:   newUsername ?? undefined,
        first_name,
        last_name,
        father_name,
        field,
        student_id,
        phone,
        mail,
      },
      select: {
        username: true,
        first_name: true,
        last_name: true,
        father_name: true,
        field: true,
        student_id: true,
        phone: true,
        mail: true,
      },
    });

    // 4) If username changed, update in other tables as well
    if (newUsername && newUsername !== currentUsername) {
      const oldU = currentUsername;
      const newU = updated.username;

      await prisma.$transaction([
        // Shop
        prisma.shop.updateMany({
          where: { username: oldU },
          data:  { username: newU }
        }),
        // Answer
        prisma.answer.updateMany({
          where: { username: oldU },
          data:  { username: newU }
        }),
        // Comment.sender
        prisma.comment.updateMany({
          where: { sender: oldU },
          data:  { sender: newU }
        }),
        // Message.sender + reciver
        prisma.message.updateMany({
          where: { sender: oldU },
          data:  { sender: newU }
        }),
        prisma.message.updateMany({
          where: { reciver: oldU },
          data:  { reciver: newU }
        }),
        // CourseMessage
        prisma.courseMessage.updateMany({
          where: { sender: oldU },
          data:  { sender: newU }
        }),
        prisma.courseMessage.updateMany({
          where: { reciver: oldU },
          data:  { reciver: newU }
        }),
        // ExamMessage
        prisma.examMessage.updateMany({
          where: { sender: oldU },
          data:  { sender: newU }
        }),
        prisma.examMessage.updateMany({
          where: { reciver: oldU },
          data:  { reciver: newU }
        }),
        // CommentReviewMessage
        prisma.commentReviewMessage.updateMany({
          where: { sender: oldU },
          data:  { sender: newU }
        }),
        prisma.commentReviewMessage.updateMany({
          where: { reciver: oldU },
          data:  { reciver: newU }
        }),
        // Student
        prisma.student.updateMany({
          where: { username: oldU },
          data:  { username: newU }
        }),
        // Teacher
        prisma.teacher.updateMany({
          where: { username: oldU },
          data:  { username: newU }
        }),
        // Score
        prisma.score.updateMany({
          where: { username: oldU },
          data:  { username: newU }
        }),
        // CourseRequester
        prisma.courseRequester.updateMany({
          where: { username: oldU },
          data:  { username: newU }
        }),
        // Admin (if any)
        prisma.admin.updateMany({
          where: { username: oldU },
          data:  { username: newU }
        }),
        // Owner (if any)
        prisma.owner.updateMany({
          where: { username: oldU },
          data:  { username: newU }
        }),
      ]);

      // 5) Create new token
      let userType = 'normal';
      if (await prisma.admin.findUnique({ where: { username: newU } })) userType = 'admin';
      if (await prisma.owner.findUnique({ where: { username: newU } })) userType = 'owner';

      const token = jwt.sign(
        { username: newU, userType },
        secretKey,
        { expiresIn: '2h' }
      );

      res.json({
        message: 'اطلاعات با موفقیت به‌روز شد',
        token,
      });
      return;
    }

    // If username remained unchanged
    res.json({ message: 'اطلاعات با موفقیت به‌روز شد' });
  } catch (err: any) {
    console.error(err);
    if (err.code === 'P2025') {
      res.status(404).json({ message: 'کاربر پیدا نشد' });
      return;
    }
    res.status(500).json({ message: 'خطای داخلی سرور' });
  }
};


export const getMessageController = async (req: Request, res: Response): Promise<void> => {
  // 1) Extract token
  const auth = req.headers["authorization"]?.split(" ")[1];
  if (!auth || !auth[1]) {
    res.status(401).json({ message: 'توکن ارسال نشده است' });
    return;
  }
  const token = auth;

  try {
    // 2) Get username from IAM service
    const { data: userInfo } = await axios.get(
    `http://localhost:${iamPort}/login/user-info`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );
    const currentUsername = userInfo.username as string;
    console.log(currentUsername);

    // 3) Fetch messages from database
    const messages = await prisma.message.findMany({
      where: { reciver: currentUsername },
      select: {
        reciver: true,
        sender: true,
        text: true,
        date: true
      },
    });

    // 4) Send messages
    res.json({ messages });
  } catch (err: any) {
    console.error(err);
    // IAM error
    if (axios.isAxiosError(err)) {
      res.status(err.response?.status || 502).json({ message: err.message });
    } else {
      res.status(500).json({ message: 'خطای داخلی سرور' });
    }
  }
};

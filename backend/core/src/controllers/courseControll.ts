import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import axios from "axios";
import * as dotenv from "dotenv";
import { CourseImage } from "../../models/courseImage";
import path from "path";

dotenv.config(); // Load environment variables

let adminIndex = 0; // شمارنده‌ی چرخشی برای انتخاب نوبتی ادمین‌ها (در حافظه‌ی سرور)
const prisma = new PrismaClient();
const iamPort = process.env.IAM_PORT || 3000; // Read key from .env

export const courseControll = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // 1) Extract text fields
    const {
      cid,
      description,
      start_time,
      end_time,
      start_sign_up,
      end_sign_up,
      price,
      field1,
      field2,
      name,
      times,
      message_text,
    } = req.body;

    // 2) Validate input
    if (
      !start_time ||
      !end_time ||
      !start_sign_up ||
      !end_sign_up ||
      !price ||
      !field1 ||
      !name ||
      !times
    ) {
      res.status(400).json({ message: "Required fields are empty" });
      return;
    }

    // 3) Image
    if (!req.file) {
      res.status(400).json({ message: "Image is required" });
      return;
    }
    // Saved path for storing in course table's image column
    const imagePath = path.join("uploads", req.file.filename);

    // 4) Check token
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      res.status(401).json({ message: "Token not provided" });
      return;
    }

    // 5) Fetch user
    const {
      data: { username },
    } = await axios.get(`http://localhost:${iamPort}/login/user-info`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    // 6) Parse times array
    const parsedTimes = typeof times === "string" ? JSON.parse(times) : times;

    // *** Update mode ***
    if (cid) {
      const courseId = Number(cid);

      // 6.1) Check requester
      const requester = await prisma.courseRequester.findUnique({
        where: { username_cid: { username, cid: courseId } },
      });
      if (!requester) {
        res.status(403).json({ message: "You don't have permission to edit this course" });
        return;
      }

      // 6.2) Update course including image field
      await prisma.course.update({
        where: { cid: courseId },
        data: {
          description,
          start_time: new Date(start_time),
          end_time: new Date(end_time),
          start_sign_up: new Date(start_sign_up),
          end_sign_up: new Date(end_sign_up),
          price: Number(price),
          field1,
          field2,
          name,
          image: imagePath,
          is_valid: false,
        },
      });

      // 6.3) Replace times
      await prisma.time.deleteMany({ where: { cid: courseId } });
      await prisma.time.createMany({
        data: parsedTimes.map((t: any) => ({
          cid: courseId, // or newCid in create mode
          start_time: Number(t.start_time), // seconds or minutes number
          end_time: Number(t.end_time),
          day: t.day,
        })),
      });

      res.json({ message: "Course updated and waiting for re-approval" });
      return;
    }

    // *** Create mode ***
    // 7.1) Determine new cid
    const last = await prisma.course.findFirst({ orderBy: { cid: "desc" } });
    const newCid = last ? last.cid + 1 : 1;

    // 7.2) Create new course
    await prisma.course.create({
      data: {
        cid: newCid,
        description,
        start_time: new Date(start_time),
        end_time: new Date(end_time),
        start_sign_up: new Date(start_sign_up),
        end_sign_up: new Date(end_sign_up),
        price: Number(price),
        field1,
        field2,
        name,
        image: imagePath,
        is_valid: false,
      },
    });

    // 7.3) Register times
    await prisma.time.createMany({
      data: parsedTimes.map((t: any) => ({
        cid: newCid, // or newCid in create mode
        start_time: Number(t.start_time), // seconds or minutes number
        end_time: Number(t.end_time),
        day: t.day,
      })),
    });

    // 7.4) Register requester
    await prisma.courseRequester.create({
      data: { username, cid: newCid },
    });

    // 7.5) Send message to next admin (چرخشی بین ادمین‌ها)
    // orderBy لازمه تا ترتیب لیست بین فراخوانی‌های مختلف ثابت بمونه — وگرنه حتی با
    // شمارنده‌ی درست هم «ادمین شماره ۲» ممکنه هر بار به یه نفر متفاوت اشاره کنه.
    const admins = await prisma.admin.findMany({
      orderBy: { username: "asc" },
      select: { username: true },
    });
    if (admins.length > 0) {
      // نکته‌ی مهم: اینجا عمداً متغیر محلی جدیدی به اسم adminIndex تعریف نکردیم —
      // قبلاً همین‌جا `let adminIndex = 0` محلی تعریف شده بود که متغیر سراسری بالای
      // فایل رو سایه می‌نداخت (shadowing) و باعث می‌شد همیشه از صفر شروع بشه، یعنی
      // همیشه ادمین اول انتخاب بشه، نه چرخشی. حالا مستقیم به همون متغیر سراسری
      // adminIndex می‌خونیم/می‌نویسیم — دقیقاً همون الگویی که در examController.ts
      // (adminCounter) درست پیاده شده.
      adminIndex = adminIndex % admins.length;
      const adminUsername = admins[adminIndex]!.username;
      adminIndex++; // دفعه‌ی بعد، نوبت ادمین بعدی باشه
      await prisma.courseMessage.create({
        data: {
          sender: username,
          reciver: adminUsername,
          cid: newCid,
          text: message_text ?? "",
          date:    new Date(),
        },
      });
    }

    res.json({ message: "Course registered and waiting for admin approval", cid: newCid });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getCourseControll = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // 1) Extract cid from request body
    const { cid } = req.body as { cid: number };

    // Simple validation: cid is required
    if (typeof cid !== "number") {
      res.status(400).json({ message: "Invalid cid" });
      return;
    }

    // 2) Get course info (including image field from course table)
    const course = await prisma.course.findUnique({
      where: { cid },
    });
    if (!course) {
      res.status(404).json({ message: "Course not found" });
      return;
    }

    // 2.1) Auth: this endpoint is shared by two very different consumers —
    // the public course-detail page (CourseDetail.tsx, no login required) and
    // the admin's pending-course-review page (WatchCourses.tsx, admin/owner only).
    // An already-approved course is public info by definition, so only a
    // not-yet-approved course needs to be locked down to admin/owner.
    if (!course.is_valid) {
      const token = req.headers["authorization"]?.split(" ")[1];
      if (!token) {
        res.status(401).json({ message: "توکن ارسال نشده است" });
        return;
      }

      const { data: userInfo } = await axios.get(
        `http://localhost:${iamPort}/login/user-info`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (userInfo.userType !== "admin" && userInfo.userType !== "owner") {
        res.status(403).json({ message: "شما مجوز این عملیات را ندارید" });
        return;
      }
    }

    // 3) Get course time info from time table
    const timeInfo = await prisma.time.findMany({
      where: { cid },
    });

    // 4) Send response: course + times + image path from course.image column
    res.status(200).json({
      course, // includes all course fields including image
      time: timeInfo,
      image: course.image ?? null,
    });
  } catch (error) {
    console.error("getCourseControll error:", error);
    res.status(500).json({
      message: "Request processing error",
    });
  }
};

export const certificateController =  async (req: Request, res: Response) => {
  try {
    const { cid } = req.body as { cid?: number };
    const authHeader = req.headers["authorization"];
    const token = authHeader?.split(" ")[1];

    if (!token) {
      res.status(401).json({ message: "Token not provided" });
      return;
    }
    if (!cid || Number.isNaN(Number(cid))) {
      res.status(400).json({ message: "Invalid cid" });
      return;
    }

    // Get username from token
    const verifyResponse = await axios.get(
      `http://localhost:${iamPort}/login/user-info`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const { username: requesterUsername } = verifyResponse.data as {
      username: string;
      userType: string;
    };

    // All eids of exams for this course
    const exams = await prisma.exam.findMany({
      where: { courseCid: Number(cid) },
      select: { eid: true },
    });
    const eids = exams.map((e) => e.eid);

    if (eids.length === 0) {
      res.status(200).json({ success: true, files: [] });
      return;
    }

    // All user certificates for these eids
    const certs = await prisma.certificate.findMany({
      where: {
        username: requesterUsername,
        eid: { in: eids },
      },
      select: { file_path: true },
    });

    res.status(200).json({
      success: true,
      files: certs.map((c) => c.file_path),
    });
  } catch (err) {
    console.error("GET certificates error:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};
import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import axios from "axios";
import * as dotenv from "dotenv";
import { CourseImage } from "../../models/courseImage";
import path from "path";

dotenv.config(); // Load environment variables

let adminIndex = 0; // Read key from .env
const prisma = new PrismaClient();
const iamPort = process.env.IAM_PORT || 3000; // Read key from .env
const ZARINPAL_MERCHANT_ID = process.env.ZARINPAL_MERCHANT_ID!;
const CALLBACK_BASE_URL = process.env.BASE_URL!; // e.g., "https://your-domain.com"

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

    // 7.5) Send message to next admin
    const admins = await prisma.admin.findMany({ select: { username: true } });
    if (admins.length > 0) {
      let adminIndex = 0; // You can use a global variable or table to maintain this
      const adminUsername = admins[adminIndex % admins.length]!.username;
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

export const registerCourseControll = async (req: Request, res: Response) => {
  const { courseId } = req.body;
  const token = req.headers["authorization"]?.split(" ")[1];
  if (!token) res.status(401).json({ message: "Token not provided" });

  // 1.1) Authenticate user
  const { data: userInfo } = await axios.get(
    `http://localhost:${iamPort}/login/user-info`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  const username = userInfo.username as string;

  // 1.2) Find course
  const course = await prisma.course.findUnique({ where: { cid: courseId } });
  if (!course) res.status(404).json({ message: "Course not found" });

  // 1.3) Zero price => direct registration
  if (course!.price === 0) {
    await prisma.student.create({ data: { username, cid: courseId } });
    res.status(200).json({ message: "Registration successful (free)" });
  }

  // 1.4) Start payment via Zarinpal
  try {
    const callback_url = `${CALLBACK_BASE_URL}/payment/callback?username=${encodeURIComponent(
      username
    )}&courseId=${courseId}`;
    const { data: payReq } = await axios.post(
      "https://api.zarinpal.com/pg/v4/payment/request.json",
      {
        merchant_id: ZARINPAL_MERCHANT_ID,
        amount: course!.price,
        callback_url,
        description: `Payment for course ${course!.name}`,
      }
    );
    if (payReq.data.code === 100) {
      // Return payment URL
      const authority = payReq.data.authority;
      const paymentUrl = `https://www.zarinpal.com/pg/StartPay/${authority}`;
      res.status(200).json({ paymentUrl });
    } else {
      res
        .status(502)
        .json({ message: "Error creating payment order", code: payReq.data.code });
    }
  } catch (err) {
    console.error("Zarinpal request error:", err);
    res.status(502).json({ message: "Network error to payment gateway" });
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
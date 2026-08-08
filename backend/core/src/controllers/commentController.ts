import { Request, Response } from "express";
import axios from "axios";
import { PrismaClient } from "@prisma/client";
import * as dotenv from "dotenv";

dotenv.config();
const prisma = new PrismaClient();
const iamPort = process.env.IAM_PORT || 3000;

let adminCounter = 0;

export const createCommentController = async (
  req: Request<{}, {}, { text: string; course: number; replied_to?: number }>,
  res: Response
): Promise<void> => {
  // 1) Authentication from JWT
  const token = req.headers["authorization"]?.split(" ")[1]; // دریافت توکن از هدر درخواست

  if (!token) {
    res.status(401).json({ message: "توکن ارسال نشده است" });
    return;
  }

  let sender: string;
  try {
    const { data } = await axios.get(
      `http://localhost:${iamPort}/login/user-info`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    sender = data.username;
  } catch {
    res.status(401).json({ message: "توکن نامعتبر است" });
    return;
  }
  // 2) Reading and validating input
  const { text, course, replied_to } = req.body;
  if (!text || typeof course !== "number") {
    res.status(400).json({ message: "پارامترهای text و course الزامی هستند" });
    return;
  }

  try {
    // 3) Insert a comment into the table
    const comment = await prisma.comment.create({
      data: {
        sender,
        text,
        course,
        replied_to: replied_to ?? null,
      },
    });
    res.status(201).json({
      success: true,
      data: comment,
      message: "کامنت با موفقیت ثبت شد",
    });
  } catch (err) {
    console.error("createCommentController error:", err);
    res.status(500).json({ success: false, message: "خطای داخلی سرور" });
  }
};

export const commentReviewController = async (
  req: Request<{}, {}, { reciver: string; commentId: number; text: string }>,
  res: Response
): Promise<void> => {
  // 1) Extract & validate JWT

  const token = req.headers["authorization"]?.split(" ")[1]; // دریافت توکن از هدر درخواست

  if (!token) {
    res.status(401).json({ message: "توکن ارسال نشده است" });
    return;
  }

  let sender: string;
  try {
    const { data } = await axios.get(
      `http://localhost:${iamPort}/login/user-info`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    sender = data.username;
  } catch {
    res.status(401).json({ message: "توکن نامعتبر است" });
    return;
  }
  // 3) Reading input
  const { commentId, text } = req.body;
  if (typeof commentId !== "number" || !text) {
    res.status(400).json({ message: "پارامترهای commentId و text الزامی‌اند" });
    return;
  }

  try {
    // 4) Get the list of admins
    const admins = await prisma.admin.findMany({
      orderBy: { username: "asc" },
    });
    if (admins.length === 0) {
      res.status(500).json({ message: "هیچ ادمینی یافت نشد" });
      return;
    }

    // 5) Round-robin selection
    const idx = adminCounter % admins.length;
    const reciver = admins[idx]!.username;
    adminCounter++;
    // 6) Check for comment existence
    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
    });
    if (!comment) {
      res.status(404).json({ message: "کامنت پیدا نشد" });
      return;
    }

    // 7) Insert comment review message
    const msg = await prisma.commentReviewMessage.create({
      data: {
        sender,
        reciver,
        commentId,
        text,
        date: new Date(),
      },
    });

    res.status(201).json({
      success: true,
      data: msg,
      message: "پیام بررسی کامنت با موفقیت ایجاد شد",
    });
  } catch (err) {
    console.error("createCommentReviewMessageController error:", err);
    res.status(500).json({ success: false, message: "خطای داخلی سرور" });
  }
};

export const getCommentController = async (req: Request, res: Response) => {
  try {
    const { cid } = req.body as { cid?: number };
    // Input validation
    if (typeof cid !== "number") {
      res.status(400).json({ message: "cid باید عددی باشد" });
      return;
    }
    // Fetch comments for that period
    const comments = await prisma.comment.findMany({
      where: { course: cid },
      orderBy: { id: "asc" },
    });

    res.status(200).json({ comments });
  } catch (err) {
    console.error("getComments error:", err);
    res.status(500).json({ message: "خطای سرور" });
  }
};

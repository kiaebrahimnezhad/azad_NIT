import { Request, Response } from "express";
import axios from "axios";
import {
  deleteUser,
  addAdmin,
  deleteAdmin,
} from "../services/userManageService";
import * as dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

dotenv.config();
const iamPort = process.env.IAM_PORT || 3000; // Read key from .env

export const validateCourseControll = async (req: Request, res: Response) => {
  const { courseId } = req.body;
  const token = req.headers["authorization"]?.split(" ")[1];
  if (!token) {
    res.status(401).json({ message: "Token not provided" });
    return;
  }

  try {
    // 1) Extract username and role from IAM
    const verifyResponse = await axios.get(
      `http://localhost:${iamPort}/login/user-info`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const { username: requesterUsername, userType } = verifyResponse.data;

    if (!courseId) {
      res.status(400).json({ message: "course id not provided" });
      return;
    }

    // 2) Find course
    const course = await prisma.course.findUnique({
      where: { cid: parseInt(courseId) },
    });
    if (!course) {
      res.status(404).json({ message: "Course not found" });
      return;
    }

    // 3) Check role
    if (userType !== "admin" && userType !== "owner") {
      res.status(403).json({ message: "You don't have permission for this operation" });
      return;
    }

    // 4) Validate course
    const updatedCourse = await prisma.course.update({
      where: { cid: parseInt(courseId) },
      data: { is_valid: true },
    });

    // 5) Get requesters
    const requesters = await prisma.courseRequester.findMany({
      where: { cid: courseId },
      select: { username: true },
    });
    const firstUsername = requesters[0]?.username;
    if (!firstUsername) {
      res.status(400).json({ message: "No requests found" });
      return;
    }

    // 6) Add to teachers table (both scalar and user relation)
    await prisma.teacher.create({
      data: {
        username: firstUsername,
        cid: parseInt(courseId),
      },
    });

    // 7) Delete related messages
    await prisma.courseMessage.deleteMany({
      where: { sender: firstUsername, cid: parseInt(courseId) },
    });

    // 8) Success response
    res.status(200).json({
      success: true,
      message: "Course validated successfully",
    });
  } catch (error) {
    console.error("Error in validateCourseController:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const invalidaCourseControll = async (req: Request, res: Response) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader?.split(" ")[1];

  if (!token) {
    res.status(401).json({ message: "Token not provided" });
    return;
  }

  try {
    // Check user role with external API
    const verifyResponse = await axios.get(
      `http://localhost:${iamPort}/login/user-info`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    const { username: requesterUsername, userType } = verifyResponse.data;

    if (userType !== "admin") {
      res.status(403).json({ message: "Access denied" });
      return;
    }

    const { message, cid } = req.body;

    if (!message || !cid) {
      res.status(400).json({ message: "message and cid fields are required" });
      return;
    }

    // First find admin-related records
    const adminMessages = await prisma.courseMessage.findMany({
      where: {
        reciver: requesterUsername,
        cid: cid,
      },
    });

    if (adminMessages.length === 0) {
      res.status(404).json({ message: "No admin records found" });
      return;
    }

    // Assume sender is the same in all records
    const sender = adminMessages[0]!.sender;

    // Delete records where sender, reciver and cid match
    await prisma.courseMessage.deleteMany({
      where: {
        reciver: requesterUsername,
        sender: sender,
        cid: cid,
      },
    });

    // Send new message
    await prisma.message.create({
      data: {
        reciver: sender,
        sender: requesterUsername,
        text: message,
        date: new Date(),
      },
    });

    res.status(200).json({ message: "Operation completed successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

export const sendMessageController = async (
  req: Request<{}, {}, { reciver: string; text: string }>,
  res: Response
): Promise<void> => {
  // 1) Extract and validate token
  const token = req.headers["authorization"]?.split(" ")[1]; // Get token from request header

  if (!token) {
    res.status(401).json({ message: "Token not provided" });
    return;
  }

  try {
    // 2) Call IAM service to get username and userType
    const { data: userInfo } = await axios.get(
      `http://localhost:${iamPort}/login/user-info`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const { username, userType } = userInfo as {
      username: string;
      userType: string;
    };

    // 3) Only admin or owner can send messages
    if (userType !== "admin" && userType !== "owner") {
      res.status(403).json({ message: "You don't have permission to send messages" });
      return;
    }

    // 4) Read input and validate
    const { reciver, text } = req.body;
    if (!reciver || !text) {
      res
        .status(400)
        .json({ message: "reciver and text parameters are required" });
      return;
    }

    // 5) Insert message into table
    await prisma.message.create({
      data: {
        sender: username,
        reciver,
        text,
      },
    });

    // 6) Success response
    res.status(200).json({ success: true, message: "Message sent successfully" });
  } catch (err) {
    console.error("sendMessageController error:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const courseMessageControler = async (req: Request, res: Response) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader?.split(" ")[1];

  if (!token) {
    res.status(401).json({ message: "Token not provided" });
    return;
  }

  try {
    // Verify token and get user info
    const verifyResponse = await axios.get(
      `http://localhost:${iamPort}/login/user-info`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    const { username: requesterUsername, userType } = verifyResponse.data;

    // If user is not admin, not allowed
    if (userType !== "admin") {
      res.status(403).json({ message: "Access denied" });
      return;
    }

    // Get admin-related messages
    const courseMessages = await prisma.courseMessage.findMany({
      where: { reciver: requesterUsername },
    });

    // Return all messages as an array
    const allMessages = [
      ...courseMessages.map((msg) => ({ type: "CourseMessage", ...msg })),
    ];

    res.json({ messages: allMessages });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

export const examMessageControler = async (req: Request, res: Response) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader?.split(" ")[1];

  if (!token) {
    res.status(401).json({ message: "Token not provided" });
    return;
  }

  try {
    // Verify token and get user info
    const verifyResponse = await axios.get(
      `http://localhost:${iamPort}/login/user-info`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    const { username: requesterUsername, userType } = verifyResponse.data;

    // If user is not admin, not allowed
    if (userType !== "admin") {
      res.status(403).json({ message: "Access denied" });
      return;
    }

    // Get admin-related messages
    const examMessages = await prisma.examMessage.findMany({
      where: { reciver: requesterUsername },
    });

    // Return all messages as an array
    const allMessages = [
      ...examMessages.map((msg) => ({ type: "ExamMessage", ...msg })),
    ];

    res.json({ messages: allMessages });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

export const commentMessageControler = async (req: Request, res: Response) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader?.split(" ")[1];

  if (!token) {
    res.status(401).json({ message: "Token not provided" });
    return;
  }

  try {
    // Verify token and get user info
    const verifyResponse = await axios.get(
      `http://localhost:${iamPort}/login/user-info`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    const { username: requesterUsername, userType } = verifyResponse.data;

    // If user is not admin, not allowed
    if (userType !== "admin") {
      res.status(403).json({ message: "Access denied" });
      return;
    }

    // Get admin-related messages
    const commentReviewMessages = await prisma.commentReviewMessage.findMany({
      where: { reciver: requesterUsername },
    });

    // Return all messages as an array
    const allMessages = [
      ...commentReviewMessages.map((msg) => ({
        type: "CommentReviewMessage",
        ...msg,
      })),
    ];

    res.json({ messages: allMessages });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

export const getCommentControler = async (req: Request, res: Response) => {
  const { commentId } = req.body;

  if (typeof commentId !== "number") {
    res.status(400).json({ error: "commentId must be a number" });
    return;
  }

  try {
    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
    });

    if (!comment) {
      res.status(404).json({ error: "Comment not found" });
      return;
    }

    res.json(comment);
  } catch (error) {
    console.error("Error fetching comment:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const mannageCommentControll = async (req: Request, res: Response) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader?.split(" ")[1];

  if (!token) {
    res.status(401).json({ message: "Token not provided" });
    return;
  }

  let userType;
  let requesterUsername;

  try {
    // Verify token via external API
    const verifyResponse = await axios.get(
      `http://localhost:${iamPort}/login/user-info`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    const data = verifyResponse.data;
    requesterUsername = data.username;
    userType = data.userType; // Assuming user type is in this field
  } catch (error) {
    res.status(401).json({ message: "Token validation failed" });
    return;
  }

  // Check user role
  if (userType !== "admin") {
    res
      .status(403)
      .json({ message: "Only admins are allowed to perform this operation" });
    return;
  }

  const { message, commentId, toDelete } = req.body;

  try {
    // Step 1: Find sender related to commentId
    const reviewMessages = await prisma.commentReviewMessage.findMany({
      where: { commentId },
    });

    if (reviewMessages.length === 0) {
      res.status(404).json({ message: "No records found for this commentId" });
      return;
    }

    const senderUser = reviewMessages[0]!.sender; // Assuming all senders are the same

    // Step 2: Delete commentReviewMessage records with commentId
    await prisma.commentReviewMessage.deleteMany({
      where: { commentId },
    });

    // Step 3: Create message
    await prisma.message.create({
      data: {
        reciver: senderUser,
        sender: requesterUsername,
        text: message,
        date: new Date(),
      },
    });

    // Step 4: If toDelete=true, delete comments
    if (toDelete) {
      await prisma.comment.deleteMany({
        where: {
          OR: [{ id: commentId }, { replied_to: commentId }],
        },
      });
    }

    res.json({ message: "Operation completed successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

export const invalidaExamControll = async (req: Request, res: Response) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader?.split(" ")[1];

  if (!token) {
    res.status(401).json({ message: "Token not provided" });
    return;
  }

  try {
    // Verify token via external API
    const verifyResponse = await axios.get(
      `http://localhost:${iamPort}/login/user-info`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    const { username: requesterUsername, userType } = verifyResponse.data;

    // Check admin role
    if (userType !== "admin") {
      res
        .status(403)
        .json({ message: "Only admins are allowed to perform this operation" });
      return;
    }

    const { message, eid } = req.body;

    if (!message || !eid) {
      res.status(400).json({ message: "message and eid fields are required" });
      return;
    }

    // Find sender related to eid in examMessage table
    const examMessages = await prisma.examMessage.findMany({
      where: { eid: eid },
    });

    if (examMessages.length === 0) {
      res.status(404).json({ message: "No records found for this eid" });
      return;
    }

    // Assuming sender is the same in all records
    const user = examMessages[0]!.sender;

    // Delete records related to eid
    await prisma.examMessage.deleteMany({
      where: { eid: eid },
    });

    // Add new message to message table
    await prisma.message.create({
      data: {
        reciver: user,
        sender: requesterUsername,
        text: message,
        date: new Date(),
      },
    });

    res.status(200).json({ message: "Operation completed successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};
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
const iamPort = process.env.IAM_PORT || 3000;

export const ownerControll = async (req: Request, res: Response) => {
  const { username, isAdmin, toDelete } = req.body;
  const token = req.headers["authorization"]?.split(" ")[1];
  if (!token) {
    res.status(401).json({ message: "توکن ارسال نشده است" });
    return;
  }

  try {
    // Check token via external API
    const verifyResponse = await axios.get(
      `http://localhost:${iamPort}/login/user-info`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    const { username: requesterUsername, userType } = verifyResponse.data;

    if (userType !== "owner") {
      res.status(403).json({ message: "شما مجوز این عملیات را ندارید" });
      return;
    }
    // If the request is to delete the user
    if (toDelete) {
      const result = await deleteUser(username);

      if (result === "no such user found") {
        res.status(404).json({ message: "چنین کاربری یافت نشد" });
        return;
      }

      res.status(200).json({ message: result });
      return;
    }
    // Admin Management
    if (isAdmin === true) {
      const result = await addAdmin(username);
      if (result === "Admin already exists") {
        res.status(400).json({ message: result });
        return;
      }
      if (result === "User doesn't exists") {
        res.status(400).json({ message: result });
        return;
      } else {
        res.status(200).json({ message: result });
        return;
      }
    } else if (isAdmin === false) {
      const result = await deleteAdmin(username);

      if (result === "Admin doesn't exists") {
        res.status(404).json({ message: result });
        return;
      } else {
        res.status(200).json({ message: result });
        return;
      }
    }
  } catch (error) {
    res.status(500).json({ message: "خطایی رخ داده است" });
    return;
  }
};

export const ownerControllAll = async (req: Request, res: Response) => {
  const token = req.headers["authorization"]?.split(" ")[1];
  if (!token) {
    res.status(401).json({ message: "توکن ارسال نشده است" });
  }
  try {
    const verifyResponse = await axios.get(
      `http://localhost:${iamPort}/login/user-info`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    const { username: requesterUsername, userType } = verifyResponse.data;

    if (userType !== "owner") {
      res.status(403).json({ message: "شما مجوز این عملیات را ندارید" });
    }
    // 1) Get a list of all users
    const allUsers = await prisma.user.findMany();
    // 2) Get list of all admins (username only)
    const adminUsernames = (
      await prisma.admin.findMany({
        select: { username: true },
      })
    ).map((admin) => admin.username);

    // 3) Create the output array:
    // Given that the user and the admin may be the same (have the same username)
    // If the user's username is in the admin list, we set isAdmin to true
    const result = allUsers.map((user) => ({
      ...user,
      isAdmin: adminUsernames.includes(user.username),
    }));
    // 4) Return the result as JSON
    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Error in ownerControllAll:", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

export const ownerControllAdmin = async (req: Request, res: Response) => {
  const token = req.headers["authorization"]?.split(" ")[1];
  if (!token) {
    res.status(401).json({ message: "توکن ارسال نشده است" });
    return;
  }

  try {
    // Query user role from IAM
    const verifyResponse = await axios.get(
      `http://localhost:${iamPort}/login/user-info`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const { userType } = verifyResponse.data;

    if (userType !== "owner") {
      res.status(403).json({ message: "شما مجوز این عملیات را ندارید" });
      return;
    }
    // Get all admins
    const admins = await prisma.admin.findMany({ select: { username: true } });

    // For each admin, the total messages received in 3 tables
    const payload = await Promise.all(
      admins.map(async ({ username }) => {
        const [courseCnt, examCnt, commentCnt] = await prisma.$transaction([
          prisma.courseMessage.count({ where: { reciver: username } }),
          prisma.examMessage.count({ where: { reciver: username } }),
          prisma.commentReviewMessage.count({ where: { reciver: username } }),
        ]);
        return {
          username,
          messageNumber: courseCnt + examCnt + commentCnt,
        };
      })
    );

    res.json(payload);
  } catch (err) {
    console.error("see-admin error:", err);
    res.status(500).json({ message: "خطای داخلی سرور" });
    return;
  }
};

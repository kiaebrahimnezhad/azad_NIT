import express from "express";
import { Request, Response } from "express";
import {
  loginController,
  getUserInfo,
  signUpController,
  verifyOtpController,
  passController,
  passOtpController,
  resetPassController
} from "../controllers/authController";

export const authRoutes = express.Router();
export const signRouter = express.Router();

signRouter.post(
  "/",
  (req, res, next) => {
    next();
  },
  signUpController
);

signRouter.post('/verify-otp', verifyOtpController);

signRouter.post('/resetpass', resetPassController);


authRoutes.get("/user-info", getUserInfo);

authRoutes.post(
  "/",
  (req, res, next) => {
    next();
  },
  loginController
);

authRoutes.post(
  "/forgot-password",
  (req, res, next) => {
    next();
  },
  passController
);

authRoutes.post(
  "/forgot-password-otp",
  (req, res, next) => {
    next();
  },
  passOtpController
);

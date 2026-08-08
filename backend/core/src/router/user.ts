import express from "express";
import { Request, Response } from "express";
import {
  courseControll,
  registerCourseControll,
  certificateController
} from "../controllers/courseControll";
import { paymentCallbackControll } from "../controllers/payControll";
import { searchCoursesControll } from "../controllers/searchControll";
import { upload } from "../../middleware/upload";
import {
  getUserOverview,
  getUserController,
  updateUserController,
  getMessageController
} from "../controllers/userController";
import {
  createCommentController,
  commentReviewController,
} from "../controllers/commentController";

export const userRouter = express.Router();

export const courseRouter = express.Router();

courseRouter.post("/", upload.single("image"), courseControll);

courseRouter.post("/certificate",
  certificateController
);

userRouter.post(
  "/register-course",
  (req, res, next) => {
    next();
  },
  registerCourseControll
);

userRouter.post(
  "/search-course",
  (req, res, next) => {
    next();
  },
  searchCoursesControll
);

userRouter.post(
  "/send-comment",
  (req, res, next) => {
    next();
  },
  createCommentController
);

userRouter.post(
  "/review",
  (req, res, next) => {
    next();
  },
  commentReviewController
);

userRouter.get("/overview", getUserOverview);
userRouter.get("/get-user", getUserController);
userRouter.get("/get-message", getMessageController);
userRouter.post("/update-user", updateUserController);

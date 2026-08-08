import express from "express";
import { Request, Response } from "express";
import { getCourseControll } from "../controllers/courseControll";
import {
  validateCourseControll,
  sendMessageController,
  courseMessageControler,
  examMessageControler,
  commentMessageControler,
  getCommentControler,
  invalidaCourseControll,
  invalidaExamControll,
  mannageCommentControll
} from "../controllers/adminControll";
import { validateExamControll } from "../controllers/examController";
import { getCommentController } from "../controllers/commentController";
export const adminRouter = express.Router();

adminRouter.post(
  "/message",
  (req, res, next) => {
    next();
  },
  sendMessageController
);

adminRouter.post(
  "/get-course",
  (req, res, next) => {
    next();
  },
  getCourseControll
);

adminRouter.post(
  "/get-comment",
  (req, res, next) => {
    next();
  },
  getCommentController
);


adminRouter.post(
  "/mannage-comment",
  (req, res, next) => {
    next();
  },
  mannageCommentControll
);

adminRouter.post(
  "/validate-course",
  (req, res, next) => {
    next();
  },
  validateCourseControll
);


adminRouter.post(
  "/invalid-course",
  (req, res, next) => {
    next();
  },
  invalidaCourseControll
);


adminRouter.post(
  "/validate-exam",
  (req, res, next) => {
    next();
  },
  validateExamControll
);


adminRouter.post(
  "/invalid-exam",
  (req, res, next) => {
    next();
  },
  invalidaExamControll
);

adminRouter.post(
  "/get-message",
  (req, res, next) => {
    next();
  },
  getCommentControler
);


adminRouter.get(
  "/course-message",
  (req, res, next) => {
    next();
  },
  courseMessageControler
);

adminRouter.get(
  "/exam-message",
  (req, res, next) => {
    next();
  },
  examMessageControler
);

adminRouter.get(
  "/comment-message",
  (req, res, next) => {
    next();
  },
  commentMessageControler
);

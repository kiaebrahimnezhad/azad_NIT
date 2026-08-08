// src/routes/exam.ts
import { Router } from "express";
import { createOrUpdateExam, getExamsByCourseCid, getExamByEid, submitExamController, getQuestionByEid } from "../controllers/examController";

export const examRouter = Router();
examRouter.post("/", createOrUpdateExam); // POST /exam

// POST /exam/by-course  { cid }
examRouter.post("/by-course", getExamsByCourseCid);

// POST /exam/by-eid    { eid }
examRouter.post("/by-eid", getExamByEid);

examRouter.post("/question-by-eid", getQuestionByEid);

examRouter.post("/submit", submitExamController);

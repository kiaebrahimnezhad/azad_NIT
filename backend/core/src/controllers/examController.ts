import { Request, Response } from "express";
import axios from "axios";
import { PrismaClient, Prisma } from "@prisma/client";
import * as dotenv from "dotenv";
import fs from "fs";
import path from "path";
import util from "util";
import Docxtemplater from "docxtemplater";
import PizZip from "pizzip";
import libre from "libreoffice-convert";
import { toJalaali } from "jalaali-js";
dotenv.config();

const prisma = new PrismaClient();
const iamPort = process.env.IAM_PORT || 3000;
const convertAsync = util.promisify(libre.convert);

/** Rotating admin counter (in server memory) */
let adminCounter = 0;

/** Input for each question */
interface QuestionInput {
  quest: string;
  option1?: string;
  option2?: string;
  option3?: string;
  option4?: string;
  option5?: string;
  ans: number;
}

function toJalaliString(d: Date) {
  const j = toJalaali(d);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${j.jy}/${pad(j.jm)}/${pad(j.jd)}`;
}

/* --------- Helper type for answer inputs ---------- */
// interface AnswerInput {
//   qid: number; // Question ID
//   ans: number; // Student answer (1-5)
// }

/** Create or update exam */
export const createOrUpdateExam = async (req: Request, res: Response) => {
  /* 0) Token ------------------------------ */

  const token = req.headers["authorization"]?.split(" ")[1];
  if (!token) {
    res.status(401).json({ message: "Token not provided" });
  }

  try {
    /* ----1) Get user info from IAM service ---- */
    const { data: userInfo } = await axios.get(
      `http://localhost:${iamPort}/login/user-info`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const username = userInfo.username as string; // ← Fixed name

    /* 2) Input data -------------------- */
    const {
      eid, // May be undefined
      cid,
      min_score,
      start_time,
      end_time,
      duration,
      message,
      questions,
    } = req.body as {
      eid?: number;
      cid: number;
      min_score: number;
      start_time: string;
      end_time: string;
      duration: number;
      message: string;
      questions: QuestionInput[];
    };

    /* 3) Basic validation ------------------ */
    if (
      !cid ||
      !min_score ||
      !start_time ||
      !end_time ||
      !duration ||
      !message ||
      !Array.isArray(questions) ||
      questions.length === 0
    ) {
      res.status(400).json({ message: "Required fields are missing" });
    }

    /* 4) Validate each question -------------------- */
    for (const [i, q] of questions.entries()) {
      const opts = [
        q.option1,
        q.option2,
        q.option3,
        q.option4,
        q.option5,
      ].filter((o) => typeof o === "string" && o.trim() !== "");
      if (opts.length < 2) {
        res
          .status(400)
          .json({ message: `Question ${i + 1}: At least two options must be filled` });
      }
      if (q.ans < 1 || q.ans > 5) {
        res
          .status(400)
          .json({ message: `Question ${i + 1}: ans must be between 1 and 5` });
      }
    }

    /* 5) Ensure user is the course requester ---- */
    const requester = await prisma.courseRequester.findUnique({
      where: { username_cid: { username, cid } },
    });
    if (!requester) {
      res.status(403).json({
        message: "Only the course requester can create or edit exams",
      });
    }

    let createdOrUpdatedExamId: number;

    /* 6) If no eid => Create ------------------------------ */
    if (!eid) {
      const exam = await prisma.exam.create({
        data: {
          courseCid: cid,
          min_score,
          start_time: new Date(start_time),
          end_time: new Date(end_time),
          duration,
          is_valid: false,
        },
      });
      createdOrUpdatedExamId = exam.eid;

      // Insert questions
      await prisma.question.createMany({
        data: questions.map((q) => ({
          quest: q.quest,
          option1: q.option1 || "",
          option2: q.option2 || "",
          option3: q.option3 || "",
          option4: q.option4 || "",
          option5: q.option5 || "",
          ans: q.ans,
          examEid: exam.eid,
        })),
      });
    } else {
      /* 7) If eid exists => Update --------------------- */
      const existing = await prisma.exam.findUnique({ where: { eid } });
      if (!existing) {
        res.status(404).json({ message: "No exam found with this eid" });
        return;
      }
      if (existing.courseCid !== cid) {
        res
          .status(400)
          .json({ message: "Provided cid doesn't match the existing exam" });
      }

      await prisma.exam.update({
        where: { eid },
        data: {
          min_score,
          start_time: new Date(start_time),
          end_time: new Date(end_time),
          duration,
          is_valid: false, // Any update requires re-approval
        },
      });

      // Delete old questions and insert new ones (simplest approach)
      await prisma.question.deleteMany({ where: { examEid: eid } });
      await prisma.question.createMany({
        data: questions.map((q) => ({
          quest: q.quest,
          option1: q.option1 || "",
          option2: q.option2 || "",
          option3: q.option3 || "",
          option4: q.option4 || "",
          option5: q.option5 || "",
          ans: q.ans,
          examEid: eid,
        })),
      });

      createdOrUpdatedExamId = eid;
    }

    /* 8) Select admin in rotating fashion ------------------------- */
    const admins = await prisma.admin.findMany({
      orderBy: { username: "asc" },
    });
    if (admins.length === 0) {
      res.status(500).json({ message: "No admins found" });
    }
    // Calculate rotating index
    adminCounter = adminCounter % admins.length;

    // Now we're sure admins[idx] exists
    const reciver = admins[adminCounter]!.username;
    adminCounter++;

    /* 9) Save message for admin --------------------------- */
    await prisma.examMessage.create({
      data: {
        sender: username,
        reciver,
        eid: createdOrUpdatedExamId,
        text: message,
        date: new Date(),
      },
    });

    /* 10) Success response -------------------------------------- */
    res.status(201).json({
      success: true,
      message: eid
        ? "Exam updated and waiting for admin approval"
        : "Exam created and waiting for admin approval",
      eid: createdOrUpdatedExamId,
    });
  } catch (err) {
    console.error("createOrUpdateExam error:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const validateExamControll = async (req: Request, res: Response) => {
  const { examId } = req.body; // Get exam ID from request body
  const token = req.headers["authorization"]?.split(" ")[1]; // Get token from request header

  if (!token) {
    res.status(401).json({ message: "Token not provided" });
    return;
  }

  try {
    // 1) Check requester info (admin or owner)
    const verifyResponse = await axios.get(
      `http://localhost:${iamPort}/login/user-info`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    const { username: requesterUsername, userType } = verifyResponse.data;

    if (!examId) {
      res.status(400).json({ message: "exam id not provided" });
      return;
    }

    // Find exam by id
    const exam = await prisma.exam.findUnique({
      where: { eid: parseInt(examId) },
    });

    if (!exam) {
      res.status(404).json({ message: "Exam not found" });
      return;
    }

    // Check user permissions
    if (userType !== "admin" && userType !== "owner") {
      res.status(403).json({ message: "You don't have permission for this operation" });
      return;
    }

    // 2) Update exam's is_valid field
    const updatedExam = await prisma.exam.update({
      where: { eid: parseInt(examId) },
      data: {
        is_valid: true,
      },
    });

    // Delete examMessage records with matching eid
    await prisma.examMessage.deleteMany({
      where: {
        eid: parseInt(examId),
      },
    });

    // 3) Send success response
    res.status(200).json({
      success: true,
      message: "Exam approved and related messages deleted",
      data: updatedExam,
    });
  } catch (error) {
    console.error("Error in validateExamController:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

/** 1) Get exams for a course by cid with access control */
export const getExamsByCourseCid = async (
  req: Request<{}, {}, { cid: number }>,
  res: Response
): Promise<void> => {
  const { cid } = req.body;
  const token = req.headers["authorization"]?.split(" ")[1]; // Get token from request header

  if (!token) {
    res.status(401).json({ message: "Token not provided" });
    return;
  }

  try {
    // Get user info
    const { data: userInfo } = await axios.get(
      `http://localhost:${iamPort}/login/user-info`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const { username, userType } = userInfo as {
      username: string;
      userType: string;
    };

    // Allow if admin/owner
    if (userType !== "admin" && userType !== "owner") {
      // Otherwise check if in courseRequester table
      const cr = await prisma.student.findUnique({
        where: { username_cid: { username, cid } },
      });
      if (!cr) {
        res.status(403).json({ message: "Access denied" });
        return;
      }
    }

    // Now return the exams
    const exams = await prisma.exam.findMany({
      where: { courseCid: cid },
    });
    res.status(200).json({ success: true, data: exams });
    return;
  } catch (err) {
    console.error("getExamsByCourseCid error:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
    return;
  }
};

/** 2) Get exam by eid with access control */
export const getExamByEid = async (
  req: Request<{}, {}, { eid: number }>,
  res: Response
): Promise<void> => {
  const { eid } = req.body;
  const token = req.headers["authorization"]?.split(" ")[1]; // Get token from request header

  if (!token) {
    res.status(401).json({ message: "Token not provided" });
  }

  try {
    // Get user info
    const { data: userInfo } = await axios.get(
      `http://localhost:${iamPort}/login/user-info`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const { username, userType } = userInfo as {
      username: string;
      userType: string;
    };

    // Find exam
    const exam = await prisma.exam.findUnique({ where: { eid } });
    if (!exam) {
      res.status(404).json({ message: "Exam not found" });
      return;
    }

    // Allow if admin/owner
    if (userType !== "admin" && userType !== "owner") {
      // Or if requester of related course
      const cr = await prisma.courseRequester.findUnique({
        where: { username_cid: { username, cid: exam.courseCid } },
      });
      if (!cr) {
        res.status(403).json({ message: "Access denied" });
        return;
      }
    }

    // Finally return the exam
    res.status(200).json({ success: true, data: exam });
  } catch (err) {
    console.error("getExamByEid error:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

type AnswerInput = { qid: number; ans: number };

export const submitExamController = async (
  req: Request<{}, {}, { eid: number; answers: AnswerInput[] }>,
  res: Response
): Promise<void> => {
  /* 1) Token and get username ---------------------------- */
  const token = req.headers["authorization"]?.split(" ")[1];
  if (!token) {
    res.status(401).json({ message: "Token not provided" });
    return;
  }

  let username: string;
  try {
    const { data } = await axios.get(
      `http://localhost:${iamPort}/login/user-info`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    username = data.username;
  } catch {
    res.status(401).json({ message: "Invalid token" });
    return;
  }

  /* 2) Input data ------------------------------------- */
  const { eid, answers } = req.body;
  if (!eid || !Array.isArray(answers)) {
    res.status(400).json({ message: "Parameters are incomplete" });
    return;
  }

  /* 3) Fetch exam + course + questions ----------------------- */
  const exam = await prisma.exam.findUnique({
    where: { eid },
    include: { course: true, questions: true },
  });
  if (!exam) {
    res.status(404).json({ message: "Exam not found" });
    return;
  }
  const course = await prisma.course.findUnique({
    where: { cid: exam.courseCid },
    select: { name: true }, // We only select the course name
  });

  /* 4) Check if student is enrolled in the course ----------------------- */
  const enrolled = await prisma.student.findUnique({
    where: { username_cid: { username, cid: exam.courseCid } },
  });
  if (!enrolled) {
    res
      .status(403)
      .json({ message: "Only students of this course can take the exam" });
    return;
  }

  /* 4.1) Fetch user info --------------------------- */
  const user = await prisma.user.findUnique({ where: { username } });
  if (!user) {
    res.status(404).json({ message: "User info not found" });
    return;
  }

  /* 5) Convert answers to Map ---------------------------- */
  const answerMap = new Map<number, number>();
  for (const a of answers) {
    if (a.ans >= 1 && a.ans <= 5) answerMap.set(a.qid, a.ans);
  }

  /* 6) Calculate score ------------------------------------- */
  let raw = 0;
  const answerRows: { username: string; qid: number; ans: number | null }[] =
    [];

  for (const q of exam.questions) {
    const given = answerMap.get(q.qid) ?? null;
    if (given !== null) {
      if (given === q.ans) raw += 3;
      else raw -= 1;
    }
    answerRows.push({ username, qid: q.qid, ans: given });
  }

  const maxRaw = exam.questions.length * 3;
  const score = Math.max(0, (raw / Math.max(1, maxRaw)) * 20);

  /* 7) Transaction: Answer + Score -------------------------- */
  await prisma.$transaction(async (tx) => {
    // await tx.answer.deleteMany({
    //   where: { qid: { in: exam.questions.map((q) => q.qid) }, username },
    // });
    // await tx.answer.createMany({ data: answerRows.filter((r) => r.ans !== null) });
    await tx.score.upsert({
      where: { username_eid: { username, eid } },
      update: { score },
      create: { username, eid, score },
    });
  });

  /* 8) If passed → Generate certificate ------------------------ */
  if (score >= exam.min_score) {
    try {
      // 8.1) Template file path (DOCX)
      const templatePath = path.join(
        __dirname,
        "../../uploads",
        "certification.docx"
      );
      const templateBuf = fs.readFileSync(templatePath);

      // 8.2) Fill tags
      const zip = new PizZip(templateBuf);
      const doc = new Docxtemplater(zip, {
        paragraphLoop: true,
        linebreaks: true,
      });
      const fullDateFa = toJalaliString(new Date());
      doc.setData({
        first_name: user.first_name ?? "",
        last_name: user.last_name ?? "",
        course: course?.name ?? "",
        date: fullDateFa,
        score: score,
      });
      doc.render();
      const docxBuf = doc.getZip().generate({ type: "nodebuffer" });

      // 8.3) Convert to PDF with LibreOffice
      const pdfBuf: Buffer = await convertAsync(docxBuf, ".pdf", undefined);

      // 8.4) Save PDF file in uploads/certificates
      const outDir = path.join(__dirname, "../../uploads/certificates");
      fs.mkdirSync(outDir, { recursive: true });
      const fileBase = `${username}-${eid}-${Date.now()}`;
      const outPath = path.join(outDir, `${fileBase}.pdf`);
      fs.writeFileSync(outPath, pdfBuf);

      // 8.5) Public path (for download)
      const publicPath = `/uploads/certificates/${fileBase}.pdf`;

      // 8.6) Save path in Postgres (assumes Certificate model exists)
      // If not, create a model like:
      // model Certificate { id Int @id @default(autoincrement()) username String eid Int file_path String created_at DateTime @default(now()) @@unique([username, eid]) }
      await prisma.certificate.upsert({
        where: { username_eid: { username, eid } },
        update: { file_path: publicPath },
        create: { username, eid, file_path: publicPath },
      });

      res.status(200).json({
        success: true,
        passed: true,
        score,
        message: `Congratulations! You passed with score ${score.toFixed(
          2
        )}. Certificate issued.`,
      });
      return;
    } catch (e) {
      console.error("Certificate generation error:", e);
      // Even if PDF fails, return pass result
      res.status(200).json({
        success: true,
        passed: true,
        score,
        message:
          "You passed, but there was an issue generating the certificate. Please try again.",
      });
      return;
    }
  }

  /* 9) Failed */
  res.status(200).json({
    success: true,
    passed: false,
    score,
    message: `Your score is ${score.toFixed(2)}; minimum required is ${exam.min_score}.`,
  });
};

export const getQuestionByEid = async (
  req: Request<{}, {}, { eid: number }>,
  res: Response
): Promise<void> => {
  const { eid } = req.body;
  const token = req.headers["authorization"]?.split(" ")[1];
  if (!token) {
    res.status(401).json({ message: "Token not provided" });
    return;
  }

  try {
    // 1) Validate token and fetch user info
    const { data: userInfo } = await axios.get(
      `http://localhost:${iamPort}/login/user-info`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const { username, userType } = userInfo as {
      username: string;
      userType: string;
    };

    // 2) Check access
    let exam;
    if (userType !== "admin" && userType !== "owner") {
      // a) Get cid for this exam
      exam = await prisma.exam.findUnique({
        where: { eid },
        select: { courseCid: true },
      });
      if (!exam) {
        res.status(404).json({ message: "Exam not found" });
        return;
      }
      // b) Check if user is course requester
      const cr = await prisma.student.findUnique({
        where: { username_cid: { username, cid: exam.courseCid } },
      });
      if (!cr) {
        res.status(403).json({ message: "Access denied" });
        return;
      }
    }

    // 3) Fetch questions (without ans and examEid)
    const questions = await prisma.question.findMany({
      where: { examEid: eid },
      select: {
        qid: true,
        quest: true,
        option1: true,
        option2: true,
        option3: true,
        option4: true,
        option5: true,
      },
    });

    res.json({ questions });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};
import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import axios from "axios";
import * as dotenv from "dotenv";

dotenv.config();

const prisma = new PrismaClient();

import { CourseImage } from "../../models/courseImage";

export const searchCoursesControll = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { course, teacher, field } = req.body as {
      course?: string;
      teacher?: string;
      field?: string;
    };
    // where base with is_valid=true filter
    const where: any = { is_valid: true };
    // Course name
    if (course?.trim()) {
      where.name = { contains: course.trim(), mode: "insensitive" };
    }
    // Subject
    if (field?.trim()) {
      where.OR = [
        { field1: { contains: field.trim(), mode: "insensitive" } },
        { field2: { contains: field.trim(), mode: "insensitive" } },
      ];
    }
    // Teacher filter
    if (teacher?.trim()) {
      where.teachers = {
        some: {
          user: {
            OR: [
              { username: { contains: teacher.trim(), mode: "insensitive" } },
              { first_name: { contains: teacher.trim(), mode: "insensitive" } },
              { last_name: { contains: teacher.trim(), mode: "insensitive" } },
            ],
          },
        },
      };
    }
    // Fetch courses (including image column from course table)
    const courses = await prisma.course.findMany({
      where,
      include: {
        teachers: {
          include: {
            user: {
              select: { username: true, first_name: true, last_name: true },
            },
          },
        },
      },
    });
    // Just add the image path from the same image field
    const coursesWithImages = courses.map((c) => ({
      ...c,
      image: c.image ?? null,
    }));

    res.status(200).json({ success: true, data: coursesWithImages });
  } catch (err) {
    console.error("searchCoursesController error:", err);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

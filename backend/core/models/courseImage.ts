// models/courseImage.ts (mongoose)
import mongoose from 'mongoose';

export interface ICourseImage {
  cid: number;
  imagePath: string;
  uploadedBy: string;
  uploadedAt: Date;
}

const CourseImageSchema = new mongoose.Schema<ICourseImage>({
  cid:        { type: Number, required: true },
  imagePath:  { type: String, required: true },
  uploadedBy: { type: String, required: true },
  uploadedAt: { type: Date,   default: () => new Date() },
});

export const CourseImage = mongoose.model<ICourseImage>('CourseImage', CourseImageSchema);

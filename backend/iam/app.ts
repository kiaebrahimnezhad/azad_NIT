import express from "express";
import { authRoutes } from "./src/router/auth";
import { PrismaClient } from "@prisma/client";
import { signRouter } from "./src/router/auth";
import * as dotenv from "dotenv";
import cors from "cors";

dotenv.config(); 

const iamPort = process.env.IAM_PORT || 3000;
export const app = express();
const prisma = new PrismaClient();

app.use(cors({
  origin: 'http://localhost:5170',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

app.use(express.json());

app.use("/login", authRoutes);

app.use("/sign-up", signRouter);

if (process.env.NODE_ENV !== 'test') {
  const port = process.env.PORT || 4000;
  app.listen(port, () => console.log(`IAM listening on ${port}`));
}
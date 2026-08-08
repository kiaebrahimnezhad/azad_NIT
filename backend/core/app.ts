import express from "express";
import { ownerRouter } from "./src/router/owner";
import { userRouter, courseRouter } from "./src/router/user";
import { adminRouter } from "./src/router/admin";
import { payRouter } from "./src/router/pay";
import { PrismaClient } from "@prisma/client";
import { examRouter } from "./src/router/exam";
import * as dotenv from "dotenv";
import cors from "cors";
import path from "path";

dotenv.config();

const corePort = process.env.CORE_PORT || 3000;
export const app = express();
const prisma = new PrismaClient();

app.use(
  cors({
    origin: "http://localhost:5170",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);
// Middleware to parse request bodies into JSON format
app.use(express.json());
// Static path for uploaded files
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use("/owner", ownerRouter);

app.use("/user", userRouter);

app.use("/admin", adminRouter);

app.use("/payment", payRouter);

app.use("/courses", courseRouter);

app.use("/exam", examRouter);

if (process.env.NODE_ENV !== "test") {
  app.listen(corePort, () => {
    console.log(`Server is running on http://localhost:${corePort}`);
  });
}

export default app;

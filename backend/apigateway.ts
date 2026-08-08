import express, { Request, Response } from "express";
import axios from "axios";
import * as dotenv from "dotenv";

dotenv.config(); // بارگذاری متغیرهای محیطی

const app = express();
const PORT = process.env.GATEWAY_PORT || 3000;

// Middleware to parse JSON
app.use(express.json());

// مسیریابی درخواست‌ها به سرویس iam
app.use("/iam", async (req: Request, res: Response) => {
  try {
    // حذف هدرهایی که احتمال دارد مشکل‌ساز باشند
    const {
      host,
      connection,
      "content-length": _,
      ...forwardHeaders
    } = req.headers;

    const response = await axios({
      method: req.method,
      url: `http://iam:4000${req.url}`,
      data: req.body,
      headers: {
        ...forwardHeaders,
        "Content-Type": "application/json", // مطمئن شوید نوع محتوای JSON تعیین شده
      },
    });
    res.status(response.status).json(response.data);
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// مسیریابی درخواست‌ها به سرویس core
app.use("/core", async (req: Request, res: Response) => {
  try {
    const response = await axios({
      method: req.method,
      url: `http://core:5000${req.url}`, // فرض بر این است که سرویس core روی پورت 5000 در حال اجراست
      data: req.body,
      headers: req.headers,
    });
    res.status(response.status).json(response.data);
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// شروع API Gateway
app.listen(PORT, () => {
  console.log(`API Gateway is running on http://localhost:${PORT}`);
});

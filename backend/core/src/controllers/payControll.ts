import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import axios from "axios";
import * as dotenv from "dotenv";

dotenv.config(); // Load environment variables

let adminIndex = 0; // Read key value from .env
const prisma = new PrismaClient();
const iamPort = process.env.IAM_PORT || 3000; // Read key value from .env
const MERCHANT_ID = process.env.ZARINPAL_MERCHANT_ID!;
const CALLBACK_URL = process.env.BASE_URL!; // e.g. "https://your-domain.com"

const IS_TEST = MERCHANT_ID === "true";

export const payController = async (req: Request, res: Response) => {
  if (IS_TEST) {
    res.json({
      success: true,
      paymentUrl: `http://localhost:5170/result?Status=OK&Authority=TEST`,
    });
    return;
  }
  try {
    /* ---- 1) Token and extracting username ---- */
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      res.status(401).json({ message: "توکن ارسال نشده است" });
      return;
    }

    const { data: userInfo } = await axios.get(
      `http://localhost:${iamPort}/login/user-info`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const username = userInfo.username as string;

    /* ---- 2) Total price from body ---- */
    const { totalPrice } = req.body as { totalPrice: number };

    /* ---- 3) Request to Zarinpal ---- */
    const { data } = await axios.post(
      "https://api.zarinpal.com/pg/v4/payment/request.json",
      {
        merchant_id: MERCHANT_ID,
        amount: totalPrice,
        description: `پرداخت کاربر ${username}`,
        callback_url: CALLBACK_URL,
      }
    );

    if (data.data.code !== 100)
      res.status(400).json({ success: false, message: "خطا در ایجاد تراکنش" });

    const authority = data.data.authority;
    const paymentUrl = `https://www.zarinpal.com/pg/StartPay/${authority}`;

    // (Optional) You can save the authority in the database.
    res.json({ success: true, paymentUrl });
  } catch (err: any) {
    console.error(err.response?.data || err);
    res.status(500).json({ success: false, message: "خطا در ارتباط با درگاه" });
  }
};

export const rollBack = async (req: Request, res: Response) => {
  try {
    /* ---- 1) Token and extracting username ---- */
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      res.status(401).json({ message: "توکن ارسال نشده است" });
      return;
    }

    const { data: userInfo } = await axios.get(
      `http://localhost:${iamPort}/login/user-info`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const username = userInfo.username as string;

    if (IS_TEST) {
      /*  ❇️ We directly perform the transfer operation  */
      const basket = await prisma.shop.findMany({ where: { username } });
      const studentData = basket.map((b) => ({ username, cid: b.cid }));

      await prisma.$transaction([
        prisma.student.createMany({ data: studentData, skipDuplicates: true }),
        prisma.shop.deleteMany({ where: { username } }),
      ]);

      res.json({ success: true, message: "پرداخت تستی موفق" });
      return;
    }

    /* ---- 2) Verification at Zarinpal ---- */
    const { authority } = req.body as { authority: string };

    const { data } = await axios.post(
      "https://api.zarinpal.com/pg/v4/payment/verify.json",
      { merchant_id: MERCHANT_ID, authority, amount: 0 }
    );
    if (data.data.code !== 100) {
      res.status(400).json({ success: false, message: "تراکنش تأیید نشد" });
      return;
    }

    /* ---- 3) Transfer records from Shop to Student ---- */
    const basket = await prisma.shop.findMany({ where: { username } });
    const studentData = basket.map((b) => ({ username, cid: b.cid }));

    await prisma.$transaction([
      prisma.student.createMany({ data: studentData, skipDuplicates: true }),
      prisma.shop.deleteMany({ where: { username } }),
    ]);

    res.json({
      success: true,
      message: "پرداخت موفق و دوره‌ها اضافه شد",
      refId: data.data.ref_id,
    });
  } catch (err: any) {
    console.error(err.response?.data || err);
    res.status(500).json({ success: false, message: "خطا در پردازش پرداخت" });
  }
};

// 2) Zarinpal CALLBACK route
export const paymentCallbackControll = async (req: Request, res: Response) => {
  const { Status, Authority, username, courseId } = req.query as Record<
    string,
    string
  >;
  if (Status !== "OK") {
    res.status(400).send("پرداخت ناموفق بود یا کاربر پرداخت را لغو کرد");
  }

  // Verify payment
  try {
    const { data: verifyRes } = await axios.post(
      "https://api.zarinpal.com/pg/v4/payment/verify.json",
      {
        merchant_id: MERCHANT_ID,
        authority: Authority,
        amount: Number(
          await prisma.course
            .findUnique({ where: { cid: Number(courseId) } })
            .then((c) => c!.price)
        ),
      }
    );
    if (verifyRes.data.code === 100) {
      // Payment confirmed => registration
      await prisma.student.create({
        data: {
          username: username!,
          cid: Number(courseId),
        },
      });
      res.send("پرداخت موفق بود و ثبت‌نام انجام شد");
    } else {
      res.status(400).send(`خطا در وریفای پرداخت: ${verifyRes.data.message}`);
    }
  } catch (err) {
    console.error("Zarinpal verify error:", err);
    res.status(500).send("خطای داخلی در وریفای پرداخت");
  }
};

export const addToBasketController = async (req: Request, res: Response) => {
  try {
    const token = req.headers["authorization"]?.split(" ")[1];
    if (!token) {
      res.status(401).json({ message: "توکن ارسال نشده است" });
      return;
    }

    // 1.1) User validation from authentication service
    const { data: userInfo } = await axios.get(
      `http://localhost:${iamPort}/login/user-info`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const username = userInfo.username as string;

    // 1.2) Add record to shopping cart table
    const cid = Number(req.body.cid);
    if (isNaN(cid)) {
      res.status(400).json({ message: "cid نامعتبر است" });
      return;
    }

    await prisma.shop.create({
      data: {
        username,
        cid,
      },
    });

    res.json({ success: true, message: "به سبد خرید افزوده شد" });
  } catch (error: any) {
    console.error(error);
    res
      .status(500)
      .json({ success: false, message: "این دوره در سبد خرید شما موجود است" });
  }
};

export const getBasketController = async (req: Request, res: Response) => {
  try {
    const token = req.headers["authorization"]?.split(" ")[1];
    if (!token) {
      res.status(401).json({ message: "توکن ارسال نشده است" });
      return;
    }

    // 2.1) Extract username
    const { data: userInfo } = await axios.get(
      `http://localhost:${iamPort}/login/user-info`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const username = userInfo.username as string;

    // 2.2) Find all cids for this user
    const basketItems = await prisma.shop.findMany({
      where: { username },
      select: { cid: true },
    });
    const cids = basketItems.map((item) => item.cid);

    if (cids.length === 0) {
      res.json({ courses: [], totalPrice: 0 });
      return;
    }

    // 2.3) Fetch course information
    const courses = await prisma.course.findMany({
      where: { cid: { in: cids } },
    });

    // 2.4) Sum prices
    const totalPrice = courses.reduce((sum, c) => sum + Number(c.price), 0);

    // 2.5) Send response
    res.json({ courses, totalPrice });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ message: "خطای سرور" });
  }
};

export const removeBasketController = async (req: Request, res: Response) => {
  // 1) Extract token
  const token = req.headers["authorization"]?.split(" ")[1];
  if (!token) {
    res.status(401).json({ message: "توکن ارسال نشده است" });
    return;
  }

  // 2) Validate token and get username
  let username: string;
  try {
    const { data } = await axios.get(
      `http://localhost:${iamPort}/login/user-info`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    username = data.username as string;
  } catch {
    res.status(401).json({ message: "توکن نامعتبر است" });
    return;
  }

  // 3) Extract cid from body
  const { cid } = req.body as { cid?: number };
  if (typeof cid !== "number") {
    res.status(400).json({ message: "cid باید عددی باشد" });
    return;
  }

  try {
    // 4) Delete shop record
    await prisma.shop.delete({
      where: {
        username_cid: {
          username,
          cid,
        },
      },
    });

    res.json({ success: true, message: "از سبد خرید حذف شد" });
  } catch (err: any) {
    // If record did not exist
    if (err.code === "P2025") {
      res.status(404).json({ success: false, message: "آیتم در سبد یافت نشد" });
    }
    console.error("removeFromShop error:", err);
    res.status(500).json({ success: false, message: "خطای سرور" });
  }
};

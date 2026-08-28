import { PrismaClient, Prisma } from "@prisma/client";

const prisma = new PrismaClient();

export const deleteUser = async (username: string) => {
  const user = await prisma.user.findUnique({ where: { username } });
  if (!user) return "no such user found";

  // محافظت owner: نه owner دیگری، نه خودِ درخواست‌دهنده (که خودش هم یک owner است)
  // از این مسیر قابل حذف نباشد.
  const isItOwner = await prisma.owner.findUnique({ where: { username } });
  if (isItOwner) return "cannot delete an owner";

  const isItAdmin = await prisma.admin.findUnique({ where: { username } });
  if (isItAdmin){
    await prisma.admin.delete({ where: { username } });
  }

  try {
    await prisma.user.delete({ where: { username } });
  } catch (err) {
    // اگر این کاربر هنوز رکورد مرتبط (دوره، آزمون، گواهی و ...) داشته باشد،
    // پایگاه‌داده حذف را به‌خاطر کلید خارجی رد می‌کند (خطای P2003).
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2003") {
      return "user has related records";
    }
    throw err;
  }

  return "user deleted";
};

export const addAdmin = async (username: string) => {
  const existingUser = await prisma.user.findUnique({ where: { username } });
  if (!existingUser) {
    return "User doesn't exists";
  }
  // بررسی وجود کاربر در دیتابیس
  const existingAdmin = await prisma.admin.findUnique({ where: { username } });
  if (existingAdmin) {
    return "Admin already exists";
  }

  const newAdmin = await prisma.admin.create({
    data: {
      username,
    },
  });

  return "Admin added successfully";
};

export const deleteAdmin = async (username: string) => {
  // بررسی وجود کاربر در دیتابیس
  const existingUser = await prisma.admin.findUnique({ where: { username } });
  if (!existingUser) {
    return "Admin doesn't exists";
  }

  await prisma.admin.delete({ where: { username } });
  return "admin deleted";
};

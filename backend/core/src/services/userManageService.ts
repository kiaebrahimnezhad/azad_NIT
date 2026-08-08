import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const deleteUser = async (username: string) => {
  const user = await prisma.user.findUnique({ where: { username } });
  if (!user) return "no such user found";

  const isItAdmin = await prisma.admin.findUnique({ where: { username } });
  if (isItAdmin){
    await prisma.admin.delete({ where: { username } });
  }

  await prisma.user.delete({ where: { username } });
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

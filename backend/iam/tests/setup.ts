import dotenv from "dotenv";
dotenv.config({ path: ".env.test" });

jest.setTimeout(30000);

// Mock nodemailer so that the real email is not sent
jest.mock("nodemailer", () => ({
  createTransport: () => ({
    sendMail: jest.fn().mockResolvedValue({ messageId: "test" }),
  }),
}));

import express from "express";
import { Request, Response } from "express";
import { ownerControll, ownerControllAll, ownerControllAdmin } from "../controllers/ownerControll";

export const ownerRouter = express.Router();

ownerRouter.post(
  "/",
  (req, res, next) => {
    next();
  },
  ownerControll
);

ownerRouter.get(
  "/see-all",
  (req, res, next) => {
    next();
  },
  ownerControllAll
);

ownerRouter.get(
  "/see-admin",
  (req, res, next) => {
    next();
  },
  ownerControllAdmin
);


import express from "express";
import { Request, Response } from "express";
import {
  addToBasketController,
  getBasketController,
  removeBasketController,
  payController,
  rollBack,
} from "../controllers/payControll";

export const payRouter = express.Router();

payRouter.post(
  "/pay",
  (req, res, next) => {
    next();
  },
  payController
);

payRouter.post(
  "/roll-back",
  (req, res, next) => {
    next();
  },
  rollBack
);

payRouter.post(
  "/add",
  (req, res, next) => {
    next();
  },
  addToBasketController
);

payRouter.delete(
  "/delete",
  (req, res, next) => {
    next();
  },
  removeBasketController
);

payRouter.get(
  "/get-basket",
  (req, res, next) => {
    next();
  },
  getBasketController
);

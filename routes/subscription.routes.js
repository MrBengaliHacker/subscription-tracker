import { Router } from "express";

import {
  createSubscription,
  getUserSubscriptions,
  getSubscriptionById,
  updateSubscription,
  deleteSubscription,
} from "../controllers/subscription.controller.js";

import authorize from "../middlewares/auth.middleware.js";

const subscriptionRouter = Router();

subscriptionRouter.get("/", authorize, getUserSubscriptions);
subscriptionRouter.post("/", authorize, createSubscription);
subscriptionRouter.patch("/:id", authorize, updateSubscription);
subscriptionRouter.delete("/:id", authorize, deleteSubscription);
subscriptionRouter.get("/:id", authorize, getSubscriptionById);

export default subscriptionRouter;

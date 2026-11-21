import { Router } from "express";
import {
  signUp,
  signIn,
  refresh,
} from "../controllers/auth.controller.js";
import arcjetMiddleware from "../middlewares/arcjet.middleware.js";

const authRouter = Router();

authRouter.post("/signup", arcjetMiddleware, signUp);
authRouter.post("/login", arcjetMiddleware, signIn);
authRouter.post("/refresh", arcjetMiddleware, refresh);

export default authRouter;
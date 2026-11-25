import { Router } from "express";
import {
  signUp,
  signIn,
  refresh,
  signOut,
} from "../controllers/auth.controller.js";
import arcjetMiddleware from "../middlewares/arcjet.middleware.js";
import authorize from "../middlewares/auth.middleware.js";

const authRouter = Router();

authRouter.post("/signup", arcjetMiddleware, signUp);
authRouter.post("/login", arcjetMiddleware, signIn);
authRouter.post("/refresh", arcjetMiddleware, refresh);
authRouter.post("/logout", authorize, signOut);

export default authRouter;
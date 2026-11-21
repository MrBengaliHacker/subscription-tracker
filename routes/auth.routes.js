import { Router } from "express";
import {
  signUp,
  signIn,
  refresh,
} from "../controllers/auth.controller.js";

const authRouter = Router();

authRouter.post("/signup", signUp);
authRouter.post("/login", signIn);
authRouter.post("/refresh", refresh);

export default authRouter;
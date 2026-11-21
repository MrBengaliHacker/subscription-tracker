import { Router } from "express";
import authorize from "../middlewares/auth.middleware.js";
import { getCurrentUser } from "../controllers/user.controller.js";

const userRouter = Router();

userRouter.get("/me", authorize, getCurrentUser);

export default userRouter;
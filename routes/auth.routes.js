import { Router } from "express";

const authRouter = Router();

authRouter.post("/signup", (req, res) =>
  res.send({ title: "Sign Up" })
);

authRouter.post("/login", (req, res) =>
  res.send({ title: "Log In" })
);

authRouter.post("/logout", (req, res) =>
  res.send({ title: "Log Out" })
);

export default authRouter;
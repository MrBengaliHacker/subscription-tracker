import { Router } from "express";

const userRouter = Router();

userRouter.get("/", (req, res) =>
  res.send({ title: "Fetch all users" })
);

userRouter.get("/:id", (req, res) =>
  res.send({ title: "Fetch user details" })
);

userRouter.patch("/:id", (req, res) =>
  res.send({ title: "Update user" })
);

userRouter.delete("/:id", (req, res) =>
  res.send({ title: "Delete user" })
);

export default userRouter;
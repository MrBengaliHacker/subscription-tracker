import { Router } from "express";

const subscriptionRouter = Router();

subscriptionRouter.get("/", (req, res) =>
  res.send({ title: "Fetch all subscriptions" })
);

subscriptionRouter.get("/upcomingRenewals", (req, res) =>
  res.send({ title: "Get upcoming renewals" })
);

subscriptionRouter.get("/user/:userId", (req, res) =>
  res.send({ title: "Fetch all user subscriptions" })
);

subscriptionRouter.get("/:id", (req, res) =>
  res.send({ title: "Fetch subscription details" })
);

subscriptionRouter.post("/", (req, res) =>
  res.send({ title: "Create subscription" })
);

subscriptionRouter.patch("/:id", (req, res) =>
  res.send({ title: "Update subscription" })
);

subscriptionRouter.put("/:id/cancel", (req, res) =>
  res.send({ title: "Cancel subscription" })
);

subscriptionRouter.delete("/:id", (req, res) =>
  res.send({ title: "Delete subscription" })
);

export default subscriptionRouter;
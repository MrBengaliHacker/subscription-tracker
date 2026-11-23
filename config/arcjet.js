
import arcjet, { shield, detectBot, tokenBucket } from "@arcjet/node";
import { ARCJET_KEY, NODE_ENV } from "./env.js";

const isProduction = NODE_ENV === "production";

const aj = arcjet({
  key: ARCJET_KEY,
  rules: [
    // Protect against common attacks
    shield({ mode: "LIVE" }),

    // Detect automated requests
    detectBot({
      mode: isProduction ? "LIVE" : "DRY_RUN",
      allow: ["CATEGORY:SEARCH_ENGINE"],
    }),

    // Rate limiting
    tokenBucket({
      mode: "LIVE",
      refillRate: 5,
      interval: 10,
      capacity: 10,
    }),
  ],
});

export default aj;

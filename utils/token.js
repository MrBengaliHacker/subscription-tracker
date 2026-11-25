import jwt from "jsonwebtoken";
import { randomUUID } from "node:crypto";
import {
  JWT_ACCESS_SECRET,
  JWT_ACCESS_EXPIRES_IN,
  JWT_REFRESH_SECRET,
  JWT_REFRESH_EXPIRES_IN,
} from "../config/env.js";

const generateAccessToken = (userId) => {
  return jwt.sign(
    { userId, type: "access" },
    JWT_ACCESS_SECRET,
    { expiresIn: JWT_ACCESS_EXPIRES_IN }
  );
};

const generateRefreshToken = (userId) => {
  return jwt.sign(
    { userId, type: "refresh" },
    JWT_REFRESH_SECRET,
    {
      expiresIn: JWT_REFRESH_EXPIRES_IN,
      jwtid: randomUUID(),
    }
  );
};

const verifyAccessToken = (token) => {
  const decoded = jwt.verify(token, JWT_ACCESS_SECRET);

  if (decoded.type !== "access") {
    throw new Error("Invalid access token type");
  }

  return decoded;
};

const verifyRefreshToken = (token) => {
  const decoded = jwt.verify(token, JWT_REFRESH_SECRET);

  if (decoded.type !== "refresh") {
    throw new Error("Invalid refresh token type");
  }

  return decoded;
};

export {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
};
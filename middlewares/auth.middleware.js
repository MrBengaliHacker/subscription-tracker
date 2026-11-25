import { verifyAccessToken } from "../utils/token.js";
import { findUserById } from "../models/user.model.js";

const authorize = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        message: "Unauthorized: Missing or invalid token",
      });
    }

    const [scheme, token, ...extra] = authHeader.split(" ");

    if (
      scheme !== "Bearer" ||
      !token ||
      extra.length > 0
    ) {
      return res.status(401).json({
        message: "Unauthorized: Missing or invalid token",
      });
    }

    // Verify access token
    const decoded = verifyAccessToken(token);

    // Fetch authenticated user
    const user = await findUserById(decoded.userId);

    if (!user) {
      return res.status(401).json({
        message: "Unauthorized: User not found",
      });
    }

    // Attach user to request
    req.user = user;

    next();
  } catch (error) {
    if (
      error.name === "TokenExpiredError" ||
      error.name === "JsonWebTokenError" ||
      error.name === "NotBeforeError" ||
      error.message === "Invalid access token type"
    ) {
      return res.status(401).json({
        message: "Unauthorized: Invalid or expired token",
      });
    }

    next(error);
  }
};

export default authorize;
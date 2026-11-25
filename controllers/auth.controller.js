import {
  createUser,
  findUserByEmail,
} from "../models/user.model.js";

import {
  hashPassword,
  comparePassword,
} from "../utils/password.js";

import {
  createSession,
  rotateSession,
  logoutSession,
} from "../services/auth-session.service.js";

import { withTransaction } from "../database/transaction.js";

import {
  REFRESH_TOKEN_COOKIE,
  setRefreshTokenCookie,
  clearRefreshTokenCookie,
} from "../utils/auth-cookie.js";

const signUp = async (req, res, next) => {
  try {
    const name = req.body.name?.trim();
    const email = req.body.email?.trim().toLowerCase();
    const password = req.body.password;

    if (!name || !email || !password) {
      return res.status(400).json({
        message: "Name, email, and password are required",
      });
    }

    if (name.length < 2 || name.length > 50) {
      return res.status(400).json({
        message: "Name must be between 2 and 50 characters",
      });
    }

    if (typeof password !== "string" || password.length < 8) {
      return res.status(400).json({
        message: "Password must contain at least 8 characters",
      });
    }

    const existingUser = await findUserByEmail(email);

    if (existingUser) {
      return res.status(409).json({
        message: "Email already registered",
      });
    }

    const hashedPassword = await hashPassword(password);

    const { user, session } = await withTransaction(async (client) => {
      const user = await createUser(
        {
          name,
          email,
          password: hashedPassword,
        },
        client
      );

      const session = await createSession(user, client);

      return { user, session };
    });

    setRefreshTokenCookie(res, session.refreshToken);

    return res.status(201).json({
      message: "Account created successfully",
      user,
      accessToken: session.accessToken,
    });
  } catch (error) {
    next(error);
  }
};

const signIn = async (req, res, next) => {
  try {
    const email = req.body.email?.trim().toLowerCase();
    const password = req.body.password;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    const user = await findUserByEmail(email);

    if (!user) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    const isPasswordValid = await comparePassword(
      password,
      user.password
    );

    if (!isPasswordValid) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    const safeUser = { ...user };
    delete safeUser.password;

    const session = await createSession(user);

    setRefreshTokenCookie(res, session.refreshToken);

    return res.status(200).json({
      message: "Logged in successfully",
      user: safeUser,
      accessToken: session.accessToken,
    });
  } catch (error) {
    next(error);
  }
};


const refresh = async (req, res, next) => {
  try {
    const refreshToken = req.cookies[REFRESH_TOKEN_COOKIE];

    if (!refreshToken) {
      return res.status(401).json({
        message: "Refresh token is required",
      });
    }

    const session = await rotateSession(refreshToken);

    if (!session) {
      clearRefreshTokenCookie(res);

      return res.status(401).json({
        message: "Invalid or expired refresh token",
      });
    }

    setRefreshTokenCookie(res, session.refreshToken);

    return res.status(200).json({
      message: "Token refreshed successfully",
      accessToken: session.accessToken,
    });
  } catch (error) {
    next(error);
  }
};

const signOut = async (req, res, next) => {
  try {
    const refreshToken = req.cookies[REFRESH_TOKEN_COOKIE];

    if (refreshToken) {
      await logoutSession(refreshToken, req.user.id);
    }

    clearRefreshTokenCookie(res);

    return res.status(200).json({
      message: "Logged out successfully",
    });
  } catch (error) {
    next(error);
  }
};

export { signUp, signIn, refresh, signOut };
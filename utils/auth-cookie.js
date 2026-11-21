import { NODE_ENV } from "../config/env.js";

const REFRESH_TOKEN_COOKIE = "refreshToken";

const cookieOptions = {
  httpOnly: true,
  secure: NODE_ENV === "production",
  sameSite: "lax",
  path: "/api/v1/auth",
};

const setRefreshTokenCookie = (res, token) => {
  res.cookie(REFRESH_TOKEN_COOKIE, token, {
    ...cookieOptions,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
};

const clearRefreshTokenCookie = (res) => {
  res.clearCookie(REFRESH_TOKEN_COOKIE, cookieOptions);
};

export {
  REFRESH_TOKEN_COOKIE,
  setRefreshTokenCookie,
  clearRefreshTokenCookie,
};

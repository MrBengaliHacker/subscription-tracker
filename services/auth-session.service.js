
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from "../utils/token.js";

import { hashToken } from "../utils/token-hash.js";

import {
  createRefreshToken,
  findRefreshTokenByHash,
  revokeRefreshToken,
} from "../models/refresh-token.model.js";

import { findUserById } from "../models/user.model.js";
import { withTransaction } from "../database/transaction.js";

const createSession = async (user, client = null) => {
  const accessToken = generateAccessToken(user.id);
  const refreshToken = generateRefreshToken(user.id);

  const decodedPayload = JSON.parse(
    Buffer.from(refreshToken.split(".")[1], "base64url").toString()
  );

  const tokenHash = hashToken(refreshToken);
  const expiresAt = new Date(decodedPayload.exp * 1000);

  const saveRefreshToken = async (dbClient) => {
    await createRefreshToken(
      { userId: user.id, tokenHash, expiresAt },
      dbClient
    );
  };

  if (client) {
    await saveRefreshToken(client);
  } else {
    await withTransaction(saveRefreshToken);
  }

  return { accessToken, refreshToken };
};

const rotateSession = async (refreshToken) => {
  let decoded;

  try {
    decoded = verifyRefreshToken(refreshToken);
  } catch {
    return null;
  }

  const tokenHash = hashToken(refreshToken);

  const storedToken = await findRefreshTokenByHash(tokenHash);

  if (
    !storedToken ||
    storedToken.revoked_at ||
    new Date(storedToken.expires_at) <= new Date() ||
    storedToken.user_id !== decoded.userId
  ) {
    return null;
  }

  const user = await findUserById(decoded.userId);

  if (!user) {
    return null;
  }

  const session = await withTransaction(async (client) => {
    const revokedToken = await revokeRefreshToken(tokenHash, client);

    if (!revokedToken) {
      return null;
    }

    return await createSession(user, client);
  });

  return session;
};

export { createSession, rotateSession };

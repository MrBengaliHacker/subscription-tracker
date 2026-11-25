import { randomUUID } from "node:crypto";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from "../utils/token.js";

import { hashToken } from "../utils/token-hash.js";

import {
  createRefreshToken,
  findRefreshTokenByHashForUpdate,
  revokeRefreshToken,
  revokeRefreshTokenFamily,
} from "../models/refresh-token.model.js";

import { findUserById } from "../models/user.model.js";
import { withTransaction } from "../database/transaction.js";

const createSession = async (
  user,
  client = null,
  familyId = randomUUID()
) => {
  const accessToken = generateAccessToken(user.id);
  const refreshToken = generateRefreshToken(user.id);

  const decodedPayload = JSON.parse(
    Buffer.from(refreshToken.split(".")[1], "base64url").toString()
  );

  const tokenHash = hashToken(refreshToken);
  const expiresAt = new Date(decodedPayload.exp * 1000);

  const saveRefreshToken = async (dbClient) => {
    await createRefreshToken(
      { userId: user.id, tokenHash, expiresAt, familyId },
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

  return withTransaction(async (client) => {
    const storedToken = await findRefreshTokenByHashForUpdate(
      tokenHash,
      client
    );

    if (!storedToken || storedToken.user_id !== decoded.userId) {
      return null;
    }

    // A revoked token is being reused.
    if (storedToken.revoked_at) {
      await revokeRefreshTokenFamily(storedToken.family_id, client);
      return null;
    }

    if (new Date(storedToken.expires_at) <= new Date()) {
      return null;
    }

    const user = await findUserById(decoded.userId, client);

    if (!user) {
      return null;
    }

    const revokedToken = await revokeRefreshToken(tokenHash, client);

    if (!revokedToken) {
      return null;
    }

    return createSession(user, client, storedToken.family_id);
  });
};

const logoutSession = async (refreshToken, userId) => {
  if (!refreshToken) {
    return false;
  }

  let decoded;

  try {
    decoded = verifyRefreshToken(refreshToken);
  } catch {
    return false;
  }

  if (decoded.userId !== userId) {
    return false;
  }

  const tokenHash = hashToken(refreshToken);

  return withTransaction(async (client) => {
    const revokedToken = await revokeRefreshToken(tokenHash, client);

    return Boolean(revokedToken);
  });
};

export { createSession, rotateSession, logoutSession };

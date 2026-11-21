import {
  generateAccessToken,
  generateRefreshToken,
} from "../utils/token.js";

import { hashToken } from "../utils/token-hash.js";
import { createRefreshToken } from "../models/refresh-token.model.js";
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
      {
        userId: user.id,
        tokenHash,
        expiresAt,
      },
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

export { createSession };
import { pool } from "../database/postgresql.js";

const createRefreshToken = async ({
  userId,
  tokenHash,
  expiresAt,
}, client = pool) => {
  const query = `
    INSERT INTO refresh_tokens (
      user_id,
      token_hash,
      expires_at
    )
    VALUES ($1, $2, $3)
    RETURNING id, user_id, expires_at, created_at
  `;

  const values = [userId, tokenHash, expiresAt];

  const { rows } = await client.query(query, values);

  return rows[0];
};

const findRefreshTokenByHash = async (tokenHash, client = pool) => {
  const query = `
    SELECT id, user_id, token_hash, expires_at, revoked_at
    FROM refresh_tokens
    WHERE token_hash = $1
  `;

  const { rows } = await client.query(query, [tokenHash]);

  return rows[0] || null;
};

const revokeRefreshToken = async (tokenHash, client = pool) => {
  const query = `
    UPDATE refresh_tokens
    SET revoked_at = NOW()
    WHERE token_hash = $1
      AND revoked_at IS NULL
    RETURNING id, user_id, revoked_at
  `;

  const { rows } = await client.query(query, [tokenHash]);

  return rows[0] || null;
};

export {
  createRefreshToken,
  findRefreshTokenByHash,
  revokeRefreshToken,
};

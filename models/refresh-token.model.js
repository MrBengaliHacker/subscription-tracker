import { pool } from "../database/postgresql.js";

const createRefreshToken = async ({
  userId,
  tokenHash,
  expiresAt,
  familyId,
}, client = pool) => {
  const query = `
    INSERT INTO refresh_tokens (
      user_id,
      token_hash,
      expires_at,
      family_id
    )
    VALUES ($1, $2, $3, $4)
    RETURNING id, user_id, expires_at, family_id, created_at
  `;

  const values = [userId, tokenHash, expiresAt, familyId];

  const { rows } = await client.query(query, values);

  return rows[0];
};

const findRefreshTokenByHash = async (tokenHash, client = pool) => {
  const query = `
    SELECT id, user_id, token_hash, family_id, expires_at, revoked_at
    FROM refresh_tokens
    WHERE token_hash = $1
  `;

  const { rows } = await client.query(query, [tokenHash]);

  return rows[0] || null;
};

const findRefreshTokenByHashForUpdate = async (tokenHash, client) => {
  const query = `
    SELECT id, user_id, token_hash, expires_at, revoked_at, family_id
    FROM refresh_tokens
    WHERE token_hash = $1
    FOR UPDATE
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
      AND expires_at > NOW()
    RETURNING id, user_id, revoked_at
  `;

  const { rows } = await client.query(query, [tokenHash]);

  return rows[0] || null;
};

const revokeRefreshTokenFamily = async (familyId, client) => {
  const query = `
    UPDATE refresh_tokens
    SET revoked_at = NOW()
    WHERE family_id = $1
      AND revoked_at IS NULL
      AND expires_at > NOW()
    RETURNING id, user_id, revoked_at
  `;

  const { rows } = await client.query(query, [familyId]);
  return rows;
};

export {
  createRefreshToken,
  findRefreshTokenByHash,
  findRefreshTokenByHashForUpdate,
  revokeRefreshToken,
  revokeRefreshTokenFamily,
};


import { pool } from "../database/postgresql.js";

const createUser = async ({ name, email, password }, client = pool) => {
  const query = `
    INSERT INTO users (name, email, password)
    VALUES ($1, $2, $3)
    RETURNING id, name, email, created_at, updated_at
  `;

  const values = [name, email, password];

  const { rows } = await client.query(query, values);

  return rows[0];
};

const findUserByEmail = async (email) => {
  const query = `
    SELECT *
    FROM users
    WHERE email = $1
  `;

  const { rows } = await pool.query(query, [email]);

  return rows[0] || null;
};

const findUserById = async (id, client = pool) => {
  const query = `
    SELECT id, name, email, created_at, updated_at
    FROM users
    WHERE id = $1
  `;

  const { rows } = await client.query(query, [id]);

  return rows[0] || null;
};

export { createUser, findUserByEmail, findUserById };

import { pool } from "../database/postgresql.js";

const calculateRenewalDate = (startDate, frequency) => {
  const renewalDate = new Date(startDate);

  switch (frequency) {
    case "daily":
      renewalDate.setUTCDate(renewalDate.getUTCDate() + 1);
      break;

    case "weekly":
      renewalDate.setUTCDate(renewalDate.getUTCDate() + 7);
      break;

    case "monthly": {
      const day = renewalDate.getUTCDate();

      renewalDate.setUTCDate(1);
      renewalDate.setUTCMonth(renewalDate.getUTCMonth() + 1);

      const lastDay = new Date(
        Date.UTC(
          renewalDate.getUTCFullYear(),
          renewalDate.getUTCMonth() + 1,
          0
        )
      ).getUTCDate();

      renewalDate.setUTCDate(Math.min(day, lastDay));
      break;
    }

    case "yearly": {
      const month = renewalDate.getUTCMonth();
      const day = renewalDate.getUTCDate();

      renewalDate.setUTCDate(1);
      renewalDate.setUTCFullYear(renewalDate.getUTCFullYear() + 1);
      renewalDate.setUTCMonth(month);

      const lastDay = new Date(
        Date.UTC(
          renewalDate.getUTCFullYear(),
          month + 1,
          0
        )
      ).getUTCDate();

      renewalDate.setUTCDate(Math.min(day, lastDay));
      break;
    }

    default:
      throw new Error("Invalid subscription frequency");
  }

  return renewalDate;
};

const createSubscription = async ({
  name,
  price,
  currency = "INR",
  frequency,
  category,
  paymentMethod,
  startDate,
  userId,
}) => {
  const finalRenewalDate = calculateRenewalDate(startDate, frequency);

  const status = finalRenewalDate < new Date() ? "expired" : "active";

  const query = `
    INSERT INTO subscriptions (
      name,
      price,
      currency,
      frequency,
      category,
      payment_method,
      status,
      start_date,
      renewal_date,
      user_id
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    RETURNING *
  `;

  const values = [
    name?.trim(),
    price,
    currency,
    frequency,
    category,
    paymentMethod?.trim(),
    status,
    new Date(startDate),
    finalRenewalDate,
    userId,
  ];

  const { rows } = await pool.query(query, values);

  return rows[0];
};

const findSubscriptionById = async (id) => {
  const query = `
    SELECT *
    FROM subscriptions
    WHERE id = $1
  `;

  const { rows } = await pool.query(query, [id]);

  return rows[0] || null;
};

const findSubscriptionsByUserId = async (userId) => {
  const query = `
    SELECT *
    FROM subscriptions
    WHERE user_id = $1
    ORDER BY created_at DESC
  `;

  const { rows } = await pool.query(query, [userId]);

  return rows;
};

export {
  createSubscription,
  findSubscriptionById,
  findSubscriptionsByUserId,
};
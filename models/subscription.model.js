import { pool } from "../database/postgresql.js";
import { withTransaction } from "../database/transaction.js";

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
          0,
        ),
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
        Date.UTC(renewalDate.getUTCFullYear(), month + 1, 0),
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

const deleteSubscription = async (id, userId) => {
  const query = `
    DELETE FROM subscriptions
    WHERE id = $1 AND user_id = $2
    RETURNING *
  `;

  const { rows } = await pool.query(query, [id, userId]);

  return rows[0] || null;
};

const updateSubscription = async (id, userId, updates) => {
  const allowedFields = [
    "name",
    "price",
    "currency",
    "frequency",
    "category",
    "payment_method",
    "start_date",
  ];

  const fields = Object.keys(updates).filter((field) =>
    allowedFields.includes(field),
  );

  if (fields.length === 0) {
    return null;
  }

  return withTransaction(async (client) => {
    // 1. Find and lock the subscription row
    const selectQuery = `
      SELECT *
      FROM subscriptions
      WHERE id = $1 AND user_id = $2
      FOR UPDATE
    `;

    const { rows } = await client.query(selectQuery, [id, userId]);

    const existingSubscription = rows[0];

    if (!existingSubscription) {
      return null;
    }

    // 2. Merge existing data with requested updates
    const updatedData = {
      ...existingSubscription,
      ...updates,
    };

    // 3. Recalculate renewal date when necessary
    const shouldRecalculate =
      fields.includes("frequency") || fields.includes("start_date");

    if (shouldRecalculate) {
      updatedData.renewal_date = calculateRenewalDate(
        updatedData.start_date,
        updatedData.frequency,
      );
    }

    // 4. Build dynamic UPDATE query
    const values = fields.map((field) => updatedData[field]);

    const setClause = fields
      .map((field, index) => `${field} = $${index + 1}`)
      .join(", ");

    if (shouldRecalculate) {
      values.push(updatedData.renewal_date);
    }

    values.push(id, userId);

    const renewalClause = shouldRecalculate
      ? `renewal_date = $${values.length - 2},`
      : "";

    const updateQuery = `
      UPDATE subscriptions
      SET ${setClause},
          ${renewalClause}
          updated_at = NOW()
      WHERE id = $${values.length - 1}
        AND user_id = $${values.length}
      RETURNING *
    `;

    // 5. Execute update using the same transaction client
    const { rows: updatedRows } = await client.query(
      updateQuery,
      values,
    );

    return updatedRows[0] || null;
  });
};

const cancelSubscription = async (id, userId) => {
  return withTransaction(async (client) => {
    const selectQuery = `
      SELECT *
      FROM subscriptions
      WHERE id = $1 AND user_id = $2
      FOR UPDATE
    `;

    const { rows } = await client.query(selectQuery, [id, userId]);

    const subscription = rows[0];

    if (!subscription) {
      return { status: "not_found" };
    }

    if (subscription.status === "cancelled") {
      return { status: "already_cancelled", subscription };
    }

    if (subscription.status === "expired") {
      return { status: "already_expired", subscription };
    }

    const updateQuery = `
      UPDATE subscriptions
      SET status = 'cancelled',
          updated_at = NOW()
      WHERE id = $1 AND user_id = $2
      RETURNING *
    `;

    const { rows: updatedRows } = await client.query(updateQuery, [
      id,
      userId,
    ]);

    return {
      status: "cancelled",
      subscription: updatedRows[0],
    };
  });
};

export {
  createSubscription,
  findSubscriptionById,
  findSubscriptionsByUserId,
  deleteSubscription,
  updateSubscription,
  cancelSubscription,
};

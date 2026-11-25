import {
  createSubscription as createSubscriptionModel,
  findSubscriptionsByUserId,
  findSubscriptionById,
  deleteSubscription as deleteSubscriptionModel,
  updateSubscription as updateSubscriptionModel,
  cancelSubscription as cancelSubscriptionModel,
} from "../models/subscription.model.js";

// Create subscription
export const createSubscription = async (req, res, next) => {
  try {
    // Validate request body
    if (
      !req.body ||
      typeof req.body !== "object" ||
      Array.isArray(req.body)
    ) {
      return res.status(400).json({
        success: false,
        message: "Request body must be a JSON object",
      });
    }

    // Validate required fields
    const requiredFields = [
      "name",
      "price",
      "frequency",
      "category",
      "paymentMethod",
      "startDate",
    ];

    const missingFields = requiredFields.filter(
      (field) =>
        !Object.hasOwn(req.body, field) ||
        req.body[field] === null ||
        req.body[field] === undefined ||
        req.body[field] === "",
    );

    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Missing required fields: ${missingFields.join(", ")}`,
      });
    }

    // Reject unsupported fields
    const allowedFields = [
      "name",
      "price",
      "currency",
      "frequency",
      "category",
      "paymentMethod",
      "startDate",
    ];

    const invalidFields = Object.keys(req.body).filter(
      (field) => !allowedFields.includes(field),
    );

    if (invalidFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Invalid fields: ${invalidFields.join(", ")}`,
      });
    }

    // Validate subscription name
    if (typeof req.body.name !== "string") {
      return res.status(400).json({
        success: false,
        message: "Subscription name must be a string",
      });
    }

    const name = req.body.name.trim();

    if (name.length < 2 || name.length > 100) {
      return res.status(400).json({
        success: false,
        message: "Subscription name must be between 2 and 100 characters",
      });
    }

    // Validate subscription price
    if (
      (typeof req.body.price !== "number" &&
        typeof req.body.price !== "string") ||
      (typeof req.body.price === "string" &&
        req.body.price.trim() === "")
    ) {
      return res.status(400).json({
        success: false,
        message: "Price must be a valid positive number",
      });
    }

    const priceInput = String(req.body.price).trim();

    if (!/^\d+(\.\d{1,2})?$/.test(priceInput)) {
      return res.status(400).json({
        success: false,
        message: "Price must have at most 2 decimal places",
      });
    }

    const price = Number(priceInput);

    if (!Number.isFinite(price) || price <= 0 || price > 99999999.99) {
      return res.status(400).json({
        success: false,
        message: "Price must be greater than 0 and within the allowed limit",
      });
    }

    // Validate subscription frequency
    const validFrequencies = ["daily", "weekly", "monthly", "yearly"];

    const frequency =
      typeof req.body.frequency === "string"
        ? req.body.frequency.trim()
        : "";

    if (!validFrequencies.includes(frequency)) {
      return res.status(400).json({
        success: false,
        message: "Invalid subscription frequency",
      });
    }

    // Validate subscription currency
    const validCurrencies = ["INR", "USD", "EUR", "GBP"];

    const currency = req.body.currency ?? "INR";

    if (
      typeof currency !== "string" ||
      !validCurrencies.includes(currency.trim())
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid currency",
      });
    }

    // Validate subscription category
    const validCategories = [
      "sports",
      "news",
      "entertainment",
      "lifestyle",
      "technology",
      "finance",
      "politics",
      "other",
    ];

    const category =
      typeof req.body.category === "string"
        ? req.body.category.trim()
        : "";

    if (!validCategories.includes(category)) {
      return res.status(400).json({
        success: false,
        message: "Invalid subscription category",
      });
    }

    // Validate payment method
    if (typeof req.body.paymentMethod !== "string") {
      return res.status(400).json({
        success: false,
        message: "Payment method must be a string",
      });
    }

    const paymentMethod = req.body.paymentMethod.trim();

    if (paymentMethod.length === 0 || paymentMethod.length > 30) {
      return res.status(400).json({
        success: false,
        message: "Payment method must be between 1 and 30 characters",
      });
    }

    // Validate subscription start date
    if (
      typeof req.body.startDate !== "string" ||
      !/^\d{4}-\d{2}-\d{2}$/.test(req.body.startDate)
    ) {
      return res.status(400).json({
        success: false,
        message: "Start date must use YYYY-MM-DD format",
      });
    }

    const [year, month, day] = req.body.startDate.split("-").map(Number);

    const startDate = new Date(Date.UTC(year, month - 1, day));

    const isValidDate =
      startDate.getUTCFullYear() === year &&
      startDate.getUTCMonth() === month - 1 &&
      startDate.getUTCDate() === day;

    if (!isValidDate) {
      return res.status(400).json({
        success: false,
        message: "Invalid start date",
      });
    }

    if (startDate > new Date()) {
      return res.status(400).json({
        success: false,
        message: "Start date cannot be in the future",
      });
    }

    const subscription = await createSubscriptionModel({
      name,
      price,
      currency: currency.trim(),
      frequency,
      category,
      paymentMethod,
      startDate,
      userId: req.user.id,
    });

    res.status(201).json({
      success: true,
      data: subscription,
    });
  } catch (error) {
    next(error);
  }
};

// Get all subscriptions of the authenticated user
export const getUserSubscriptions = async (req, res, next) => {
  try {
    const subscriptions = await findSubscriptionsByUserId(req.user.id);

    res.status(200).json({
      success: true,
      count: subscriptions.length,
      data: subscriptions,
    });
  } catch (error) {
    next(error);
  }
};

// Get a single subscription
export const getSubscriptionById = async (req, res, next) => {
  try {
    const subscription = await findSubscriptionById(req.params.id);

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: "Subscription not found",
      });
    }

    if (subscription.user_id !== req.user.id) {
      return res.status(404).json({
        success: false,
        message: "Subscription not found",
      });
    }

    res.status(200).json({
      success: true,
      data: subscription,
    });
  } catch (error) {
    next(error);
  }
};

// Delete subscription
export const deleteSubscription = async (req, res, next) => {
  try {
    const subscription = await deleteSubscriptionModel(
      req.params.id,
      req.user.id,
    );

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: "Subscription not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Subscription deleted successfully",
      data: subscription,
    });
  } catch (error) {
    next(error);
  }
};

// Update subscription
export const updateSubscription = async (req, res, next) => {
  try {
    const allowedFields = {
      name: "name",
      price: "price",
      currency: "currency",
      frequency: "frequency",
      category: "category",
      paymentMethod: "payment_method",
      startDate: "start_date",
    };

    // 1. Validate request body
    if (
      !req.body ||
      typeof req.body !== "object" ||
      Array.isArray(req.body)
    ) {
      return res.status(400).json({
        success: false,
        message: "Request body must be a JSON object",
      });
    }

    const requestFields = Object.keys(req.body);

    if (requestFields.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Please provide at least one field to update",
      });
    }

    // 2. Reject unsupported fields
    const invalidFields = requestFields.filter(
      (field) => !Object.hasOwn(allowedFields, field),
    );

    if (invalidFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Invalid fields: ${invalidFields.join(", ")}`,
      });
    }

    // 3. Map API fields to database fields
    const updates = {};

    for (const [key, value] of Object.entries(req.body)) {
      updates[allowedFields[key]] = value;
    }

    // 4. Validate name
    if (updates.name !== undefined) {
      if (typeof updates.name !== "string") {
        return res.status(400).json({
          success: false,
          message: "Subscription name must be a string",
        });
      }

      updates.name = updates.name.trim();

      if (!updates.name) {
        return res.status(400).json({
          success: false,
          message: "Subscription name cannot be empty",
        });
      }
    }

    // 5. Validate price
    if (updates.price !== undefined) {
      if (
        (typeof updates.price !== "number" &&
          typeof updates.price !== "string") ||
        (typeof updates.price === "string" &&
          updates.price.trim() === "")
      ) {
        return res.status(400).json({
          success: false,
          message: "Price must be a valid positive number",
        });
      }

      updates.price = Number(updates.price);

      if (!Number.isFinite(updates.price) || updates.price <= 0) {
        return res.status(400).json({
          success: false,
          message: "Price must be a positive number",
        });
      }
    }

    // 6. Validate frequency
    if (updates.frequency !== undefined) {
      const validFrequencies = [
        "daily",
        "weekly",
        "monthly",
        "yearly",
      ];

      if (
        typeof updates.frequency !== "string" ||
        !validFrequencies.includes(updates.frequency)
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid subscription frequency",
        });
      }
    }

    // 7. Validate currency
    const validCurrencies = ["INR", "USD", "EUR", "GBP"];

    if (
      updates.currency !== undefined &&
      (typeof updates.currency !== "string" ||
        !validCurrencies.includes(updates.currency.trim()))
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid currency",
      });
    }

    if (updates.currency !== undefined) {
      updates.currency = updates.currency.trim();
    }

    // 8. Validate category
    const validCategories = [
      "sports",
      "news",
      "entertainment",
      "lifestyle",
      "technology",
      "finance",
      "politics",
      "other",
    ];

    if (
      updates.category !== undefined &&
      (typeof updates.category !== "string" ||
        !validCategories.includes(updates.category.trim()))
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid category",
      });
    }

    if (updates.category !== undefined) {
      updates.category = updates.category.trim();
    }

    // 9. Validate payment method
    if (updates.payment_method !== undefined) {
      if (
        typeof updates.payment_method !== "string" ||
        updates.payment_method.trim().length === 0 ||
        updates.payment_method.trim().length > 30
      ) {
        return res.status(400).json({
          success: false,
          message: "Payment method must be between 1 and 30 characters",
        });
      }

      updates.payment_method = updates.payment_method.trim();
    }

    // 10. Validate start date (YYYY-MM-DD)
    if (updates.start_date !== undefined) {
      if (
        typeof updates.start_date !== "string" ||
        !/^\d{4}-\d{2}-\d{2}$/.test(updates.start_date)
      ) {
        return res.status(400).json({
          success: false,
          message: "Start date must use YYYY-MM-DD format",
        });
      }

      const [year, month, day] = updates.start_date
        .split("-")
        .map(Number);

      const date = new Date(Date.UTC(year, month - 1, day));

      const isValidDate =
        date.getUTCFullYear() === year &&
        date.getUTCMonth() === month - 1 &&
        date.getUTCDate() === day;

      if (!isValidDate) {
        return res.status(400).json({
          success: false,
          message: "Invalid start date",
        });
      }

      updates.start_date = date;
    }

    // 11. Update subscription
    const subscription = await updateSubscriptionModel(
      req.params.id,
      req.user.id,
      updates,
    );

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: "Subscription not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Subscription updated successfully",
      data: subscription,
    });
  } catch (error) {
    next(error);
  }
};

// Cancel subscription
export const cancelSubscription = async (req, res, next) => {
  try {
    const result = await cancelSubscriptionModel(
      req.params.id,
      req.user.id,
    );

    if (result.status === "not_found") {
      return res.status(404).json({
        success: false,
        message: "Subscription not found",
      });
    }

    if (result.status === "already_cancelled") {
      return res.status(409).json({
        success: false,
        message: "Subscription is already cancelled",
      });
    }

    if (result.status === "already_expired") {
      return res.status(409).json({
        success: false,
        message: "Expired subscriptions cannot be cancelled",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Subscription cancelled successfully",
      data: result.subscription,
    });
  } catch (error) {
    next(error);
  }
};

import {
  createSubscription as createSubscriptionModel,
  findSubscriptionsByUserId,
  findSubscriptionById,
  deleteSubscription as deleteSubscriptionModel,
  updateSubscription as updateSubscriptionModel,
} from "../models/subscription.model.js";

// Create subscription
export const createSubscription = async (req, res, next) => {
  try {
    const subscription = await createSubscriptionModel({
      ...req.body,
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
      return res.status(403).json({
        success: false,
        message: "You are not authorized to access this subscription",
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

    // 7. Validate other string fields
    const stringFields = [
      "currency",
      "category",
      "payment_method",
    ];

    for (const field of stringFields) {
      if (updates[field] !== undefined) {
        if (
          typeof updates[field] !== "string" ||
          !updates[field].trim()
        ) {
          return res.status(400).json({
            success: false,
            message: `${field} must be a non-empty string`,
          });
        }

        updates[field] = updates[field].trim();
      }
    }

    // 8. Validate start date (YYYY-MM-DD)
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

    // 9. Update subscription
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

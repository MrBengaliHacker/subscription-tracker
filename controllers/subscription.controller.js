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

    const requestFields = Object.keys(req.body);

    if (requestFields.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Please provide at least one field to update",
      });
    }

    const invalidFields = requestFields.filter(
      (field) => !Object.hasOwn(allowedFields, field)
    );

    if (invalidFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Invalid fields: ${invalidFields.join(", ")}`,
      });
    }

    const updates = {};

    for (const [key, value] of Object.entries(req.body)) {
      updates[allowedFields[key]] = value;
    }

    if (updates.name !== undefined) {
      updates.name = updates.name.trim();

      if (!updates.name) {
        return res.status(400).json({
          success: false,
          message: "Subscription name cannot be empty",
        });
      }
    }

    if (updates.price !== undefined) {
      updates.price = Number(updates.price);

      if (!Number.isFinite(updates.price) || updates.price <= 0) {
        return res.status(400).json({
          success: false,
          message: "Price must be a positive number",
        });
      }
    }

    if (updates.frequency !== undefined) {
      const validFrequencies = ["daily", "weekly", "monthly", "yearly"];

      if (!validFrequencies.includes(updates.frequency)) {
        return res.status(400).json({
          success: false,
          message: "Invalid subscription frequency",
        });
      }
    }

    if (updates.start_date !== undefined) {
      const date = new Date(updates.start_date);

      if (Number.isNaN(date.getTime())) {
        return res.status(400).json({
          success: false,
          message: "Invalid start date",
        });
      }

      updates.start_date = date;
    }

    const subscription = await updateSubscriptionModel(
      req.params.id,
      req.user.id,
      updates
    );

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: "Subscription not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Subscription updated successfully",
      data: subscription,
    });
  } catch (error) {
    next(error);
  }
};

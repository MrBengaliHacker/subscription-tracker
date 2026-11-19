const errorMiddleware = (err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }

  console.error(err);

  let statusCode = err.statusCode || 500;
  let message = err.statusCode && err.message
    ? err.message
    : "Internal Server Error";

  // PostgreSQL unique violation
  if (err.code === "23505") {
    statusCode = 409;
    message =
      err.constraint === "users_email_key"
        ? "Email already registered"
        : "Resource already exists";
  }

  // PostgreSQL not-null violation
  if (err.code === "23502") {
    statusCode = 400;
    message = err.column
      ? `${err.column} is required`
      : "Missing required field";
  }

  // PostgreSQL foreign key violation
  if (err.code === "23503") {
    statusCode = 400;
    message = "Invalid reference";
  }

  // PostgreSQL check constraint violation
  if (err.code === "23514") {
    statusCode = 400;
    message = "Invalid data provided";
  }

  // Invalid UUID, number, or date/timestamp format
  if (err.code === "22P02" || err.code === "22007" || err.code === "22008") {
    statusCode = 400;
    message = "Invalid input format";
  }

  res.status(statusCode).json({
    message,
  });
};

export default errorMiddleware;
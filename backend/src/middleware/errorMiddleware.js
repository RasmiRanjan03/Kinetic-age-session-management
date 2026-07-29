// Global error handling middleware

export const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

export const errorHandler = (err, req, res, next) => {
  console.error('API Error:', err);
  let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  let message = err.message;

  // Handle Mongoose Validation Errors
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = Object.values(err.errors).map((val) => val.message).join(', ');
  }

  // Handle Mongoose Duplicate Key Errors (e.g. unique email collisions)
  if (err.code === 11000) {
    statusCode = 409;
    message = 'A duplicate database record was detected';
    if (err.keyValue && err.keyValue.email) {
      message = 'A client or user account with this email address already exists';
    }
  }

  // Handle Mongoose CastError (e.g. invalid MongoDB Object ID format)
  if (err.name === 'CastError') {
    statusCode = 404;
    message = 'Resource not found';
  }

  res.status(statusCode).json({
    success: false,
    message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
};

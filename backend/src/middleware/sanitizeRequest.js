/**
 * Middleware to trim whitespace and sanitize all string inputs in req.body
 * by removing HTML brackets/tags to prevent HTML/XSS injection.
 */
export const sanitizeRequest = (req, res, next) => {
  if (req.body) {
    Object.keys(req.body).forEach((key) => {
      if (typeof req.body[key] === 'string') {
        // Trim whitespace
        req.body[key] = req.body[key].trim();
        
        // Strip HTML / script tags (strip anything matching <something>)
        req.body[key] = req.body[key].replace(/<[^>]*>/g, '');
      }
    });
  }
  next();
};

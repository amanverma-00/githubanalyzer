/**
 * Wraps an async route handler so that any rejected promise is forwarded
 * to Express's next(err) error-handling middleware — no try/catch needed.
 *
 * @param {Function} fn - async (req, res, next) route handler
 * @returns {Function} wrapped handler
 */
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

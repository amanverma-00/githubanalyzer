/**
 * Send a successful JSON response.
 */
export function sendSuccess(res, data, message = 'Success', statusCode = 200) {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
}

/**
 * Send a paginated JSON response.
 */
export function sendPaginated(res, { data, total, page, limit }) {
  return res.status(200).json({
    success: true,
    message: 'Success',
    data,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasNext: page * limit < total,
      hasPrev: page > 1,
    },
  });
}

/**
 * Send an error JSON response.
 */
export function sendError(res, message = 'Internal Server Error', statusCode = 500, details = null) {
  const body = { success: false, message };
  if (details) body.details = details;
  return res.status(statusCode).json(body);
}

import { sendError } from '../utils/response.js';

// GitHub username: 1-39 chars, alphanumeric + hyphens, no leading/trailing hyphens
const GITHUB_USERNAME_REGEX = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,37}[a-zA-Z0-9])?$/;

/**
 * Middleware that validates :username param against GitHub's username rules.
 */
export function validateUsername(req, res, next) {
  const { username } = req.params;

  if (!username) {
    return sendError(res, 'Username is required', 400);
  }

  if (!GITHUB_USERNAME_REGEX.test(username)) {
    return sendError(
      res,
      'Invalid GitHub username. Must be 1-39 characters, alphanumeric or hyphens, and cannot start or end with a hyphen.',
      400,
    );
  }

  next();
}

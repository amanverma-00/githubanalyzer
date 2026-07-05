import { analyzeGitHubUser } from '../services/github.service.js';
import * as ProfileModel from '../models/profile.model.js';
import { sendSuccess, sendPaginated, sendError } from '../utils/response.js';

// ─── POST /api/github/analyze/:username ─────────────────────────────────────
/**
 * Fetch data from GitHub API, compute insights, and store/update in MySQL.
 */
export async function analyzeProfile(req, res) {
  const { username } = req.params;

  const data = await analyzeGitHubUser(username);
  const profile = await ProfileModel.upsert(data);

  return sendSuccess(
    res,
    profile,
    `Profile for "${username}" analyzed and stored successfully`,
    201,
  );
}

// ─── GET /api/github/profiles ────────────────────────────────────────────────
/**
 * List all analyzed profiles with pagination and optional search.
 * Query params: page (default 1), limit (default 10, max 100), search (username/name)
 */
export async function listProfiles(req, res) {
  const page  = Math.max(1, parseInt(req.query.page  ?? 1,  10));
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit ?? 10, 10)));
  const search = (req.query.search ?? '').trim();

  const { rows, total } = await ProfileModel.findAll({ page, limit, search });

  return sendPaginated(res, { data: rows, total, page, limit });
}

// ─── GET /api/github/profiles/:username ──────────────────────────────────────
/**
 * Retrieve a single analyzed profile from the database by username.
 */
export async function getProfile(req, res) {
  const { username } = req.params;

  const profile = await ProfileModel.findByUsername(username);

  if (!profile) {
    return sendError(
      res,
      `Profile for "${username}" not found. Use POST /api/github/analyze/${username} to analyze it first.`,
      404,
    );
  }

  return sendSuccess(res, profile);
}

// ─── GET /api/github/profiles/:username/refresh ──────────────────────────────
/**
 * Re-fetch the latest data from GitHub and update the stored profile.
 */
export async function refreshProfile(req, res) {
  const { username } = req.params;

  // Check it exists first so we give a meaningful error
  const existing = await ProfileModel.findByUsername(username);
  if (!existing) {
    return sendError(
      res,
      `Profile for "${username}" has not been analyzed yet. Use POST /api/github/analyze/${username} first.`,
      404,
    );
  }

  const data    = await analyzeGitHubUser(username);
  const profile = await ProfileModel.upsert(data);

  return sendSuccess(res, profile, `Profile for "${username}" refreshed successfully`);
}

// ─── DELETE /api/github/profiles/:username ───────────────────────────────────
/**
 * Remove a stored profile from the database.
 */
export async function deleteProfile(req, res) {
  const { username } = req.params;

  const deleted = await ProfileModel.deleteByUsername(username);

  if (!deleted) {
    return sendError(res, `Profile for "${username}" not found`, 404);
  }

  return sendSuccess(res, null, `Profile for "${username}" deleted successfully`);
}

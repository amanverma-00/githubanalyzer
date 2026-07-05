import { Router } from 'express';
import {
  analyzeProfile,
  listProfiles,
  getProfile,
  refreshProfile,
  deleteProfile,
} from '../controllers/github.controller.js';
import { validateUsername } from '../middleware/validateUsername.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

/**
 * POST   /api/github/analyze/:username     — Analyze & store a GitHub profile
 * GET    /api/github/profiles              — List all stored profiles (paginated)
 * GET    /api/github/profiles/:username    — Get a single profile from DB
 * GET    /api/github/profiles/:username/refresh  — Re-fetch & update from GitHub
 * DELETE /api/github/profiles/:username    — Delete a stored profile
 */

router.post('/analyze/:username', validateUsername, asyncHandler(analyzeProfile));

router.get('/profiles', asyncHandler(listProfiles));

router.get('/profiles/:username/refresh', validateUsername, asyncHandler(refreshProfile));

router.get('/profiles/:username', validateUsername, asyncHandler(getProfile));

router.delete('/profiles/:username', validateUsername, asyncHandler(deleteProfile));

export default router;

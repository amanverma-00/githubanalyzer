import { getPool } from '../config/db.js';

/**
 * Parse top_languages from JSON string to array (MySQL stores JSON as string in some drivers).
 */
function parseProfile(row) {
  if (!row) return null;
  return {
    ...row,
    top_languages:
      typeof row.top_languages === 'string'
        ? JSON.parse(row.top_languages)
        : row.top_languages ?? [],
  };
}

/**
 * Find all stored profiles with optional pagination and search.
 * @param {{ page?: number, limit?: number, search?: string }} options
 * @returns {{ rows: Array, total: number }}
 */
export async function findAll({ page = 1, limit = 10, search = '' } = {}) {
  const db = getPool();
  const offset = (page - 1) * limit;
  const likeTerm = `%${search}%`;

  const [rows] = await db.query(
    `SELECT * FROM github_profiles
      WHERE username LIKE ? OR name LIKE ?
      ORDER BY analyzed_at DESC
      LIMIT ? OFFSET ?`,
    [likeTerm, likeTerm, limit, offset],
  );

  const [[{ total }]] = await db.query(
    `SELECT COUNT(*) AS total FROM github_profiles
      WHERE username LIKE ? OR name LIKE ?`,
    [likeTerm, likeTerm],
  );

  return { rows: rows.map(parseProfile), total };
}

/**
 * Find a single profile by username (case-insensitive).
 * @param {string} username
 * @returns {Object|null}
 */
export async function findByUsername(username) {
  const db = getPool();
  const [rows] = await db.query(
    'SELECT * FROM github_profiles WHERE username = ?',
    [username.toLowerCase()],
  );
  return parseProfile(rows[0] ?? null);
}

/**
 * Insert or update a profile row.
 * Uses MySQL's ON DUPLICATE KEY UPDATE to handle re-analysis gracefully.
 * @param {Object} data - normalized profile object from github.service.js
 * @returns {Object} the upserted row
 */
export async function upsert(data) {
  const db = getPool();

  const columns = Object.keys(data);
  const values  = Object.values(data);
  const placeholders = columns.map(() => '?').join(', ');
  const updates = columns
    .filter((c) => c !== 'username')
    .map((c) => `${c} = VALUES(${c})`)
    .join(', ');

  await db.query(
    `INSERT INTO github_profiles (${columns.join(', ')})
     VALUES (${placeholders})
     ON DUPLICATE KEY UPDATE ${updates}`,
    values,
  );

  return findByUsername(data.username);
}

/**
 * Delete a profile by username.
 * @param {string} username
 * @returns {boolean} true if a row was deleted
 */
export async function deleteByUsername(username) {
  const db = getPool();
  const [result] = await db.query(
    'DELETE FROM github_profiles WHERE username = ?',
    [username.toLowerCase()],
  );
  return result.affectedRows > 0;
}

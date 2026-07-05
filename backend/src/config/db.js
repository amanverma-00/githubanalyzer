import mysql from 'mysql2/promise';

let pool;

/**
 * Returns the shared MySQL connection pool, creating it on first call.
 */
export function getPool() {
  if (!pool) {
    pool = mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      port: Number(process.env.DB_PORT) || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'github_analyzer',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    });
  }
  return pool;
}

/**
 * Verifies the DB connection, auto-creates the database, and auto-creates the schema table if needed.
 */
export async function initDb() {
  const host = process.env.DB_HOST || 'localhost';
  const port = Number(process.env.DB_PORT) || 3306;
  const user = process.env.DB_USER || 'root';
  const password = process.env.DB_PASSWORD || '';
  const dbName = process.env.DB_NAME || 'github_analyzer';

  // 1. Establish a temporary connection without a database to create the database if it doesn't exist
  const tempConnection = await mysql.createConnection({
    host,
    port,
    user,
    password,
  });
  await tempConnection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
  await tempConnection.end();

  // 2. Initialize and verify the main connection pool
  const db = getPool();
  const conn = await db.getConnection();
  console.log(`✅ MySQL connected to database "${dbName}"`);
  conn.release();

  // 3. Auto-create the profiles table
  await db.query(`
    CREATE TABLE IF NOT EXISTS github_profiles (
      id                INT AUTO_INCREMENT PRIMARY KEY,
      username          VARCHAR(100) NOT NULL UNIQUE,
      name              VARCHAR(255),
      bio               TEXT,
      avatar_url        VARCHAR(512),
      profile_url       VARCHAR(512),
      company           VARCHAR(255),
      location          VARCHAR(255),
      blog              VARCHAR(512),
      email             VARCHAR(255),
      twitter_username  VARCHAR(100),
      public_repos      INT DEFAULT 0,
      public_gists      INT DEFAULT 0,
      followers         INT DEFAULT 0,
      following         INT DEFAULT 0,
      top_languages     JSON,
      most_starred_repo VARCHAR(255),
      total_stars       INT DEFAULT 0,
      total_forks       INT DEFAULT 0,
      account_age_days  INT,
      is_hireable       BOOLEAN,
      analyzed_at       DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at        DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);
  console.log('✅ Schema ready (github_profiles table)');
}
-- ============================================================
-- GitHub Profile Analyzer — Database Schema
-- ============================================================
-- Run this file manually OR let the server auto-create the table on startup.
--
-- CREATE DATABASE IF NOT EXISTS github_analyzer;
-- USE github_analyzer;

CREATE TABLE IF NOT EXISTS github_profiles (
  id                INT AUTO_INCREMENT PRIMARY KEY,

  -- Core identity
  username          VARCHAR(100)  NOT NULL UNIQUE,
  name              VARCHAR(255),
  bio               TEXT,
  avatar_url        VARCHAR(512),
  profile_url       VARCHAR(512),

  -- Contact / social
  company           VARCHAR(255),
  location          VARCHAR(255),
  blog              VARCHAR(512),
  email             VARCHAR(255),
  twitter_username  VARCHAR(100),

  -- GitHub statistics
  public_repos      INT     DEFAULT 0,
  public_gists      INT     DEFAULT 0,
  followers         INT     DEFAULT 0,
  following         INT     DEFAULT 0,

  -- Computed / derived insights
  top_languages     JSON,           -- Array of top-3 programming languages across repos
  most_starred_repo VARCHAR(255),   -- Name of the most-starred public repository
  total_stars       INT     DEFAULT 0,  -- Sum of stargazers across all public repos
  total_forks       INT     DEFAULT 0,  -- Sum of forks across all public repos
  account_age_days  INT,            -- Days since GitHub account was created
  is_hireable       BOOLEAN,

  -- Metadata
  analyzed_at       DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at        DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

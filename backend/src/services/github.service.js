import axios from 'axios';

const GITHUB_API_BASE = 'https://api.github.com';

/**
 * Build Axios headers — include auth token if provided to avoid rate limiting.
 */
function buildHeaders() {
  const headers = {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  };
  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }
  return headers;
}

/**
 * Fetch the public user profile from GitHub.
 * @param {string} username
 * @returns {Object} GitHub user object
 * @throws {Error} with status 404 if user not found, or 403 for rate limit
 */
export async function fetchGitHubProfile(username) {
  try {
    const { data } = await axios.get(`${GITHUB_API_BASE}/users/${username}`, {
      headers: buildHeaders(),
    });
    return data;
  } catch (err) {
    if (err.response?.status === 404) {
      const error = new Error(`GitHub user "${username}" not found`);
      error.status = 404;
      throw error;
    }
    if (err.response?.status === 403) {
      const error = new Error(
        'GitHub API rate limit exceeded. Add a GITHUB_TOKEN to your .env to increase the limit.',
      );
      error.status = 429;
      throw error;
    }
    throw err;
  }
}

/**
 * Fetch all public repositories for a user (up to 500 via pagination).
 * @param {string} username
 * @returns {Array} list of repo objects
 */
async function fetchAllRepos(username) {
  const repos = [];
  let page = 1;
  const perPage = 100;

  while (true) {
    const { data } = await axios.get(
      `${GITHUB_API_BASE}/users/${username}/repos`,
      {
        headers: buildHeaders(),
        params: { per_page: perPage, page, sort: 'updated', type: 'public' },
      },
    );
    repos.push(...data);
    if (data.length < perPage) break; // last page
    if (repos.length >= 500) break;  // safety cap
    page++;
  }

  return repos;
}

/**
 * Derive aggregate insights from a list of repo objects.
 * @param {Array} repos
 * @returns {{ topLanguages: string[], mostStarredRepo: string|null, totalStars: number, totalForks: number }}
 */
function computeRepoInsights(repos) {
  const langCount = {};
  let totalStars = 0;
  let totalForks = 0;
  let mostStarredRepo = null;
  let maxStars = -1;

  for (const repo of repos) {
    if (repo.fork) continue; // skip forks — count only original work

    totalStars += repo.stargazers_count ?? 0;
    totalForks += repo.forks_count ?? 0;

    if ((repo.stargazers_count ?? 0) > maxStars) {
      maxStars = repo.stargazers_count;
      mostStarredRepo = repo.full_name;
    }

    if (repo.language) {
      langCount[repo.language] = (langCount[repo.language] ?? 0) + 1;
    }
  }

  // Top 3 languages sorted by frequency
  const topLanguages = Object.entries(langCount)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([lang]) => lang);

  return { topLanguages, mostStarredRepo, totalStars, totalForks };
}

/**
 * Master function: fetch profile + repos + compute insights.
 * @param {string} username
 * @returns {Object} combined, normalized profile data ready for DB upsert
 */
export async function analyzeGitHubUser(username) {
  const [profile, repos] = await Promise.all([
    fetchGitHubProfile(username),
    fetchAllRepos(username),
  ]);

  const { topLanguages, mostStarredRepo, totalStars, totalForks } =
    computeRepoInsights(repos);

  const createdAt = new Date(profile.created_at);
  const accountAgeDays = Math.floor(
    (Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24),
  );

  return {
    username:          profile.login,
    name:              profile.name   ?? null,
    bio:               profile.bio    ?? null,
    avatar_url:        profile.avatar_url ?? null,
    profile_url:       profile.html_url  ?? null,
    company:           profile.company   ?? null,
    location:          profile.location  ?? null,
    blog:              profile.blog      ?? null,
    email:             profile.email     ?? null,
    twitter_username:  profile.twitter_username ?? null,
    public_repos:      profile.public_repos     ?? 0,
    public_gists:      profile.public_gists     ?? 0,
    followers:         profile.followers        ?? 0,
    following:         profile.following        ?? 0,
    top_languages:     JSON.stringify(topLanguages),
    most_starred_repo: mostStarredRepo,
    total_stars:       totalStars,
    total_forks:       totalForks,
    account_age_days:  accountAgeDays,
    is_hireable:       profile.hireable ?? null,
  };
}

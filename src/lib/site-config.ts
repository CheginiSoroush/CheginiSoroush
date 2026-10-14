/**
 * Single source of truth for the site's stable identity — every external
 * link shown in the UI (footer, hero, about, contact, SEO metadata) reads
 * from here so nothing can drift out of sync.
 *
 * تغییر هندل‌ها و لینک‌ها فقط از همین فایل انجام می‌شود.
 */

/** GitHub owner handle — also used by the API routes (/api/github, /api/repos). */
export const GITHUB_HANDLE = "CheginiSoroush";

/** Public GitHub profile URL. */
export const GITHUB_PROFILE_URL = `https://github.com/${GITHUB_HANDLE}`;

/** Contact email shown in footer / about / contact sections. */
export const CONTACT_EMAIL = "imsoroushchegini@gmail.com";

/** Prebuilt `mailto:` link for CONTACT_EMAIL. */
export const CONTACT_EMAIL_URL = `mailto:${CONTACT_EMAIL}`;

/**
 * LinkedIn profile URL — `null` until the owner actually creates the profile
 * (user confirmed on 2025 that no LinkedIn account exists yet; the previous
 * handle "imsoroush" was a guess and must not ship as a live link).
 *
 * وقتی پروفایل لینکدین ساخته شد، فقط همین‌جا آدرس را قرار بده؛
 * دکمه‌ی فوتر به‌صورت خودکار از حالت «به‌زودی» فعال می‌شود. مثال:
 *   linkedinUrl: "https://www.linkedin.com/in/<handle>"
 */
export const LINKEDIN_URL: string | null = null;

/**
 * Build a repository URL from a full "owner/name" string
 * (the shape stored in Project.repo / GitHub API full_name).
 */
export const repoUrl = (repo: string) => `https://github.com/${repo}`;

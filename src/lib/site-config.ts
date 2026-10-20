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
 * LinkedIn profile URL (owner-provided handle: soroushchegini).
 * The footer button and the contact card both read this — when it is
 * `null` the footer falls back to a disabled "soon" placeholder.
 *
 * دکمه‌ی فوتر و کارت بخش تماس از همین‌جا می‌خوانند؛ اگر خالی شود
 * فوتر به‌صورت خودکار به حالت غیرفعال «به‌زودی» برمی‌گردد.
 */
export const LINKEDIN_URL = "https://www.linkedin.com/in/soroushchegini";

/**
 * Build a repository URL from a full "owner/name" string
 * (the shape stored in Project.repo / GitHub API full_name).
 */
export const repoUrl = (repo: string) => `https://github.com/${repo}`;

"use strict";

const { createHash, sign, timingSafeEqual } = require("node:crypto");
const sources = require("../article-sources.json");
const { updatePage } = require("../lib/google-doc-sync.js");

const origins = new Set([
  "https://davidcrispell.github.io",
  "https://davidcrispell-website.vercel.app"
]);
const tokenUrl = "https://oauth2.googleapis.com/token";
const githubApi = "https://api.github.com/repos/davidcrispell/davidcrispell.github.io/contents/";
const branch = "main";

class RefreshError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

function passwordMatches(input, expected) {
  const digest = (value) => createHash("sha256").update(value).digest();
  return timingSafeEqual(digest(input), digest(expected));
}

async function request(url, options, errorMessage) {
  try {
    return await fetch(url, { ...options, redirect: "error", signal: AbortSignal.timeout(8000) });
  } catch {
    throw new RefreshError(502, errorMessage);
  }
}

async function readGoogleDoc(source, configuredAccount) {
  let assertion;
  try {
    const { client_email: email, private_key: key } = JSON.parse(configuredAccount);
    if (typeof email !== "string" || !email || typeof key !== "string" || !key) {
      throw new Error();
    }
    const jwtPart = (object) => Buffer.from(JSON.stringify(object)).toString("base64url");
    const header = jwtPart({ alg: "RS256", typ: "JWT" });
    const iat = Math.floor(Date.now() / 1000);
    const payload = jwtPart({
      iss: email,
      scope: "https://www.googleapis.com/auth/documents.readonly",
      aud: tokenUrl,
      iat,
      exp: iat + 300
    });
    const unsigned = `${header}.${payload}`;
    assertion = `${unsigned}.${sign("RSA-SHA256", Buffer.from(unsigned), key).toString("base64url")}`;
  } catch {
    throw new RefreshError(503, "The Google Docs connection is not configured correctly.");
  }

  const tokenError = "Google Docs authentication failed.";
  const tokenResponse = await request(tokenUrl, {
    method: "POST",
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion
    })
  }, tokenError);
  if (!tokenResponse.ok) throw new RefreshError(502, tokenError);
  const token = (await tokenResponse.json()).access_token;
  if (typeof token !== "string" || !token) throw new RefreshError(502, tokenError);

  const docUrl = `https://docs.googleapis.com/v1/documents/${source.document_id}` +
    "?includeTabsContent=true&suggestionsViewMode=PREVIEW_WITHOUT_SUGGESTIONS";
  const readError = "Google Docs could not be reached. Try again in a moment.";
  const docResponse = await request(docUrl, { headers: { Authorization: `Bearer ${token}` } }, readError);
  if (docResponse.status === 403 || docResponse.status === 404) {
    throw new RefreshError(502, "Google Docs could not open the source. Check that the sync account has Viewer access.");
  }
  if (!docResponse.ok) throw new RefreshError(502, readError);
  return docResponse.json();
}

function gitHubHeaders(token) {
  return {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "Content-Type": "application/json"
  };
}

async function refresh(page, entry, googleAccount, githubToken) {
  const file = page.split("#")[0];
  if (!/^[a-z0-9-]+\.html$/.test(file) || entry.source?.type !== "google-doc" ||
      !/^[a-zA-Z0-9_-]+$/.test(entry.source.document_id ?? "") || !entry.sync) {
    throw new RefreshError(503, "The page’s Google Docs source is not configured correctly.");
  }

  const contentUrl = `${githubApi}${encodeURIComponent(file)}`;
  const headers = gitHubHeaders(githubToken);
  const fetchError = "The current website page could not be read from GitHub.";
  const [pageResponse, document] = await Promise.all([
    request(`${contentUrl}?ref=${branch}`, { headers }, fetchError),
    readGoogleDoc(entry.source, googleAccount)
  ]);
  if (!pageResponse.ok) throw new RefreshError(502, fetchError);
  const current = await pageResponse.json();
  if (current.encoding !== "base64" || typeof current.content !== "string" || typeof current.sha !== "string") {
    throw new RefreshError(502, fetchError);
  }

  const before = Buffer.from(current.content, "base64").toString("utf8");
  let after;
  try {
    after = updatePage(before, document, entry.source, entry.sync);
  } catch (error) {
    throw new RefreshError(422, error.message);
  }
  if (before === after) return { status: "unchanged" };

  const saveError = "GitHub could not save the refreshed page. Check the sync account’s repository access.";
  const saved = await request(contentUrl, {
    method: "PUT",
    headers,
    body: JSON.stringify({
      message: `Refresh Google Doc for ${file}`,
      content: Buffer.from(after).toString("base64"),
      sha: current.sha,
      branch
    })
  }, saveError);
  if (saved.status === 409 || saved.status === 422) {
    throw new RefreshError(409, "The website page changed during refresh. Try again.");
  }
  if (!saved.ok) throw new RefreshError(502, saveError);
  return { status: "updated" };
}

module.exports = async function refreshDocument(req, res) {
  const origin = req.headers.origin;
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Vary", "Origin");
  if (!origins.has(origin) && !(req.method === "GET" && !origin)) {
    return res.status(403).json({ error: "Open the published website to refresh this document." });
  }
  if (origin) res.setHeader("Access-Control-Allow-Origin", origin);
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(204).end();

  const {
    DOC_SYNC_ADMIN_PASSWORD: adminPassword,
    DOC_SYNC_GOOGLE_SERVICE_ACCOUNT: googleAccount,
    DOC_SYNC_GITHUB_TOKEN: githubToken
  } = process.env;
  if (req.method === "GET") {
    if (!adminPassword || !googleAccount || !githubToken) {
      return res.status(503).json({ error: "Google Docs refresh is not configured yet." });
    }
    return res.status(200).json({ status: "ready" });
  }
  if (req.method !== "POST") {
    res.setHeader("Allow", "GET, POST, OPTIONS");
    return res.status(405).json({ error: "Use POST to refresh a Google Doc." });
  }

  const contentType = req.headers["content-type"]?.split(";")[0].trim().toLowerCase();
  if (contentType !== "application/json") {
    return res.status(415).json({ error: "Send the page and password as JSON." });
  }
  const { page, password } = req.body ?? {};
  if (typeof page !== "string" || page.length > 120 || typeof password !== "string" ||
      !password || password.length > 256) {
    return res.status(400).json({ error: "Enter the admin password for this page." });
  }

  if (!adminPassword) return res.status(503).json({ error: "Google Docs refresh is not configured yet." });
  if (!passwordMatches(password, adminPassword)) return res.status(401).json({ error: "Incorrect admin password." });
  if (!googleAccount || !githubToken) {
    return res.status(503).json({ error: "The Google Docs and GitHub connections are not configured yet." });
  }

  const entry = Object.hasOwn(sources.articles ?? {}, page) ? sources.articles[page] :
    Object.hasOwn(sources.pages ?? {}, page) ? sources.pages[page] : undefined;
  if (!entry) return res.status(404).json({ error: "This page has no Google Doc source." });

  try {
    return res.status(200).json(await refresh(page, entry, googleAccount, githubToken));
  } catch (error) {
    if (error instanceof RefreshError) {
      return res.status(error.status).json({ error: error.message });
    }
    return res.status(502).json({ error: "The document could not be refreshed. Try again in a moment." });
  }
};

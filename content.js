// Content script for extracting links from Telegram pages

const STORAGE_KEY = "telegram_stream_links";
const seenLinks = new Set();

/**
 * Validate URL and block obvious junk domains
 */
function isValidLink(urlString) {
  try {
    const url = new URL(urlString);
    const hostname = url.hostname.toLowerCase();

    const blockedDomains = [
      "t.me",
      "telegram.org",
      "x.com",
      "twitter.com",
      "instagram.com",
      "facebook.com",
      "youtube.com",
    ];

    return !blockedDomains.some((domain) =>
      hostname.includes(domain)
    );
  } catch (err) {
    return false;
  }
}

/**
 * Clean and normalize URL
 */
function cleanUrl(url) {
  if (!url) return null;

  try {
    let cleanedUrl = url.trim();

    if (
      !cleanedUrl.startsWith("http://") &&
      !cleanedUrl.startsWith("https://")
    ) {
      cleanedUrl = "https://" + cleanedUrl;
    }

    new URL(cleanedUrl);
    return cleanedUrl;
  } catch (e) {
    return null;
  }
}

/**
 * Save link to chrome storage (with dedupe against storage)
 */
function saveToStorage(url) {
  chrome.storage.local.get([STORAGE_KEY], (result) => {
    const links = result[STORAGE_KEY] || [];

    if (links.some((link) => link.url === url)) {
      return;
    }

    links.push({
      url,
      sport: "Other",
      description: "Extracted from Telegram",
      timestamp: new Date().toISOString(),
      source: "auto",
    });

    chrome.storage.local.set({ [STORAGE_KEY]: links });
  });
}

/**
 * Seed already stored links into in-memory Set
 */
function seedSeenLinks() {
  chrome.storage.local.get([STORAGE_KEY], (result) => {
    const links = result[STORAGE_KEY] || [];

    for (const link of links) {
      if (link.url) {
        seenLinks.add(link.url);
      }
    }
  });
}

/**
 * Save link safely with in-memory dedupe
 */
function saveLink(url) {
  const cleanedUrl = cleanUrl(url);

  if (!cleanedUrl) return;
  if (seenLinks.has(cleanedUrl)) return;

  seenLinks.add(cleanedUrl);
  saveToStorage(cleanedUrl);
}

/**
 * Scan entire visible page for URLs
 */
function scanEntirePage() {
  const pageText = document.body.innerText;

  const urlRegex = /https?:\/\/[^\s]+/g;
  const matches = pageText.match(urlRegex);

  if (!matches) return;

  matches.forEach((url) => {
    if (isValidLink(url)) {
      saveLink(url);
    }
  });
}

/**
 * Auto-monitor DOM changes
 */
const observer = new MutationObserver(() => {
  scanEntirePage();
});

observer.observe(document.body, {
  childList: true,
  subtree: true,
});

/**
 * Listen for manual extract button
 */
chrome.runtime.onMessage.addListener((request) => {
  if (request.action === "extractLinks") {
    scanEntirePage();
  }
});

/**
 * Initialize
 */
seedSeenLinks();
scanEntirePage();

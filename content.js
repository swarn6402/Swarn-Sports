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
 * Save link safely with in-memory dedupe and return the normalized URL.
 */
function saveLink(url) {
  const cleanedUrl = cleanUrl(url);

  if (!cleanedUrl) return null;
  if (seenLinks.has(cleanedUrl)) return null;

  seenLinks.add(cleanedUrl);
  saveToStorage(cleanedUrl);
  return cleanedUrl;
}

/**
 * Scan entire visible page for URLs and return newly saved links.
 */
function scanEntirePage() {
  const pageText = document.body.innerText;
  const urlRegex = /https?:\/\/[^\s]+/g;
  const matches = pageText.match(urlRegex);
  const newlySavedLinks = [];

  if (!matches) return newlySavedLinks;

  matches.forEach((url) => {
    if (isValidLink(url)) {
      const saved = saveLink(url);
      if (saved) {
        newlySavedLinks.push(saved);
      }
    }
  });

  return newlySavedLinks;
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
 * Listen for messages from popup.js and respond with results.
 */
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log("[content] Message received:", request);

  if (request.action === "extractLinks") {
    const newLinks = scanEntirePage();
    console.log("[content] Extracted links:", newLinks);
    sendResponse({
      success: true,
      links: newLinks,
      total: seenLinks.size,
      receivedPayload: request.payload || null,
    });
    return true;
  }

  if (request.action === "ping") {
    sendResponse({
      success: true,
      pong: true,
      echo: request.payload || null,
    });
    return true;
  }

  sendResponse({ success: false, message: "Unknown action" });
  return true;
});

/**
 * Initialize
 */
console.log("[content] Content script initialized on:", window.location.href);
seedSeenLinks();
scanEntirePage();

// Content script for extracting links from Telegram pages

const STORAGE_KEY = "telegram_stream_links";
const seenLinks = new Set();

/**
 * Check if a URL matches streaming patterns
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

    return !blockedDomains.some((domain) => hostname.includes(domain));
  } catch (err) {
    return false;
  }
}

/**
 * Validate and clean URL
 */
function cleanUrl(url) {
  if (!url) return null;

  try {
    // Remove common tracking parameters and whitespace
    let cleanedUrl = url.trim();

    // If doesn't start with protocol, add https://
    if (
      !cleanedUrl.startsWith("http://") &&
      !cleanedUrl.startsWith("https://")
    ) {
      cleanedUrl = "https://" + cleanedUrl;
    }

    // Validate URL format
    new URL(cleanedUrl);
    return cleanedUrl;
  } catch (e) {
    return null;
  }
}

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

function seedSeenLinks() {
  chrome.storage.local.get([STORAGE_KEY], (result) => {
    const links = result[STORAGE_KEY] || [];
    for (const link of links) {
      if (link.url) {
        seenLinks.add(link.url);
      }
      seenLinks.add(cleanedUrl);
      saveToStorage(cleanedUrl, text);
    }
  });
}

function saveLink(url) {
  const cleanedUrl = cleanUrl(url);
  if (!cleanedUrl || seenLinks.has(cleanedUrl)) {
    return;
  }
  seenLinks.add(cleanedUrl);
  saveToStorage(cleanedUrl);
}

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

const observer = new MutationObserver(() => {
  scanEntirePage();
});

observer.observe(document.body, {
  childList: true,
  subtree: true,
});

chrome.runtime.onMessage.addListener((request) => {
  if (request.action === "extractLinks") {
    scanEntirePage();
  }
});

// Seed previously stored links into memory
seedSeenLinks();

// Initial scan when content script loads
scanEntirePage();

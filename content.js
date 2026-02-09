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

    if (blockedDomains.some((domain) => hostname.includes(domain))) {
      return false;
    }
    return true;
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

/**
 * Extract text content from an element, handling Telegram's DOM structure
 */
function getElementText(element) {
  if (!element) return "";

  const text = element.innerText || element.textContent || "";
  return text.trim();
}

/**
 * Get timestamp from a Telegram message element
 * Returns ISO string or current time if not found
 */
function getMessageTimestamp(messageElement) {
  try {
    // Telegram Web stores time in various attributes and elements
    // Look for time elements
    const timeElement = messageElement.querySelector('[class*="time"]');
    if (timeElement) {
      const timeText =
        timeElement.getAttribute("title") || timeElement.innerText;
      if (timeText) {
        const date = new Date(timeText);
        if (!isNaN(date.getTime())) {
          return date.toISOString();
        }
      }
    }

    // If we can't find a specific timestamp, assume it's recent
    return new Date().toISOString();
  } catch (e) {
    return new Date().toISOString();
  }
}

/**
 * Extract all URLs from a message element
 */
function extractLinksFromText(text) {
  if (!text) return;

  try {
    const urlRegex = /https?:\/\/[^\s]+/g;
    const matches = text.match(urlRegex) || [];

    for (const url of matches) {
      const cleanedUrl = cleanUrl(url);
      if (!cleanedUrl || seenLinks.has(cleanedUrl)) {
        continue;
      }
      if (!isValidLink(cleanedUrl)) {
        continue;
      }
      seenLinks.add(cleanedUrl);
      saveToStorage(cleanedUrl, text);
    }
  } catch (e) {
    console.error("Error extracting URLs:", e);
  }
}

/**
 * Extract message context from a message element
 */
function extractMessageContext(messageElement) {
  try {
    // Get message text content
    const textElement =
      messageElement.querySelector('[class*="text"]') || messageElement;
    const messageText = getElementText(textElement);

    return messageText.substring(0, 100); // Limit to 100 chars
  } catch (e) {
    return "";
  }
}

/**
 * Main extraction function - finds all message bubbles and extracts links
 */
function saveToStorage(url, text) {
  chrome.storage.local.get([STORAGE_KEY], (result) => {
    const links = result[STORAGE_KEY] || [];
    if (links.some((link) => link.url === url)) {
      return;
    }
    const description = text ? text.substring(0, 100) : "Extracted from Telegram";
    links.push({
      url,
      sport: "Other",
      description,
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
    }
  });
}

function startLiveObserver(messageContainer) {
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      mutation.addedNodes.forEach((node) => {
        if (node && node.innerText) {
          extractLinksFromText(node.innerText);
        }
      });
    }
  });

  observer.observe(messageContainer, {
    childList: true,
    subtree: true,
  });
}

function waitForMessageContainer() {
  const messageContainer = document.querySelector('div[class*="messages"]');
  if (messageContainer) {
    startLiveObserver(messageContainer);
    return;
  }

  setTimeout(waitForMessageContainer, 2000);
}

function scanAllMessages() {
  const messageElements = document.querySelectorAll(
    '[class*="message"], [class*="bubble"], [class*="MessageGroup"], [class*="message-content"], [role="article"], .message',
  );
  messageElements.forEach((element) => {
    if (element && element.innerText) {
      extractLinksFromText(element.innerText);
    }
  });
}

chrome.runtime.onMessage.addListener((request) => {
  if (request.action === "extractLinks") {
    scanAllMessages();
  }
});

seedSeenLinks();
waitForMessageContainer();

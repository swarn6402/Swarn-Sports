// Content script for extracting links from Telegram pages

// Streaming link patterns to match
const STREAMING_PATTERNS = [
  /stream/i,
  /live/i,
  /watch/i,
  /embed/i,
  /play/i,
  /\.m3u8/i,
  /\.mp4/i,
  /\.mkv/i,
  /video/i,
  /hls/i,
  /dash/i,
  /sports/i,
];

// Exclude patterns for non-streaming links
const EXCLUDE_PATTERNS = [
  /telegram\.org/i,
  /telegram\.com/i,
  /t\.me/i,
  /web\.telegram/i,
  /webz\.telegram/i,
  /github\.com/i,
  /npm\.js/i,
];

/**
 * Check if a URL matches streaming patterns
 */
function isStreamingLink(url) {
  try {
    const urlStr = url.toLowerCase();

    // Check if URL should be excluded
    for (const pattern of EXCLUDE_PATTERNS) {
      if (pattern.test(urlStr)) {
        return false;
      }
    }

    // Check if URL matches streaming patterns
    for (const pattern of STREAMING_PATTERNS) {
      if (pattern.test(urlStr)) {
        return true;
      }
    }

    // Also accept any http/https URL that looks like it could be a stream
    // (user might want to add arbitrary URLs)
    if (urlStr.startsWith("http://") || urlStr.startsWith("https://")) {
      return true;
    }

    return false;
  } catch (e) {
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
function extractUrlsFromElement(element) {
  const urls = new Set();

  try {
    // Find all links in the element
    const links = element.querySelectorAll("a[href], a");
    for (const link of links) {
      const href = link.getAttribute("href") || link.innerText;
      if (href) {
        const cleanedUrl = cleanUrl(href);
        if (cleanedUrl && isStreamingLink(cleanedUrl)) {
          urls.add(cleanedUrl);
        }
      }
    }

    // Also look for URLs in text content (URLs that might not be wrapped in links)
    const text = element.innerText || element.textContent || "";
    const urlPattern = /(https?:\/\/[^\s<>"{}|\\^`\[\]]*)/g;
    const matches = text.match(urlPattern) || [];

    for (const url of matches) {
      const cleanedUrl = cleanUrl(url);
      if (cleanedUrl && isStreamingLink(cleanedUrl)) {
        urls.add(cleanedUrl);
      }
    }
  } catch (e) {
    console.error("Error extracting URLs:", e);
  }

  return Array.from(urls);
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
function extractLinksFromTelegram() {
  const links = [];

  try {
    // Telegram Web UI uses multiple possible selectors for message containers
    const messageSelectors = [
      '[class*="message"]',
      '[class*="bubble"]',
      '[class*="MessageGroup"]',
      '[class*="message-content"]',
      '[role="article"]',
      ".message",
    ];

    let messageElements = [];

    // Try each selector and collect unique elements
    const seenElements = new Set();
    for (const selector of messageSelectors) {
      try {
        const elements = document.querySelectorAll(selector);
        for (const el of elements) {
          if (!seenElements.has(el)) {
            messageElements.push(el);
            seenElements.add(el);
          }
        }
      } catch (e) {
        // Invalid selector, continue
      }
    }

    // Process each message element
    for (const messageElement of messageElements) {
      try {
        // Skip if element is not visible
        if (!messageElement.offsetParent) {
          continue;
        }

        const urls = extractUrlsFromElement(messageElement);
        const context = extractMessageContext(messageElement);
        const timestamp = getMessageTimestamp(messageElement);

        for (const url of urls) {
          links.push({
            url,
            context,
            timestamp,
            source: "auto",
          });
        }
      } catch (e) {
        console.error("Error processing message:", e);
      }
    }

    // Remove duplicates based on URL
    const uniqueLinks = [];
    const seenUrls = new Set();

    for (const link of links) {
      if (!seenUrls.has(link.url)) {
        uniqueLinks.push(link);
        seenUrls.add(link.url);
      }
    }

    return uniqueLinks;
  } catch (e) {
    console.error("Error in extractLinksFromTelegram:", e);
    return [];
  }
}

// Listen for messages from the popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "extractLinks") {
    try {
      const links = extractLinksFromTelegram();
      sendResponse({
        success: true,
        links,
        currentUrl: window.location.href,
      });
    } catch (e) {
      console.error("Error extracting links:", e);
      sendResponse({
        success: false,
        error: e.message,
      });
    }
  }
});

// Also make extraction available immediately when popup opens
console.log("Telegram Stream Extractor content script loaded");

// Content script for extracting links from Telegram pages

/**
 * Check if a URL matches streaming patterns
 */
function isStreamingLink(urlString) {
  try {
    const url = new URL(urlString);
    const hostname = url.hostname.toLowerCase();
    const path = url.pathname.toLowerCase();
    const full = urlString.toLowerCase();

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

    const streamExtensions = [".m3u8", ".mpd", ".mp4", ".mkv", ".ts"];

    if (streamExtensions.some((ext) => path.endsWith(ext))) {
      return true;
    }

    const streamKeywords = [
      "stream",
      "live",
      "watch",
      "embed",
      "play",
      "video",
      "hls",
      "dash",
    ];

    const videoIndicators = ["1080", "720", "480", "hd", "4k", "fhd"];

    const hasKeyword = streamKeywords.some((keyword) => full.includes(keyword));
    const hasIndicator = videoIndicators.some((indicator) =>
      full.includes(indicator),
    );

    if (hasKeyword && hasIndicator) {
      return true;
    }

    return false;
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
function extractUrlsFromElement(element) {
  const urls = new Set();

  try {
    // Extract URLs from text content
    const text = element.innerText || element.textContent || "";
    const urlRegex = /https?:\/\/[^\s]+/g;
    const matches = text.match(urlRegex) || [];

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
  const seen = new Set();

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
          if (seen.has(url)) {
            continue;
          }
          seen.add(url);
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

    return links;
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

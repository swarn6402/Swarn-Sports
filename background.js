// Background Service Worker for the Chrome extension
// Handles periodic tasks and badge updates

// Initialize extension on install
chrome.runtime.onInstalled.addListener(() => {
  console.log("Telegram Stream Extractor installed");
  // Clear badge on fresh install
  chrome.action.setBadgeText({ text: "" });
});

// Update badge periodically
chrome.alarms.create("updateBadge", { periodInMinutes: 1 });

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "updateBadge") {
    updateBadgeCount();
  }
});

/**
 * Update badge with count of active links
 */
function updateBadgeCount() {
  chrome.storage.local.get(["telegram_stream_links"], (result) => {
    const links = result["telegram_stream_links"] || [];
    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const activeLinks = links.filter((link) => {
      try {
        const linkTime = new Date(link.timestamp);
        return linkTime > twentyFourHoursAgo;
      } catch (e) {
        return true;
      }
    });

    if (activeLinks.length > 0) {
      chrome.action.setBadgeText({ text: activeLinks.length.toString() });
      chrome.action.setBadgeBackgroundColor({ color: "#3b82f6" });
    } else {
      chrome.action.setBadgeText({ text: "" });
    }
  });
}

// Update badge on startup
updateBadgeCount();

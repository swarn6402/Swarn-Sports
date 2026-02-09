// Popup script for managing the extension UI and link storage

// Sport emojis and colors
const SPORTS = {
  Cricket: { emoji: "🏏", class: "cricket", color: "#10b981" },
  Football: { emoji: "⚽", class: "football", color: "#3b82f6" },
  Tennis: { emoji: "🎾", class: "tennis", color: "#f59e0b" },
  Other: { emoji: "🎯", class: "other", color: "#8b5cf6" },
};

// Storage key
const STORAGE_KEY = "telegram_stream_links";

// DOM Elements
const extractBtn = document.getElementById("extractBtn");
const refreshBtn = document.getElementById("refreshBtn");
const addBtn = document.getElementById("addBtn");
const clearAllBtn = document.getElementById("clearAllBtn");
const manualUrl = document.getElementById("manualUrl");
const sportSelect = document.getElementById("sportSelect");
const matchName = document.getElementById("matchName");
const linksContainer = document.getElementById("linksContainer");
const linkCount = document.getElementById("linkCount");
const statusMsg = document.getElementById("statusMsg");
const searchInput = document.getElementById("searchInput");
const toggleAddBtn = document.getElementById("toggleAddBtn");
const addSection = document.getElementById("addSection");

// State
let currentFilter = "";
let linkActionsBound = false;

// Initialize
document.addEventListener("DOMContentLoaded", () => {
  loadAndDisplayLinks();
  setupEventListeners();
  updateBadge();
  extractBtn.disabled = true;
  extractBtn.title = "Automatic extraction enabled";

  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === "local" && changes[STORAGE_KEY]) {
      loadAndDisplayLinks();
      updateBadge();
    }
  });
});

/**
 * Setup all event listeners
 */
function setupEventListeners() {
  refreshBtn.addEventListener("click", handleRefreshPage);
  addBtn.addEventListener("click", handleAddLink);
  clearAllBtn.addEventListener("click", handleClearAll);
  toggleAddBtn.addEventListener("click", handleToggleAddForm);
  searchInput.addEventListener("input", handleSearch);
  matchName.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      handleAddLink();
    }
  });
}

/**
 * Get all active tabs to find Telegram
 */
async function getTelegramTab() {
  const tabs = await chrome.tabs.query({ currentWindow: true });
  return tabs.find(
    (tab) =>
      tab.url &&
      (tab.url.includes("web.telegram.org") ||
        tab.url.includes("webz.telegram.org")),
  );
}

/**
 * Handle extract links button
 */
async function handleExtractLinks() {
  try {
    showStatus("🔍 Extracting links from Telegram...", "info");
    extractBtn.disabled = true;

    const telegramTab = await getTelegramTab();

    if (!telegramTab) {
      showStatus("❌ Please open Telegram Web in a tab first", "error");
      extractBtn.disabled = false;
      return;
    }

    // Send message to content script to extract links
    const response = await chrome.tabs.sendMessage(telegramTab.id, {
      action: "extractLinks",
    });

    if (!response.success) {
      showStatus("❌ Failed to extract links. Try again.", "error");
      extractBtn.disabled = false;
      return;
    }

    const extractedLinks = response.links;

    if (extractedLinks.length === 0) {
      showStatus(
        "ℹ️ No streaming links found. Add manually or check another chat.",
        "info",
      );
      extractBtn.disabled = false;
      return;
    }

    // Save extracted links
    const existingLinks = await getStoredLinks();

    // Merge with new links (avoid duplicates)
    const urlMap = new Map();

    // Add existing links
    for (const link of existingLinks) {
      urlMap.set(link.url, link);
    }

    // Add new links (extracted ones take precedence for timestamp)
    for (const extractedLink of extractedLinks) {
      if (!urlMap.has(extractedLink.url)) {
        const newLink = {
          url: extractedLink.url,
          sport: "Other",
          description: extractedLink.context || "Extracted from Telegram",
          timestamp: extractedLink.timestamp,
          source: "auto",
        };
        urlMap.set(extractedLink.url, newLink);
      }
    }

    const allLinks = Array.from(urlMap.values());
    await saveLinks(allLinks);

    showStatus(`✅ Extracted ${extractedLinks.length} link(s)!`, "success");
    loadAndDisplayLinks();
  } catch (error) {
    console.error("Error extracting links:", error);
    showStatus("❌ Error: " + error.message, "error");
  } finally {
    extractBtn.disabled = false;
  }
}

/**
 * Handle refresh page button
 */
async function handleRefreshPage() {
  try {
    refreshBtn.disabled = true;
    const telegramTab = await getTelegramTab();

    if (!telegramTab) {
      showStatus("❌ Telegram tab not found", "error");
      refreshBtn.disabled = false;
      return;
    }

    await chrome.tabs.reload(telegramTab.id);
    showStatus("✅ Page refreshed", "success");

    // Wait a moment for page to load, then extract
    setTimeout(() => {
      handleExtractLinks();
    }, 2000);
  } catch (error) {
    console.error("Error refreshing:", error);
    showStatus("❌ Error refreshing page", "error");
  } finally {
    refreshBtn.disabled = false;
  }
}

/**
 * Handle adding a link manually
 */
async function handleAddLink() {
  const url = manualUrl.value.trim();
  const sport = sportSelect.value;
  const description = matchName.value.trim();

  if (!url) {
    showStatus("⚠️ Please enter a URL", "error");
    return;
  }

  // Validate URL format
  if (!isValidUrl(url)) {
    showStatus("⚠️ Invalid URL format", "error");
    return;
  }

  try {
    addBtn.disabled = true;

    const links = await getStoredLinks();

    // Check for duplicate
    if (links.some((link) => link.url === url)) {
      showStatus("⚠️ This link already exists", "error");
      addBtn.disabled = false;
      return;
    }

    const newLink = {
      url: ensureProtocol(url),
      sport,
      description: description || "Added manually",
      timestamp: new Date().toISOString(),
      source: "manual",
    };

    links.push(newLink);
    await saveLinks(links);

    // Clear form
    manualUrl.value = "";
    matchName.value = "";
    sportSelect.value = "Cricket";

    showStatus("✅ Link added successfully!", "success");
    loadAndDisplayLinks();
  } catch (error) {
    console.error("Error adding link:", error);
    showStatus("❌ Error adding link", "error");
  } finally {
    addBtn.disabled = false;
  }
}

/**
 * Handle clear all links
 */
async function handleClearAll() {
  if (confirm("Are you sure you want to delete all links?")) {
    try {
      await saveLinks([]);
      showStatus("🗑️ All links cleared", "success");
      loadAndDisplayLinks();
    } catch (error) {
      showStatus("❌ Error clearing links", "error");
    }
  }
}

/**
 * Handle toggle add form
 */
function handleToggleAddForm() {
  addSection.classList.toggle("collapsed");
  toggleAddBtn.textContent = addSection.classList.contains("collapsed")
    ? "➕ Add"
    : "➖ Hide";
}

/**
 * Handle search/filter
 */
function handleSearch() {
  currentFilter = searchInput.value.toLowerCase().trim();
  loadAndDisplayLinks();
}

/**
 * Filter links by search query
 */
function filterLinks(links) {
  if (!currentFilter) return links;

  return links.filter((link) => {
    const urlMatch = link.url.toLowerCase().includes(currentFilter);
    const descMatch = link.description.toLowerCase().includes(currentFilter);
    const sportMatch = link.sport.toLowerCase().includes(currentFilter);
    return urlMatch || descMatch || sportMatch;
  });
}

/**
 * Delete a link
 */
async function deleteLink(url) {
  try {
    const links = await getStoredLinks();
    const filtered = links.filter((link) => link.url !== url);
    await saveLinks(filtered);
    loadAndDisplayLinks();
  } catch (error) {
    console.error("Error deleting link:", error);
    showStatus("❌ Error deleting link", "error");
  }
}

/**
 * Copy link to clipboard
 */
function copyToClipboard(url) {
  navigator.clipboard
    .writeText(url)
    .then(() => {
      showToast("📋 Link copied!", "success");
    })
    .catch((err) => {
      showToast("❌ Failed to copy", "error");
    });
}

/**
 * Open link in new tab
 */
function openLink(url) {
  chrome.tabs.create({ url });
}

/**
 * Load and display links
 */
async function loadAndDisplayLinks() {
  try {
    const links = await getActiveLinks();
    displayLinks(links);
  } catch (error) {
    console.error("Error loading links:", error);
  }
}

/**
 * Get stored links from chrome storage
 */
async function getStoredLinks() {
  return new Promise((resolve) => {
    chrome.storage.local.get([STORAGE_KEY], (result) => {
      resolve(result[STORAGE_KEY] || []);
    });
  });
}

/**
 * Get active links (filtered by 24 hours)
 */
async function getActiveLinks() {
  const links = await getStoredLinks();
  const now = new Date();
  const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  return links
    .filter((link) => {
      try {
        const linkTime = new Date(link.timestamp);
        return linkTime > twentyFourHoursAgo;
      } catch (e) {
        return true; // Keep links with invalid timestamps
      }
    })
    .sort((a, b) => {
      // Sort by most recent first
      return new Date(b.timestamp) - new Date(a.timestamp);
    });
}

/**
 * Save links to chrome storage
 */
async function saveLinks(links) {
  return new Promise((resolve) => {
    chrome.storage.local.set({ [STORAGE_KEY]: links }, resolve);
  });
}

/**
 * Display links in the UI
 */
function displayLinks(links) {
  // Apply search filter
  const filteredLinks = filterLinks(links);

  linkCount.textContent = filteredLinks.length;

  if (filteredLinks.length === 0) {
    if (currentFilter) {
      linksContainer.innerHTML = `
        <div class="no-links-message">
          🔍 No matches found<br>
          <small>Try a different search term</small>
        </div>
      `;
    } else {
      linksContainer.innerHTML = `
        <div class="no-links-message">
          🎬 No active links yet<br>
          <small>Extract from Telegram or add manually</small>
        </div>
      `;
    }
    bindLinkActions();
    clearAllBtn.style.display = "none";
    return;
  }

  clearAllBtn.style.display = "block";

  // Group links by sport
  const linksBySport = {};
  for (const sport of Object.keys(SPORTS)) {
    linksBySport[sport] = [];
  }

  filteredLinks.forEach((link) => {
    const sport = link.sport || "Other";
    if (!linksBySport[sport]) {
      linksBySport[sport] = [];
    }
    linksBySport[sport].push(link);
  });

  // Build HTML
  let html = "";
  const now = new Date();

  for (const [sport, sportLinks] of Object.entries(linksBySport)) {
    if (sportLinks.length === 0) continue;

    for (const link of sportLinks) {
      const sportInfo = SPORTS[sport] || SPORTS["Other"];
      const timeAgo = getTimeAgoString(link.timestamp);
      const urlDisplay = new URL(link.url).hostname || link.url;

      // Add pulse animation for links added in the last 5 seconds
      const linkTime = new Date(link.timestamp);
      const isNewLink = now - linkTime < 5000;
      const pulseClass = isNewLink ? "new-link" : "";

      html += `
        <div class="link-card ${sportInfo.class} ${pulseClass}">
          <div class="card-header">
            <div class="card-title">
              <span>${sportInfo.emoji}</span>
              ${sport}
            </div>
            <div class="card-time">${timeAgo}</div>
          </div>
          <div class="card-description">${escapeHtml(link.description)}</div>
          <div class="card-url" title="${link.url}">${escapeHtml(urlDisplay)}</div>
          <div class="card-actions">
            <button class="btn btn-open" data-url="${escapeHtml(link.url)}">📺 Open</button>
            <button class="btn btn-copy" data-url="${escapeHtml(link.url)}">📋 Copy</button>
            <button class="btn btn-delete" data-url="${escapeHtml(link.url)}">🗑️</button>
          </div>
        </div>
      `;
    }
  }

  linksContainer.innerHTML = html;
  bindLinkActions();
}

/**
 * Bind link action event delegation
 */
function bindLinkActions() {
  if (linkActionsBound) return;
  linksContainer.addEventListener("click", (e) => {
    const btn = e.target.closest("button");
    if (!btn) return;
    const url = btn.dataset.url;
    if (!url) return;

    if (btn.classList.contains("btn-open")) {
      openLink(url);
    } else if (btn.classList.contains("btn-copy")) {
      copyToClipboard(url);
    } else if (btn.classList.contains("btn-delete")) {
      deleteLink(url);
    }
  });
  linkActionsBound = true;
}

/**
 * Get time ago string
 */
function getTimeAgoString(timestamp) {
  try {
    const now = new Date();
    const linkTime = new Date(timestamp);
    const diffMs = now - linkTime;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) {
      return "just now";
    } else if (diffMins < 60) {
      return `${diffMins}m ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else {
      return `${diffDays}d ago`;
    }
  } catch (e) {
    return "unknown";
  }
}

/**
 * Show status message
 */
function showStatus(message, type = "info") {
  statusMsg.textContent = message;
  statusMsg.className = `status-message ${type}`;
  statusMsg.style.display = "block";

  // Auto hide after 5 seconds
  setTimeout(() => {
    statusMsg.style.display = "none";
  }, 5000);
}

/**
 * Show toast notification
 */
function showToast(message, type = "success") {
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.remove();
  }, 3000);
}

/**
 * Validate URL format
 */
function isValidUrl(string) {
  try {
    const url = ensureProtocol(string);
    new URL(url);
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * Ensure URL has protocol
 */
function ensureProtocol(url) {
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    return "https://" + url;
  }
  return url;
}

/**
 * Escape HTML special characters
 */
function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Update extension icon badge with link count
 */
async function updateBadge() {
  try {
    const links = await getActiveLinks();
    const count = links.length;

    if (count > 0) {
      chrome.action.setBadgeText({ text: count.toString() });
      chrome.action.setBadgeBackgroundColor({ color: "#3b82f6" });
    } else {
      chrome.action.setBadgeText({ text: "" });
    }
  } catch (error) {
    console.error("Error updating badge:", error);
  }
}

// Periodically update badge
setInterval(updateBadge, 60000); // Update every minute

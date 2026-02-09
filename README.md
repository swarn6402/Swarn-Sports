# 📺 SwarnSports Telegram Stream Extractor

A lightweight Chrome extension that automatically extracts and organizes streaming links from Telegram channels. Built for personal use to quickly access sports streams without juggling multiple tabs.

## ✨ Features

- **🔄 Auto-Extract Links** - One-click extraction from any Telegram Web chat
- **⏰ Smart Filtering** - Only shows links from the last 24 hours
- **✏️ Manual Entry** - Add links the extension might miss
- **🎨 Sport Categories** - Color-coded organization (Cricket 🏏, Football ⚽, Tennis 🎾)
- **🌙 Dark Theme** - Easy on the eyes for evening viewing
- **💾 Auto-Save** - Links persist across browser sessions
- **🔢 Badge Counter** - See active stream count at a glance

## 🚀 Quick Start

### Installation

1. **Download** this repository (or clone it)
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable **Developer mode** (toggle in top-right)
4. Click **Load unpacked**
5. Select the extension folder
6. Done! The extension icon appears in your toolbar

### Usage

**Extract Links:**
1. Open [web.telegram.org](https://web.telegram.org) in a tab
2. Navigate to your channel with streaming links
3. Click the extension icon
4. Click **"🔄 Extract Links"**
5. Links appear organized by sport

**Add Manually:**
1. Fill in the form (URL, Sport, Event name)
2. Click **"➕ Add Link"** or press Enter
3. Link saved and ready to use

**Access Streams:**
- Click **📺** to open stream in new tab
- Click **📋** to copy URL to clipboard
- Click **🗑️** to remove individual links
- Use **"🗑️ Clear All"** to wipe everything

## 🎯 How It Works

### Smart Link Detection

The extension scans Telegram messages for URLs containing:
- **Keywords**: stream, live, watch, embed, play, video, hls, dash, sports
- **Extensions**: .m3u8, .mp4, .mkv
- **Excludes**: Internal Telegram links (telegram.org, t.me)

### 24-Hour Auto-Filter

Links older than 24 hours are automatically hidden from view. Storage remains, but display updates to show only fresh streams.

### Data Storage

```javascript
// Each link stored as:
{
  url: "https://example.com/stream",
  sport: "Cricket",
  description: "India vs Australia",
  timestamp: "2026-02-09T15:30:00Z",
  source: "auto" // or "manual"
}
```

All data stored locally using `chrome.storage.local` - nothing leaves your device.

## 📁 Project Structure

```
telegram-stream-extractor/
├── manifest.json       # Extension configuration
├── popup.html          # Main interface
├── popup.js            # UI logic & link management
├── content.js          # Link extraction from Telegram
├── background.js       # Badge counter & background tasks
├── styles.css          # Dark theme styling
└── icons/
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
```

## 🔒 Privacy & Permissions

### What This Extension Does:
✅ Reads content from Telegram tabs you visit  
✅ Stores links locally on your device  
✅ Extracts URLs from message text  

### What This Extension Does NOT Do:
❌ Send data to external servers  
❌ Track your browsing  
❌ Access other tabs or sensitive data  
❌ Require login or account  

### Required Permissions:
- **activeTab** - Access current Telegram tab
- **storage** - Save links locally
- **scripting** - Run extraction script
- **host_permissions** - Only web.telegram.org

**Zero telemetry. Zero tracking. Complete privacy.**

## 🛠️ Troubleshooting

### "Please open Telegram Web in a tab first"
- Ensure you have [web.telegram.org](https://web.telegram.org) open
- The extension only works on Telegram Web tabs

### No links extracted?
- Links might not match detection patterns → Add manually
- Try clicking **"🔁 Refresh"** to reload the page
- Ensure you're viewing a chat with streaming links

### Extension not appearing?
- Go to `chrome://extensions/`
- Check that the extension is enabled
- Restart Chrome if needed

### Links disappearing after a day?
- **By design!** Old links auto-hide after 24 hours
- Bookmark important streams in your browser

## 💡 Tips & Best Practices

1. **Multiple Channels** - Extract from different chats sequentially
2. **Daily Cleanup** - Use "Clear All" to remove old links
3. **Quick Access** - Pin the extension icon for faster access
4. **Backup Links** - Copy important URLs to notes if needed
5. **Valid URLs** - Manual entry requires `http://` or `https://`

## ⚙️ Browser Compatibility

| Browser | Support |
|---------|---------|
| Chrome/Chromium | ✅ Full support |
| Edge | ✅ Full support |
| Firefox | ❌ Different extension API |
| Safari | ❌ Not compatible |

## 📊 Performance

- **Memory**: < 2MB (even with 100+ links)
- **CPU**: Negligible - extraction is instant
- **Storage**: ~200 bytes per link
- **Battery**: Zero impact when closed

## 🎨 UI Overview

**Header:**
- Title + active link count
- Extract & Refresh buttons
- Clear All option

**Manual Add Form:**
- URL input (required, must be valid)
- Sport dropdown (Cricket/Football/Tennis/Other)
- Event description (optional)
- Quick add with Enter key

**Links Display:**
- Grouped by sport with color coding
- Shows event name & timestamp
- Three actions: Open 📺, Copy 📋, Delete 🗑️
- Scrollable if many links

## 🔮 Future Enhancements (Ideas)

- [ ] Search/filter across saved links
- [ ] Export links to JSON/CSV
- [ ] Custom sport categories
- [ ] Link quality indicators (dead link detection)
- [ ] Keyboard shortcuts for actions

## 📝 License

Personal use extension. Not licensed for commercial distribution.

## 🙏 Acknowledgments

Built for sports streaming enthusiasts who want a cleaner, faster way to access live content from Telegram channels.

---

**Need help?** Check the [Troubleshooting](#-troubleshooting) section above or review the inline code comments for technical details.

**Enjoy your streams!** 🏏⚽🎾
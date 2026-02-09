# 🚀 Quick Start Guide - Telegram Stream Extractor

## Installation (2 minutes)

### Step 1: Open Chrome Extensions Page

Open a new tab and go to:

```
chrome://extensions/
```

### Step 2: Enable Developer Mode

- Look at the **top right corner**
- Toggle the **"Developer mode"** switch (it will turn blue)

### Step 3: Load the Extension

- Click the **"Load unpacked"** button (now visible after step 2)
- Navigate to and select the `/workspaces/Swarn-Sports` folder
- Click **Select Folder**

### Step 4: Done!

- You'll see the extension appear in your list
- _Click the extension ID to see details or modify permissions_
- The **🎯 extension icon** now appears in your toolbar!

## First Use (1 minute)

### 1. Open Telegram Web

Go to: **[web.telegram.org](https://web.telegram.org)**

### 2. Click the Extension Icon

- You'll see the popup with the title "📺 Stream Links"
- Click **"🔄 Extract Links"** button

### 3. Select Links

- Wait for extraction to complete
- Links found are displayed with:
  - ⏏ Sport emoji
  - 📝 Description
  - ⏰ Time posted
  - Buttons: 📺 **Open** | 📋 **Copy** | 🗑️ **Delete**

### 4. Start Streaming!

- Click **📺 Open** on any link to open it in a new tab
- Or click **📋 Copy** to share with friends

## Common Tasks

### Extract Links from a Specific Chat

1. Navigate to the chat in Telegram Web
2. Scroll through messages (so they load)
3. Open the extension
4. Click "🔄 Extract Links"
5. Repeat for more chats

### Add a Stream Link Manually

1. Open the extension popup
2. Scroll to **"📝 Add Manually"** section
3. Fill in:
   - **URL field**: Paste the stream link
   - **Sport dropdown**: Pick the sport (or "Other")
   - **Event name field**: Describe what's being streamed (e.g., "India vs Pakistan T20")
4. Click **"➕ Add Link"** or press **Enter**
5. Link appears immediately with timestamp

### Change Sport Category

1. Each link has a sport assignment (Cricket, Football, Tennis, Other)
2. Currently, manually added links let you pick the sport
3. Auto-extracted links default to "Other" (you can delete and re-add manually to change)

### Delete a Link

- Click the **🗑️** button on any link card
- Or click **"🗑️ Clear All"** in the header to delete everything

### View How Many Links You Have

- Look at the **blue badge on the extension icon**
- It shows the count of active links
- Automatically updates every minute

## Features Explained

### 🔄 Extract Links

- Scans all visible messages in the current Telegram chat
- Looks for URLs that contain stream keywords
- Filters out Telegram internal links
- Automatically assigns current timestamp

### 📝 Add Manually

- Use this when auto-extraction misses a link
- Validates URL format (must be http:// or https://)
- Lets you categorize by sport
- Lets you add custom descriptions

### 📺 Open Button

- Opens the link in a **new tab**
- Your current Telegram stays open

### 📋 Copy Button

- Copies link to clipboard
- Share via WhatsApp, Discord, Email, etc.

### 🗑️ Delete Button

- Removes just that link
- Doesn't affect other links

### 🗑️ Clear All Button

- Deletes every saved link at once
- **Confirmation popup appears first**

### 🔄 Refresh Button

- Reloads the Telegram page
- Auto-extracts links after page loads
- Use if new messages arrived

## Storage & Privacy

✅ **All links stored locally on YOUR computer**

- No uploading to internet
- No accounts or logins needed
- No ads or tracking
- Instant access, always

✅ **What the extension can access:**

- Only the Telegram Web pages you open
- Only extracts text URLs from messages
- Cannot access: passwords, chats, photos, videos

⚠️ **Links auto-expire after 24 hours**

- Old links are hidden but can be saved if important
- This is by design (keeps list fresh)

## Keyboard Shortcuts

| Key                        | Action                   |
| -------------------------- | ------------------------ |
| **Enter** (in URL field)   | Add manual link          |
| **Enter** (in Event field) | Add manual link          |
| Tab                        | Jump between form fields |

## Troubleshooting

### Extension Icon Not Showing?

1. Check `chrome://extensions/`
2. Find "Telegram Stream Extractor"
3. Make sure the **On/Off toggle is ON** (blue)
4. Try: **Menu** (3 dots) > **Manage extensions** > Check if enabled
5. Restart Chrome if needed

### "Please open Telegram Web in a tab first"?

- Must have **web.telegram.org** open as an active tab
- The desktop app's web view also works
- The extension can't access closed tabs

### No links showing after extract?

**Solution:** Scroll in the Telegram chat first

- Links only appear in the DOM if messages are visible
- Scroll up and down to load more messages
- Then extract again

### Links disappeared after time?

**Expected behavior:** Links older than 24 hours auto-hide

- Keeps your list clean
- Click "Clear All" occasionally to remove permanently

### Form won't accept my URL?

Check that URL:

- Starts with `http://` or `https://`
- Has no spaces
- Example: `https://example.com/stream.m3u8` ✅

### Extract seems slow?

- If the Telegram chat has thousands of messages, extraction takes longer
- Wait 5-10 seconds (depends on chat size)
- Close the popup and reopen if stuck

## Security Questions

**Q: Does this send my data anywhere?**
A: No. Everything stays on your computer. No internet calls at all.

**Q: Can it see my Telegram messages?**
A: Only the text to extract URLs. No access to files, chats, or metadata.

**Q: Do I need to grant special permissions?**
A: Only standard permissions for accessing Telegram Web pages you visit.

## Next Steps

- 📚 Read [EXTENSION_README.md](EXTENSION_README.md) for full documentation
- 🎯 Start extracting links from sports channels in Telegram
- 📋 Add manual links you find elsewhere
- 🎬 Bookmark your favorite streams in Chrome for quick access

---

**💡 Pro Tip:** Follow sports streaming channels/groups in Telegram and extract fresh links daily!

Happy streaming! 🎉

# Image Upload Field Design

## Overview

Add ability to attach images to forms that will be sent via Discord webhook. Images are uploaded directly to Discord CDN using multipart/form-data.

## Constraints

- Only **one** image field per form
- Image field is always at the **end** of the field list
- Maximum **4 images** per submission
- Maximum **25 MB** total file size (Discord limit)
- Images uploaded to Discord CDN (no external hosting needed)

## Data Structure

New field type `image` in config:

```javascript
{
  id: "img_abc123",
  type: "image",
  label: "Attach screenshots",
  required: false,
  maxFiles: 4,  // 1-4
  conditionalConditions: []
}
```

## Editor UI

### Add Button

- New button "Add image field" next to "Add field" button
- Icon: `fa-image` or similar
- Button hidden when image field already exists
- Button reappears when image field is deleted

### Field Card

Simplified compared to other fields:

- Label input
- Max files selector (1-4 dropdown)
- Required checkbox
- Conditional visibility settings
- No placeholder, icon, or options
- Drag handle disabled (cannot reorder)

## Form UI

### Upload Zone

```
┌─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┐
│         [icon] Label                    │
│                                         │
│   Drag images here or                   │
│   [Choose files]                        │
│                                         │
│   You can also paste from clipboard     │
│   (Ctrl+V)                              │
└ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┘

Uploaded: 2 of 4

┌──────┐  ┌──────┐
│ img1 │  │ img2 │
│  ✕   │  │  ✕   │
└──────┘  └──────┘
```

### Interactions

**Drag & drop:**
- Highlight zone on dragover
- Accept only `image/*` files

**Paste from clipboard:**
- Listen to `paste` event
- Check `clipboardData.items` for images

**Preview:**
- Thumbnail grid below upload zone
- Delete button (✕) on each thumbnail
- Counter "Uploaded: X of Y"

**Validation:**
- Block form submit if required and no files
- Show error if exceeding maxFiles limit

## Discord Integration

### Request Format

Switch from JSON to `FormData` when images are present:

```javascript
const formData = new FormData();

const payload = {
  username: config.webhookUsername,
  avatar_url: config.webhookAvatarUrl,
  content: conditionalMessage,
  embeds: [
    {
      title: "Form Title",
      url: "https://form.example",  // same URL for gallery effect
      color: 0xFF0000,
      fields: [...],
      timestamp: new Date().toISOString(),
      image: { url: "attachment://image0.png" }
    },
    // Additional embeds for gallery (files > 1)
    ...files.slice(1).map((_, i) => ({
      url: "https://form.example",  // SAME URL for gallery
      image: { url: `attachment://image${i + 1}.png` }
    }))
  ]
};

formData.append('payload_json', JSON.stringify(payload));

files.forEach((file, i) => {
  formData.append(`files[${i}]`, file, `image${i}.png`);
});

fetch(webhookUrl, { method: 'POST', body: formData });
```

### Gallery Effect

Multiple embeds with the same `url` property but different `image.url` values are merged into a single embed with image gallery by Discord client.

### Fallback

- No images attached: send regular JSON request (no FormData)
- Plain text mode: images still attached as files, no embed

## File Changes

### `js/editor.js`
- Add "Add image field" button
- `addImageField()` function
- `renderImageFieldEditor()` function
- Show/hide button logic
- Disable drag-n-drop for image field

### `js/form.js`
- `renderImageUploadField()` function
- Drag/drop, file input, paste handlers
- Store files in memory (`uploadedImages = []`)
- Validation on submit
- Preview rendering and deletion

### `js/discord.js`
- Modify `sendToDiscord()` to check for files
- `createFormDataPayload()` function
- Gallery embed construction logic

### `js/config.js`
- Update config schema for new field type
- Validation: only one image field, always at end

### `style.css`
- Upload zone styles (dashed border, colors)
- Preview thumbnail grid
- States: hover, drag-over, error

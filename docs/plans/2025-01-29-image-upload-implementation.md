# Image Upload Field Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add image upload field type that allows users to attach up to 4 images which are sent to Discord via webhook using multipart/form-data.

**Architecture:** New field type `image` in editor with drag-drop/paste upload zone in form. Images stored in memory, sent via FormData with multiple embeds for gallery effect.

**Tech Stack:** Vanilla JS, Discord Webhook API with multipart/form-data, FileReader API for previews.

---

## Task 1: Add Image Field Button to Editor

**Files:**
- Modify: `index.html:121-123`
- Modify: `js/editor.js:104-117`

**Step 1: Add button HTML in index.html**

After the existing "Добавить поле" button (line 121-123), add the image field button:

```html
<button id="addFieldBtn" class="add-field-btn">
  <i class="fas fa-plus"></i> Добавить поле
</button>
<button id="addImageFieldBtn" class="add-field-btn add-image-field-btn">
  <i class="fas fa-image"></i> Добавить поле для картинок
</button>
```

**Step 2: Add button handler in editor.js**

After the `addFieldBtn` event listener (around line 117), add:

```javascript
// Image field button handler
const addImageFieldBtn = document.getElementById('addImageFieldBtn');

function updateImageFieldButtonVisibility() {
  const hasImageField = currentConfig.fields.some(f => f.type === 'image');
  if (addImageFieldBtn) {
    addImageFieldBtn.style.display = hasImageField ? 'none' : 'inline-flex';
  }
}

if (addImageFieldBtn) {
  addImageFieldBtn.addEventListener('click', () => {
    const newField = {
      id: generateId(),
      type: 'image',
      label: 'Прикрепите скриншоты',
      required: false,
      maxFiles: 4,
    };
    currentConfig.fields.push(newField);
    addFieldToEditor(newField);
    updateImageFieldButtonVisibility();
    updateConfigFromEditor();
    renderForm();
  });
}

updateImageFieldButtonVisibility();
```

**Step 3: Verify changes**

Open the app in browser with `?mode=editor`, verify:
- New button "Добавить поле для картинок" appears
- Clicking it adds a field
- Button disappears after adding

**Step 4: Commit**

```bash
git add index.html js/editor.js
git commit -m "feat: add image field button to editor"
```

---

## Task 2: Render Image Field Card in Editor

**Files:**
- Modify: `js/editor.js:143-307` (addFieldToEditor function)

**Step 1: Add image field type check at the start of addFieldToEditor**

Inside `addFieldToEditor` function, after creating `fieldItem` div, add special handling for image type:

```javascript
function addFieldToEditor(field) {
  const fieldItem = document.createElement('div');
  fieldItem.className = 'field-item';
  fieldItem.dataset.fieldId = field.id;

  // Special rendering for image field
  if (field.type === 'image') {
    fieldItem.innerHTML = `
      <div class="field-header">
        <div class="field-header-left">
          <span class="field-title">🖼️ ${field.label}</span>
          <label class="field-required-inline">
            <input type="checkbox" class="field-required" ${field.required ? 'checked' : ''} />
            <span>обязательное</span>
          </label>
        </div>
        <div class="field-actions">
          <button class="field-action-btn delete" title="Удалить">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      </div>
      <div class="field-config">
        <div class="field-config-item" style="grid-column: 1 / -1;">
          <label>Название поля</label>
          <input type="text" class="field-label" value="${field.label}" />
        </div>
        <div class="field-config-item">
          <label>Максимум файлов</label>
          <select class="field-max-files">
            <option value="1" ${field.maxFiles === 1 ? 'selected' : ''}>1</option>
            <option value="2" ${field.maxFiles === 2 ? 'selected' : ''}>2</option>
            <option value="3" ${field.maxFiles === 3 ? 'selected' : ''}>3</option>
            <option value="4" ${field.maxFiles === 4 ? 'selected' : ''}>4</option>
          </select>
        </div>
        <div class="field-config-item field-conditional-container" style="grid-column: 1 / -1; display: ${
          currentConfig.showAdvancedSettings ? 'block' : 'none'
        };">
          <div class="conditional-section-header">
            <label class="conditional-checkbox-label-header">
              <input type="checkbox" class="conditional-enabled-checkbox" ${
                field.conditional && field.conditional.enabled ? 'checked' : ''
              } />
              <span>Условная видимость</span>
            </label>
            <i class="fas fa-chevron-down conditional-toggle-icon ${
              field.conditional && field.conditional.enabled ? 'open' : ''
            }"></i>
          </div>
          <div class="conditional-config" style="display: ${
            field.conditional && field.conditional.enabled ? 'block' : 'none'
          };">
            <div class="conditional-hint">Показывать это поле только если выполняются все условия:</div>
            <div class="conditional-conditions-list"></div>
            <button type="button" class="add-conditional-condition-btn" ${
              field.conditional && field.conditional.enabled ? '' : 'disabled'
            }>
              <i class="fas fa-plus"></i> Добавить условие
            </button>
          </div>
        </div>
      </div>
    `;

    setupImageFieldEventHandlers(fieldItem, field);
    fieldsList.appendChild(fieldItem);
    return;
  }

  // ... rest of existing code for other field types
```

**Step 2: Create setupImageFieldEventHandlers function**

Add this new function after `setupFieldEventHandlers`:

```javascript
function setupImageFieldEventHandlers(fieldItem, field) {
  const fieldHeader = fieldItem.querySelector('.field-header');
  const deleteBtn = fieldItem.querySelector('.delete');
  const labelInput = fieldItem.querySelector('.field-label');
  const requiredCheckbox = fieldItem.querySelector('.field-required');
  const maxFilesSelect = fieldItem.querySelector('.field-max-files');
  const conditionalSectionHeader = fieldItem.querySelector('.conditional-section-header');
  const conditionalToggleIcon = fieldItem.querySelector('.conditional-toggle-icon');
  const conditionalConfig = fieldItem.querySelector('.conditional-config');
  const conditionalEnabledCheckbox = fieldItem.querySelector('.conditional-enabled-checkbox');
  const conditionalConditionsList = fieldItem.querySelector('.conditional-conditions-list');
  const addConditionBtn = fieldItem.querySelector('.add-conditional-condition-btn');

  // Initialize conditions structure
  if (field.conditional && field.conditional.enabled && !field.conditional.conditions) {
    field.conditional.conditions = [];
  }

  function renderConditionalConditions() {
    if (!conditionalConditionsList) return;
    conditionalConditionsList.innerHTML = '';

    const isEnabled = field.conditional && field.conditional.enabled;
    const conditions = (field.conditional && field.conditional.conditions) || [];

    conditions.forEach((condition, index) => {
      const conditionItem = document.createElement('div');
      conditionItem.className = 'conditional-condition-item';

      const conditionRow = document.createElement('div');
      conditionRow.className = 'conditional-row';

      const fieldSelect = document.createElement('select');
      fieldSelect.className = 'conditional-field-select';
      fieldSelect.disabled = !isEnabled;
      fieldSelect.innerHTML = '<option value="">Выберите поле...</option>';

      currentConfig.fields.forEach((f) => {
        if (f.id !== field.id && (f.type === 'select' || f.type === 'radio')) {
          const option = document.createElement('option');
          option.value = f.id;
          option.textContent = f.label;
          if (condition.field === f.id) option.selected = true;
          fieldSelect.appendChild(option);
        }
      });

      const valueInput = document.createElement('input');
      valueInput.type = 'text';
      valueInput.className = 'conditional-value-input';
      valueInput.value = condition.value || '';
      valueInput.placeholder = 'Значение';
      valueInput.disabled = !isEnabled;

      fieldSelect.addEventListener('change', (e) => {
        condition.field = e.target.value;
        updateConfigFromEditor();
        renderForm();
      });

      valueInput.addEventListener('input', (e) => {
        condition.value = e.target.value;
        updateConfigFromEditor();
        renderForm();
      });

      const deleteCondBtn = document.createElement('button');
      deleteCondBtn.type = 'button';
      deleteCondBtn.className = 'field-action-btn delete';
      deleteCondBtn.innerHTML = '<i class="fas fa-trash"></i>';
      deleteCondBtn.disabled = !isEnabled;
      deleteCondBtn.addEventListener('click', () => {
        conditions.splice(index, 1);
        renderConditionalConditions();
        updateConfigFromEditor();
        renderForm();
      });

      conditionRow.appendChild(fieldSelect);
      conditionRow.appendChild(document.createTextNode(' = '));
      conditionRow.appendChild(valueInput);
      conditionItem.appendChild(conditionRow);
      conditionItem.appendChild(deleteCondBtn);
      conditionalConditionsList.appendChild(conditionItem);
    });
  }

  renderConditionalConditions();

  fieldHeader.addEventListener('click', (e) => {
    if (e.target.closest('.field-actions') || e.target.closest('.field-required-inline')) return;
    const config = fieldItem.querySelector('.field-config');
    config.style.display = config.style.display === 'none' ? 'grid' : 'none';
  });

  deleteBtn.addEventListener('click', () => {
    if (confirm('Удалить это поле?')) {
      currentConfig.fields = currentConfig.fields.filter((f) => f.id !== field.id);
      fieldItem.remove();
      updateImageFieldButtonVisibility();
      updateConfigFromEditor();
      renderForm();
    }
  });

  labelInput.addEventListener('input', (e) => {
    field.label = e.target.value;
    fieldItem.querySelector('.field-title').textContent = `🖼️ ${field.label}`;
    updateConfigFromEditor();
    renderForm();
  });

  requiredCheckbox.addEventListener('change', (e) => {
    field.required = e.target.checked;
    updateConfigFromEditor();
    renderForm();
  });

  maxFilesSelect.addEventListener('change', (e) => {
    field.maxFiles = parseInt(e.target.value, 10);
    updateConfigFromEditor();
    renderForm();
  });

  if (conditionalSectionHeader) {
    conditionalSectionHeader.addEventListener('click', (e) => {
      if (e.target === conditionalEnabledCheckbox || e.target.closest('.conditional-checkbox-label-header')) return;
      const isCurrentlyOpen = conditionalConfig.style.display === 'block';
      conditionalConfig.style.display = isCurrentlyOpen ? 'none' : 'block';
      conditionalToggleIcon.classList.toggle('open', !isCurrentlyOpen);
    });
  }

  if (conditionalEnabledCheckbox) {
    conditionalEnabledCheckbox.addEventListener('change', (e) => {
      const isEnabled = e.target.checked;
      if (isEnabled) {
        if (!field.conditional) field.conditional = { enabled: true, conditions: [] };
        else {
          field.conditional.enabled = true;
          if (!field.conditional.conditions) field.conditional.conditions = [];
        }
        conditionalConfig.style.display = 'block';
        conditionalToggleIcon.classList.add('open');
        if (addConditionBtn) addConditionBtn.disabled = false;
      } else {
        if (!field.conditional) field.conditional = {};
        field.conditional.enabled = false;
        if (addConditionBtn) addConditionBtn.disabled = true;
      }
      renderConditionalConditions();
      updateConfigFromEditor();
      renderForm();
    });
  }

  if (addConditionBtn) {
    addConditionBtn.addEventListener('click', () => {
      if (!field.conditional) field.conditional = { enabled: true, conditions: [] };
      if (!field.conditional.conditions) field.conditional.conditions = [];
      field.conditional.conditions.push({ field: '', value: '' });
      renderConditionalConditions();
      updateConfigFromEditor();
      renderForm();
    });
  }
}
```

**Step 3: Verify changes**

Open editor, add image field, verify:
- Card renders with label, maxFiles selector, required checkbox
- No move up/down buttons (image field stays at end)
- Delete works and shows the add button again

**Step 4: Commit**

```bash
git add js/editor.js
git commit -m "feat: render image field card in editor"
```

---

## Task 3: Add CSS Styles for Image Upload

**Files:**
- Modify: `style.css` (add at end)

**Step 1: Add styles for editor button**

```css
/* Image field button */
.add-image-field-btn {
  background: linear-gradient(135deg, #8b5cf6, #7c3aed) !important;
}

.add-image-field-btn:hover {
  background: linear-gradient(135deg, #7c3aed, #6d28d9) !important;
}
```

**Step 2: Add styles for upload zone**

```css
/* Image upload zone */
.image-upload-zone {
  border: 2px dashed var(--border-color);
  border-radius: var(--border-radius);
  padding: 2rem;
  text-align: center;
  cursor: pointer;
  transition: var(--transition-normal);
  background: var(--bg-secondary);
  margin-top: 0.5rem;
}

.image-upload-zone:hover,
.image-upload-zone.drag-over {
  border-color: var(--primary-color);
  background: rgba(99, 102, 241, 0.05);
}

.image-upload-zone.drag-over {
  background: rgba(99, 102, 241, 0.1);
}

.image-upload-zone-icon {
  font-size: 2.5rem;
  color: var(--text-light);
  margin-bottom: 0.75rem;
}

.image-upload-zone-text {
  color: var(--text-secondary);
  font-size: 0.9rem;
  margin-bottom: 0.5rem;
}

.image-upload-zone-hint {
  color: var(--text-light);
  font-size: 0.8rem;
}

.image-upload-zone input[type="file"] {
  display: none;
}

.image-upload-btn {
  display: inline-block;
  padding: 0.5rem 1rem;
  background: var(--primary-color);
  color: white;
  border-radius: 6px;
  font-size: 0.85rem;
  font-weight: 500;
  cursor: pointer;
  transition: var(--transition-fast);
  margin-top: 0.75rem;
}

.image-upload-btn:hover {
  background: var(--primary-dark);
}
```

**Step 3: Add styles for preview grid**

```css
/* Image preview grid */
.image-preview-container {
  margin-top: 1rem;
}

.image-preview-counter {
  font-size: 0.85rem;
  color: var(--text-secondary);
  margin-bottom: 0.5rem;
}

.image-preview-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: 0.75rem;
}

.image-preview-item {
  position: relative;
  aspect-ratio: 1;
  border-radius: 8px;
  overflow: hidden;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
}

.image-preview-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.image-preview-remove {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 24px;
  height: 24px;
  background: rgba(239, 68, 68, 0.9);
  color: white;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  transition: var(--transition-fast);
  opacity: 0;
}

.image-preview-item:hover .image-preview-remove {
  opacity: 1;
}

.image-preview-remove:hover {
  background: #dc2626;
  transform: scale(1.1);
}

/* Image field error state */
.image-upload-zone.error {
  border-color: var(--error-color);
}

.image-upload-error {
  color: var(--error-color);
  font-size: 0.8rem;
  margin-top: 0.5rem;
}
```

**Step 4: Commit**

```bash
git add style.css
git commit -m "feat: add CSS styles for image upload zone"
```

---

## Task 4: Render Image Upload Zone in Form

**Files:**
- Modify: `js/form.js:163-313` (renderForm function)

**Step 1: Add global variable for uploaded images**

At the top of form.js, add:

```javascript
// Store uploaded images for the form
let uploadedImages = [];
```

**Step 2: Add image field rendering in renderForm**

Inside the `currentConfig.fields.forEach` loop in `renderForm`, add a case for image type before the default case:

```javascript
case 'image':
  const uploadZone = document.createElement('div');
  uploadZone.className = 'image-upload-zone';
  uploadZone.innerHTML = `
    <div class="image-upload-zone-icon"><i class="fas fa-cloud-upload-alt"></i></div>
    <div class="image-upload-zone-text">Перетащите картинки сюда</div>
    <div class="image-upload-btn">Выбрать файлы</div>
    <div class="image-upload-zone-hint">Или вставьте из буфера (Ctrl+V)</div>
    <input type="file" class="image-file-input" accept="image/*" multiple />
  `;

  const previewContainer = document.createElement('div');
  previewContainer.className = 'image-preview-container';
  previewContainer.innerHTML = `
    <div class="image-preview-counter" style="display: none;">Загружено: <span>0</span> из ${field.maxFiles || 4}</div>
    <div class="image-preview-grid"></div>
  `;

  fieldGroup.appendChild(label);
  fieldGroup.appendChild(uploadZone);
  fieldGroup.appendChild(previewContainer);
  fieldGroup.dataset.maxFiles = field.maxFiles || 4;

  // Setup will be done in initImageUpload
  break;
```

**Step 3: Commit**

```bash
git add js/form.js
git commit -m "feat: render image upload zone in form"
```

---

## Task 5: Implement Image Upload Handlers

**Files:**
- Modify: `js/form.js` (add new function after renderForm)

**Step 1: Create initImageUpload function**

Add after `renderForm` function:

```javascript
// Initialize image upload functionality
function initImageUpload() {
  const imageFieldGroups = document.querySelectorAll('.form-group[data-field-id]');

  imageFieldGroups.forEach(fieldGroup => {
    const field = currentConfig.fields.find(f => f.id === fieldGroup.dataset.fieldId);
    if (!field || field.type !== 'image') return;

    const uploadZone = fieldGroup.querySelector('.image-upload-zone');
    const fileInput = fieldGroup.querySelector('.image-file-input');
    const previewGrid = fieldGroup.querySelector('.image-preview-grid');
    const previewCounter = fieldGroup.querySelector('.image-preview-counter');
    const counterSpan = previewCounter?.querySelector('span');
    const maxFiles = field.maxFiles || 4;

    if (!uploadZone || !fileInput) return;

    function updatePreview() {
      previewGrid.innerHTML = '';

      if (uploadedImages.length > 0) {
        previewCounter.style.display = 'block';
        counterSpan.textContent = uploadedImages.length;
      } else {
        previewCounter.style.display = 'none';
      }

      uploadedImages.forEach((file, index) => {
        const item = document.createElement('div');
        item.className = 'image-preview-item';

        const img = document.createElement('img');
        img.src = URL.createObjectURL(file);
        img.onload = () => URL.revokeObjectURL(img.src);

        const removeBtn = document.createElement('button');
        removeBtn.type = 'button';
        removeBtn.className = 'image-preview-remove';
        removeBtn.innerHTML = '<i class="fas fa-times"></i>';
        removeBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          uploadedImages.splice(index, 1);
          updatePreview();
        });

        item.appendChild(img);
        item.appendChild(removeBtn);
        previewGrid.appendChild(item);
      });
    }

    function addFiles(files) {
      const imageFiles = Array.from(files).filter(f => f.type.startsWith('image/'));
      const remainingSlots = maxFiles - uploadedImages.length;
      const filesToAdd = imageFiles.slice(0, remainingSlots);

      if (imageFiles.length > remainingSlots) {
        showMessage(`Можно загрузить максимум ${maxFiles} картинок`, 'error');
      }

      uploadedImages.push(...filesToAdd);
      updatePreview();
    }

    // Click to upload
    uploadZone.addEventListener('click', (e) => {
      if (e.target.closest('.image-preview-remove')) return;
      fileInput.click();
    });

    fileInput.addEventListener('change', (e) => {
      if (e.target.files.length > 0) {
        addFiles(e.target.files);
        fileInput.value = '';
      }
    });

    // Drag and drop
    uploadZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      uploadZone.classList.add('drag-over');
    });

    uploadZone.addEventListener('dragleave', (e) => {
      e.preventDefault();
      uploadZone.classList.remove('drag-over');
    });

    uploadZone.addEventListener('drop', (e) => {
      e.preventDefault();
      uploadZone.classList.remove('drag-over');
      if (e.dataTransfer.files.length > 0) {
        addFiles(e.dataTransfer.files);
      }
    });

    // Paste from clipboard
    document.addEventListener('paste', (e) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      const imageItems = Array.from(items).filter(item => item.type.startsWith('image/'));
      if (imageItems.length > 0) {
        e.preventDefault();
        const files = imageItems.map(item => item.getAsFile()).filter(Boolean);
        addFiles(files);
      }
    });

    // Initial render
    updatePreview();
  });
}
```

**Step 2: Call initImageUpload in renderForm**

At the end of `renderForm` function, add:

```javascript
initImageUpload();
```

**Step 3: Reset uploadedImages on form reset**

In `initFormHandlers`, after `contactForm.reset()` (around line 413), add:

```javascript
uploadedImages = [];
const previewGrids = document.querySelectorAll('.image-preview-grid');
previewGrids.forEach(grid => grid.innerHTML = '');
const previewCounters = document.querySelectorAll('.image-preview-counter');
previewCounters.forEach(counter => counter.style.display = 'none');
```

**Step 4: Commit**

```bash
git add js/form.js
git commit -m "feat: implement image upload handlers with drag-drop and paste"
```

---

## Task 6: Validate Image Field on Submit

**Files:**
- Modify: `js/form.js:316-347` (validateForm function)

**Step 1: Add image field validation**

Inside `validateForm` function, add check for image field:

```javascript
// Inside the forEach loop, add before the closing of the loop:
if (field.type === 'image') {
  if (field.required && uploadedImages.length === 0) {
    errors.push(`Поле "${field.label}" обязательно - прикрепите хотя бы одну картинку`);
  }
  return; // Skip other validations for image field
}
```

**Step 2: Commit**

```bash
git add js/form.js
git commit -m "feat: add image field validation on form submit"
```

---

## Task 7: Modify Discord Send to Use FormData

**Files:**
- Modify: `js/discord.js:178-296` (sendToDiscord function)

**Step 1: Create helper function for FormData payload**

Add before `sendToDiscord`:

```javascript
// Create FormData payload with images
function createFormDataPayload(payload, files) {
  const formData = new FormData();
  formData.append('payload_json', JSON.stringify(payload));

  files.forEach((file, index) => {
    formData.append(`files[${index}]`, file, `image${index}.png`);
  });

  return formData;
}

// Create multiple embeds for image gallery
function createGalleryEmbeds(baseEmbed, fileCount) {
  if (fileCount === 0) return [baseEmbed];

  const galleryUrl = 'https://discord-form.gallery';

  // First embed with all fields + first image
  const mainEmbed = {
    ...baseEmbed,
    url: galleryUrl,
    image: { url: 'attachment://image0.png' }
  };

  const embeds = [mainEmbed];

  // Additional embeds for gallery effect (same url, different images)
  for (let i = 1; i < fileCount; i++) {
    embeds.push({
      url: galleryUrl,
      image: { url: `attachment://image${i}.png` }
    });
  }

  return embeds;
}
```

**Step 2: Modify sendToDiscord to handle images**

Replace the existing `sendToDiscord` function:

```javascript
async function sendToDiscord(formData) {
  if (!currentConfig.webhookUrl) {
    return { success: false, message: 'Webhook URL не настроен' };
  }

  const customMessage = getConditionalMessage(formData);
  const hasImages = uploadedImages && uploadedImages.length > 0;

  let payload;
  let fetchOptions;

  if (currentConfig.sendAsPlainText) {
    const plainTextContent = createPlainTextMessage(formData);
    const finalContent = customMessage
      ? `${customMessage}\n\n${plainTextContent}`
      : plainTextContent;

    payload = {
      content: finalContent,
      username: currentConfig.webhookUsername || currentConfig.title,
      avatar_url: currentConfig.webhookAvatarUrl || 'https://pngimg.com/uploads/discord/discord_PNG3.png',
    };

    if (hasImages) {
      fetchOptions = {
        method: 'POST',
        body: createFormDataPayload(payload, uploadedImages),
      };
    } else {
      fetchOptions = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      };
    }
  } else {
    const embed = createDiscordEmbed(formData);

    if (hasImages) {
      const embeds = createGalleryEmbeds(embed, uploadedImages.length);
      payload = {
        content: customMessage,
        embeds: embeds,
        username: currentConfig.webhookUsername || currentConfig.title,
        avatar_url: currentConfig.webhookAvatarUrl || 'https://pngimg.com/uploads/discord/discord_PNG3.png',
      };
      fetchOptions = {
        method: 'POST',
        body: createFormDataPayload(payload, uploadedImages),
      };
    } else {
      payload = {
        content: customMessage,
        embeds: [embed],
        username: currentConfig.webhookUsername || currentConfig.title,
        avatar_url: currentConfig.webhookAvatarUrl || 'https://pngimg.com/uploads/discord/discord_PNG3.png',
      };
      fetchOptions = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      };
    }
  }

  try {
    const response = await fetch(currentConfig.webhookUrl, fetchOptions);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`HTTP ${response.status}: ${errorData.message || 'Неизвестная ошибка'}`);
    }

    // Handle custom webhooks (existing code)
    const customWebhookFields = currentConfig.fields.filter(
      (field) => field.customWebhook && field.customWebhook.enabled
    );

    if (customWebhookFields.length > 0) {
      const customWebhookPromises = [];

      customWebhookFields.forEach((field) => {
        const webhookUrl = field.customWebhook.url || currentConfig.webhookUrl;

        if (
          field.customWebhook.splitLines &&
          (field.type === 'textarea' || field.type === 'computed') &&
          formData[field.id]
        ) {
          const lines = formData[field.id].split('\n').filter((line) => line.trim() !== '');

          lines.forEach((line, index) => {
            const linePayload = {
              content: line,
              username: currentConfig.webhookUsername || currentConfig.title,
              avatar_url: currentConfig.webhookAvatarUrl || 'https://pngimg.com/uploads/discord/discord_PNG3.png',
            };

            customWebhookPromises.push(
              fetch(webhookUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(linePayload),
              }).catch((error) => {
                console.error(`Ошибка отправки строки ${index + 1} поля ${field.label}:`, error);
              })
            );
          });
        } else if (field.customWebhook.url) {
          customWebhookPromises.push(
            fetch(webhookUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload),
            }).catch((error) => {
              console.error(`Ошибка отправки на кастомный webhook поля ${field.label}:`, error);
            })
          );
        }
      });

      await Promise.allSettled(customWebhookPromises);
    }

    return { success: true, message: 'Сообщение успешно отправлено! 🎉' };
  } catch (error) {
    console.error('Ошибка отправки в Discord:', error);
    return {
      success: false,
      message: `Ошибка при отправке: ${error.message}. Попробуйте еще раз.`,
    };
  }
}
```

**Step 3: Commit**

```bash
git add js/discord.js
git commit -m "feat: send images via FormData with gallery embeds"
```

---

## Task 8: Fix Move Up/Down to Keep Image Field at End

**Files:**
- Modify: `js/editor.js:546-572` (moveUpBtn and moveDownBtn handlers)

**Step 1: Modify moveUpBtn handler**

Update the moveUpBtn click handler to prevent moving above image field:

```javascript
moveUpBtn.addEventListener('click', () => {
  const currentIndex = currentConfig.fields.findIndex((f) => f.id === field.id);
  if (currentIndex > 0) {
    // Don't allow moving image field up (it should stay at end)
    if (field.type === 'image') return;

    // Don't allow moving a field above if there's an image field at the end
    const prevField = currentConfig.fields[currentIndex - 1];

    [currentConfig.fields[currentIndex - 1], currentConfig.fields[currentIndex]] = [
      currentConfig.fields[currentIndex],
      currentConfig.fields[currentIndex - 1],
    ];

    rebuildFieldsList();
    updateConfigFromEditor();
    renderForm();
  }
});
```

**Step 2: Modify moveDownBtn handler**

Update the moveDownBtn click handler to prevent moving below image field:

```javascript
moveDownBtn.addEventListener('click', () => {
  const currentIndex = currentConfig.fields.findIndex((f) => f.id === field.id);
  if (currentIndex < currentConfig.fields.length - 1) {
    // Don't allow moving below image field (it should stay at end)
    const nextField = currentConfig.fields[currentIndex + 1];
    if (nextField.type === 'image') return;

    [currentConfig.fields[currentIndex], currentConfig.fields[currentIndex + 1]] = [
      currentConfig.fields[currentIndex + 1],
      currentConfig.fields[currentIndex],
    ];

    rebuildFieldsList();
    updateConfigFromEditor();
    renderForm();
  }
});
```

**Step 3: Commit**

```bash
git add js/editor.js
git commit -m "fix: prevent reordering image field from end position"
```

---

## Task 9: Update rebuildFieldsList to Call updateImageFieldButtonVisibility

**Files:**
- Modify: `js/editor.js:924-930` (rebuildFieldsList function)

**Step 1: Add visibility update call**

```javascript
function rebuildFieldsList() {
  fieldsList.innerHTML = '';
  currentConfig.fields.forEach((field) => {
    addFieldToEditor(field);
  });
  updateImageFieldButtonVisibility();
}
```

**Step 2: Commit**

```bash
git add js/editor.js
git commit -m "fix: update image field button visibility on rebuild"
```

---

## Task 10: Test Full Flow

**Step 1: Manual testing checklist**

1. Open app with `?mode=editor`
2. Verify "Добавить поле для картинок" button appears
3. Click it - verify image field card appears, button disappears
4. Configure field: change label, set maxFiles to 2, toggle required
5. Delete image field - verify button reappears
6. Add image field again
7. Try moving other fields - verify they can't go below image field
8. Switch to form view
9. Test drag & drop images onto upload zone
10. Test clicking upload zone to select files
11. Test Ctrl+V paste of screenshot
12. Verify preview shows, remove button works
13. Verify counter shows correct numbers
14. Set webhook URL, submit form
15. Check Discord - verify images appear in gallery format

**Step 2: Final commit**

```bash
git add -A
git commit -m "feat: complete image upload feature implementation"
```

---

## Summary

Total tasks: 10

Files modified:
- `index.html` - add image field button
- `js/editor.js` - image field card rendering, event handlers, button visibility
- `js/form.js` - upload zone rendering, drag/drop/paste handlers, validation
- `js/discord.js` - FormData payload, gallery embeds
- `style.css` - upload zone and preview styles

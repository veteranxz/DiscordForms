// === ФУНКЦИИ РЕДАКТОРА ===

// Update image field button visibility
function updateImageFieldButtonVisibility() {
  const addImageFieldBtn = document.getElementById("addImageFieldBtn");
  const hasImageField = currentConfig.fields.some((f) => f.type === "image");
  if (addImageFieldBtn) {
    addImageFieldBtn.style.display = hasImageField ? "none" : "block";
  }
}

// Функция для инициализации редактора
function initEditor() {
  formTitleInput.value = currentConfig.title;
  formDescriptionInput.value = currentConfig.description;
  customMessageInput.value = currentConfig.customMessage || "";
  webhookUrlInput.value = currentConfig.webhookUrl;
  webhookUsernameInput.value =
    currentConfig.webhookUsername || currentConfig.title;
  webhookAvatarUrlInput.value = currentConfig.webhookAvatarUrl || "";

  if (sendAsPlainTextCheckbox) {
    sendAsPlainTextCheckbox.checked = currentConfig.sendAsPlainText || false;
  }

  if (displayUsernameCheckbox) {
    displayUsernameCheckbox.checked =
      currentConfig.displayUsername !== undefined
        ? currentConfig.displayUsername
        : true;
  }

  // Инициализация чекбоксов отправки номеров и эмодзи
  const sendQuestionNumbersCheckbox = document.getElementById(
    "sendQuestionNumbers"
  );
  const sendEmojisCheckbox = document.getElementById("sendEmojis");
  const sendColonsCheckbox = document.getElementById("sendColons");

  if (sendQuestionNumbersCheckbox) {
    // Для старых форм считаем параметр включенным по умолчанию
    sendQuestionNumbersCheckbox.checked =
      currentConfig.sendQuestionNumbers !== undefined
        ? currentConfig.sendQuestionNumbers
        : true;
  }

  if (sendEmojisCheckbox) {
    // Для старых форм считаем параметр выключенным по умолчанию
    sendEmojisCheckbox.checked = currentConfig.sendEmojis || false;
  }

  if (sendColonsCheckbox) {
    // Для старых форм считаем параметр включенным по умолчанию
    sendColonsCheckbox.checked = currentConfig.sendColons !== false;
  }

  if (!currentConfig.conditionalMessages) {
    currentConfig.conditionalMessages = [];
  }

  if (organizationSelect) {
    organizationSelect.value = currentConfig.organization || "LSPD";
    updateOrganizationLogo(currentConfig.organization || "LSPD");
    updateFavicon(currentConfig.organization || "LSPD");
  }

  // Инициализация чекбокса расширенных настроек
  const advancedSettingsCheckbox = document.getElementById(
    "advancedSettingsCheckbox"
  );
  if (advancedSettingsCheckbox) {
    advancedSettingsCheckbox.checked =
      currentConfig.showAdvancedSettings || false;
    updateAdvancedSettingsVisibility(
      currentConfig.showAdvancedSettings || false
    );
  }

  fieldsList.innerHTML = "";
  currentConfig.fields.forEach((field) => {
    addFieldToEditor(field);
  });

  formTitleInput.addEventListener("input", updateConfigFromEditor);
  formDescriptionInput.addEventListener("input", updateConfigFromEditor);
  customMessageInput.addEventListener("input", updateConfigFromEditor);
  webhookUrlInput.addEventListener("input", updateConfigFromEditor);
  webhookUsernameInput.addEventListener("input", updateConfigFromEditor);
  webhookAvatarUrlInput.addEventListener("input", updateConfigFromEditor);

  if (sendAsPlainTextCheckbox) {
    sendAsPlainTextCheckbox.addEventListener("change", updateConfigFromEditor);
  }

  if (displayUsernameCheckbox) {
    displayUsernameCheckbox.addEventListener("change", updateConfigFromEditor);
  }

  // Обработчики для чекбоксов отправки номеров и эмодзи
  if (sendQuestionNumbersCheckbox) {
    sendQuestionNumbersCheckbox.addEventListener("change", (e) => {
      currentConfig.sendQuestionNumbers = e.target.checked;
      updateConfigFromEditor();
    });
  }

  if (sendEmojisCheckbox) {
    sendEmojisCheckbox.addEventListener("change", (e) => {
      currentConfig.sendEmojis = e.target.checked;
      updateConfigFromEditor();
    });
  }

  if (sendColonsCheckbox) {
    sendColonsCheckbox.addEventListener("change", (e) => {
      currentConfig.sendColons = e.target.checked;
      updateConfigFromEditor();
    });
  }

  if (organizationSelect) {
    organizationSelect.addEventListener("change", (e) => {
      currentConfig.organization = e.target.value;
      updateOrganizationLogo(e.target.value);
      updateFavicon(e.target.value);
      updateConfigFromEditor();
    });
  }

  if (lightThemeBtn) {
    lightThemeBtn.addEventListener("click", () => toggleTheme("light"));
  }
  if (darkThemeBtn) {
    darkThemeBtn.addEventListener("click", () => toggleTheme("dark"));
  }

  // Обработчик чекбокса расширенных настроек
  if (advancedSettingsCheckbox) {
    advancedSettingsCheckbox.addEventListener("change", (e) => {
      currentConfig.showAdvancedSettings = e.target.checked;
      updateAdvancedSettingsVisibility(e.target.checked);
      updateConfigFromEditor();
    });
  }

  addFieldBtn.addEventListener("click", () => {
    const newField = {
      id: generateId(),
      type: "text",
      label: "Новое поле",
      placeholder: "",
      required: false,
      icon: "question",
    };

    // Insert before image field if it exists (image field must stay at end)
    const imageFieldIndex = currentConfig.fields.findIndex(
      (f) => f.type === "image"
    );
    if (imageFieldIndex !== -1) {
      currentConfig.fields.splice(imageFieldIndex, 0, newField);
      rebuildFieldsList();
    } else {
      currentConfig.fields.push(newField);
      addFieldToEditor(newField);
    }

    updateConfigFromEditor();
    renderForm();
  });

  // Image field button handler
  const addImageFieldBtn = document.getElementById("addImageFieldBtn");

  if (addImageFieldBtn) {
    addImageFieldBtn.addEventListener("click", () => {
      const newField = {
        id: generateId(),
        type: "image",
        label: "Прикрепите скриншоты",
        required: false,
        maxFiles: 10,
      };
      currentConfig.fields.push(newField);
      addFieldToEditor(newField);
      updateImageFieldButtonVisibility();
      updateConfigFromEditor();
      renderForm();
    });
  }

  updateImageFieldButtonVisibility();

  if (!currentConfig.conditionalMessages) {
    currentConfig.conditionalMessages = [];
  }
  conditionalMessagesList.innerHTML = "";
  currentConfig.conditionalMessages.forEach((condMsg) => {
    addConditionalMessageToEditor(condMsg);
  });

  addConditionalMessageBtn.addEventListener("click", () => {
    const newCondMsg = {
      id: generateId(),
      field: "",
      value: "",
      message: "",
    };
    currentConfig.conditionalMessages.push(newCondMsg);
    addConditionalMessageToEditor(newCondMsg);
    updateConfigFromEditor();
  });

  generateUrlBtn.addEventListener("click", generateAndCopyShareUrl);
}

// Функция для добавления поля в редактор
function addFieldToEditor(field) {
  const fieldItem = document.createElement("div");
  fieldItem.className = "field-item";
  fieldItem.dataset.fieldId = field.id;

  // Special rendering for image field
  if (field.type === "image") {
    fieldItem.innerHTML = `
      <div class="field-header">
        <div class="field-header-left">
          <span class="field-title">🖼️ ${field.label}</span>
          <label class="field-required-inline">
            <input type="checkbox" class="field-required" ${
              field.required ? "checked" : ""
            } />
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
            <option value="1" ${
              field.maxFiles === 1 ? "selected" : ""
            }>1</option>
            <option value="2" ${
              field.maxFiles === 2 ? "selected" : ""
            }>2</option>
            <option value="3" ${
              field.maxFiles === 3 ? "selected" : ""
            }>3</option>
            <option value="4" ${
              field.maxFiles === 4 ? "selected" : ""
            }>4</option>
            <option value="5" ${
              field.maxFiles === 5 ? "selected" : ""
            }>5</option>
            <option value="6" ${
              field.maxFiles === 6 ? "selected" : ""
            }>6</option>
            <option value="7" ${
              field.maxFiles === 7 ? "selected" : ""
            }>7</option>
            <option value="8" ${
              field.maxFiles === 8 ? "selected" : ""
            }>8</option>
            <option value="9" ${
              field.maxFiles === 9 ? "selected" : ""
            }>9</option>
            <option value="10" ${
              field.maxFiles === 10 ? "selected" : ""
            }>10</option>
          </select>
        </div>
        <div class="field-config-item field-conditional-container" style="grid-column: 1 / -1; display: ${
          currentConfig.showAdvancedSettings ? "block" : "none"
        };">
          <div class="conditional-section-header">
            <label class="conditional-checkbox-label-header">
              <input type="checkbox" class="conditional-enabled-checkbox" ${
                field.conditional && field.conditional.enabled ? "checked" : ""
              } />
              <span>Условная видимость</span>
            </label>
            <i class="fas fa-chevron-down conditional-toggle-icon ${
              field.conditional && field.conditional.enabled ? "open" : ""
            }"></i>
          </div>
          <div class="conditional-config" style="display: ${
            field.conditional && field.conditional.enabled ? "block" : "none"
          };">
            <div class="conditional-hint">Показывать это поле только если выполняются все условия:</div>
            <div class="conditional-conditions-list"></div>
            <button type="button" class="add-conditional-condition-btn" ${
              field.conditional && field.conditional.enabled ? "" : "disabled"
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

  fieldItem.innerHTML = `
    <div class="field-header">
      <div class="field-header-left">
        <span class="field-title">${
          iconMap[field.icon] || field.icon || "❓"
        } ${field.label}</span>
        <label class="field-required-inline">
          <input type="checkbox" class="field-required" ${
            field.required ? "checked" : ""
          } />
          <span>обязательное</span>
        </label>
      </div>
      <div class="field-actions">
        <button class="field-action-btn move-up" title="Переместить вверх">
          <i class="fas fa-arrow-up"></i>
        </button>
        <button class="field-action-btn move-down" title="Переместить вниз">
          <i class="fas fa-arrow-down"></i>
        </button>
        <button class="field-action-btn clone" title="Клонировать">
          <i class="fas fa-clone"></i>
        </button>
        <button class="field-action-btn delete" title="Удалить">
          <i class="fas fa-trash"></i>
        </button>
      </div>
    </div>
    <div class="field-config">
      <div class="field-config-item field-label-with-icon" style="grid-column: 1 / -1;">
        <div class="field-label-container">
          <div class="field-label-wrapper">
            <label>Название поля</label>
            <input type="text" class="field-label" value="${field.label}" />
          </div>
          <div class="field-icon-wrapper">
            <label style="visibility: hidden;">Иконка</label>
            <div class="emoji-picker-wrapper">
              <button type="button" class="emoji-picker-btn" data-field-id="${
                field.id
              }">
                <span class="emoji-display">${
                  iconMap[field.icon] || field.icon || "❓"
                }</span>
              </button>
              <emoji-picker class="emoji-picker-popup" data-field-id="${
                field.id
              }" style="display: none;"></emoji-picker>
            </div>
          </div>
        </div>
      </div>
      <div class="field-config-item">
        <label>Тип поля</label>
        <select class="field-type">
          <option value="text" ${
            field.type === "text" ? "selected" : ""
          }>Текст</option>
          <option value="email" ${
            field.type === "email" ? "selected" : ""
          }>Email</option>
          <option value="textarea" ${
            field.type === "textarea" ? "selected" : ""
          }>Текстовая область</option>
          <option value="select" ${
            field.type === "select" ? "selected" : ""
          }>Выпадающий список</option>
          <option value="radio" ${
            field.type === "radio" ? "selected" : ""
          }>Радиокнопки</option>
          <option value="checkboxes" ${
            field.type === "checkboxes" ? "selected" : ""
          }>Чекбоксы (множественный выбор)</option>
          <option value="checkbox" ${
            field.type === "checkbox" ? "selected" : ""
          }>Чекбокс</option>
          <option value="computed" ${
            field.type === "computed" ? "selected" : ""
          }>Вычисляемое поле</option>
        </select>
      </div>
      <div class="field-config-item field-placeholder-container" style="display: ${
        field.type === "checkbox" ? "none" : "block"
      };">
        <label>Placeholder</label>
        <input type="text" class="field-placeholder" value="${
          field.placeholder || ""
        }" />
      </div>
      <div class="field-config-item field-checkbox-text-container" style="display: ${
        field.type === "checkbox" ? "block" : "none"
      };">
        <label class="checkbox-text-label">
          <input type="checkbox" class="field-show-text-in-response" ${
            field.showTextInResponse !== false ? "checked" : ""
          } />
          <span>Показывать текст в ответе</span>
        </label>
      </div>
      <div class="field-config-item field-options" style="display: ${
        field.type === "select" ||
        field.type === "radio" ||
        field.type === "checkboxes"
          ? "block"
          : "none"
      };">
        <label>Варианты (через запятую)</label>
        <input type="text" class="field-options-input" value="${
          field.options ? field.options.join(", ") : ""
        }" />
      </div>
      <div class="field-config-item field-formula-container" style="display: ${
        field.type === "computed" ? "block" : "none"
      }; grid-column: 1 / -1;">
        <label>Формула</label>
        <div class="formula-editor">
          <input type="text" class="field-formula-input" value="${
            field.formula || ""
          }" placeholder="Пример: Заявка от {name} - {email,0,3}" />
          <button type="button" class="add-field-variable-btn" title="Добавить переменную">
            <i class="fas fa-plus"></i> Поле
          </button>
        </div>
        <div class="formula-hint">
          Используйте {id_поля} для значения поля.<br>
          Substring: {id_поля,start} или {id_поля,start,end}<br>
          Многострочные поля: {id_поля,count} - кол-во строк, {id_поля,line,0} - первая строка,<br>
          {id_поля,line,-1} - последняя строка, {id_поля,lines} - все строки через запятую,<br>
          {id_поля,lines,|} - все строки через указанный разделитель,<br>
          {id_поля,map,'выражение'} - применить выражение к каждой строке
        </div>
      </div>
      <div class="field-config-item field-conditional-container" style="grid-column: 1 / -1; display: ${
        currentConfig.showAdvancedSettings ? "block" : "none"
      };">
        <div class="conditional-section-header">
          <label class="conditional-checkbox-label-header">
            <input type="checkbox" class="conditional-enabled-checkbox" ${
              field.conditional && field.conditional.enabled ? "checked" : ""
            } />
            <span>Условная видимость</span>
          </label>
          <i class="fas fa-chevron-down conditional-toggle-icon ${
            field.conditional && field.conditional.enabled ? "open" : ""
          }"></i>
        </div>
        <div class="conditional-config" style="display: ${
          field.conditional && field.conditional.enabled ? "block" : "none"
        };">
          <div class="conditional-hint">Показывать это поле только если выполняются все условия:</div>
          <div class="conditional-conditions-list"></div>
          <button type="button" class="add-conditional-condition-btn" ${
            field.conditional && field.conditional.enabled ? "" : "disabled"
          }>
            <i class="fas fa-plus"></i> Добавить условие
          </button>
        </div>
      </div>
      <div class="field-config-item field-custom-webhook-container" style="grid-column: 1 / -1; display: ${
        currentConfig.showAdvancedSettings ? "block" : "none"
      };">
        <div class="custom-webhook-section-header">
          <label class="custom-webhook-checkbox-label-header">
            <input type="checkbox" class="custom-webhook-enabled-checkbox" ${
              field.customWebhook && field.customWebhook.enabled
                ? "checked"
                : ""
            } />
            <span>Кастомная отправка</span>
          </label>
          <i class="fas fa-chevron-down custom-webhook-toggle-icon ${
            field.customWebhook && field.customWebhook.enabled ? "open" : ""
          }"></i>
        </div>
        <div class="custom-webhook-config" style="display: ${
          field.customWebhook && field.customWebhook.enabled ? "block" : "none"
        };">
          <div class="custom-webhook-hint">Отправлять форму с этим полем на отдельный webhook:</div>
          <input type="url" class="custom-webhook-url-input" value="${
            field.customWebhook && field.customWebhook.url
              ? field.customWebhook.url
              : ""
          }" placeholder="https://discord.com/api/webhooks/..." ${
    field.customWebhook && field.customWebhook.enabled ? "" : "disabled"
  } />
          <label class="custom-webhook-split-lines" style="display: ${
            field.type === "textarea" || field.type === "computed"
              ? "flex"
              : "none"
          };">
            <input type="checkbox" class="custom-webhook-split-lines-checkbox" ${
              field.customWebhook && field.customWebhook.splitLines
                ? "checked"
                : ""
            } ${
    field.customWebhook && field.customWebhook.enabled ? "" : "disabled"
  } />
            <span>Каждая строка отдельным сообщением</span>
          </label>
        </div>
      </div>
    </div>
  `;

  setupFieldEventHandlers(fieldItem, field);
  fieldsList.appendChild(fieldItem);
}

// Функция для настройки обработчиков событий поля
function setupFieldEventHandlers(fieldItem, field) {
  const fieldHeader = fieldItem.querySelector(".field-header");
  const cloneBtn = fieldItem.querySelector(".clone");
  const deleteBtn = fieldItem.querySelector(".delete");
  const moveUpBtn = fieldItem.querySelector(".move-up");
  const moveDownBtn = fieldItem.querySelector(".move-down");
  const typeSelect = fieldItem.querySelector(".field-type");
  const labelInput = fieldItem.querySelector(".field-label");
  const placeholderInput = fieldItem.querySelector(".field-placeholder");
  const emojiPickerBtn = fieldItem.querySelector(".emoji-picker-btn");
  const emojiPickerPopup = fieldItem.querySelector("emoji-picker");
  const emojiDisplay = fieldItem.querySelector(".emoji-display");
  const requiredCheckbox = fieldItem.querySelector(".field-required");
  const optionsContainer = fieldItem.querySelector(".field-options");
  const optionsInput = fieldItem.querySelector(".field-options-input");
  const formulaContainer = fieldItem.querySelector(".field-formula-container");
  const formulaInput = fieldItem.querySelector(".field-formula-input");
  const addVariableBtn = fieldItem.querySelector(".add-field-variable-btn");
  const placeholderContainer = fieldItem.querySelector(
    ".field-placeholder-container"
  );
  const checkboxTextContainer = fieldItem.querySelector(
    ".field-checkbox-text-container"
  );
  const showTextInResponseCheckbox = fieldItem.querySelector(
    ".field-show-text-in-response"
  );
  const conditionalSectionHeader = fieldItem.querySelector(
    ".conditional-section-header"
  );
  const conditionalToggleIcon = fieldItem.querySelector(
    ".conditional-toggle-icon"
  );
  const conditionalConfig = fieldItem.querySelector(".conditional-config");
  const conditionalEnabledCheckbox = fieldItem.querySelector(
    ".conditional-enabled-checkbox"
  );
  const conditionalConditionsList = fieldItem.querySelector(
    ".conditional-conditions-list"
  );
  const addConditionBtn = fieldItem.querySelector(
    ".add-conditional-condition-btn"
  );
  const customWebhookSectionHeader = fieldItem.querySelector(
    ".custom-webhook-section-header"
  );
  const customWebhookToggleIcon = fieldItem.querySelector(
    ".custom-webhook-toggle-icon"
  );
  const customWebhookConfig = fieldItem.querySelector(".custom-webhook-config");
  const customWebhookEnabledCheckbox = fieldItem.querySelector(
    ".custom-webhook-enabled-checkbox"
  );
  const customWebhookUrlInput = fieldItem.querySelector(
    ".custom-webhook-url-input"
  );
  const customWebhookSplitLinesLabel = fieldItem.querySelector(
    ".custom-webhook-split-lines"
  );
  const customWebhookSplitLinesCheckbox = fieldItem.querySelector(
    ".custom-webhook-split-lines-checkbox"
  );

  // Инициализация структуры условий (миграция со старого формата)
  if (
    field.conditional &&
    field.conditional.enabled &&
    !field.conditional.conditions
  ) {
    if (field.conditional.field) {
      field.conditional.conditions = [
        {
          field: field.conditional.field,
          value: field.conditional.value || "",
        },
      ];
    } else {
      field.conditional.conditions = [];
    }
  }

  function renderConditionalConditions() {
    if (!conditionalConditionsList) return;

    conditionalConditionsList.innerHTML = "";

    const isEnabled = field.conditional && field.conditional.enabled;
    const conditions =
      (field.conditional && field.conditional.conditions) || [];

    conditions.forEach((condition, index) => {
      const conditionItem = document.createElement("div");
      conditionItem.className = "conditional-condition-item";
      conditionItem.dataset.conditionIndex = index;

      const conditionRow = document.createElement("div");
      conditionRow.className = "conditional-row";

      const fieldSelect = document.createElement("select");
      fieldSelect.className = "conditional-field-select";
      fieldSelect.disabled = !isEnabled;
      fieldSelect.innerHTML = '<option value="">Выберите поле...</option>';

      currentConfig.fields.forEach((f) => {
        if (
          f.id !== field.id &&
          (f.type === "select" || f.type === "radio" || f.type === "checkboxes")
        ) {
          const option = document.createElement("option");
          option.value = f.id;
          option.textContent = f.label;
          if (condition.field === f.id) {
            option.selected = true;
          }
          fieldSelect.appendChild(option);
        }
      });

      const valueContainer = document.createElement("div");
      valueContainer.className = "conditional-value-container";

      fieldSelect.addEventListener("change", (e) => {
        condition.field = e.target.value;
        condition.value = "";
        updateConditionValueContainer(valueContainer, condition, isEnabled);
        updateConfigFromEditor();
        renderForm();
      });

      conditionRow.appendChild(fieldSelect);
      conditionRow.appendChild(document.createTextNode(" включает "));
      conditionRow.appendChild(valueContainer);

      const deleteBtn = document.createElement("button");
      deleteBtn.type = "button";
      deleteBtn.className = "field-action-btn delete";
      deleteBtn.title = "Удалить условие";
      deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
      deleteBtn.disabled = !isEnabled;
      deleteBtn.addEventListener("click", () => {
        conditions.splice(index, 1);
        renderConditionalConditions();
        updateConfigFromEditor();
        renderForm();
      });

      conditionItem.appendChild(conditionRow);
      conditionItem.appendChild(deleteBtn);
      conditionalConditionsList.appendChild(conditionItem);

      if (condition.field) {
        updateConditionValueContainer(valueContainer, condition, isEnabled);
      }
    });
  }

  function updateConditionValueContainer(container, condition, isEnabled) {
    if (!container) return;

    const selectedField = currentConfig.fields.find(
      (f) => f.id === condition.field
    );

    if (
      !selectedField ||
      !selectedField.options ||
      selectedField.options.length === 0
    ) {
      const input = document.createElement("input");
      input.type = "text";
      input.className = "conditional-value-input";
      input.value = condition.value || "";
      input.placeholder = "Значение";
      input.disabled = !isEnabled;

      input.addEventListener("input", (e) => {
        condition.value = e.target.value;
        updateConfigFromEditor();
        renderForm();
      });

      container.innerHTML = "";
      container.appendChild(input);
      return;
    }

    const checkboxContainer = document.createElement("div");
    checkboxContainer.className = "conditional-checkboxes";

    let currentValues = [];
    if (condition.value) {
      try {
        currentValues = JSON.parse(condition.value);
        if (!Array.isArray(currentValues)) {
          currentValues = [condition.value];
        }
      } catch (e) {
        currentValues = [condition.value];
      }
    }

    selectedField.options.forEach((opt) => {
      const label = document.createElement("label");
      label.className = "conditional-checkbox-label";

      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.value = opt;
      checkbox.checked = currentValues.includes(opt);
      checkbox.disabled = !isEnabled;

      checkbox.addEventListener("change", () => {
        const allCheckboxes = checkboxContainer.querySelectorAll(
          'input[type="checkbox"]'
        );
        const selectedValues = Array.from(allCheckboxes)
          .filter((cb) => cb.checked)
          .map((cb) => cb.value);

        condition.value = JSON.stringify(selectedValues);
        updateConfigFromEditor();
        renderForm();
      });

      label.appendChild(checkbox);
      label.appendChild(document.createTextNode(" " + opt));
      checkboxContainer.appendChild(label);
    });

    container.innerHTML = "";
    container.appendChild(checkboxContainer);
  }

  renderConditionalConditions();

  fieldHeader.addEventListener("click", (e) => {
    // Игнорируем клики по кнопкам и чекбоксу
    if (
      e.target.closest(".field-actions") ||
      e.target.closest(".field-required-inline")
    ) {
      return;
    }
    const config = fieldItem.querySelector(".field-config");
    config.style.display = config.style.display === "none" ? "grid" : "none";
  });

  cloneBtn.addEventListener("click", () => {
    const currentIndex = currentConfig.fields.findIndex(
      (f) => f.id === field.id
    );

    // Создаем глубокую копию поля
    const clonedField = JSON.parse(JSON.stringify(field));
    clonedField.id = generateId();
    clonedField.label = field.label + " (копия)";

    // Вставляем клонированное поле после текущего
    currentConfig.fields.splice(currentIndex + 1, 0, clonedField);

    rebuildFieldsList();

    // Если клонировали селект/радио/чекбоксы, обновляем селекты полей
    if (
      field.type === "select" ||
      field.type === "radio" ||
      field.type === "checkboxes"
    ) {
      rebuildConditionalFieldSelects();
    }

    updateConfigFromEditor();
    renderForm();
  });

  deleteBtn.addEventListener("click", () => {
    if (confirm("Удалить это поле?")) {
      const wasSelectOrRadio =
        field.type === "select" ||
        field.type === "radio" ||
        field.type === "checkboxes";
      const wasImageField = field.type === "image";

      currentConfig.fields = currentConfig.fields.filter(
        (f) => f.id !== field.id
      );
      fieldItem.remove();

      // Если удалили селект/радио, обновляем селекты полей
      if (wasSelectOrRadio) {
        rebuildConditionalFieldSelects();
      }

      // Если удалили image field, показываем кнопку добавления
      if (wasImageField) {
        updateImageFieldButtonVisibility();
      }

      updateConfigFromEditor();
      renderForm();
    }
  });

  moveUpBtn.addEventListener("click", () => {
    const currentIndex = currentConfig.fields.findIndex(
      (f) => f.id === field.id
    );
    if (currentIndex > 0) {
      // Don't allow moving image field up (it should stay at end)
      if (field.type === "image") return;

      [
        currentConfig.fields[currentIndex - 1],
        currentConfig.fields[currentIndex],
      ] = [
        currentConfig.fields[currentIndex],
        currentConfig.fields[currentIndex - 1],
      ];

      rebuildFieldsList();
      updateConfigFromEditor();
      renderForm();
    }
  });

  moveDownBtn.addEventListener("click", () => {
    const currentIndex = currentConfig.fields.findIndex(
      (f) => f.id === field.id
    );
    if (currentIndex < currentConfig.fields.length - 1) {
      // Don't allow moving below image field (it should stay at end)
      const nextField = currentConfig.fields[currentIndex + 1];
      if (nextField.type === "image") return;

      [
        currentConfig.fields[currentIndex],
        currentConfig.fields[currentIndex + 1],
      ] = [
        currentConfig.fields[currentIndex + 1],
        currentConfig.fields[currentIndex],
      ];

      rebuildFieldsList();
      updateConfigFromEditor();
      renderForm();
    }
  });

  typeSelect.addEventListener("change", (e) => {
    const newType = e.target.value;
    const oldType = field.type;
    field.type = newType;
    optionsContainer.style.display =
      newType === "select" || newType === "radio" || newType === "checkboxes"
        ? "block"
        : "none";
    if (formulaContainer) {
      formulaContainer.style.display =
        newType === "computed" ? "block" : "none";
    }
    if (customWebhookSplitLinesLabel) {
      customWebhookSplitLinesLabel.style.display =
        newType === "textarea" || newType === "computed" ? "flex" : "none";
    }
    if (placeholderContainer) {
      placeholderContainer.style.display =
        newType === "checkbox" ? "none" : "block";
    }
    if (checkboxTextContainer) {
      checkboxTextContainer.style.display =
        newType === "checkbox" ? "block" : "none";
    }

    // Если изменился тип на select/radio/checkboxes или с select/radio/checkboxes, обновляем селекты полей
    const wasSelectOrRadio =
      oldType === "select" || oldType === "radio" || oldType === "checkboxes";
    const isSelectOrRadio =
      newType === "select" || newType === "radio" || newType === "checkboxes";
    if (wasSelectOrRadio !== isSelectOrRadio) {
      rebuildConditionalFieldSelects();
    }

    updateConfigFromEditor();
    renderForm();
  });

  labelInput.addEventListener("input", (e) => {
    field.label = e.target.value;
    fieldItem.querySelector(".field-title").textContent = `${
      iconMap[field.icon] || field.icon || "❓"
    } ${field.label}`;

    // Если это селект или радио или чекбоксы, обновляем селекты полей (чтобы новое название отобразилось)
    if (
      field.type === "select" ||
      field.type === "radio" ||
      field.type === "checkboxes"
    ) {
      rebuildConditionalFieldSelects();
    }

    updateConfigFromEditor();
    renderForm();
  });

  placeholderInput.addEventListener("input", (e) => {
    field.placeholder = e.target.value;
    updateConfigFromEditor();
    renderForm();
  });

  if (showTextInResponseCheckbox) {
    showTextInResponseCheckbox.addEventListener("change", (e) => {
      field.showTextInResponse = e.target.checked;
      updateConfigFromEditor();
    });
  }

  // Emoji picker button click handler
  if (emojiPickerBtn && emojiPickerPopup) {
    emojiPickerBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      // Close other emoji pickers
      document.querySelectorAll("emoji-picker").forEach((popup) => {
        if (popup !== emojiPickerPopup) {
          popup.style.display = "none";
        }
      });
      // Toggle current picker
      const isVisible = emojiPickerPopup.style.display === "block";
      emojiPickerPopup.style.display = isVisible ? "none" : "block";
    });

    // Emoji picker selection handler
    emojiPickerPopup.addEventListener("emoji-click", (e) => {
      e.stopPropagation();
      // Try different possible properties for emoji value
      const selectedEmoji =
        e.detail.unicode ||
        e.detail.emoji?.unicode ||
        e.detail.native ||
        e.detail.emoji ||
        "❓";
      field.icon = selectedEmoji;
      if (emojiDisplay) {
        emojiDisplay.textContent = selectedEmoji;
      }
      fieldItem.querySelector(
        ".field-title"
      ).textContent = `${selectedEmoji} ${field.label}`;
      emojiPickerPopup.style.display = "none";
      updateConfigFromEditor();
      renderForm();
    });

    // Close emoji picker when clicking outside
    document.addEventListener("click", (e) => {
      if (
        !emojiPickerBtn.contains(e.target) &&
        !emojiPickerPopup.contains(e.target)
      ) {
        emojiPickerPopup.style.display = "none";
      }
    });
  }

  requiredCheckbox.addEventListener("change", (e) => {
    field.required = e.target.checked;
    updateConfigFromEditor();
    renderForm();
  });

  optionsInput.addEventListener("input", (e) => {
    field.options = e.target.value
      .split(",")
      .map((opt) => opt.trim())
      .filter((opt) => opt);

    updateConfigFromEditor();
    renderForm();
  });

  optionsInput.addEventListener("blur", () => {
    rebuildConditionalSelects(field.id);
  });

  if (formulaInput) {
    formulaInput.addEventListener("input", (e) => {
      field.formula = e.target.value;
      updateConfigFromEditor();
      renderForm();
    });
  }

  conditionalSectionHeader.addEventListener("click", (e) => {
    // Игнорируем клики по чекбоксу
    if (
      e.target === conditionalEnabledCheckbox ||
      e.target.closest(".conditional-checkbox-label-header")
    ) {
      return;
    }

    const isCurrentlyOpen = conditionalConfig.style.display === "block";
    const newState = !isCurrentlyOpen;

    conditionalConfig.style.display = newState ? "block" : "none";
    conditionalToggleIcon.classList.toggle("open", newState);
  });

  conditionalEnabledCheckbox.addEventListener("change", (e) => {
    const isEnabled = e.target.checked;

    if (isEnabled) {
      if (!field.conditional) {
        field.conditional = { enabled: true, conditions: [] };
      } else {
        field.conditional.enabled = true;
        if (!field.conditional.conditions) {
          field.conditional.conditions = [];
        }
      }
      conditionalConfig.style.display = "block";
      conditionalToggleIcon.classList.add("open");
      if (addConditionBtn) addConditionBtn.disabled = false;
    } else {
      if (!field.conditional) {
        field.conditional = {};
      }
      field.conditional.enabled = false;
      if (addConditionBtn) addConditionBtn.disabled = true;
    }

    renderConditionalConditions();
    updateConfigFromEditor();
    renderForm();
  });

  if (addConditionBtn) {
    addConditionBtn.addEventListener("click", () => {
      if (!field.conditional) {
        field.conditional = { enabled: true, conditions: [] };
      }
      if (!field.conditional.conditions) {
        field.conditional.conditions = [];
      }
      field.conditional.conditions.push({ field: "", value: "" });
      renderConditionalConditions();
      updateConfigFromEditor();
      renderForm();
    });
  }

  customWebhookSectionHeader.addEventListener("click", (e) => {
    // Игнорируем клики по чекбоксу
    if (
      e.target === customWebhookEnabledCheckbox ||
      e.target.closest(".custom-webhook-checkbox-label-header")
    ) {
      return;
    }

    const isCurrentlyOpen = customWebhookConfig.style.display === "block";
    const newState = !isCurrentlyOpen;

    customWebhookConfig.style.display = newState ? "block" : "none";
    customWebhookToggleIcon.classList.toggle("open", newState);
  });

  customWebhookEnabledCheckbox.addEventListener("change", (e) => {
    const isEnabled = e.target.checked;

    if (isEnabled) {
      field.customWebhook = {
        enabled: true,
        url: customWebhookUrlInput.value || "",
        splitLines: field.customWebhook
          ? field.customWebhook.splitLines
          : false,
      };
      customWebhookConfig.style.display = "block";
      customWebhookToggleIcon.classList.add("open");
      customWebhookUrlInput.disabled = false;
      if (customWebhookSplitLinesCheckbox) {
        customWebhookSplitLinesCheckbox.disabled = false;
      }
    } else {
      if (!field.customWebhook) {
        field.customWebhook = {};
      }
      field.customWebhook.enabled = false;
      customWebhookUrlInput.disabled = true;
      if (customWebhookSplitLinesCheckbox) {
        customWebhookSplitLinesCheckbox.disabled = true;
      }
    }

    updateConfigFromEditor();
    renderForm();
  });

  customWebhookUrlInput.addEventListener("input", (e) => {
    if (!field.customWebhook) {
      field.customWebhook = { enabled: true };
    }
    field.customWebhook.url = e.target.value;
    updateConfigFromEditor();
    renderForm();
  });

  if (customWebhookSplitLinesCheckbox) {
    customWebhookSplitLinesCheckbox.addEventListener("change", (e) => {
      if (!field.customWebhook) {
        field.customWebhook = { enabled: true };
      }
      field.customWebhook.splitLines = e.target.checked;
      updateConfigFromEditor();
      renderForm();
    });
  }

  if (addVariableBtn) {
    addVariableBtn.addEventListener("click", () => {
      showFieldVariablePopup(field, formulaInput);
    });
  }
}

// Event handlers for image field card
function setupImageFieldEventHandlers(fieldItem, field) {
  const fieldHeader = fieldItem.querySelector(".field-header");
  const deleteBtn = fieldItem.querySelector(".delete");
  const labelInput = fieldItem.querySelector(".field-label");
  const requiredCheckbox = fieldItem.querySelector(".field-required");
  const maxFilesSelect = fieldItem.querySelector(".field-max-files");
  const conditionalSectionHeader = fieldItem.querySelector(
    ".conditional-section-header"
  );
  const conditionalToggleIcon = fieldItem.querySelector(
    ".conditional-toggle-icon"
  );
  const conditionalConfig = fieldItem.querySelector(".conditional-config");
  const conditionalEnabledCheckbox = fieldItem.querySelector(
    ".conditional-enabled-checkbox"
  );
  const conditionalConditionsList = fieldItem.querySelector(
    ".conditional-conditions-list"
  );
  const addConditionBtn = fieldItem.querySelector(
    ".add-conditional-condition-btn"
  );

  // Initialize conditions structure
  if (
    field.conditional &&
    field.conditional.enabled &&
    !field.conditional.conditions
  ) {
    field.conditional.conditions = [];
  }

  function renderConditionalConditions() {
    if (!conditionalConditionsList) return;
    conditionalConditionsList.innerHTML = "";

    const isEnabled = field.conditional && field.conditional.enabled;
    const conditions =
      (field.conditional && field.conditional.conditions) || [];

    conditions.forEach((condition, index) => {
      const conditionItem = document.createElement("div");
      conditionItem.className = "conditional-condition-item";

      const conditionRow = document.createElement("div");
      conditionRow.className = "conditional-row";

      const fieldSelect = document.createElement("select");
      fieldSelect.className = "conditional-field-select";
      fieldSelect.disabled = !isEnabled;
      fieldSelect.innerHTML = '<option value="">Выберите поле...</option>';

      currentConfig.fields.forEach((f) => {
        if (
          f.id !== field.id &&
          (f.type === "select" || f.type === "radio" || f.type === "checkboxes")
        ) {
          const option = document.createElement("option");
          option.value = f.id;
          option.textContent = f.label;
          if (condition.field === f.id) option.selected = true;
          fieldSelect.appendChild(option);
        }
      });

      const valueInput = document.createElement("input");
      valueInput.type = "text";
      valueInput.className = "conditional-value-input";
      valueInput.value = condition.value || "";
      valueInput.placeholder = "Значение";
      valueInput.disabled = !isEnabled;

      fieldSelect.addEventListener("change", (e) => {
        condition.field = e.target.value;
        updateConfigFromEditor();
        renderForm();
      });

      valueInput.addEventListener("input", (e) => {
        condition.value = e.target.value;
        updateConfigFromEditor();
        renderForm();
      });

      const deleteCondBtn = document.createElement("button");
      deleteCondBtn.type = "button";
      deleteCondBtn.className = "field-action-btn delete";
      deleteCondBtn.innerHTML = '<i class="fas fa-trash"></i>';
      deleteCondBtn.disabled = !isEnabled;
      deleteCondBtn.addEventListener("click", () => {
        conditions.splice(index, 1);
        renderConditionalConditions();
        updateConfigFromEditor();
        renderForm();
      });

      conditionRow.appendChild(fieldSelect);
      conditionRow.appendChild(document.createTextNode(" = "));
      conditionRow.appendChild(valueInput);
      conditionItem.appendChild(conditionRow);
      conditionItem.appendChild(deleteCondBtn);
      conditionalConditionsList.appendChild(conditionItem);
    });
  }

  renderConditionalConditions();

  fieldHeader.addEventListener("click", (e) => {
    if (
      e.target.closest(".field-actions") ||
      e.target.closest(".field-required-inline")
    )
      return;
    const config = fieldItem.querySelector(".field-config");
    config.style.display = config.style.display === "none" ? "grid" : "none";
  });

  deleteBtn.addEventListener("click", () => {
    if (confirm("Удалить это поле?")) {
      currentConfig.fields = currentConfig.fields.filter(
        (f) => f.id !== field.id
      );
      fieldItem.remove();
      updateImageFieldButtonVisibility();
      updateConfigFromEditor();
      renderForm();
    }
  });

  labelInput.addEventListener("input", (e) => {
    field.label = e.target.value;
    fieldItem.querySelector(".field-title").textContent = `🖼️ ${field.label}`;
    updateConfigFromEditor();
    renderForm();
  });

  requiredCheckbox.addEventListener("change", (e) => {
    field.required = e.target.checked;
    updateConfigFromEditor();
    renderForm();
  });

  maxFilesSelect.addEventListener("change", (e) => {
    field.maxFiles = parseInt(e.target.value, 10);
    updateConfigFromEditor();
    renderForm();
  });

  if (conditionalSectionHeader) {
    conditionalSectionHeader.addEventListener("click", (e) => {
      if (
        e.target === conditionalEnabledCheckbox ||
        e.target.closest(".conditional-checkbox-label-header")
      )
        return;
      const isCurrentlyOpen = conditionalConfig.style.display === "block";
      conditionalConfig.style.display = isCurrentlyOpen ? "none" : "block";
      conditionalToggleIcon.classList.toggle("open", !isCurrentlyOpen);
    });
  }

  if (conditionalEnabledCheckbox) {
    conditionalEnabledCheckbox.addEventListener("change", (e) => {
      const isEnabled = e.target.checked;
      if (isEnabled) {
        if (!field.conditional)
          field.conditional = { enabled: true, conditions: [] };
        else {
          field.conditional.enabled = true;
          if (!field.conditional.conditions) field.conditional.conditions = [];
        }
        conditionalConfig.style.display = "block";
        conditionalToggleIcon.classList.add("open");
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
    addConditionBtn.addEventListener("click", () => {
      if (!field.conditional)
        field.conditional = { enabled: true, conditions: [] };
      if (!field.conditional.conditions) field.conditional.conditions = [];
      field.conditional.conditions.push({ field: "", value: "" });
      renderConditionalConditions();
      updateConfigFromEditor();
      renderForm();
    });
  }
}

// Функция для показа попапа выбора переменной
function showFieldVariablePopup(field, formulaInput) {
  const availableFields = currentConfig.fields.filter(
    (f) => f.id !== field.id && f.type !== "computed"
  );

  if (availableFields.length === 0) {
    alert("Нет доступных полей для вставки. Создайте сначала другие поля.");
    return;
  }

  const fieldSelect = document.createElement("select");
  fieldSelect.className = "temp-field-select";

  const defaultOption = document.createElement("option");
  defaultOption.value = "";
  defaultOption.textContent = "Выберите поле...";
  fieldSelect.appendChild(defaultOption);

  availableFields.forEach((f) => {
    const option = document.createElement("option");
    option.value = f.id;
    option.textContent = f.label;
    fieldSelect.appendChild(option);
  });

  const popup = document.createElement("div");
  popup.className = "field-variable-popup";
  popup.innerHTML = `
    <div class="popup-content">
      <label>Выберите поле для вставки:</label>
      <div class="popup-select-container"></div>
      <div class="substring-options">
        <div class="substring-hint">Substring (необязательно):</div>
        <div class="substring-inputs">
          <div class="substring-input-group">
            <label>Начало (start):</label>
            <input type="number" class="start-index-input" placeholder="Не указано" min="0" />
          </div>
          <div class="substring-input-group">
            <label>Конец (end):</label>
            <input type="number" class="end-index-input" placeholder="Не указано (до конца)" min="0" />
          </div>
        </div>
      </div>
      <div class="popup-buttons">
        <button type="button" class="popup-btn insert-btn">Вставить</button>
        <button type="button" class="popup-btn cancel-btn">Отмена</button>
      </div>
    </div>
  `;

  popup.querySelector(".popup-select-container").appendChild(fieldSelect);
  document.body.appendChild(popup);

  const insertBtn = popup.querySelector(".insert-btn");
  const cancelBtn = popup.querySelector(".cancel-btn");
  const startIndexInput = popup.querySelector(".start-index-input");
  const endIndexInput = popup.querySelector(".end-index-input");

  insertBtn.addEventListener("click", () => {
    const selectedFieldId = fieldSelect.value;
    if (selectedFieldId) {
      const selectedField = availableFields.find(
        (f) => f.id === selectedFieldId
      );
      if (selectedField) {
        let placeholder = `{${selectedField.id}`;

        const start = startIndexInput.value;
        const end = endIndexInput.value;

        if (start !== "") {
          placeholder += `,${start}`;
          if (end !== "") {
            placeholder += `,${end}`;
          }
        }

        placeholder += "}";

        const cursorPos = formulaInput.selectionStart;
        const textBefore = formulaInput.value.substring(0, cursorPos);
        const textAfter = formulaInput.value.substring(cursorPos);

        formulaInput.value = textBefore + placeholder + textAfter;
        formulaInput.focus();
        formulaInput.selectionStart = formulaInput.selectionEnd =
          cursorPos + placeholder.length;

        field.formula = formulaInput.value;
        updateConfigFromEditor();
        renderForm();
      }
    }
    popup.remove();
  });

  cancelBtn.addEventListener("click", () => {
    popup.remove();
  });

  popup.addEventListener("click", (e) => {
    if (e.target === popup) {
      popup.remove();
    }
  });
}

// Функция для перестроения списка полей в редакторе
function rebuildFieldsList() {
  fieldsList.innerHTML = "";
  currentConfig.fields.forEach((field) => {
    addFieldToEditor(field);
  });
  updateImageFieldButtonVisibility();
}

// Функция для обновления селектов полей в условиях (когда меняется название или тип поля)
function rebuildConditionalFieldSelects() {
  // Обновляем селекты полей в условной видимости каждого поля
  currentConfig.fields.forEach((field) => {
    if (
      field.conditional &&
      field.conditional.enabled &&
      field.conditional.conditions
    ) {
      const fieldItem = fieldsList.querySelector(
        `[data-field-id="${field.id}"]`
      );
      if (fieldItem) {
        const conditionItems = fieldItem.querySelectorAll(
          ".conditional-condition-item"
        );
        conditionItems.forEach((item, index) => {
          const condition = field.conditional.conditions[index];
          if (condition) {
            const fieldSelect = item.querySelector(".conditional-field-select");
            if (fieldSelect) {
              const currentValue = condition.field;

              fieldSelect.innerHTML =
                '<option value="">Выберите поле...</option>';

              currentConfig.fields.forEach((f) => {
                if (
                  f.id !== field.id &&
                  (f.type === "select" ||
                    f.type === "radio" ||
                    f.type === "checkboxes")
                ) {
                  const option = document.createElement("option");
                  option.value = f.id;
                  option.textContent = f.label;
                  if (currentValue === f.id) {
                    option.selected = true;
                  }
                  fieldSelect.appendChild(option);
                }
              });
            }
          }
        });
      }
    }
  });

  // Обновляем селекты полей в условных сообщениях
  if (currentConfig.conditionalMessages) {
    currentConfig.conditionalMessages.forEach((condMsg) => {
      const condMsgItem = conditionalMessagesList.querySelector(
        `[data-cond-msg-id="${condMsg.id}"]`
      );
      if (condMsgItem) {
        const fieldSelect = condMsgItem.querySelector(".condmsg-field-select");
        if (fieldSelect) {
          const currentValue = fieldSelect.value;

          fieldSelect.innerHTML = '<option value="">Выберите поле...</option>';

          currentConfig.fields.forEach((f) => {
            if (
              f.type === "select" ||
              f.type === "radio" ||
              f.type === "checkboxes"
            ) {
              const option = document.createElement("option");
              option.value = f.id;
              option.textContent = f.label;
              if (currentValue === f.id) {
                option.selected = true;
              }
              fieldSelect.appendChild(option);
            }
          });
        }
      }
    });
  }
}

// Функция для обновления только условных селектов значений (когда меняются опции поля)
function rebuildConditionalSelects(changedFieldId) {
  currentConfig.fields.forEach((field) => {
    if (
      field.conditional &&
      field.conditional.enabled &&
      field.conditional.conditions
    ) {
      const fieldItem = fieldsList.querySelector(
        `[data-field-id="${field.id}"]`
      );
      if (fieldItem) {
        // Перерисовываем все условия, которые зависят от измененного поля
        const conditionsToUpdate = field.conditional.conditions.filter(
          (cond) => cond.field === changedFieldId
        );

        if (conditionsToUpdate.length > 0) {
          // Находим все элементы условий для этого поля
          const conditionItems = fieldItem.querySelectorAll(
            ".conditional-condition-item"
          );
          conditionItems.forEach((item, index) => {
            const condition = field.conditional.conditions[index];
            if (condition && condition.field === changedFieldId) {
              const valueContainer = item.querySelector(
                ".conditional-value-container"
              );
              if (valueContainer) {
                const isEnabled = field.conditional.enabled;
                const changedField = currentConfig.fields.find(
                  (f) => f.id === changedFieldId
                );

                if (
                  changedField &&
                  changedField.options &&
                  changedField.options.length > 0
                ) {
                  const checkboxContainer = document.createElement("div");
                  checkboxContainer.className = "conditional-checkboxes";

                  let currentValues = [];
                  if (condition.value) {
                    try {
                      currentValues = JSON.parse(condition.value);
                      if (!Array.isArray(currentValues)) {
                        currentValues = [condition.value];
                      }
                    } catch (e) {
                      currentValues = [condition.value];
                    }
                  }

                  changedField.options.forEach((opt) => {
                    const label = document.createElement("label");
                    label.className = "conditional-checkbox-label";

                    const checkbox = document.createElement("input");
                    checkbox.type = "checkbox";
                    checkbox.value = opt;
                    checkbox.checked = currentValues.includes(opt);
                    checkbox.disabled = !isEnabled;

                    checkbox.addEventListener("change", () => {
                      const allCheckboxes = checkboxContainer.querySelectorAll(
                        'input[type="checkbox"]'
                      );
                      const selectedValues = Array.from(allCheckboxes)
                        .filter((cb) => cb.checked)
                        .map((cb) => cb.value);

                      condition.value = JSON.stringify(selectedValues);
                      updateConfigFromEditor();
                      renderForm();
                    });

                    label.appendChild(checkbox);
                    label.appendChild(document.createTextNode(" " + opt));
                    checkboxContainer.appendChild(label);
                  });

                  valueContainer.innerHTML = "";
                  valueContainer.appendChild(checkboxContainer);
                }
              }
            }
          });
        }
      }
    }
  });

  currentConfig.conditionalMessages.forEach((condMsg) => {
    if (condMsg.field === changedFieldId) {
      const condMsgItem = conditionalMessagesList.querySelector(
        `[data-cond-msg-id="${condMsg.id}"]`
      );
      if (condMsgItem) {
        const valueContainer = condMsgItem.querySelector(
          ".condmsg-value-container"
        );
        if (valueContainer) {
          const changedField = currentConfig.fields.find(
            (f) => f.id === changedFieldId
          );
          if (
            changedField &&
            changedField.options &&
            changedField.options.length > 0
          ) {
            // Создаем контейнер с чекбоксами
            const checkboxContainer = document.createElement("div");
            checkboxContainer.className = "conditional-checkboxes";

            // Получаем текущие выбранные значения
            let currentValues = [];
            if (condMsg.value) {
              try {
                currentValues = JSON.parse(condMsg.value);
                if (!Array.isArray(currentValues)) {
                  currentValues = [condMsg.value];
                }
              } catch (e) {
                currentValues = [condMsg.value];
              }
            }

            changedField.options.forEach((opt) => {
              const label = document.createElement("label");
              label.className = "conditional-checkbox-label";

              const checkbox = document.createElement("input");
              checkbox.type = "checkbox";
              checkbox.value = opt;
              checkbox.checked = currentValues.includes(opt);

              checkbox.addEventListener("change", () => {
                const allCheckboxes = checkboxContainer.querySelectorAll(
                  'input[type="checkbox"]'
                );
                const selectedValues = Array.from(allCheckboxes)
                  .filter((cb) => cb.checked)
                  .map((cb) => cb.value);

                condMsg.value = JSON.stringify(selectedValues);
                updateConfigFromEditor();
              });

              label.appendChild(checkbox);
              label.appendChild(document.createTextNode(" " + opt));
              checkboxContainer.appendChild(label);
            });

            valueContainer.innerHTML = "";
            valueContainer.appendChild(checkboxContainer);
          }
        }
      }
    }
  });
}

// Функция для обновления видимости расширенных настроек
function updateAdvancedSettingsVisibility(showAdvanced) {
  const conditionalContainers = document.querySelectorAll(
    ".field-conditional-container"
  );
  const customWebhookContainers = document.querySelectorAll(
    ".field-custom-webhook-container"
  );

  const displayValue = showAdvanced ? "block" : "none";

  conditionalContainers.forEach((container) => {
    container.style.display = displayValue;
  });

  customWebhookContainers.forEach((container) => {
    container.style.display = displayValue;
  });
}

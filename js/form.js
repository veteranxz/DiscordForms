// === ФУНКЦИИ РАБОТЫ С ФОРМОЙ ===

// Store uploaded images for the form
let uploadedImages = [];

// Функция для получения иконки поля (поддержка emoji и Font Awesome)
function getFieldIcon(icon) {
  if (!icon) return "";

  // Проверяем, является ли это emoji (содержит emoji символы)
  const emojiRegex =
    /[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F600}-\u{1F64F}]|[\u{1F680}-\u{1F6FF}]/u;
  if (emojiRegex.test(icon)) {
    return icon;
  }

  // Проверяем, есть ли это в iconMap (для обратной совместимости)
  if (typeof iconMap !== "undefined" && iconMap[icon]) {
    return iconMap[icon];
  }

  // Иначе используем как Font Awesome класс
  return `<i class="fas fa-${icon}"></i>`;
}

// Функция для переключения режима редактор/просмотр
function toggleEditorMode(showEditor) {
  isEditorMode = showEditor;

  if (showEditor) {
    editorPanel.classList.add("show");

    if (container) {
      container.classList.add("editor-mode");
    }

    if (formPreview) {
      formPreview.classList.add("preview");
    }
  } else {
    editorPanel.classList.remove("show");

    if (container) {
      container.classList.remove("editor-mode");
    }

    if (formPreview) {
      formPreview.classList.remove("preview");
    }
  }

  updateUrl(null, showEditor);
}

// Функция для обновления логотипа организации
function updateOrganizationLogo(organization) {
  const logoImg = document.getElementById("orgLogoImg");
  if (logoImg) {
    logoImg.src = `images/${organization}.png`;
    logoImg.alt = `${organization} Logo`;
  }
}

// Функция для обновления favicon в зависимости от организации
function updateFavicon(organization) {
  const faviconLink = document.getElementById("faviconLink");
  if (faviconLink) {
    const iconName = organization ? organization.toLowerCase() : "favicon";
    faviconLink.href = `images/favicon/${iconName}.ico`;
  }
}

// Функция для восстановления базовой структуры формы
function restoreFormStructure() {
  const formWrapper = document.querySelector(".form-wrapper");

  formWrapper.innerHTML = `
    <div id="organizationLogo" class="organization-logo">
      <img src="images/LSPD.png" alt="Organization Logo" id="orgLogoImg" />
    </div>
    <div class="vinewood-logo"></div>
    <div class="header">
      <div class="header-top">
        <h1>Связаться с нами</h1>
        <div class="form-menu">
          <button id="editFormBtn" class="edit-form-btn" title="Меню формы">
            <i class="fas fa-ellipsis-v"></i>
          </button>
          <div id="formDropdown" class="form-dropdown">
            <button class="dropdown-item" id="duplicateBtn">
              <i class="fas fa-copy"></i>
              Дублировать и настроить
            </button>
          </div>
        </div>
      </div>
      <p>Заполните форму и мы свяжемся с вами в ближайшее время</p>
    </div>

    <form id="contactForm" class="contact-form">
      <button type="submit" class="submit-btn">
        <span class="btn-text">Отправить сообщение</span>
        <i class="fas fa-arrow-right"></i>
      </button>
    </form>

    <div id="response" class="response-message"></div>
  `;
}

// Функция для показа welcome screen
function showWelcomeScreen() {
  const formWrapper = document.querySelector(".form-wrapper");

  document.title = "Discord Forms - Создай свою форму";
  document.getElementById("pageTitle").textContent = "Discord Forms";

  formWrapper.innerHTML = `
    <div class="welcome-screen">
      <div class="welcome-icon">
        <i class="fas fa-clipboard-list"></i>
      </div>
      <h1 class="welcome-title">Discord Forms</h1>
      <p class="welcome-subtitle">Создавай кастомные формы с отправкой в Discord</p>
      
      <div class="welcome-features">
        <div class="welcome-feature">
          <i class="fas fa-magic"></i>
          <span>Конструктор форм</span>
        </div>
        <div class="welcome-feature">
          <i class="fas fa-share-alt"></i>
          <span>Генерация ссылок</span>
        </div>
        <div class="welcome-feature">
          <i class="fab fa-discord"></i>
          <span>Интеграция с Discord</span>
        </div>
      </div>
      
      <button id="createFormBtn" class="create-form-btn">
        <i class="fas fa-plus-circle"></i>
        Создать форму
      </button>
      
      <div class="welcome-info">
        <p>Создай свою форму обратной связи, анкету, опрос или любую другую форму</p>
        <p>Все данные отправляются прямо в твой Discord-канал через webhook</p>
      </div>
    </div>
  `;

  const createFormBtn = document.getElementById("createFormBtn");
  if (createFormBtn) {
    createFormBtn.addEventListener("click", () => {
      currentConfig = createEmptyConfig();
      restoreFormStructure();
      initEditor();
      toggleEditorMode(true);
      renderForm();
      initFormHandlers();
    });
  }
}

// Функция для рендеринга формы на основе конфига
function renderForm() {
  const formHeader = formWrapper.querySelector(".header h1");
  const formDescription = formWrapper.querySelector(".header p");
  const formFields = formWrapper.querySelector(".contact-form");

  formHeader.textContent = currentConfig.title;
  formDescription.textContent = currentConfig.description;

  const submitBtn = formFields.querySelector(".submit-btn");
  formFields.innerHTML = "";
  formFields.appendChild(submitBtn);

  currentConfig.fields.forEach((field) => {
    const fieldGroup = document.createElement("div");
    fieldGroup.className = "form-group";
    fieldGroup.dataset.fieldId = field.id;

    if (field.conditional && field.conditional.enabled) {
      // Поддержка нового формата с массивом условий
      if (
        field.conditional.conditions &&
        Array.isArray(field.conditional.conditions)
      ) {
        fieldGroup.dataset.conditionalConditions = JSON.stringify(
          field.conditional.conditions
        );
      } else {
        // Миграция со старого формата
        if (field.conditional.field) {
          fieldGroup.dataset.conditionalField = field.conditional.field;
          fieldGroup.dataset.conditionalValue = field.conditional.value || "";
        }
      }
      fieldGroup.classList.add("conditional-field");
      fieldGroup.style.display = "none";
    }

    const label = document.createElement("label");
label.setAttribute("for", field.id);
label.innerHTML = `${field.label}${field.required ? " *" : ""}`;


    let inputElement;

    switch (field.type) {
      case "textarea":
        inputElement = document.createElement("textarea");
        inputElement.rows = 5;
        break;

      case "select":
        inputElement = document.createElement("select");
        if (field.options) {
          const defaultOption = document.createElement("option");
          defaultOption.value = "";
          defaultOption.textContent = "Выберите вариант";
          inputElement.appendChild(defaultOption);

          field.options.forEach((option) => {
            const optionElement = document.createElement("option");
            optionElement.value = option;
            optionElement.textContent = option;
            inputElement.appendChild(optionElement);
          });
        }
        break;

      case "radio":
        const radioGroup = document.createElement("div");
        radioGroup.className = "radio-group";

        if (field.options) {
          field.options.forEach((option, index) => {
            const radioLabel = document.createElement("label");
            radioLabel.className = "radio-label";

            radioLabel.innerHTML = `
              <input type="radio" name="${field.id}" value="${option}" ${
              index === 0 && field.defaultValue === option ? "checked" : ""
            } />
              <span class="radio-custom"></span>
              ${option}
            `;

            radioGroup.appendChild(radioLabel);
          });
        }

        inputElement = radioGroup;
        break;

      case "checkboxes":
        const checkboxesGroup = document.createElement("div");
        checkboxesGroup.className = "checkboxes-group";

        if (field.options) {
          field.options.forEach((option) => {
            const checkboxItemLabel = document.createElement("label");
            checkboxItemLabel.className = "checkboxes-item-label";

            checkboxItemLabel.innerHTML = `
              <input type="checkbox" name="${field.id}" value="${option}" />
              <span class="checkbox-custom"></span>
              ${option}
            `;

            checkboxesGroup.appendChild(checkboxItemLabel);
          });
        }

        inputElement = checkboxesGroup;
        break;

      case "checkbox":
        const checkboxLabel = document.createElement("label");
        checkboxLabel.className = "checkbox-label";

        checkboxLabel.innerHTML = `
          <input type="checkbox" id="${field.id}" name="${field.id}" />
          <span class="checkbox-custom"></span>
          ${field.label}
        `;

        fieldGroup.appendChild(checkboxLabel);
        break;

      case "computed":
        const formula = field.formula || "";
        const hasMultilineOperations =
          formula.includes(",map,") || formula.includes(",lines,");

        if (hasMultilineOperations) {
          inputElement = document.createElement("textarea");
          inputElement.rows = 3;
          inputElement.readOnly = true;
          inputElement.className = "computed-field";
          inputElement.dataset.formula = formula;
          inputElement.tabIndex = -1;
        } else {
          inputElement = document.createElement("input");
          inputElement.type = "text";
          inputElement.readOnly = true;
          inputElement.className = "computed-field";
          inputElement.dataset.formula = formula;
          inputElement.tabIndex = -1;
        }
        break;

      case "image":
        const uploadZone = document.createElement("div");
        uploadZone.className = "image-upload-zone";
        uploadZone.innerHTML = `
          <div class="image-upload-zone-icon"><i class="fas fa-cloud-upload-alt"></i></div>
          <div class="image-upload-zone-text">Перетащите картинки сюда</div>
          <div class="image-upload-btn">Выбрать файлы</div>
          <div class="image-upload-zone-hint">Или вставьте из буфера (Ctrl+V)</div>
          <input type="file" class="image-file-input" accept="image/*" multiple />
        `;

        const previewContainer = document.createElement("div");
        previewContainer.className = "image-preview-container";
        previewContainer.innerHTML = `
          <div class="image-preview-counter" style="display: none;">Загружено: <span>0</span> из ${
            field.maxFiles || 4
          }</div>
          <div class="image-preview-grid"></div>
        `;

        fieldGroup.appendChild(label);
        fieldGroup.appendChild(uploadZone);
        fieldGroup.appendChild(previewContainer);
        fieldGroup.dataset.maxFiles = field.maxFiles || 4;

        break;

      default:
        inputElement = document.createElement("input");
        inputElement.type = field.type;
    }

    if (inputElement && inputElement.tagName !== "DIV") {
      inputElement.id = field.id;
      inputElement.name = field.id;
      if (field.placeholder) inputElement.placeholder = field.placeholder;
      if (field.required) inputElement.required = true;

      fieldGroup.appendChild(label);
      fieldGroup.appendChild(inputElement);

      if (inputElement.type !== "checkbox") {
        const inputLine = document.createElement("div");
        inputLine.className = "input-line";
        fieldGroup.appendChild(inputLine);
      }
    } else if (inputElement && inputElement.tagName === "DIV") {
      fieldGroup.appendChild(label);
      fieldGroup.appendChild(inputElement);
    }

    formFields.insertBefore(fieldGroup, submitBtn);
  });

  initComputedFields();
  initConditionalFields();
  initImageUpload();
}

// Initialize image upload functionality
function initImageUpload() {
  const imageFieldGroups = document.querySelectorAll(
    ".form-group[data-field-id]"
  );

  imageFieldGroups.forEach((fieldGroup) => {
    const field = currentConfig.fields.find(
      (f) => f.id === fieldGroup.dataset.fieldId
    );
    if (!field || field.type !== "image") return;

    const uploadZone = fieldGroup.querySelector(".image-upload-zone");
    const fileInput = fieldGroup.querySelector(".image-file-input");
    const previewGrid = fieldGroup.querySelector(".image-preview-grid");
    const previewCounter = fieldGroup.querySelector(".image-preview-counter");
    const counterSpan = previewCounter?.querySelector("span");
    const maxFiles = field.maxFiles || 10;

    if (!uploadZone || !fileInput) return;

    function updatePreview() {
      previewGrid.innerHTML = "";

      if (uploadedImages.length > 0) {
        previewCounter.style.display = "block";
        counterSpan.textContent = uploadedImages.length;
      } else {
        previewCounter.style.display = "none";
      }

      uploadedImages.forEach((file, index) => {
        const item = document.createElement("div");
        item.className = "image-preview-item";

        const img = document.createElement("img");
        img.src = URL.createObjectURL(file);
        img.onload = () => URL.revokeObjectURL(img.src);

        const removeBtn = document.createElement("button");
        removeBtn.type = "button";
        removeBtn.className = "image-preview-remove";
        removeBtn.innerHTML = '<i class="fas fa-times"></i>';
        removeBtn.addEventListener("click", (e) => {
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
      const imageFiles = Array.from(files).filter((f) =>
        f.type.startsWith("image/")
      );
      const remainingSlots = maxFiles - uploadedImages.length;
      const filesToAdd = imageFiles.slice(0, remainingSlots);

      if (imageFiles.length > remainingSlots) {
        showMessage(`Можно загрузить максимум ${maxFiles} картинок`, "error");
      }

      uploadedImages.push(...filesToAdd);
      updatePreview();
    }

    // Click to upload
    uploadZone.addEventListener("click", (e) => {
      if (e.target.closest(".image-preview-remove")) return;
      fileInput.click();
    });

    fileInput.addEventListener("change", (e) => {
      if (e.target.files.length > 0) {
        addFiles(e.target.files);
        fileInput.value = "";
      }
    });

    // Drag and drop
    uploadZone.addEventListener("dragover", (e) => {
      e.preventDefault();
      uploadZone.classList.add("drag-over");
    });

    uploadZone.addEventListener("dragleave", (e) => {
      e.preventDefault();
      uploadZone.classList.remove("drag-over");
    });

    uploadZone.addEventListener("drop", (e) => {
      e.preventDefault();
      uploadZone.classList.remove("drag-over");
      if (e.dataTransfer.files.length > 0) {
        addFiles(e.dataTransfer.files);
      }
    });

    // Paste from clipboard
    document.addEventListener("paste", (e) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      const imageItems = Array.from(items).filter((item) =>
        item.type.startsWith("image/")
      );
      if (imageItems.length > 0) {
        e.preventDefault();
        const files = imageItems
          .map((item) => item.getAsFile())
          .filter(Boolean);
        addFiles(files);
      }
    });

    // Initial render
    updatePreview();
  });
}

// Функция валидации формы
function validateForm(formData) {
  const errors = [];
  const form = document.getElementById("contactForm");

  currentConfig.fields.forEach((field) => {
    if (field.type === "computed") {
      return;
    }

    const fieldGroup = form.querySelector(`[data-field-id="${field.id}"]`);
    const isVisible = !fieldGroup || fieldGroup.style.display !== "none";

    if (!isVisible) {
      return;
    }

    // Validate image field
    if (field.type === "image") {
      if (field.required && uploadedImages.length === 0) {
        errors.push(
          `Поле "${field.label}" обязательно - прикрепите хотя бы одну картинку`
        );
      }
      return; // Skip other validations for image field
    }

    if (field.required) {
      const value = formData[field.id];
      if (!value || (typeof value === "string" && !value.trim())) {
        errors.push(`Поле "${field.label}" обязательно для заполнения`);
      }
    }

    if (field.type === "email" && formData[field.id]) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData[field.id])) {
        errors.push(`Введите корректный email адрес в поле "${field.label}"`);
      }
    }
  });

  return errors;
}

// Обработчик отправки формы
function initFormHandlers() {
  if (!contactForm) return;

  if (editFormBtn && formDropdown) {
    editFormBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      formDropdown.classList.toggle("show");
    });

    document.addEventListener("click", () => {
      if (formDropdown.classList.contains("show")) {
        formDropdown.classList.remove("show");
      }
    });

    if (duplicateBtn) {
      duplicateBtn.addEventListener("click", () => {
        formDropdown.classList.remove("show");

        if (!isEditorMode) {
          initEditor();
          if (webhookUrlInput) {
            webhookUrlInput.value = "";
            currentConfig.webhookUrl = "";
          }
        }
        toggleEditorMode(!isEditorMode);
      });
    }
  }

  contactForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const formData = new FormData(contactForm);
    const data = {};

    for (let [key, value] of formData.entries()) {
      // Проверяем видимость поля для вычисляемых полей
      if (
        currentConfig.fields.find((f) => f.id === key && f.type === "computed")
      ) {
        const fieldGroup = contactForm.querySelector(
          `[data-field-id="${key}"]`
        );
        const isVisible = !fieldGroup || fieldGroup.style.display !== "none";
        if (!isVisible) {
          continue; // Пропускаем скрытые вычисляемые поля
        }
      }

      // Handle checkboxes type - collect multiple values
      const fieldConfig = currentConfig.fields.find((f) => f.id === key);
      if (fieldConfig && fieldConfig.type === "checkboxes") {
        if (!data[key]) {
          data[key] = [];
        }
        data[key].push(value);
      } else {
        data[key] = value;
      }
    }

    // Convert checkboxes arrays to newline-separated strings
    for (const key in data) {
      if (Array.isArray(data[key])) {
        data[key] = data[key].join("\n");
      }
    }

    const errors = validateForm(data);
    if (errors.length > 0) {
      showMessage(errors.join(". "), "error");
      return;
    }

    setLoading(true);

    try {
      const result = await sendToDiscord(data);

      if (result.success) {
        showMessage(result.message, "success");
        contactForm.reset();
        uploadedImages = [];
        const previewGrids = document.querySelectorAll(".image-preview-grid");
        previewGrids.forEach((grid) => (grid.innerHTML = ""));
        const previewCounters = document.querySelectorAll(
          ".image-preview-counter"
        );
        previewCounters.forEach((counter) => (counter.style.display = "none"));

        if (submitBtn) {
          submitBtn.style.background =
            "linear-gradient(135deg, #10b981, #059669)";
          setTimeout(() => {
            submitBtn.style.background =
              "linear-gradient(135deg, #6366f1, #4f46e5)";
          }, 3000);
        }
      } else {
        showMessage(result.message, "error");
      }
    } catch (error) {
      console.error("Неожиданная ошибка:", error);
      showMessage("Произошла неожиданная ошибка. Попробуйте еще раз.", "error");
    } finally {
      setLoading(false);
    }
  });
}

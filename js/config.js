// === ФУНКЦИИ РАБОТЫ С КОНФИГУРАЦИЕЙ ===

// Функция для создания пустого конфига
function createEmptyConfig() {
  return {
    title: "Моя форма",
    description: "Описание формы",
    customMessage: "",
    webhookUrl: "",
    webhookUsername: "Форма обратной связи",
    webhookAvatarUrl: "https://pngimg.com/uploads/discord/discord_PNG3.png",
    organization: "LSPD",
    conditionalMessages: [],

    showAdvancedSettings: false,
    sendQuestionNumbers: true,
    displayUsername: true,
    sendEmojis: false,
    fields: [
      {
        id: generateId(),
        type: "text",
        label: "Имя",
        placeholder: "",
        required: true,
        icon: "user",
      },
      {
        id: generateId(),
        type: "email",
        label: "Email",
        placeholder: "",
        required: true,
        icon: "envelope",
      },
      {
        id: generateId(),
        type: "textarea",
        label: "Сообщение",
        placeholder: "",
        required: true,
        icon: "comment",
      },
    ],
  };
}

// Функция для обновления конфига из редактора
function updateConfigFromEditor() {
  currentConfig.title = formTitleInput.value || "Форма обратной связи";
  currentConfig.description = formDescriptionInput.value || "Заполните форму";
  currentConfig.customMessage = customMessageInput.value || "";
  currentConfig.webhookUrl = webhookUrlInput.value;
  currentConfig.webhookUsername =
    webhookUsernameInput.value || currentConfig.title;
  currentConfig.webhookAvatarUrl =
    webhookAvatarUrlInput.value ||
    "https://pngimg.com/uploads/discord/discord_PNG3.png";
  currentConfig.sendAsPlainText = sendAsPlainTextCheckbox
    ? sendAsPlainTextCheckbox.checked
    : false;
  currentConfig.displayUsername = displayUsernameCheckbox
    ? displayUsername.checked
    : true;

  // Сохраняем настройки отправки номеров и эмодзи
  const sendQuestionNumbersCheckbox = document.getElementById(
    "sendQuestionNumbers"
  );
  const sendEmojisCheckbox = document.getElementById("sendEmojis");

  if (sendQuestionNumbersCheckbox) {
    currentConfig.sendQuestionNumbers = sendQuestionNumbersCheckbox.checked;
  }

  if (sendEmojisCheckbox) {
    currentConfig.sendEmojis = sendEmojisCheckbox.checked;
  }

  const sendColonsCheckbox = document.getElementById("sendColons");
  if (sendColonsCheckbox) {
    currentConfig.sendColons = sendColonsCheckbox.checked;
  }

  pageTitle.textContent = currentConfig.title;
  document.querySelector("h1").textContent = currentConfig.title;
  document.querySelector(".header p").textContent = currentConfig.description;

  updateUrl(currentConfig);
}

// Функция для генерации ссылки на форму
function generateShareUrl() {
  const shareConfig = { ...currentConfig };
  const baseUrl = window.location.origin + window.location.pathname;
  return `${baseUrl}?config=${encodeConfig(shareConfig)}`;
}

// Функция для генерации и копирования ссылки на форму
async function generateAndCopyShareUrl() {
  if (!currentConfig.webhookUrl.trim()) {
    showMessage(
      "Укажите Discord Webhook URL перед копированием ссылки",
      "error"
    );
    return;
  }

  const shareUrl = generateShareUrl();
  const success = await copyToClipboard(shareUrl);

  if (success) {
    generateUrlBtn.classList.add("copied");
    generateUrlBtn.innerHTML =
      '<i class="fas fa-check"></i> Ссылка скопирована!';

    setTimeout(() => {
      generateUrlBtn.classList.remove("copied");
      generateUrlBtn.innerHTML =
        '<i class="fas fa-copy"></i> Скопировать ссылку на форму';
    }, 2000);

    showMessage("Ссылка на форму скопирована в буфер обмена!", "success");
  } else {
    showMessage("Не удалось скопировать ссылку", "error");
  }
}

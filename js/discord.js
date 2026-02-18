// === ФУНКЦИИ РАБОТЫ С DISCORD ===

// Функция для создания Discord embed без лишних отступов
function createDiscordEmbeds(formData, images = []) {
  const priorityColors = {
    Низкий: 0x10b981,
    Средний: 0xf59e0b,
    Высокий: 0xef4444,
  };

  let embedColor = 0x6366f1;
  if (formData.priority && priorityColors[formData.priority]) {
    embedColor = priorityColors[formData.priority];
  }

  let descriptionText = "";
  let questionIndex = 1;

  const showQuestionNumbers =
    currentConfig.sendQuestionNumbers !== undefined
      ? currentConfig.sendQuestionNumbers
      : true;
  const showEmojis = currentConfig.sendEmojis || false;
  const showColons = currentConfig.sendColons !== false;

  currentConfig.fields.forEach((field) => {
    if (
      field.customWebhook &&
      field.customWebhook.enabled &&
      (field.customWebhook.splitLines || field.customWebhook.url)
    ) {
      return; // Пропускаем кастомные вебхуки
    }

    const value = formData[field.id];
    const isImage = field.type === "image" && images.length > 0;
    if (!value && !isImage) return;

    let displayValue = isImage ? "" : value;

    let fieldName = "";

    // if (showEmojis && field.icon) {
//   const emoji = getFieldIcon(field.icon);
//   if (emoji && !emoji.startsWith("<i ")) fieldName += `${emoji} `;
// }


    if (showQuestionNumbers) fieldName += `${questionIndex}) `;

    fieldName += `${field.label}${showColons ? ":" : ""}`;

    if (field.type === "checkbox") {
      displayValue =
        field.showTextInResponse !== false
          ? displayValue === "on"
            ? "✅ Да"
            : "❌ Нет"
          : displayValue === "on"
          ? "✅"
          : "❌";
    }

    if (typeof displayValue === "string") {
      displayValue = displayValue.replace(/\n+/g, " ").trim();
    }

    descriptionText += `${fieldName} ${displayValue}\n`;
    questionIndex++;
  });

  const footer = {
    text:
      currentConfig.displayUsername !== false
        ? currentConfig.webhookUsername || currentConfig.title
        : "",
    icon_url:
      currentConfig.webhookAvatarUrl ||
      "https://pngimg.com/uploads/discord/discord_PNG3.png",
  };

  const embed = {
    color: embedColor,
    title: `📝 ${currentConfig.title}`,
    description: descriptionText || "Нет данных",
    timestamp: new Date().toISOString(),
    footer: footer,
  };

  return [embed];
}

// Создание текстового сообщения
function createPlainTextMessage(formData) {
  let message = `**__📝 ${currentConfig.title}__**\n`;

  let questionIndex = 1;
  const showQuestionNumbers =
    currentConfig.sendQuestionNumbers !== undefined
      ? currentConfig.sendQuestionNumbers
      : true;
  const showEmojis = currentConfig.sendEmojis || false;
  const showColons = currentConfig.sendColons !== false;

  currentConfig.fields.forEach((field) => {
    if (
      field.customWebhook &&
      field.customWebhook.enabled &&
      (field.customWebhook.splitLines || field.customWebhook.url)
    ) {
      return;
    }

    const value = formData[field.id];
    if (value !== undefined && value !== "") {
      let displayValue = value;

      if (field.type === "checkbox") {
        displayValue =
          field.showTextInResponse !== false
            ? value === "on"
              ? "✅ Да"
              : "❌ Нет"
            : value === "on"
            ? "✅"
            : "❌";
      }

      let fieldLabel = "";
      if (showEmojis && field.icon) {
        const emoji = getFieldIcon(field.icon);
        if (emoji && !emoji.startsWith("<i ")) fieldLabel += `${emoji} `;
      }

      if (showQuestionNumbers) fieldLabel += `${questionIndex}) `;
      fieldLabel += `${field.label}${showColons ? ":" : ""}`;

      message += `**${fieldLabel}** ${displayValue}\n`;
      questionIndex++;
    }
  });

  return message;
}

// Условные сообщения
function getConditionalMessage(formData) {
  const matchedMessages = [];

  if (
    currentConfig.conditionalMessages &&
    currentConfig.conditionalMessages.length > 0
  ) {
    for (const condMsg of currentConfig.conditionalMessages) {
      if (condMsg.field && condMsg.value && condMsg.message) {
        const fieldValue = formData[condMsg.field];

        let requiredValues = [];
        try {
          requiredValues = JSON.parse(condMsg.value);
          if (!Array.isArray(requiredValues)) requiredValues = [condMsg.value];
        } catch {
          requiredValues = [condMsg.value];
        }

        if (requiredValues.includes(fieldValue)) matchedMessages.push(condMsg.message);
      }
    }
  }

  if (currentConfig.customMessage) matchedMessages.push(currentConfig.customMessage);

  return matchedMessages.length > 0 ? matchedMessages.join("\n") : null;
}

// FormData payload для изображений
function createFormDataPayload(payload, files = []) {
  const formData = new FormData();
  formData.append("payload_json", JSON.stringify(payload));

  files.forEach((file, index) => {
    formData.append(`files[${index}]`, file, `image${index}.png`);
  });

  return formData;
}

// Создание галереи для нескольких изображений
function createGalleryEmbeds(embeds, files = []) {
  if (!files.length) return embeds;

  const galleryUrl = "https://gta5rp.com/";
  const result = embeds.map((e) => ({ ...e }));

  const lastEmbed = result[result.length - 1];
  lastEmbed.url = galleryUrl;
  lastEmbed.image = { url: "attachment://image0.png" };

  for (let i = 1; i < files.length; i++) {
    result.push({
      url: galleryUrl,
      image: { url: `attachment://image${i}.png` },
    });
  }

  return result;
}

// Отправка в Discord
async function sendToDiscord(formData, uploadedImages = []) {
  if (!currentConfig.webhookUrl) {
    return { success: false, message: "Webhook URL не настроен" };
  }

  const customMessage = getConditionalMessage(formData);
  const hasImages = uploadedImages.length > 0;

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
      avatar_url:
        currentConfig.webhookAvatarUrl ||
        "https://pngimg.com/uploads/discord/discord_PNG3.png",
    };

    fetchOptions = hasImages
      ? { method: "POST", body: createFormDataPayload(payload, uploadedImages) }
      : { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) };
  } else {
    const embeds = createDiscordEmbeds(formData, uploadedImages);

    payload = hasImages
      ? {
          content: customMessage,
          embeds: createGalleryEmbeds(embeds, uploadedImages),
          username: currentConfig.webhookUsername || currentConfig.title,
          avatar_url: currentConfig.webhookAvatarUrl || "https://pngimg.com/uploads/discord/discord_PNG3.png",
        }
      : {
          content: customMessage,
          embeds,
          username: currentConfig.webhookUsername || currentConfig.title,
          avatar_url: currentConfig.webhookAvatarUrl || "https://pngimg.com/uploads/discord/discord_PNG3.png",
        };

    fetchOptions = hasImages
      ? { method: "POST", body: createFormDataPayload(payload, uploadedImages) }
      : { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) };
  }

  try {
    const response = await fetch(currentConfig.webhookUrl, fetchOptions);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`HTTP ${response.status}: ${errorData.message || "Неизвестная ошибка"}`);
    }

    return { success: true, message: "Сообщение успешно отправлено! 🎉" };
  } catch (error) {
    console.error("Ошибка отправки в Discord:", error);
    return { success: false, message: `Ошибка при отправке: ${error.message}` };
  }
}

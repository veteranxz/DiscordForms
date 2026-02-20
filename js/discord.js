// === ФУНКЦИИ РАБОТЫ С DISCORD ===

// Функция для создания Discord embed
function createDiscordEmbed(formData, imagesLength) {
  const priorityColors = {
    Низкий: 0x10b981,
    Средний: 0xf59e0b,
    Высокий: 0xef4444,
  };

  let embedColor = 0x6366f1;
  if (formData.priority && priorityColors[formData.priority]) {
    embedColor = priorityColors[formData.priority];
  }

  const embed = {
    title: `📝 ${currentConfig.title}`,
    color: embedColor,
    fields: [],
    timestamp: new Date().toISOString(),
    footer: {
      text:
        currentConfig.displayUsername !== false
          ? `${currentConfig.webhookUsername || currentConfig.title}`
          : "",
      icon_url:
        currentConfig.webhookAvatarUrl ||
        "https://pngimg.com/uploads/discord/discord_PNG3.png",
    },
  };

  let questionIndex = 1;
  const showQuestionNumbers =
    currentConfig.sendQuestionNumbers !== undefined
      ? currentConfig.sendQuestionNumbers
      : true;
  const showEmojis = currentConfig.sendEmojis || false;
  const showColons = currentConfig.sendColons !== false;

  // ✅ массив для всех строк
  let lines = [];

  // === ЦИКЛ ПО ВСЕМ ПОЛЯМ ===
  currentConfig.fields.forEach((field) => {
    // Пропускаем поля с кастомной отправкой
    if (
      field.customWebhook &&
      field.customWebhook.enabled &&
      (field.customWebhook.splitLines || field.customWebhook.url)
    ) {
      return;
    }

    const value = formData[field.id];
    const isImage = imagesLength && field.type === "image";
    if (isImage || (value !== undefined && value !== "")) {
      let displayValue = isImage ? " " : value;

      // Обработка чекбоксов
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

      // Формируем название поля
      let fieldName = "";
      if (showEmojis && field.icon) {
        const emoji = getFieldIcon(field.icon);
        if (!emoji.startsWith("<i ")) {
          fieldName += `${emoji} `;
        }
      }

      if (showQuestionNumbers) {
        fieldName += `${questionIndex}) `;
      }

      fieldName += `${field.label}${showColons ? ":" : ""}`;

      if (isImage) {
        let suffix = "й";
        if (imagesLength % 10 === 1 && imagesLength % 100 !== 11) suffix = "е";
        else if (
          imagesLength % 10 >= 2 &&
          imagesLength % 10 <= 4 &&
          (imagesLength % 100 < 10 || imagesLength % 100 >= 20)
        )
          suffix = "я";
        fieldName += ` (${imagesLength} изображени${suffix})`;
      }

      if (typeof displayValue === "string" && displayValue.length > 1024) {
        displayValue = displayValue.substring(0, 1021) + "...";
      }

      // ✅ собираем все строки в массив
      lines.push(`${fieldName} ${displayValue}`);

      questionIndex++;
    }
  });

  // ✅ после цикла добавляем один field со всеми строками
  if (lines.length > 0) {
    embed.fields.push({
      name: "\u200B",
      value: lines.join("\n"),
      inline: false,
    });
  }

  return embed;
}

// Функция для создания текстового сообщения
function createPlainTextMessage(formData) {
  let message = `# ${currentConfig.title}\n`;

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
        displayValue = (field.showTextInResponse !== false)
          ? value === "on" ? "✅ Да" : "❌ Нет"
          : value === "on" ? "✅" : "❌";
      }

      let fieldLabel = "";
      if (showEmojis && field.icon) {
        const emoji = getFieldIcon(field.icon);
        if (!emoji.startsWith("<i ")) fieldLabel += `${emoji} `;
      }

      if (showQuestionNumbers) fieldLabel += `${questionIndex}) `;
      fieldLabel += `${field.label}${showColons ? ":" : ""}`;

      message += `${fieldLabel}${
        ["textarea", "computed"].includes(field.type) ? "\n" : " "
      }${displayValue}\n`;

      questionIndex++;
    }
  });
  return message;
}

// Функция для условных сообщений
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
        } catch (e) {
          requiredValues = [condMsg.value];
        }
        if (requiredValues.includes(fieldValue)) matchedMessages.push(condMsg.message);
      }
    }
  }
  if (currentConfig.customMessage) matchedMessages.push(currentConfig.customMessage);
  return matchedMessages.length > 0 ? matchedMessages.join("\n") : null;
}

// Create FormData payload with images
function createFormDataPayload(payload, files) {
  const formData = new FormData();
  formData.append("payload_json", JSON.stringify(payload));
  files.forEach((file, index) => {
    formData.append(`files[${index}]`, file, `image${index}.png`);
  });
  return formData;
}

// Create multiple embeds for image gallery
function createGalleryEmbeds(baseEmbed, fileCount) {
  if (fileCount === 0) return [baseEmbed];

  const galleryUrl = "https://gta5rp.com/";
  const mainEmbed = { ...baseEmbed, url: galleryUrl, image: { url: "attachment://image0.png" } };
  const embeds = [mainEmbed];

  for (let i = 1; i < fileCount; i++) {
    embeds.push({ url: galleryUrl, image: { url: `attachment://image${i}.png` } });
  }

  return embeds;
}

// Функция для отправки данных в Discord
async function sendToDiscord(formData) {
  if (!currentConfig.webhookUrl) return { success: false, message: "Webhook URL не настроен" };

  const customMessage = getConditionalMessage(formData);
  const hasImages = uploadedImages && uploadedImages.length > 0;

  let payload, fetchOptions;

  if (currentConfig.sendAsPlainText) {
    const plainTextContent = createPlainTextMessage(formData);
    const finalContent = customMessage ? `${customMessage}\n\n${plainTextContent}` : plainTextContent;
    payload = { content: finalContent, username: currentConfig.webhookUsername || currentConfig.title,
                avatar_url: currentConfig.webhookAvatarUrl || "https://pngimg.com/uploads/discord/discord_PNG3.png" };
    fetchOptions = hasImages
      ? { method: "POST", body: createFormDataPayload(payload, uploadedImages) }
      : { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) };
  } else {
    const embed = createDiscordEmbed(formData, uploadedImages?.length || 0);
    if (hasImages) {
      const embeds = createGalleryEmbeds(embed, uploadedImages.length);
      payload = { content: customMessage, embeds,
                  username: currentConfig.webhookUsername || currentConfig.title,
                  avatar_url: currentConfig.webhookAvatarUrl || "https://pngimg.com/uploads/discord/discord_PNG3.png" };
      fetchOptions = { method: "POST", body: createFormDataPayload(payload, uploadedImages) };
    } else {
      payload = { content: customMessage, embeds: [embed],
                  username: currentConfig.webhookUsername || currentConfig.title,
                  avatar_url: currentConfig.webhookAvatarUrl || "https://pngimg.com/uploads/discord/discord_PNG3.png" };
      fetchOptions = { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) };
    }
  }

  try {
    const response = await fetch(currentConfig.webhookUrl, fetchOptions);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`HTTP ${response.status}: ${errorData.message || "Неизвестная ошибка"}`);
    }

    const customWebhookFields = currentConfig.fields.filter(f => f.customWebhook && f.customWebhook.enabled);
    if (customWebhookFields.length > 0) {
      const promises = [];
      customWebhookFields.forEach(field => {
        const webhookUrl = field.customWebhook.url || currentConfig.webhookUrl;
        if (field.customWebhook.splitLines && ["textarea","computed"].includes(field.type) && formData[field.id]) {
          formData[field.id].split("\n").filter(l=>l.trim()!=="").forEach((line,index) => {
            promises.push(fetch(webhookUrl, {
              method:"POST",
              headers:{"Content-Type":"application/json"},
              body: JSON.stringify({ content: line,
                username: currentConfig.webhookUsername || currentConfig.title,
                avatar_url: currentConfig.webhookAvatarUrl || "https://pngimg.com/uploads/discord/discord_PNG3.png" }),
            }).catch(err => console.error(`Ошибка строки ${index+1} поля ${field.label}:`,err)));
          });
        } else if (field.customWebhook.url) {
          promises.push(fetch(webhookUrl, {
            method:"POST",
            headers:{"Content-Type":"application/json"},
            body: JSON.stringify(payload)
          }).catch(err => console.error(`Ошибка кастомного webhook поля ${field.label}:`,err)));
        }
      });
      await Promise.allSettled(promises);
    }

    return { success: true, message: "Сообщение успешно отправлено! 🎉" };
  } catch (error) {
    console.error("Ошибка отправки в Discord:", error);
    return { success: false, message: `Ошибка при отправке: ${error.message}. Попробуйте еще раз.` };
  }
}

// === ФУНКЦИИ РАБОТЫ С DISCORD ===

// Создание Discord embed с ответами в одной строке
function createDiscordEmbedSingleLine(formData, imagesLength) {
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
  const showEmojis = currentConfig.sendEmojis || false;
  const showQuestionNumbers =
    currentConfig.sendQuestionNumbers !== undefined
      ? currentConfig.sendQuestionNumbers
      : true;
  const showColons = currentConfig.sendColons !== false;

  let fieldValue = "";

  currentConfig.fields.forEach((field) => {
    if (field.customWebhook && field.customWebhook.enabled) return;

    const value = formData[field.id];
    if (value === undefined || value === "") return;

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

    let label = "";

    if (showEmojis && field.icon) {
      const emoji = getFieldIcon(field.icon);
      if (!emoji.startsWith("<i ")) label += `${emoji} `;
    }

    if (showQuestionNumbers) label += `${questionIndex}) `;
    label += `${field.label}${showColons ? ":" : ""}`;

    fieldValue += `${label} ${displayValue}\n`;
    questionIndex++;
  });

  embed.fields.push({
    name: "\u200b", // пустое имя
    value: fieldValue, // все ответы через переносы
    inline: false,
  });

  return embed;
}

// Create multiple embeds for image gallery
function createGalleryEmbeds(baseEmbed, fileCount) {
  if (fileCount === 0) return [baseEmbed];

  const galleryUrl = "https://gta5rp.com/";

  // First embed with all fields + first image
  const mainEmbed = {
    ...baseEmbed,
    url: galleryUrl,
    image: { url: "attachment://image0.png" },
  };

  const embeds = [mainEmbed];

  // Additional embeds for gallery effect (same url, different images)
  for (let i = 1; i < fileCount; i++) {
    embeds.push({
      url: galleryUrl,
      image: { url: `attachment://image${i}.png` },
    });
  }

  return embeds;
}

// Отправка данных в Discord
async function sendToDiscord(formData) {
  if (!currentConfig.webhookUrl) {
    return { success: false, message: "Webhook URL не настроен" };
  }

  const customMessage = getConditionalMessage(formData);
  const hasImages = uploadedImages && uploadedImages.length > 0;

  let payload;
  let fetchOptions;

  if (currentConfig.sendAsPlainText) {
    // Используем plain text
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

    if (hasImages) {
      fetchOptions = {
        method: "POST",
        body: createFormDataPayload(payload, uploadedImages),
      };
    } else {
      fetchOptions = {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      };
    }
  } else {
    // Используем embed с ответами в одной строке
    const embed = createDiscordEmbedSingleLine(formData, uploadedImages.length);

    if (hasImages) {
      const embeds = createGalleryEmbeds(embed, uploadedImages.length);
      payload = {
        content: customMessage,
        embeds: embeds,
        username: currentConfig.webhookUsername || currentConfig.title,
        avatar_url:
          currentConfig.webhookAvatarUrl ||
          "https://pngimg.com/uploads/discord/discord_PNG3.png",
      };
      fetchOptions = {
        method: "POST",
        body: createFormDataPayload(payload, uploadedImages),
      };
    } else {
      payload = {
        content: customMessage,
        embeds: [embed],
        username: currentConfig.webhookUsername || currentConfig.title,
        avatar_url:
          currentConfig.webhookAvatarUrl ||
          "https://pngimg.com/uploads/discord/discord_PNG3.png",
      };
      fetchOptions = {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      };
    }
  }

  try {
    const response = await fetch(currentConfig.webhookUrl, fetchOptions);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        `HTTP ${response.status}: ${errorData.message || "Неизвестная ошибка"}`
      );
    }

    // Кастомные webhooks для отдельных полей
    const customWebhookFields = currentConfig.fields.filter(
      (field) => field.customWebhook && field.customWebhook.enabled
    );

    if (customWebhookFields.length > 0) {
      const customWebhookPromises = [];

      customWebhookFields.forEach((field) => {
        const webhookUrl = field.customWebhook.url || currentConfig.webhookUrl;

        if (
          field.customWebhook.splitLines &&
          (field.type === "textarea" || field.type === "computed") &&
          formData[field.id]
        ) {
          const lines = formData[field.id]
            .split("\n")
            .filter((line) => line.trim() !== "");

          lines.forEach((line, index) => {
            const linePayload = {
              content: line,
              username: currentConfig.webhookUsername || currentConfig.title,
              avatar_url:
                currentConfig.webhookAvatarUrl ||
                "https://pngimg.com/uploads/discord/discord_PNG3.png",
            };

            customWebhookPromises.push(
              fetch(webhookUrl, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(linePayload),
              }).catch((error) => {
                console.error(
                  `Ошибка отправки строки ${index + 1} поля ${field.label}:`,
                  error
                );
              })
            );
          });
        } else if (field.customWebhook.url) {
          customWebhookPromises.push(
            fetch(webhookUrl, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payload),
            }).catch((error) => {
              console.error(
                `Ошибка отправки на кастомный webhook поля ${field.label}:`,
                error
              );
            })
          );
        }
      });

      await Promise.allSettled(customWebhookPromises);
    }

    return { success: true, message: "Сообщение успешно отправлено! 🎉" };
  } catch (error) {
    console.error("Ошибка отправки в Discord:", error);
    return {
      success: false,
      message: `Ошибка при отправке: ${error.message}. Попробуйте еще раз.`,
    };
  }
}

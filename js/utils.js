// === УТИЛИТАРНЫЕ ФУНКЦИИ ===

// Функция для показа сообщений
function showMessage(message, type = "success") {
  responseMessage.textContent = message;
  responseMessage.className = `response-message ${type} show`;

  setTimeout(() => {
    responseMessage.classList.remove("show");
  }, 5000);
}

// Strip default/empty values from config to reduce URL size
function optimizeConfig(config) {
  const optimized = { ...config };

  if (!optimized.customMessage) delete optimized.customMessage;
  if (!optimized.conditionalMessages?.length)
    delete optimized.conditionalMessages;
  if (optimized.showAdvancedSettings === false)
    delete optimized.showAdvancedSettings;
  if (optimized.sendEmojis === false) delete optimized.sendEmojis;

  if (optimized.fields) {
    optimized.fields = optimized.fields.map((field) => {
      const f = { ...field };
      if (!f.placeholder) delete f.placeholder;
      if (!f.icon) delete f.icon;
      if (!f.options?.length) delete f.options;
      if (f.required === false) delete f.required;
      if (f.customWebhook && !f.customWebhook.enabled) delete f.customWebhook;
      if (f.conditional && !f.conditional.enabled) delete f.conditional;
      return f;
    });
  }

  return optimized;
}

// Функция для кодирования конфига в base64 с компрессией
function encodeConfig(config) {
  try {
    const optimized = optimizeConfig(config);
    const json = JSON.stringify(optimized);
    // Используем LZ-String для сжатия (если доступна библиотека)
    if (typeof LZString !== "undefined") {
      return "v2:" + LZString.compressToEncodedURIComponent(json);
    }
    // Fallback на старый метод
    return btoa(encodeURIComponent(json));
  } catch (e) {
    console.error("Ошибка кодирования конфига:", e);
    return btoa(encodeURIComponent(JSON.stringify(config)));
  }
}

// Функция для декодирования конфига из base64 (с обратной совместимостью)
function decodeConfig(encodedConfig) {
  try {
    // Проверяем новый формат с версией
    if (encodedConfig.startsWith("v2:")) {
      const compressed = encodedConfig.substring(3);
      if (typeof LZString !== "undefined") {
        const json = LZString.decompressFromEncodedURIComponent(compressed);
        return JSON.parse(json);
      }
    }

    // Старый формат (обратная совместимость)
    return JSON.parse(decodeURIComponent(atob(encodedConfig)));
  } catch (e) {
    console.error("Ошибка декодирования конфига:", e);
    return null;
  }
}

// Функция для получения параметров URL (hash first, query params fallback)
function getUrlParams() {
  // New format: hash fragment (#config=...&mode=...)
  const hash = window.location.hash.substring(1);
  if (hash) {
    const hashParams = new URLSearchParams(hash);
    const config = hashParams.get("config");
    if (config) {
      return { config, mode: hashParams.get("mode") };
    }
  }

  // Old format fallback: query params (?config=...&mode=...)
  const params = new URLSearchParams(window.location.search);
  return {
    config: params.get("config"),
    mode: params.get("mode"),
  };
}

// Функция для обновления URL без перезагрузки (uses hash fragment)
function updateUrl(config = null, mode = null) {
  const url = new URL(window.location);

  // Clear old query params if migrating from old format
  url.searchParams.delete("config");
  url.searchParams.delete("mode");

  const hashParams = new URLSearchParams(url.hash.substring(1));

  if (config) {
    hashParams.set("config", encodeConfig(config));
  }

  if (mode !== null) {
    if (mode) {
      hashParams.set("mode", "editor");
    } else {
      hashParams.delete("mode");
    }
  }

  url.hash = hashParams.toString();
  window.history.pushState({}, "", url);
}

// Функция для копирования текста в буфер обмена
async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    console.error("Ошибка копирования:", err);
    return false;
  }
}

// Функция для генерации уникального ID
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Функция для установки состояния загрузки
function setLoading(isLoading) {
  if (submitBtn) {
    submitBtn.disabled = isLoading;

    if (isLoading) {
      btnText.textContent = "Отправка...";
      btnIcon.className = "fas fa-spinner loading";
    } else {
      btnText.textContent = "Отправить сообщение";
      btnIcon.className = "fas fa-arrow-right";
    }
  }
}

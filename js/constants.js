// === ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ И КОНСТАНТЫ ===

// Конфигурация по умолчанию
let currentConfig = null;

// Режим работы (editor/view)
let isEditorMode = false;

// Текущая тема
let currentTheme = "dark";

// DOM элементы
const container = document.querySelector(".container");
const editorPanel = document.getElementById("editorPanel");
const formWrapper = document.querySelector(".form-wrapper");
const formPreview = document.getElementById("formPreview");
const contactForm = document.getElementById("contactForm");
const submitBtn = document.querySelector(".submit-btn");
const btnText = document.querySelector(".btn-text");
const btnIcon = document.querySelector(".submit-btn i");
const responseMessage = document.getElementById("response");
const conditionalMessagesList = document.getElementById(
  "conditionalMessagesList"
);
const addConditionalMessageBtn = document.getElementById(
  "addConditionalMessageBtn"
);

// Элементы редактора
const formTitleInput = document.getElementById("formTitle");
const formDescriptionInput = document.getElementById("formDescription");
const customMessageInput = document.getElementById("customMessage");
const webhookUrlInput = document.getElementById("webhookUrl");
const webhookUsernameInput = document.getElementById("webhookUsername");
const webhookAvatarUrlInput = document.getElementById("webhookAvatarUrl");
const sendAsPlainTextCheckbox = document.getElementById("sendAsPlainText");
const displayUsernameCheckbox = document.getElementById("displayUsername");
const organizationSelect = document.getElementById("organizationSelect");
const fieldsList = document.getElementById("fieldsList");
const addFieldBtn = document.getElementById("addFieldBtn");
const generateUrlBtn = document.getElementById("generateUrlBtn");
const shortenUrlBtn = document.getElementById("shortenUrlBtn");
const shareUrlDiv = document.getElementById("shareUrl");
const pageTitle = document.getElementById("pageTitle");
const orgLogoImg = document.getElementById("orgLogoImg");

// Кнопка редактирования формы и выпадающее меню
const editFormBtn = document.getElementById("editFormBtn");
const formDropdown = document.getElementById("formDropdown");
const duplicateBtn = document.getElementById("duplicateBtn");

// Элементы переключателя тем
const lightThemeBtn = document.getElementById("lightThemeBtn");
const darkThemeBtn = document.getElementById("darkThemeBtn");

// Маппинг иконок
const iconMap = {};


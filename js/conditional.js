// === ФУНКЦИИ УСЛОВНОЙ ВИДИМОСТИ И УСЛОВНЫХ СООБЩЕНИЙ ===

// Функция для инициализации условной видимости полей
function initConditionalFields() {
  const form = document.getElementById('contactForm');
  if (!form) return;

  const conditionalFields = form.querySelectorAll('.conditional-field');
  if (conditionalFields.length === 0) return;

  const updateConditionalVisibility = () => {
    conditionalFields.forEach((fieldGroup) => {
      const conditionsData = fieldGroup.dataset.conditionalConditions;
      const oldField = fieldGroup.dataset.conditionalField;
      const oldValue = fieldGroup.dataset.conditionalValue;

      let conditions = [];

      // Проверяем новый формат
      if (conditionsData) {
        try {
          conditions = JSON.parse(conditionsData);
          if (!Array.isArray(conditions)) {
            conditions = [];
          }
        } catch (e) {
          conditions = [];
        }
      }

      // Если нет условий в новом формате, проверяем старый формат
      if (conditions.length === 0 && oldField) {
        conditions = [{ field: oldField, value: oldValue || '' }];
      }

      if (conditions.length === 0) return;

      // Проверяем все условия (AND логика - все должны быть выполнены)
      let allConditionsMet = true;

      for (const condition of conditions) {
        if (!condition.field) {
          allConditionsMet = false;
          break;
        }

        const dependsOnField = form.querySelector(`[name="${condition.field}"]`);
        if (!dependsOnField) {
          allConditionsMet = false;
          break;
        }

        let currentValue = '';

        // Get field config to check if it's checkboxes type
        const fieldConfig = currentConfig.fields.find((f) => f.id === condition.field);

        if (dependsOnField.type === 'radio') {
          const checkedRadio = form.querySelector(`[name="${condition.field}"]:checked`);
          currentValue = checkedRadio ? checkedRadio.value : '';
        } else if (fieldConfig && fieldConfig.type === 'checkboxes') {
          // For checkboxes, get all checked values
          const checkedBoxes = form.querySelectorAll(`[name="${condition.field}"]:checked`);
          const checkedValues = Array.from(checkedBoxes).map((cb) => cb.value);
          currentValue = checkedValues; // Array of selected values
        } else {
          currentValue = dependsOnField.value;
        }

        // Поддержка массива значений для условия "включает"
        let requiredValues = [];
        try {
          requiredValues = JSON.parse(condition.value);
          if (!Array.isArray(requiredValues)) {
            requiredValues = [condition.value];
          }
        } catch (e) {
          requiredValues = [condition.value];
        }

        let isConditionMet;
        if (Array.isArray(currentValue)) {
          // For checkboxes: check if any selected value is in required values
          isConditionMet = currentValue.some((v) => requiredValues.includes(v));
        } else {
          isConditionMet = requiredValues.includes(currentValue);
        }
        if (!isConditionMet) {
          allConditionsMet = false;
          break;
        }
      }

      const isConditionMet = allConditionsMet;

      // Получаем все инпуты в группе (для radio может быть несколько)
      const inputs = fieldGroup.querySelectorAll('input, select, textarea');

      if (isConditionMet) {
        fieldGroup.style.display = 'block';
        fieldGroup.style.opacity = '0';
        fieldGroup.style.transform = 'translateY(-10px)';
        setTimeout(() => {
          fieldGroup.style.transition = 'all 0.3s ease';
          fieldGroup.style.opacity = '1';
          fieldGroup.style.transform = 'translateY(0)';
        }, 10);

        // Восстанавливаем required атрибут, если он был сохранен
        inputs.forEach((input) => {
          if (input.dataset.wasRequired === 'true') {
            input.required = true;
          }
        });
      } else {
        fieldGroup.style.display = 'none';

        // Сохраняем и удаляем required атрибут, чтобы браузер не валидировал скрытые поля
        inputs.forEach((input) => {
          if (input.required) {
            input.dataset.wasRequired = 'true';
            input.required = false;
          }

          // Очищаем значение
          if (input.type !== 'radio' && input.type !== 'checkbox') {
            input.value = '';
          } else if (input.type === 'checkbox') {
            input.checked = false;
          }
        });
      }
    });
  };

  const triggerFields = new Set();
  conditionalFields.forEach((fieldGroup) => {
    const conditionsData = fieldGroup.dataset.conditionalConditions;

    if (conditionsData) {
      try {
        const conditions = JSON.parse(conditionsData);
        if (Array.isArray(conditions)) {
          conditions.forEach((cond) => {
            if (cond.field) {
              triggerFields.add(cond.field);
            }
          });
        }
      } catch (e) {
        // Миграция со старого формата
        const oldField = fieldGroup.dataset.conditionalField;
        if (oldField) {
          triggerFields.add(oldField);
        }
      }
    } else {
      // Миграция со старого формата
      const oldField = fieldGroup.dataset.conditionalField;
      if (oldField) {
        triggerFields.add(oldField);
      }
    }
  });

  triggerFields.forEach((fieldId) => {
    const field = form.querySelector(`[name="${fieldId}"]`);
    if (field) {
      const fieldConfig = currentConfig.fields.find((f) => f.id === fieldId);
      if (field.type === 'radio' || (fieldConfig && fieldConfig.type === 'checkboxes')) {
        // For radio and checkboxes, add listener to all inputs with the same name
        const allInputs = form.querySelectorAll(`[name="${fieldId}"]`);
        allInputs.forEach((input) => {
          input.addEventListener('change', updateConditionalVisibility);
        });
      } else {
        field.addEventListener('change', updateConditionalVisibility);
        field.addEventListener('input', updateConditionalVisibility);
      }
    }
  });

  updateConditionalVisibility();
}

// Функция для добавления условного сообщения в редактор
function addConditionalMessageToEditor(condMsg) {
  const condMsgItem = document.createElement('div');
  condMsgItem.className = 'conditional-message-item';
  condMsgItem.dataset.condMsgId = condMsg.id;

  condMsgItem.innerHTML = `
    <div class="condmsg-header">
      <span class="condmsg-title">💬 Условное сообщение</span>
      <button class="field-action-btn delete" title="Удалить">
        <i class="fas fa-trash"></i>
      </button>
    </div>
    <div class="condmsg-config">
      <div class="condmsg-condition">
        <label>Когда поле:</label>
        <select class="condmsg-field-select">
          <option value="">Выберите поле...</option>
        </select>
        <span>включает</span>
        <div class="condmsg-value-container"></div>
      </div>
      <div class="condmsg-message-input">
        <label>Отправить сообщение:</label>
        <textarea class="condmsg-message-textarea" rows="3" placeholder="Введите кастомное сообщение для Discord...">${
          condMsg.message || ''
        }</textarea>
      </div>
    </div>
  `;

  const deleteBtn = condMsgItem.querySelector('.delete');
  const fieldSelect = condMsgItem.querySelector('.condmsg-field-select');
  const valueContainer = condMsgItem.querySelector('.condmsg-value-container');
  const valueInput = condMsgItem.querySelector('.condmsg-value-input');
  const messageTextarea = condMsgItem.querySelector('.condmsg-message-textarea');

  function populateFieldSelect() {
    fieldSelect.innerHTML = '<option value="">Выберите поле...</option>';
    currentConfig.fields.forEach((f) => {
      if (f.type === 'select' || f.type === 'radio' || f.type === 'checkboxes') {
        const option = document.createElement('option');
        option.value = f.id;
        option.textContent = f.label;
        if (condMsg.field === f.id) {
          option.selected = true;
        }
        fieldSelect.appendChild(option);
      }
    });
  }

  function updateValueOptions(selectedFieldId) {
    const selectedField = currentConfig.fields.find((f) => f.id === selectedFieldId);

    if (!selectedField || !selectedField.options || selectedField.options.length === 0) {
      const input = document.createElement('input');
      input.type = 'text';
      input.className = 'condmsg-value-input';
      input.value = condMsg.value || '';
      input.placeholder = 'Значение';

      input.addEventListener('input', (e) => {
        condMsg.value = e.target.value;
        updateConfigFromEditor();
      });

      valueContainer.innerHTML = '';
      valueContainer.appendChild(input);
      return;
    }

    // Создаем контейнер с чекбоксами для множественного выбора
    const checkboxContainer = document.createElement('div');
    checkboxContainer.className = 'conditional-checkboxes';

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

    selectedField.options.forEach((opt) => {
      const label = document.createElement('label');
      label.className = 'conditional-checkbox-label';

      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.value = opt;
      checkbox.checked = currentValues.includes(opt);

      checkbox.addEventListener('change', () => {
        const allCheckboxes = checkboxContainer.querySelectorAll('input[type="checkbox"]');
        const selectedValues = Array.from(allCheckboxes)
          .filter((cb) => cb.checked)
          .map((cb) => cb.value);

        condMsg.value = JSON.stringify(selectedValues);
        updateConfigFromEditor();
      });

      label.appendChild(checkbox);
      label.appendChild(document.createTextNode(' ' + opt));
      checkboxContainer.appendChild(label);
    });

    valueContainer.innerHTML = '';
    valueContainer.appendChild(checkboxContainer);
  }

  populateFieldSelect();
  if (condMsg.field) {
    updateValueOptions(condMsg.field);
  }

  deleteBtn.addEventListener('click', () => {
    if (confirm('Удалить это условное сообщение?')) {
      currentConfig.conditionalMessages = currentConfig.conditionalMessages.filter(
        (cm) => cm.id !== condMsg.id
      );
      condMsgItem.remove();
      updateConfigFromEditor();
    }
  });

  fieldSelect.addEventListener('change', (e) => {
    condMsg.field = e.target.value;
    condMsg.value = '';
    if (e.target.value) {
      updateValueOptions(e.target.value);
    }
    updateConfigFromEditor();
  });

  messageTextarea.addEventListener('input', (e) => {
    condMsg.message = e.target.value;
    updateConfigFromEditor();
  });

  conditionalMessagesList.appendChild(condMsgItem);
}

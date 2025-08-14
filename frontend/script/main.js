document.addEventListener('DOMContentLoaded', async () => {
  let clientsArray = [];
  let sortDirection = 1;

  let currentClientId = null;
  let isAddClientOpened = false;

  // ----------------- modals -----------------

  function openModal(modalId) {
    const modal = document.getElementById(modalId);
    const backdrop = document.getElementById('modal-backdrop');

    clearError();

    backdrop.classList.add('show');
    modal.classList.add('show');

    const onBackdropClick = (e) => {
      if (modal.contains(e.target)) return;
      closeModal(modalId);
      backdrop.removeEventListener('click', onBackdropClick);
    };

    backdrop.addEventListener('click', onBackdropClick);
  }

  function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    const backdrop = document.getElementById('modal-backdrop');

    backdrop.classList.remove('show');
    modal.classList.remove('show');
    currentClientId = null;

    if (document.querySelectorAll(".form__input-label")) removeLabels();
    if (document.querySelector(".form__mark-1")) removeMarksFix(1);
    if (document.querySelector(".form__mark-2")) removeMarksFix(2);
  };


  // ----------------- dates -----------------

  function formatDate(date) {
    if (!(date instanceof Date) || isNaN(date)) return '';

    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, '0');
    const mins = date.getMinutes().toString().padStart(2, '0');

    return `${day}.${month}.${year} ${hours}:${mins}`;
  }

  // ----------------- client loading -----------------

  async function fetchClients(searchValue = '') {
    try {
      const url = searchValue
        ? `http://localhost:3000/api/clients?search=${encodeURIComponent(searchValue)}`
        : `http://localhost:3000/api/clients`;

      const response = await fetch(url, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) throw new Error(`Ошибка при загрузке: ${response.statusText}`);
      const data = await response.json();

      clientsArray = data.map(client => ({
        ...client,
        createdAt: new Date(client.createdAt),
        updatedAt: new Date(client.updatedAt),
      }));

      renderClientsTable(clientsArray);
    } catch (error) {
      console.error('Ошибка при загрузке клиентов:', error);
    }
  }

  // ----------------- table -----------------

  const tableBody = document.getElementById('tbody');

  function renderClientsTable(list) {
    tableBody.innerHTML = '';

    list.forEach(client => {
      const row = createClientRow(client);
      tableBody.append(row);
    });
  }

  function showClientContacts(contactItem, contactTd) {
    const icon = document.createElement('span');
    icon.classList.add('contact-icon');

    switch (contactItem.type) {
      case 'Vk':
        icon.classList.add('vk');
        break;
      case 'Телефон':
        icon.classList.add('phone');
        break;
      case 'Facebook':
        icon.classList.add('facebook');
        break;
      case 'Twitter':
        icon.classList.add('twitter');
        break;
      case 'Email':
        icon.classList.add('email');
        break;
    }

    const tooltipText = `${contactItem.type}: ${contactItem.value}`;
    icon.addEventListener('mouseenter', () => showTooltip(icon, tooltipText));
    icon.addEventListener('mouseleave', hideTooltip);
    contactTd.appendChild(icon);
  }

  function createClientRow(client) {
    const tr = document.createElement('tr');
    tr.classList.add('table__row')

    const tdId = document.createElement('td');
    tdId.textContent = client.id;
    tdId.classList.add('table__id');

    const tdFio = document.createElement('td');
    const fullName = `${client.surname} ${client.name} ${client.lastName || ''}`.trim();
    tdFio.textContent = fullName;
    tdFio.classList.add('table__nsl');

    const tdCreated = document.createElement('td');
    tdCreated.textContent = formatDate(client.createdAt);
    tdCreated.classList.add('table__cd');

    const tdUpdated = document.createElement('td');
    tdUpdated.textContent = formatDate(client.updatedAt);
    tdUpdated.classList.add('table__lc');

    const tdContacts = document.createElement('td');
    tdContacts.classList.add('table__cont');

    const MAX_CONTACTS_DISPLAY = 4;

    if (Array.isArray(client.contacts)) {
      client.contacts.slice(0, MAX_CONTACTS_DISPLAY).forEach(contact => {
        showClientContacts(contact, tdContacts);
      });

      const hiddenContacts = client.contacts.length - MAX_CONTACTS_DISPLAY;

      if (hiddenContacts > 0) {
        const moreButton = document.createElement('span');
        moreButton.textContent = `+${hiddenContacts}`;
        moreButton.classList.add('contact-icon__more');
        moreButton.addEventListener('click', () => {
          tdContacts.innerHTML = '';
          client.contacts.forEach(cont => {
            showClientContacts(cont, tdContacts);
          })
        });

        tdContacts.appendChild(moreButton);
      }
    }

    const tdActions = document.createElement('td');
    const btnEdit = document.createElement('button');
    btnEdit.textContent = 'Изменить';
    btnEdit.classList.add('clients__edit-btn', 'btn', 'btn-reset');
    btnEdit.addEventListener('click', () => openEditModal(client.id));

    const btnDelete = document.createElement('button');
    btnDelete.textContent = 'Удалить';
    btnDelete.classList.add('clients__delete-btn', 'btn', 'btn-reset');
    btnDelete.addEventListener('click', () => openDeleteModal(client.id));

    tdActions.append(btnEdit, btnDelete);
    tr.append(tdId, tdFio, tdCreated, tdUpdated, tdContacts, tdActions);
    return tr;
  }

  // ----------------- tooltip -----------------

  function showTooltip(targetElement, text) {
    const tooltip = document.createElement('div');
    tooltip.className = 'tooltip';
    tooltip.innerHTML = text;
    document.body.appendChild(tooltip);
    const rect = targetElement.getBoundingClientRect();
    tooltip.style.left = `${rect.left + window.scrollX}px`;
    tooltip.style.top = `${rect.top + window.scrollY - tooltip.offsetHeight}px`;
    tooltip.classList.add('show');
  }

  function hideTooltip() {
    const tooltip = document.querySelector('.tooltip');
    if (tooltip) {
      tooltip.classList.remove('show');
      tooltip.remove();
    }
  }

  // ----------------- client's form -----------------

  function readClientFormData() {
    return {
      surname: document.getElementById('input__lastname').value.trim(),
      name: document.getElementById('input__name').value.trim(),
      lastName: document.getElementById('input__surname').value.trim(),
      contacts: Array.from(document.querySelectorAll('.form__selin-item')).map(div => ({
        type: div.querySelector('.form__select').value,
        value: div.querySelector('.form__input-contact').value.trim(),
      })),
    };
  }

  function fillClientFormData(client) {
    document.getElementById('input__lastname').value = client?.surname || '';
    document.getElementById('input__name').value = client?.name || '';
    document.getElementById('input__surname').value = client?.lastName || '';

    const contactsContainer = document.getElementById('contacts-container');
    contactsContainer.innerHTML = '';

    if (Array.isArray(client?.contacts)) {
      client.contacts.forEach(contact => {
        addContactToContainer(contactsContainer, contact);
      });
    }

    const addButton = document.getElementById('form__add');

    if (client && client.id) {
      if (limitOfContacts(clientsArray, client.id)) {
        addButton.style.display = 'none';
      } else {
        addButton.style.display = 'block';
      }
    } else {
      addButton.style.display = 'block';
    }
  }

  function displayNone(arr) {
    arr.forEach(elem => elem.style.display = 'none');
  }

  function displayDefault(arr) {
    arr.forEach(elem => elem.style.display = '');
  }

  function labelsCheckValue(input, label) {
    if (input.value.trim() !== "") {
      label.classList.add('fix');
    } else {
      label.classList.remove('fix');
    }
  }

  function removeMarksFix(count) {
    const mark = document.querySelector(`.form__mark-${count}`);
    mark.classList.remove('fix');
  }

  function marksCheckValue(input, count) {
    const mark = document.querySelector(`.form__mark-${count}`);
    if (mark) {
      if (input.value.trim() !== "") {
        mark.classList.add('fix');
      } else {
        mark.classList.remove('fix');
      }
    }
  }

  function createLabels(fstInput, secInput, trdInput) {
    const labelOne = document.createElement('label');
    const labelTwo = document.createElement('label');
    const labelThree = document.createElement('label');

    labelOne.htmlFor = `${fstInput.id}`;
    labelTwo.htmlFor = `${secInput.id}`;
    labelThree.htmlFor = `${trdInput.id}`;

    labelOne.classList.add('form__input-label');
    labelTwo.classList.add('form__input-label');
    labelThree.classList.add('form__input-label');

    fstInput.parentElement.insertBefore(labelOne, fstInput);
    secInput.parentElement.insertBefore(labelTwo, secInput);
    trdInput.parentElement.insertBefore(labelThree, trdInput);

    labelsCheckValue(fstInput, labelOne);
    labelsCheckValue(secInput, labelTwo);
    labelsCheckValue(trdInput, labelThree);

    fstInput.addEventListener('input', () => labelsCheckValue(fstInput, labelOne));
    secInput.addEventListener('input', () => labelsCheckValue(secInput, labelTwo));
    trdInput.addEventListener('input', () => labelsCheckValue(trdInput, labelThree));

    return {
      labelOne,
      labelTwo,
      labelThree
    };
  };

  function setupClientModal({ title, showDelete, client, onSave, onDelete }) {
    openModal('clients-modal');

    const deleteLink = document.getElementById('form__delete');
    const idSpan = document.getElementById('id-span');
    const saveBtn = document.getElementById('form__save');
    const marks = document.querySelectorAll('.form__mark');
    const formItems = document.querySelectorAll('.form__list-item');

    const lastNameSpan = document.getElementById('lastname');
    const lastNameInput = document.getElementById('input__lastname');

    const nameSpan = document.getElementById('name');
    const nameInput = document.getElementById('input__name')

    const surnameSpan = document.getElementById('surname');
    const surnameInput = document.getElementById('input__surname');

    const switchHtmlElemsArray = [lastNameSpan, nameSpan, surnameSpan];

    document.querySelector('.modal__title').textContent = title;

    deleteLink.style.display = showDelete ? '' : 'none';

    idSpan.textContent = client ? `ID: ${client.id}` : '';

    fillClientFormData(client);

    saveBtn.onclick = null;
    saveBtn.onclick = async (e) => {
      e.preventDefault();
      onSave();
    };

    lastNameInput.addEventListener('input', () => {
      marksCheckValue(lastNameInput, 1);
    });

    nameInput.addEventListener('input', () => {
      marksCheckValue(nameInput, 2);
    });


    let i = 1;

    if (client == null) {
      displayNone(switchHtmlElemsArray);
      marks.forEach(mark => mark.classList.add(`form__mark-${i++}`));
      formItems.forEach(item => item.classList.add('mb-32'));

      const labels = createLabels(lastNameInput, nameInput, surnameInput);

      labels.labelOne.textContent = lastNameSpan.textContent;
      labels.labelTwo.textContent = nameSpan.textContent;
      labels.labelThree.textContent = surnameSpan.textContent;
    } else {
      displayDefault(switchHtmlElemsArray);
      marks.forEach(mark => mark.classList.remove(`form__mark-${i++}`));
      formItems.forEach(item => item.classList.remove('mb-32'));
    }

    deleteLink.onclick = null;

    if (showDelete && onDelete) {
      deleteLink.onclick = (e) => {
        e.preventDefault();
        onDelete();
      };
    }

    const closeBtn = document.getElementById('close-btn');
    closeBtn.onclick = () => closeModal('clients-modal');
  }

  // ----------------- editing and deleting -----------------

  const errorWrap = document.getElementById('error-wrap');
  const error = document.getElementById('error-span');

  function displayError(message) {
    error.textContent = message;
    errorWrap.classList.add('show');
  }

  function clearError() {
    errorWrap.classList.remove('show');
  }

  async function handleResponse(response) {
    if (!response.ok) {
      if (response.status === 400 || response.status === 422) {
        const errorData = await response.json();
        if (errorData.errors) {
          const messages = errorData.errors.map(err => err.message).join('; ');
          throw new Error(`Ошибка валидации: ${messages}`);
        }
      }
      throw new Error(`Ошибка сервера: ${response.statusText}`);
    }
    return response.json();
  }

  async function fetchClientById(clientId) {
    const response = await fetch(`http://localhost:3000/api/clients/${clientId}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!response.ok) {
      throw new Error(`Ошибка при загрузке клиента: ${response.statusText}`);
    }
    const client = await response.json();
    client.createdAt = new Date(client.createdAt);
    client.updatedAt = new Date(client.updatedAt);
    return client;
  }

  async function fetchClient(clientId, formData, method) {
    if (clientId) {
      const response = await fetch(`http://localhost:3000/api/clients/${clientId}`, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const client = await handleResponse(response);
      client.createdAt = new Date(client.createdAt);
      client.updatedAt = new Date(client.updatedAt);

      return client;
    } else {
      const response = await fetch(`http://localhost:3000/api/clients`, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const client = await handleResponse(response);
      client.createdAt = new Date(client.createdAt);
      client.updatedAt = new Date(client.updatedAt);

      return client;
    }
  }

  function removeLabels() {
    document.querySelectorAll(".form__input-label").forEach(label => {
      label.remove();
    });
  }

  async function openEditModal(clientId) {
    currentClientId = clientId;
    try {
      const client = await fetchClientById(currentClientId);

      if (isAddClientOpened) {
        removeLabels();
      }

      setupClientModal({
        title: 'Изменить данные',
        showDelete: true,
        client,
        onSave: async () => {
          const formData = readClientFormData();

          try {
            await fetchClient(currentClientId, formData, 'PATCH');

            await fetchClients();

            closeModal('clients-modal');
            clearError();
          } catch (err) {
            if (err.message.startsWith('Ошибка валидации')) {
              displayError('Ошибка: новая модель организацинной деятельности предпологает независимые способы реализации поставленных обществом задач!');
            } else {
              displayError('Что-то пошло не так...')
            }
          }
        },
        onDelete: () => {
          closeModal('clients-modal');
          openDeleteModal(clientId);
        },
      });
    } catch (error) {
      console.error('Не удалось открыть модалку редактирования:', error);
    }
  }

  function openAddModal() {
    setupClientModal({
      title: 'Новый клиент',
      showDelete: false,
      client: null,
      onSave: async () => {
        const formData = readClientFormData();

        try {
          await fetchClient(null, formData, 'POST');

          await fetchClients();

          closeModal('clients-modal');
          clearError();
        } catch (err) {
          if (err.message.startsWith('Ошибка валидации')) {
            displayError('Ошибка: новая модель организацинной деятельности предпологает независимые способы реализации поставленных обществом задач!');
          } else {
            displayError('Что-то пошло не так...');
          }
        }
      },
    });
  }

  // ----------------- deleting -----------------

  async function deleteClientById(clientId) {
    const response = await fetch(`http://localhost:3000/api/clients/${clientId}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error(`Ошибка при удалении: ${response.statusText}`);
    clientsArray = clientsArray.filter(c => c.id !== clientId);

    renderClientsTable(clientsArray);
  }

  function openDeleteModal(clientId) {
    openModal('delete-modal');

    const deletePositive = document.getElementById('delete-positive');
    deletePositive.onclick = async (e) => {
      e.preventDefault();
      try {
        await deleteClientById(clientId);
        closeModal('delete-modal');
        error.classList.remove('show');
      } catch (err) {
        console.error(err);
        error.classList.add('show');
      }
    };

    const closeBtn = document.getElementById('close-modal');
    closeBtn.onclick = () => closeModal('delete-modal');
    const cancelBtn = document.getElementById('delete-negative');
    cancelBtn.onclick = () => closeModal('delete-modal');
  }

  // ----------------- contact's box -----------------

  function updateAddButtonVisibility() {
    const contactsContainer = document.getElementById('contacts-container');
    const contactItems = contactsContainer.querySelectorAll('.form__selin-item');
    const addButton = document.getElementById('form__add');

    if (contactItems.length >= 10) {
      addButton.style.display = 'none';
    } else {
      addButton.style.display = '';
    }
  }

  function limitOfContacts(clientsArr, clientId) {
    const client = clientsArr.find(c => c.id === clientId);
    if (!client) return false;

    return client.contacts.length >= 10;
  }

  function limitOfContactsContainer(container) {
    return container.querySelectorAll('.form__selin-item').length >= 10;
  }

  function addContactToContainer(container, contact = { type: 'Телефон', value: '' }) {
    if (limitOfContactsContainer(container)) {
      document.getElementById('form__add').style.display = 'none';
      return;
    }

    const contactDiv = createContactField(contact);
    container.appendChild(contactDiv);

    updateAddButtonVisibility();
  }

  function createContactField(contact) {
    const contactDiv = document.createElement('div');
    contactDiv.classList.add('form__selin-item', 'flex');

    const selectType = document.createElement('select');
    selectType.classList.add('form__select');
    const options = [
      { value: 'Телефон', label: 'Телефон' },
      { value: 'Email', label: 'Email' },
      { value: 'Facebook', label: 'Facebook' },
      { value: 'Vk', label: 'Vk' },
      { value: 'Twitter', label: 'Twitter' },
    ];
    options.forEach(opt => {
      const option = document.createElement('option');
      option.value = opt.value;
      option.textContent = opt.label;
      if (contact.type === opt.value) option.selected = true;
      selectType.appendChild(option);
    });

    const contactInput = document.createElement('input');
    contactInput.type = 'text';
    contactInput.classList.add('form__input', 'form__input-contact');
    contactInput.value = contact.value;

    const contactDelete = document.createElement('button');
    contactDelete.classList.add('form__input-delete', 'btn-reset');
    contactDelete.addEventListener('click', (e) => {
      e.preventDefault();
      contactDiv.remove();

      updateAddButtonVisibility();
    })

    contactDiv.append(selectType, contactInput, contactDelete);
    return contactDiv;
  }

  document.getElementById('form__add').addEventListener('click', function (e) {
    e.preventDefault();
    const contactsContainer = document.getElementById('contacts-container');

    if (limitOfContactsContainer(contactsContainer)) {
      document.getElementById('form__add').style.display = 'none';
      console.error('Контактов больше, чем 10!');
    } else {
      addContactToContainer(contactsContainer, { type: 'Телефон', value: '' });
    }
  });

  // ----------------- sorting and searching -----------------

  const searchInput = document.getElementById('input-search');
  searchInput.addEventListener('input', async () => {
    const value = searchInput.value.trim();
    setTimeout(async () => {
      await fetchClients(value);
    }, 300);
  });

  const idCol = document.querySelector('.clients__id');
  const slnCol = document.querySelector('.clients__sln');
  const dataCol = document.querySelector('.clients__data');
  const changesCol = document.querySelector('.clients__changes');

  idCol.addEventListener('click', function () {
    sortTable('id', this);
  });

  slnCol.addEventListener('click', function () {
    sortTable('surname', this);
  });

  dataCol.addEventListener('click', function () {
    sortTable('createdAt', this);
  });

  changesCol.addEventListener('click', function () {
    sortTable('updatedAt', this);
  });

  function changeSvg(headerElement, sDirection) {
    if (sDirection === 1) {
      headerElement.style.backgroundImage = "url('./img/arrowup.svg')";
    } else {
      headerElement.style.backgroundImage = "url('./img/arrowdown.svg')";
    }
  }

  function sortTable(column, element) {
    sortDirection = sortDirection === 1 ? -1 : 1;

    changeSvg(element, sortDirection);

    clientsArray.sort((a, b) => {
      if (a[column] > b[column]) return sortDirection;
      if (a[column] < b[column]) return -sortDirection;
      return 0;
    });

    renderClientsTable(clientsArray);
  }


  // ----------------- "add cleint" button -----------------

  const addClientBtn = document.getElementById('add-client');
  addClientBtn.addEventListener('click', () => {
    isAddClientOpened = true;
    openAddModal()
  });

  await fetchClients();

  isEmpty();

  // ----------------- empty list check -----------------

  function isEmpty() {
    const id = document.querySelector('.clients__id');
    const sln = document.querySelector('.clients__sln');
    const data = document.querySelector('.clients__data');
    const changes = document.querySelector('.clients__changes');
    const contact = document.querySelector('.clients__cont');
    const act = document.querySelector('.clients__act');

    if (clientsArray.length <= 0) {
      id.classList.add('empty');
      sln.classList.add('empty');
      data.classList.add('empty');
      changes.classList.add('empty');
      contact.classList.add('empty');
      act.classList.add('empty');
    } else {
      id.classList.remove('empty');
      sln.classList.remove('empty');
      data.classList.remove('empty');
      changes.classList.remove('empty');
      contact.classList.remove('empty');
      act.classList.remove('empty');
    }
  }
});

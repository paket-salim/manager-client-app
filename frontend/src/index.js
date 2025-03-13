import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import * as apiModule from './services/api';
import './styles.css';

// Функция создания менеджера с выбором профиля
const handleAddManager = async (setManagers) => {
  const fullName = prompt("Введите ФИО менеджера:");

  // Получаем профили обслуживания
  const profiles = await apiModule.getServiceProfiles();
  if (profiles.length === 0) {
    alert("Нет доступных профилей обслуживания.");
    return;
  }

  if (!fullName) {
    alert("Необходимо заполнить все поля!");
    return;
  }

  try {
    // Выбор профиля обслуживания через модальное окно
    const serviceProfileId = await selectServiceProfile();
    if (!serviceProfileId) {
      alert("Профиль обслуживания не выбран.");
      return;
    }

    const newManager = await apiModule.addManager(fullName, serviceProfileId);
    alert("Менеджер успешно добавлен!");
    // Добавляем созданного менеджера с правильным именем профиля
    const updatedManager = {
      ...newManager,
      service_profile_id: serviceProfileId,
      profile_name: newManager.profile_name, // Корректно добавляем имя профиля
    };
    setManagers((prev) => [...prev, updatedManager]);  // Локальное обновление состояния
  } catch (error) {
    alert("Ошибка при добавлении менеджера.");
  }
};

// Функция удаления менеджера
const handleDeleteManager = async (id, setManagers) => {
  if (window.confirm("Вы уверены, что хотите удалить менеджера?")) {
    try {
      await apiModule.deleteManager(id);
      alert("Менеджер успешно удалён!");
      setManagers((prev) => prev.filter((manager) => manager.id !== id));
    } catch (error) {
      alert("Ошибка при удалении менеджера.");
    }
  }
};

// Функция редактирования менеджера
const handleEditManager = async (id, setManagers) => {
  const fullName = prompt("Введите новое ФИО менеджера:");
  if (!fullName) {
    alert("ФИО не может быть пустым!");
    return;
  }

  try {
    // Выбор нового профиля обслуживания
    const serviceProfileId = await selectServiceProfile();
    if (!serviceProfileId) {
      alert("Профиль обслуживания не выбран.");
      return;
    }

    console.log("Редактируем менеджера с ID:", id);
    console.log("Передаем данные на сервер:", { fullName, serviceProfileId });

    // Отправляем обновлённые данные на сервер
    const updatedManager = await apiModule.updateManager(id, fullName, serviceProfileId);
    alert("Менеджер успешно обновлён!");

    // Немедленно обновляем состояние на клиенте
    setManagers((prev) =>
      prev.map((manager) =>
        manager.id === id
          ? {
              ...manager,
              full_name: updatedManager.full_name,
              service_profile_id: updatedManager.service_profile_id,
              profile_name: updatedManager.profile_name, // Добавляем имя профиля
            }
          : manager
      )
    );
  } catch (error) {
    alert("Ошибка при обновлении менеджера.");
  }
};

// Добавить клиента к менеджеру
const handleAddClient = async (managerId, setManagers) => {
  const companyName = prompt("Введите наименование компании:");
  const legalForm = prompt("Введите организационную форму:");

  if (!companyName || !legalForm) {
    alert("Необходимо заполнить все поля!");
    return;
  }

  try {
    // Получаем всех менеджеров и ищем нужного
    const managers = await apiModule.getManagers();
    const manager = managers.find((m) => m.id === managerId);

    if (!manager) {
      alert("Менеджер не найден.");
      return;
    }

    const serviceProfileId = manager.service_profile_id;

    // Логируем параметры перед отправкой
    console.log("Добавляем клиента с параметрами:", {
      managerId,
      companyName,
      legalForm,
      serviceProfileId,
    });

    // Добавляем клиента на сервере
    const newClient = await apiModule.addClient(managerId, companyName, legalForm, serviceProfileId);
    alert("Клиент успешно добавлен!");

    // Обновляем локально состояние менеджера с новым клиентом
    setManagers((prev) =>
      prev.map((m) =>
        m.id === managerId ? { ...m, clients: [...m.clients, newClient] } : m
      )
    );
  } catch (error) {
    if (error.response && error.response.data && error.response.data.error) {
      alert(error.response.data.error); // Показываем сообщение с сервера
    } else {
      alert("Ошибка при добавлении клиента.");
    }
  }
};

// Функция удаления клиента
const handleDeleteClient = async (clientId, managerId, setManagers) => {
  if (window.confirm("Вы уверены, что хотите удалить клиента?")) {
    try {
      await apiModule.deleteClient(clientId);
      alert("Клиент успешно удалён!");
      setManagers((prev) =>
        prev.map((manager) =>
          manager.id === managerId
            ? { ...manager, clients: manager.clients.filter((client) => client.id !== clientId) }
            : manager
        )
      );
    } catch (error) {
      alert("Ошибка при удалении клиента.");
    }
  }
};

// Функция добавления профиля обслуживания
const handleAddServiceProfile = async () => {
  const name = prompt("Введите название нового профиля обслуживания:");

  if (!name) {
    alert("Название профиля не может быть пустым.");
    return;
  }

  try {
    await apiModule.addServiceProfile(name);
    alert("Профиль обслуживания успешно добавлен!");
  } catch (error) {
    alert("Ошибка при добавлении профиля обслуживания.");
  }
};

// Перевести клиента к другому менеджеру
const handleTransferClient = async (clientId, currentManagerId, setManagers) => {
  try {
    // Получаем всех менеджеров
    const managers = await apiModule.getManagers();

    if (managers.length === 0) {
      alert("Нет доступных менеджеров для перевода.");
      return;
    }

    // Создаём выпадающее окно с выбором менеджера
    const newManagerId = await new Promise((resolve) => {
      const modal = document.createElement("div");
      modal.className = "modal";
      modal.style.position = "fixed";
      modal.style.top = "50%";
      modal.style.left = "50%";
      modal.style.transform = "translate(-50%, -50%)";
      modal.style.backgroundColor = "#fff";
      modal.style.padding = "20px";
      modal.style.borderRadius = "8px";
      modal.style.boxShadow = "0 4px 8px rgba(0, 0, 0, 0.1)";

      const select = document.createElement("select");
      select.style.width = "100%";
      select.style.marginBottom = "10px";

      managers.forEach((manager) => {
        if (manager.id !== currentManagerId) {
          const option = document.createElement("option");
          option.value = manager.id;
          option.textContent = `${manager.full_name}`;
          select.appendChild(option);
        }
      });

      const confirmButton = document.createElement("button");
      confirmButton.textContent = "Перевести";
      confirmButton.style.marginRight = "10px";

      const cancelButton = document.createElement("button");
      cancelButton.textContent = "Отмена";

      modal.appendChild(select);
      modal.appendChild(confirmButton);
      modal.appendChild(cancelButton);
      document.body.appendChild(modal);

      confirmButton.onclick = () => {
        const selectedManagerId = parseInt(select.value, 10);
        document.body.removeChild(modal);
        resolve(selectedManagerId);
      };

      cancelButton.onclick = () => {
        document.body.removeChild(modal);
        resolve(null);
      };
    });

    if (!newManagerId) {
      alert("Перевод отменён.");
      return;
    }

    // Переводим клиента на сервере
    await apiModule.transferClient(clientId, newManagerId);
    alert("Клиент успешно переведён к другому менеджеру!");

    // Получаем данные клиента для корректного отображения
    const updatedClient = await apiModule.getClient(clientId);

    // Удаляем клиента у старого менеджера
    setManagers((prev) =>
      prev.map((manager) =>
        manager.id === currentManagerId
          ? { ...manager, clients: manager.clients.filter((client) => client.id !== clientId) }
          : manager
      )
    );

    // Добавляем клиента к новому менеджеру с полной информацией
    setManagers((prev) =>
      prev.map((manager) =>
        manager.id === newManagerId
          ? { ...manager, clients: [...manager.clients, updatedClient] }
          : manager
      )
    );
  } catch (error) {
    alert("Ошибка при переводе клиента.");
  }
};

// Открыть окно с выбором профиля обслуживания
const selectServiceProfile = async () => {
  const profiles = await apiModule.getServiceProfiles();

  if (profiles.length === 0) {
    alert("Нет доступных профилей обслуживания.");
    return null;
  }

  return new Promise((resolve) => {
    const modal = document.createElement("div");
    modal.className = "modal";
    modal.style.position = "fixed";
    modal.style.top = "50%";
    modal.style.left = "50%";
    modal.style.transform = "translate(-50%, -50%)";
    modal.style.backgroundColor = "#fff";
    modal.style.padding = "20px";
    modal.style.borderRadius = "8px";
    modal.style.boxShadow = "0 4px 8px rgba(0, 0, 0, 0.1)";

    const select = document.createElement("select");
    select.style.width = "100%";
    select.style.marginBottom = "10px";

    profiles.forEach((profile) => {
      const option = document.createElement("option");
      option.value = profile.id;
      option.textContent = profile.name;
      select.appendChild(option);
    });

    const confirmButton = document.createElement("button");
    confirmButton.textContent = "Выбрать";
    confirmButton.style.marginRight = "10px";

    const cancelButton = document.createElement("button");
    cancelButton.textContent = "Отмена";

    modal.appendChild(select);
    modal.appendChild(confirmButton);
    modal.appendChild(cancelButton);
    document.body.appendChild(modal);

    confirmButton.onclick = () => {
      const selectedProfileId = parseInt(select.value, 10);
      document.body.removeChild(modal);
      resolve(selectedProfileId);
    };

    cancelButton.onclick = () => {
      document.body.removeChild(modal);
      resolve(null);
    };
  });
};

const ManagerCard = ({ manager, setManagers }) => {
  return (
    <div className="manager-card">
      <h3>{manager.full_name}</h3>
      <p><strong>Профиль обслуживания:</strong> {manager.profile_name || 'Не указан'}</p>
      <h4>Клиенты:</h4>
      <ul>
        {manager.clients && manager.clients.length > 0 ? (
          manager.clients.map((client) => (
            <li key={client.id}>
              {client.company_name} ({client.legal_form})
              <button onClick={() => handleDeleteClient(client.id, manager.id, setManagers)}>Удалить клиента</button>
              <button onClick={() => handleTransferClient(client.id, manager.id, setManagers)}>Перевести клиента</button>
            </li>
          ))
        ) : (
          <p>Нет клиентов</p>
        )}
      </ul>
      <button onClick={() => handleAddClient(manager.id, setManagers)}>Добавить клиента</button>
      <button onClick={() => handleEditManager(manager.id, setManagers)}>Редактировать менеджера</button>
      <button onClick={() => handleDeleteManager(manager.id, setManagers)}>Удалить менеджера</button>
    </div>
  );
};

const App = () => {
  const [managers, setManagers] = useState([]);

  const loadManagers = async () => {
    try {
      const data = await apiModule.getManagers();
      console.log('Загружены менеджеры:', data);
      setManagers(data);
    } catch (error) {
      console.error('Ошибка загрузки менеджеров:', error);
    }
  };

  // Логируем менеджеров после загрузки
useEffect(() => {
  const loadManagers = async () => {
    const data = await apiModule.getManagers();
    console.log("Загружены менеджеры:", data); // Логируем данные менеджеров
    setManagers(data);
  };
  loadManagers();
}, []);

  return (
    <div>
      <h1>Отдел по работе с юрлицами</h1>
      <button onClick={() => handleAddManager(setManagers)}>+ Добавить менеджера</button>
      <button onClick={handleAddServiceProfile}>+ Добавить профиль обслуживания</button>
      <div className="manager-list">
        {managers.map((manager) => (
          <ManagerCard key={manager.id} manager={manager} setManagers={setManagers} />
        ))}
      </div>
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);

import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api'; // Базовый URL сервера

// Получить список менеджеров
export const getManagers = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/managers`);
    console.log('Ответ API (менеджеры):', response.data); // Логируем ответ
    return response.data;
  } catch (error) {
    console.error('Ошибка при получении менеджеров:', error);
    return [];
  }
};

// Добавить менеджера
export const addManager = async (fullName, serviceProfileId) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/managers`, { fullName, serviceProfileId });
    return response.data;
  } catch (error) {
    console.error('Ошибка при добавлении менеджера:', error);
    throw error;
  }
};

// Удалить менеджера
export const deleteManager = async (id) => {
  try {
    await axios.delete(`${API_BASE_URL}/managers/${id}`);
  } catch (error) {
    console.error('Ошибка при удалении менеджера:', error);
    throw error;
  }
};

// Обновить менеджера
export const updateManager = async (id, fullName, serviceProfileId) => {
  try {
    console.log("Отправляем запрос на обновление менеджера:", { id, fullName, serviceProfileId });
    const response = await axios.put(`${API_BASE_URL}/managers/${id}`, { fullName, serviceProfileId });
    console.log("Ответ от сервера:", response.data);
    return response.data;
  } catch (error) {
    console.error("Ошибка при обновлении менеджера:", error);
    if (error.response) {
      console.error("Ответ от сервера:", error.response.data);
    }
    throw error;
  }
};

// Получить список всех клиентов
export const getClients = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/clients`);
    return response.data;
  } catch (error) {
    console.error('Ошибка при получении клиентов:', error);
    return [];
  }
};

// Получить список клиентов конкретного менеджера
export const getClientsByManager = async (managerId) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/managers/${managerId}/clients`);
    return response.data;
  } catch (error) {
    console.error(`Ошибка при получении клиентов менеджера ${managerId}:`, error);
    return [];
  }
};

// Получить данные клиента по ID
export const getClient = async (clientId) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/clients/${clientId}`);
    return response.data;
  } catch (error) {
    console.error('Ошибка при получении клиента:', error);
    throw error;
  }
};

// Добавить клиента
export const addClient = async (managerId, companyName, legalForm, serviceProfileId) => {
  try {
    console.log('Отправляем запрос на создание клиента:', {
      managerId,
      companyName,
      legalForm,
      serviceProfileId,
    });

    const response = await axios.post(`${API_BASE_URL}/clients`, {
      companyName,
      legalForm,
      assignedManagerId: managerId,
      serviceProfileId
    });
    return response.data;
  } catch (error) {
    console.error('Ошибка при добавлении клиента:', error);
    throw error;
  }
};

// Обновить данные клиента
export const updateClient = async (clientId, updatedData) => {
  try {
    const response = await axios.put(`${API_BASE_URL}/clients/${clientId}`, updatedData);
    return response.data;
  } catch (error) {
    console.error(`Ошибка при обновлении клиента ${clientId}:`, error);
    throw error;
  }
};

// Обновить профиль обслуживания клиента
export const updateClientProfile = async (clientId, newProfileId) => {
  try {
    const response = await axios.put(`${API_BASE_URL}/clients/${clientId}/profile`, {
      serviceProfileId: newProfileId
    });
    return response.data;
  } catch (error) {
    console.error(`Ошибка при обновлении профиля клиента ${clientId}:`, error);
    throw error;
  }
};

// Удалить клиента
export const deleteClient = async (clientId) => {
  try {
    await axios.delete(`${API_BASE_URL}/clients/${clientId}`);
  } catch (error) {
    console.error(`Ошибка при удалении клиента ${clientId}:`, error);
    throw error;
  }
};

// Перевести клиента другому менеджеру
export const transferClient = async (clientId, newManagerId) => {
  try {
    const response = await axios.put(`${API_BASE_URL}/clients/${clientId}/transfer`, {
      newManagerId
    });
    return response.data;
  } catch (error) {
    console.error(`Ошибка при переводе клиента ${clientId}:`, error);
    throw error;
  }
};

// Получить список профилей обслуживания
export const getServiceProfiles = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/service-profiles`);
    return response.data;
  } catch (error) {
    console.error('Ошибка при получении профилей обслуживания:', error);
    return [];
  }
};

// Добавить новый профиль обслуживания
export const addServiceProfile = async (profileName) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/service-profiles`, { name: profileName });
    return response.data;
  } catch (error) {
    console.error('Ошибка при добавлении профиля обслуживания:', error);
    throw error;
  }
};

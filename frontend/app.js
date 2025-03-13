import { getManagers, getClientsByManager } from './api.js';

const managersContainer = document.getElementById('managers-container');

async function loadManagers() {
    managersContainer.innerHTML = ''; // Очищаем перед загрузкой

    const managers = await getManagers();
    
    for (const manager of managers) {
        const managerCard = document.createElement('div');
        managerCard.classList.add('manager-card');
        managerCard.innerHTML = `
            <h3>${manager.fullName}</h3>
            <p><strong>ID:</strong> ${manager.id}</p>
            <p><strong>Профиль:</strong> ${manager.serviceProfileName}</p>
            <button class="delete-manager-btn" data-id="${manager.id}">Удалить</button>
            <h4>Клиенты:</h4>
            <ul class="client-list" id="clients-${manager.id}"></ul>
            <button class="add-client-btn" data-id="${manager.id}">Добавить клиента</button>
        `;

        managersContainer.appendChild(managerCard);

        // Загружаем клиентов менеджера
        await loadClients(manager.id);
    }
}

async function loadClients(managerId) {
    const clientList = document.getElementById(`clients-${managerId}`);
    clientList.innerHTML = '';

    const clients = await getClientsByManager(managerId);
    clients.forEach(client => {
        const li = document.createElement('li');
        li.textContent = `${client.name} (${client.organizationType})`;
        clientList.appendChild(li);
    });
}

// Загружаем менеджеров при открытии страницы
document.addEventListener('DOMContentLoaded', loadManagers);

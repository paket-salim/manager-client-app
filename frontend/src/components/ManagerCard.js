import React, { useState } from 'react';
import ClientItem from './ClientItem';
import EditManagerModal from './EditManagerModal';
import TransferClientModal from './TransferClientModal';
import { deleteClient, deleteManager } from '../services/api';

const ManagerCard = ({ manager, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isTransferring, setIsTransferring] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);

  const handleDeleteManager = async () => {
    await deleteManager(manager.id);
    onUpdate();
  };

  const handledeleteClient = async (clientId) => {
    await deleteClient(manager.id, clientId);
    onUpdate();
  };

  const handleTransferClient = (client) => {
    setSelectedClient(client);
    setIsTransferring(true);
  };

  return (
    <div className="manager-card">
      <h3>{manager.name}</h3>
      <p>Email: {manager.email}</p>
      <p>Профиль: <strong>{manager.service_profile_name}</strong></p>
      
      <button onClick={() => setIsEditing(true)}>✏️ Редактировать</button>
      <button onClick={handleDeleteManager}>❌ Удалить</button>

      <h4>Клиенты:</h4>
      <ul>
        {manager.clients.map(client => (
          <ClientItem 
            key={client.id} 
            client={client} 
            onRemove={() => handledeleteClient(client.id)} 
            onTransfer={() => handleTransferClient(client)}
          />
        ))}
      </ul>

      {isEditing && <EditManagerModal manager={manager} onClose={() => setIsEditing(false)} onUpdate={onUpdate} />}
      {isTransferring && <TransferClientModal client={selectedClient} onClose={() => setIsTransferring(false)} onUpdate={onUpdate} />}
    </div>
  );
};

export default ManagerCard;

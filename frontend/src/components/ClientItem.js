import React from 'react';

const ClientItem = ({ client, onRemove, onTransfer }) => (
  <li>
    {client.name} ({client.organization_type})
    <button onClick={onTransfer}>🔄 Перевести</button>
    <button onClick={onRemove}>❌ Удалить</button>
  </li>
);

export default ClientItem;

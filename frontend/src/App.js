import React, { useEffect, useState } from 'react';
import { getManagers, addManager } from './services/api';
import ManagerCard from './components/ManagerCard';
import AddManagerModal from './components/AddManagerModal';
import './App.css';

const App = () => {
  const [managers, setManagers] = useState([]);
  const [isAdding, setIsAdding] = useState(false);

  const loadManagers = async () => {
    const data = await getManagers();
    setManagers(data);
  };

  useEffect(() => {
    loadManagers();
  }, []);

  return (
    <div className="app-container">
      <button className="add-manager-btn" onClick={() => setIsAdding(true)}>➕ Добавить менеджера</button>
      <div className="managers-grid">
        {managers.map(manager => (
          <ManagerCard key={manager.id} manager={manager} onUpdate={loadManagers} />
        ))}
      </div>
      {isAdding && <AddManagerModal onClose={() => setIsAdding(false)} onUpdate={loadManagers} />}
    </div>
  );
};

export default App;

import { useState } from 'react';
import './Admin.css'; // On va créer ce CSS après

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('sliders');

  const menuItems = [
    { id: 'sliders', label: 'Sliders Accueil', icon: '🖼️' },
    { id: 'content', label: 'Contenu & Services', icon: '📝' },
    { id: 'podcasts', label: 'Podcasts & Store', icon: '🎙️' },
    { id: 'users', label: 'Utilisateurs', icon: '👥' },
  ];

  return (
    <div className="admin-container">
      {/* SIDEBAR */}
      <aside className="admin-sidebar">
        <div className="admin-logo">ABAWI <span>ADMIN</span></div>
        <nav>
          {menuItems.map(item => (
            <button 
              key={item.id} 
              className={activeTab === item.id ? 'active' : ''} 
              onClick={() => setActiveTab(item.id)}
            >
              {item.icon} {item.label}
            </button>
          ))}
        </nav>
        <button className="logout-btn">Déconnexion</button>
      </aside>

      {/* MAIN CONTENT */}
      <main className="admin-main">
        <header>
          <h2>Gestion des {activeTab}</h2>
          <button className="add-btn">+ Ajouter un élément</button>
        </header>

        <section className="admin-content-grid">
          {/* Simulation de liste d'objets */}
          {[1, 2, 3].map(i => (
            <div key={i} className="admin-card">
              <div className="card-preview">Image Preview</div>
              <div className="card-details">
                <h4>Élément #{i}</h4>
                <p>Dernière modification : Aujourd'hui</p>
                <div className="card-actions">
                  <button className="edit">Éditer</button>
                  <button className="delete">Supprimer</button>
                </div>
              </div>
            </div>
          ))}
        </section>
      </main>

      <style>{`
        .admin-container { display: flex; min-height: 100vh; background: var(--bg-primary); color: var(--text-primary); font-family: sans-serif; }
        .admin-sidebar { width: 260px; background: var(--bg-card); padding: 30px; border-right: 1px solid var(--border); }
        .admin-logo { font-size: 1.5rem; font-weight: 900; color: var(--gold); margin-bottom: 50px; }
        .admin-logo span { color: var(--text-primary); opacity: 0.5; font-size: 0.8rem; }
        nav button { width: 100%; text-align: left; padding: 15px; margin-bottom: 10px; background: none; border: none; color: var(--text-secondary); cursor: pointer; border-radius: 10px; transition: 0.3s; }
        nav button.active { background: var(--gold); color: #000; font-weight: 700; }
        .admin-main { flex: 1; padding: 40px; }
        header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 40px; }
        .add-btn { background: var(--green); color: #fff; border: none; padding: 12px 25px; border-radius: 30px; cursor: pointer; font-weight: 700; }
        .admin-content-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 20px; }
        .admin-card { background: var(--bg-card); border-radius: 20px; overflow: hidden; border: 1px solid var(--border); }
        .card-preview { height: 150px; background: var(--bg-primary); display: flex; align-items: center; justify-content: center; color: var(--text-muted); }
        .card-details { padding: 20px; }
        .card-actions { display: flex; gap: 10px; margin-top: 15px; }
        .card-actions button { flex: 1; padding: 8px; border-radius: 5px; border: none; cursor: pointer; font-size: 0.8rem; }
        .edit { background: var(--bg-primary); color: var(--text-primary); }
        .delete { background: rgba(220, 38, 38, 0.2); color: var(--red); }
      `}</style>
    </div>
  );
}
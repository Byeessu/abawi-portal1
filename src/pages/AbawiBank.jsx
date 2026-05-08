import { useState, useEffect } from 'react'
import SEO from '../components/SEO'
import { Link } from 'react-router-dom'

const BANKS = [
  { id: 'cbao', name: 'CBAO', logo: '🏦', color: '#1B5E20' },
  { id: 'societe', name: 'Société Générale', logo: 'SG', color: '#E53935' },
  { id: 'ecobank', name: 'Ecobank', logo: 'E', color: '#1565C0' },
  { id: 'orabank', name: 'Orabank', logo: 'O', color: '#F57C00' },
  { id: 'uba', name: 'UBA', logo: 'UBA', color: '#D32F2F' },
  { id: 'nsia', name: 'NSIA Banque', logo: 'N', color: '#6A1B9A' },
  { id: 'bicis', name: 'BICIS', logo: 'B', color: '#0277BD' },
  { id: 'coris', name: 'Coris Bank', logo: 'C', color: '#2E7D32' },
]

export default function AbawiBank() {
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [showSubscribeModal, setShowSubscribeModal] = useState(false)
  const [accounts, setAccounts] = useState([])
  const [newAccount, setNewAccount] = useState({
    bank: '',
    accountNumber: '',
    accountName: '',
    branch: '',
    isPrimary: false
  })
  const [activeTab, setActiveTab] = useState('accounts')

  useEffect(() => {
    // Check if user is subscribed
    const user = JSON.parse(localStorage.getItem('abawi_user') || '{}')
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Sync from external source (localStorage, props, async result) — refactor to derived state where feasible
    setIsSubscribed(user.isSubscribed || false)
    
    // Load saved accounts
    const savedAccounts = JSON.parse(localStorage.getItem('abawi_accounts') || '[]')
    setAccounts(savedAccounts)
  }, [])

  const addAccount = () => {
    if (!newAccount.bank || !newAccount.accountNumber || !newAccount.accountName) {
      alert('Veuillez remplir tous les champs obligatoires')
      return
    }
    
    const account = {
      id: Date.now().toString(),
      ...newAccount,
      createdAt: new Date().toISOString()
    }
    
    const updatedAccounts = [...accounts, account]
    setAccounts(updatedAccounts)
    localStorage.setItem('abawi_accounts', JSON.stringify(updatedAccounts))
    
    setNewAccount({
      bank: '',
      accountNumber: '',
      accountName: '',
      branch: '',
      isPrimary: false
    })
    
    setShowSubscribeModal(false)
  }

  const deleteAccount = (id) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce compte ?')) {
      const updatedAccounts = accounts.filter(a => a.id !== id)
      setAccounts(updatedAccounts)
      localStorage.setItem('abawi_accounts', JSON.stringify(updatedAccounts))
    }
  }

  const setPrimary = (id) => {
    const updatedAccounts = accounts.map(a => ({
      ...a,
      isPrimary: a.id === id
    }))
    setAccounts(updatedAccounts)
    localStorage.setItem('abawi_accounts', JSON.stringify(updatedAccounts))
  }

  const ABAWI_BANK_STYLES = `
    .abawi-bank-container {
      min-height: 100vh;
      background: var(--bg-primary);
      color: var(--text-primary);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
    
    .abawi-bank-header {
      background: linear-gradient(135deg, #1976D2 0%, #0D47A1 100%);
      padding: 32px;
      color: white;
      border-radius: 0 0 24px 24px;
    }
    
    .abawi-bank-logo {
      width: 64px;
      height: 64px;
      background: white;
      border-radius: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 32px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.2);
      margin-bottom: 16px;
    }
    
    .abawi-bank-title {
      font-size: 2.5rem;
      font-weight: 800;
      margin: 0 0 8px 0;
    }
    
    .abawi-bank-subtitle {
      font-size: 1.1rem;
      opacity: 0.9;
      margin: 0;
    }
    
    .abawi-bank-content {
      max-width: 1200px;
      margin: 0 auto;
      padding: 24px;
    }
    
    .abawi-bank-tabs {
      display: flex;
      gap: 8px;
      margin-bottom: 24px;
      border-bottom: 2px solid var(--border);
      padding-bottom: 16px;
    }
    
    .abawi-bank-tab {
      padding: 12px 20px;
      border: none;
      background: transparent;
      color: var(--text-secondary);
      font-size: 0.95rem;
      cursor: pointer;
      border-radius: 8px;
      transition: all 0.2s;
      font-weight: 500;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    .abawi-bank-tab:hover {
      background: var(--bg-secondary);
      color: var(--text-primary);
    }
    
    .abawi-bank-tab.active {
      background: rgba(25, 118, 210, 0.15);
      color: #1976D2;
    }
    
    .abawi-bank-subscribe-card {
      background: linear-gradient(135deg, #1976D2 0%, #0D47A1 100%);
      border-radius: 16px;
      padding: 32px;
      color: white;
      text-align: center;
      margin-bottom: 24px;
    }
    
    .abawi-bank-subscribe-title {
      font-size: 1.5rem;
      font-weight: 700;
      margin: 0 0 8px 0;
    }
    
    .abawi-bank-subscribe-text {
      font-size: 1rem;
      opacity: 0.9;
      margin: 0 0 20px 0;
    }
    
    .abawi-bank-btn {
      padding: 14px 28px;
      border: none;
      border-radius: 10px;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
    }
    
    .abawi-bank-btn-primary {
      background: white;
      color: #1976D2;
    }
    
    .abawi-bank-btn-primary:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    }
    
    .abawi-bank-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
      gap: 20px;
    }
    
    .abawi-bank-card {
      background: var(--bg-secondary);
      border-radius: 16px;
      padding: 20px;
      border: 1px solid var(--border);
      transition: all 0.2s;
    }
    
    .abawi-bank-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 24px rgba(0,0,0,0.1);
    }
    
    .abawi-bank-card-primary {
      border-color: #1976D2;
      background: linear-gradient(135deg, rgba(25, 118, 210, 0.05) 0%, var(--bg-secondary) 100%);
    }
    
    .abawi-bank-card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    }
    
    .abawi-bank-card-bank {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    
    .abawi-bank-card-logo {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      color: white;
      font-size: 1.2rem;
    }
    
    .abawi-bank-card-bank-name {
      font-weight: 600;
      font-size: 1.1rem;
      color: var(--text-primary);
    }
    
    .abawi-bank-card-badge {
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 0.75rem;
      font-weight: 600;
      background: #1976D2;
      color: white;
    }
    
    .abawi-bank-card-details {
      margin-top: 16px;
    }
    
    .abawi-bank-card-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px solid var(--border);
    }
    
    .abawi-bank-card-label {
      font-size: 0.85rem;
      color: var(--text-secondary);
    }
    
    .abawi-bank-card-value {
      font-size: 0.9rem;
      color: var(--text-primary);
      font-weight: 500;
      font-family: monospace;
    }
    
    .abawi-bank-card-actions {
      display: flex;
      gap: 8px;
      margin-top: 16px;
    }
    
    .abawi-bank-card-btn {
      flex: 1;
      padding: 10px;
      border: 1px solid var(--border);
      border-radius: 8px;
      background: var(--bg-tertiary);
      color: var(--text-primary);
      font-size: 0.85rem;
      cursor: pointer;
      transition: all 0.2s;
    }
    
    .abawi-bank-card-btn:hover {
      background: #1976D2;
      color: white;
      border-color: #1976D2;
    }
    
    .abawi-bank-card-btn.delete:hover {
      background: #D32F2F;
      border-color: #D32F2F;
    }
    
    .abawi-bank-form-group {
      margin-bottom: 20px;
    }
    
    .abawi-bank-form-label {
      display: block;
      font-size: 0.9rem;
      font-weight: 600;
      margin-bottom: 8px;
      color: var(--text-primary);
    }
    
    .abawi-bank-form-input,
    .abawi-bank-form-select {
      width: 100%;
      padding: 12px 16px;
      border: 1px solid var(--border);
      border-radius: 10px;
      background: var(--bg-secondary);
      color: var(--text-primary);
      font-size: 0.95rem;
      transition: all 0.2s;
    }
    
    .abawi-bank-form-input:focus,
    .abawi-bank-form-select:focus {
      outline: none;
      border-color: #1976D2;
    }
    
    .abawi-bank-modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0,0,0,0.7);
      backdrop-filter: blur(5px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      padding: 20px;
    }
    
    .abawi-bank-modal {
      background: var(--bg-primary);
      border-radius: 20px;
      width: 100%;
      max-width: 500px;
      max-height: 90vh;
      overflow-y: auto;
      border: 1px solid var(--border);
    }
    
    .abawi-bank-modal-header {
      padding: 24px;
      border-bottom: 1px solid var(--border);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    
    .abawi-bank-modal-title {
      font-size: 1.25rem;
      font-weight: 700;
      margin: 0;
      color: var(--text-primary);
    }
    
    .abawi-bank-modal-close {
      width: 36px;
      height: 36px;
      border: none;
      background: var(--bg-tertiary);
      border-radius: 10px;
      font-size: 1.25rem;
      cursor: pointer;
      color: var(--text-secondary);
      transition: all 0.2s;
    }
    
    .abawi-bank-modal-close:hover {
      background: #D32F2F;
      color: white;
    }
    
    .abawi-bank-modal-body {
      padding: 24px;
    }
    
    .abawi-bank-checkbox {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-top: 16px;
      font-size: 0.9rem;
      color: var(--text-secondary);
    }
    
    .abawi-bank-checkbox input {
      width: 18px;
      height: 18px;
      cursor: pointer;
    }
    
    .abawi-bank-info-box {
      background: var(--bg-secondary);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 16px;
      margin-bottom: 20px;
    }
    
    .abawi-bank-info-title {
      font-weight: 600;
      margin: 0 0 8px 0;
      color: var(--text-primary);
    }
    
    .abawi-bank-info-text {
      font-size: 0.9rem;
      color: var(--text-secondary);
      margin: 0;
      line-height: 1.5;
    }
    
    .abawi-bank-add-btn {
      width: 100%;
      padding: 16px;
      border: 2px dashed var(--border);
      border-radius: 12px;
      background: transparent;
      color: var(--text-secondary);
      font-size: 1rem;
      cursor: pointer;
      transition: all 0.2s;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }
    
    .abawi-bank-add-btn:hover {
      border-color: #1976D2;
      color: #1976D2;
      background: rgba(25, 118, 210, 0.05);
    }
    
    @media (max-width: 768px) {
      .abawi-bank-grid {
        grid-template-columns: 1fr;
      }
      
      .abawi-bank-title {
        font-size: 2rem;
      }
    }
  `

  if (!isSubscribed) {
    // Non-subscriber view - requires registration
    return (
      <div className="abawi-bank-container">
        <SEO
          title="ABAWI Bank — Comptes bancaires connectés"
          description="Gérez vos comptes bancaires et effectuez des transferts sécurisés avec ABAWI Bank."
          keywords="banque, compte bancaire, transfert, Sénégal, CBAO, Ecobank"
        />
        <style>{ABAWI_BANK_STYLES}</style>

        <div className="abawi-bank-header">
          <div className="abawi-bank-logo">🏦</div>
          <h1 className="abawi-bank-title">ABAWI Bank</h1>
          <p className="abawi-bank-subtitle">Vos comptes bancaires connectés — Transferts sécurisés</p>
        </div>

        <div className="abawi-bank-content">
          <div className="abawi-bank-subscribe-card">
            <h2 className="abawi-bank-subscribe-title">Accès Abonnés</h2>
            <p className="abawi-bank-subscribe-text">
              Pour connecter vos comptes bancaires et effectuer des transferts, 
              vous devez être abonné à ABAWI Plus.
            </p>
            <Link to="/plans">
              <button className="abawi-bank-btn abawi-bank-btn-primary">
                S'abonner à ABAWI Plus
              </button>
            </Link>
          </div>

          <div className="abawi-bank-info-box">
            <h3 className="abawi-bank-info-title">Avantages de l'abonnement</h3>
            <p className="abawi-bank-info-text">
              • Connectez jusqu'à 5 comptes bancaires<br/>
              • Effectuez des transferts instantanés 24/7<br/>
              • Historique complet de toutes vos transactions<br/>
              • Notifications en temps réel<br/>
              • Support client prioritaire
            </p>
          </div>

          <div className="abawi-bank-info-box">
            <h3 className="abawi-bank-info-title">Banques supportées</h3>
            <p className="abawi-bank-info-text">
              CBAO • Société Générale • Ecobank • Orabank • UBA • NSIA • BICIS • Coris Bank
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Subscriber view - full functionality
  return (
    <div className="abawi-bank-container">
      <SEO
        title="ABAWI Bank — Mes comptes bancaires"
        description="Gérez vos comptes bancaires et effectuez des transferts sécurisés."
        keywords="banque, compte bancaire, transfert, Sénégal"
      />
      <style>{ABAWI_BANK_STYLES}</style>

      <div className="abawi-bank-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div className="abawi-bank-logo">🏦</div>
            <h1 className="abawi-bank-title">ABAWI Bank</h1>
            <p className="abawi-bank-subtitle">Mes comptes bancaires connectés</p>
          </div>
          <Link to="/a-propos" style={{ color: 'white', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 500, padding: '8px 16px', border: '1px solid rgba(255,255,255,0.5)', borderRadius: '8px' }}>À propos</Link>
        </div>
      </div>

      <div className="abawi-bank-content">
        {/* Tabs */}
        <div className="abawi-bank-tabs">
          <button 
            className={`abawi-bank-tab ${activeTab === 'accounts' ? 'active' : ''}`}
            onClick={() => setActiveTab('accounts')}
          >
            💳 Mes Comptes ({accounts.length})
          </button>
          <button 
            className={`abawi-bank-tab ${activeTab === 'transfers' ? 'active' : ''}`}
            onClick={() => setActiveTab('transfers')}
          >
            💸 Transferts
          </button>
          <button 
            className={`abawi-bank-tab ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => setActiveTab('history')}
          >
            📜 Historique
          </button>
        </div>

        {activeTab === 'accounts' && (
          <>
            {accounts.length === 0 ? (
              <div className="abawi-bank-info-box">
                <h3 className="abawi-bank-info-title">Aucun compte connecté</h3>
                <p className="abawi-bank-info-text">
                  Cliquez sur le bouton ci-dessous pour ajouter votre premier compte bancaire.
                </p>
              </div>
            ) : (
              <div className="abawi-bank-grid">
                {accounts.map(account => {
                  const bank = BANKS.find(b => b.id === account.bank)
                  return (
                    <div key={account.id} className={`abawi-bank-card ${account.isPrimary ? 'abawi-bank-card-primary' : ''}`}>
                      <div className="abawi-bank-card-header">
                        <div className="abawi-bank-card-bank">
                          <div 
                            className="abawi-bank-card-logo" 
                            style={{ background: bank?.color || '#666' }}
                          >
                            {bank?.logo || '🏦'}
                          </div>
                          <div className="abawi-bank-card-bank-name">
                            {bank?.name || account.bank}
                          </div>
                        </div>
                        {account.isPrimary && (
                          <span className="abawi-bank-card-badge">Principal</span>
                        )}
                      </div>

                      <div className="abawi-bank-card-details">
                        <div className="abawi-bank-card-row">
                          <span className="abawi-bank-card-label">Titulaire</span>
                          <span className="abawi-bank-card-value">{account.accountName}</span>
                        </div>
                        <div className="abawi-bank-card-row">
                          <span className="abawi-bank-card-label">Numéro de compte</span>
                          <span className="abawi-bank-card-value">{account.accountNumber}</span>
                        </div>
                        {account.branch && (
                          <div className="abawi-bank-card-row">
                            <span className="abawi-bank-card-label">Agence</span>
                            <span className="abawi-bank-card-value">{account.branch}</span>
                          </div>
                        )}
                      </div>

                      <div className="abawi-bank-card-actions">
                        {!account.isPrimary && (
                          <button 
                            className="abawi-bank-card-btn"
                            onClick={() => setPrimary(account.id)}
                          >
                            Définir principal
                          </button>
                        )}
                        <button 
                          className="abawi-bank-card-btn delete"
                          onClick={() => deleteAccount(account.id)}
                        >
                          Supprimer
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            <button 
              className="abawi-bank-add-btn"
              onClick={() => setShowSubscribeModal(true)}
              style={{ marginTop: 20 }}
            >
              ➕ Ajouter un compte bancaire
            </button>
          </>
        )}

        {activeTab === 'transfers' && (
          <div className="abawi-bank-info-box">
            <h3 className="abawi-bank-info-title">Fonctionnalité à venir</h3>
            <p className="abawi-bank-info-text">
              Les transferts entre comptes seront disponibles prochainement. 
              Vous pourrez transférer de l'argent entre vos comptes connectés 
              et vers d'autres utilisateurs ABAWI Bank.
            </p>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="abawi-bank-info-box">
            <h3 className="abawi-bank-info-title">Aucune transaction</h3>
            <p className="abawi-bank-info-text">
              Votre historique de transactions apparaîtra ici une fois que 
              vous aurez effectué des transferts.
            </p>
          </div>
        )}
      </div>

      {/* Add Account Modal */}
      {showSubscribeModal && (
        <div className="abawi-bank-modal-overlay" onClick={() => setShowSubscribeModal(false)}>
          <div className="abawi-bank-modal" onClick={e => e.stopPropagation()}>
            <div className="abawi-bank-modal-header">
              <h2 className="abawi-bank-modal-title">Ajouter un compte bancaire</h2>
              <button className="abawi-bank-modal-close" onClick={() => setShowSubscribeModal(false)}>✕</button>
            </div>
            <div className="abawi-bank-modal-body">
              <div className="abawi-bank-form-group">
                <label className="abawi-bank-form-label">Banque *</label>
                <select 
                  className="abawi-bank-form-select"
                  value={newAccount.bank}
                  onChange={e => setNewAccount({...newAccount, bank: e.target.value})}
                >
                  <option value="">Sélectionnez une banque</option>
                  {BANKS.map(bank => (
                    <option key={bank.id} value={bank.id}>{bank.name}</option>
                  ))}
                </select>
              </div>

              <div className="abawi-bank-form-group">
                <label className="abawi-bank-form-label">Numéro de compte *</label>
                <input
                  type="text"
                  className="abawi-bank-form-input"
                  placeholder="SN012345678901234"
                  value={newAccount.accountNumber}
                  onChange={e => setNewAccount({...newAccount, accountNumber: e.target.value})}
                />
              </div>

              <div className="abawi-bank-form-group">
                <label className="abawi-bank-form-label">Nom du titulaire *</label>
                <input
                  type="text"
                  className="abawi-bank-form-input"
                  placeholder="Prénom NOM"
                  value={newAccount.accountName}
                  onChange={e => setNewAccount({...newAccount, accountName: e.target.value})}
                />
              </div>

              <div className="abawi-bank-form-group">
                <label className="abawi-bank-form-label">Agence (optionnel)</label>
                <input
                  type="text"
                  className="abawi-bank-form-input"
                  placeholder="Ex: Dakar Plateau"
                  value={newAccount.branch}
                  onChange={e => setNewAccount({...newAccount, branch: e.target.value})}
                />
              </div>

              <label className="abawi-bank-checkbox">
                <input
                  type="checkbox"
                  checked={newAccount.isPrimary}
                  onChange={e => setNewAccount({...newAccount, isPrimary: e.target.checked})}
                />
                Définir comme compte principal
              </label>

              <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
                <button 
                  className="abawi-bank-btn abawi-bank-btn-primary"
                  onClick={addAccount}
                  style={{ flex: 1 }}
                >
                  💾 Enregistrer
                </button>
                <button 
                  className="abawi-bank-card-btn"
                  onClick={() => setShowSubscribeModal(false)}
                >
                  Annuler
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

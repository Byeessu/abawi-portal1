import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import '../styles/ThemeUniversal.css'
import './Credits.css'
import { supabase } from '../lib/supabase'
import { getCredits, rechargeCredits, CREDIT_COSTS } from '../lib/credits'
import PaymentFlow from '../components/PaymentFlow'

export default function Credits() {
  const { membre, isAdmin } = useAuth()
  const [credits, setCredits] = useState(0)
  const [packs, setPacks] = useState([])
  const [history, setHistory] = useState([])
  const [selectedPack, setSelectedPack] = useState(null)
  const [showPayment, setShowPayment] = useState(false)
  const [loading, setLoading] = useState(true)

  // eslint-disable-next-line react-hooks/exhaustive-deps -- TODO: review hook dependencies
  useEffect(() => { loadAll() }, [membre])

  async function loadAll() {
    if (!membre) return
    const [creditsData, packsData, historyData] = await Promise.all([
      getCredits(membre.email),
      supabase.from('credit_packs').select('*').eq('actif', true).order('prix'),
      supabase.from('credit_transactions').select('*').eq('email', membre.email).order('created_at', { ascending: false }).limit(20),
    ])
    setCredits(creditsData)
    setPacks(packsData.data || [])
    setHistory(historyData.data || [])
    setLoading(false)
  }

  if (!membre) return (
    <div className="credits-login">
      <div className="credits-login__icon">💎</div>
      <h2 className="credits-login__title">Accédez à vos crédits</h2>
      <p className="credits-login__text">Connectez-vous pour gérer vos crédits ABAWI</p>
      <a href="/login" className="credits-login__btn">Se connecter</a>
    </div>
  )

  return (
    <div className="credits-container">
      <div className="credits-header">
        <div className="credits-header__badge">💎 CRÉDITS ABAWI</div>
        <h1 className="credits-header__title">Gérez vos crédits</h1>
        <p className="credits-header__subtitle">Utilisez vos crédits pour accéder à tous les contenus et outils ABAWI</p>
      </div>

      {/* Solde */}
      <div className="credits-balance">
        <div className="credits-balance__label">VOTRE SOLDE ACTUEL</div>
        <div className="credits-balance__amount">{isAdmin ? '∞' : credits}</div>
        <div className="credits-balance__unit">crédits disponibles</div>
        {!isAdmin && credits < 20 && (
          <div className={`credits-balance__alert ${credits === 0 ? 'credits-balance__alert--danger' : 'credits-balance__alert--warning'}`}>
            {credits === 0 ? 'Crédits épuisés' : 'Solde faible'}
          </div>
        )}
      </div>

      {/* Tarif contenus */}
      <div className="credits-pricing">
        <h2 className="credits-pricing__title">🔑 Coût en crédits</h2>
        <div className="credits-pricing__grid">
          {[
            { label: '📚 Guide PDF', cost: CREDIT_COSTS.guide },
            { label: '🎓 Fascicule', cost: CREDIT_COSTS.fascicule },
            { label: '🎧 Podcast', cost: CREDIT_COSTS.podcast },
            { label: '📄 CV Pro', cost: CREDIT_COSTS.cv },
            { label: '✉️ Lettre motivation', cost: CREDIT_COSTS.lettre },
            { label: '📊 Business Plan', cost: CREDIT_COSTS.business_plan },
            { label: '🔍 Analyse CV', cost: CREDIT_COSTS.analyse_cv },
            { label: '🏦 Finance Elite', cost: CREDIT_COSTS.finance_elite },
          ].map(item => (
            <div key={item.label} className="credits-pricing__item">
              <span className="credits-pricing__label">{item.label}</span>
              <span className="credits-pricing__cost">{item.cost} cr.</span>
            </div>
          ))}
        </div>
      </div>

      {/* Packs recharge */}
      <h2 className="credits-packs__title">💳 Recharger mes crédits</h2>
      <div className="credits-packs__grid">
        {packs.map(pack => (
          <div
            key={pack.id}
            onClick={() => { setSelectedPack(pack); setShowPayment(true) }}
            className={`credits-pack ${pack.popular ? 'credits-pack--popular' : 'credits-pack--regular'}`}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)' }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'none' }}
          >
            {pack.popular && <div className="credits-pack__badge">POPULAIRE</div>}
            <div className="credits-pack__credits">{pack.credits}</div>
            {pack.bonus_credits > 0 && <div className="credits-pack__bonus">+{pack.bonus_credits} bonus</div>}
            <div className="credits-pack__label">crédits</div>
            <div className="credits-pack__price">{pack.prix.toLocaleString('fr-FR')} F</div>
          </div>
        ))}
      </div>

      {/* Historique */}
      {history.length > 0 && (
        <div className="credits-history">
          <h2 className="credits-history__title">📋 Historique</h2>
          <div className="credits-history__list">
            {history.map(t => (
              <div key={t.id} className="credits-history__item">
                <div className="credits-history__info">
                  <div className="credits-history__type">{t.description}</div>
                  <div className="credits-history__date">{new Date(t.created_at).toLocaleDateString('fr-FR')}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div className={`credits-history__amount ${t.type === 'debit' ? 'credits-history__amount--negative' : 'credits-history__amount--positive'}`}>
                    {t.type === 'debit' ? '-' : '+'}{t.montant}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {showPayment && selectedPack && (
        <PaymentFlow
          product={{ id: selectedPack.id, titre: `Crédits ABAWI — ${selectedPack.nom}`, prix: selectedPack.prix, type: 'credits' }}
          onClose={() => { setShowPayment(false); setSelectedPack(null) }}
          onSuccess={async () => {
            setShowPayment(false)
            await rechargeCredits(membre.email, selectedPack.id)
            loadAll()
          }}
        />
      )}
    </div>
  )
}

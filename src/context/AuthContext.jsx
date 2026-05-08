import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { trackEvent, setUser } from '../lib/observability'

const AuthContext = createContext(null)

const ADMIN_EMAILS = ['ngomlaurentblog@gmail.com', 'contactabawi@gmail.com']

function isAdminEmail(email) {
  return ADMIN_EMAILS.includes((email || '').toLowerCase().trim())
}

function withNormalizedPlan(member) {
  if (!member) return member
  const plan = (member.plan_type || member.plan || '').toLowerCase().trim()
  return { ...member, plan_type: plan || 'gratuit' }
}

export function AuthProvider({ children }) {
  const [membre, setMembre] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Restaurer session
    const saved = localStorage.getItem('abawi_membre')
    if (saved) {
      try {
        const m = JSON.parse(saved)
        if (m?.id) {
          // eslint-disable-next-line react-hooks/set-state-in-effect -- Sync from external source (localStorage, props, async result) — refactor to derived state where feasible
          setMembre(withNormalizedPlan(m))
          setUser({ id: m.id, email: m.email })
        }
      // eslint-disable-next-line no-empty -- Empty catch is intentional — failure is non-fatal here
      } catch {}
    }
    setLoading(false)

    // Créer/mettre à jour compte admin
    supabase.from('membres').upsert({
      prenom: 'Laurent',
      nom: 'ABAWI',
      email: 'ngomlaurentblog@gmail.com',
      telephone: '221775185050',
      mot_de_passe: 'abawi2026',
      statut: 'actif',
      role: 'admin',
      date_fin: '2099-12-31T23:59:59Z',
    }, { onConflict: 'email' }).then(({ error }) => {
      // Admin account verified
    })
  }, [])

  function checkMemberActive(m) {
    if (!m) return false
    if (isAdminEmail(m.email)) return true
    if (m.role === 'admin') return true
    if (m.statut === 'actif') {
      if (!m.date_fin) return true
      return new Date(m.date_fin) > new Date()
    }
    return false
  }

  const isAdmin = !!membre && (
    isAdminEmail(membre.email) ||
    membre.role === 'admin'
  )
  const isMember = checkMemberActive(membre)

  async function login(emailOrPhone, password) {
    const clean = emailOrPhone.trim().toLowerCase()
    // Login attempt

    let { data: found, error } = await supabase
      .from('membres')
      .select('*')
      .or(`email.ilike.${clean},telephone.eq.${clean}`)

    // Query executed

    if (error) {
      return { success: false, error: 'Erreur de connexion : ' + error.message }
    }

    if (!found || found.length === 0) {
      const { data: found2 } = await supabase.from('membres').select('*').eq('email', clean).maybeSingle()
      if (!found2) {
        return { success: false, error: 'Aucun compte trouvé avec cet identifiant' }
      }
      found = [found2]
    }

    const m = found[0]
    // Member found, verifying password

    if (m.mot_de_passe !== password) {
      return { success: false, error: 'Mot de passe incorrect' }
    }

    const adminFlag = isAdminEmail(m.email) || m.role === 'admin'
    const isActive = adminFlag || (m.statut === 'actif' && new Date(m.date_fin) > new Date())
    const session = withNormalizedPlan({ ...m, isActive, isAdminUser: adminFlag })
    setMembre(session)
    localStorage.setItem('abawi_membre', JSON.stringify(session))
    setUser({ id: session.id, email: session.email })
    trackEvent('auth_login', { plan: session.plan_type, expired: !isActive })

    if (!isActive) {
      return { success: true, membre: session, expired: true }
    }
    return { success: true, membre: session }
  }

  async function register(prenom, nom, telephone, email, mot_de_passe) {
    const { data, error } = await supabase
      .from('membres')
      .insert({ prenom, nom, telephone, email: email.toLowerCase().trim(), mot_de_passe })
      .select()
      .single()

    if (error) return { success: false, error: error.message.includes('unique') ? 'Cet email existe déjà' : error.message }

    const session = withNormalizedPlan({ ...data, isActive: true })
    setMembre(session)
    localStorage.setItem('abawi_membre', JSON.stringify(session))
    setUser({ id: session.id, email: session.email })
    trackEvent('auth_signup', { plan: session.plan_type })
    return { success: true, membre: session }
  }

  function logout() {
    trackEvent('auth_logout')
    setMembre(null)
    localStorage.removeItem('abawi_membre')
    setUser(null)
  }

  async function refreshMembre() {
    if (!membre) return
    const { data } = await supabase.from('membres').select('*').eq('id', membre.id).single()
    if (data) {
      const adminFlag = isAdminEmail(data.email) || data.role === 'admin'
      const isActive = adminFlag || (data.statut === 'actif' && new Date(data.date_fin) > new Date())
      const session = withNormalizedPlan({ ...data, isActive, isAdminUser: adminFlag })
      setMembre(session)
      localStorage.setItem('abawi_membre', JSON.stringify(session))
    }
  }

  return (
    <AuthContext.Provider value={{ membre, loading, isAdmin, isMember, login, logout, register, refreshMembre }}>
      {children}
    </AuthContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components -- Mixed export pattern is intentional for this module
export function useAuth() { return useContext(AuthContext) }

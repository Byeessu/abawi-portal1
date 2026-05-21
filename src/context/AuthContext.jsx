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
      } catch { /* ignore */ }
    }
    setLoading(false)

    // S'assurer que le compte admin existe (select puis update/insert explicite)
    supabase.from('membres').select('id').eq('email', 'ngomlaurentblog@gmail.com').single().then(({ data: existing }) => {
      if (existing) {
        supabase.from('membres').update({ role: 'admin', statut: 'actif', date_fin: '2099-12-31T23:59:59Z' }).eq('id', existing.id).then(() => {})
      } else {
        supabase.from('membres').insert({
          prenom: 'Laurent', nom: 'ABAWI', email: 'ngomlaurentblog@gmail.com',
          telephone: '221775185050', mot_de_passe: 'abawi2026',
          statut: 'actif', role: 'admin', date_fin: '2099-12-31T23:59:59Z',
        }).then(() => {})
      }
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
    (membre.role === 'admin' && membre.isAdminUser === true)
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

    // Sécurité : si plusieurs lignes matchent, choisir celle qui correspond exactement
    let m = found[0]
    if (found.length > 1) {
      const exactMatch = found.find(r => (r.email || '').toLowerCase().trim() === clean || (r.telephone || '').trim() === clean)
      if (exactMatch) m = exactMatch
    }
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
      .insert({
        prenom, nom, telephone,
        email: email.toLowerCase().trim(),
        mot_de_passe,
        role: 'membre',
        statut: 'actif',
        plan_type: 'gratuit',
        plan: 'gratuit',
        date_fin: null,
      })
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

  async function requestPasswordReset(email) {
    const clean = email.trim().toLowerCase()
    const { data: found } = await supabase.from('membres').select('id,email').eq('email', clean).maybeSingle()
    if (!found) return { success: false, error: 'Aucun compte trouvé avec cet email' }

    const token = Math.floor(100000 + Math.random() * 900000).toString()
    const { error } = await supabase.from('password_resets').insert({
      email: clean,
      token,
      expires_at: new Date(Date.now() + 3600000).toISOString(),
    })
    if (error) return { success: false, error: 'Erreur lors de la création du code : ' + error.message }

    // Try sending email, but don't fail if it doesn't work
    try {
      await supabase.functions.invoke('send-email', {
        body: {
          to: clean,
          subject: 'Réinitialisation de mot de passe ABAWI',
          text: `Votre code de réinitialisation est : ${token}\nIl est valable pendant 1 heure.`,
        },
      })
    } catch { /* ignore email errors */ }

    return { success: true, token }
  }

  async function confirmPasswordReset(email, token, newPassword) {
    const clean = email.trim().toLowerCase()
    const { data: rows } = await supabase
      .from('password_resets')
      .select('*')
      .eq('email', clean)
      .eq('token', token)
      .is('used_at', null)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)

    if (!rows || rows.length === 0) {
      return { success: false, error: 'Code invalide ou expiré' }
    }

    const { error: updErr } = await supabase.from('membres').update({ mot_de_passe: newPassword }).eq('email', clean)
    if (updErr) return { success: false, error: 'Erreur mise à jour : ' + updErr.message }

    await supabase.from('password_resets').update({ used_at: new Date().toISOString() }).eq('id', rows[0].id)
    return { success: true }
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
    <AuthContext.Provider value={{ membre, loading, isAdmin, isMember, login, logout, register, refreshMembre, requestPasswordReset, confirmPasswordReset }}>
      {children}
    </AuthContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components -- Mixed export pattern is intentional for this module
export function useAuth() { return useContext(AuthContext) }

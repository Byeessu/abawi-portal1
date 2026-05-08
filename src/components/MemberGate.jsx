import { useAuth } from '../context/AuthContext'

export default function MemberGate({ children, fallback }) {
  const { isMember, isAdmin } = useAuth()
  if (isMember || isAdmin) return children
  return fallback || null
}

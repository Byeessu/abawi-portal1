import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

// Redirige vers la page /merci universelle avec type=abonnement
function MerciAbonnement() {
  const navigate = useNavigate()
  useEffect(() => {
    navigate('/merci?type=abonnement&titre=Abonnement%20ABAWI%2B', { replace: true })
  }, [navigate])
  return null
}

export default MerciAbonnement

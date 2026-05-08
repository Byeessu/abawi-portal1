import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function StoreTest() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function load() {
      try {
        setLoading(true)
        const { data, error } = await supabase.from('store_products').select('*').limit(10)
        if (error) {
          setError(error.message)
        } else {
          setProducts(data || [])
        }
      } catch (e) {
        setError(e.message)
      }
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return <div style={{ padding: 40, textAlign: 'center' }}>Chargement...</div>
  if (error) return <div style={{ padding: 40, textAlign: 'center', color: 'red' }}>Erreur: {error}</div>

  return (
    <div style={{ padding: 40 }}>
      <h1>Store Test - {products.length} produits</h1>
      {products.map(p => (
        <div key={p.id} style={{ border: '1px solid #ccc', padding: 10, margin: 10 }}>
          <strong>{p.name || p.nom}</strong> - {p.categorie} - {p.prix} FCFA
        </div>
      ))}
    </div>
  )
}

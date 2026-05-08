import { createContext, useContext, useState, useCallback } from 'react'

const Ctx = createContext(null)

export function FavProvider({ children }) {
  const [favs, setFavs] = useState(() => {
    try { return JSON.parse(localStorage.getItem('abawi_favs') || '[]') } catch { return [] }
  })

  const toggle = useCallback((id) => {
    setFavs((f) => {
      const next = f.includes(id) ? f.filter((x) => x !== id) : [...f, id]
      localStorage.setItem('abawi_favs', JSON.stringify(next))
      return next
    })
  }, [])

  const isFav = useCallback((id) => favs.includes(id), [favs])

  return <Ctx.Provider value={{ favs, toggle, isFav }}>{children}</Ctx.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components -- Mixed export pattern is intentional for this module
export function useFav() { return useContext(Ctx) }

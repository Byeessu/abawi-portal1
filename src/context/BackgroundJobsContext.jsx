import { createContext, useContext, useState, useCallback, useRef } from 'react'

const Ctx = createContext(null)

export function BackgroundJobsProvider({ children }) {
  const [jobs, setJobs] = useState({})   // { [jobId]: JobEntry }
  const jobsRef = useRef({})             // same data, accessible without re-render

  function set(id, patch) {
    const next = { ...jobsRef.current[id], ...patch }
    jobsRef.current = { ...jobsRef.current, [id]: next }
    setJobs({ ...jobsRef.current })
  }

  const register = useCallback((id, { toolLabel, toolPath, toolId }) => {
    set(id, { id, toolLabel, toolPath, toolId, status: 'running', result: null, error: null, startedAt: Date.now() })
  }, [])

  const resolve = useCallback((id, result) => {
    set(id, { status: 'done', result, doneAt: Date.now() })
  }, [])

  const reject = useCallback((id, error) => {
    set(id, { status: 'error', error: String(error) })
  }, [])

  const consume = useCallback((id) => {
    const job = jobsRef.current[id]
    if (!job) return null
    const result = job.result
    const next = { ...jobsRef.current }
    delete next[id]
    jobsRef.current = next
    setJobs({ ...next })
    return result
  }, [])

  const dismissAll = useCallback(() => {
    const running = {}
    Object.values(jobsRef.current).forEach(j => { if (j.status === 'running') running[j.id] = j })
    jobsRef.current = running
    setJobs({ ...running })
  }, [])

  const runningCount = Object.values(jobs).filter(j => j.status === 'running').length
  const doneCount = Object.values(jobs).filter(j => j.status === 'done').length

  return (
    <Ctx.Provider value={{ jobs, register, resolve, reject, consume, dismissAll, runningCount, doneCount }}>
      {children}
    </Ctx.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components -- Mixed export pattern is intentional for this module
export function useBackgroundJobs() {
  return useContext(Ctx)
}

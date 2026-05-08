import { useState } from 'react'
import { useBackgroundJobs } from '../context/BackgroundJobsContext'
import { Link } from 'react-router-dom'

export default function BackgroundJobsIndicator() {
  const { jobs, dismissAll, runningCount, doneCount } = useBackgroundJobs()
  const [open, setOpen] = useState(false)

  const jobList = Object.values(jobs)
  if (!jobList.length) return null

  const total = runningCount + doneCount

  return (
    <div style={{ position: 'fixed', bottom: 88, right: 20, zIndex: 8500 }}>
      {/* Badge button */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '10px 16px', borderRadius: 999,
          background: runningCount > 0 ? 'linear-gradient(135deg,#1A2332,#0D1117)' : 'linear-gradient(135deg,#18A84A22,#0D1117)',
          border: `1px solid ${runningCount > 0 ? '#F0B429' : '#18A84A'}`,
          color: runningCount > 0 ? '#F0B429' : '#18A84A',
          fontWeight: 800, fontSize: '0.78rem', cursor: 'pointer',
          boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
          fontFamily: 'Outfit, sans-serif',
        }}
      >
        {runningCount > 0 ? (
          <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', background: '#F0B429', animation: 'pulse 1.2s infinite' }} />
        ) : (
          <span>✅</span>
        )}
        {runningCount > 0 ? `${runningCount} tâche${runningCount > 1 ? 's' : ''} en cours` : `${doneCount} terminée${doneCount > 1 ? 's' : ''}`}
        <style>{`@keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.5;transform:scale(1.3)} }`}</style>
      </button>

      {/* Panel */}
      {open && (
        <div style={{
          position: 'absolute', bottom: '110%', right: 0,
          width: 300, background: '#0D1117', border: '1px solid #1A2332',
          borderRadius: 14, boxShadow: '0 12px 40px rgba(0,0,0,0.6)',
          overflow: 'hidden',
        }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid #1A2332', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 800, color: '#F0F2F5', fontSize: '0.82rem' }}>Tâches de fond</span>
            {doneCount > 0 && (
              <button onClick={dismissAll} style={{ fontSize: '0.72rem', color: '#8B95A5', background: 'none', border: 'none', cursor: 'pointer' }}>Effacer terminées</button>
            )}
          </div>
          {jobList.map(job => (
            <div key={job.id} style={{ padding: '10px 16px', borderBottom: '1px solid #0a0e14', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#F0F2F5', marginBottom: 2 }}>{job.toolLabel}</div>
                <div style={{ fontSize: '0.7rem', color: '#8B95A5' }}>
                  {job.status === 'running' && '⏳ Génération en cours...'}
                  {job.status === 'done' && '✅ Terminé — cliquez pour charger'}
                  {job.status === 'error' && `❌ Erreur: ${job.error?.slice(0, 40)}`}
                </div>
              </div>
              {job.status === 'done' && job.toolPath && (
                <Link to={job.toolPath} onClick={() => setOpen(false)} style={{ padding: '5px 10px', borderRadius: 7, background: 'rgba(240,180,41,0.1)', border: '1px solid rgba(240,180,41,0.25)', color: '#F0B429', fontSize: '0.7rem', fontWeight: 700, textDecoration: 'none' }}>
                  Voir →
                </Link>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

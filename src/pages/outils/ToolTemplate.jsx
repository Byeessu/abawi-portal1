import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { canAccess } from '../../lib/permissions';

const ToolTemplate = ({ toolName, children, requiredPlan }) => {
  const { membre } = useAuth();
  const [accessGranted, setAccessGranted] = useState(false);

  useEffect(() => {
    if (membre && requiredPlan) {
      Promise.resolve().then(() => setAccessGranted(canAccess(membre, requiredPlan)));
    } else {
      Promise.resolve().then(() => setAccessGranted(true));
    }
  }, [membre, requiredPlan]);

  if (!accessGranted) {
    return (
      <div className="locked-tool-overlay" style={{ textAlign: 'center', padding: 50, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16 }}>
        <h2 style={{ color: 'var(--gold)' }}>{toolName}</h2>
        <p style={{ color: 'var(--text-secondary)' }}>Accès réservé aux membres Élite.</p>
        <button onClick={() => alert('Débloquer')} className="btn-gold" style={{ marginTop: 20 }}>Débloquer</button>
      </div>
    );
  }

  return (
    <div className="tool-template">
      {children}
    </div>
  );
};

export default ToolTemplate;

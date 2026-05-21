import { useState } from 'react';
import { auth } from '../firebaseConfig';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate('/admin/dashboard');
    } catch (err) {
      setError("Accès refusé. Identifiants invalides.");
    }
  };

  return (
    <div className="login-page" style={{
      height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg-primary)', color: 'var(--text-primary)', fontFamily: 'sans-serif'
    }}>
      <form onSubmit={handleLogin} style={{
        background: 'var(--bg-card)', padding: '50px', borderRadius: '30px',
        border: '1px solid var(--border)', width: '100%', maxWidth: '400px', textAlign: 'center'
      }}>
        <h1 style={{ color: 'var(--gold)', marginBottom: '10px' }}>ABAWI 360</h1>
        <p style={{ opacity: 0.6, marginBottom: '30px' }}>Administration Privée</p>

        {error && <p style={{ color: 'var(--red)', marginBottom: '20px', fontSize: '0.9rem' }}>{error}</p>}

        <input
          type="email" placeholder="Email Admin" required
          onChange={(e) => setEmail(e.target.value)}
          style={{ width: '100%', padding: '15px', marginBottom: '15px', background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: '10px', color: 'var(--text-primary)' }}
        />
        <input
          type="password" placeholder="Mot de passe" required
          onChange={(e) => setPassword(e.target.value)}
          style={{ width: '100%', padding: '15px', marginBottom: '30px', background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: '10px', color: 'var(--text-primary)' }}
        />

        <button type="submit" style={{
          width: '100%', padding: '15px', background: 'var(--gold)', color: '#000',
          border: 'none', borderRadius: '50px', fontWeight: '900', cursor: 'pointer'
        }}>
          S'AUTHENTIFIER
        </button>
      </form>
    </div>
  );
}
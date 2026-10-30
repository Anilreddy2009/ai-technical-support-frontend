import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext.jsx';
import { Banner } from '../components/ui.jsx';

const DEMO = [
  ['Northstar administrator', 'admin@northstar.test'],
  ['Northstar support agent', 'agent@northstar.test'],
  ['Bluewave administrator', 'admin@bluewave.test'],
  ['Bluewave support agent', 'agent@bluewave.test'],
];

export default function LoginPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to="/" replace />;

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await login(email, password);
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="login">
      <h1>Support desk</h1>
      <p className="lede">Investigate customer issues against the PostgreSQL manual, check the evidence, and send a reply you stand behind.</p>

      <form onSubmit={submit} className="form">
        <label>
          Email
          <input type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus />
        </label>
        <label>
          Password
          <input type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </label>
        {error && <Banner kind="error" title="Sign-in failed">{error}</Banner>}
        <button className="btn btn-primary" disabled={busy}>
          {busy ? 'Signing in' : 'Sign in'}
        </button>
      </form>

      <section className="demo">
        <h2>Demo accounts</h2>
        <p className="meta">All use the password Passw0rd! Pick one to fill the form.</p>
        <ul>
          {DEMO.map(([label, mail]) => (
            <li key={mail}>
              <button
                type="button"
                className="link"
                onClick={() => {
                  setEmail(mail);
                  setPassword('Passw0rd!');
                }}
              >
                {label}
              </button>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}

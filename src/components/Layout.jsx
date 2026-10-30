import { Link, NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext.jsx';
import { useDocuments } from '../api/queries.js';
import { PassageProvider } from './PassageDrawer.jsx';

function DocsChip() {
  const { data } = useDocuments();
  if (!data) return null;
  const ready = data.find((d) => d.status === 'READY');
  const active = data.find((d) => ['QUEUED', 'DOWNLOADING', 'PROCESSING'].includes(d.status));
  const broken = data.find((d) => ['FAILED', 'INTERRUPTED'].includes(d.status));
  let tone = 'bad';
  let text = 'No documentation yet';
  if (ready) {
    tone = 'ok';
    text = `Manual ready${ready.docVersion ? `, PostgreSQL ${ready.docVersion}` : ''}`;
  } else if (active) {
    tone = 'busy';
    text = `Documentation: ${active.stage ?? 'processing'}`;
  } else if (broken) {
    tone = 'warn';
    text = 'Documentation needs a retry';
  }
  return (
    <Link to="/documentation" className={`docs-chip status-${tone}`} title="Documentation status">
      <span className="status-dot" aria-hidden="true" />
      {text}
    </Link>
  );
}

export default function Layout() {
  const { user, logout } = useAuth();
  return (
    <PassageProvider>
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <header className="topbar">
        <Link to="/" className="brand">
          Support desk
        </Link>
        <nav aria-label="Main">
          <NavLink to="/" end>
            Tickets
          </NavLink>
          <NavLink to="/documentation">Documentation</NavLink>
        </nav>
        <div className="topbar-right">
          <DocsChip />
          <span className="who">
            {user.name}, {user.role === 'ADMIN' ? 'administrator' : 'support agent'}
          </span>
          <button className="btn btn-quiet" onClick={logout}>
            Sign out
          </button>
        </div>
      </header>
      <main id="main" className="page">
        <Outlet />
      </main>
    </PassageProvider>
  );
}

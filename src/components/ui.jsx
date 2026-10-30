import { Link } from 'react-router-dom';

export function Spinner({ label = 'Loading' }) {
  return (
    <span className="spinner" role="status" aria-label={label}>
      <span className="spinner-dot" />
    </span>
  );
}

export function Loading({ label = 'Loading' }) {
  return (
    <div className="state">
      <Spinner label={label} /> <span>{label}</span>
    </div>
  );
}

export function EmptyState({ title, children }) {
  return (
    <div className="state empty">
      <strong>{title}</strong>
      {children && <p>{children}</p>}
    </div>
  );
}

/** Inline notice. kind: info | warn | error | ok */
export function Banner({ kind = 'info', title, children, action }) {
  return (
    <div className={`banner banner-${kind}`} role={kind === 'error' ? 'alert' : 'status'}>
      <div className="banner-body">
        {title && <strong>{title}</strong>}
        {children && <div>{children}</div>}
      </div>
      {action}
    </div>
  );
}

export function ErrorNote({ error, retry }) {
  if (!error) return null;
  return (
    <Banner
      kind="error"
      title="Something went wrong"
      action={retry && <button className="btn btn-quiet" onClick={retry}>Try again</button>}
    >
      {error.message}
    </Banner>
  );
}

const STATUS_TEXT = {
  OPEN: 'Open',
  CLOSED: 'Closed',
  QUEUED: 'Queued',
  DOWNLOADING: 'Downloading',
  PROCESSING: 'Processing',
  READY: 'Ready',
  FAILED: 'Failed',
  INTERRUPTED: 'Interrupted',
  RUNNING: 'Investigating',
  COMPLETED: 'Finished',
  OUTDATED: 'Outdated',
  SENT: 'Sent',
};
const STATUS_TONE = {
  OPEN: 'live',
  CLOSED: 'done',
  QUEUED: 'busy',
  DOWNLOADING: 'busy',
  PROCESSING: 'busy',
  RUNNING: 'busy',
  READY: 'ok',
  COMPLETED: 'ok',
  SENT: 'ok',
  FAILED: 'bad',
  INTERRUPTED: 'warn',
  OUTDATED: 'warn',
};

/** Coloured dot plus text, so state is never conveyed by colour alone. */
export function Status({ value }) {
  return (
    <span className={`status status-${STATUS_TONE[value] ?? 'done'}`}>
      <span className="status-dot" aria-hidden="true" />
      {STATUS_TEXT[value] ?? value}
    </span>
  );
}

export function DocsNotReadyBanner() {
  return (
    <Banner kind="warn" title="Documentation isn't ready">
      Investigations use the ingested manual as evidence, so they are unavailable until an administrator has ingested it.
      Ticket viewing and manual replies still work. <Link to="/documentation">Check documentation status</Link>
    </Banner>
  );
}

import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client.js';
import { useDocuments, useTickets } from '../api/queries.js';
import { Banner, DocsNotReadyBanner, EmptyState, ErrorNote, Loading, Status } from '../components/ui.jsx';
import { formatDateTime } from '../lib/format.js';

const FILTERS = [
  ['', 'All'],
  ['OPEN', 'Open'],
  ['CLOSED', 'Closed'],
];

export default function TicketsPage() {
  const [status, setStatus] = useState('');
  const [creating, setCreating] = useState(false);
  const tickets = useTickets(status);
  const docs = useDocuments();
  const docsReady = (docs.data ?? []).some((d) => d.status === 'READY');

  return (
    <>
      <div className="page-head">
        <h1>Tickets</h1>
        <button className="btn btn-primary" onClick={() => setCreating(true)}>
          New ticket
        </button>
      </div>

      {docs.data && !docsReady && <DocsNotReadyBanner />}

      <div className="tabs" role="tablist" aria-label="Filter by status">
        {FILTERS.map(([value, label]) => (
          <button key={label} role="tab" aria-selected={status === value} className={status === value ? 'is-on' : ''} onClick={() => setStatus(value)}>
            {label}
          </button>
        ))}
      </div>

      {tickets.isLoading && <Loading label="Loading tickets" />}
      <ErrorNote error={tickets.error} retry={() => tickets.refetch()} />
      {tickets.data?.length === 0 && (
        <EmptyState title={status ? `No ${status.toLowerCase()} tickets` : 'No tickets yet'}>
          {status ? 'Try another filter.' : 'Create a ticket from a customer message to start an investigation.'}
        </EmptyState>
      )}

      {tickets.data?.length > 0 && (
        <table className="table">
          <thead>
            <tr>
              <th scope="col">Subject</th>
              <th scope="col">Status</th>
              <th scope="col">Created</th>
            </tr>
          </thead>
          <tbody>
            {tickets.data.map((t) => (
              <tr key={t.id} className={t.status === 'CLOSED' ? 'is-closed' : ''}>
                <td>
                  <Link to={`/tickets/${t.id}`}>{t.subject}</Link>
                </td>
                <td>
                  <Status value={t.status} />
                </td>
                <td className="meta">{formatDateTime(t.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {creating && <NewTicketDialog onClose={() => setCreating(false)} />}
    </>
  );
}

function NewTicketDialog({ onClose }) {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [form, setForm] = useState({ subject: '', customerMessage: '', environmentDetails: '' });
  const firstRef = useRef(null);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  useEffect(() => {
    firstRef.current?.focus();
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const create = useMutation({
    mutationFn: () =>
      api.post('/tickets', {
        subject: form.subject,
        customerMessage: form.customerMessage,
        ...(form.environmentDetails.trim() ? { environmentDetails: form.environmentDetails } : {}),
      }),
    onSuccess: (ticket) => {
      qc.invalidateQueries({ queryKey: ['tickets'] });
      navigate(`/tickets/${ticket.id}`);
    },
  });

  return (
    <>
      <div className="scrim" onClick={onClose} />
      <div className="modal" role="dialog" aria-modal="true" aria-label="New ticket">
        <h2>New ticket</h2>
        <p className="meta">Enter what the customer wrote. Use synthetic data only.</p>
        <form
          className="form"
          onSubmit={(e) => {
            e.preventDefault();
            create.mutate();
          }}
        >
          <label>
            Subject
            <input ref={firstRef} value={form.subject} onChange={set('subject')} maxLength={300} required />
          </label>
          <label>
            Customer message
            <textarea rows={4} value={form.customerMessage} onChange={set('customerMessage')} required />
          </label>
          <label>
            Environment details <span className="meta">(optional, free text)</span>
            <textarea
              rows={6}
              className="mono"
              value={form.environmentDetails}
              onChange={set('environmentDetails')}
              placeholder={'PostgreSQL: 16\nClient IP: 10.20.0.15\npg_hba.conf, in order:\nhost all all 10.20.0.0/24 reject'}
            />
          </label>
          {create.error && <Banner kind="error" title="The ticket was not created">{create.error.message}</Banner>}
          <div className="actions">
            <button type="button" className="btn btn-quiet" onClick={onClose}>
              Cancel
            </button>
            <button className="btn btn-primary" disabled={create.isPending}>
              {create.isPending ? 'Creating' : 'Create ticket'}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}

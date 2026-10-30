import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client.js';
import { useDocuments, useInvestigations, useTicket } from '../api/queries.js';
import { Banner, DocsNotReadyBanner, ErrorNote, Loading, Status } from '../components/ui.jsx';
import Composer from '../features/ticket/Composer.jsx';
import Conversation from '../features/ticket/Conversation.jsx';
import EnvironmentPanel from '../features/ticket/EnvironmentPanel.jsx';
import InvestigationPanel from '../features/ticket/InvestigationPanel.jsx';
import { formatDateTime } from '../lib/format.js';

export default function TicketDetailPage() {
  const { id } = useParams();
  const qc = useQueryClient();
  const ticket = useTicket(id);
  const investigations = useInvestigations(id);
  const docs = useDocuments();
  const [notice, setNotice] = useState(null);

  const start = useMutation({
    mutationFn: () => api.post(`/tickets/${id}/investigations`),
    onMutate: () => setNotice(null),
    onSuccess: (res) => {
      if (res.outcome === 'ALREADY_ACTIVE') setNotice(res.message); // e.g. "Investigation already running."
      qc.invalidateQueries({ queryKey: ['investigations', id] });
    },
  });

  const close = useMutation({
    mutationFn: () => api.post(`/tickets/${id}/close`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ticket', id] });
      qc.invalidateQueries({ queryKey: ['tickets'] });
    },
  });

  if (ticket.isLoading) return <Loading label="Loading ticket" />;
  if (ticket.error) {
    return (
      <>
        <ErrorNote error={ticket.error.status === 404 ? { message: 'This ticket does not exist, or you do not have access to it.' } : ticket.error} retry={() => ticket.refetch()} />
        <p>
          <Link to="/">Back to tickets</Link>
        </p>
      </>
    );
  }

  const t = ticket.data;
  const closed = t.status === 'CLOSED';
  const docsReady = (docs.data ?? []).some((d) => d.status === 'READY');
  const hasActive = (investigations.data ?? []).some((i) => ['QUEUED', 'RUNNING'].includes(i.status));

  return (
    <>
      <p className="crumb">
        <Link to="/">Tickets</Link>
      </p>
      <div className="page-head">
        <div>
          <h1>{t.subject}</h1>
          <p className="meta">
            <Status value={t.status} /> Created {formatDateTime(t.createdAt)}
            {closed && t.closedAt ? `, closed ${formatDateTime(t.closedAt)}` : ''}
          </p>
        </div>
        <div className="actions">
          {!closed && (
            <button
              className="btn btn-quiet"
              disabled={close.isPending}
              onClick={() => window.confirm('Close this ticket? It stays readable, but you will not be able to reply or investigate.') && close.mutate()}
            >
              Close ticket
            </button>
          )}
          <button className="btn btn-primary" disabled={closed || start.isPending || hasActive || !docsReady} onClick={() => start.mutate()} title={!docsReady ? 'Documentation is not ready' : undefined}>
            {hasActive ? 'Investigating' : start.isPending ? 'Starting' : 'Investigate'}
          </button>
        </div>
      </div>

      {docs.data && !docsReady && !closed && <DocsNotReadyBanner />}
      {notice && <Banner kind="info" title={notice} />}
      {start.error && (
        <Banner kind={start.error.code === 'DOCS_NOT_READY' ? 'warn' : 'error'} title="The investigation did not start">
          {start.error.message}
        </Banner>
      )}
      {close.error && <Banner kind="error" title="The ticket was not closed">{close.error.message}</Banner>}

      <div className="workspace">
        <div className="col-conversation">
          <section className="section" aria-labelledby="conv-h">
            <h2 id="conv-h">Conversation</h2>
            <Conversation messages={t.messages} investigations={investigations.data} />
          </section>
          <Composer ticket={t} />
        </div>

        <div className="col-investigation">
          <EnvironmentPanel key={t.evidenceVersion} ticket={t} />
          <section className="section" aria-labelledby="inv-h">
            <h2 id="inv-h">Investigation</h2>
            {investigations.isLoading && <Loading label="Loading investigations" />}
            <ErrorNote error={investigations.error} retry={() => investigations.refetch()} />
            {investigations.data && <InvestigationPanel ticket={t} investigations={investigations.data} onStart={() => start.mutate()} starting={start.isPending} />}
          </section>
        </div>
      </div>
    </>
  );
}

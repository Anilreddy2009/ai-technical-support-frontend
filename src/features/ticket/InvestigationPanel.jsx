import { Banner, Spinner, Status } from '../../components/ui.jsx';
import { formatDateTime, toolLabel } from '../../lib/format.js';
import DraftView, { DraftStatusTag } from './DraftView.jsx';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../api/client.js';

function Steps({ steps }) {
  if (!steps?.length) return null;
  return (
    <div className="evidence-block">
      <h4>Information requests</h4>
      <ol className="steps">
        {steps.map((s) => (
          <li key={s.index} className={s.isError ? 'is-error' : ''}>
            <span className="step-name">{toolLabel(s.tool)}</span>
            {s.arguments?.query && <code className="step-arg">{s.arguments.query}</code>}
            <span className="step-result">{s.resultSummary}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

function Investigation({ inv, ticket, onStart, starting }) {
  const qc = useQueryClient();
  const resume = useMutation({
    mutationFn: () => api.post(`/investigations/${inv.id}/resume`),
    onSettled: () => qc.invalidateQueries({ queryKey: ['investigations', ticket.id] }),
  });
  const active = inv.status === 'QUEUED' || inv.status === 'RUNNING';

  return (
    <div>
      {active && (
        <p className="running">
          <Spinner label="Investigation running" /> Investigating this ticket. The steps below appear as the AI asks for information.
        </p>
      )}

      {inv.status === 'FAILED' && (
        <Banner
          kind="error"
          title="The investigation failed"
          action={
            ticket.status === 'OPEN' && (
              <button className="btn btn-primary" onClick={onStart} disabled={starting}>
                Start a new investigation
              </button>
            )
          }
        >
          {inv.errorMessage} Ticket viewing and manual replies still work.
        </Banner>
      )}

      {inv.status === 'INTERRUPTED' && (
        <Banner
          kind="warn"
          title="The investigation was interrupted"
          action={
            <button className="btn btn-primary" onClick={() => resume.mutate()} disabled={resume.isPending}>
              Resume
            </button>
          }
        >
          {inv.errorMessage}
          {resume.error && ` ${resume.error.message}`}
        </Banner>
      )}

      <Steps steps={inv.steps} />
      {inv.draft && <DraftView investigation={inv} ticket={ticket} onRerun={onStart} rerunning={starting} />}
    </div>
  );
}

export default function InvestigationPanel({ ticket, investigations, onStart, starting }) {
  if (!investigations?.length) {
    return <p className="meta">No investigation has been run on this ticket yet. Select Investigate to have the AI read the ticket and the manual.</p>;
  }
  const [latest, ...older] = investigations;
  return (
    <>
      <div className="inv-head">
        <h3>Latest investigation</h3>
        <Status value={latest.status} />
        <span className="meta">{formatDateTime(latest.createdAt)}</span>
        {latest.draft && <DraftStatusTag draft={latest.draft} />}
      </div>
      <Investigation inv={latest} ticket={ticket} onStart={onStart} starting={starting} />

      {older.length > 0 && (
        <section className="history">
          <h3>Earlier investigations</h3>
          {older.map((inv) => (
            <details key={inv.id}>
              <summary>
                {formatDateTime(inv.createdAt)}, <Status value={inv.status} />
                {inv.draft ? <> <DraftStatusTag draft={inv.draft} /></> : null}
              </summary>
              <Investigation inv={inv} ticket={ticket} onStart={onStart} starting={starting} />
            </details>
          ))}
        </section>
      )}
    </>
  );
}

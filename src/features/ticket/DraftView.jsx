import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../api/client.js';
import { usePassage } from '../../api/queries.js';
import { Banner, Status } from '../../components/ui.jsx';
import { usePassageDrawer } from '../../components/PassageDrawer.jsx';
import { formatDateTime, pageRange } from '../../lib/format.js';

function CitationRow({ citation }) {
  const { open } = usePassageDrawer();
  const { data: p, error } = usePassage(citation.chunkId);
  return (
    <li className="citation">
      <button className="link" onClick={() => open(citation.chunkId, citation.quote)}>
        {p ? `Section ${p.sectionNumber ?? 'unnumbered'}${p.sectionTitle ? `, ${p.sectionTitle}` : ''}` : error ? 'Passage unavailable' : 'Open passage'}
      </button>
      {p && (
        <span className="meta">
          {p.documentTitle ?? 'Manual'}
          {p.docVersion ? `, version ${p.docVersion}` : ''}, page {pageRange(p)}
        </span>
      )}
      {citation.quote && <blockquote className="quote">{citation.quote}</blockquote>}
    </li>
  );
}

function List({ title, items, mono }) {
  if (!items?.length) return null;
  return (
    <div className="evidence-block">
      <h4>{title}</h4>
      <ul className={mono ? 'plain mono' : 'plain'}>
        {items.map((t, i) => (
          <li key={i}>{t}</li>
        ))}
      </ul>
    </div>
  );
}

export default function DraftView({ investigation, ticket, onRerun, rerunning }) {
  const d = investigation.draft;
  const qc = useQueryClient();
  const [text, setText] = useState(d.suggestedReply);

  const sent = d.status === 'SENT';
  const outdated = d.isOutdated && !sent;
  const closed = ticket.status === 'CLOSED';
  const canApprove = !sent && !outdated && !closed;
  const sentMessage = ticket.messages.find((m) => m.draftId === d.id);
  const edited = text.trim() !== d.suggestedReply.trim();

  const approve = useMutation({
    mutationFn: () => api.post(`/drafts/${d.id}/approve`, { finalText: text }),
    // Whatever happened (sent, already sent, outdated), re-read the truth from the server.
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['ticket', ticket.id] });
      qc.invalidateQueries({ queryKey: ['investigations', ticket.id] });
    },
  });

  return (
    <div className={outdated ? 'draft is-outdated' : 'draft'}>
      {outdated && (
        <Banner
          kind="warn"
          title="This draft is outdated"
          action={
            !closed && (
              <button className="btn btn-primary" onClick={onRerun} disabled={rerunning}>
                Run new investigation
              </button>
            )
          }
        >
          {d.outdatedReason ?? 'The ticket changed after this draft was written. Run a new investigation before approval.'} The old draft stays here for history.
        </Banner>
      )}

      <h3>Issue summary</h3>
      <p className="serif">{d.issueSummary}</p>

      <h3>Suggested customer reply</h3>
      {canApprove ? (
        <>
          <label className="sr-only" htmlFor={`reply-${d.id}`}>
            Reply to send
          </label>
          <textarea id={`reply-${d.id}`} className="serif reply-edit" rows={9} value={text} onChange={(e) => setText(e.target.value)} />
          {edited && <p className="meta">Edited. The original AI draft is kept with the ticket.</p>}
        </>
      ) : (
        <blockquote className={outdated ? 'reply-static muted' : 'reply-static'}>{sent ? d.finalText : d.suggestedReply}</blockquote>
      )}

      {d.nextStep && (
        <>
          <h3>Suggested next step</h3>
          <p>{d.nextStep}</p>
        </>
      )}

      <h3>Evidence</h3>
      <div className="evidence">
        <div>
          <List title="From the ticket" items={d.ticketFacts} mono />
          {!d.ticketFacts?.length && <p className="meta">No ticket facts were recorded for this draft.</p>}
        </div>
        <div>
          <div className="evidence-block">
            <h4>From the documentation</h4>
            {d.citations?.length ? (
              <ul className="plain">
                {d.citations.map((c) => (
                  <CitationRow key={c.chunkId} citation={c} />
                ))}
              </ul>
            ) : (
              <p className="meta">No documentation is cited. This is expected when the manual does not cover the question.</p>
            )}
          </div>
        </div>
      </div>
      <List title="Information still needed" items={d.missingInformation} />
      <List title="Conflicting information" items={d.conflicts} />
      {d.limitation && (
        <div className="evidence-block">
          <h4>Limitation</h4>
          <p>{d.limitation}</p>
        </div>
      )}

      {sent ? (
        <Banner kind="ok" title="Reply sent">
          Approved by {sentMessage?.author?.name ?? 'staff'} on {formatDateTime(d.approvedAt)}. Sending is simulated: no email was delivered.
        </Banner>
      ) : (
        <>
          {approve.error && (
            <Banner kind={approve.error.code === 'ALREADY_SENT' ? 'info' : 'error'} title={approve.error.code === 'ALREADY_SENT' ? 'Already sent' : 'Not sent'}>
              {approve.error.message}
            </Banner>
          )}
          <div className="actions">
            <button className="btn btn-primary" disabled={!canApprove || approve.isPending || !text.trim()} onClick={() => approve.mutate()}>
              {approve.isPending ? 'Sending' : 'Approve and send'}
            </button>
            {!canApprove && !closed && <span className="meta">Approval is blocked until a fresh investigation finishes.</span>}
            {closed && <span className="meta">This ticket is closed.</span>}
          </div>
        </>
      )}
    </div>
  );
}

export function DraftStatusTag({ draft }) {
  if (!draft) return null;
  return <Status value={draft.status === 'READY' && draft.isOutdated ? 'OUTDATED' : draft.status} />;
}

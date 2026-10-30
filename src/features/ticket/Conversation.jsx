import { formatDateTime } from '../../lib/format.js';
import { EmptyState } from '../../components/ui.jsx';

/** Customer messages and outgoing replies, oldest first. Replies sent from an AI draft keep the original draft viewable. */
export default function Conversation({ messages, investigations }) {
  const drafts = (investigations ?? []).flatMap((i) => (i.draft ? [i.draft] : []));
  if (!messages?.length) return <EmptyState title="No messages yet" />;

  return (
    <ol className="thread" aria-label="Conversation">
      {messages.map((m) => {
        const outgoing = m.kind === 'OUTGOING';
        const draft = m.draftId ? drafts.find((d) => d.id === m.draftId) : null;
        return (
          <li key={m.id} className={outgoing ? 'msg msg-out' : 'msg msg-in'}>
            <div className="msg-head">
              <strong>{outgoing ? `Reply sent by ${m.author?.name ?? 'staff'}` : 'Customer'}</strong>
              <span className="meta">
                {formatDateTime(m.createdAt)}
                {!outgoing && m.author ? `, entered by ${m.author.name}` : ''}
              </span>
            </div>
            <p className="msg-body">{m.body}</p>
            {outgoing && (
              <p className="meta">
                {m.draftId ? 'Approved from an AI draft. No email was delivered; sending is simulated.' : 'Written manually. No email was delivered; sending is simulated.'}
              </p>
            )}
            {draft && draft.suggestedReply.trim() !== m.body.trim() && (
              <details className="original">
                <summary>Original AI draft (kept for history)</summary>
                <p className="msg-body">{draft.suggestedReply}</p>
              </details>
            )}
          </li>
        );
      })}
    </ol>
  );
}

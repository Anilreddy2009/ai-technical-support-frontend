import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../api/client.js';
import { Banner } from '../../components/ui.jsx';

export default function EnvironmentPanel({ ticket }) {
  const qc = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(ticket.environmentDetails ?? '');
  const closed = ticket.status === 'CLOSED';

  const save = useMutation({
    mutationFn: () => api.patch(`/tickets/${ticket.id}/environment`, { environmentDetails: text }),
    onSuccess: () => {
      setEditing(false);
      qc.invalidateQueries({ queryKey: ['ticket', ticket.id] });
      qc.invalidateQueries({ queryKey: ['investigations', ticket.id] });
    },
  });

  return (
    <section className="section" aria-labelledby="env-h">
      <div className="section-head">
        <h2 id="env-h">Environment details</h2>
        {!closed && !editing && (
          <button
            className="btn btn-quiet"
            onClick={() => {
              setText(ticket.environmentDetails ?? '');
              setEditing(true);
            }}
          >
            Edit
          </button>
        )}
      </div>

      {editing ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            save.mutate();
          }}
          className="form"
        >
          <label className="sr-only" htmlFor="env-text">
            Environment details
          </label>
          <textarea id="env-text" className="mono" rows={8} value={text} onChange={(e) => setText(e.target.value)} />
          <p className="meta">Changing these details makes any existing AI draft outdated.</p>
          {save.error && <Banner kind="error" title="Not saved">{save.error.message}</Banner>}
          <div className="actions">
            <button type="button" className="btn btn-quiet" onClick={() => setEditing(false)}>
              Cancel
            </button>
            <button className="btn btn-primary" disabled={save.isPending}>
              Save details
            </button>
          </div>
        </form>
      ) : ticket.environmentDetails ? (
        <pre className="env">{ticket.environmentDetails}</pre>
      ) : (
        <p className="meta">No environment details were entered. The AI will treat anything not stated as unknown.</p>
      )}
    </section>
  );
}

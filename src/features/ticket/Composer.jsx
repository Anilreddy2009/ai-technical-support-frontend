import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../api/client.js';
import { Banner } from '../../components/ui.jsx';

export default function Composer({ ticket }) {
  const qc = useQueryClient();
  const [mode, setMode] = useState('reply'); // reply | customer
  const [body, setBody] = useState('');

  const send = useMutation({
    mutationFn: () => api.post(mode === 'reply' ? `/tickets/${ticket.id}/replies` : `/tickets/${ticket.id}/messages`, { body }),
    onSuccess: () => {
      setBody('');
      qc.invalidateQueries({ queryKey: ['ticket', ticket.id] });
      qc.invalidateQueries({ queryKey: ['investigations', ticket.id] }); // a new customer message outdates drafts
    },
  });

  if (ticket.status === 'CLOSED') {
    return <Banner kind="info">This ticket is closed. You can still read everything on it.</Banner>;
  }

  return (
    <form
      className="composer"
      onSubmit={(e) => {
        e.preventDefault();
        if (body.trim()) send.mutate();
      }}
    >
      <div className="tabs" role="tablist" aria-label="Message type">
        <button type="button" role="tab" aria-selected={mode === 'reply'} className={mode === 'reply' ? 'is-on' : ''} onClick={() => setMode('reply')}>
          Reply to customer
        </button>
        <button type="button" role="tab" aria-selected={mode === 'customer'} className={mode === 'customer' ? 'is-on' : ''} onClick={() => setMode('customer')}>
          Add customer message
        </button>
      </div>
      <label className="sr-only" htmlFor="composer-body">
        {mode === 'reply' ? 'Reply text' : 'Customer message'}
      </label>
      <textarea
        id="composer-body"
        rows={4}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder={mode === 'reply' ? 'Write a reply without AI. Nothing is sent until you press Send reply.' : 'Enter a follow-up or correction from the customer.'}
      />
      {mode === 'customer' && <p className="meta">Adding a customer message makes any existing AI draft outdated.</p>}
      {send.error && <Banner kind="error" title="Not saved">{send.error.message}</Banner>}
      <div className="actions">
        <button className="btn btn-primary" disabled={send.isPending || !body.trim()}>
          {mode === 'reply' ? 'Send reply' : 'Add message'}
        </button>
      </div>
    </form>
  );
}

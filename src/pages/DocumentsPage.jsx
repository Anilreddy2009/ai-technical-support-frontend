import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client.js';
import { useAuth } from '../auth/AuthContext.jsx';
import { useDocuments } from '../api/queries.js';
import { Banner, EmptyState, ErrorNote, Loading, Status } from '../components/ui.jsx';
import { formatDateTime } from '../lib/format.js';

const MANUAL_URL = 'https://www.postgresql.org/files/documentation/pdf/16/postgresql-16-A4.pdf';

const OUTCOME_TEXT = {
  STARTED: ['info', 'Ingestion started', 'Downloading and processing the manual. You can keep using the app meanwhile.'],
  ALREADY_RUNNING: ['info', 'Already in progress', 'This URL is already being processed, so no second job was started.'],
  ALREADY_READY: ['ok', 'Already ingested', 'This manual is ready. The existing snapshot is being reused.'],
  NEEDS_RETRY: ['warn', 'Earlier attempt did not finish', 'Use Retry on the document below to continue.'],
};

export default function DocumentsPage() {
  const { isAdmin } = useAuth();
  const qc = useQueryClient();
  const docs = useDocuments();
  const [url, setUrl] = useState(MANUAL_URL);

  const ingest = useMutation({
    mutationFn: () => api.post('/documents/ingest', { url }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['documents'] }),
  });
  const retry = useMutation({
    mutationFn: (id) => api.post(`/documents/${id}/retry`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['documents'] }),
  });

  const outcome = ingest.data ? OUTCOME_TEXT[ingest.data.outcome] : null;

  return (
    <>
      <div className="page-head">
        <h1>Documentation</h1>
      </div>

      {isAdmin ? (
        <form
          className="ingest"
          onSubmit={(e) => {
            e.preventDefault();
            ingest.mutate();
          }}
        >
          <label>
            Public PDF address
            <input type="url" value={url} onChange={(e) => setUrl(e.target.value)} required />
          </label>
          <button className="btn btn-primary" disabled={ingest.isPending}>
            {ingest.isPending ? 'Submitting' : 'Ingest document'}
          </button>
        </form>
      ) : (
        <Banner kind="info">Only administrators can add documentation. You can see its status here.</Banner>
      )}

      {outcome && (
        <Banner kind={outcome[0]} title={outcome[1]}>
          {outcome[2]}
        </Banner>
      )}
      {ingest.error && (
        <Banner kind="error" title="The address was not accepted">
          {ingest.error.message}
        </Banner>
      )}
      {retry.error && (
        <Banner kind="error" title="Retry was not started">
          {retry.error.message}
        </Banner>
      )}

      {docs.isLoading && <Loading label="Loading documentation" />}
      <ErrorNote error={docs.error} retry={() => docs.refetch()} />
      {docs.data?.length === 0 && (
        <EmptyState title="No documentation yet">
          Investigations are unavailable until the manual has been ingested.
          {isAdmin ? ' Submit the PDF address above.' : ' Ask an administrator to ingest it.'}
        </EmptyState>
      )}

      {docs.data?.map((d) => (
        <DocumentRow key={d.id} doc={d} isAdmin={isAdmin} onRetry={() => retry.mutate(d.id)} retrying={retry.isPending} />
      ))}
    </>
  );
}

function DocumentRow({ doc: d, isAdmin, onRetry, retrying }) {
  const active = ['QUEUED', 'DOWNLOADING', 'PROCESSING'].includes(d.status);
  const notes = d.extractionNotes ?? {};
  const limited = Object.entries(notes).filter(([k, v]) => k.endsWith('Pages') && v?.count);

  return (
    <section className="doc">
      <div className="doc-head">
        <h2>{d.title ?? 'Documentation'}</h2>
        <Status value={d.status} />
      </div>
      <p className="meta break">{d.sourceUrl}</p>

      {active && (
        <div className="progress-block">
          <p>
            {d.stage ?? 'Working'}
            {d.pageCount ? `: ${d.pagesProcessed} of ${d.pageCount} pages read` : ''}
          </p>
          <progress max={d.pageCount || 1} value={d.pageCount ? d.pagesProcessed : undefined} aria-label="Ingestion progress" />
        </div>
      )}

      {(d.status === 'FAILED' || d.status === 'INTERRUPTED') && (
        <Banner
          kind={d.status === 'FAILED' ? 'error' : 'warn'}
          title={d.status === 'FAILED' ? 'Ingestion failed' : 'Processing was interrupted'}
          action={
            isAdmin && d.canRetry && (
              <button className="btn btn-primary" onClick={onRetry} disabled={retrying}>
                Retry
              </button>
            )
          }
        >
          {d.errorMessage}
          {d.pagesProcessed > 0 && ` ${d.pagesProcessed} pages were already read and will not be read again.`}
          {!isAdmin && ' Ask an administrator to retry.'}
        </Banner>
      )}

      {d.status === 'READY' && (
        <>
          <dl className="facts-grid">
            <dt>Version</dt>
            <dd>{d.docVersion ?? 'Unknown'}</dd>
            <dt>Retrieved</dt>
            <dd>{formatDateTime(d.retrievedAt)}</dd>
            <dt>Pages</dt>
            <dd>{d.pageCount}</dd>
            <dt>Searchable passages</dt>
            <dd>{d.chunkCount}</dd>
          </dl>
          <details className="notes">
            <summary>Extraction limitations</summary>
            {notes.note && <p>{notes.note}</p>}
            {limited.length === 0 ? (
              <p>Every page produced searchable text.</p>
            ) : (
              <ul>
                {limited.map(([k, v]) => (
                  <li key={k}>
                    {v.count} {k.replace('Pages', '').toLowerCase()} page{v.count === 1 ? '' : 's'}
                    {v.pages?.length ? `, for example pages ${v.pages.slice(0, 8).join(', ')}` : ''}
                  </li>
                ))}
              </ul>
            )}
          </details>
        </>
      )}
    </section>
  );
}

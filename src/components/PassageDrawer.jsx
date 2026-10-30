import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useDocumentPage, usePassage } from '../api/queries.js';
import { formatDateTime, pageRange, splitHighlight } from '../lib/format.js';
import { Loading, ErrorNote } from './ui.jsx';

const PassageContext = createContext({ open: () => {} });
export const usePassageDrawer = () => useContext(PassageContext);

export function PassageProvider({ children }) {
  const [target, setTarget] = useState(null); // { chunkId, quote }
  const open = useCallback((chunkId, quote) => setTarget({ chunkId, quote }), []);
  const close = useCallback(() => setTarget(null), []);
  const value = useMemo(() => ({ open }), [open]);
  return (
    <PassageContext.Provider value={value}>
      {children}
      {target && <PassageDrawer key={target.chunkId} target={target} onClose={close} />}
    </PassageContext.Provider>
  );
}

function PassageBody({ content, quote }) {
  const parts = splitHighlight(content, quote);
  return (
    <pre className="manual-text">
      {parts ? (
        <>
          {parts[0]}
          <mark>{parts[1]}</mark>
          {parts[2]}
        </>
      ) : (
        content
      )}
    </pre>
  );
}

function PassageDrawer({ target, onClose }) {
  const { data: p, isLoading, error } = usePassage(target.chunkId);
  const [viewPage, setViewPage] = useState(null); // full-page view of one cited page
  const pageQuery = useDocumentPage(p?.documentId, viewPage, viewPage !== null);
  const closeRef = useRef(null);

  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const pages = p ? Array.from({ length: Math.min(p.pageEnd - p.pageStart + 1, 6) }, (_, i) => p.pageStart + i) : [];

  return (
    <>
      <div className="scrim" onClick={onClose} />
      <aside className="drawer" role="dialog" aria-modal="true" aria-label="Documentation passage">
        <header className="drawer-head">
          <div>
            <h2>{p ? `${p.sectionNumber ? `${p.sectionNumber} ` : ''}${p.sectionTitle ?? 'Passage'}` : 'Passage'}</h2>
            {p && (
              <p className="meta">
                {p.documentTitle ?? 'Manual'}
                {p.docVersion ? `, version ${p.docVersion}` : ''}
              </p>
            )}
          </div>
          <button ref={closeRef} className="btn btn-quiet" onClick={onClose}>
            Close
          </button>
        </header>

        {isLoading && <Loading label="Opening passage" />}
        <ErrorNote error={error} />

        {p && (
          <div className="drawer-scroll">
            <div className="manual-page">
              <div className="gutter" aria-label={`Page ${pageRange(p)}`}>
                <span className="gutter-label">{p.pageEnd !== p.pageStart ? 'pages' : 'page'}</span>
                <span className="gutter-number">{pageRange(p)}</span>
              </div>
              <PassageBody content={p.content} quote={target.quote} />
            </div>

            <dl className="provenance">
              <dt>Source</dt>
              <dd>
                <a href={p.sourceUrl} target="_blank" rel="noreferrer">
                  {p.sourceUrl}
                </a>
              </dd>
              <dt>Retrieved</dt>
              <dd>{formatDateTime(p.retrievedAt)}</dd>
              <dt>Snapshot</dt>
              <dd>The text above comes from the downloaded copy, not the live website.</dd>
            </dl>

            <div className="page-switch">
              <span>View the full page:</span>
              {pages.map((n) => (
                <button
                  key={n}
                  className={`btn btn-quiet ${viewPage === n ? 'is-on' : ''}`}
                  onClick={() => setViewPage(viewPage === n ? null : n)}
                  aria-pressed={viewPage === n}
                >
                  {n}
                </button>
              ))}
            </div>
            {viewPage !== null && (
              <div className="manual-page">
                <div className="gutter">
                  <span className="gutter-label">page</span>
                  <span className="gutter-number">{viewPage}</span>
                </div>
                {pageQuery.isLoading ? <Loading label="Loading page" /> : <PassageBody content={pageQuery.data?.text ?? ''} quote={target.quote} />}
              </div>
            )}
          </div>
        )}
      </aside>
    </>
  );
}

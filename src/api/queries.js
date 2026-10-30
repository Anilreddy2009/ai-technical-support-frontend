import { useQuery } from '@tanstack/react-query';
import { api } from './client.js';

const ACTIVE_DOC = ['QUEUED', 'DOWNLOADING', 'PROCESSING'];
const ACTIVE_INV = ['QUEUED', 'RUNNING'];

export function useDocuments() {
  return useQuery({
    queryKey: ['documents'],
    queryFn: () => api.get('/documents'),
    // Poll only while something is being ingested.
    refetchInterval: (q) => ((q.state.data ?? []).some((d) => ACTIVE_DOC.includes(d.status)) ? 2000 : false),
  });
}

export function useTickets(status) {
  return useQuery({
    queryKey: ['tickets', status || 'ALL'],
    queryFn: () => api.get(`/tickets${status ? `?status=${status}` : ''}`),
  });
}

export function useTicket(id) {
  return useQuery({ queryKey: ['ticket', id], queryFn: () => api.get(`/tickets/${id}`) });
}

export function useInvestigations(ticketId) {
  return useQuery({
    queryKey: ['investigations', ticketId],
    queryFn: () => api.get(`/tickets/${ticketId}/investigations`),
    refetchInterval: (q) => ((q.state.data ?? []).some((i) => ACTIVE_INV.includes(i.status)) ? 1500 : false),
  });
}

export function usePassage(chunkId, enabled = true) {
  return useQuery({
    queryKey: ['passage', chunkId],
    queryFn: () => api.get(`/documents/passages/${chunkId}`),
    enabled: enabled && !!chunkId,
    staleTime: Infinity, // passages come from an immutable snapshot
  });
}

export function useDocumentPage(documentId, pageNumber, enabled) {
  return useQuery({
    queryKey: ['page', documentId, pageNumber],
    queryFn: () => api.get(`/documents/${documentId}/pages/${pageNumber}`),
    enabled: enabled && !!documentId && !!pageNumber,
    staleTime: Infinity,
  });
}

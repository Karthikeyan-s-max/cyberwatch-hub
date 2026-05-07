/* Frontend API client for communicating with backend
   Usage: import { getHealth, getAlerts, postAlert } from '@/lib/api'
*/

const BASE = (import.meta.env.VITE_API_BASE as string) || '/api';

async function request(path: string, options: RequestInit = {}) {
  const url = BASE.endsWith('/') ? BASE.slice(0, -1) + path : BASE + path;
  // Allow opt-in for sending credentials from Vite env var. Default to not sending credentials
  // to avoid CORS failures when backend returns Access-Control-Allow-Origin: '*'.
  const includeCredentials = (import.meta.env.VITE_API_INCLUDE_CREDENTIALS as string) === 'true';
  const res = await fetch(url, {
    ...(includeCredentials ? { credentials: 'include' as RequestCredentials } : { credentials: 'omit' as RequestCredentials }),
    headers: { ...(options.headers || {}), 'Accept': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`${res.status} ${res.statusText}: ${txt}`);
  }
  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('application/json')) return res.json();
  if (contentType.includes('application/pdf')) return res.arrayBuffer();
  return res.text();
}

export async function getHealth() {
  return request('/health');
}

export async function detectLive(body: { rtsp_url: string }) {
  return request('/detect/live', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

// alias required by frontend pages
export async function connectLive(body: { rtsp_url: string }) {
  return detectLive(body);
}

export async function detectUpload(file: File) {
  const fd = new FormData();
  fd.append('file', file, file.name);
  return request('/detect/upload', { method: 'POST', body: fd });
}

// frontend-friendly alias
export async function uploadVideo(file: File) {
  return detectUpload(file);
}

export async function detectWebcam(imageBase64: string) {
  return request('/detect/webcam', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ image_base64: imageBase64 }),
  });
}

export async function getAlerts(params: { limit?: number; min_confidence?: number; date?: string } = {}) {
  const qs = new URLSearchParams();
  if (params.limit) qs.set('limit', String(params.limit));
  if (params.min_confidence) qs.set('min_confidence', String(params.min_confidence));
  if (params.date) qs.set('date', params.date);
  return request('/alerts/?' + qs.toString());
}

export async function postAlert(payload: any) {
  return request('/alerts/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export async function deleteAlert(alertId: number | string) {
  return request(`/alerts/${alertId}`, {
    method: 'DELETE',
  });
}

export async function getSettings() {
  return request('/settings/');
}

export async function updateSettings(payload: any) {
  return request('/settings/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

// alias: frontend expects saveSettings
export async function saveSettings(payload: any) {
  return updateSettings(payload);
}

export async function sendSms(to: string, message: string) {
  return request('/notify/sms', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ to, message }),
  });
}

export async function sendEmail(to: string, subject: string, body: string) {
  return request('/notify/email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ to, subject, body }),
  });
}

export async function getReportPdf(params: { min_confidence?: number; date_from?: string; date_to?: string } = {}) {
  const qs = new URLSearchParams();
  if (params.min_confidence) qs.set('min_confidence', String(params.min_confidence));
  if (params.date_from) qs.set('date_from', params.date_from);
  if (params.date_to) qs.set('date_to', params.date_to);
  return request('/reports/pdf?' + qs.toString());
}

// alias: frontend expects generateReport
export async function generateReport(params: { min_confidence?: number; date_from?: string; date_to?: string } = {}) {
  return getReportPdf(params);
}

export default {
  getHealth,
  detectLive,
  connectLive,
  detectUpload,
  uploadVideo,
  detectWebcam,
  getAlerts,
  postAlert,
  deleteAlert,
  getSettings,
  updateSettings,
  saveSettings,
  sendSms,
  sendEmail,
  getReportPdf,
  generateReport,
};

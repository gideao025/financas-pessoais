export function resolveApiBaseUrl(): string {
  if (typeof window === 'undefined') {
    return 'http://localhost:8080/api';
  }

  return window.location.port === '9090'
    ? 'http://localhost:9091/api'
    : 'http://localhost:8080/api';
}

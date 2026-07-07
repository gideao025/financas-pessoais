export function resolveApiBaseUrl(): string {
  // Caminho relativo: o nginx do frontend faz proxy de /api para o backend.
  // Funciona em qualquer origem (localhost, IP da LAN ou domínio atrás de proxy reverso),
  // sem CORS e sem depender de porta/host fixos.
  return '/api';
}

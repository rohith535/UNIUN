import client from 'prom-client';

export const register = new client.Registry();

export const notificationsProcessed = new client.Counter({
  name: 'notifications_processed_total',
  help: 'Total number of notifications processed',
});

export const activeConnections = new client.Gauge({
  name: 'active_websocket_connections',
  help: 'Number of active WebSocket connections',
});

register.registerMetric(notificationsProcessed);
register.registerMetric(activeConnections);

export function setupMetrics() {
  client.collectDefaultMetrics({ register });
}

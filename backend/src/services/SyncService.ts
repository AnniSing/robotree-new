import { WebSocketServer, WebSocket } from 'ws';
import { Server as HttpServer } from 'node:http';
import { Logger } from '../telemetry/logger.js';

export interface SyncMessage {
  type: 'DATA_SYNC';
  entity: 'courses' | 'team' | 'products' | 'events' | 'showcase' | 'institutes' | 'settings' | 'users' | 'certificates' | string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'SYNC';
  id?: string;
  timestamp: number;
}

export class SyncService {
  private static wss: WebSocketServer | null = null;
  private static clients: Set<WebSocket> = new Set();
  private static pingInterval: NodeJS.Timeout | null = null;

  public static initialize(server: HttpServer): void {
    if (this.wss) return;

    this.wss = new WebSocketServer({
      server,
      path: '/ws',
    });

    this.wss.on('connection', (ws: WebSocket, req) => {
      this.clients.add(ws);

      // Send initial welcome/ready handshake
      try {
        ws.send(JSON.stringify({
          type: 'CONNECTED',
          message: 'Robotree Real-Time Sync Connected',
          activeClients: this.clients.size,
          timestamp: Date.now(),
        }));
      } catch (_) {}

      ws.on('close', () => {
        this.clients.delete(ws);
      });

      ws.on('error', () => {
        this.clients.delete(ws);
      });

      ws.on('message', (data) => {
        try {
          const msg = JSON.parse(data.toString());
          if (msg.type === 'PING') {
            ws.send(JSON.stringify({ type: 'PONG', timestamp: Date.now() }));
          }
        } catch (_) {}
      });
    });

    // Heartbeat every 25 seconds
    this.pingInterval = setInterval(() => {
      for (const client of this.clients) {
        if (client.readyState === WebSocket.OPEN) {
          try {
            client.ping();
          } catch (_) {
            this.clients.delete(client);
          }
        } else {
          this.clients.delete(client);
        }
      }
    }, 25000);

    Logger.info('Real-Time Data Synchronization WebSocket mounted on /ws');
  }

  public static broadcast(
    entity: SyncMessage['entity'],
    action: SyncMessage['action'],
    id?: string
  ): void {
    const payload: SyncMessage = {
      type: 'DATA_SYNC',
      entity,
      action,
      id,
      timestamp: Date.now(),
    };

    const str = JSON.stringify(payload);
    for (const client of this.clients) {
      if (client.readyState === WebSocket.OPEN) {
        try {
          client.send(str);
        } catch (_) {
          this.clients.delete(client);
        }
      }
    }
  }

  public static getActiveClientsCount(): number {
    return this.clients.size;
  }
}

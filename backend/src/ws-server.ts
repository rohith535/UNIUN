import { WebSocketServer } from 'ws'
import { Server } from 'http'
import jwt from 'jsonwebtoken'
import { activeConnections } from './metrics'

type ClientMeta = {
  ws: any
  userId?: string
  room?: string
  peerId?: string
}

export function startWSServer(server: any) {
  const wss = new WebSocketServer({ noServer: true })
  // store clients with metadata, mapped by userId
  const clients = new Map<string, Set<ClientMeta>>()
  // rooms map: room -> Set<ClientMeta>
  const rooms = new Map<string, Set<ClientMeta>>()

  const bots = [
    { name: 'PAZE', lines: [
      "I'm not procrastinating, I'm prioritizing relaxation.",
      "Budgeted my energy today. Turns out the budget was zero.",
      "BRB, optimizing my vibe-to-work ratio.",
    ]},
    { name: 'PrDeep', lines: [
      "I went so deep I found my past TODOs judging me.",
      "If it compiles, ship it. If it doesn’t, ship a philosophy essay.",
      "Edge case discovered: reality.",
    ]},
    { name: 'SHAIVATE', lines: [
      "Refactored my coffee into bugs.",
      "Added a feature: it’s called hope.",
      "Unit tests? I prefer unity with the tests.",
    ]},
    { name: 'MITRA', lines: [
      "Mentored my code. It asked for a raise.",
      "Scheduled downtime for my neurons.",
      "Follow the data, but bring snacks.",
    ]},
    { name: 'MACRO', lines: [
      "Automated breakfast. Now debugging the toaster.",
      "Shortcut key for life please.",
      "If it’s repetitive, I scripted it. Including small talk.",
    ]},
    { name: 'RB', lines: [
      "Rebuilt the build. Now it builds character.",
      "Latency fixed: moved the goalposts closer.",
      "My favorite color is ‘#00FFSuccess’.",
    ]},
  ]

  server.on('upgrade', (req: any, socket: any, head: any) => {
    if (req.url && req.url.startsWith('/ws')) {
      wss.handleUpgrade(req, socket, head, (ws: any) => {
        wss.emit('connection', ws, req)
      })
    } else {
      socket.destroy()
    }
  })

  wss.on('connection', (ws: any, req: any) => {
    const meta: ClientMeta = { ws };
    activeConnections.inc();

    // Authenticate user
    const token = req.url.split('token=')[1];
    if (token) {
      try {
        const decoded: any = jwt.verify(token, process.env.JWT_SECRET || 'devsecret');
        meta.userId = decoded.sub;
        if (meta.userId) {
          if (!clients.has(meta.userId)) {
            clients.set(meta.userId, new Set());
          }
          clients.get(meta.userId)!.add(meta);
        } else {
          ws.close();
        }
      } catch (e) {
        ws.close();
      }
    } else {
      ws.close();
    }

    ws.on('message', (raw: any) => {
      let msg: any;
      try { msg = JSON.parse(raw.toString()) } catch { return }

      // Handle other message types...
    });

    ws.on('close', () => {
      activeConnections.dec();
      if (meta.userId && clients.has(meta.userId)) {
        clients.get(meta.userId)!.delete(meta);
        if (clients.get(meta.userId)!.size === 0) {
          clients.delete(meta.userId);
        }
      }
    });
  });

  (wss as any).broadcast = (userId: string, message: any) => {
    if (clients.has(userId)) {
      for (const client of clients.get(userId)!) {
        if (client.ws.readyState === client.ws.OPEN) {
          client.ws.send(JSON.stringify(message));
        }
      }
    }
  };

  console.log('WebSocket signaling server started with room/peer support')
  return wss;
}

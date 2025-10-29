import dotenv from 'dotenv';
import { connectMongo } from './mongo';
import { connectNeo4j } from './neo4j';
import createApp from './app'
import { createServer } from 'http'
import { startWSServer } from './ws-server'
import { loadDevData } from './dev-storage'

dotenv.config();

const port = process.env.PORT || 4000;

async function start() {
  // try to load dev data for memory fallback
  loadDevData()
  try {
    await connectMongo();
  } catch (err) {
    console.warn('Warning: could not connect to MongoDB, continuing in degraded mode');
  }

  try {
    await connectNeo4j();
  } catch (err) {
    console.warn('Warning: could not connect to Neo4j, continuing in degraded mode');
  }

  const server = createServer()
  let wss: any;
  try {
    wss = startWSServer(server)
  } catch (err) {
    console.warn('Could not start WebSocket server', err)
  }
  const app = createApp(wss);
  server.on('request', app);

  server.listen(port, () => console.log(`Backend listening on ${port}`))
}

start().catch((err) => {
  console.error('Fatal error during startup', err);
  process.exit(1);
});

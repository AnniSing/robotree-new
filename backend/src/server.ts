import { startServer } from './app.js';
import { env } from './config/env.js';

startServer(env.PORT, env.HOST);

import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';

import { connectDB } from './config/db';
import { apiLimiter } from './middleware/rateLimiter';
import { errorHandler } from './middleware/errorHandler';
import { initSimulator } from './services/simulator';

// Router imports
import authRouter from './routes/auth';
import firewallRouter from './routes/firewall';
import devicesRouter from './routes/devices';
import ticketsRouter from './routes/tickets';
import vpnRouter from './routes/vpn';
import securityRouter from './routes/security';
import auditRouter from './routes/audit';
import adRouter from './routes/ad';

dotenv.config();

const app = express();
const server = http.createServer(app);

// Configure Socket.io
const io = new Server(server, {
  cors: {
    origin: '*', // For development flexibility
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  }
});

const PORT = process.env.PORT || 5000;

// Connect to Database
connectDB();

// Middlewares
app.use(helmet({
  contentSecurityPolicy: false // Allow inline scripts/styles for development dashboards
}));
app.use(cors());
app.use(express.json());

// API Base Rate Limiting
app.use('/api', apiLimiter);

// Bind API Routing endpoints
app.use('/api/auth', authRouter);
app.use('/api/firewall', firewallRouter);
app.use('/api/devices', devicesRouter);
app.use('/api/tickets', ticketsRouter);
app.use('/api/vpn', vpnRouter);
app.use('/api/security', securityRouter);
app.use('/api/audit', auditRouter);
app.use('/api/ad', adRouter);

// Base ping endpoint for health checks
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date() });
});

// Socket.io Connection Handler
io.on('connection', (socket) => {
  console.log(`[Socket Connected] Client ID: ${socket.id}`);
  
  socket.on('disconnect', () => {
    console.log(`[Socket Disconnected] Client ID: ${socket.id}`);
  });
});

// Initialize Background Simulation Engine
initSimulator(io);

// Global Error Handler Middleware
app.use(errorHandler);

// Start server
server.listen(PORT, () => {
  console.log(`=================================================`);
  console.log(`  EIMP Backend Server running on port ${PORT}`);
  console.log(`  Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`=================================================`);
});

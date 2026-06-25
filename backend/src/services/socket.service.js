const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const config = require('../config');
const logger = require('../config/logger');

let io = null;

const initSocketIO = (server) => {
  io = new Server(server, {
    cors: {
      origin: config.corsOrigin,
      methods: ['GET', 'POST'],
      credentials: true,
    },
    pingInterval: 25000,
    pingTimeout: 20000,
    transports: ['websocket', 'polling'],
  });

  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth.token ||
                    socket.handshake.query.token ||
                    socket.handshake.headers.authorization?.replace('Bearer ', '');

      if (!token) {
        return next(new Error('Authentication required'));
      }

      const decoded = jwt.verify(token, config.jwt.secret);
      socket.userId = decoded.id;
      socket.userRole = decoded.role;
      socket.userName = decoded.name;
      next();
    } catch (error) {
      logger.error('Socket auth error:', error.message);
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    logger.info(`User connected: ${socket.userId} (${socket.userRole})`);

    socket.join(`user:${socket.userId}`);

    socket.on('trek:join', (trekId) => {
      socket.join(`trek:${trekId}`);
      logger.info(`User ${socket.userId} joined trek room: ${trekId}`);
    });

    socket.on('trek:leave', (trekId) => {
      socket.leave(`trek:${trekId}`);
      logger.info(`User ${socket.userId} left trek room: ${trekId}`);
    });

    socket.on('sos:join', (sosId) => {
      socket.join(`sos:${sosId}`);
      logger.info(`User ${socket.userId} joined SOS room: ${sosId}`);
    });

    socket.on('sos:leave', (sosId) => {
      socket.leave(`sos:${sosId}`);
    });

    socket.on('location:update', (data) => {
      socket.to(`trek:${data.trek_id}`).emit('location:update', {
        user_id: socket.userId,
        ...data,
      });
    });

    socket.on('typing', (data) => {
      socket.to(`trek:${data.trek_id}`).emit('typing', {
        user_id: socket.userId,
        name: socket.userName,
      });
    });

    socket.on('disconnect', (reason) => {
      logger.info(`User disconnected: ${socket.userId} (${reason})`);
    });

    socket.on('error', (error) => {
      logger.error(`Socket error for user ${socket.userId}:`, error.message);
    });
  });

  logger.info('Socket.io initialized');
  return io;
};

const getIO = () => io;

module.exports = { initSocketIO, getIO };

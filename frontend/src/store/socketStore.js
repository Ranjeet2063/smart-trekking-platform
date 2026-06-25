import { io } from 'socket.io-client';
import { useAuthStore } from './authStore';

let socket = null;

export const connectSocket = () => {
  if (socket?.connected) return socket;

  const token = useAuthStore.getState().accessToken;
  if (!token) return null;

  const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || '';

  socket = io(SOCKET_URL, {
    auth: { token },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 10000,
  });

  socket.on('connect', () => {
    console.log('Socket connected:', socket.id);
  });

  socket.on('disconnect', (reason) => {
    console.log('Socket disconnected:', reason);
  });

  socket.on('connect_error', (error) => {
    console.error('Socket connection error:', error.message);
  });

  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const getSocket = () => socket;

export const joinTrekRoom = (trekId) => {
  if (socket?.connected) {
    socket.emit('trek:join', trekId);
  }
};

export const leaveTrekRoom = (trekId) => {
  if (socket?.connected) {
    socket.emit('trek:leave', trekId);
  }
};

export const joinSOSRoom = (sosId) => {
  if (socket?.connected) {
    socket.emit('sos:join', sosId);
  }
};

export const leaveSOSRoom = (sosId) => {
  if (socket?.connected) {
    socket.emit('sos:leave', sosId);
  }
};

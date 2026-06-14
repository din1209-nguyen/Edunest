/**
 * Socket.io Service — Realtime events for Edunest
 *
 * Events:
 * - creator:stats-update     → Gửi khi có học viên mới enroll / hoàn thành bài ở các khóa học do user quản lý
 * - learning:progress-update → Gửi khi progress thay đổi cho người học
 * - admin:notification       → Gửi khi có khóa học mới pending approval
 */

import jwt from 'jsonwebtoken';
import cookie from 'cookie';
import config from '../config/index.js';

const connectedCreators = new Map(); // userId → socket
const connectedLearners = new Map(); // userId → socket
const connectedAdmins = new Map(); // adminId → socket

function getTokenFromSocket(socket) {
  const handshakeToken = socket.handshake.auth?.token || socket.handshake.query?.token;
  if (handshakeToken) {
    return typeof handshakeToken === 'string' ? handshakeToken : null;
  }

  const cookieHeader = socket.handshake.headers?.cookie;
  if (!cookieHeader) {
    return null;
  }

  const cookies = cookie.parse(cookieHeader);
  return cookies[config.auth.accessCookieName] || null;
}

function setupSocket(io) {
  // Middleware: xác thực JWT token từ handshake hoặc cookie phiên hiện tại
  io.use((socket, next) => {
    const token = getTokenFromSocket(socket);
    if (!token) {
      socket.user = null;
      return next();
    }

    try {
      const decoded = jwt.verify(token, config.jwt?.secret);
      socket.user = decoded;
      next();
    } catch {
      socket.user = null;
      next();
    }
  });

  io.on('connection', (socket) => {
    const user = socket.user;

    if (!user?.userId) {
      return;
    }

    const userRoom = `user:${user.userId}`;
    socket.join(userRoom);
    connectedLearners.set(user.userId, socket);
    console.log(`[Socket] User connected: ${user.userId}`);

    if (user.role === 'admin') {
      socket.join('admin');
      connectedAdmins.set(user.userId, socket);
      console.log(`[Socket] Admin connected: ${user.userId}`);
    } else {
      socket.join(`creator:${user.userId}`);
      connectedCreators.set(user.userId, socket);
      socket.emit('creator:stats-update', { type: 'connected' });
      console.log(`[Socket] Creator connected: ${user.userId}`);
    }

    socket.on('learning:join-course', (data) => {
      const { courseId } = data;
      if (courseId) {
        socket.join(`course:${courseId}`);
        console.log(`[Socket] User ${user.userId} joined course room: ${courseId}`);
      }
    });

    socket.on('learning:leave-course', (data) => {
      const { courseId } = data;
      if (courseId) {
        socket.leave(`course:${courseId}`);
      }
    });

    socket.on('creator:join-course', (data) => {
      const { courseId } = data;
      if (courseId) {
        socket.join(`course:${courseId}`);
        console.log(`[Socket] Creator ${user.userId} joined course room: ${courseId}`);
      }
    });

    socket.on('disconnect', () => {
      connectedLearners.delete(user.userId);
      console.log(`[Socket] User disconnected: ${user.userId}`);

      if (user.role === 'admin') {
        connectedAdmins.delete(user.userId);
        console.log(`[Socket] Admin disconnected: ${user.userId}`);
      } else {
        connectedCreators.delete(user.userId);
        console.log(`[Socket] Creator disconnected: ${user.userId}`);
      }
    });
  });
}

function emitTeacherStatsUpdate(teacherId, stats) {
  if (!global._io) return;
  global._io.to(`creator:${teacherId}`).emit('creator:stats-update', {
    ...stats,
    timestamp: new Date().toISOString(),
  });
}

function emitAdminNotification(notification) {
  if (!global._io) return;
  global._io.to('admin').emit('admin:notification', {
    ...notification,
    timestamp: new Date().toISOString(),
  });
}

function emitStudentProgressUpdate(studentId, courseId, progressData) {
  if (!global._io) return;
  global._io.to(`user:${studentId}`).emit('learning:progress-update', {
    courseId,
    ...progressData,
    timestamp: new Date().toISOString(),
  });
}

export {
  setupSocket,
  emitTeacherStatsUpdate,
  emitAdminNotification,
  emitStudentProgressUpdate,
};

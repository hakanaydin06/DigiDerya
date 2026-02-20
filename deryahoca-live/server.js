const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server } = require('socket.io');
const fs = require('fs/promises');
const path = require('path');
const localtunnel = process.env.NODE_ENV !== 'production' ? require('localtunnel') : null;

const dev = process.env.NODE_ENV !== 'production';
const hostname = process.env.HOSTNAME || '0.0.0.0'; // Bind to all interfaces for production
const port = process.env.PORT || 3000;

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

// In-memory session and participant storage
const sessions = new Map();
const participants = new Map();
const waitingRoom = new Map(); // Waiting room for students

// Chat Persistence Config
const CHAT_FILE = path.join(__dirname, 'chat-messages.json');
const CHAT_RETENTION_DAYS = 7;
let chatMessages = [];

// Load chat history on startup
async function loadChatHistory() {
  try {
    const data = await fs.readFile(CHAT_FILE, 'utf8');
    chatMessages = JSON.parse(data);

    // Cleanup old messages on startup
    const now = new Date();
    const cleanMessages = chatMessages.filter(msg => {
      const msgDate = new Date(msg.timestamp);
      const diffTime = Math.abs(now - msgDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays <= CHAT_RETENTION_DAYS;
    });

    if (cleanMessages.length !== chatMessages.length) {
      chatMessages = cleanMessages;
      await saveChatHistory();
      console.log(`🧹 Cleaned up ${chatMessages.length - cleanMessages.length} old chat messages`);
    }

    console.log(`💬 Loaded ${chatMessages.length} chat messages`);
  } catch (err) {
    if (err.code !== 'ENOENT') {
      console.error('Error loading chat history:', err);
    } else {
      console.log('📝 No existing chat history found, starting fresh.');
    }
  }
}

async function saveChatHistory() {
  try {
    await fs.writeFile(CHAT_FILE, JSON.stringify(chatMessages, null, 2));
  } catch (err) {
    console.error('Error saving chat history:', err);
  }
}

// Set public URL from env or default
global.publicUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

app.prepare().then(async () => {
  await loadChatHistory();
  const httpServer = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('Internal server error');
    }
  });

  const io = new Server(httpServer, {
    cors: {
      origin: process.env.NEXT_PUBLIC_APP_URL || "*", // Use env variable or allow all (for dev/testing)
      methods: ['GET', 'POST']
    },
    transports: ['websocket', 'polling']
  });

  // Make io accessible to API routes
  global.io = io;
  global.sessions = sessions;
  global.participants = participants;
  global.waitingRoom = waitingRoom;

  io.on('connection', (socket) => {
    console.log('🔌 New connection:', socket.id);

    // Join a session room - Modified for waiting room logic
    socket.on('join-room', ({ sessionId, userName, isTeacher }) => {
      console.log(`👤 ${userName} requesting to join room ${sessionId} (Teacher: ${isTeacher})`);

      // Check for duplicate name
      const existingParticipant = Array.from(participants.values())
        .find(p => p.sessionId === sessionId && p.userName === userName && p.id !== socket.id);

      const existingWaiting = Array.from(waitingRoom.values())
        .find(w => w.sessionId === sessionId && w.userName === userName && w.id !== socket.id);

      if (existingParticipant) {
        // Check if the existing connection is actually active
        const existingSocket = io.sockets.sockets.get(existingParticipant.id);
        if (existingSocket && existingSocket.connected) {
          console.log(`⚠️ Duplicate name prevented: ${userName}`);
          socket.emit('join-error', { message: 'Bu isimde bir kullanıcı zaten derste mevcut. Lütfen isminizin sonuna numara ekleyerek tekrar deneyin.' });
          return;
        } else {
          // Cleanup stale participant
          console.log(`🧹 Cleaning up stale participant: ${userName}`);
          participants.delete(existingParticipant.id);
          // Notify room regarding stale leave if needed, but rejoin usually handles it.
          // Better to emit leave to ensure UI clears old entry before adding new one
          io.to(sessionId).emit('user-left', {
            id: existingParticipant.id,
            userName: existingParticipant.userName
          });
        }
      }

      if (existingWaiting) {
        // Check if stale
        const existingSocket = io.sockets.sockets.get(existingWaiting.id);
        if (existingSocket && existingSocket.connected) {
          console.log(`⚠️ Duplicate name prevented (Waiting): ${userName}`);
          socket.emit('join-error', { message: 'Bu isimde bir kullanıcı zaten bekleme listesinde.' });
          return;
        } else {
          console.log(`🧹 Cleaning up stale waiting student: ${userName}`);
          waitingRoom.delete(existingWaiting.id);
          io.to(sessionId).emit('waiting-student-left', { id: existingWaiting.id });
        }
      }

      if (isTeacher) {
        // Teachers join immediately
        socket.join(sessionId);

        const participant = {
          id: socket.id,
          userName,
          isTeacher: true,
          sessionId,
          isMuted: false,
          isCameraOff: false,
          isHandRaised: false,
          isApproved: true, // Teachers are always approved
        };

        participants.set(socket.id, participant);

        // Notify others in the room
        socket.to(sessionId).emit('user-joined', {
          id: socket.id,
          userName,
          isTeacher: true
        });

        // Send current participants to the teacher
        const roomParticipants = Array.from(participants.values())
          .filter(p => p.sessionId === sessionId && p.id !== socket.id && p.isApproved);
        socket.emit('existing-participants', roomParticipants);

        // Send waiting students to the teacher
        const waitingStudents = Array.from(waitingRoom.values())
          .filter(w => w.sessionId === sessionId);
        if (waitingStudents.length > 0) {
          socket.emit('waiting-students', waitingStudents);
        }

        // If there's an active PDF, sync it
        const session = sessions.get(sessionId);
        if (session && session.pdfState) {
          socket.emit('pdf-sync', session.pdfState);
        }

        // Sync focus mode state
        if (session && session.focusMode) {
          socket.emit('focus-mode-sync', { enabled: session.focusMode });
        }

        // Sync whiteboard strokes for teacher
        if (session && session.whiteboardStrokes && session.whiteboardStrokes.length > 0) {
          socket.emit('whiteboard-sync', session.whiteboardStrokes);
        }

        // Sync Chat History
        socket.emit('chat-history', chatMessages);
      } else {
        // Students go to waiting room first
        const waitingStudent = {
          id: socket.id,
          userName,
          sessionId,
          requestedAt: new Date().toISOString(),
        };

        waitingRoom.set(socket.id, waitingStudent);
        socket.join(`${sessionId}-waiting`);

        // Notify the student they're waiting
        socket.emit('waiting-for-approval', {
          message: 'Öğretmenin onayı bekleniyor...',
        });

        // Notify the teacher about the new waiting student
        socket.to(sessionId).emit('student-waiting', waitingStudent);

        console.log(`⏳ ${userName} added to waiting room for ${sessionId}`);
      }
    });

    // Teacher admits a student from waiting room
    socket.on('admit-student', ({ studentSocketId, sessionId }) => {
      const teacher = participants.get(socket.id);
      if (!teacher || !teacher.isTeacher) {
        console.log('Non-teacher tried to admit student');
        return;
      }

      const waitingStudent = waitingRoom.get(studentSocketId);
      if (!waitingStudent || waitingStudent.sessionId !== sessionId) {
        console.log('Student not found in waiting room');
        return;
      }

      console.log(`✅ Teacher admitting ${waitingStudent.userName}`);

      // Remove from waiting room
      waitingRoom.delete(studentSocketId);
      // Notify everyone (especially teacher) that student left waiting room
      io.to(sessionId).emit('waiting-student-left', { id: studentSocketId });

      // Create participant entry
      const participant = {
        id: studentSocketId,
        userName: waitingStudent.userName,
        isTeacher: false,
        sessionId,
        isMuted: false,
        isCameraOff: false,
        isHandRaised: false,
        isApproved: true,
      };

      participants.set(studentSocketId, participant);

      // Move student from waiting room to main room
      const studentSocket = io.sockets.sockets.get(studentSocketId);
      if (studentSocket) {
        studentSocket.leave(`${sessionId}-waiting`);
        studentSocket.join(sessionId);

        // Notify the student they've been approved
        studentSocket.emit('admission-approved', {
          message: 'Derse kabul edildiniz!',
        });

        // Send current participants to the new student (including teacher)
        const allRoomParticipants = Array.from(participants.values()).filter(p => p.sessionId === sessionId);
        console.log('📊 All participants in room:', allRoomParticipants.map(p => ({ id: p.id, name: p.userName, role: p.isTeacher ? 'Teacher' : 'Student', approved: p.isApproved })));

        const roomParticipants = allRoomParticipants
          .filter(p => p.id !== studentSocketId && p.isApproved);
        console.log('📋 Sending existing participants to new student:', roomParticipants.map(p => ({ id: p.id, userName: p.userName, isTeacher: p.isTeacher })));
        studentSocket.emit('existing-participants', roomParticipants);

        // Send PDF state if active
        const session = sessions.get(sessionId);
        if (session && session.pdfState) {
          studentSocket.emit('pdf-sync', session.pdfState);
        }

        // Sync focus mode state
        if (session && session.focusMode) {
          studentSocket.emit('focus-mode-sync', { enabled: session.focusMode });
        }

        // Sync whiteboard strokes if any exist
        if (session && session.whiteboardStrokes && session.whiteboardStrokes.length > 0) {
          studentSocket.emit('whiteboard-sync', session.whiteboardStrokes);
        }

        // Sync Chat History
        studentSocket.emit('chat-history', chatMessages);
      }

      // Notify EVERYONE (including teacher) about the new participant
      io.to(sessionId).emit('user-joined', {
        id: studentSocketId,
        userName: waitingStudent.userName,
        isTeacher: false
      });
    });

    // Teacher denies a student
    socket.on('deny-student', ({ studentSocketId, sessionId }) => {
      const teacher = participants.get(socket.id);
      if (!teacher || !teacher.isTeacher) return;

      const waitingStudent = waitingRoom.get(studentSocketId);
      if (!waitingStudent || waitingStudent.sessionId !== sessionId) return;

      console.log(`❌ Teacher denied ${waitingStudent.userName}`);

      waitingRoom.delete(studentSocketId);
      io.to(sessionId).emit('waiting-student-left', { id: studentSocketId });

      const studentSocket = io.sockets.sockets.get(studentSocketId);
      if (studentSocket) {
        studentSocket.emit('admission-denied', {
          message: 'Derse katılım isteğiniz reddedildi.',
        });
        studentSocket.disconnect();
      }
    });

    // Chat Message Event
    socket.on('chat-message', async (messageData) => {
      const participant = participants.get(socket.id);
      if (!participant) return;

      const newMessage = {
        id: Date.now().toString(),
        userId: socket.id,
        userName: participant.userName,
        isTeacher: participant.isTeacher,
        text: messageData.text,
        timestamp: new Date().toISOString(),
      };

      chatMessages.push(newMessage);

      // Broadcast to everyone in the room
      io.to(participant.sessionId).emit('chat-message', newMessage);

      // Save async
      await saveChatHistory();
    });

    // Clear Chat Event (Teacher Only)
    socket.on('chat-clear', async ({ sessionId }) => {
      const participant = participants.get(socket.id);
      if (!participant || !participant.isTeacher) return;

      console.log(`🧹 Chat cleared by ${participant.userName}`);
      chatMessages = [];
      await saveChatHistory();

      io.to(sessionId).emit('chat-clear');
    });

    // Focus Mode toggle (Teacher only)
    socket.on('toggle-focus-mode', ({ sessionId, enabled }) => {
      const participant = participants.get(socket.id);
      if (!participant || !participant.isTeacher) return;

      console.log(`🎯 Focus mode ${enabled ? 'enabled' : 'disabled'} for ${sessionId}`);

      const session = sessions.get(sessionId);
      if (session) {
        session.focusMode = enabled;
      }

      // Broadcast to all participants
      io.to(sessionId).emit('focus-mode-sync', { enabled });
    });

    // WebRTC Signaling: Offer
    socket.on('signal-offer', ({ to, offer }) => {
      console.log(`📡 Signal offer from ${socket.id} to ${to}`);
      io.to(to).emit('signal-offer', {
        from: socket.id,
        offer
      });
    });

    // WebRTC Signaling: Answer
    socket.on('signal-answer', ({ to, answer }) => {
      console.log(`📡 Signal answer from ${socket.id} to ${to}`);
      io.to(to).emit('signal-answer', {
        from: socket.id,
        answer
      });
    });

    // WebRTC Signaling: ICE Candidate
    socket.on('signal-ice-candidate', ({ to, candidate }) => {
      io.to(to).emit('signal-ice-candidate', {
        from: socket.id,
        candidate
      });
    });

    // Media state changes
    socket.on('toggle-audio', ({ isMuted }) => {
      const participant = participants.get(socket.id);
      if (participant) {
        participant.isMuted = isMuted;
        socket.to(participant.sessionId).emit('participant-updated', {
          id: socket.id,
          isMuted
        });
      }
    });

    socket.on('toggle-video', ({ isCameraOff }) => {
      const participant = participants.get(socket.id);
      if (participant) {
        participant.isCameraOff = isCameraOff;
        socket.to(participant.sessionId).emit('participant-updated', {
          id: socket.id,
          isCameraOff
        });
      }
    });

    // Raise hand
    socket.on('raise-hand', ({ isHandRaised }) => {
      const participant = participants.get(socket.id);
      if (participant) {
        participant.isHandRaised = isHandRaised;
        io.to(participant.sessionId).emit('hand-raised', {
          id: socket.id,
          userName: participant.userName,
          isHandRaised
        });
      }
    });

    // Lower hand (Teacher or Self)
    socket.on('lower-hand', ({ targetId }) => {
      const participant = participants.get(targetId);
      if (participant) {
        participant.isHandRaised = false;
        io.to(participant.sessionId).emit('hand-raised', {
          id: targetId,
          userName: participant.userName,
          isHandRaised: false
        });
      }
    });

    // PDF Sync Events (Teacher only)
    socket.on('pdf-change', ({ sessionId, pdfState }) => {
      const participant = participants.get(socket.id);
      if (participant && participant.isTeacher) {
        const session = sessions.get(sessionId);
        if (session) {
          session.pdfState = pdfState;
        }
        socket.to(sessionId).emit('pdf-sync', pdfState);
      }
    });

    socket.on('pdf-page-change', ({ sessionId, page }) => {
      const participant = participants.get(socket.id);
      if (participant && participant.isTeacher) {
        const session = sessions.get(sessionId);
        if (session && session.pdfState) {
          session.pdfState.currentPage = page;
        }
        socket.to(sessionId).emit('pdf-page-sync', { page });
      }
    });

    socket.on('pdf-zoom-change', ({ sessionId, zoom }) => {
      const participant = participants.get(socket.id);
      if (participant && participant.isTeacher) {
        const session = sessions.get(sessionId);
        if (session && session.pdfState) {
          session.pdfState.zoom = zoom;
        }
        socket.to(sessionId).emit('pdf-zoom-sync', { zoom });
      }
    });

    // Whiteboard drawing events (Teacher only)
    socket.on('whiteboard-draw', ({ sessionId, event }) => {
      const participant = participants.get(socket.id);
      if (participant && participant.isTeacher) {
        // Store the stroke in session for late joiners
        let session = sessions.get(sessionId);
        if (!session) {
          session = { whiteboardStrokes: [] };
          sessions.set(sessionId, session);
        }
        if (!session.whiteboardStrokes) {
          session.whiteboardStrokes = [];
        }
        session.whiteboardStrokes.push(event);

        // Broadcast to all other participants in the room
        socket.to(sessionId).emit('whiteboard-draw', event);
      }
    });

    // Whiteboard clear (Teacher only)
    socket.on('whiteboard-clear', ({ sessionId, pageIndex }) => {
      const participant = participants.get(socket.id);
      if (participant && participant.isTeacher) {
        // Clear stored strokes
        const session = sessions.get(sessionId);
        if (session && session.whiteboardStrokes) {
          if (pageIndex !== undefined) {
            session.whiteboardStrokes = session.whiteboardStrokes.filter(s => s.pageIndex !== undefined && s.pageIndex !== pageIndex);
          } else {
            session.whiteboardStrokes = [];
          }
        }

        socket.to(sessionId).emit('whiteboard-clear', { pageIndex });
      }
    });

    // Disconnect
    socket.on('disconnect', () => {
      console.log('🔌 Disconnected:', socket.id);

      // Check if was in waiting room
      const waitingStudent = waitingRoom.get(socket.id);
      if (waitingStudent) {
        waitingRoom.delete(socket.id);
        io.to(waitingStudent.sessionId).emit('waiting-student-left', {
          id: socket.id
        });
        console.log(`⏳ Waiting student ${waitingStudent.userName} disconnected`);
        return;
      }

      // Check if was a participant
      const participant = participants.get(socket.id);
      if (participant) {
        console.log(`👋 Participant disconnected: ${participant.userName} (${socket.id})`);
        socket.to(participant.sessionId).emit('user-left', {
          id: socket.id,
          userName: participant.userName
        });
        participants.delete(socket.id);

        // Also check if was in waiting room (edge case)
        if (waitingRoom.has(socket.id)) {
          waitingRoom.delete(socket.id);
        }
      }
    });

    // Request Sync (Recover state)
    socket.on('request-sync', ({ sessionId }) => {
      const participant = participants.get(socket.id);
      if (!participant || participant.sessionId !== sessionId) return;

      console.log(`🔄 Sync requested by ${participant.userName}`);

      // Send current participants
      const roomParticipants = Array.from(participants.values())
        .filter(p => p.sessionId === sessionId && p.id !== socket.id && p.isApproved);
      socket.emit('existing-participants', roomParticipants);

      // Send PDF state
      const session = sessions.get(sessionId);
      if (session) {
        if (session.pdfState) {
          socket.emit('pdf-sync', session.pdfState);
        }
        if (session.focusMode) {
          socket.emit('focus-mode-sync', { enabled: session.focusMode });
        }
        if (session.whiteboardStrokes && session.whiteboardStrokes.length > 0) {
          socket.emit('whiteboard-sync', session.whiteboardStrokes);
        }
      }

      // Sync Chat History
      socket.emit('chat-history', chatMessages);
    });

    // Reconnection handling
    socket.on('reconnect-request', ({ sessionId, userName, isTeacher }) => {
      console.log(`🔄 Reconnection request from ${userName}`);
      socket.emit('reconnect-approved');
      socket.join(sessionId);

      const participant = {
        id: socket.id,
        userName,
        isTeacher,
        sessionId,
        isMuted: false,
        isCameraOff: false,
        isHandRaised: false,
        isApproved: true,
      };

      participants.set(socket.id, participant);

      socket.to(sessionId).emit('user-reconnected', {
        id: socket.id,
        userName,
        isTeacher
      });

      // Sync Chat History
      socket.emit('chat-history', chatMessages);
    });
  });

  // Import localtunnel handled at the top conditionally

  // ... (existing code) ...

  httpServer
    .once('error', (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, async () => {
      console.log(`🚀 DeryaHoca Live running at http://${hostname}:${port}`);
    });
});

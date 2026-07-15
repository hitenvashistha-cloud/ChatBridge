const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');
const uploadRoutes = require('./routes/uploadRoutes');
const path = require('path');
const profileRoutes = require('./routes/profileRoutes');


dotenv.config();

const app = express();
app.use(cors({
  origin: "https://chatbridgee.netlify.app",
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}));
app.use(express.json());

const authRoutes = require('./routes/authRoutes');
const messageRoutes = require('./routes/messageRoutes');
const userRoutes = require('./routes/userRoutes');
const translateRoutes = require('./routes/translateRoutes');

app.use('/api/profile', profileRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/api/auth', authRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/users', userRoutes);
app.use('/api/translate', translateRoutes);

const server = http.createServer(app);

const io = socketIo(server, {
  cors: {
    origin: "https://chatbridgee.netlify.app",
    methods: ["GET", "POST"],
    credentials: true
  }
});


const onlineUsers = new Set();


io.use((socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Authentication error'));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = decoded.id;
    next();
  } catch (error) {
    console.error('Socket auth error:', error);
    next(new Error('Authentication error'));
  }
});

io.on('connection', (socket) => {
  console.log('User connected:', socket.userId);

  if (socket.userId) {
    onlineUsers.add(socket.userId);
    console.log('Online users:', [...onlineUsers]);
  }
  
  io.emit('getOnlineUsers', [...onlineUsers]);

  socket.on('sendMessage', async (data) => {
    try {
      const { receiverId, text } = data;
      const senderId = socket.userId;

      const Message = require('./models/Message');
      const message = new Message({
        senderId,
        receiverId,
        text
      });
      await message.save();

      const receiverSocket = [...io.sockets.sockets].find(
        ([id, socket]) => socket.userId === receiverId
      );

      if (receiverSocket) {
        const [, receiverSocketInstance] = receiverSocket;
        receiverSocketInstance.emit('receiveMessage', {
          senderId,
          text,
          createdAt: message.createdAt
        });
      }

      socket.emit('messageSent', {
        message,
        receiverId
      });

    } catch (error) {
      console.error('Message error:', error);
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.userId);
    if (socket.userId) {
      onlineUsers.delete(socket.userId);
      console.log('Online users:', [...onlineUsers]);
    }
    io.emit('getOnlineUsers', [...onlineUsers]);
  });
});

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log(' MongoDB Connected Successfully'))
  .catch(err => console.log('MongoDB Connection Error:', err));

app.get('/', (req, res) => {
  res.send('ChatVerse API is running!');
});

const PORT = process.env.PORT || 5001;
server.listen(PORT, () => {
  console.log(` Server running on port ${PORT}`);
});
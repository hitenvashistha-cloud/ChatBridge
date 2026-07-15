import { createContext, useContext, useEffect, useState } from 'react';
import io from 'socket.io-client';

const SocketContext = createContext();

export const useSocket = () => {
  return useContext(SocketContext);
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user'));

    console.log('SocketProvider - Token:', token);
    console.log('SocketProvider - User:', user);

    if (!token || !user) {
      console.log('No token or user, skipping socket connection');
      return;
    }

    const socketInstance = io('https://chatbridge-api-88rl.onrender.com', {
      auth: {
        token: token
      },
      query: {
        userId: user.id
      }
    });

    setSocket(socketInstance);

    socketInstance.on('connect', () => {
      console.log('Socket connected successfully');
      console.log('Socket ID:', socketInstance.id);
    });

    socketInstance.on('getOnlineUsers', (users) => {
      console.log('Online users received:', users);
      setOnlineUsers(users);
    });

    socketInstance.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });

    socketInstance.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
    });

    return () => {
      console.log('Cleaning up socket...');
      socketInstance.disconnect();
      setSocket(null);
    };
  }, []);

  return (
    <SocketContext.Provider value={{ socket, onlineUsers }}>
      {children}
    </SocketContext.Provider>
  );
};
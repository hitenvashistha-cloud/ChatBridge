import { useState, useEffect, useRef } from 'react';
import { useSocket } from '../context/SocketContext';
import { useTheme } from '../context/ThemeContext';
import axios from 'axios';
import { 
  FaSignOutAlt, FaPaperPlane, 
  FaImage, FaUserCircle,
  FaSearch, FaMoon, FaSun,
  FaFile, FaTimes, FaCheck,
  FaCamera, FaSpinner
} from 'react-icons/fa';

const getAvatarColor = (name) => {
  const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
    '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
    '#F8C471', '#82E0AA', '#F1948A', '#85929E', '#73C6B6'
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

const getInitials = (name) => {
  return name.charAt(0).toUpperCase();
};

const ChatPage = () => {
  const user = JSON.parse(localStorage.getItem('user'));
  const { socket, onlineUsers } = useSocket();
  const { darkMode, toggleDarkMode } = useTheme();
  
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [translating, setTranslating] = useState(false);
  const [translatedMessages, setTranslatedMessages] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [profileUploading, setProfileUploading] = useState(false);
  const [currentUser, setCurrentUser] = useState(user);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const profileInputRef = useRef(null);
  const token = localStorage.getItem('token');


  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await axios.get('https://chatbridge-api-88rl.onrender.com/api/profile/me', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        setCurrentUser(response.data);
        localStorage.setItem('user', JSON.stringify(response.data));
      } catch (error) {
        console.error('Error fetching profile:', error);
      }
    };
    fetchProfile();
  }, [token]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await axios.get('https://chatbridge-api-88rl.onrender.com/api/users', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        setUsers(response.data);
      } catch (error) {
        console.error('Error fetching users:', error);
      }
    };
    fetchUsers();
  }, [token]);

  useEffect(() => {
    if (selectedUser) {
      const fetchMessages = async () => {
        setLoading(true);
        try {
          const response = await axios.get(`https://chatbridge-api-88rl.onrender.com/api/messages/${selectedUser._id}`, {
            headers: {
              Authorization: `Bearer ${token}`
            }
          });
          setMessages(response.data);
          setTranslatedMessages({});
        } catch (error) {
          console.error('Error fetching messages:', error);
        } finally {
          setLoading(false);
        }
      };
      fetchMessages();
    }
  }, [selectedUser, token]);

  useEffect(() => {
    if (socket) {
      socket.on('receiveMessage', (message) => {
        if (selectedUser && message.senderId === selectedUser._id) {
          setMessages(prev => [...prev, { ...message, _id: Date.now() }]);
        }
      });

      return () => {
        socket.off('receiveMessage');
      };
    }
  }, [socket, selectedUser]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedUser) return;

    const messageData = {
      receiverId: selectedUser._id,
      text: newMessage
    };

    if (socket) {
      socket.emit('sendMessage', messageData);
    }

    const tempMessage = {
      _id: Date.now(),
      senderId: user.id,
      receiverId: selectedUser._id,
      text: newMessage,
      createdAt: new Date().toISOString()
    };
    setMessages(prev => [...prev, tempMessage]);
    setNewMessage('');
  };

  const translateMessage = async (messageId, text, targetLang = 'en') => {
    if (translatedMessages[messageId]) {
      setTranslatedMessages(prev => {
        const newState = { ...prev };
        delete newState[messageId];
        return newState;
      });
      return;
    }

    setTranslating(true);
    try {
      const response = await axios.post(
        'https://chatbridge-api-88rl.onrender.com/api/translate',
        {
          text: text,
          targetLanguage: targetLang
        }
      );

      if (response.data && response.data.translatedText) {
        setTranslatedMessages(prev => ({
          ...prev,
          [messageId]: response.data.translatedText
        }));
      }
    } catch (error) {
      console.error('Translation error:', error);
    } finally {
      setTranslating(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !selectedUser) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB');
      return;
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      alert('Only images and PDF files are allowed');
      return;
    }

    setUploading(true);
    setSelectedFile(file);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post('https://chatbridge-api-88rl.onrender.com/api/upload', formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      const fileType = file.type.startsWith('image/') ? '📷' : '📎';
      const messageText = `${fileType} ${file.name}`;
      
      const messageData = {
        receiverId: selectedUser._id,
        text: messageText,
        fileUrl: response.data.fileUrl
      };

      if (socket) {
        socket.emit('sendMessage', messageData);
      }

      const tempMessage = {
        _id: Date.now(),
        senderId: user.id,
        receiverId: selectedUser._id,
        text: messageText,
        fileUrl: response.data.fileUrl,
        createdAt: new Date().toISOString()
      };
      setMessages(prev => [...prev, tempMessage]);

    } catch (error) {
      console.error('Upload error:', error);
      alert('File upload failed. Please try again.');
    } finally {
      setUploading(false);
      setSelectedFile(null);
      fileInputRef.current.value = '';
    }
  };

  const handleProfileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert('Profile picture must be less than 2MB');
      return;
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      alert('Only images are allowed (JPEG, PNG, GIF, WebP)');
      return;
    }

    setProfileUploading(true);
    const formData = new FormData();
    formData.append('profilePic', file);

    try {
      const response = await axios.post('https://chatbridge-api-88rl.onrender.com/api/upload', formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      setCurrentUser(prev => ({ ...prev, profilePic: response.data.profilePic }));
      localStorage.setItem('user', JSON.stringify({ ...currentUser, profilePic: response.data.profilePic }));
      
      const usersResponse = await axios.get('https://chatbridge-api-88rl.onrender.com/api/users', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setUsers(usersResponse.data);

    } catch (error) {
      console.error('Profile upload error:', error);
      alert('Failed to upload profile picture');
    } finally {
      setProfileUploading(false);
      profileInputRef.current.value = '';
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  const isUserOnline = (userId) => {
    return onlineUsers.includes(userId);
  };

  const filteredUsers = users.filter(u => 
    u._id !== user.id && 
    u.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getUserAvatar = (userData) => {
    if (userData?.profilePic) {
      return `https://chatbridge-api-88rl.onrender.com${userData.profilePic}`;
    }
    return null;
  };

  return (
    <div className="h-screen flex flex-col bg-[#e5ddd5] dark:bg-dark-bg transition-colors duration-300">
    
      <div className="bg-[#075e54] text-white p-3 flex justify-between items-center shadow-md">
        <div className="flex items-center gap-3">
        
          <div className="relative group">
            <input
              type="file"
              ref={profileInputRef}
              onChange={handleProfileUpload}
              className="hidden"
              accept="image/*"
            />
            {currentUser?.profilePic ? (
              <img
                src={`https://chatbridge-api-88rl.onrender.com${currentUser.profilePic}`}
                alt="Profile"
                className="w-10 h-10 rounded-full object-cover border-2 border-white/30"
              />
            ) : (
              <div 
                className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-lg"
                style={{ backgroundColor: getAvatarColor(currentUser?.username || 'U') }}
              >
                {getInitials(currentUser?.username || 'U')}
              </div>
            )}
            <button
              onClick={() => profileInputRef.current?.click()}
              disabled={profileUploading}
              className="absolute -bottom-1 -right-1 bg-[#25d366] p-1 rounded-full shadow-lg hover:bg-[#1da85e] transition disabled:opacity-50"
              title="Change profile picture"
            >
              {profileUploading ? (
                <FaSpinner className="w-3 h-3 text-white animate-spin" />
              ) : (
                <FaCamera className="w-3 h-3 text-white" />
              )}
            </button>
          </div>
          <h1 className="text-lg font-medium">ChatVerse</h1>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={toggleDarkMode}
            className="p-2 rounded-full hover:bg-white/20 transition"
          >
            {darkMode ? <FaSun /> : <FaMoon />}
          </button>
          <button
            onClick={handleLogout}
            className="p-2 rounded-full hover:bg-white/20 transition"
          >
            <FaSignOutAlt />
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
       
        <div className="w-[30%] bg-white dark:bg-dark-surface border-r border-gray-200 dark:border-dark-border flex flex-col transition-colors duration-300">
         
          <div className="p-3 border-b border-gray-200 dark:border-dark-border flex items-center gap-3">
            {currentUser?.profilePic ? (
              <img
                src={`https://chatbridge-api-88rl.onrender.com${currentUser.profilePic}`}
                alt="Profile"
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <div 
                className="avatar"
                style={{ backgroundColor: getAvatarColor(currentUser?.username || 'U') }}
              >
                {getInitials(currentUser?.username || 'U')}
              </div>
            )}
            <span className="font-medium text-gray-800 dark:text-dark-text">{currentUser?.username}</span>
          </div>

        
          <div className="p-2 border-b border-gray-200 dark:border-dark-border">
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search contacts..."
                className="w-full pl-9 pr-3 py-2 bg-gray-100 dark:bg-dark-surface2 rounded-lg text-sm focus:outline-none dark:text-dark-text dark:placeholder-gray-500"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {filteredUsers.length === 0 ? (
              <div className="p-4 text-center text-gray-500 dark:text-gray-400 text-sm">
                No contacts found
              </div>
            ) : (
              filteredUsers.map((u) => {
                const online = isUserOnline(u._id);
                
                return (
                  <div
                    key={u._id}
                    onClick={() => setSelectedUser(u)}
                    className={`contact-item px-3 py-2 cursor-pointer border-b border-gray-100 dark:border-dark-border flex items-center gap-3 ${
                      selectedUser?._id === u._id ? 'active' : ''
                    }`}
                  >
                    <div className="relative">
                      {u.profilePic ? (
                        <img
                          src={`https://chatbridge-api-88rl.onrender.com${u.profilePic}`}
                          alt={u.username}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div 
                          className="avatar"
                          style={{ backgroundColor: getAvatarColor(u.username) }}
                        >
                          {getInitials(u.username)}
                        </div>
                      )}
                      {online && (
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-[#25d366] border-2 border-white dark:border-dark-surface rounded-full status-dot"></div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-gray-800 dark:text-dark-text truncate">
                          {u.username}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs ${online ? 'text-[#25d366]' : 'text-gray-400'}`}>
                          {online ? 'Online' : 'Offline'}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="flex-1 flex flex-col chat-bg dark:bg-dark-bg transition-colors duration-300">
          {selectedUser ? (
            <>
           
              <div className="bg-white dark:bg-dark-surface p-3 border-b border-gray-200 dark:border-dark-border flex items-center gap-3 shadow-sm transition-colors duration-300">
                {selectedUser.profilePic ? (
                  <img
                    src={`https://chatbridge-api-88rl.onrender.com${selectedUser.profilePic}`}
                    alt={selectedUser.username}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                ) : (
                  <div 
                    className="avatar avatar-lg"
                    style={{ backgroundColor: getAvatarColor(selectedUser.username) }}
                  >
                    {getInitials(selectedUser.username)}
                  </div>
                )}
                <div>
                  <span className="font-medium text-gray-800 dark:text-dark-text">
                    {selectedUser.username}
                  </span>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {isUserOnline(selectedUser._id) ? 'Online' : 'Offline'}
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {loading ? (
                  <div className="flex justify-center items-center h-full text-gray-500 dark:text-gray-400">
                    Loading messages...
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex flex-col justify-center items-center h-full text-gray-500 dark:text-gray-400">
                    <FaUserCircle className="text-5xl mb-3 opacity-50" />
                    <p className="text-sm">No messages yet</p>
                    <p className="text-xs">Send a message to start chatting</p>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isOwn = msg.senderId === user.id;
                    const translated = translatedMessages[msg._id];
                    const showTranslate = !isOwn && msg.text && msg.text.length > 0;
                    
                    return (
                      <div
                        key={msg._id}
                        className={`flex ${isOwn ? 'justify-end' : 'justify-start'} message-bubble`}
                      >
                        <div className="max-w-[70%]">
                          <div
                            className={`px-3 py-2 ${
                              isOwn
                                ? 'message-sent text-gray-800'
                                : 'message-received text-gray-800 dark:text-dark-text shadow-sm'
                            }`}
                          >
                            {msg.fileUrl ? (
                              <div>
                                {msg.fileUrl.match(/\.(jpeg|jpg|gif|png|webp)$/i) ? (
                                  <img 
                                    src={msg.fileUrl} 
                                    alt="Shared" 
                                    className="max-w-full max-h-60 rounded-lg cursor-pointer"
                                    onClick={() => window.open(msg.fileUrl)}
                                  />
                                ) : (
                                  <a 
                                    href={msg.fileUrl} 
                                    target="_blank" 
                                    rel="noopener noreferrer" 
                                    className="text-blue-600 dark:text-blue-400 underline flex items-center gap-2"
                                  >
                                    <FaFile />
                                    {msg.text.replace(/^📎\s*/, '')}
                                  </a>
                                )}
                              </div>
                            ) : (
                              <p className="text-sm break-words">{translated || msg.text}</p>
                            )}
                            {translated && !msg.fileUrl && (
                              <p className="text-[10px] opacity-60 mt-1">
                                Original: {msg.text}
                              </p>
                            )}
                            <span className="text-[10px] opacity-60 mt-1 block text-right">
                              {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          
                          {showTranslate && !msg.fileUrl && (
                            <button
                              onClick={() => translateMessage(msg._id, msg.text, 'en')}
                              disabled={translating}
                              className="text-xs text-[#075e54] hover:text-[#054740] mt-1 ml-1 transition-colors"
                            >
                              {translated ? 'Show Original' : 'Translate to English'}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

             
              <form onSubmit={handleSendMessage} className="bg-[#f0f0f0] dark:bg-dark-surface p-3 flex items-center gap-2 transition-colors duration-300">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  className="hidden"
                  accept="image/*,application/pdf"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-dark-border transition text-gray-600 dark:text-gray-400 disabled:opacity-50"
                >
                  <FaImage className="text-xl" />
                </button>

                {selectedFile && (
                  <div className="flex items-center gap-2 bg-white dark:bg-dark-surface2 px-3 py-1 rounded-full text-sm">
                    <span className="text-gray-600 dark:text-gray-300 truncate max-w-[100px]">
                      {selectedFile.name}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedFile(null);
                        fileInputRef.current.value = '';
                      }}
                      className="text-red-500 hover:text-red-600"
                    >
                      <FaTimes />
                    </button>
                  </div>
                )}

                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message"
                  className="flex-1 px-4 py-2 bg-white dark:bg-dark-surface2 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-[#25d366] dark:text-dark-text dark:placeholder-gray-500"
                  disabled={uploading}
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim() && !selectedFile}
                  className="btn-send w-11 h-11 rounded-full flex items-center justify-center text-white disabled:opacity-50"
                >
                  {uploading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <FaPaperPlane className="text-lg" />
                  )}
                </button>
              </form>
            </>
          ) : (
            <div className="flex flex-col justify-center items-center h-full text-gray-500 dark:text-gray-400">
              <div className="w-20 h-20 bg-gray-200 dark:bg-dark-surface rounded-full flex items-center justify-center mb-4">
                <FaUserCircle className="text-5xl opacity-50" />
              </div>
              <p className="text-lg font-medium">ChatVerse</p>
              <p className="text-sm">Select a contact to start chatting</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
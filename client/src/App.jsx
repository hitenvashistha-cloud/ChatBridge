import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ChatPage from './pages/ChatPage';
import { SocketProvider } from './context/SocketContext';
import { ThemeProvider } from './context/ThemeContext';

function App() {
  const token = localStorage.getItem('token');
  const isAuthenticated = token && token !== 'undefined' && token !== 'null' && token.length > 0;

  return (
    <ThemeProvider>
      <SocketProvider>
        <Router>
          <div className="min-h-screen app-shell bg-transparent transition-colors duration-300">
            <Routes>
              <Route 
                path="/login" 
                element={isAuthenticated ? <Navigate to="/chat" replace /> : <LoginPage />} 
              />
              <Route 
                path="/register" 
                element={isAuthenticated ? <Navigate to="/chat" replace /> : <RegisterPage />} 
              />
              <Route 
                path="/chat" 
                element={isAuthenticated ? <ChatPage /> : <Navigate to="/login" replace />} 
              />
              <Route 
                path="/" 
                element={<Navigate to={isAuthenticated ? "/chat" : "/login"} replace />} 
              />
            </Routes>
          </div>
        </Router>
      </SocketProvider>
    </ThemeProvider>
  );
}

export default App;
import { useState } from 'react';
import axios from 'axios';
import { FaEnvelope, FaLock, FaSignInAlt, FaComments } from 'react-icons/fa';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await axios.post('https://chatbridge-api-88rl.onrender.com/api/auth/login', {
        email,
        password
      });

      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        window.location.href = '/chat';
      } else {
        setError('No token received from server');
      }
      
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center gradient-bg p-4 relative overflow-hidden">
    
      <div className="absolute top-20 left-20 w-32 h-32 bg-white/10 rounded-full float-shape"></div>
      <div className="absolute bottom-20 right-20 w-48 h-48 bg-white/5 rounded-full float-shape-delayed"></div>
      <div className="absolute top-1/2 left-10 w-16 h-16 bg-white/10 rounded-full float-shape"></div>
      <div className="absolute bottom-1/3 right-10 w-24 h-24 bg-white/5 rounded-full float-shape-delayed"></div>

      
      <div className="glass w-full max-w-md p-8 rounded-2xl shadow-2xl relative z-10">
        <div className="text-center mb-8">
          <div className="hero-icon w-20 h-20 mx-auto rounded-2xl flex items-center justify-center shadow-lg mb-4 glow">
            <FaComments className="text-3xl text-white" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-1">
            Welcome Back
          </h2>
          <p className="text-white/70 text-sm">
            Sign in to continue your conversation
          </p>
        </div>
        
        {error && (
          <div className="bg-red-500/20 border border-red-400/30 text-red-200 px-4 py-3 rounded-xl mb-4 text-sm backdrop-blur">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-white/80 font-medium mb-2 text-sm">
              Email Address
            </label>
            <div className="relative">
              <FaEnvelope className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white/90 border border-white/20 rounded-xl input-creative text-gray-800 placeholder-gray-500 focus:outline-none focus:border-[#25d366]"
                placeholder="Enter your email"
                required
              />
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-white/80 font-medium mb-2 text-sm">
              Password
            </label>
            <div className="relative">
              <FaLock className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white/90 border border-white/20 rounded-xl input-creative text-gray-800 placeholder-gray-500 focus:outline-none focus:border-[#25d366]"
                placeholder="Enter your password"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-creative w-full py-3 rounded-xl font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <div className="loading-dots">
                <span></span>
                <span></span>
                <span></span>
              </div>
            ) : (
              <>
                <FaSignInAlt />
                Sign In
              </>
            )}
          </button>
        </form>

        <p className="text-center text-white/70 mt-6 text-sm">
          Don't have an account? 
          <a
            href="/register"
            className="text-white font-medium hover:underline ml-1 transition-colors"
          >
            Create one
          </a>
        </p>

        <div className="mt-6 text-center text-white/30 text-xs">
          Secure &bull; Private &bull; Real-time
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
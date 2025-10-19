import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Sparkles } from 'lucide-react';
import axios from 'axios';
import LoadingScreen from './components/LoadingScreen';

const API_BASE_URL = process.env.REACT_APP_API_URL || `${window.location.protocol}//${window.location.hostname}:8080`;

function Login({ onLogin, onSwitchToSignup }) {
  const [username, setUsername] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim()) {
      setError('Please enter a username');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await axios.get(`${API_BASE_URL}/api/users`);
      const existingUser = response.data.find(user => user.username === username);
      
      if (existingUser) {
        // Simulate loading for better UX
        await new Promise(resolve => setTimeout(resolve, 1500));
        onLogin(existingUser);
      } else {
        setError('User not found. Please sign up first.');
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0">
        <motion.div 
          className="absolute top-10 sm:top-20 left-10 sm:left-20 w-48 sm:w-72 h-48 sm:h-72 bg-purple-500/20 rounded-full blur-3xl"
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3]
          }}
          transition={{ duration: 4, repeat: Infinity }}
        />
        <motion.div 
          className="absolute bottom-10 sm:bottom-20 right-10 sm:right-20 w-64 sm:w-96 h-64 sm:h-96 bg-pink-500/20 rounded-full blur-3xl"
          animate={{ 
            scale: [1.2, 1, 1.2],
            opacity: [0.2, 0.4, 0.2]
          }}
          transition={{ duration: 5, repeat: Infinity }}
        />
      </div>

      <motion.div 
        className="bg-white/10 backdrop-blur-2xl rounded-2xl sm:rounded-3xl shadow-2xl p-6 sm:p-8 w-full max-w-sm sm:max-w-md border border-white/20 relative z-10"
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <motion.div 
          className="text-center mb-6 sm:mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
        >
          <motion.div 
            className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-4 sm:mb-6 shadow-2xl"
            whileHover={{ scale: 1.05, rotate: 5 }}
            whileTap={{ scale: 0.95 }}
          >
            <Sparkles className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
          </motion.div>
          <h1 className="text-2xl sm:text-4xl font-bold text-white mb-2">Welcome Back</h1>
          <p className="text-purple-200 text-sm sm:text-base">Sign in to continue your AI conversations</p>
        </motion.div>

        <motion.form 
          onSubmit={handleSubmit} 
          className="space-y-4 sm:space-y-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.6 }}
        >
          <div className="relative">
            <User className="absolute left-3 sm:left-4 top-3 sm:top-4 w-4 h-4 sm:w-5 sm:h-5 text-purple-300" />
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-3 sm:py-4 bg-white/10 border border-white/20 rounded-xl sm:rounded-2xl text-white placeholder-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all duration-300 backdrop-blur-sm text-sm sm:text-base"
              placeholder="Enter your username"
              disabled={isLoading}
            />
          </div>

          {error && (
            <motion.div 
              className="bg-red-500/20 border border-red-400/30 rounded-2xl p-4 text-red-200 text-sm backdrop-blur-sm"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              {error}
            </motion.div>
          )}

          <motion.button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 sm:py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-gray-600 disabled:to-gray-700 text-white rounded-xl sm:rounded-2xl font-semibold transition-all duration-300 disabled:cursor-not-allowed shadow-lg text-sm sm:text-base"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Sign In
          </motion.button>
        </motion.form>

        <motion.div 
          className="mt-6 sm:mt-8 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.6 }}
        >
          <p className="text-purple-200 text-sm sm:text-base">
            Don't have an account?{' '}
            <button
              onClick={onSwitchToSignup}
              className="text-pink-300 hover:text-pink-200 font-semibold transition-colors duration-300 hover:underline"
            >
              Sign Up
            </button>
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}

export default Login;
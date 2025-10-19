import React, { useState } from 'react';
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || `${window.location.protocol}//${window.location.hostname}:8080`;

function Signup({ onSignup, onSwitchToLogin }) {
  const [formData, setFormData] = useState({
    username: '',
    displayName: '',
    avatar: '👤'
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const avatars = ['👤', '👨', '👩', '🧑', '👦', '👧', '🤖', '🐱', '🐶', '🦊'];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.username.trim() || !formData.displayName.trim()) return;
    
    setLoading(true);
    setError('');
    
    try {
      const response = await axios.post(`${API_BASE_URL}/api/users`, formData);
      onSignup(response.data);
    } catch (error) {
      if (error.response?.status === 500) {
        setError('Username already exists. Please choose a different one.');
      } else {
        setError('Signup failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const updateFormData = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 p-4 py-6 overflow-y-auto" style={{minHeight: '100vh'}}>
      <div className="w-full max-w-sm mx-auto bg-white/10 backdrop-blur-2xl rounded-2xl shadow-2xl p-5 border border-white/20">
        <div className="text-center mb-5">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-indigo-600 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white mb-1">Create Account</h1>
          <p className="text-blue-200 text-base">Join GenBot today</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="block text-white font-semibold text-sm">Username</label>
            <input
              type="text"
              value={formData.username}
              onChange={(e) => updateFormData('username', e.target.value)}
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent backdrop-blur-sm transition-all text-sm"
              placeholder="Enter username"
              required
            />
          </div>
          
          <div className="space-y-1">
            <label className="block text-white font-semibold text-sm">Display Name</label>
            <input
              type="text"
              value={formData.displayName}
              onChange={(e) => updateFormData('displayName', e.target.value)}
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent backdrop-blur-sm transition-all text-sm"
              placeholder="Enter display name"
              required
            />
          </div>
          
          <div className="space-y-2">
            <label className="block text-white font-semibold text-sm">Choose Avatar</label>
            <div className="grid grid-cols-5 gap-2">
              {avatars.map(emoji => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => updateFormData('avatar', emoji)}
                  className={`p-2 rounded-lg text-lg transition-all duration-200 hover:scale-105 ${
                    formData.avatar === emoji 
                      ? 'bg-blue-500/30 border-2 border-blue-400 shadow-lg shadow-blue-500/25' 
                      : 'bg-white/10 border border-white/20 hover:bg-white/20 hover:border-white/30'
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
          
          {error && (
            <div className="text-red-300 text-sm bg-red-500/20 p-3 rounded-xl border border-red-500/30 backdrop-blur-sm">
              {error}
            </div>
          )}
          
          <button
            type="submit"
            disabled={loading || !formData.username.trim() || !formData.displayName.trim()}
            className="w-full py-3 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 disabled:from-gray-500 disabled:to-gray-600 text-white rounded-lg font-semibold text-base transition-all duration-200 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98]"
          >
            {loading ? (
              <div className="flex items-center justify-center gap-2">
                <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Creating Account...
              </div>
            ) : (
              'Create Account'
            )}
          </button>
        </form>
        
        <div className="mt-5 text-center">
          <p className="text-white/70 text-sm">
            Already have an account?{' '}
            <button
              onClick={onSwitchToLogin}
              className="text-blue-300 hover:text-blue-200 font-semibold transition-colors"
            >
              Sign in
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Signup;
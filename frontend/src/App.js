import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Paperclip, Menu, Search, Sun, Moon, Plus } from 'lucide-react';
import axios from 'axios';
import MessageFormatter from './MessageFormatter';
import Login from './Login';
import Signup from './Signup';
import './App.css';

// Use environment variable or fallback to current host
const API_BASE_URL = process.env.REACT_APP_API_URL || `${window.location.protocol}//${window.location.hostname}:8080`;

function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [typingText, setTypingText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [sessions, setSessions] = useState([]);
  const [currentSession, setCurrentSession] = useState(null);
  const [showSidebar, setShowSidebar] = useState(false);
  const [editingSession, setEditingSession] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [authMode, setAuthMode] = useState('login'); // 'login' or 'signup'
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [responseLimit, setResponseLimit] = useState(2000);
  const [showSettings, setShowSettings] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [editingMessage, setEditingMessage] = useState(null);
  const [editText, setEditText] = useState('');
  const [regeneratingMessage, setRegeneratingMessage] = useState(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [generatingImagePrompt, setGeneratingImagePrompt] = useState('');
  const [aiThinking, setAiThinking] = useState(false);
  const [thinkingMessage, setThinkingMessage] = useState('');
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const fileInputRef = useRef(null);

  const Logo = () => (
    <div className="flex items-center gap-2">
      <img src="/logo.svg" alt="GenBot" className="w-8 h-8" />
      <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
        GenBot
      </span>
    </div>
  );

  useEffect(() => {
    // Check if user is stored in localStorage
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      const user = JSON.parse(storedUser);
      setCurrentUser(user);
      setIsAuthenticated(true);
    }
  }, []);
  
  useEffect(() => {
    if (currentUser) {
      fetchSessions();
    }
  }, [currentUser]);
  
  useEffect(() => {
    if (currentSession) {
      fetchMessages(currentSession.id);
    }
  }, [currentSession]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, typingText, isTyping]);

  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  };

  const handleLogin = (user) => {
    setCurrentUser(user);
    setIsAuthenticated(true);
    localStorage.setItem('currentUser', JSON.stringify(user));
  };
  
  const handleSignup = (user) => {
    setCurrentUser(user);
    setIsAuthenticated(true);
    localStorage.setItem('currentUser', JSON.stringify(user));
  };
  
  const handleLogout = () => {
    setCurrentUser(null);
    setIsAuthenticated(false);
    setCurrentSession(null);
    setSessions([]);
    setMessages([]);
    localStorage.removeItem('currentUser');
  };
  
  const fetchSessions = async () => {
    if (!currentUser) return;
    try {
      const response = await axios.get(`${API_BASE_URL}/api/users/${currentUser.id}/sessions`);
      setSessions(response.data);
    } catch (error) {
      console.error('Error fetching sessions:', error);
    }
  };
  
  const fetchMessages = async (sessionId) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/sessions/${sessionId}/messages`);
      setMessages(response.data);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading || !currentUser) return;
    
    if (!currentSession) {
      await createNewSession();
      return;
    }

    await sendMessageToSession(currentSession.id);
  };
  
  const sendMessageToSession = async (sessionId) => {
    const messageContent = input;
    
    const userMessage = { content: messageContent, sender: 'user', timestamp: new Date(), parentMessageId: replyingTo?.id };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setReplyingTo(null);
    
    // Show AI thinking indicator
    const thinkingMessages = [
      'Analyzing your question...',
      'Processing information...',
      'Thinking about this...',
      'Gathering thoughts...',
      'Formulating response...'
    ];
    const randomThinking = thinkingMessages[Math.floor(Math.random() * thinkingMessages.length)];
    setThinkingMessage(randomThinking);
    setAiThinking(true);
    setIsLoading(true);

    try {
      const payload = {
        content: messageContent,
        maxTokens: responseLimit
      };
      
      if (replyingTo) {
        payload.parentMessageId = replyingTo.id;
      }
      
      const response = await axios.post(`${API_BASE_URL}/api/sessions/${sessionId}/messages`, payload);
      
      // Stop thinking, start typing
      setAiThinking(false);
      
      // Type the bot response with animation
      typeMessage(response.data.content, () => {
        setMessages(prev => [...prev, response.data]);
      });
      
      if (currentUser) fetchSessions(); // Refresh sessions to update timestamps
    } catch (error) {
      console.error('Error sending message:', error);
      setAiThinking(false);
      setMessages(prev => [...prev, { 
        content: 'Sorry, something went wrong. Please try again.', 
        sender: 'bot', 
        timestamp: new Date() 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const createNewSession = async () => {
    if (!currentUser) return;
    const title = input.slice(0, 50) || 'New Chat';
    try {
      const response = await axios.post(`${API_BASE_URL}/api/users/${currentUser.id}/sessions`, { title });
      const newSession = response.data;
      setSessions(prev => [newSession, ...prev]);
      setCurrentSession(newSession);
      setMessages([]);
      // Now send the message or generate image
      if (input.trim()) {
        if (isGeneratingImage) {
          await generateImageForSession(newSession.id);
        } else {
          await sendMessageToSession(newSession.id);
        }
      }
    } catch (error) {
      console.error('Error creating session:', error);
    }
  };
  
  const selectSession = (session) => {
    setCurrentSession(session);
    setShowSidebar(false);
  };
  
  const deleteSession = async (sessionId) => {
    try {
      await axios.delete(`${API_BASE_URL}/api/sessions/${sessionId}`);
      setSessions(prev => prev.filter(s => s.id !== sessionId));
      if (currentSession?.id === sessionId) {
        setCurrentSession(null);
        setMessages([]);
      }
    } catch (error) {
      console.error('Error deleting session:', error);
    }
  };
  
  const clearChat = () => {
    setCurrentSession(null);
    setMessages([]);
    setReplyingTo(null);
    setInput('');
    setEditingMessage(null);
    setRegeneratingMessage(null);
  };
  
  const handleReply = (message) => {
    setReplyingTo(message);
  };
  
  const cancelReply = () => {
    setReplyingTo(null);
  };
  
  const handleSearch = async (query) => {
    if (!query.trim() || !currentUser) {
      setSearchResults([]);
      return;
    }
    
    setIsSearching(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/api/users/${currentUser.id}/search?q=${encodeURIComponent(query)}`);
      setSearchResults(response.data);
    } catch (error) {
      console.error('Error searching messages:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };
  
  const selectSearchResult = (result) => {
    const session = sessions.find(s => s.id === result.sessionId);
    if (session) {
      selectSession(session);
      setShowSearch(false);
      setSearchQuery('');
      setSearchResults([]);
    }
  };
  
  const handleEditMessage = (message) => {
    setEditingMessage(message);
    setEditText(message.content);
  };
  
  const saveEditedMessage = async () => {
    if (!editText.trim() || !editingMessage) return;
    
    setMessages(prev => prev.map(msg => 
      msg.id === editingMessage.id ? {...msg, content: editText} : msg
    ));
    
    setEditingMessage(null);
    setEditText('');
    
    if (editingMessage.sender === 'user') {
      await regenerateResponse(editingMessage, editText);
    }
  };
  
  const cancelEditMessage = () => {
    setEditingMessage(null);
    setEditText('');
  };
  
  const regenerateResponse = async (userMessage, newContent = null) => {
    if (!currentSession) return;
    
    setRegeneratingMessage(userMessage);
    
    try {
      const content = newContent || userMessage.content;
      const response = await axios.post(`${API_BASE_URL}/api/sessions/${currentSession.id}/messages`, {
        content: content,
        maxTokens: responseLimit
      });
      
      setMessages(prev => {
        const userIndex = prev.findIndex(msg => msg.id === userMessage.id);
        if (userIndex !== -1 && userIndex + 1 < prev.length && prev[userIndex + 1].sender === 'bot') {
          const newMessages = [...prev];
          newMessages[userIndex + 1] = response.data;
          return newMessages;
        } else {
          return [...prev, response.data];
        }
      });
      
      if (currentUser) fetchSessions();
    } catch (error) {
      console.error('Error regenerating response:', error);
    } finally {
      setRegeneratingMessage(null);
    }
  };

  const copyMessage = (content) => {
    navigator.clipboard.writeText(content);
  };
  
  const exportChat = () => {
    if (!currentSession || messages.length === 0) {
      alert('No messages to export');
      return;
    }
    
    const chatData = {
      sessionTitle: currentSession.title,
      user: currentUser.displayName,
      exportDate: new Date().toLocaleString(),
      messageCount: messages.filter(m => !m.content.includes('📎 File:')).length,
      messages: messages.filter(m => !m.content.includes('📎 File:'))
    };
    
    let exportText = `GenBot Chat Export\n`;
    exportText += `Session: ${chatData.sessionTitle}\n`;
    exportText += `User: ${chatData.user}\n`;
    exportText += `Exported: ${chatData.exportDate}\n`;
    exportText += `Messages: ${chatData.messageCount}\n`;
    exportText += `${'='.repeat(50)}\n\n`;
    
    chatData.messages.forEach((message, index) => {
      const timestamp = new Date(message.timestamp).toLocaleString();
      const sender = message.sender === 'user' ? chatData.user : 'GenBot AI';
      const content = message.content.replace(/!\[.*?\]\(data:image\/[^)]+\)/g, '[Generated Image]');
      
      exportText += `[${timestamp}] ${sender}:\n${content}\n\n`;
    });
    
    const blob = new Blob([exportText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${currentSession.title.replace(/[^a-z0-9]/gi, '_')}_chat_export.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };
  
  const handleImageGeneration = async () => {
    console.log('=== IMAGE GENERATION CLICKED ===');
    console.log('Input:', input);
    console.log('Current session:', currentSession?.id);
    
    if (!input.trim() || isLoading || !currentUser) {
      console.log('Validation failed - input:', !!input.trim(), 'loading:', isLoading, 'user:', !!currentUser);
      return;
    }
    
    setIsGeneratingImage(true);
    
    if (!currentSession) {
      console.log('No session, creating new one...');
      await createNewSession();
      setIsGeneratingImage(false);
      return;
    }
    
    console.log('Calling generateImageForSession...');
    await generateImageForSession(currentSession.id);
    setIsGeneratingImage(false);
  };
  
  const generateImageForSession = async (sessionId) => {
    const prompt = input;
    console.log('Generating image with prompt:', prompt);
    console.log('Session ID:', sessionId);
    console.log('API URL:', `${API_BASE_URL}/api/sessions/${sessionId}/generate-image`);
    
    setGeneratingImagePrompt(prompt);
    setInput('');
    setIsLoading(true);
    
    try {
      const response = await axios.post(`${API_BASE_URL}/api/sessions/${sessionId}/generate-image`, { prompt });
      console.log('Image generation response:', response.data);
      
      // Refresh messages to get the new messages from backend
      await fetchMessages(sessionId);
      
      if (currentUser) fetchSessions();
    } catch (error) {
      console.error('Error generating image:', error);
      console.error('Error details:', error.response?.data);
      console.error('Error status:', error.response?.status);
      setMessages(prev => [...prev, {
        content: 'Sorry, failed to generate image. Please try again.',
        sender: 'bot',
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
      setGeneratingImagePrompt('');
    }
  };
  
  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    console.log('File upload triggered:', { file: !!file, session: !!currentSession });
    
    if (!file) {
      console.log('No file selected');
      return;
    }
    
    // If no session exists, create one first
    let sessionToUse = currentSession;
    if (!sessionToUse) {
      console.log('No current session, creating new session first');
      try {
        const response = await axios.post(`${API_BASE_URL}/api/users/${currentUser.id}/sessions`, { 
          title: `File: ${file.name}` 
        });
        sessionToUse = response.data;
        setCurrentSession(sessionToUse);
        setSessions(prev => [sessionToUse, ...prev]);
        console.log('Created new session:', sessionToUse.id);
      } catch (error) {
        console.error('Error creating session:', error);
        alert('Failed to create session for file upload');
        return;
      }
    }
    
    console.log('File details:', {
      name: file.name,
      type: file.type,
      size: file.size,
      lastModified: file.lastModified
    });
    
    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ];
    
    if (!allowedTypes.includes(file.type)) {
      alert(`Please upload PDF, DOCX, or TXT files only.\nCurrent type: ${file.type}`);
      return;
    }
    
    setUploadingFile(true);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      console.log('Sending file to:', `${API_BASE_URL}/api/sessions/${sessionToUse.id}/upload`);
      console.log('FormData created with file:', file.name);
      
      const response = await axios.post(
        `${API_BASE_URL}/api/sessions/${sessionToUse.id}/upload`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          },
          timeout: 30000 // 30 second timeout
        }
      );
      
      console.log('Upload response:', response.data);
      
      // Refresh messages to get the new messages
      await fetchMessages(sessionToUse.id);
      await fetchSessions();
      
    } catch (error) {
      console.error('File upload error:', error);
      console.error('Error response:', error.response);
      console.error('Error message:', error.message);
      
      let errorMessage = 'Unknown error occurred';
      if (error.response) {
        errorMessage = error.response.data || `Server error: ${error.response.status}`;
      } else if (error.request) {
        errorMessage = 'No response from server. Check if backend is running.';
      } else {
        errorMessage = error.message;
      }
      
      alert(`Error uploading file: ${errorMessage}`);
    } finally {
      setUploadingFile(false);
      if (event.target) {
        event.target.value = '';
      }
    }
  };
  
  const typeMessage = (text, callback) => {
    setIsTyping(true);
    setTypingText('');
    const words = text.split(' ');
    let index = 0;
    
    const typeWord = () => {
      if (index < words.length) {
        setTypingText(prev => prev + (index > 0 ? ' ' : '') + words[index]);
        index++;
        setTimeout(typeWord, 100);
      } else {
        setIsTyping(false);
        callback();
      }
    };
    
    typeWord();
  };
  
  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };
  
  const toggleSidebar = () => {
    setShowSidebar(!showSidebar);
  };
  
  const startEditSession = (session) => {
    setEditingSession(session.id);
    setEditTitle(session.title);
  };
  
  const saveSessionTitle = async (sessionId) => {
    try {
      await axios.put(`${API_BASE_URL}/api/sessions/${sessionId}`, { title: editTitle });
      setSessions(prev => prev.map(s => s.id === sessionId ? {...s, title: editTitle} : s));
      setEditingSession(null);
    } catch (error) {
      console.error('Error updating session:', error);
    }
  };
  
  const cancelEdit = () => {
    setEditingSession(null);
    setEditTitle('');
  };
  

  


  if (!isAuthenticated) {
    return authMode === 'login' ? (
      <Login 
        onLogin={handleLogin} 
        onSwitchToSignup={() => setAuthMode('signup')} 
      />
    ) : (
      <Signup 
        onSignup={handleSignup} 
        onSwitchToLogin={() => setAuthMode('login')} 
      />
    );
  }

  return (
    <div className={`${darkMode ? 'dark' : ''}`}>
      <div className="flex h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-blue-900 dark:to-indigo-900 overflow-hidden">
        {showSidebar && <div className="fixed inset-0 bg-black/50 backdrop-blur-md z-40" onClick={() => setShowSidebar(false)} />}
        
        <div className={`fixed w-full sm:w-80 max-w-sm h-full bg-gray-50 dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col z-50 transform transition-all duration-300 ease-out ${showSidebar ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Chats</h2>
              <button 
                onClick={() => setShowSidebar(false)}
                className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors text-gray-500 dark:text-gray-400"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="mb-4 p-3 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <div className="text-2xl bg-blue-100 dark:bg-blue-900 p-2 rounded-lg">{currentUser.avatar}</div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-900 dark:text-white truncate">{currentUser.displayName}</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400 truncate">@{currentUser.username}</div>
                </div>
                <button 
                  onClick={handleLogout}
                  className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors text-red-500 dark:text-red-400"
                  title="Logout"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </button>
              </div>
            </div>
            <button 
              onClick={createNewSession}
              className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New Chat
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
            {sessions.map(session => (
              <div key={session.id} className={`group flex items-center p-4 mb-3 rounded-2xl cursor-pointer transition-all duration-300 hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 dark:hover:from-purple-900/30 dark:hover:to-pink-900/30 hover:shadow-lg hover:scale-105 ${currentSession?.id === session.id ? 'bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/50 dark:to-pink-900/50 border-l-4 border-purple-500 shadow-lg scale-105' : ''}`}>
                {editingSession === session.id ? (
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && saveSessionTitle(session.id)}
                    onBlur={() => saveSessionTitle(session.id)}
                    className="flex-1 bg-transparent border border-navy-600 rounded-lg px-2 py-1 text-sm text-matte-900 dark:text-matte-100 outline-none focus:border-navy-700 focus:ring-1 focus:ring-navy-600"
                    autoFocus
                  />
                ) : (
                  <div 
                    onClick={() => selectSession(session)} 
                    className="flex-1 text-sm font-medium text-slate-800 dark:text-white truncate"
                  >
                    {session.title}
                  </div>
                )}
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300">
                  <button 
                    onClick={() => startEditSession(session)} 
                    className="p-2 hover:bg-purple-200 dark:hover:bg-purple-700/50 rounded-xl transition-all duration-300 text-purple-600 dark:text-purple-400 hover:scale-110"
                    title="Rename session"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button 
                    onClick={() => deleteSession(session.id)} 
                    className="p-2 hover:bg-red-100 dark:hover:bg-red-900/40 rounded-xl transition-all duration-300 text-red-500 dark:text-red-400 hover:scale-110"
                    title="Delete session"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="flex-1 flex flex-col">
          <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 p-3 sm:p-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                <button 
                  onClick={toggleSidebar} 
                  className="p-1.5 sm:p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors text-gray-600 dark:text-gray-400" 
                  title="Chat Sessions"
                >
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1 sm:gap-2">
                    <span className="text-lg sm:text-xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
                      GenBot
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 truncate">
                    {currentSession ? `${messages.filter(m => !m.content.includes('📎 File:')).length} messages` : 'Start a new conversation'}
                  </p>
                </div>
              </div>
              <div className="flex gap-0.5 sm:gap-1 flex-shrink-0">
                <button 
                  onClick={() => setShowSearch(!showSearch)} 
                  className="p-1.5 sm:p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors text-gray-600 dark:text-gray-400" 
                  title="Search"
                >
                  <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>
                <button 
                  onClick={exportChat} 
                  disabled={!currentSession || messages.filter(m => !m.content.includes('📎 File:')).length === 0}
                  className="p-1.5 sm:p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors text-gray-600 dark:text-gray-400 disabled:opacity-50 disabled:cursor-not-allowed" 
                  title="Export Chat"
                >
                  <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-4-4m4 4l4-4m-6 8h8a2 2 0 002-2V7a2 2 0 00-2-2H8a2 2 0 00-2 2v11a2 2 0 002 2z" />
                  </svg>
                </button>
                <button 
                  onClick={toggleDarkMode} 
                  className="p-1.5 sm:p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors text-gray-600 dark:text-gray-400" 
                  title="Theme"
                >
                  {darkMode ? (
                    <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  ) : (
                    <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                    </svg>
                  )}
                </button>
                <button 
                  onClick={clearChat} 
                  className="p-1.5 sm:p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors text-gray-600 dark:text-gray-400" 
                  title="New Chat"
                >
                  <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
          
          {showSearch && (
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/30 dark:to-pink-900/30 border-b border-purple-200 dark:border-purple-700/50 p-6 shadow-lg">
              <div className="max-w-4xl mx-auto">
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        handleSearch(e.target.value);
                      }}
                      placeholder="Search messages..."
                      className="w-full px-6 py-4 pl-12 border-2 border-purple-200 dark:border-purple-700/50 rounded-2xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl text-slate-800 dark:text-white focus:outline-none focus:ring-4 focus:ring-purple-300 focus:border-purple-400 transition-all duration-300 shadow-lg"
                    />
                    <svg className="w-5 h-5 absolute left-4 top-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <button
                    onClick={() => {
                      setShowSearch(false);
                      setSearchQuery('');
                      setSearchResults([]);
                    }}
                    className="p-3 hover:bg-red-100 dark:hover:bg-red-900/40 rounded-2xl transition-all duration-300 text-red-500 hover:scale-110"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                {searchResults.length > 0 && (
                  <div className="max-h-60 overflow-y-auto space-y-3">
                    {searchResults.map(result => (
                      <div
                        key={result.id}
                        onClick={() => selectSearchResult(result)}
                        className="p-4 bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl rounded-2xl border border-purple-200 dark:border-purple-700/50 cursor-pointer hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 dark:hover:from-purple-900/40 dark:hover:to-pink-900/40 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-sm text-purple-600 dark:text-purple-400 font-bold">{result.sessionTitle}</span>
                          <span className="text-xs text-purple-500 dark:text-purple-400">{formatTimestamp(result.timestamp)}</span>
                        </div>
                        <div className="text-sm text-slate-800 dark:text-white truncate">
                          <span className="font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">{result.sender === 'user' ? 'You' : 'AI'}:</span> {result.content}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {isSearching && (
                  <div className="text-center py-8">
                    <svg className="w-8 h-8 animate-spin mx-auto text-purple-600" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  </div>
                )}
                {searchQuery && !isSearching && searchResults.length === 0 && (
                  <div className="text-center py-8 text-purple-600 dark:text-purple-400 font-medium">
                    No messages found for "{searchQuery}"
                  </div>
                )}
              </div>
            </div>
          )}
          
          {showSettings && (
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/30 dark:to-pink-900/30 border-b border-purple-200 dark:border-purple-700/50 p-6 shadow-lg">
              <div className="max-w-4xl mx-auto">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">Response Length</h3>
                  <span className="text-sm text-purple-600 dark:text-purple-400 font-bold bg-purple-100 dark:bg-purple-900/50 px-3 py-1 rounded-full">{responseLimit} tokens</span>
                </div>
                <div className="flex items-center gap-6">
                  <span className="text-sm text-purple-600 dark:text-purple-400 font-medium">Short</span>
                  <input
                    type="range"
                    min="500"
                    max="4000"
                    step="250"
                    value={responseLimit}
                    onChange={(e) => setResponseLimit(parseInt(e.target.value))}
                    className="flex-1 h-3 bg-gradient-to-r from-purple-200 to-pink-200 dark:from-purple-800 dark:to-pink-800 rounded-full appearance-none cursor-pointer slider"
                  />
                  <span className="text-sm text-purple-600 dark:text-purple-400 font-medium">Long</span>
                </div>
                <div className="flex justify-between text-sm text-purple-500 dark:text-purple-400 mt-3 font-medium">
                  <span>Quick answers</span>
                  <span>Detailed responses</span>
                </div>
              </div>
            </div>
          )}
        
          <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4 sm:p-8 custom-scrollbar bg-gray-50/50 dark:bg-transparent" style={{scrollBehavior: 'smooth'}}>
            <div className="max-w-4xl mx-auto">
              <AnimatePresence>
                {messages.filter(message => !message.content.includes('📎 File:')).length === 0 && !currentSession && (
                  <motion.div 
                    className="text-center mt-20"
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -50 }}
                    transition={{ duration: 0.6 }}
                  >
                    <motion.div 
                      className="w-24 h-24 bg-gradient-to-br from-blue-500 via-purple-500 to-indigo-500 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-2xl"
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ delay: 0.2, duration: 0.8, type: "spring" }}
                      whileHover={{ scale: 1.1, rotate: 5 }}
                    >
                      <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </motion.div>
                    <motion.h2 
                      className="text-3xl sm:text-4xl font-bold text-gray-800 dark:text-white mb-12 px-4"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4, duration: 0.6 }}
                    >
                      Hello {currentUser.displayName}! How can I help you today?
                    </motion.h2>
                    <motion.div 
                      className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 max-w-4xl mx-auto px-4"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.6, duration: 0.6 }}
                    >
                      {[
                        { icon: '🔬', text: 'Explain quantum computing', prompt: 'Explain quantum computing' },
                        { icon: '🐍', text: 'Write a Python function', prompt: 'Write a Python function' },
                        { icon: '😄', text: 'Tell me a joke', prompt: 'Tell me a joke' }
                      ].map((item, index) => (
                        <motion.button 
                          key={index}
                          onClick={() => setInput(item.prompt)}
                          className="p-6 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl hover:bg-white/90 dark:hover:bg-gray-800/90 rounded-2xl text-gray-800 dark:text-white transition-all duration-300 text-left border border-gray-200 dark:border-gray-700 shadow-lg hover:shadow-xl group"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.8 + index * 0.1, duration: 0.5 }}
                          whileHover={{ scale: 1.05, y: -5 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <div className="text-3xl mb-3 group-hover:scale-110 transition-transform duration-300">{item.icon}</div>
                          <div className="font-semibold text-lg">{item.text}</div>
                        </motion.button>
                      ))}
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
          
              {messages.filter(message => !message.content.includes('📎 File:')).map((message, index) => {
                const isReply = message.parentMessageId;
                return (
                <div key={index} className={`flex mb-4 sm:mb-6 ${message.sender === 'user' ? 'justify-end' : 'justify-start'} ${isReply ? 'ml-6 sm:ml-12' : ''}`}>
                  {isReply && (
                    <div className="w-1 bg-gradient-to-b from-purple-400 to-pink-400 mr-4 flex-shrink-0 rounded-full"></div>
                  )}
                  <div className={`flex gap-3 max-w-full ${message.sender === 'user' ? 'flex-row-reverse' : ''}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm flex-shrink-0 ${message.sender === 'user' ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200' : 'bg-gray-600 dark:bg-gray-500 text-white'}`}>
                      {message.sender === 'user' ? (
                        <span className="text-lg">{currentUser.avatar}</span>
                      ) : (
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M13 10V3L4 14h7v7l9-11h-7z"/>
                        </svg>
                      )}
                    </div>
                    <div className={`flex flex-col gap-2 min-w-0 flex-1 ${message.sender === 'user' ? 'items-end' : 'items-start'}`}>
                      <div className={`group relative px-4 py-3 rounded-2xl text-sm leading-relaxed break-words max-w-md sm:max-w-2xl lg:max-w-4xl shadow-md ${message.sender === 'user' 
                        ? 'bg-blue-600 text-white ml-auto border border-blue-700' 
                        : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-700'
                      }`}>
                        {editingMessage?.id === message.id ? (
                          <div className="space-y-2">
                            <textarea
                              value={editText}
                              onChange={(e) => setEditText(e.target.value)}
                              className="w-full p-2 border border-matte-400 dark:border-matte-600 rounded-lg bg-white dark:bg-matte-700 text-matte-900 dark:text-matte-100 resize-none"
                              rows={3}
                              autoFocus
                            />
                            <div className="flex gap-2">
                              <button
                                onClick={saveEditedMessage}
                                className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs"
                              >
                                Save
                              </button>
                              <button
                                onClick={cancelEditMessage}
                                className="px-3 py-1 bg-matte-400 hover:bg-matte-500 text-white rounded text-xs"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : message.sender === 'user' ? (
                          <div className="whitespace-pre-wrap message-content break-words">{message.content}</div>
                        ) : (
                          <div className="message-content overflow-hidden">
                            <MessageFormatter content={message.content} darkMode={darkMode} />
                          </div>
                        )}
                        {!editingMessage && (
                          <div className="absolute -top-8 right-0 opacity-0 group-hover:opacity-100 flex gap-1 transition-all duration-200 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-1 border border-gray-200 dark:border-gray-600">
                            <button 
                              onClick={() => handleReply(message)} 
                              className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                              title="Reply to message"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                              </svg>
                            </button>
                            {message.sender === 'user' && (
                              <>
                                <button 
                                  onClick={() => handleEditMessage(message)} 
                                  className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-gray-600 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 transition-colors"
                                  title="Edit message"
                                >
                                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                  </svg>
                                </button>
                                <button 
                                  onClick={() => regenerateResponse(message)} 
                                  disabled={regeneratingMessage?.id === message.id}
                                  className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors disabled:opacity-50"
                                  title="Regenerate response"
                                >
                                  {regeneratingMessage?.id === message.id ? (
                                    <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                  ) : (
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                    </svg>
                                  )}
                                </button>
                              </>
                            )}
                            {message.sender === 'bot' && (
                              <button 
                                onClick={() => copyMessage(message.content)} 
                                className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-gray-600 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 transition-colors"
                                title="Copy message"
                              >
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 002 2v8a2 2 0 002 2z" />
                                </svg>
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 px-2 font-medium">
                        {formatTimestamp(message.timestamp)}
                      </div>
                    </div>
                  </div>
                </div>
                );
              })}
          
              {isTyping && (
                <div className="flex mb-4 sm:mb-6 justify-start">
                  <div className="flex gap-3 max-w-[95%] sm:max-w-[85%]">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-violet-500 via-purple-500 to-indigo-500 flex items-center justify-center text-white text-sm flex-shrink-0 shadow-lg animate-pulse">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M13 10V3L4 14h7v7l9-11h-7z"/>
                      </svg>
                    </div>
                    <div className="flex flex-col gap-2 min-w-0 flex-1 items-start">
                      <div className="px-4 py-3 sm:px-6 sm:py-4 bg-white/90 dark:bg-slate-800/90 text-slate-800 dark:text-white border border-purple-200 dark:border-purple-700/50 rounded-3xl rounded-bl-lg min-h-[20px] shadow-lg text-sm leading-relaxed overflow-hidden backdrop-blur-xl">
                        <MessageFormatter content={typingText} darkMode={darkMode} />
                        <span className="animate-blink text-purple-600 font-bold ml-1">|</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {isLoading && !isTyping && (
                <div className="flex mb-4 sm:mb-6 justify-start">
                  <div className="flex gap-3 max-w-[95%] sm:max-w-[85%]">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-violet-500 via-purple-500 to-indigo-500 flex items-center justify-center text-white text-sm flex-shrink-0 shadow-lg animate-pulse">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M13 10V3L4 14h7v7l9-11h-7z"/>
                      </svg>
                    </div>
                    <div className="flex flex-col gap-2 min-w-0 flex-1 items-start">
                      <div className="px-4 py-3 sm:px-6 sm:py-4 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-3xl rounded-bl-lg shadow-md backdrop-blur-xl">
                        {generatingImagePrompt ? (
                          <div className="flex items-center gap-3">
                            <svg className="w-6 h-6 text-purple-600 animate-spin" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 714 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <div>
                              <div className="text-purple-600 font-semibold">🎨 Generating image...</div>
                              <div className="text-sm text-gray-600 dark:text-gray-400">"{generatingImagePrompt}"</div>
                            </div>
                          </div>
                        ) : aiThinking ? (
                          <div className="flex items-center gap-3">
                            <div className="flex gap-1">
                              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                            </div>
                            <span className="text-blue-600 dark:text-blue-400 font-medium text-sm">{thinkingMessage}</span>
                          </div>
                        ) : (
                          <div className="flex gap-2">
                            <span className="w-3 h-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full animate-typing"></span>
                            <span className="w-3 h-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full animate-typing" style={{animationDelay: '0.16s'}}></span>
                            <span className="w-3 h-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full animate-typing" style={{animationDelay: '0.32s'}}></span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
          
              <div ref={messagesEndRef} />
            </div>
          </div>
          
          <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
            <div className="max-w-4xl mx-auto">
              {replyingTo && (
                <div className="mb-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border-l-4 border-blue-500">
                  <div className="flex justify-between items-start">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-blue-600 dark:text-blue-400 mb-1 font-medium">Replying to:</div>
                      <div className="text-sm text-gray-700 dark:text-gray-300 truncate">
                        {replyingTo.content.slice(0, 100)}{replyingTo.content.length > 100 ? '...' : ''}
                      </div>
                    </div>
                    <button
                      onClick={cancelReply}
                      className="ml-2 p-1 hover:bg-red-100 dark:hover:bg-red-900/20 rounded text-red-500 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              )}
              <div className="flex gap-3 items-end">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept=".pdf,.docx,.txt"
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingFile}
                  className={`p-2 rounded-lg transition-colors ${
                    uploadingFile 
                      ? 'bg-gray-200 dark:bg-gray-700 text-gray-500 cursor-not-allowed'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400'
                  }`}
                  title={uploadingFile ? 'Uploading...' : 'Upload File'}
                >
                  {uploadingFile ? (
                    <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                    </svg>
                  )}
                </button>
                <button
                  onClick={handleImageGeneration}
                  disabled={!input.trim() || isLoading}
                  className="p-2 rounded-lg transition-colors hover:bg-purple-100 dark:hover:bg-purple-800 text-purple-600 dark:text-purple-400 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Generate Image"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </button>
                <div className="flex-1 relative">
                  <textarea
                    value={input}
                    onChange={(e) => {
                      setInput(e.target.value);
                      e.target.style.height = 'auto';
                      e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
                    }}
                    onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), sendMessage())}
                    placeholder="Type a message..."
                    rows="1"
                    disabled={isLoading}
                    className="w-full resize-none border border-gray-300 dark:border-gray-600 rounded-lg px-3 sm:px-4 py-2 sm:py-3 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                  />
                </div>
                <button 
                  onClick={sendMessage} 
                  disabled={(!input.trim() && !uploadingFile) || isLoading}
                  className="p-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 dark:disabled:bg-gray-600 text-white rounded-lg flex items-center justify-center transition-colors disabled:cursor-not-allowed"
                >
                  {isLoading || uploadingFile ? (
                    <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
        

      </div>
    </div>
  );
}

export default App;
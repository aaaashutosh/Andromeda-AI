import React, { useState, useEffect, useRef } from 'react';
import { Send, PlusCircle, Menu, Moon, Sun, MessageSquare, Settings, LogOut, LogIn, Loader, X } from 'lucide-react';
import './App.css';
import logo from './assets/logo.svg';
import aiAvatar from './assets/aiavatar.png';
import { useAuth0 } from "@auth0/auth0-react";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// Login button component
const LoginButton = () => {
  const { loginWithRedirect } = useAuth0();
  return (
    <button className="auth-button" onClick={() => loginWithRedirect()}>
      <LogIn size={14} />
      <span>Log In</span>
    </button>
  );
};

// Logout button component
const LogoutButton = () => {
  const { logout } = useAuth0();
  return (
    <button className="auth-button" onClick={() => logout({ returnTo: window.location.origin })}>
      <LogOut size={14} />
      <span>Logout</span>
    </button>
  );
};

function App() {
  const { isAuthenticated, user } = useAuth0();

  const [darkMode, setDarkMode] = useState(() => {
    const savedMode = localStorage.getItem('darkMode');
    return savedMode ? JSON.parse(savedMode) : window.matchMedia('(prefers-color-scheme: dark)').matches;
  });
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [currentConversation, setCurrentConversation] = useState('');
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [showSettings, setShowSettings] = useState(false);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const sidebarRef = useRef(null);
  
  // Helper function to create personalized welcome message
  const getWelcomeMessage = () => {
    if (isAuthenticated && user?.name) {
      return `Welcome to Andromeda AI, ${user.name}. This is an advanced AI assistant designed to help with information, tasks, and conversations. Start by asking any question or requesting assistance.`;
    }
    return 'Welcome to Andromeda AI. This is an advanced AI assistant designed to help with information, tasks, and conversations. Start by asking any question or requesting assistance.';
  };

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      if (!mobile) setSidebarOpen(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
    if (darkMode) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
  }, [darkMode]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [conversations, currentConversation]);

  useEffect(() => {
    if (inputRef.current) inputRef.current.focus();
  }, [currentConversation]);
  
  // Create initial conversation when the component mounts or when user authentication changes
  useEffect(() => {
    // Create a new conversation but without any welcome message
    const newId = `chat-${Date.now()}`;
    
    const newConv = {
      id: newId,
      title: 'New Chat',
      messages: [] // Empty messages array - no chat message to start
    };
    
    setConversations([newConv]);
    setCurrentConversation(newId);
  }, [isAuthenticated, user?.name]);

  useEffect(() => {
    const adjustHeight = () => {
      if (inputRef.current) {
        inputRef.current.style.height = 'auto';
        inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 150)}px`;
      }
    };
    adjustHeight();
    const textArea = inputRef.current;
    if (textArea) {
      textArea.addEventListener('input', adjustHeight);
      return () => textArea.removeEventListener('input', adjustHeight);
    }
  }, [input]);

  // Handle clicks outside of sidebar to close it on mobile
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target) && 
          isMobile && sidebarOpen && !event.target.closest('.sidebar-toggle')) {
        setSidebarOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMobile, sidebarOpen]);

  const getCurrentMessages = () => {
    const conversation = conversations.find(c => c.id === currentConversation);
    return conversation?.messages || [];
  };

  // Generate a title from the user's first message
  const generateChatTitle = (message) => {
    // Create a title from the first 30 characters of the message
    const rawTitle = message.trim();
    return rawTitle.length > 30 
      ? `${rawTitle.substring(0, 30)}...` 
      : rawTitle;
  };

  const createNewConversation = () => {
    const newId = `chat-${Date.now()}`;
    const welcomeMessage = getWelcomeMessage();
    
    const newConv = {
      id: newId,
      title: `New Chat`,
      messages: [{ type: 'bot', text: welcomeMessage }]
    };
    setConversations(prev => [...prev, newConv]);
    setCurrentConversation(newId);
    setInput('');
    if (isMobile) setSidebarOpen(false);
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = { type: 'user', text: input };
    
    // Check if this is the first user message in the conversation
    const currentConv = conversations.find(conv => conv.id === currentConversation);
    const isFirstUserMessage = currentConv.messages.filter(msg => msg.type === 'user').length === 0;
    
    // Update conversation with user message
    const updatedConversations = conversations.map(conv => {
      if (conv.id === currentConversation) {
        return {
          ...conv,
          // If it's the first user message, update the title
          ...(isFirstUserMessage && { title: generateChatTitle(input) }),
          messages: [...conv.messages, userMessage]
        };
      }
      return conv;
    });

    setConversations(updatedConversations);
    setInput('');
    setLoading(true);

    try {
      await new Promise(resolve => setTimeout(resolve, 1000));

      // API call
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${import.meta.env.VITE_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: input }] }]
          })
        }
      );

      const data = await response.json();
      const botText = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ||
        "I couldn't process that request. Could you try rephrasing?";

      // Update with bot response
      setConversations(prevConvs => prevConvs.map(conv => {
        if (conv.id === currentConversation) {
          return {
            ...conv,
            messages: [...conv.messages, { type: 'bot', text: botText }]
          };
        }
        return conv;
      }));

    } catch (error) {
      console.error('Error calling API:', error);
      setConversations(prevConvs => prevConvs.map(conv => {
        if (conv.id === currentConversation) {
          return {
            ...conv,
            messages: [...conv.messages, {
              type: 'bot',
              text: "Sorry, I encountered an error. Please check your connection and try again."
            }]
          };
        }
        return conv;
      }));
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const toggleSidebar = () => setSidebarOpen(prev => !prev);

  const selectConversation = (id) => {
    setCurrentConversation(id);
    if (inputRef.current) inputRef.current.focus();
    if (isMobile) setSidebarOpen(false);
  };

  const deleteConversation = (id, e) => {
    e.stopPropagation();
    const remaining = conversations.filter(conv => conv.id !== id);
    setConversations(remaining);
    if (id === currentConversation) {
      if (remaining.length > 0) setCurrentConversation(remaining[0].id);
      else createNewConversation();
    }
  };

  // Default avatar for non-authenticated users
  const defaultUserAvatar = 'https://t3.ftcdn.net/jpg/08/05/28/22/360_F_805282248_LHUxw7t2pnQ7x8lFEsS2IZgK8IGFXePS.jpg';
  
  const getUserAvatar = () => {
    return user?.picture || defaultUserAvatar;
  };

  const currentYear = new Date().getFullYear();

  return (
    <div className={`app-container ${darkMode ? 'dark' : 'light'}`}>
      <button 
        className={`sidebar-toggle ${sidebarOpen ? 'active' : ''}`} 
        onClick={toggleSidebar}
        aria-label={sidebarOpen ? "Close sidebar" : "Open sidebar"}
      >
        {sidebarOpen && isMobile ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Overlay for mobile when sidebar is open */}
      {isMobile && sidebarOpen && (
        <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)}></div>
      )}
      
      <div 
        ref={sidebarRef}
        className={`sidebar ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}
      >
        <div className="sidebar-header">
          <img src={logo} alt="Andromeda Logo" className="sidebar-logo" />
          {isMobile && (
            <button 
              className="close-sidebar-btn" 
              onClick={() => setSidebarOpen(false)}
              aria-label="Close sidebar"
            >
              <X size={20} />
            </button>
          )}
        </div>

        <button className="new-chat-btn" onClick={createNewConversation}>
          <PlusCircle size={16} />
          <span>New Chat</span>
        </button>

        <div className="chat-history">
          <h2>Conversations</h2>
          <ul className="chat-list">
            {conversations.map(conv => (
              <li
                key={conv.id}
                className={`chat-item ${currentConversation === conv.id ? 'active' : ''}`}
                onClick={() => selectConversation(conv.id)}
              >
                <div className="chat-item-content">
                  <MessageSquare size={16} />
                  <span className="chat-title">{conv.title}</span>
                </div>
                {conversations.length > 1 && (
                  <button
                    className="delete-chat"
                    onClick={(e) => deleteConversation(conv.id, e)}
                    aria-label="Delete conversation"
                  >
                    &times;
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>

        <div className="sidebar-footer">
          <button className="settings-btn" onClick={() => setShowSettings(!showSettings)}>
            <Settings size={16} />
            <span>Settings</span>
          </button>

          {showSettings && (
            <div className="settings-dropdown">
              {isAuthenticated ? <LogoutButton /> : <LoginButton />}
            </div>
          )}

          <button className="mode-toggle" onClick={() => setDarkMode(prev => !prev)}>
            {darkMode ? <Sun size={16} /> : <Moon size={16} />}
            <span>{darkMode ? 'Light Mode' : 'Dark Mode'}</span>
          </button>
        </div>
      </div>

      <div className="main-content">
        <div className="chat-header">
          <div className="chat-title">
            <MessageSquare size={18} />
            <span>{conversations.find(c => c.id === currentConversation)?.title || 'Andromeda AI'}</span>
          </div>
          <div className="user-menu">
            <img
              src={getUserAvatar()}
              alt="Profile"
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="profile-pic"
            />
            {userMenuOpen && (
              <div className="dropdown-overlay" onClick={() => setUserMenuOpen(false)}>
                <ul className="dropdown-menu">
                  {isAuthenticated ? (
                    <li><LogoutButton /></li>
                  ) : (
                    <li><LoginButton /></li>
                  )}
                </ul>
              </div>
            )}
          </div>
        </div>

        <div className="chat-window">
          <div className="chat-box">
            {getCurrentMessages().length === 0 ? (
              <div className="welcome-panel">
                <div className="welcome-content">
                  <h2>{isAuthenticated && user?.name ? `Welcome, ${user.name}!` : 'Welcome to Andromeda AI'}</h2>
                  <div className="info-section">
                    <p>Andromeda AI is an advanced artificial intelligence assistant designed to help with information, tasks, and conversations developed by <a href="https://aashutoshkhatiwada.com.np">Aashutosh Khatiwada</a>.</p>
                  </div>
                  <button
                    onClick={() => inputRef.current?.focus()}
                    className="start-chat-btn"
                  >
                    Start
                  </button>
                </div>
              </div>
            ) : (
              <>
                {getCurrentMessages().map((msg, idx) => (
                  <div key={idx} className={`message ${msg.type}`}>
                    <div className="message-avatar">
                      {msg.type === 'bot' ? 
                        <img src={aiAvatar} alt="AI" className="avatar-img" /> : 
                        <img src={getUserAvatar()} alt="User" className="avatar-img" />
                      }
                    </div>
                    <div className="message-content">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {msg.text}
                      </ReactMarkdown>
                    </div>
                  </div>
                ))}
                {loading && (
                  <div className="message bot">
                    <div className="message-avatar">
                      <img src={aiAvatar} alt="AI" className="avatar-img" />
                    </div>
                    <div className="typing-indicator">
                      <span className="dot"></span>
                      <span className="dot"></span>
                      <span className="dot"></span>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          <div className="chat-input">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Type your message here..."
              rows={1}
            />
            <button 
              className="send-btn" 
              onClick={handleSend} 
              disabled={loading}
              aria-label="Send message"
            >
              {loading ? <Loader size={16} className="spinner" /> : <Send size={16} />}
            </button>
          </div>
        </div>
        
        <footer className="app-footer">
          <p>&copy; {currentYear} Andromeda by Aashutosh. All rights reserved.</p>
        </footer>
      </div>
    </div>
  );
}

export default App;
import React, { useState, useRef, useEffect } from 'react';
import { Lightbulb, Send, Loader } from 'lucide-react';
import styles from '../../../styles/ChatInterface.module.css';

const ChatInterface = ({ messages = [], ideaId, insightId, userId, ideaDescription }) => {
  const [chatMessages, setChatMessages] = useState(messages);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages]);

  useEffect(() => {
    setChatMessages(messages);
  }, [messages]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || isLoading) return;

    try {
      setIsLoading(true);
      // Add user message immediately
      const userMessage = {
        content: newMessage,
        sender: 'user'
      };
      setChatMessages(prev => [...prev, userMessage]);
      setNewMessage('');

      const response = await fetch('https://reply-q54hzgyghq-uc.a.run.app', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId,
          insight_id: insightId,
          idea_id: ideaId,
          message: newMessage
        })
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const data = await response.json();

      // Add AI response to chat
      if (data.message) {
        const aiMessage = {
          content: data.message,
          sender: 'ai'
        };
        setChatMessages(prev => [...prev, aiMessage]);
      }

    } catch (error) {
      console.error('Error sending message:', error);
      setChatMessages(prev => [...prev, {
        content: 'Error sending message. Please try again.',
        sender: 'system'
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.glassWrapper}>
    <div className={styles.chatContainer}>
      {/* Idea Card */}
      <div className={styles.ideaCard}>
        <div className={styles.ideaHeader}>
          <div className={styles.ideaIconWrapper}>
            <Lightbulb className={styles.ideaIcon} size={20} />
          </div>
          <span className={styles.ideaLabel}>Idea</span>
        </div>
        <p className={styles.ideaDescription}>
          {ideaDescription || 'No idea description available'}
        </p>
      </div>

      {/* Messages */}
      <div className={styles.messagesContainer}>
        {chatMessages.map((message, index) => (
          <div 
            key={index} 
            className={`${styles.message} ${
              message.sender === 'user' ? styles.userMessage :
              message.sender === 'system' ? styles.systemMessage :
              styles.aiMessage
            }`}
          >
            {message.content}
          </div>
        ))}
        {isLoading && (
          <div className={styles.loadingMessage}>
            <Loader className={styles.loadingIcon} size={20} />
            <span>AI is thinking...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className={styles.inputContainer}>
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Uncover actionable insights for each metric."
          className={styles.input}
          onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
          disabled={isLoading}
        />
        <button 
          onClick={handleSendMessage}
          className={styles.sendButton}
          disabled={!newMessage.trim() || isLoading}
        >
          <Send size={20} />
        </button>
      </div>
    </div>
    </div>
  );
};

export default ChatInterface;
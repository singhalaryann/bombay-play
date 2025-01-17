'use client';
import React, { useState, useRef, useEffect } from 'react';
import { Lightbulb, Send } from 'lucide-react';
import styles from '../../../styles/ChatInterface.module.css';

const ChatInterface = ({ messages = [], ideaId, insightId, userId, ideaDescription }) => {
  const [chatMessages, setChatMessages] = useState(messages);
  const [newMessage, setNewMessage] = useState('');
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
    if (!newMessage.trim()) return;

    try {
      // Add user message immediately for better UX
      const userMessage = {
        content: newMessage,
        sender: 'user'
      };
      setChatMessages(prev => [...prev, userMessage]);
      setNewMessage('');

      console.log('Sending message:', {
        userId,
        insightId,
        ideaId,
        message: newMessage
      });

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
      console.log('Received response:', data);

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
      // Show error in chat
      setChatMessages(prev => [...prev, {
        content: 'Error sending message. Please try again.',
        sender: 'system'
      }]);
    }
  };

  return (
    <div className={styles.container}>
      {/* Idea Card */}
      <div className={styles.ideaCardWrapper}>
        <div className={styles.glassEffect}>
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
        </div>
      </div>

      {/* Chat Interface */}
      <div className={styles.chatWrapper}>
        <div className={styles.glassEffect}>
          <div className={styles.chatContainer}>
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
              <div ref={messagesEndRef} />
            </div>
            <div className={styles.inputContainer}>
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type your message..."
                className={styles.input}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              />
              <button 
                onClick={handleSendMessage}
                className={styles.sendButton}
                disabled={!newMessage.trim()}
              >
                <Send size={20} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
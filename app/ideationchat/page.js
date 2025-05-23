"use client";
import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import styles from "../../styles/IdeationChat.module.css";
import Header from "../components/layout/Header";
import Sidebar from "../components/layout/Sidebar";
import { 
  Send, 
  Loader,
  FileText, 
  X,
  Gamepad2,
  Code,
  Palette
} from 'lucide-react';
import ReactMarkdown from "react-markdown";
import { useAuth } from "../context/AuthContext";

// File item component for displaying uploaded files
const FileItem = ({ file, onRemove }) => (
  <div className={styles.fileItem}>
    <div className={styles.fileContent}>
      <FileText size={16} className={styles.fileIcon} />
      <span className={styles.fileName}>{file.name}</span>
    </div>
    <button className={styles.removeFileBtn} onClick={() => onRemove(file)}>
      <X size={14} />
    </button>
  </div>
);

// Example topic component for welcome screen
const ExampleTopic = ({ icon: Icon, text, color }) => (
  <div className={styles.exampleTopic}>
    <div className={styles.exampleTopicIcon} style={{ backgroundColor: color }}>
      <Icon size={20} />
    </div>
    <span>{text}</span>
  </div>
);

export default function IdeationChat() {
  // State management
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [isFileUploadOpen, setIsFileUploadOpen] = useState(false);
  const [chatThreads, setChatThreads] = useState([]);
  const [threadId, setThreadId] = useState(null);
  const { userId } = useAuth();

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const router = useRouter();

  // Utility to add threadId to storage
  const addThreadIdToStorage = (tid, name = null) => {
    if (!tid) return;
    const stored = JSON.parse(localStorage.getItem('chatThreads') || '[]');
    const newThread = { threadId: tid, name: name || tid };
    if (!stored.some(t => t.threadId === tid)) {
      const updated = [...stored, newThread];
      localStorage.setItem('chatThreads', JSON.stringify(updated));
      setChatThreads(updated);
    } else {
      setChatThreads(stored);
    }
  };

  // Function to handle new chat
  const handleNewChat = async () => {
    try {
      // Create new thread on the server
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'create_thread',
          userId: userId
        })
      });

      if (!response.ok) throw new Error('Failed to create new thread');
      
      const data = await response.json();
      const newThreadId = data.threadId;

      // Update state and storage
      setThreadId(newThreadId);
      setMessages([]);
      localStorage.setItem('threadId', newThreadId);
      addThreadIdToStorage(newThreadId);
      
      // Clear current chat history
      localStorage.removeItem(`chatHistory_${newThreadId}`);
    } catch (error) {
      console.error('Error creating new chat:', error);
    }
  };

  // Function to handle thread selection
  const handleSelectThread = async (tid) => {
    if (!tid) return;
    
    setThreadId(tid);
    localStorage.setItem('threadId', tid);
    
    try {
      // First try to load from localStorage
      const storedChat = localStorage.getItem(`chatHistory_${tid}`);
      if (storedChat) {
        setMessages(JSON.parse(storedChat));
        return;
      }
      
      // If not in localStorage, load from server
      const response = await fetch(`/api/chat?threadId=${tid}&userId=${userId}`);
      if (!response.ok) throw new Error('Failed to load chat');
      
      const data = await response.json();
      if (data.messages) {
        setMessages(data.messages);
        // Save to localStorage for future use
        localStorage.setItem(`chatHistory_${tid}`, JSON.stringify(data.messages));
      }
    } catch (error) {
      console.error('Error loading chat:', error);
    }
  };

  // New function for renaming chats
  const handleRenameChat = (tid, newName) => {
    const stored = JSON.parse(localStorage.getItem('chatThreads') || '[]');
    const updated = stored.map(thread => 
      thread.threadId === tid ? { ...thread, name: newName } : thread
    );
    localStorage.setItem('chatThreads', JSON.stringify(updated));
    setChatThreads(updated);
  };

  // Initial load effect
  useEffect(() => {
    const storedThreads = JSON.parse(localStorage.getItem('chatThreads') || '[]');
    // Convert old format to new format if needed
    const updatedThreads = storedThreads.map(thread => 
      typeof thread === 'string' 
        ? { threadId: thread, name: thread }
        : thread
    );
    setChatThreads(updatedThreads);
    localStorage.setItem('chatThreads', JSON.stringify(updatedThreads));

    const storedThreadId = localStorage.getItem('threadId');
    if (storedThreadId) {
      handleSelectThread(storedThreadId);
    }
  }, []);

  // Message persistence effect
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    
    if (threadId && messages.length > 0) {
      try {
        // Save messages with thread ID
        localStorage.setItem(`chatHistory_${threadId}`, JSON.stringify(messages));
        
        // Also save to server
        fetch('/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'save_messages',
            threadId: threadId,
            userId: userId,
            messages: messages
          })
        }).catch(error => console.error('Error saving messages to server:', error));
      } catch (error) {
        console.error('Failed to save chat history:', error);
      }
    }
  }, [messages, threadId, userId]);

  // File upload handling functions
  const handleFileUploadClick = () => {
    fileInputRef.current.click();
  };

  const handleFileChange = (e) => {
    const newFiles = Array.from(e.target.files);
    setUploadedFiles(prev => [...prev, ...newFiles]);
    setIsFileUploadOpen(true);
  };

  const removeFile = (fileToRemove) => {
    setUploadedFiles(prev => prev.filter(file => file !== fileToRemove));
    if (uploadedFiles.length <= 1) {
      setIsFileUploadOpen(false);
    }
  };

  // Example topics for the welcome screen
  const exampleTopics = [
    { icon: Gamepad2, text: "Gaming", color: "rgba(130, 255, 131, 0.2)" },
    { icon: Code, text: "Development", color: "rgba(120, 144, 255, 0.2)" },
    { icon: Palette, text: "Design", color: "rgba(255, 130, 180, 0.2)" }
  ];

  // FIXED: Enhanced streaming handling with better image processing
  const handleSend = async () => {
    if ((!input.trim() && uploadedFiles.length === 0) || isLoading) return;
    
    const userMessage = input.trim();
    
    // Clear input field and show loading state
    setInput("");
    setIsLoading(true);
    
    // Display user's message in the chat
    setMessages(prev => [...prev, { 
      content: userMessage + (uploadedFiles.length > 0 ? 
        `\n\n*Uploaded ${uploadedFiles.length} file(s): ${uploadedFiles.map(f => f.name).join(', ')}*` : 
        ''), 
      role: "user" 
    }]);

    try {
      // Ensure we have a valid threadId
      let currentThreadId = threadId;
      if (!currentThreadId) {
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'create_thread',
            userId: userId
          })
        });
        
        if (!response.ok) throw new Error('Failed to create new thread');
        const data = await response.json();
        currentThreadId = data.threadId;
        
        // Update state and storage
        setThreadId(currentThreadId);
        localStorage.setItem('threadId', currentThreadId);
        addThreadIdToStorage(currentThreadId);
      }

      // Create FormData instance to handle files
      const formData = new FormData();
      
      // Add the message text
      formData.append('message', userMessage);
      
      // Add userId if needed
      formData.append('userId', userId);
      
      // Add threadId if needed
      formData.append('threadId', currentThreadId);
      
      // Add all files with unique keys
      if (uploadedFiles.length > 0) {
        uploadedFiles.forEach((file, index) => {
          const safeFile = new File([file], file.name, { type: file.type });
          formData.append(`file${index+1}`, safeFile);
        });
      }
      
      // Call API endpoint for streaming response
      const response = await fetch('/api/chat', {
        method: 'POST',
        body: formData,
      });

      // FIXED: Better error handling for non-200 responses
      if (!response.ok && response.status !== 200) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      // Handle streaming response
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullContent = "";
      let images = [];
      let messageIndex = -1; // FIXED: Track which message we're updating

      // Create initial empty assistant message for streaming updates
      setMessages(prev => {
        const newMessages = [...prev, {
          content: "",
          role: "assistant",
          images: []
        }];
        messageIndex = newMessages.length - 1; // Store the index
        return newMessages;
      });

      // FIXED: Enhanced streaming loop with better chunk processing
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter(line => line.trim());

        for (const line of lines) {
          try {
            const data = JSON.parse(line);
            
            // Handle different types of streaming events
            if (data.type === 'text') {
              // FIXED: Append text content for real-time typing effect
              fullContent += data.content;
              
              // Update the specific message at the tracked index
              setMessages(prev => {
                const newMessages = [...prev];
                if (newMessages[messageIndex]) {
                  newMessages[messageIndex] = {
                    ...newMessages[messageIndex],
                    content: fullContent
                  };
                }
                return newMessages;
              });
            } 
            else if (data.type === 'image') {
              // FIXED: Handle image chunks with immediate display
              if (data.content && !images.includes(data.content)) {
                images.push(data.content);
                
                // Update the specific message with new images
                setMessages(prev => {
                  const newMessages = [...prev];
                  if (newMessages[messageIndex]) {
                    newMessages[messageIndex] = {
                      ...newMessages[messageIndex],
                      images: [...images]
                    };
                  }
                  return newMessages;
                });
                
                console.log('📸 Image received and displayed');
              }
            } 
            else if (data.type === 'function_call') {
              // Handle function call notifications (like "Fetching DAU data...")
              fullContent += `\n${data.content}\n`;
              
              // Update the message with function call info
              setMessages(prev => {
                const newMessages = [...prev];
                if (newMessages[messageIndex]) {
                  newMessages[messageIndex] = {
                    ...newMessages[messageIndex],
                    content: fullContent
                  };
                }
                return newMessages;
              });
            } 
            else if (data.type === 'complete') {
              // FIXED: Handle completion with final image check
              console.log('✅ Streaming completed');
              
              // Final update with any remaining images from completion data
              if (data.images && data.images.length > 0) {
                // Merge any additional images from completion
                const allImages = [...new Set([...images, ...data.images])];
                
                setMessages(prev => {
                  const newMessages = [...prev];
                  if (newMessages[messageIndex]) {
                    newMessages[messageIndex] = {
                      ...newMessages[messageIndex],
                      content: data.content || fullContent,
                      images: allImages
                    };
                  }
                  return newMessages;
                });
              }
              break;
            } 
            else if (data.type === 'error') {
              // Handle error signals from backend
              console.error('❌ Streaming error:', data.content);
              fullContent += `\nError: ${data.content}`;
              
              setMessages(prev => {
                const newMessages = [...prev];
                if (newMessages[messageIndex]) {
                  newMessages[messageIndex] = {
                    ...newMessages[messageIndex],
                    content: fullContent
                  };
                }
                return newMessages;
              });
              break;
            }
          } catch (parseError) {
            // Better error handling for malformed JSON chunks
            console.warn('Failed to parse chunk:', line, parseError);
            // Continue processing other chunks even if one fails
          }
        }
      }

    } catch (error) {
      console.error("Error in chat process:", error);
      
      // FIXED: Better error message handling
      setMessages(prev => [...prev, {
        content: `Sorry, I encountered an error: ${error.message}. Please try again.`,
        role: "assistant",
        images: []
      }]);
    } finally {
      // Reset loading state and clear uploaded files
      setIsLoading(false);
      setUploadedFiles([]);
      setIsFileUploadOpen(false);
    }
  };

  return (
    <div className={styles.container}>
      <Header />
      <div className={styles.mainLayout}>
        <Sidebar 
          chatThreads={chatThreads}
          selectedThreadId={threadId}
          handleSelectThread={handleSelectThread}
          handleNewChat={handleNewChat}
        />
        <main className={styles.mainContent}>
          <div className={styles.chatContainer}>
            <div className={styles.glassWrapper}>
              <div className={styles.messagesArea}>
                {messages.length === 0 && (
                  <div className={styles.welcomeContent}>
                    <div className={styles.welcomeAnimation}>
                      <div className={styles.welcomeCircle}></div>
                      <h1 className={styles.welcomeHeading}>What can I help with?</h1>
                    </div>
                    
                    <div className={styles.exampleTopicsContainer}>
                      <p className={styles.topicsLabel}>Ask me about:</p>
                      <div className={styles.exampleTopics}>
                        {exampleTopics.map((topic, index) => (
                          <ExampleTopic 
                            key={index} 
                            icon={topic.icon} 
                            text={topic.text} 
                            color={topic.color}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* FIXED: Enhanced message rendering with better image handling */}
                {messages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`${styles.message} ${
                      msg.role === "user" ? styles.userMessage : styles.aiMessage
                    }`}
                  >
                    <div className={styles.messageContent}>
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                      {/* FIXED: Better image rendering with error handling */}
                      {msg.images && msg.images.length > 0 && (
                        <div className={styles.messageImages}>
                          {msg.images.map((imgSrc, imgIdx) => (
                            <img
                              key={`${idx}-${imgIdx}`}
                              src={imgSrc}
                              alt={`Generated chart ${imgIdx + 1}`}
                              className={styles.messageImage}
                              onLoad={() => console.log(`✅ Image ${imgIdx + 1} loaded successfully`)}
                              onError={(e) => {
                                console.error(`❌ Failed to load image ${imgIdx + 1}:`, e);
                                e.target.style.display = 'none';
                              }}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {/* Loading indicator */}
                {isLoading && (
                  <div className={styles.loadingMessage}>
                    <Loader className={styles.loadingIcon} size={18} />
                    <span>AI is thinking...</span>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input area */}
              <div className={styles.inputWrapper}>
                {/* File upload display area */}
                {isFileUploadOpen && (
                  <div className={styles.uploadedFilesContainer}>
                    <div className={styles.uploadedFiles}>
                      {uploadedFiles.map((file, idx) => (
                        <FileItem key={idx} file={file} onRemove={removeFile} />
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Input area */}
                <div className={styles.inputContainer}>
                  <textarea
                    value={input}
                    onChange={(e) => {
                      setInput(e.target.value);
                      // Auto-resize the textarea
                      e.target.style.height = 'auto';
                      e.target.style.height = e.target.scrollHeight + 'px';
                    }}
                    placeholder="Ask anything..."
                    className={styles.input}
                    onKeyPress={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                      }
                    }}
                    disabled={isLoading}
                    rows="1"
                    style={{ resize: "none", overflow: "auto" }}
                  />
                  <button 
                    className={styles.fileButton} 
                    onClick={handleFileUploadClick}
                    disabled={isLoading}
                  >
                    <FileText size={18} />
                  </button>
                  <input
                    type="file"
                    multiple
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className={styles.fileInput}
                  />
                  <button
                    onClick={handleSend}
                    className={styles.sendButton}
                    disabled={(!input.trim() && uploadedFiles.length === 0) || isLoading}
                  >
                    <Send size={18} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
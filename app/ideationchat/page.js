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
  
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const router = useRouter();

  // Auto-scroll to the bottom of the chat when new messages appear
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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

  // IMPORTANT: This function handles sending messages to your API endpoint
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
      // Create FormData instance to handle files
      const formData = new FormData();
      
      // Add the message text
      formData.append('message', userMessage);
      
      // Add userId if needed
      formData.append('userId', 'default');
      
      // Add all files with unique keys
      if (uploadedFiles.length > 0) {
        uploadedFiles.forEach((file, index) => {
          const safeFile = new File([file], file.name, { type: file.type });
          formData.append(`file${index+1}`, safeFile);
        });
      }
      
      // Call your API endpoint with FormData (for files)
      const response = await fetch('/api/chat', {
        method: 'POST',
        body: formData, // Using FormData instead of JSON
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }
      
     // Add the assistant's response to the chat
setMessages(prev => [...prev, {
  content: data.response,
  role: "assistant",
  images: data.images || [] // Store any images that came with the response
}]);
    } catch (error) {
      console.error("Error in chat process:", error);
      
      // Add an error message to the chat
      setMessages(prev => [...prev, {
        content: "Sorry, I encountered an error processing your request. Please try again.",
        role: "assistant"
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
        <Sidebar />
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

                {messages.map((msg, idx) => (
  <div
    key={idx}
    className={`${styles.message} ${
      msg.role === "user" ? styles.userMessage : styles.aiMessage
    }`}
  >
    <div className={styles.messageContent}>
      <ReactMarkdown>{msg.content}</ReactMarkdown>
      {msg.images && msg.images.length > 0 && (
        <div className={styles.messageImages}>
          {msg.images.map((imgSrc, imgIdx) => (
            <img
              key={imgIdx}
              src={imgSrc}
              alt={`Generated chart ${imgIdx + 1}`}
              className={styles.messageImage}
            />
          ))}
        </div>
      )}
    </div>
  </div>
))}

                {isLoading && (
                  <div className={styles.loadingMessage}>
                    <Loader className={styles.loadingIcon} size={18} />
                    <span>AI is thinking...</span>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

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

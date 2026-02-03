import React, { useState, useEffect, useRef } from "react";
import { createRoot } from "react-dom/client";
import { SelectCard } from "./SelectCard";
import ReactMarkdown from 'react-markdown';
import './style.css';

interface Message {
  role: "user" | "assistant";
  content: string;
  type?: string;
  data?: any;
}

interface ClaudeResponse {
  type: string;
  data: any;
}

function VictorMonitor() {
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [theme, setTheme] = useState<"western" | "modern">("western");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async (userMessage: string) => {
    // Add user message to display
    const userMsg: Message = { role: "user", content: userMessage };
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    try {
      // Build history for API call (exclude structured data)
      const history = messages
        .map(msg => ({
          role: msg.role,
          content: msg.type ? JSON.stringify({ type: msg.type, data: msg.data }) : msg.content
        }))
        .filter(msg => msg.content && msg.content.trim().length > 0); // Filter out empty messages

      const res = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessage, history }),
      });
      const data = await res.json();

      // Add assistant response
      if (data.type) {
        // Structured response
        const assistantMsg: Message = {
          role: "assistant",
          content: data.data.question || "Please make a selection:",
          type: data.type,
          data: data.data
        };
        setMessages(prev => [...prev, assistantMsg]);
      } else {
        // Plain text response
        const assistantMsg: Message = {
          role: "assistant",
          content: data.reply
        };
        setMessages(prev => [...prev, assistantMsg]);
      }
    } catch (error) {
      const errorMsg: Message = {
        role: "assistant",
        content: "Well shoot, partner! Something went wrong on my end."
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!message.trim() || isLoading) return;

    const userMessage = message;
    setMessage("");
    await sendMessage(userMessage);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSelection = async (selectedValue: string) => {
    await sendMessage(selectedValue);
  };

  const renderMessage = (msg: Message, index: number) => {
    if (msg.role === "user") {
      return (
        <div key={index} className="message-row user-message-row">
          <div className="user-message">
            {msg.content}
          </div>
        </div>
      );
    }

    // Assistant message
    return (
      <div key={index} className="message-row assistant-message-row">
        <img src="/victor-face.webp" alt="Victor" className="message-avatar" />
        <div className="assistant-message-content">
          {msg.type === "select_card" ? (
            <>
              <div className="assistant-message markdown-content">
                <ReactMarkdown>{msg.content}</ReactMarkdown>
              </div>
              <SelectCard data={msg.data} onSelect={handleSelection} />
            </>
          ) : (
            <div className="assistant-message markdown-content">
              <ReactMarkdown>{msg.content}</ReactMarkdown>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="modal-overlay">
      <div className={`chat-modal ${theme}`}>
        <div className="theme-toggle-container">
          <button
            className="theme-toggle"
            onClick={() => setTheme(theme === "western" ? "modern" : "western")}
            title="Switch theme"
          >
            {theme === "western" ? "🎨 Modern" : "🤠 Western"}
          </button>
        </div>
        <div className="chat-messages">
          {messages.length === 0 && (
            <div className="welcome-message">
              <img src="/victor-face.webp" alt="Victor" className="welcome-avatar" />
              <div className="welcome-text">
                <h2>Howdy, partner!</h2>
                <p>I'm Victor, your AI assistant for the Frontier team.</p>
                <p className="welcome-prompt">What can I help you with today, partner?</p>
              </div>
            </div>
          )}
          {messages.map((msg, idx) => renderMessage(msg, idx))}
          {isLoading && (
            <div className="message-row assistant-message-row">
              <img src="/victor-face.webp" alt="Victor" className="message-avatar" />
              <div className="assistant-message loading-message">
                <span className="loading-dot">.</span>
                <span className="loading-dot">.</span>
                <span className="loading-dot">.</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="chat-footer">
          <div className="input-container">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask Victor anything, partner..."
              className="text-input"
              disabled={isLoading}
            />
            <button
              onClick={handleSubmit}
              className="submit-button"
              disabled={isLoading}
            >
              {isLoading ? "..." : "SEND"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const root = createRoot(document.getElementById("root")!);
root.render(<VictorMonitor />);

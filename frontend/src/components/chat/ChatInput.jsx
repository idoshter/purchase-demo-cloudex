import React, { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Paperclip, Mic } from "lucide-react";
import { motion } from "framer-motion";

export default function ChatInput({ onSendMessage, isLoading, disabled, language = 'he' }) {
  const [message, setMessage] = useState('');
  const textareaRef = useRef(null);

  const texts = {
    he: {
      placeholder: 'הקלד הודעה... (למשל: מה מצב ההזמנות היום?)',
      footer: 'עוזר הרכש מוכן לעזור לך בניהול הזמנות, מלאי ועוד'
    },
    en: {
      placeholder: 'Type a message... (e.g., What\'s the status of orders today?)',
      footer: 'Procurement assistant ready to help with orders, inventory, and more'
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (message.trim() && !isLoading && !disabled) {
      onSendMessage(message.trim());
      setMessage('');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 150) + 'px';
    }
  }, [message]);

  return (
    <div className="border-t border-gray-100 bg-white/80 backdrop-blur-xl p-2 sm:p-4">
      <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
        <div className="relative flex items-end gap-1.5 sm:gap-3 bg-gray-50 rounded-xl sm:rounded-2xl p-1.5 sm:p-2 border border-gray-100 focus-within:border-blue-200 focus-within:ring-2 sm:focus-within:ring-4 focus-within:ring-blue-50 transition-all">
          {/* Attachment Button */}
          <button
            type="button"
            className="p-1.5 sm:p-2.5 text-gray-400 hover:text-gray-600 hover:bg-white rounded-lg sm:rounded-xl transition-all"
          >
            <Paperclip className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          {/* Input */}
          <Textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={texts[language].placeholder}
            className="flex-1 resize-none border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 min-h-[40px] sm:min-h-[44px] max-h-[120px] sm:max-h-[150px] text-sm sm:text-[15px] placeholder:text-gray-400"
            disabled={isLoading || disabled}
            rows={1}
          />

          {/* Voice Button - Hidden on mobile */}
          <button
            type="button"
            className="hidden sm:block p-2.5 text-gray-400 hover:text-gray-600 hover:bg-white rounded-xl transition-all"
          >
            <Mic className="w-5 h-5" />
          </button>

          {/* Send Button */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button
              type="submit"
              disabled={!message.trim() || isLoading || disabled}
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg sm:rounded-xl px-3 sm:px-4 h-9 sm:h-11 shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:shadow-none"
            >
              {isLoading ? (
                <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Send className="w-4 h-4 sm:w-5 sm:h-5 rotate-180" />
              )}
            </Button>
          </motion.div>
        </div>

        <p className="text-center text-[10px] sm:text-xs text-gray-400 mt-2 sm:mt-3 px-2">
          {texts[language].footer}
        </p>
      </form>
    </div>
  );
}
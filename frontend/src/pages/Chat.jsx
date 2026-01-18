import React, { useState, useEffect, useRef } from 'react';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Menu, X, Package } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

import ChatSidebar from '@/components/chat/ChatSidebar';
import ChatMessage from '@/components/chat/ChatMessage';
import ChatInput from '@/components/chat/ChatInput';
import TypingIndicator from '@/components/chat/TypingIndicator';
import WelcomeScreen from '@/components/chat/WelcomeScreen';
import { sendMessageToADK } from '@/components/chat/adkIntegration';
import { useAuth } from '@/lib/AuthContext';

export default function Chat() {
  const { user: currentUser, logout } = useAuth();
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [uiLanguage, setUiLanguage] = useState('he');
  const messagesEndRef = useRef(null);

  // Local state for messages (bypassing broken backend persistence)
  const [localMessages, setLocalMessages] = useState([]);
  const [localConversations, setLocalConversations] = useState([]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [localMessages, isTyping]);

  const detectLanguage = (text) => {
    const hebrewPattern = /[\u0590-\u05FF]/;
    return hebrewPattern.test(text) ? 'he' : 'en';
  };

  const handleSendMessage = async (content) => {
    // Add user message
    const userMessage = {
      role: 'user',
      content,
      timestamp: new Date().toISOString()
    };

    setLocalMessages(prev => [...prev, userMessage]);
    setIsTyping(true);

    try {
      const language = detectLanguage(content);

      // Use a temporary session ID if we don't have one, or maintain a consistent one
      const sessionId = activeConversationId || crypto.randomUUID();
      if (!activeConversationId) setActiveConversationId(sessionId);

      // Call Google ADK
      const adkResponse = await sendMessageToADK(
        content,
        sessionId,
        currentUser?.email || currentUser?.full_name || 'guest',
        language
      );

      const entityCreationMessage = adkResponse.suggested_entities ?
        (adkResponse.suggested_entities.records ? `\n\n[Created Entity in ${adkResponse.suggested_entities.entity_name}]` : '') : '';

      const botMessage = {
        role: 'assistant',
        content: adkResponse.response + entityCreationMessage,
        timestamp: new Date().toISOString()
      };

      setLocalMessages(prev => [...prev, botMessage]);

    } catch (error) {
      console.error("Chat Error:", error);
      const errorMessage = {
        role: 'assistant',
        content: uiLanguage === 'he'
          ? 'מצטער, הייתה שגיאה בחיבור ל-ADK. אנא נסה שוב.'
          : 'Sorry, there was an error connecting to the ADK. ' + error.message,
        timestamp: new Date().toISOString()
      };
      setLocalMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  // Mock conversations for sidebar (since we disabled DB)
  const conversations = localConversations;
  const activeConversation = { messages: localMessages };

  // Mock response generator (replace with your ADK integration)
  const generateMockResponse = (userMessage) => {
    const lowerMessage = userMessage.toLowerCase();

    if (lowerMessage.includes('הזמנ')) {
      return 'יש לך כרגע 12 הזמנות פתוחות. 3 מהן ממתינות לאישור, 5 בתהליך משלוח ו-4 צפויות להגיע היום. האם תרצה פירוט נוסף על אחת מהן?';
    }
    if (lowerMessage.includes('מלאי')) {
      return 'מצב המלאי הכללי תקין. יש 5 פריטים שמתקרבים לרמת מלאי מינימום:\n\n• נייר A4 - נותרו 50 חבילות\n• טונר למדפסת - נותרו 3 יחידות\n• כפפות עבודה - נותרו 20 זוגות\n\nהאם להכין הזמנה אוטומטית?';
    }
    if (lowerMessage.includes('מוצר')) {
      return 'בהתבסס על צריכה ממוצעת ומלאי נוכחי, מומלץ להזמין:\n\n1. טונר למדפסת HP - דחוף\n2. נייר A4 - תוך שבוע\n3. חומרי ניקוי - תוך שבועיים\n\nהאם לפתוח הזמנה?';
    }
    if (lowerMessage.includes('סיכום')) {
      return 'סיכום רכש לחודש האחרון:\n\n📦 סה"כ הזמנות: 45\n💰 סה"כ הוצאה: ₪125,000\n✅ הזמנות שהושלמו: 42\n⏳ הזמנות פתוחות: 3\n\nחיסכון ביחס לחודש קודם: 8%';
    }

    return 'אני מבין. איך אוכל לעזור לך בנושא זה? אני יכול לסייע בניהול הזמנות, בדיקת מלאי, מעקב אחר ספקים ועוד.';
  };

  const texts = {
    he: {
      title: 'עוזר רכש חכם',
      ready: 'מוכן לעזור לך',
      language: 'English',
    },
    en: {
      title: 'Smart Procurement Assistant',
      ready: 'Ready to help',
      language: 'עברית',
    }
  };

  return (
    <div className="h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex" dir={uiLanguage === 'he' ? 'rtl' : 'ltr'}>
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col h-full min-w-0">
        {/* Header */}
        <header className="bg-white/80 backdrop-blur-xl border-b border-gray-100 px-3 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-4 min-w-0">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Package className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="font-bold text-gray-900 text-sm sm:text-base truncate">{texts[uiLanguage].title}</h1>
              <p className="text-xs text-gray-500 hidden sm:block">{texts[uiLanguage].ready}</p>
            </div>
          </div>

          <div className="flex items-center gap-1 sm:gap-3">
            {/* User Info */}
            {currentUser && (
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-lg border border-gray-100">
                <div className="w-7 h-7 bg-gradient-to-br from-blue-400 to-blue-500 rounded-full flex items-center justify-center text-white text-xs font-medium">
                  {currentUser.full_name?.charAt(0) || currentUser.email?.charAt(0) || 'U'}
                </div>
                <span className="text-sm font-medium text-gray-700">
                  {currentUser.full_name || currentUser.email}
                </span>
              </div>
            )}

            {/* Mobile User Avatar */}
            {currentUser && (
              <div className="sm:hidden w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-500 rounded-full flex items-center justify-center text-white text-xs font-medium">
                {currentUser.full_name?.charAt(0) || currentUser.email?.charAt(0) || 'U'}
              </div>
            )}

            {/* Language Toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setUiLanguage(uiLanguage === 'he' ? 'en' : 'he')}
              className="text-xs"
            >
              {texts[uiLanguage].language}
            </Button>

            {/* Sidebar Toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="rounded-xl"
            >
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </header>

        {/* Messages Area */}
        <div className="flex-1 overflow-hidden">
          {!activeConversation || activeConversation.messages?.length === 0 ? (
            <WelcomeScreen onSuggestionClick={handleSendMessage} language={uiLanguage} />
          ) : (
            <ScrollArea className="h-full">
              <div className="max-w-4xl mx-auto p-6 space-y-6">
                <AnimatePresence>
                  {activeConversation.messages?.map((message, index) => (
                    <ChatMessage
                      key={index}
                      message={message}
                      isLast={index === activeConversation.messages.length - 1}
                    />
                  ))}
                </AnimatePresence>

                <AnimatePresence>
                  {isTyping && <TypingIndicator />}
                </AnimatePresence>

                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>
          )}
        </div>

        {/* Input Area */}
        <ChatInput
          onSendMessage={handleSendMessage}
          isLoading={isTyping}
          disabled={false}
          language={uiLanguage}
        />
      </div>

      {/* Sidebar - Desktop */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 320, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="hidden md:block"
          >
            <ChatSidebar
              conversations={conversations}
              activeConversationId={activeConversationId}
              onSelectConversation={setActiveConversationId}
              onNewConversation={() => setLocalMessages([])}
              onDeleteConversation={() => setLocalMessages([])}
              isCollapsed={false}
              language={uiLanguage}
              onLogout={logout}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sidebar - Mobile Overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="md:hidden fixed inset-0 bg-black/50 z-40"
              onClick={() => setSidebarOpen(false)}
            />
            <motion.div
              initial={{ x: uiLanguage === 'he' ? 320 : -320 }}
              animate={{ x: 0 }}
              exit={{ x: uiLanguage === 'he' ? 320 : -320 }}
              transition={{ duration: 0.3 }}
              className="md:hidden fixed top-0 bottom-0 z-50 w-80"
              style={{ [uiLanguage === 'he' ? 'right' : 'left']: 0 }}
            >
              <ChatSidebar
                conversations={conversations}
                activeConversationId={activeConversationId}
                onSelectConversation={(id) => {
                  setActiveConversationId(id);
                  setSidebarOpen(false);
                }}
                onNewConversation={() => {
                  setLocalMessages([]);
                  setSidebarOpen(false);
                }}
                onDeleteConversation={() => setLocalMessages([])}
                isCollapsed={false}
                language={uiLanguage}
                onLogout={logout}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
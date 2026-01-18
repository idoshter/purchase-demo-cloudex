import React from 'react';
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, MessageSquare, Archive, Trash2, LogOut } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";

export default function ChatSidebar({
  conversations,
  activeConversationId,
  onSelectConversation,
  onNewConversation,
  onDeleteConversation,
  isCollapsed,
  language = 'he',
  onLogout
}) {
  if (isCollapsed) return null;

  const texts = {
    he: {
      newChat: 'שיחה חדשה',
      messages: 'הודעות',
      noChats: 'אין שיחות עדיין',
      startChat: 'התחל שיחה חדשה',
      newConversation: 'שיחה חדשה',
      logout: 'התנתק'
    },
    en: {
      newChat: 'New Chat',
      messages: 'messages',
      noChats: 'No chats yet',
      startChat: 'Start a new chat',
      newConversation: 'New Conversation',
      logout: 'Log Out'
    }
  };

  return (
    <div className="w-80 h-full bg-white border-l border-gray-100 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-100">
        <Button
          onClick={onNewConversation}
          className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg shadow-blue-500/20"
        >
          <Plus className={`w-4 h-4 ${language === 'he' ? 'ml-2' : 'mr-2'}`} />
          {texts[language].newChat}
        </Button>
      </div>

      {/* Conversations List */}
      <ScrollArea className="flex-1 px-3 py-2">
        <AnimatePresence>
          {conversations.map((conversation) => (
            <motion.div
              key={conversation.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className={`
                group relative p-3 mb-2 rounded-xl cursor-pointer transition-all duration-200
                ${activeConversationId === conversation.id
                  ? 'bg-blue-50 border border-blue-100'
                  : 'hover:bg-gray-50 border border-transparent'
                }
              `}
              onClick={() => onSelectConversation(conversation.id)}
            >
              <div className="flex items-start gap-3">
                <div className={`
                  p-2 rounded-lg
                  ${activeConversationId === conversation.id
                    ? 'bg-blue-100 text-blue-600'
                    : 'bg-gray-100 text-gray-500'
                  }
                `}>
                  <MessageSquare className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-gray-900 truncate text-sm">
                    {conversation.title || texts[language].newConversation}
                  </h3>
                  <p className="text-xs text-gray-400 mt-1">
                    {conversation.messages?.length || 0} {texts[language].messages}
                  </p>
                </div>
              </div>

              {/* Delete Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteConversation(conversation.id);
                }}
                className="absolute left-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 
                  p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-all"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>

        {conversations.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p className="text-sm">{texts[language].noChats}</p>
            <p className="text-xs mt-1">{texts[language].startChat}</p>
          </div>
        )}
      </ScrollArea>

      {/* Footer - Logout */}
      <div className="p-4 border-t border-gray-100">
        <Button
          variant="ghost"
          className="w-full text-gray-500 hover:text-red-600 hover:bg-red-50 justify-start gap-3"
          onClick={onLogout}
        >
          <LogOut className="w-4 h-4" />
          {texts[language].logout}
        </Button>
      </div>
    </div>
  );
}
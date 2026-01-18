import React from 'react';
import { motion } from "framer-motion";
import { User, Bot, Package, ClipboardList, Boxes } from "lucide-react";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export default function ChatMessage({ message, isLast }) {
  const isUser = message.role === 'user';

  // Icon based on context (for assistant messages about specific topics)
  const getAssistantIcon = () => {
    const content = message.content?.toLowerCase() || '';
    if (content.includes('הזמנ') || content.includes('order')) {
      return <ClipboardList className="w-4 h-4" />;
    }
    if (content.includes('מלאי') || content.includes('inventory')) {
      return <Boxes className="w-4 h-4" />;
    }
    if (content.includes('מוצר') || content.includes('product')) {
      return <Package className="w-4 h-4" />;
    }
    return <Bot className="w-4 h-4" />;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`flex gap-2 sm:gap-4 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
    >
      {/* Avatar */}
      <div className={`
        flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl flex items-center justify-center
        ${isUser
          ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/30'
          : 'bg-gradient-to-br from-gray-100 to-gray-200 text-gray-600'
        }
      `}>
        {isUser ? <User className="w-4 h-4 sm:w-5 sm:h-5" /> : getAssistantIcon()}
      </div>

      {/* Message Bubble */}
      <div className={`
        max-w-[75%] sm:max-w-[70%] rounded-xl sm:rounded-2xl px-3 py-2.5 sm:px-5 sm:py-3.5
        ${isUser
          ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-tr-md shadow-lg shadow-blue-500/20'
          : 'bg-white border border-gray-100 text-gray-800 rounded-tl-md shadow-sm'
        }
      `}>
        <div className="text-sm sm:text-[15px] leading-relaxed overflow-hidden" dir="auto">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              // Text styling
              p: ({ node, ...props }) => <p className="mb-2 last:mb-0 whitespace-pre-wrap" dir="auto" {...props} />,
              a: ({ node, ...props }) => <a className="underline hover:text-blue-200 transition-colors" dir="auto" target="_blank" rel="noopener noreferrer" {...props} />,

              // List styling
              ul: ({ node, ...props }) => <ul className="list-disc list-inside mb-2 space-y-1" dir="auto" {...props} />,
              ol: ({ node, ...props }) => <ol className="list-decimal list-inside mb-2 space-y-1" dir="auto" {...props} />,
              li: ({ node, ...props }) => <li className="ml-2" dir="auto" {...props} />,

              // Code styling
              code: ({ node, inline, className, children, ...props }) => {
                return inline ? (
                  <code className={`bg-black/10 px-1 py-0.5 rounded text-[0.9em] font-mono ${isUser ? 'text-white' : 'text-pink-600'}`} dir="ltr" {...props}>
                    {children}
                  </code>
                ) : (
                  <div className="bg-gray-900 text-gray-100 p-3 rounded-lg my-2 overflow-x-auto text-xs sm:text-sm font-mono" dir="ltr">
                    <code className="block whitespace-pre" {...props}>{children}</code>
                  </div>
                )
              },

              // Table styling
              table: ({ node, ...props }) => (
                <div className="my-4 overflow-x-auto rounded-lg border border-gray-200 shadow-sm bg-white text-gray-900" dir="auto">
                  <table className="w-full text-left border-collapse text-sm" {...props} />
                </div>
              ),
              thead: ({ node, ...props }) => <thead className="bg-gray-50 border-b border-gray-200" {...props} />,
              tbody: ({ node, ...props }) => <tbody className="divide-y divide-gray-100" {...props} />,
              tr: ({ node, ...props }) => <tr className="hover:bg-gray-50/50 transition-colors" {...props} />,
              th: ({ node, ...props }) => <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wider text-gray-500 whitespace-nowrap" dir="auto" {...props} />,
              td: ({ node, ...props }) => <td className="px-4 py-3 align-top text-gray-700" dir="auto" {...props} />,
            }}
          >
            {message.content}
          </ReactMarkdown>
        </div>
      </div>
    </motion.div>
  );
}
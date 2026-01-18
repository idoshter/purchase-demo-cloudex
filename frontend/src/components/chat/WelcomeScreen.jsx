import React from 'react';
import { motion } from "framer-motion";
import { Package, ClipboardList, Boxes, TrendingUp, Search, Bell } from "lucide-react";

export default function WelcomeScreen({ onSuggestionClick, language = 'he' }) {
  const content = {
    he: {
      title: 'עוזר הרכש החכם',
      subtitle: 'אני כאן לעזור לך לנהל הזמנות, מלאי ותהליכי רכש בקלות',
      suggestions: [
        { icon: ClipboardList, text: "מה סטטוס ההזמנות הפתוחות?", color: "blue" },
        { icon: Boxes, text: "הצג לי את מצב המלאי", color: "emerald" },
        { icon: Package, text: "איזה מוצרים צריך להזמין?", color: "purple" },
        { icon: TrendingUp, text: "סיכום רכש לחודש האחרון", color: "orange" },
      ],
      features: [
        { icon: Search, text: 'חיפוש חכם' },
        { icon: Bell, text: 'התראות בזמן אמת' },
        { icon: TrendingUp, text: 'דוחות ותובנות' },
      ]
    },
    en: {
      title: 'Smart Procurement Assistant',
      subtitle: 'I\'m here to help you manage orders, inventory, and procurement processes with ease',
      suggestions: [
        { icon: ClipboardList, text: "What's the status of open orders?", color: "blue" },
        { icon: Boxes, text: "Show me inventory status", color: "emerald" },
        { icon: Package, text: "Which products need ordering?", color: "purple" },
        { icon: TrendingUp, text: "Procurement summary for last month", color: "orange" },
      ],
      features: [
        { icon: Search, text: 'Smart Search' },
        { icon: Bell, text: 'Real-time Alerts' },
        { icon: TrendingUp, text: 'Reports & Insights' },
      ]
    }
  };

  const suggestions = content[language].suggestions;
  const colorClasses = {
    blue: "bg-blue-50 text-blue-600 group-hover:bg-blue-100",
    emerald: "bg-emerald-50 text-emerald-600 group-hover:bg-emerald-100",
    purple: "bg-purple-50 text-purple-600 group-hover:bg-purple-100",
    orange: "bg-orange-50 text-orange-600 group-hover:bg-orange-100",
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center max-w-2xl"
      >
        {/* Logo/Icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", duration: 0.6 }}
          className="w-20 h-20 mx-auto mb-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-blue-500/30"
        >
          <Package className="w-10 h-10 text-white" />
        </motion.div>

        <h1 className="text-3xl font-bold text-gray-900 mb-3">
          {content[language].title}
        </h1>
        <p className="text-gray-500 text-lg mb-12">
          {content[language].subtitle}
        </p>

        {/* Suggestion Cards */}
        <div className="grid grid-cols-1 gap-3 sm:gap-4 px-4 sm:px-0">
          {suggestions.map((suggestion, index) => (
            <motion.button
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * index }}
              onClick={() => onSuggestionClick(suggestion.text)}
              className="group flex items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-white border border-gray-100 rounded-xl sm:rounded-2xl hover:border-gray-200 hover:shadow-lg transition-all duration-300 text-right"
            >
              <div className={`p-2 sm:p-3 rounded-lg sm:rounded-xl transition-colors ${colorClasses[suggestion.color]}`}>
                <suggestion.icon className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <span className="text-sm sm:text-base text-gray-700 font-medium flex-1">{suggestion.text}</span>
            </motion.button>
          ))}
        </div>

        {/* Features */}
        <div className="flex items-center justify-center gap-4 sm:gap-8 mt-8 sm:mt-12 text-xs sm:text-sm text-gray-400 px-4">
          {content[language].features.map((feature, index) => (
            <div key={index} className="flex items-center gap-2">
              <feature.icon className="w-4 h-4" />
              <span>{feature.text}</span>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
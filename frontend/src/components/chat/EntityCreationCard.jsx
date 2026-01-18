import React from 'react';
import { motion } from "framer-motion";
import { CheckCircle, Database, AlertCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function EntityCreationCard({ entityName, recordCount, status = 'success' }) {
  const statusConfig = {
    success: {
      icon: CheckCircle,
      bgColor: 'bg-green-50',
      iconColor: 'text-green-600',
      borderColor: 'border-green-200',
      textColor: 'text-green-800'
    },
    error: {
      icon: AlertCircle,
      bgColor: 'bg-red-50',
      iconColor: 'text-red-600',
      borderColor: 'border-red-200',
      textColor: 'text-red-800'
    },
    processing: {
      icon: Database,
      bgColor: 'bg-blue-50',
      iconColor: 'text-blue-600',
      borderColor: 'border-blue-200',
      textColor: 'text-blue-800'
    }
  };

  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <Card className={`${config.bgColor} border ${config.borderColor} shadow-sm`}>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${config.bgColor} ${config.iconColor}`}>
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <p className={`font-medium ${config.textColor}`}>
                {status === 'success' && `נוצרו ${recordCount} רשומות ב-${entityName}`}
                {status === 'error' && `שגיאה ביצירת רשומות ב-${entityName}`}
                {status === 'processing' && `מעבד רשומות ל-${entityName}...`}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                {status === 'success' && 'המידע נשמר בהצלחה במערכת'}
                {status === 'error' && 'אנא נסה שוב או פנה לתמיכה'}
                {status === 'processing' && 'אנא המתן...'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
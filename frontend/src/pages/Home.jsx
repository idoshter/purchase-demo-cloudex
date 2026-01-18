import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Package } from "lucide-react";
import { motion } from "framer-motion";
import { createPageUrl } from '@/utils';

import { useGoogleLogin } from '@react-oauth/google';
import axios from 'axios';
import { useAuth } from '@/lib/AuthContext';

export default function Home() {
  const navigate = useNavigate();
  const { loginWithGoogle, isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      navigate(createPageUrl('Chat'));
    }
  }, [isAuthenticated, navigate]);

  const handleGoogleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        const userInfo = await axios.get(
          'https://www.googleapis.com/oauth2/v3/userinfo',
          { headers: { Authorization: `Bearer ${tokenResponse.access_token}` } },
        );

        // Map Google user info to expected user structure
        const user = {
          email: userInfo.data.email,
          full_name: userInfo.data.name,
          first_name: userInfo.data.given_name,
          last_name: userInfo.data.family_name,
          picture: userInfo.data.picture,
          // Add other fields if needed by base44/app
        };

        loginWithGoogle(user);
        navigate(createPageUrl('Chat'));
      } catch (error) {
        console.error('Failed to fetch user info:', error);
      }
    },
    onError: error => console.log('Login Failed:', error)
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="bg-white rounded-3xl shadow-2xl p-8 sm:p-12 border border-gray-100">
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30">
              <Package className="w-8 h-8 text-white" />
            </div>
          </div>

          {/* Title */}
          <div className="text-center mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
              ברוכים הבאים
            </h1>
            <p className="text-gray-500">
              התחבר כדי להמשיך לעוזר הרכש החכם
            </p>
          </div>

          {/* Google Sign In Button */}
          <Button
            onClick={handleGoogleLogin}
            className="w-full h-12 bg-white hover:bg-gray-50 text-gray-700 border-2 border-gray-200 hover:border-gray-300 rounded-xl font-medium shadow-sm transition-all duration-200 flex items-center justify-center gap-3"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            <span>המשך עם Google</span>
          </Button>

          {/* Divider */}
          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 h-px bg-gray-200"></div>
            <span className="text-sm text-gray-400">או</span>
            <div className="flex-1 h-px bg-gray-200"></div>
          </div>

          {/* Alternative Login Options */}
          <div className="space-y-3">
            <Button
              onClick={handleGoogleLogin}
              variant="outline"
              className="w-full h-12 rounded-xl font-medium"
            >
              התחבר עם Microsoft
            </Button>
            <Button
              onClick={handleGoogleLogin}
              variant="outline"
              className="w-full h-12 rounded-xl font-medium"
            >
              התחבר עם Apple
            </Button>
          </div>

          {/* Footer */}
          <div className="mt-8 text-center text-sm text-gray-500">
            <p>
              בהמשך, אתה מסכים ל
              <a href="#" className="text-blue-600 hover:underline mx-1">תנאי השימוש</a>
              ו
              <a href="#" className="text-blue-600 hover:underline mx-1">מדיניות הפרטיות</a>
            </p>
          </div>
        </div>

        {/* Bottom Text */}
        <div className="text-center mt-6 text-sm text-gray-500">
          <p>צריך עזרה? צור קשר עם התמיכה שלנו</p>
        </div>
      </motion.div>
    </div>
  );
}
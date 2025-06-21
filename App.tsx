
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Message } from './types';
import ChatMessage from './components/ChatMessage';
import ChatInput from './components/ChatInput';
import LoadingSpinner from './components/LoadingSpinner';
import LoginScreen from './components/LoginScreen'; // New component
import { initializeGemini, startChatSession, sendMessageToAI } from './services/geminiService';
import { INITIAL_AI_MESSAGE } from './constants';

interface UserDetails {
  firstName: string;
  lastName: string;
  mobile: string;
}

const App: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  const [apiKeyAvailable, setApiKeyAvailable] = useState<boolean>(false);
  const [isUserRegistered, setIsUserRegistered] = useState<boolean>(false);
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null);
  
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  },[]);

  // Check for existing user registration in localStorage
  useEffect(() => {
    const storedUserDetails = localStorage.getItem('userDetails');
    if (storedUserDetails) {
      try {
        const parsedDetails: UserDetails = JSON.parse(storedUserDetails);
        // Basic validation of stored data
        if (parsedDetails && parsedDetails.firstName && parsedDetails.lastName && parsedDetails.mobile) {
            setUserDetails(parsedDetails);
            setIsUserRegistered(true);
        } else {
            localStorage.removeItem('userDetails'); // Clear invalid data
        }
      } catch (e) {
        console.error("Failed to parse userDetails from localStorage", e);
        localStorage.removeItem('userDetails'); // Clear corrupted data
      }
    }
  }, []);

  // Initialize Gemini API
  useEffect(() => {
    const apiKey = process.env.API_KEY;
    if (apiKey && apiKey.trim() !== "") {
      try {
        initializeGemini(apiKey);
        // startChatSession(); // Defer starting chat session until user is registered and enters chat view
        setApiKeyAvailable(true);
        setError(null);
      } catch (e) {
        console.error("Failed to initialize Gemini:", e);
        const errorMessage = e instanceof Error ? e.message : "Unknown error during initialization.";
        setError(`خطا در راه‌اندازی سرویس هوش مصنوعی: ${errorMessage}. لطفاً از صحت کلید API و اتصال اینترنت اطمینان حاصل کنید.`);
        setApiKeyAvailable(false);
      }
    } else {
      setError("کلید API برای Gemini یافت نشد یا خالی است. لطفاً مطمئن شوید که متغیر محیطی API_KEY به درستی تنظیم شده است.");
      setApiKeyAvailable(false);
    }
  }, []);

  // Add initial AI message after registration and API availability
  useEffect(() => {
    if (isUserRegistered && apiKeyAvailable && messages.length === 0) {
      try {
        startChatSession(); // Start chat session now
        setMessages([
          {
            id: crypto.randomUUID(),
            text: `سلام ${userDetails?.firstName || ''}! ${INITIAL_AI_MESSAGE.substring(INITIAL_AI_MESSAGE.indexOf(' ') + 1)}`, // Personalized greeting
            sender: 'ai',
            timestamp: new Date(),
          },
        ]);
      } catch (e) {
         console.error("Failed to start chat session or send initial message:", e);
         setError("خطا در شروع جلسه گفتگو با مربی.");
      }
    }
  }, [isUserRegistered, apiKeyAvailable, userDetails, messages.length]); // Added userDetails & messages.length dependency

  useEffect(() => {
    if(isUserRegistered) { // Only scroll if chat is visible
        scrollToBottom();
    }
  }, [messages, scrollToBottom, isUserRegistered]);

  const handleRegistration = (details: UserDetails) => {
    localStorage.setItem('userDetails', JSON.stringify(details));
    setUserDetails(details);
    setIsUserRegistered(true);
    setError(null); // Clear any previous errors like API key not found from initial load
  };

  const handleSendMessage = async (text: string) => {
    if (!apiKeyAvailable) {
      setError("امکان ارسال پیام وجود ندارد. کلید API در دسترس نیست یا نامعتبر است.");
      return;
    }
    if (!isUserRegistered) {
      setError("لطفا ابتدا مشخصات خود را وارد کنید.");
      return;
    }

    const userMessage: Message = {
      id: crypto.randomUUID(),
      text,
      sender: 'user',
      timestamp: new Date(),
    };
    setMessages((prevMessages) => [...prevMessages, userMessage]);
    setIsLoading(true);
    setError(null); 

    try {
      const aiResponseText = await sendMessageToAI(text);
      const aiMessage: Message = {
        id: crypto.randomUUID(),
        text: aiResponseText,
        sender: 'ai',
        timestamp: new Date(),
      };
      setMessages((prevMessages) => [...prevMessages, aiMessage]);
    } catch (e) {
      console.error("Error in AI response:", e);
      const errorMessageText = e instanceof Error ? e.message : "خطای ناشناخته در دریافت پاسخ از هوش مصنوعی.";
      const aiErrorMessage: Message = {
        id: crypto.randomUUID(),
        text: `متاسفم، مشکلی در ارتباط با مربی پیش آمد. ${errorMessageText}`,
        sender: 'ai',
        timestamp: new Date(),
      };
      setMessages((prevMessages) => [...prevMessages, aiErrorMessage]);
      setError(errorMessageText); 
    } finally {
      setIsLoading(false);
    }
  };
  
  if (!isUserRegistered) {
    return <LoginScreen onRegister={handleRegistration} />;
  }

  return (
    <div className="flex flex-col h-screen max-w-4xl mx-auto bg-slate-900/95 shadow-2xl overflow-hidden" dir="rtl"> {/* Added overflow-hidden */}
      <header className="p-4 bg-gradient-to-r from-sky-600 to-cyan-500 text-white text-center shadow-lg sticky top-0 z-10">
        <h1 className="text-2xl font-bold">مربی هوشمند شما (امیر میرزایی)</h1>
        <p className="text-sm opacity-90">راهنمای شما در مسیر موفقیت بازاریابی شبکه‌ای{userDetails ? `، ${userDetails.firstName} عزیز` : ''}</p>
      </header>

      {!apiKeyAvailable && (
         <div className="p-6 m-4 bg-red-800 border border-red-700 text-white rounded-lg text-center shadow-lg">
          <p className="font-semibold text-xl mb-2">خطا در پیکربندی سیستم</p>
          <p className="mb-1">{error || "کلید API یافت نشد."}</p>
          <p className="mt-3 text-sm opacity-90">
            این برنامه برای عملکرد صحیح به یک کلید API معتبر برای Gemini نیاز دارد.
            <br />
            لطفاً اطمینان حاصل کنید که متغیر محیطی <code>process.env.API_KEY</code> به درستی تنظیم شده است.
          </p>
        </div>
      )}

      {apiKeyAvailable && (
        <>
          <div ref={chatContainerRef} className="flex-grow p-4 space-y-4 overflow-y-auto bg-transparent"> {/* Changed bg-slate-800 to bg-transparent */}
            {messages.map((msg) => (
              <ChatMessage key={msg.id} message={msg} />
            ))}
            {isLoading && <LoadingSpinner />}
            {error && messages.length > (messages[0]?.sender === 'ai' && INITIAL_AI_MESSAGE.includes(messages[0]?.text.substring(messages[0]?.text.indexOf(' ')+1)) ? 1 : 0) && !isLoading && (
              <div className="p-3 my-2 bg-red-700 border border-red-600 text-red-100 rounded-lg text-sm text-center shadow">
                <p>خطا در پاسخ مربی: {error}</p>
              </div>
            )}
          </div>
          <ChatInput onSendMessage={handleSendMessage} isLoading={isLoading} />
        </>
      )}
    </div>
  );
};

export default App;

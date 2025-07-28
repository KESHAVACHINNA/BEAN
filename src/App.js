import React, { useState, useRef, useEffect } from 'react';

const App = () => {
  const [input, setInput] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const chatEndRef = useRef(null);

  // Scroll to the bottom of the chat history whenever it updates
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  // Function to determine user intent (text or image generation) using the AI model
  // This function will now call the backend for intent determination
  const determineIntent = async (userInput) => {
    try {
      // **IMPORTANT:** Replace '/api/determine_intent' with your deployed backend URL + '/api/determine_intent'
      // Example: const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://127.0.0.1:5000';
      // const response = await fetch(`${backendUrl}/api/determine_intent`, {
      const response = await fetch('/api/determine_intent', { // Placeholder for local development or if backend is on same origin
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_input: userInput }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Backend Intent API error: ${response.status} - ${errorData.error.message}`);
      }

      const result = await response.json();
      return result.intent; // Expecting {"intent": "image_generation" | "text_generation"}
    } catch (error) {
      console.error('Error determining intent via backend:', error);
      // Fallback to text generation if intent determination fails or backend is unreachable
      return 'text_generation';
    }
  };

  const sendMessage = async (forceImageGeneration = false) => {
    if (!input.trim()) return;

    const userMessage = { role: 'user', text: input };
    setChatHistory((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    // Add a temporary message indicating intent determination
    const tempIntentMessageId = Date.now(); // Unique ID for this temporary message
    setChatHistory((prev) => [...prev, { id: tempIntentMessageId, role: 'assistant', text: 'Bean is analyzing your request...' }]);

    try {
      let currentIntent = 'text_generation';

      if (forceImageGeneration) {
        currentIntent = 'image_generation';
      } else if (input.toLowerCase().startsWith('generate an image of') ||
          input.toLowerCase().startsWith('picture of') ||
          input.toLowerCase().startsWith('create an image of')) {
        currentIntent = 'image_generation';
      } else {
        currentIntent = await determineIntent(input);
      }

      // Remove the temporary message
      setChatHistory((prev) => prev.filter(msg => msg.id !== tempIntentMessageId));

      if (currentIntent === 'image_generation') {
        setChatHistory((prev) => [...prev, { role: 'assistant', text: `Understood! I'll generate an image based on "${input}".` }]);
        await generateImage(input);
      } else {
        setChatHistory((prev) => [...prev, { role: 'assistant', text: `Got it! I'll provide a text response for "${input}".` }]);
        await generateText(input);
      }
    } catch (error) {
      console.error('Error in sendMessage:', error);
      setChatHistory((prev) => [...prev, { role: 'assistant', text: `Error: ${error.message}` }]);
    } finally {
      setIsLoading(false);
    }
  };

  const generateText = async (textPrompt) => {
    try {
      const apiChatHistory = chatHistory
        .filter(msg => msg.role === 'user' || msg.role === 'assistant')
        .map(msg => ({
          role: msg.role === 'user' ? 'user' : 'model',
          parts: [{ text: msg.text || '' }]
        }));

      apiChatHistory.push({ role: 'user', parts: [{ text: textPrompt }] });

      // **IMPORTANT:** Replace '/api/chat' with your deployed backend URL + '/api/chat'
      // Example: const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://127.0.0.1:5000';
      // const response = await fetch(`${backendUrl}/api/chat`, {
      const response = await fetch('/api/chat', { // Placeholder for local development or if backend is on same origin
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_history: chatHistory.filter(msg => msg.role === 'user' || msg.role === 'assistant'), // Send relevant history
          user_prompt: textPrompt
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Backend Chat API error: ${response.status} - ${errorData.error.message}`);
      }

      const result = await response.json();
      if (result.response_text) {
        setChatHistory((prev) => [...prev, { role: 'assistant', text: result.response_text }]);
      } else {
        setChatHistory((prev) => [...prev, { role: 'assistant', text: 'Sorry, I could not get a text response from the backend.' }]);
      }
    } catch (error) {
      console.error('Error generating text via backend:', error);
      setChatHistory((prev) => [...prev, { role: 'assistant', text: `Error generating text: ${error.message}` }]);
    }
  };

  const generateImage = async (prompt) => {
    try {
      const imagePrompt = prompt;

      setChatHistory((prev) => [...prev, { role: 'assistant', text: `Generating an image for: "${imagePrompt}"...` }]);

      // **IMPORTANT:** Replace '/api/image' with your deployed backend URL + '/api/image'
      // Example: const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://127.0.0.1:5000';
      // const response = await fetch(`${backendUrl}/api/image`, {
      const response = await fetch('/api/image', { // Placeholder for local development or if backend is on same origin
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: prompt }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Backend Image API error: ${response.status} - ${errorData.error.message}`);
      }

      const result = await response.json();
      if (result.image_url) {
        setChatHistory((prev) => [...prev, { role: 'assistant', image: result.image_url, text: 'Here is your image:' }]);
      } else {
        setChatHistory((prev) => [...prev, { role: 'assistant', text: 'Sorry, I could not generate an image from the backend.' }]);
      }
    } catch (error) {
      console.error('Error generating image via backend:', error);
      setChatHistory((prev) => [...prev, { role: 'assistant', text: `Error generating image: ${error.message}` }]);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !isLoading) {
      sendMessage();
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden flex flex-col items-center justify-center p-4">
      {/* Futuristic Background Effect */}
      <div className="absolute inset-0 z-0 bg-gradient-to-br from-gray-950 via-purple-950 to-blue-950 opacity-90"></div>
      <div className="absolute inset-0 z-0 bg-grid-pattern opacity-10 animate-pulse"></div> {/* More complex grid pattern */}
      <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-blue-600 rounded-full mix-blend-multiply filter blur-2xl opacity-40 animate-blob"></div>
      <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-purple-600 rounded-full mix-blend-multiply filter blur-2xl opacity-40 animate-blob animation-delay-2000"></div>
      <div className="absolute top-1/2 left-1/2 w-72 h-72 bg-cyan-600 rounded-full mix-blend-multiply filter blur-2xl opacity-40 animate-blob animation-delay-4000"></div>
      {/* New subtle light trails/lines */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="light-trail-1"></div>
        <div className="light-trail-2"></div>
        <div className="light-trail-3"></div>
      </div>


      <div className="relative z-10 bg-gray-900 bg-opacity-80 backdrop-filter backdrop-blur-xl rounded-3xl border border-blue-600 shadow-3xl p-8 w-full max-w-3xl flex flex-col h-[90vh] transform transition-all duration-500 hover:scale-[1.005] animate-fade-in border-glow">
        <h1 className="text-5xl font-extrabold mb-8 text-center text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-purple-300 drop-shadow-xl font-orbitron animate-text-glow">
          Bean <span className="text-2xl font-light block font-inter mt-2">Your Personal AI Assistant</span>
        </h1>

        {/* Chat History Display */}
        <div className="flex-grow overflow-y-auto pr-3 mb-6 custom-scrollbar-futuristic border-b border-gray-700 pb-4">
          {chatHistory.length === 0 ? (
            <div className="text-center text-gray-400 mt-12 text-xl font-inter">
              <p className="mb-3">Greetings, Human. How may I assist you?</p>
              <p>Type your request, or click the <span className="text-green-400 font-semibold">sparkle icon</span> for image generation!</p>
            </div>
          ) : (
            chatHistory.map((msg, index) => (
              <div
                key={index}
                className={`flex mb-5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] p-5 rounded-3xl shadow-xl relative font-inter text-lg ${
                    msg.role === 'user'
                      ? 'bg-gradient-to-br from-blue-800 to-indigo-900 text-white rounded-br-none animation-slide-in-right chat-bubble-user'
                      : 'bg-gradient-to-br from-gray-700 to-gray-800 text-gray-200 rounded-bl-none animation-slide-in-left chat-bubble-ai'
                  }`}
                >
                  {msg.text && <p className="leading-relaxed">{msg.text}</p>}
                  {msg.image && (
                    <img
                      src={msg.image}
                      alt="Generated by AI"
                      className="mt-4 rounded-lg max-w-full h-auto border-2 border-blue-500 shadow-lg transform transition-transform duration-300 hover:scale-105"
                      onError={(e) => { e.target.onerror = null; e.target.src="https://placehold.co/400x300/4B0082/FFFFFF?text=Image+Error"; }}
                    />
                  )}
                </div>
              </div>
            ))
          )}
          <div ref={chatEndRef} /> {/* Scroll target */}
        </div>

        {/* Input Area */}
        <div className="flex items-center space-x-4 mt-auto pt-6 border-t border-gray-700">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={isLoading ? "Processing command..." : "Engage with Bean..."}
            className="flex-grow p-4 rounded-xl bg-gray-700 bg-opacity-60 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent border border-gray-600 transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed text-lg font-inter hover:border-blue-500 input-focus-glow"
            disabled={isLoading}
          />
          {/* New Image Generation Button with Sparkle Icon */}
          <button
            onClick={() => sendMessage(true)} // Pass true to force image generation
            className="bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 text-white font-bold py-4 px-7 rounded-xl shadow-lg transition duration-300 ease-in-out transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-2 focus:ring-offset-gray-900 disabled:opacity-50 disabled:cursor-not-allowed text-lg flex items-center justify-center button-hover-effect"
            disabled={isLoading}
            title="Generate Image"
          >
            {/* Sparkle/Magic Wand Icon SVG */}
            <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M10 20l-4-4-4 4 4 4 4-4zm10-10l-4-4-4 4 4 4 4-4zm0 12l-2-2-2 2 2 2 2-2zM4 4l-2-2-2 2 2 2 2-2zM12 0l-2 6-6 2 6 2 2 6 2-6 6-2-6-2-2-6z"/>
            </svg>
          </button>
          <button
            onClick={() => sendMessage()} // Default send button
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-4 px-9 rounded-xl shadow-lg transition duration-300 ease-in-out transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-gray-900 disabled:opacity-50 disabled:cursor-not-allowed text-lg flex items-center justify-center button-hover-effect"
            disabled={isLoading}
            title="Send Message"
          >
            {isLoading ? (
              <svg className="animate-spin h-7 w-7 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <>
                <svg className="w-7 h-7 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6"></path></svg>
                Send
              </>
            )}
          </button>
        </div>
      </div>

      {/* Tailwind CSS CDN */}
      <script src="https://cdn.tailwindcss.com"></script>
      {/* Font Inter */}
      <link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;500;700&family=Inter:wght@400;600;700&display=swap" rel="stylesheet" />
      <style>
        {`
          /* Futuristic Font (Orbitron for headings, Inter for body) */
          .font-orbitron {
            font-family: 'Orbitron', sans-serif;
          }
          .font-inter {
            font-family: 'Inter', sans-serif;
          }

          /* Custom Scrollbar for a futuristic look */
          .custom-scrollbar-futuristic::-webkit-scrollbar {
            width: 8px;
          }
          .custom-scrollbar-futuristic::-webkit-scrollbar-track {
            background: rgba(100, 100, 100, 0.1);
            border-radius: 10px;
          }
          .custom-scrollbar-futuristic::-webkit-scrollbar-thumb {
            background: linear-gradient(to bottom, #8B5CF6, #3B82F6);
            border-radius: 10px;
          }
          .custom-scrollbar-futuristic::-webkit-scrollbar-thumb:hover {
            background: linear-gradient(to bottom, #A78BFA, #60A5FA);
          }

          /* Background blob animations */
          @keyframes blob {
            0% {
              transform: translate(0px, 0px) scale(1);
            }
            33% {
              transform: translate(30px, -50px) scale(1.1);
            }
            66% {
              transform: translate(-20px, 20px) scale(0.9);
            }
            100% {
              transform: translate(0px, 0px) scale(1);
            }
          }

          .animate-blob {
            animation: blob 7s infinite cubic-bezier(0.6, 0.01, 0.3, 0.9);
          }
          .animation-delay-2000 {
            animation-delay: 2s;
          }
          .animation-delay-4000 {
            animation-delay: 4s;
          }

          /* More complex grid background pattern */
          .bg-grid-pattern {
            background-image: linear-gradient(to right, rgba(255,255,255,.05) 1px, transparent 1px),
                              linear-gradient(to bottom, rgba(255,255,255,.05) 1px, transparent 1px);
            background-size: 40px 40px;
          }

          /* Chat bubble entry animations */
          @keyframes slideInLeft {
            from {
              opacity: 0;
              transform: translateX(-20px);
            }
            to {
              opacity: 1;
              transform: translateX(0);
            }
          }

          @keyframes slideInRight {
            from {
              opacity: 0;
              transform: translateX(20px);
            }
            to {
              opacity: 1;
              transform: translateX(0);
            }
          }

          .animation-slide-in-left {
            animation: slideInLeft 0.3s ease-out forwards;
          }
          .animation-slide-in-right {
            animation: slideInRight 0.3s ease-out forwards;
          }

          /* New animations for advanced UI */
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .animate-fade-in {
            animation: fadeIn 0.8s ease-out forwards;
          }

          @keyframes textGlow {
            0%, 100% { text-shadow: 0 0 5px rgba(129, 140, 248, 0.7), 0 0 10px rgba(129, 140, 248, 0.5); }
            50% { text-shadow: 0 0 10px rgba(129, 140, 248, 1), 0 0 20px rgba(129, 140, 248, 0.8); }
          }
          .animate-text-glow {
            animation: textGlow 3s infinite alternate;
          }

          @keyframes borderGlow {
            0%, 100% { border-color: #3B82F6; box-shadow: 0 0 15px rgba(59, 130, 246, 0.6); }
            50% { border-color: #8B5CF6; box-shadow: 0 0 25px rgba(139, 92, 246, 0.8); }
          }
          .border-glow {
            animation: borderGlow 4s infinite alternate;
          }

          /* New: Light trail animations */
          @keyframes lightTrailMove {
            0% { transform: translate(-100vw, 0); opacity: 0; }
            20% { opacity: 1; }
            80% { opacity: 1; }
            100% { transform: translate(100vw, 0); opacity: 0; }
          }

          .light-trail-1 {
            position: absolute;
            top: 10%;
            left: -50%;
            width: 50vw;
            height: 2px;
            background: linear-gradient(to right, transparent, rgba(129, 140, 248, 0.7), transparent);
            animation: lightTrailMove 15s linear infinite;
            animation-delay: 0s;
          }
          .light-trail-2 {
            position: absolute;
            top: 40%;
            left: -50%;
            width: 70vw;
            height: 1px;
            background: linear-gradient(to right, transparent, rgba(139, 92, 246, 0.6), transparent);
            animation: lightTrailMove 18s linear infinite;
            animation-delay: 5s;
          }
          .light-trail-3 {
            position: absolute;
            top: 70%;
            left: -50%;
            width: 60vw;
            height: 3px;
            background: linear-gradient(to right, transparent, rgba(6, 182, 212, 0.8), transparent);
            animation: lightTrailMove 12s linear infinite;
            animation-delay: 10s;
          }

          /* Chat bubble tails - adjusted for gradient background */
          .chat-bubble-user::before {
            content: '';
            position: absolute;
            width: 0;
            height: 0;
            border: 12px solid transparent;
            border-right-color: #1e3a8a; /* Match start of user gradient */
            bottom: 0;
            right: -12px;
          }
          .chat-bubble-ai::before {
            content: '';
            position: absolute;
            width: 0;
            height: 0;
            border: 12px solid transparent;
            border-left-color: #374151; /* Match start of AI gradient */
            bottom: 0;
            left: -12px;
          }

          /* Input focus glow */
          .input-focus-glow:focus {
            box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.5); /* Blue glow */
          }

          /* Button hover effect */
          .button-hover-effect:hover {
            box-shadow: 0 0 15px rgba(59, 130, 246, 0.7); /* Blue/Purple glow */
          }
        `}
      </style>
    </div>
  );
};

export default App;

import React, { useState } from "react";
import { GoogleGenerativeAI } from "@google/generative-ai";

const App = () => {
  const [input, setInput] = useState("");
  const [chat, setChat] = useState([]);
  const genAI = new GoogleGenerativeAI(process.env.REACT_APP_GEMINI_API_KEY);

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMessage = { role: "user", content: input };
    setChat([...chat, userMessage]);

    try {
      const model = genAI.getGenerativeModel({ model: "gemini-pro" });
      const result = await model.generateContent(input);
      const response = result.response.text();
      setChat([...chat, userMessage, { role: "ai", content: response }]);
    } catch (err) {
      setChat([...chat, userMessage, { role: "ai", content: "⚠️ Error from Gemini API." }]);
    }

    setInput("");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white flex flex-col items-center p-6">
      <h1 className="text-4xl font-bold text-purple-400 mb-6 animate-bounce">👾 Bean – Your AI Assistant</h1>

      <div className="w-full max-w-xl bg-gray-800 rounded-2xl p-6 shadow-lg flex flex-col gap-4">
        <div className="h-96 overflow-y-auto space-y-4 pr-2">
          {chat.map((msg, i) => (
            <div
              key={i}
              className={`rounded-xl px-4 py-2 max-w-[80%] ${
                msg.role === "user" ? "ml-auto bg-purple-600" : "mr-auto bg-gray-700"
              }`}
            >
              {msg.content}
            </div>
          ))}
        </div>

        <div className="flex gap-2">
          <input
            className="flex-1 p-3 rounded-xl bg-gray-700 text-white outline-none"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Ask Bean something..."
          />
          <button
            onClick={handleSend}
            className="bg-purple-500 hover:bg-purple-600 px-4 py-2 rounded-xl transition"
          >
            Send
          </button>
        </div>
      </div>

      <p className="mt-4 text-sm text-gray-500">Powered by Gemini | Built with 💜 by Keshava</p>
    </div>
  );
};

export default App;

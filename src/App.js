import React, { useEffect, useState, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, addDoc, onSnapshot, serverTimestamp, query, orderBy } from 'firebase/firestore';
import { GoogleGenerativeAI } from '@google/generative-ai';
import Markdown from 'react-markdown';
import './App.css';

const firebaseConfig = JSON.parse(process.env.REACT_APP_FIREBASE_CONFIG || '{}');
const appId = process.env.REACT_APP_APP_ID || 'default-app';
const initialAuthToken = process.env.REACT_APP_INITIAL_AUTH_TOKEN || null;
const apiKey = process.env.REACT_APP_GEMINI_API_KEY || '';

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const genAI = new GoogleGenerativeAI(apiKey);

function App() {
  const [prompt, setPrompt] = useState('');
  const [messages, setMessages] = useState([]);
  const [userId, setUserId] = useState(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [selectedImageFile, setSelectedImageFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const messagesContainerRef = useRef(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserId(user.uid);
        setIsAuthReady(true);
      } else {
        setIsAuthReady(false);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!isAuthReady) return;
    const signIn = async () => {
      if (initialAuthToken) {
        await signInWithCustomToken(auth, initialAuthToken);
      } else {
        await signInAnonymously(auth);
      }
    };
    signIn();
  }, [isAuthReady]);

  useEffect(() => {
    if (!userId) return;
    const messagesRef = collection(db, `artifacts/${appId}/users/${userId}/messages`);
    const q = query(messagesRef, orderBy('timestamp'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const messagesData = snapshot.docs.map(doc => doc.data());
      setMessages(messagesData);
    });
    return () => unsubscribe();
  }, [userId]);

  useEffect(() => {
    messagesContainerRef.current?.scrollTo({ top: messagesContainerRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const saveMessageToFirestore = async (msg) => {
    if (!userId) return;
    const messagesRef = collection(db, `artifacts/${appId}/users/${userId}/messages`);
    await addDoc(messagesRef, {
      ...msg,
      timestamp: serverTimestamp()
    });
  };

  const handleSendPrompt = async () => {
    if (!prompt.trim()) return;
    const userMsg = { role: 'user', text: prompt };
    setMessages(prev => [...prev, userMsg]);
    await saveMessageToFirestore(userMsg);
    setPrompt('');
    setIsLoading(true);

    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = await response.text();
      const botMsg = { role: 'model', text };
      setMessages(prev => [...prev, botMsg]);
      await saveMessageToFirestore(botMsg);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const analyzeUploadedImage = async (base64Data) => {
    if (!base64Data) return;
    const imageMsg = { role: 'user', text: 'Uploaded an image for analysis.' };
    setMessages(prev => [...prev, imageMsg]);
    await saveMessageToFirestore(imageMsg);
    setIsLoading(true);

    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-pro-vision' });
      const imageParts = [
        {
          inlineData: {
            data: base64Data.split(',')[1],
            mimeType: 'image/jpeg',
          },
        },
      ];
      const result = await model.generateContent(["Describe this image in detail", ...imageParts]);
      const response = await result.response;
      const text = await response.text();
      const botMsg = { role: 'model', text };
      setMessages(prev => [...prev, botMsg]);
      await saveMessageToFirestore(botMsg);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    setSelectedImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64Data = reader.result;
      analyzeUploadedImage(base64Data);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="app-container">
      <h1>Bean Assistant</h1>
      <div className="messages-container" ref={messagesContainerRef}>
        {messages.map((msg, idx) => (
          <div key={idx} className={`message ${msg.role}`}>
            <Markdown>{msg.text}</Markdown>
          </div>
        ))}
        {isLoading && <div className="message model">Typing...</div>}
      </div>
      <div className="input-container">
        <input
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Ask me anything..."
        />
        <button onClick={handleSendPrompt}>Send</button>
        <input type="file" accept="image/*" onChange={handleImageUpload} />
      </div>
    </div>
  );
}

export default App;

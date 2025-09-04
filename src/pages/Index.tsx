import { useState } from 'react';
import { Header } from '@/components/Header';
import { ChatInterface } from '@/components/ChatInterface';
import { FileUpload, FileAnalysisDisplay } from '@/components/FileUpload';
import { ImageGeneration } from '@/components/ImageGeneration';
import { type ChatMessage } from '@/lib/openai';
import { type FileAnalysisResult } from '@/lib/fileAnalysis';

const Index = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [fileAnalysis, setFileAnalysis] = useState<FileAnalysisResult | null>(null);

  const handleFileAnalyzed = (analysis: FileAnalysisResult) => {
    setFileAnalysis(analysis);
    
    // Add file analysis to chat
    const fileMessage: ChatMessage = {
      role: 'user',
      content: `I've uploaded a file: ${analysis.fileName}\n\nFile details:\n- Type: ${analysis.type}\n- Size: ${analysis.size}\n${analysis.wordCount ? `- Word count: ${analysis.wordCount}` : ''}\n\nContent preview:\n${analysis.content.substring(0, 500)}${analysis.content.length > 500 ? '...' : ''}`,
      timestamp: new Date(),
      type: 'file',
      metadata: analysis
    };
    
    setMessages(prev => [...prev, fileMessage]);
  };

  const handleImageGenerated = (imageUrl: string, prompt: string) => {
    const imageMessage: ChatMessage = {
      role: 'assistant',
      content: `I've generated an image based on your prompt: "${prompt}"\n\nImage URL: ${imageUrl}`,
      timestamp: new Date(),
      type: 'image',
      metadata: { imageUrl, prompt }
    };
    
    setMessages(prev => [...prev, imageMessage]);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-4 max-w-7xl">
        <div className="space-y-6">
          <Header />
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
            {/* Main Chat Interface */}
            <div className="lg:col-span-2">
              <ChatInterface
                messages={messages}
                onMessagesUpdate={setMessages}
                className="h-full"
              />
            </div>
            
            {/* Side Panel */}
            <div className="space-y-6">
              {/* File Upload */}
              <FileUpload onFileAnalyzed={handleFileAnalyzed} />
              
              {/* File Analysis Display */}
              {fileAnalysis && (
                <FileAnalysisDisplay analysis={fileAnalysis} />
              )}
              
              {/* Image Generation */}
              <ImageGeneration onImageGenerated={handleImageGenerated} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;

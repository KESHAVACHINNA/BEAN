import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { OpenAIService } from '@/lib/openai';
import { ImageIcon, Loader2, Download, Wand2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ImageGenerationProps {
  onImageGenerated?: (imageUrl: string, prompt: string) => void;
  className?: string;
}

export const ImageGeneration = ({ onImageGenerated, className }: ImageGenerationProps) => {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [lastPrompt, setLastPrompt] = useState('');
  const { toast } = useToast();

  const handleGenerate = async () => {
    if (!prompt.trim() || isGenerating) return;

    setIsGenerating(true);
    try {
      const imageUrl = await OpenAIService.generateImage(prompt);
      setGeneratedImage(imageUrl);
      setLastPrompt(prompt);
      onImageGenerated?.(imageUrl, prompt);
      
      toast({
        title: 'Image Generated Successfully',
        description: 'Your AI-generated image is ready!'
      });
    } catch (error) {
      console.error('Error generating image:', error);
      toast({
        title: 'Generation Failed',
        description: 'Failed to generate image. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!generatedImage) return;
    
    const link = document.createElement('a');
    link.href = generatedImage;
    link.download = `bean-generated-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const suggestedPrompts = [
    "A futuristic cityscape at sunset with flying cars",
    "A cozy coffee shop in a magical forest",
    "Abstract geometric patterns in vibrant colors",
    "A serene mountain landscape with aurora borealis"
  ];

  return (
    <Card className={cn("card-gradient border-border/50", className)}>
      <div className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Wand2 className="w-5 h-5 text-ai-primary" />
          <h3 className="text-lg font-semibold">AI Image Generation</h3>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">
              Describe the image you want to create
            </label>
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="A detailed description of your desired image..."
              className="min-h-[100px] resize-none"
              disabled={isGenerating}
            />
          </div>
          
          <Button
            onClick={handleGenerate}
            disabled={!prompt.trim() || isGenerating}
            className="w-full bg-gradient-button hover:opacity-90 transition-opacity"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating Image...
              </>
            ) : (
              <>
                <ImageIcon className="w-4 h-4 mr-2" />
                Generate Image
              </>
            )}
          </Button>
          
          {generatedImage && (
            <div className="space-y-4">
              <div className="relative rounded-lg overflow-hidden bg-muted">
                <img
                  src={generatedImage}
                  alt={lastPrompt}
                  className="w-full h-auto"
                />
                <Button
                  onClick={handleDownload}
                  size="sm"
                  className="absolute top-2 right-2 bg-black/50 hover:bg-black/70"
                >
                  <Download className="w-4 h-4" />
                </Button>
              </div>
              
              <div className="bg-ai-primary/10 rounded-lg p-3 border border-ai-primary/20">
                <p className="text-sm">
                  <span className="font-medium text-ai-primary">Prompt:</span> {lastPrompt}
                </p>
              </div>
            </div>
          )}
          
          <div>
            <p className="text-sm font-medium mb-2">Try these prompts:</p>
            <div className="grid grid-cols-1 gap-2">
              {suggestedPrompts.map((suggestion, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={() => setPrompt(suggestion)}
                  className="justify-start text-left h-auto py-2 px-3"
                  disabled={isGenerating}
                >
                  <span className="text-xs">{suggestion}</span>
                </Button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};
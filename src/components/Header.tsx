import { Card } from '@/components/ui/card';
import { Bot, Sparkles } from 'lucide-react';

export const Header = () => {
  return (
    <Card className="card-gradient border-border/50 glow-effect">
      <div className="p-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-gradient-primary flex items-center justify-center glow-effect">
            <Bot className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold gradient-text flex items-center gap-2">
              Bean AI Assistant
              <Sparkles className="w-5 h-5 text-ai-secondary" />
            </h1>
            <p className="text-muted-foreground">
              Your intelligent companion for text, images, and file analysis
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
};
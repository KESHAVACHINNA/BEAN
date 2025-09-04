import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { FileAnalysisService, type FileAnalysisResult } from '@/lib/fileAnalysis';
import { OpenAIService } from '@/lib/openai';
import { Upload, File, FileText, Image, Loader2, Eye, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FileUploadProps {
  onFileAnalyzed: (analysis: FileAnalysisResult) => void;
  className?: string;
}

export const FileUpload = ({ onFileAnalyzed, className }: FileUploadProps) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentFile, setCurrentFile] = useState<File | null>(null);
  const { toast } = useToast();

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setCurrentFile(file);
    setIsAnalyzing(true);

    try {
      const analysis = await FileAnalysisService.analyzeFile(file);
      onFileAnalyzed(analysis);
      
      toast({
        title: 'File Analyzed Successfully',
        description: `${file.name} has been processed and analyzed.`
      });
    } catch (error) {
      console.error('Error analyzing file:', error);
      toast({
        title: 'Analysis Failed',
        description: error instanceof Error ? error.message : 'Failed to analyze file',
        variant: 'destructive'
      });
    } finally {
      setIsAnalyzing(false);
      setCurrentFile(null);
    }
  }, [onFileAnalyzed, toast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/*': ['.txt', '.md', '.csv'],
      'application/pdf': ['.pdf'],
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp']
    },
    maxFiles: 1,
    disabled: isAnalyzing
  });

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) return <Image className="w-5 h-5" />;
    if (file.type === 'application/pdf') return <FileText className="w-5 h-5" />;
    return <File className="w-5 h-5" />;
  };

  return (
    <Card className={cn("card-gradient border-border/50", className)}>
      <div className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Upload className="w-5 h-5 text-ai-primary" />
          <h3 className="text-lg font-semibold">File Analysis</h3>
        </div>
        
        <div
          {...getRootProps()}
          className={cn(
            "border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer",
            isDragActive
              ? "border-ai-primary bg-ai-primary/10"
              : "border-border hover:border-ai-primary/50",
            isAnalyzing && "pointer-events-none opacity-50"
          )}
        >
          <input {...getInputProps()} />
          
          {isAnalyzing ? (
            <div className="space-y-4">
              <Loader2 className="w-12 h-12 mx-auto animate-spin text-ai-primary" />
              <div>
                <p className="text-lg font-medium">Analyzing File...</p>
                {currentFile && (
                  <div className="flex items-center justify-center gap-2 mt-2">
                    {getFileIcon(currentFile)}
                    <span className="text-sm text-muted-foreground">{currentFile.name}</span>
                  </div>
                )}
              </div>
            </div>
          ) : isDragActive ? (
            <div className="space-y-4">
              <Upload className="w-12 h-12 mx-auto text-ai-primary" />
              <p className="text-lg font-medium">Drop the file here</p>
            </div>
          ) : (
            <div className="space-y-4">
              <Upload className="w-12 h-12 mx-auto text-muted-foreground" />
              <div>
                <p className="text-lg font-medium mb-2">Upload a file to analyze</p>
                <p className="text-sm text-muted-foreground mb-4">
                  Supports PDF, text files, and images
                </p>
                <Button variant="outline" className="mx-auto">
                  Browse Files
                </Button>
              </div>
            </div>
          )}
        </div>
        
        <div className="mt-4 grid grid-cols-1 gap-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <FileText className="w-4 h-4" />
            <span>PDF & Text files for content analysis</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Image className="w-4 h-4" />
            <span>Images for visual analysis</span>
          </div>
        </div>
      </div>
    </Card>
  );
};

interface FileAnalysisDisplayProps {
  analysis: FileAnalysisResult;
  onSummarize?: () => void;
  className?: string;
}

export const FileAnalysisDisplay = ({ analysis, onSummarize, className }: FileAnalysisDisplayProps) => {
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [summary, setSummary] = useState(analysis.summary);
  const { toast } = useToast();

  const handleSummarize = async () => {
    if (!analysis.content || isGeneratingSummary) return;
    
    setIsGeneratingSummary(true);
    try {
      const generatedSummary = await OpenAIService.summarizeText(analysis.content);
      setSummary(generatedSummary);
      onSummarize?.();
      
      toast({
        title: 'Summary Generated',
        description: 'AI summary has been created for your file.'
      });
    } catch (error) {
      console.error('Error generating summary:', error);
      toast({
        title: 'Summary Failed',
        description: 'Failed to generate summary. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  return (
    <Card className={cn("card-gradient border-border/50", className)}>
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Eye className="w-5 h-5 text-ai-primary" />
            <h3 className="text-lg font-semibold">File Analysis</h3>
          </div>
          {!summary && analysis.content && (
            <Button
              onClick={handleSummarize}
              disabled={isGeneratingSummary}
              size="sm"
              variant="outline"
              className="gap-2"
            >
              {isGeneratingSummary ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
              Summarize
            </Button>
          )}
        </div>
        
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">File:</span>
              <p className="font-medium">{analysis.fileName}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Type:</span>
              <p className="font-medium">{analysis.type}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Size:</span>
              <p className="font-medium">{analysis.size}</p>
            </div>
            {analysis.wordCount && (
              <div>
                <span className="text-muted-foreground">Words:</span>
                <p className="font-medium">{analysis.wordCount.toLocaleString()}</p>
              </div>
            )}
          </div>
          
          {summary && (
            <div className="bg-ai-primary/10 rounded-lg p-4 border border-ai-primary/20">
              <h4 className="font-semibold mb-2 text-ai-primary">AI Summary</h4>
              <p className="text-sm leading-relaxed">{summary}</p>
            </div>
          )}
          
          {analysis.metadata?.imageUrl && (
            <div className="rounded-lg overflow-hidden">
              <img
                src={analysis.metadata.imageUrl}
                alt={analysis.fileName}
                className="w-full max-h-64 object-cover"
              />
            </div>
          )}
          
          {analysis.content && (
            <div>
              <h4 className="font-semibold mb-2">Content Preview</h4>
              <div className="bg-muted rounded-lg p-4 max-h-48 overflow-y-auto">
                <pre className="text-sm whitespace-pre-wrap font-mono">
                  {FileAnalysisService.extractTextFromContent(analysis.content, 500)}
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};
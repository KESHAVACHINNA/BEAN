export interface FileAnalysisResult {
  fileName: string;
  type: string;
  size: string;
  content: string;
  summary?: string;
  wordCount?: number;
  pageCount?: number;
  metadata?: {
    imageUrl?: string;
    [key: string]: any;
  };
}

export class FileAnalysisService {
  static async analyzeFile(file: File): Promise<FileAnalysisResult> {
    const fileSizeFormatted = this.formatFileSize(file.size);
    
    if (file.type === 'application/pdf') {
      return await this.analyzePDF(file, fileSizeFormatted);
    } else if (file.type.startsWith('text/') || file.name.endsWith('.txt')) {
      return await this.analyzeTextFile(file, fileSizeFormatted);
    } else if (file.type.startsWith('image/')) {
      return await this.analyzeImageFile(file, fileSizeFormatted);
    } else {
      throw new Error(`Unsupported file type: ${file.type}`);
    }
  }

  private static async analyzePDF(file: File, size: string): Promise<FileAnalysisResult> {
    try {
      // For PDF analysis, we'll extract text content
      // Note: This is a simplified version. In a real app, you'd use pdf-parse or similar
      const arrayBuffer = await file.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      
      // Convert to text (simplified - in production, use proper PDF parsing)
      const decoder = new TextDecoder();
      let content = '';
      
      try {
        content = decoder.decode(uint8Array);
        // Remove binary data and keep only readable text
        content = content.replace(/[^\\x20-\\x7E\n\r\t]/g, '').trim();
      } catch {
        content = 'PDF content could not be extracted. This appears to be a binary PDF file.';
      }

      return {
        fileName: file.name,
        type: 'PDF Document',
        size,
        content: content || 'Unable to extract text content from this PDF.',
        wordCount: content ? content.split(/\s+/).filter(word => word.length > 0).length : 0
      };
    } catch (error) {
      console.error('Error analyzing PDF:', error);
      throw new Error('Failed to analyze PDF file');
    }
  }

  private static async analyzeTextFile(file: File, size: string): Promise<FileAnalysisResult> {
    try {
      const content = await file.text();
      const wordCount = content.split(/\s+/).filter(word => word.length > 0).length;
      
      return {
        fileName: file.name,
        type: 'Text Document',
        size,
        content,
        wordCount
      };
    } catch (error) {
      console.error('Error analyzing text file:', error);
      throw new Error('Failed to analyze text file');
    }
  }

  private static async analyzeImageFile(file: File, size: string): Promise<FileAnalysisResult> {
    try {
      const imageUrl = URL.createObjectURL(file);
      
      return {
        fileName: file.name,
        type: 'Image File',
        size,
        content: `Image file: ${file.name}\nDimensions: Will be determined when loaded\nFormat: ${file.type}`,
        metadata: { imageUrl }
      };
    } catch (error) {
      console.error('Error analyzing image file:', error);
      throw new Error('Failed to analyze image file');
    }
  }

  private static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  static extractTextFromContent(content: string, maxLength: number = 1000): string {
    if (content.length <= maxLength) return content;
    
    return content.substring(0, maxLength) + '...';
  }
}

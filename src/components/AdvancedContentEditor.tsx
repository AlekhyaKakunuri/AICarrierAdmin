import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
// import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Eye, 
  Code, 
  ExternalLink,
  Undo,
  Redo
} from 'lucide-react';

interface AdvancedContentEditorProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
}

const AdvancedContentEditor = ({ 
  value, 
  onChange, 
  label = "Content (HTML)", 
  placeholder = "Enter your content..."
}: AdvancedContentEditorProps) => {
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit');
  const [history, setHistory] = useState<string[]>([value]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  // Save state to history
  const saveToHistory = (newValue: string) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newValue);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  // Undo
  const handleUndo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      onChange(history[newIndex]);
    }
  };

  // Redo
  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      onChange(history[newIndex]);
    }
  };

  // Handle HTML changes
  const handleHtmlChange = (htmlValue: string) => {
    onChange(htmlValue);
    saveToHistory(htmlValue);
  };

  // Open in new window for better editing
  const openInNewWindow = () => {
    const newWindow = window.open('', '_blank', 'width=1400,height=900,scrollbars=yes,resizable=yes');
    if (newWindow) {
      newWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Content Editor</title>
          <style>
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
              margin: 0; 
              padding: 20px; 
              background: #f8f9fa;
            }
            .editor-container {
              max-width: 1200px;
              margin: 0 auto;
              background: white;
              border-radius: 8px;
              box-shadow: 0 2px 10px rgba(0,0,0,0.1);
              overflow: hidden;
            }
            .editor-header {
              background: #f1f3f4;
              padding: 15px 20px;
              border-bottom: 1px solid #e0e0e0;
              display: flex;
              justify-content: space-between;
              align-items: center;
            }
            .editor-content {
              padding: 20px;
            }
            .captioned-image-container { 
              margin: 20px 0; 
              line-height: 1.6;
            }
            .captioned-image-container img { 
              max-width: 100%; 
              height: auto; 
              border-radius: 8px;
              box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            }
            .image-caption { 
              font-style: italic; 
              color: #666; 
              margin-top: 10px; 
              text-align: center;
            }
            pre { 
              background: #f5f5f5; 
              padding: 15px; 
              border-radius: 5px; 
              overflow-x: auto; 
              border-left: 4px solid #007acc;
            }
            code { 
              background: #f5f5f5; 
              padding: 2px 6px; 
              border-radius: 3px; 
              font-family: 'Monaco', 'Menlo', monospace;
            }
            h1, h2, h3, h4, h5, h6 {
              color: #333;
              margin-top: 30px;
              margin-bottom: 15px;
            }
            p {
              margin-bottom: 15px;
              line-height: 1.6;
            }
            .btn {
              background: #007acc;
              color: white;
              border: none;
              padding: 8px 16px;
              border-radius: 4px;
              cursor: pointer;
              font-size: 14px;
            }
            .btn:hover {
              background: #005a9e;
            }
            textarea {
              width: 100%;
              min-height: 400px;
              padding: 15px;
              border: 1px solid #ddd;
              border-radius: 4px;
              font-family: 'Monaco', 'Menlo', monospace;
              font-size: 14px;
              line-height: 1.5;
            }
          </style>
        </head>
        <body>
          <div class="editor-container">
            <div class="editor-header">
              <h2>Content Editor</h2>
              <button class="btn" onclick="saveAndClose()">Save & Close</button>
            </div>
            <div class="editor-content">
              <textarea id="contentEditor" placeholder="Edit your content here...">${value}</textarea>
              <div style="margin-top: 20px;">
                <h3>Preview:</h3>
                <div id="preview" style="border: 1px solid #ddd; padding: 20px; margin-top: 10px; background: white; border-radius: 4px;"></div>
              </div>
            </div>
          </div>
          
          <script>
            const textarea = document.getElementById('contentEditor');
            const preview = document.getElementById('preview');
            
            function updatePreview() {
              preview.innerHTML = textarea.value;
            }
            
            textarea.addEventListener('input', updatePreview);
            updatePreview();
            
            function saveAndClose() {
              window.opener.postMessage({
                type: 'content-update',
                content: textarea.value
              }, '*');
              window.close();
            }
            
            // Listen for messages from parent
            window.addEventListener('message', function(event) {
              if (event.data.type === 'content-update') {
                textarea.value = event.data.content;
                updatePreview();
              }
            });
          </script>
        </body>
        </html>
      `);
    }
  };

  // Listen for messages from popup
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'content-update') {
        handleHtmlChange(event.data.content);
      }
    };
    
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-lg font-medium">{label}</Label>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleUndo}
            disabled={historyIndex <= 0}
          >
            <Undo className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleRedo}
            disabled={historyIndex >= history.length - 1}
          >
            <Redo className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={openInNewWindow}
          >
            <ExternalLink className="h-4 w-4 mr-1" />
            Open Editor
          </Button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
        <Button
          type="button"
          variant={activeTab === 'edit' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('edit')}
          className="flex items-center gap-2"
        >
          <Code className="h-4 w-4" />
          HTML Edit
        </Button>
        <Button
          type="button"
          variant={activeTab === 'preview' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('preview')}
          className="flex items-center gap-2"
        >
          <Eye className="h-4 w-4" />
          Preview
        </Button>
      </div>

      {/* Tab Content */}
      <div className="mt-4">
        {activeTab === 'edit' && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">HTML Source</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                ref={textareaRef}
                value={value}
                onChange={(e) => handleHtmlChange(e.target.value)}
                placeholder={placeholder}
                className="font-mono text-sm min-h-[400px]"
              />
            </CardContent>
          </Card>
        )}

        {activeTab === 'preview' && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Content Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <div 
                ref={previewRef}
                className="prose max-w-none"
                dangerouslySetInnerHTML={{ __html: value }}
                style={{
                  fontFamily: 'system-ui, -apple-system, sans-serif',
                  lineHeight: '1.6'
                }}
              />
            </CardContent>
          </Card>
        )}

      </div>
    </div>
  );
};

export default AdvancedContentEditor;

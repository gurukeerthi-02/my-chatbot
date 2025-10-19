import React from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus, vs } from 'react-syntax-highlighter/dist/esm/styles/prism';

const MessageFormatter = ({ content, darkMode }) => {
  const decodeHtml = (text) => {
    return text
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/\\u003e/g, '>')
      .replace(/\\u003c/g, '<')
      .replace(/\\n/g, '\n')
      .replace(/\\t/g, '\t')
      .replace(/\\\\/g, '/');
  };
  
  const formatMessage = (text) => {
    // Decode HTML entities first
    text = decodeHtml(text);
    const parts = [];
    let lastIndex = 0;
    
    // Match code blocks with ```language or just ```
    const codeBlockRegex = /```(\w+)?\n?([\s\S]*?)```/g;
    let match;
    
    while ((match = codeBlockRegex.exec(text)) !== null) {
      // Add text before code block
      if (match.index > lastIndex) {
        const beforeText = text.slice(lastIndex, match.index);
        parts.push(...formatInlineElements(beforeText));
      }
      
      // Add code block
      const language = match[1] || 'text';
      const code = match[2].trim();
      
      parts.push(
        <div key={match.index} className="code-block">
          <div className="code-header">
            <span className="code-language">{language}</span>
            <button 
              onClick={() => navigator.clipboard.writeText(code)}
              className="code-copy-btn"
              title="Copy code"
            >
              📋
            </button>
          </div>
          <SyntaxHighlighter
            language={language}
            style={darkMode ? vscDarkPlus : vs}
            customStyle={{
              margin: 0,
              borderRadius: '0 0 8px 8px',
              fontSize: '14px'
            }}
          >
            {code}
          </SyntaxHighlighter>
        </div>
      );
      
      lastIndex = match.index + match[0].length;
    }
    
    // Add remaining text
    if (lastIndex < text.length) {
      const remainingText = text.slice(lastIndex);
      parts.push(...formatInlineElements(remainingText));
    }
    
    return parts.length > 0 ? parts : formatInlineElements(text);
  };
  
  const formatInlineElements = (text) => {
    // Clean up escape sequences
    text = text.replace(/\\n/g, '\n').replace(/\\t/g, '\t');
    
    // Split by lines to handle headers and lists
    const lines = text.split('\n');
    const elements = [];
    
    lines.forEach((line, lineIndex) => {
      // Handle headers
      if (line.match(/^\*\*[^*]+\*\*$/)) {
        const headerText = line.replace(/^\*\*|\*\*$/g, '');
        elements.push(
          <h3 key={`header-${lineIndex}`} className="text-lg font-bold mt-4 mb-2 text-gray-800 dark:text-white">
            {headerText}
          </h3>
        );
      }
      // Handle numbered lists (including those with extra spaces or formatting)
      else if (line.match(/^\s*\d+\.\s/)) {
        const listText = line.replace(/^\s*\d+\.\s/, '');
        const number = line.match(/\d+/)[0];
        elements.push(
          <div key={`list-${lineIndex}`} className="ml-4 mb-3 flex items-start">
            <span className="font-bold text-blue-600 dark:text-blue-400 mr-3 min-w-[24px] mt-0.5">{number}.</span>
            <div className="flex-1">{formatTextWithInlineCode(listText)}</div>
          </div>
        );
      }
      // Handle bullet points (convert to regular text)
      else if (line.match(/^\s*[-*]\s/)) {
        const listText = line.replace(/^\s*[-*]\s/, '');
        elements.push(
          <p key={`text-${lineIndex}`} className="mb-4 leading-relaxed ml-4">
            {formatTextWithInlineCode(listText)}
          </p>
        );
      }
      // Handle regular text
      else if (line.trim()) {
        elements.push(
          <p key={`line-${lineIndex}`} className="mb-4 leading-relaxed">
            {formatTextWithInlineCode(line)}
          </p>
        );
      }
    });
    
    return elements.length > 0 ? elements : [<span key="full-text">{text}</span>];
  };
  
  const formatTextWithInlineCode = (text) => {
    const parts = [];
    let lastIndex = 0;
    
    // Match inline code
    const inlineCodeRegex = /`([^`]+)`/g;
    let match;
    
    while ((match = inlineCodeRegex.exec(text)) !== null) {
      // Add text before inline code
      if (match.index > lastIndex) {
        parts.push(text.slice(lastIndex, match.index));
      }
      
      // Add inline code
      parts.push(
        <code key={match.index} className="inline-code">
          {match[1]}
        </code>
      );
      
      lastIndex = match.index + match[0].length;
    }
    
    // Add remaining text
    if (lastIndex < text.length) {
      parts.push(text.slice(lastIndex));
    }
    
    return parts.length > 0 ? parts : text;
  };
  
  // Handle image content
  if (content.startsWith('![') && content.includes('](data:image/')) {
    const imageMatch = content.match(/!\[.*?\]\((data:image\/[^)]+)\)/);
    if (imageMatch) {
      const downloadImage = () => {
        const link = document.createElement('a');
        link.href = imageMatch[1];
        link.download = `generated-image-${Date.now()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      };
      
      return (
        <div className="formatted-message relative group">
          <img 
            src={imageMatch[1]} 
            alt="Generated Image" 
            className="max-w-full h-auto rounded-lg shadow-lg"
            style={{ maxHeight: '400px' }}
          />
          <button
            onClick={downloadImage}
            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 bg-black/50 hover:bg-black/70 text-white p-2 rounded-lg transition-all duration-200"
            title="Download Image"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-4-4m4 4l4-4m-6 8h8a2 2 0 002-2V7a2 2 0 00-2-2H8a2 2 0 00-2 2v11a2 2 0 002 2z" />
            </svg>
          </button>
        </div>
      );
    }
  }
  
  return <div className="formatted-message whitespace-pre-wrap leading-relaxed">{formatMessage(content)}</div>;
};

export default MessageFormatter;
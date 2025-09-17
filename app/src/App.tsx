import React, { useState, useRef, useEffect } from 'react';
import './App.css';
import CodeBlock from './CodeBlock';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';


// Define the structure for metadata
interface Metadata {
  model_name?: string;
  token_usage?: {
    input: number;
    output: number;
  };
  langgraph_trace?: {
    node: string;
    turn: number;
  };
  reasoning?: any; // Can be complex object from LLM output
}

// Define the structure of a chat message
interface Message {
  id: string;
  type: 'human' | 'ai';
  content: string;
  metadata?: Metadata;
}

function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (input.trim() === '' || isLoading) return;
    const userPrompt = input;
    setInput('');
    setIsLoading(true);

    const humanMessage: Message = { id: crypto.randomUUID(), type: 'human', content: userPrompt };
    setMessages(prev => [...prev, humanMessage]);
    
    const aiMessage: Message = { id: crypto.randomUUID(), type: 'ai', content: '' };
    setMessages(prev => [...prev, aiMessage]);

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const ctrl = new AbortController();
    abortControllerRef.current = ctrl;

    try {
      const response = await fetch('http://localhost:8000/chat/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          prompt: humanMessage.content
        }),
        signal: ctrl.signal
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('Failed to get readable stream.');
      }

      const decoder = new TextDecoder();
      let incompleteLine = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          break;
        }

        const chunkText = decoder.decode(value, { stream: true });
        const lines = (incompleteLine + chunkText).split('\n');
        incompleteLine = lines.pop() || '';
        
        for (const line of lines) {
          if (line.trim() === '') continue;
          
          const parsedChunk = JSON.parse(line);
          const { type, data } = parsedChunk;

          if (type === 'message') {
            setMessages(prev => prev.map(msg => 
              msg.id === aiMessage.id ? { ...msg, content: msg.content + data } : msg
            ));
          } else if (type === 'end') {
            console.log('Stream ended.');
            setIsLoading(false);
            abortControllerRef.current = null;
            return; // 스트림 처리 종료
          } else if (type === 'error') {
            throw new Error(data);
          }
        }
      }

    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.log('Fetch aborted.');
      } else {
        console.error('Streaming failed:', error);
        setMessages(prev => prev.map(msg => 
          msg.id === aiMessage.id ? { ...msg, content: 'Error connecting to the backend.' } : msg
        ));
      }
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  };

  return (
    <>
      <div className="chat-container" ref={chatContainerRef}>
        {messages.map(msg => (
          <div key={msg.id} className={`chat-message ${msg.type}`}>
            <div className="message-content">
              {msg.type === 'ai' ? (
                <ReactMarkdown 
                  remarkPlugins={[remarkGfm]} 
                  rehypePlugins={[rehypeRaw]}
                  components={{
                    code: CodeBlock,
                  }}
                >
                  {msg.content}
                </ReactMarkdown>
              ) : (
                msg.content.split('\n').map((line, i) => (
                  <React.Fragment key={i}>{line}{i !== msg.content.split('\n').length - 1 && <br />}</React.Fragment>
                ))
              )}
            </div>
          </div>
        ))}
      </div>
      <form
        className="chat-input-form"
        onSubmit={e => {
          e.preventDefault();
          handleSend();
        }}
      >
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Type your message..."
        />
        <button type="submit" disabled={isLoading}>
          {isLoading ? 'Sending...' : 'Send'}
        </button>
      </form>
    </>
  );
}

export default App;
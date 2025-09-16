import React, { useState, useRef, useEffect } from 'react';
import './App.css';
import CodeBlock from './CodeBlock';
import Collapsible from './Collapsible';
import MetadataView from './MetadataView';
import { fetchEventSource } from '@microsoft/fetch-event-source';
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

    // Abort any existing connection
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const ctrl = new AbortController();
    abortControllerRef.current = ctrl;

    fetchEventSource('http://localhost:8123/api/chat/stream', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        graph_name: 'Ollama_Agent',
        input: {
          'chat_history': [],
          'messages': [{'type': humanMessage.type, 'content': humanMessage.content}]
        },
        config: {
          'configurable': {
            'thread_id': crypto.randomUUID(),
            'additional_options': {
              'ollama': {
                'model': 'gpt-oss:20b',
                'reasoning': true
              }
            }
          }
        }
      }),
      signal: ctrl.signal,
      onopen: async (response) => {
        if (response.ok) {
          console.log('Connection to server opened.');
          return;
        }
        throw new Error(`Failed to connect. Status: ${response.status}`);
      },
      onmessage: (event) => {
        if (event.event === 'end') {
          console.log('Stream ended.');
          setIsLoading(false);
          if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            abortControllerRef.current = null;
          }
          return;
        }

        if (event.event === 'message') {
          console.log('Stream message.', event);
          const data = JSON.parse(event.data)
          setMessages(prev => prev.map(msg => 
            msg.id === aiMessage.id ? { ...msg, content: msg.content + data.chunk.content } : msg
          ));
        }

        // if (event.event === 'metadata') {
        //   const metadataChunk = JSON.parse(event.data);
        //   setMessages(prev => prev.map(msg => {
        //     if (msg.id !== aiMessage.id) return msg;
        //     const updatedMetadata = { ...msg.metadata, ...metadataChunk };
        //     if (metadataChunk.reasoning) {
        //         updatedMetadata.reasoning = metadataChunk.reasoning;
        //     }
        //     return { ...msg, metadata: updatedMetadata };
        //   }));
        // }
      },
      onerror: (error) => {
        console.error('EventSource failed:', error);
        setMessages(prev => prev.map(msg => 
          msg.id === aiMessage.id ? { ...msg, content: 'Error connecting to the backend.' } : msg
        ));
        setIsLoading(false);
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
          abortControllerRef.current = null;
        }
        // Throwing the error will prevent retries
        throw error;
      }
    }).catch(error => {
      // This will catch fatal errors, like the ones thrown from onopen or onerror.
      if (error.name !== 'AbortError') {
        console.error('Fetch Event Source fatal error:', error);
      }
    });
  };

  return (
    <>
      <div className="chat-container" ref={chatContainerRef}>
        {messages.map(msg => (
          <div key={msg.id} className={`chat-message ${msg.type}`}>
            {msg.type === 'ai' && msg.metadata && Object.keys(msg.metadata).length > 0 && (
              <Collapsible title="Details">
                <MetadataView data={msg.metadata} />
              </Collapsible>
            )}
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
import React, { useState, useRef, useEffect } from 'react';
import CodeBlock from './CodeBlock';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { Box, Flex, VStack, Textarea, IconButton, Avatar } from '@chakra-ui/react';
import { ArrowUpIcon } from '@chakra-ui/icons';
import TextareaAutosize from 'react-textarea-autosize';

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
            return;
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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <Flex h="100vh" flexDirection="column" maxW="800px" mx="auto">
      <VStack flex="1" overflowY="auto" spacing="4" p="4" ref={chatContainerRef}>
        {messages.map(msg => (
          <Flex key={msg.id} w="full" justify={msg.type === 'human' ? 'flex-end' : 'flex-start'}>
            {msg.type === 'ai' && <Avatar size="sm" mr="3" />}
            <Box
              bg={msg.type === 'human' ? 'blue.500' : 'gray.600'}
              color="white"
              p="3"
              borderRadius="lg"
              maxW="80%"
            >
              <ReactMarkdown 
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeRaw]}
                components={{
                  code: CodeBlock,
                }}
              >
                {msg.content}
              </ReactMarkdown>
            </Box>
            {msg.type === 'human' && <Avatar size="sm" ml="3" />}
          </Flex>
        ))}
      </VStack>
      <Box p="4">
        <Flex as="form" onSubmit={e => { e.preventDefault(); handleSend(); }} align="flex-end">
          <Textarea
            as={TextareaAutosize}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message..."
            variant="filled"
            minRows={1}
            maxRows={6}
            mr="2"
            flex="1"
            resize="none"
          />
          <IconButton
            aria-label="Send message"
            icon={<ArrowUpIcon />}
            type="submit"
            isLoading={isLoading}
            isDisabled={input.trim() === ''}
            colorScheme="blue"
            isRound
          />
        </Flex>
      </Box>
    </Flex>
  );
}

export default App;

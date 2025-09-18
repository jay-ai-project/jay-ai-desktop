import React, { useState, useRef, useEffect } from 'react';
import Prose from './Prose';
import { Box, Flex, VStack, Textarea, IconButton, Avatar, HStack, Tag, TagLabel, TagCloseButton } from '@chakra-ui/react';
import { ArrowUpIcon, SettingsIcon, AttachmentIcon, InfoIcon } from '@chakra-ui/icons';
import TextareaAutosize from 'react-textarea-autosize';
import AIMessage from './AIMessage';

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
  attachments?: File[];
}

function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if ((input.trim() === '' && attachments.length === 0) || isLoading) return;
    let userPrompt = input;
    if (attachments.length > 0) {
      const fileNames = attachments.map(file => file.name).join(', ');
      userPrompt = `${userPrompt}\n\nAttached files: ${fileNames}`;
    }

    setInput('');
    setAttachments([]);
    setIsLoading(true);

    const humanMessage: Message = { id: crypto.randomUUID(), type: 'human', content: userPrompt, attachments };
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

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setAttachments(prev => [...prev, ...Array.from(e.dataTransfer.files)]);
      e.dataTransfer.clearData();
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <Flex h="100vh" flexDirection="column" maxW="800px" mx="auto">
      <VStack
        flex="1"
        overflowY="auto"
        spacing="4"
        p="4"
        ref={chatContainerRef}
        sx={{
          '&::-webkit-scrollbar': {
            width: '6px',
          },
          '&::-webkit-scrollbar-track': {
            background: 'transparent',
          },
          '&::-webkit-scrollbar-thumb': {
            background: 'gray.700',
            borderRadius: '3px',
          },
          '&::-webkit-scrollbar-thumb:hover': {
            background: 'gray.600',
          },
        }}
      >
        {messages.map(msg =>
          msg.type === 'ai' ? (
            <AIMessage key={msg.id} message={msg} />
          ) : (
            <Flex key={msg.id} w="full" justify={'flex-end'}>
              <Box
                bg={'blue.500'}
                color="white"
                p="3"
                borderRadius="lg"
                maxW="80%"
              >
                <Prose markdown={msg.content} />
              </Box>
              <Avatar size="sm" ml="3" />
            </Flex>
          )
        )}
      </VStack>
      <Box p="4">
        <Box
          border="2px dashed"
          borderColor={isDragging ? 'blue.500' : 'transparent'}
          borderRadius="md"
          p="2"
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          <Flex as="form" onSubmit={e => { e.preventDefault(); handleSend(); }} align="flex-end">
            <VStack
              flex="1"
              mr="2"
              borderWidth="1px"
              borderColor="transparent"
              borderRadius="md"
              bg="gray.700"
              _focusWithin={{
                borderColor: 'blue.500',
                boxShadow: '0 0 0 1px blue.500',
              }}
              align="stretch"
              spacing={2}
              p={2}
            >
              <Textarea
                minH="1rem"
                as={TextareaAutosize}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type your message or drop files here..."
                variant="unstyled"
                minRows={1}
                maxRows={6}
                resize="none"
                p={1}
              />
              <HStack spacing="2">
                <IconButton
                  aria-label="Settings"
                  icon={<SettingsIcon />}
                  size="sm"
                  variant="ghost"
                />
                <IconButton
                  aria-label="Attach file"
                  icon={<AttachmentIcon />}
                  size="sm"
                  variant="ghost"
                />
                <IconButton
                  aria-label="Tool"
                  icon={<InfoIcon />} // Placeholder for tool icon
                  size="sm"
                  variant="ghost"
                />
              </HStack>
            </VStack>
            <IconButton
              aria-label="Send message"
              icon={<ArrowUpIcon />}
              type="submit"
              isLoading={isLoading}
              isDisabled={(input.trim() === '' && attachments.length === 0)}
              colorScheme="blue"
              isRound
            />
          </Flex>
          {attachments.length > 0 && (
            <HStack mt="2" spacing="2">
              {attachments.map((file, index) => (
                <Tag key={index} size="lg" colorScheme="blue" borderRadius="full">
                  <TagLabel>{file.name}</TagLabel>
                  <TagCloseButton onClick={() => removeAttachment(index)} />
                </Tag>
              ))}
            </HStack>
          )}
        </Box>
      </Box>
    </Flex>
  );
}

export default App;

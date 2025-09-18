import { Box, IconButton, useClipboard, Flex, Avatar } from '@chakra-ui/react';
import { CopyIcon, CheckIcon } from '@chakra-ui/icons';
import Prose from './Prose';

// This interface should be kept in sync with App.tsx or moved to a shared types file.
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
    reasoning?: any;
  }
  
interface Message {
  id: string;
  type: 'human' | 'ai';
  content: string;
  metadata?: Metadata;
}

interface AIMessageProps {
  message: Message;
}

const AIMessage = ({ message }: AIMessageProps) => {
  const { onCopy, hasCopied } = useClipboard(message.content);

  return (
    <Flex w="full" justify={'flex-start'} role="group">
      <Avatar size="sm" mr="3" />
      <Box
        position="relative"
        bg={'gray.600'}
        color="white"
        p="3"
        borderRadius="lg"
        maxW="80%"
      >
        <Prose markdown={message.content} />
        <IconButton
          aria-label="Copy message content"
          icon={hasCopied ? <CheckIcon color="green.400" /> : <CopyIcon />}
          size="sm"
          onClick={onCopy}
          position="absolute"
          bottom="2"
          right="2"
          colorScheme="whiteAlpha"
          variant="ghost"
          isRound
          opacity={0}
          transition="opacity 0.2s ease-in-out"
          _groupHover={{ opacity: 1 }}
          _hover={{ bg: 'whiteAlpha.300' }}
        />
      </Box>
    </Flex>
  );
};

export default AIMessage;

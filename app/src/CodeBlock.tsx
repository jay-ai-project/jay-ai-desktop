import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Box, IconButton, useClipboard } from '@chakra-ui/react';
import { CopyIcon, CheckIcon } from '@chakra-ui/icons';

interface CodeBlockProps {
    language: string;
    codeString: string;
}

const CodeBlock = ({ language, codeString }: CodeBlockProps) => {
    const { onCopy, hasCopied } = useClipboard(codeString);

    return (
        <Box position="relative" my="4" borderRadius="md" overflow="hidden" role="group">
            <SyntaxHighlighter
                style={vscDarkPlus}
                language={language}
                PreTag="div"
            >
                {codeString}
            </SyntaxHighlighter>
            <IconButton
                aria-label="Copy code"
                icon={hasCopied ? <CheckIcon color="green.400" /> : <CopyIcon />}
                size="sm"
                onClick={onCopy}
                position="absolute"
                top="2"
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
    );
};
    
export default CodeBlock;

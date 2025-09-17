import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useCopyToClipboard } from "@uidotdev/usehooks";
import { Button, Box } from '@chakra-ui/react';

interface CodeBlockProps {
    language: string;
    codeString: string;
}

const CodeBlock = ({ language, codeString }: CodeBlockProps) => {
    const [copiedText, copyToClipboard] = useCopyToClipboard();

    const handleCopy = () => {
        copyToClipboard(codeString);
    };

    return (
        <Box position="relative" my="4" borderRadius="md" overflow="hidden">
            <SyntaxHighlighter
                style={vscDarkPlus}
                language={language}
                PreTag="div"
            >
                {codeString}
            </SyntaxHighlighter>
            <Button
                size="sm"
                position="absolute"
                top="2"
                right="2"
                onClick={handleCopy}
                colorScheme={copiedText === codeString ? 'green' : 'gray'}
            >
              {copiedText === codeString ? 'Copied!' : 'Copy'}
            </Button>
        </Box>
    );
};
    
export default CodeBlock;
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useCopyToClipboard } from "@uidotdev/usehooks";
import { Button, Box } from '@chakra-ui/react';

const CodeBlock = ({ node, inline, className, children, ...props }: any) => {
    const match = /language-(\w+)/.exec(className || '');
    const codeString = String(children).replace(/\n$/, '');
    const [copiedText, copyToClipboard] = useCopyToClipboard();

    const handleCopy = () => {
        copyToClipboard(codeString);
    };

    return !inline && match ? (
        <Box position="relative" my="4" borderRadius="md" overflow="hidden">
            <SyntaxHighlighter
                style={vscDarkPlus}
                language={match[1]}
                PreTag="div"
                {...props}
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
    ) : (
        <code className={className} {...props}>
            {children}
        </code>
    );
};
    
export default CodeBlock;
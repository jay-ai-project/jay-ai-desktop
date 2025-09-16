import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { dracula } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useCopyToClipboard } from "@uidotdev/usehooks";


const CodeBlock = ({ node, inline, className, children, ...props }: any) => {
    const match = /language-(\w+)/.exec(className || '');
    const codeString = String(children).replace(/\n$/, '');
    const [copiedText, copyToClipboard] = useCopyToClipboard();

    return !inline && match ? (
        <div style={{ position: 'relative' }}>
            <SyntaxHighlighter
                style={dracula} // Apply your chosen style
                language={match[1]}
                PreTag="div"
                {...props}
            >
                {codeString}
            </SyntaxHighlighter>
            <button
                onClick={() => copyToClipboard(codeString)}
                style={{
                    position: 'absolute',
                    top: '0.5em',
                    right: '0.5em',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: copiedText === codeString ? 'green' : 'white',
                }}
            >
              {copiedText === codeString ? 'Copied!' : 'Copy'}
            </button>
        </div>
    ) : (
        <code className={className} {...props}>
            {children}
        </code>
    );
};
    
export default CodeBlock;
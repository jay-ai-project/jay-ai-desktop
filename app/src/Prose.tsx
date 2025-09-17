import { Box, BoxProps } from '@chakra-ui/react';
import parse, { domToReact, HTMLReactParserOptions, Element } from 'html-react-parser';
import CodeBlock from './CodeBlock';

interface ProseProps extends BoxProps {
  html: string;
}

const Prose = ({ html, ...rest }: ProseProps) => {
  const options: HTMLReactParserOptions = {
    replace: (domNode) => {
      if (domNode instanceof Element && domNode.name === 'pre') {
        const codeNode = domNode.children[0];
        if (codeNode instanceof Element && codeNode.name === 'code') {
          const langAttr = codeNode.attribs.class || '';
          const language = /language-(\w+)/.exec(langAttr)?.[1] || '';
          const codeString = domToReact(codeNode.children) as string;
          
          return <CodeBlock language={language} codeString={codeString.trim()} />;
        }
      }
    },
  };

  return (
    <Box
      sx={{
        // General styles
        p: {
          lineHeight: 'tall',
          marginBottom: '4',
        },
        'h1, h2, h3, h4, h5, h6': {
          fontWeight: 'bold',
          marginBottom: '3',
          marginTop: '6',
        },
        h1: { fontSize: '2xl' },
        h2: { fontSize: 'xl' },
        h3: { fontSize: 'lg' },
        // Lists
        'ul, ol': {
          paddingLeft: '6',
          marginBottom: '4',
        },
        li: {
          marginBottom: '1',
        },
        // Links
        a: {
          color: 'blue.300',
          textDecoration: 'underline',
          _hover: {
            color: 'blue.200',
          },
        },
        // Blockquotes
        blockquote: {
          borderLeft: '4px',
          borderColor: 'gray.500',
          paddingLeft: '4',
          marginY: '4',
          fontStyle: 'italic',
          color: 'gray.400',
        },
        // Inline code
        code: {
          fontFamily: 'mono',
          background: 'gray.700',
          borderRadius: 'sm',
          paddingX: '1.5',
          paddingY: '1',
          fontSize: 'sm',
        },
      }}
      {...rest}
    >
      {parse(html, options)}
    </Box>
  );
};

export default Prose;

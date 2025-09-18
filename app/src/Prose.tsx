import {
  Box,
  BoxProps,
  Heading,
  Text,
  Link,
  UnorderedList,
  OrderedList,
  ListItem,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Tfoot,
  Divider,
  Code,
  Alert,
} from '@chakra-ui/react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import CodeBlock from './CodeBlock';

interface ProseProps extends BoxProps {
  markdown: string;
}

const Prose = ({ markdown, ...rest }: ProseProps) => {
  const components = {
    h1: ({ ...props }) => <Heading as="h1" size="xl" my="4" {...props} />,
    h2: ({ ...props }) => <Heading as="h2" size="lg" my="4" {...props} />,
    h3: ({ ...props }) => <Heading as="h3" size="md" my="3" {...props} />,
    h4: ({ ...props }) => <Heading as="h4" size="sm" my="3" {...props} />,
    h5: ({ ...props }) => <Heading as="h5" size="xs" my="2" {...props} />,
    h6: ({ ...props }) => <Heading as="h6" size="xs" my="2" {...props} />,
    p: ({ ...props }) => <Text my="4" {...props} />,
    a: ({ ...props }) => <Link color="blue.400" isExternal {...props} />,
    ul: ({ ...props }) => <UnorderedList pl="4" my="4" {...props} />,
    ol: ({ ...props }) => <OrderedList pl="4" my="4" {...props} />,
    li: ({ ...props }) => <ListItem {...props} />,
    table: ({ ...props }) => <Table variant="striped" colorScheme="gray" my="4" {...props} />,
    thead: ({ ...props }) => <Thead {...props} />,
    tbody: ({ ...props }) => <Tbody {...props} />,
    tfoot: ({ ...props }) => <Tfoot {...props} />,
    tr: ({ ...props }) => <Tr {...props} />,
    th: ({ ...props }) => <Th {...props} />,
    td: ({ ...props }) => <Td {...props} />,
    hr: ({ ...props }) => <Divider my="6" {...props} />,
    blockquote: ({ ...props }) => (
      <Alert
        status="info"
        variant="left-accent"
        as="blockquote"
        my="4"
        {...props}
      />
    ),
    code: ({ node, inline, className, children, ...props }: any) => {
      const match = /language-(\w+)/.exec(className || '');
      return !inline && match ? (
        <CodeBlock
          language={match[1]}
          codeString={String(children).replace(/\n$/, '')}
          {...props}
        />
      ) : (
        <Code colorScheme="gray" {...props}>
          {children}
        </Code>
      );
    },
  };

  return (
    <Box {...rest}>
      <ReactMarkdown components={components} remarkPlugins={[remarkGfm]}>
        {markdown}
      </ReactMarkdown>
    </Box>
  );
};

export default Prose;
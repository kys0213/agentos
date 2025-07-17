import React from 'react';
import ReactDOM from 'react-dom/client';
import { ChakraProvider } from '@chakra-ui/react';
import ChatApp from './ChatApp';
import theme from '../theme';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ChakraProvider theme={theme}>
      <ChatApp />
    </ChakraProvider>
  </React.StrictMode>
);

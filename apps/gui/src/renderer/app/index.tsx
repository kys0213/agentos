import React from 'react';
import ReactDOM from 'react-dom/client';
import { ChakraProvider, ColorModeScript } from '@chakra-ui/react';
import ChatApp from './ChatApp';
import theme from '../theme';
import { QueryProvider } from '../providers/QueryProvider';
import '../styles/globals.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryProvider>
      <ChakraProvider theme={theme}>
        <ColorModeScript initialColorMode={theme.config.initialColorMode} />
        <ChatApp />
      </ChakraProvider>
    </QueryProvider>
  </React.StrictMode>
);

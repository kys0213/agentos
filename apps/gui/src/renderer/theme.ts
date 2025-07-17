import { extendTheme, type ThemeConfig } from '@chakra-ui/react';

const config: ThemeConfig = {
  initialColorMode: 'light',
  useSystemColorMode: false,
};

const colors = {
  brand: {
    50: '#e3f9ff',
    100: '#c8e9ff',
    200: '#aedbff',
    300: '#94cdff',
    400: '#7ac0ff',
    500: '#61b3ff',
    600: '#4798e6',
    700: '#3273b4',
    800: '#1e4d82',
    900: '#0a284f',
  },
};

export const theme = extendTheme({ config, colors });
export default theme;

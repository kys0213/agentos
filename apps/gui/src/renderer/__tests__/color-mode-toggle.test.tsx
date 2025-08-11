import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { ChakraProvider, useColorMode } from '@chakra-ui/react';
import ColorModeToggle from '../components/common/ColorModeToggle';
import theme from '../theme';

let mode: string;
const ModeReader: React.FC = () => {
  const { colorMode } = useColorMode();
  mode = colorMode;
  return null;
};

test('toggles color mode', () => {
  const comp = renderer.create(
    <ChakraProvider theme={theme}>
      <ColorModeToggle />
      <ModeReader />
    </ChakraProvider>
  );
  expect(mode).toBe('light');
  const btn = comp.root.findByType('button');
  act(() => {
    btn.props.onClick();
  });
  expect(mode).toBe('dark');
});

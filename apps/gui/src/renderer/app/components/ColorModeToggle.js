import { jsx as _jsx } from "react/jsx-runtime";
import { IconButton, useColorMode } from '@chakra-ui/react';
import { SunIcon, MoonIcon } from '@chakra-ui/icons';
const ColorModeToggle = () => {
    const { colorMode, toggleColorMode } = useColorMode();
    return (_jsx(IconButton, { "aria-label": "Toggle color mode", icon: colorMode === 'light' ? _jsx(MoonIcon, {}) : _jsx(SunIcon, {}), onClick: toggleColorMode, size: "sm", variant: "outline" }));
};
export default ColorModeToggle;

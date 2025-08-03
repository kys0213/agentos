/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}', './index.html'],
  theme: {
    extend: {
      colors: {
        // Chakra UI 호환성을 위한 색상 팔레트
        gray: {
          50: '#F7FAFC',
          100: '#EDF2F7',
          200: '#E2E8F0',
          300: '#CBD5E0',
          400: '#A0AEC0',
          500: '#718096',
          600: '#4A5568',
          700: '#2D3748',
          800: '#1A202C',
          900: '#171923',
        },
        blue: {
          50: '#EBF8FF',
          100: '#BEE3F8',
          200: '#90CDF4',
          300: '#63B3ED',
          400: '#4299E1',
          500: '#3182CE',
          600: '#2B77CB',
          700: '#2C5282',
          800: '#2A4365',
          900: '#1A365D',
        },
        red: {
          50: '#FEF2F2',
          100: '#FEE2E2',
          200: '#FECACA',
          300: '#FCA5A5',
          400: '#F87171',
          500: '#EF4444',
          600: '#DC2626',
          700: '#B91C1C',
          800: '#991B1B',
          900: '#7F1D1D',
        },
        // shadcn/ui semantic colors
        border: '#E2E8F0',
        input: '#E2E8F0',
        ring: '#3182CE',
        background: '#FFFFFF',
        foreground: '#1A202C',
        primary: {
          DEFAULT: '#3182CE',
          foreground: '#FFFFFF',
        },
        secondary: {
          DEFAULT: '#EDF2F7',
          foreground: '#1A202C',
        },
        destructive: {
          DEFAULT: '#EF4444',
          foreground: '#FFFFFF',
        },
        muted: {
          DEFAULT: '#F7FAFC',
          foreground: '#718096',
        },
        accent: {
          DEFAULT: '#EDF2F7',
          foreground: '#1A202C',
        },
        popover: {
          DEFAULT: '#FFFFFF',
          foreground: '#1A202C',
        },
        card: {
          DEFAULT: '#FFFFFF',
          foreground: '#1A202C',
        },
      },
      gridTemplateColumns: {
        // 레이아웃별 그리드 템플릿
        'layout-full': '300px 1fr 300px', // 좌/중앙/우 사이드바
        'layout-left': '300px 1fr 0px', // 좌측만
        'layout-right': '0px 1fr 300px', // 우측만
        'layout-center': '0px 1fr 0px', // 중앙만
      },
      spacing: {
        sidebar: '300px',
      },
      borderRadius: {
        lg: '0.5rem',
        md: '0.375rem',
        sm: '0.25rem',
      },
      keyframes: {
        'accordion-down': {
          from: { height: 0 },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: 0 },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
};

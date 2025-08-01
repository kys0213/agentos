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
    },
  },
  plugins: [require('@tailwindcss/typography')],
};

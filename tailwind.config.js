/** @type {import('tailwindcss').Config} */
// Tokens espelham blaxx_exe/renderer/assets/design-system.css (fonte de verdade: Windows).
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        black: { DEFAULT: '#0A0A0A', soft: '#1A1A1A' },
        lime: { DEFAULT: '#C6FF00', dark: '#9ACC00', light: '#F2FFCC' },
        gray: {
          50: '#FAFAFA',
          100: '#F4F4F5',
          200: '#E5E5E5',
          400: '#A1A1AA',
          600: '#525252',
          800: '#262626',
        },
        negative: '#DC2626',
        warning: '#F59E0B',
      },
      fontFamily: {
        display: ['Playfair Display', 'New York', 'Georgia', 'serif'],
        body: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono: ['JetBrains Mono', 'SF Mono', 'Menlo', 'monospace'],
      },
      borderRadius: {
        sm: '8px',
        DEFAULT: '14px',
        lg: '20px',
        xl: '28px',
      },
    },
  },
  plugins: [],
}

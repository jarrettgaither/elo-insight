/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Main brand colors - black and dark greys
        primary: {
          50: '#f7f7f7',
          100: '#e3e3e3',
          200: '#c8c8c8',
          300: '#a4a4a4',
          400: '#818181',
          500: '#666666', // Mid grey
          600: '#515151',
          700: '#434343',
          800: '#383838', // Dark grey
          900: '#1f1f1f', 
          950: '#121212', // Nearly black
        },
        // Secondary accent color - reds
        accent: {
          50: '#fff1f2',
          100: '#ffe4e6',
          200: '#fecdd3',
          300: '#fda4af',
          400: '#fb7185',
          500: '#f43f5e', // Main red
          600: '#e11d48',
          700: '#be123c',
          800: '#9f1239',
          900: '#881337',
          950: '#4c0519',
        },
        // Background colors
        background: {
          light: '#1f1f1f',
          DEFAULT: '#121212',
          dark: '#0a0a0a',
        },
        // Surface colors for cards, dialogs
        surface: {
          light: '#2d2d2d',
          DEFAULT: '#1f1f1f',
          dark: '#161616',
        },
        // Text colors
        content: {
          primary: '#ffffff',
          secondary: '#d4d4d4',
          tertiary: '#a3a3a3',
          primaryDark: '#ffffff',
          secondaryDark: '#d4d4d4',
          tertiaryDark: '#a3a3a3',
        },
      },
      borderRadius: {
        '4xl': '2rem',
      },
      boxShadow: {
        'subtle': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        'elevated': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'prominent': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

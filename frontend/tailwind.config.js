/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        chatgpt: {
          sidebar: '#171717',
          main: '#212121',
          card: '#2f2f2f',
          input: '#2f2f2f',
          hover: '#262626',
          border: '#3c3c3c',
          text: '#ececec',
          subtext: '#b4b4b4',
          accent: '#10a37f'
        },
        billa: {
          50: '#fdf4ff',
          100: '#fae8ff',
          500: '#d946ef',
          600: '#c026d3',
          700: '#a21caf',
          900: '#701a75',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        urdu: ['Noto Nastaliq Urdu', 'Gulzar', 'sans-serif'],
      }
    },
  },
  plugins: [],
}

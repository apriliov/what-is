/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#1f5fd6',
          dark: '#1a4fb4',
          soft: '#eef4ff',
          line: '#dce6f7',
        },
        ink: '#0f1a30',
        mute: '#566480',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

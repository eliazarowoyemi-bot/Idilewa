/** @type {import('tailwindcss').Config} */
export default {
  content: ['./*.html', './src/components/**/*.{ts,tsx}', './src/studio/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        idilewa: {
          ink: '#173a34',
          green: '#0b8d61',
          gold: '#edb64e',
          cream: '#fffaf0',
          violet: '#8357d8',
        },
      },
    },
  },
  plugins: [],
};

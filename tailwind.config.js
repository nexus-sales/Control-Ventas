/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class', // Habilita el modo oscuro por clase
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Paleta elegante para modo oscuro
        darkBg: '#18181b',
        darkCard: '#23232a',
        darkAccent: '#6366f1',
        darkText: '#f4f4f5',
      },
    },
  },
  plugins: [],
};

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        coffee: {
          50: '#FAF7F2',   // Steam/Milk foam
          100: '#F3E9DF',  // Latte
          200: '#E6D2C1',  // Flat White
          300: '#D4B098',  // Macchiato 
          400: '#BC8A5F',  // Cortado
          500: '#A67C52',  // Coffee
          600: '#8B5E3C',  // Mocha
          700: '#6F4E37',  // Roast
          800: '#4B3621',  // Espresso
          900: '#2C1B0E',  // Bean
        }
      }
    },
  },
  plugins: [],
}

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Palette de couleurs bois/forêt
        'sage': '#8BA888',      // Nature / Calme / Repos
        'moss': '#7B8654',      // Concentration / Travail
        'gold': '#DCA44C',      // Énergie / Sport / Motivation
        'copper': '#C1683C',    // Passion / Créativité
        'teal': '#4B7B73',      // Méditation / Détente / Soirée
        'wood': {
          50: '#f7f6f4',
          100: '#ede9e3',
          200: '#d9d1c4',
          300: '#c4b8a3',
          400: '#b19f82',
          500: '#9d8661',
          600: '#8a6d4a',
          700: '#6b5438',
          800: '#4c3b26',
          900: '#2d2214',
        }
      },
      fontFamily: {
        'zen': ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bounce-gentle': 'bounce-gentle 2s infinite',
        'slide-up': 'slide-up 0.3s ease-out',
        'fade-in': 'fade-in 0.5s ease-in',
        'scale-in': 'scale-in 0.2s ease-out',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'bounce-gentle': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-5px)' },
        },
        'slide-up': {
          '0%': { transform: 'translateY(100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'scale-in': {
          '0%': { transform: 'scale(0.9)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}

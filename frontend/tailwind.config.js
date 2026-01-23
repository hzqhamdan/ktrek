/** @type {import('tailwindcss').Config} */
export default {
  content: [
        "./index.html",
        "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Pastel palette removed (not used in orange theme)

        // Primary colors (orange theme)
        primary: {
          50: '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#fdba74',
          400: '#fb923c',
          500: '#f97316',
          600: '#e16a02',
          700: '#c2410c',
          800: '#9a3412',
          900: '#7c2d12',
        },
        // Background colors
        background: {
          light: '#ffffff',
          cream: '#F1EEE7',
          soft: '#f5f5f5',
          default: '#F1EEE7',
        },
      },
      fontFamily: {
        // Match admin panel typography
        sans: ['Helvetica', 'Arial', 'system-ui', '-apple-system', '"Segoe UI"', 'sans-serif'],
        heading: ['"Playfair Display"', 'Georgia', 'serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'float': 'float 6s ease-in-out infinite',
        'float-delayed': 'float 6s ease-in-out 3s infinite',
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
      },
    },
  },
  plugins: [],
}
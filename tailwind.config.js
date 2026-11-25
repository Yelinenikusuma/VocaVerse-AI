/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Poppins', 'Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        forest: {
          DEFAULT: '#064e3b',
          900: '#064e3b',
          800: '#065f46',
          700: '#047857',
        },
        emerald2: {
          600: '#059669',
          500: '#10b981',
          400: '#34d399',
        },
        mint: {
          100: '#d1fae5',
          50: '#ecfdf5',
        },
        ink: {
          900: '#14291f',
          700: '#52665b',
          500: '#94a39a',
        },
        bordermint: '#dcfce7',
        appbg: '#f0fdf4',
      },
      boxShadow: {
        emerald: '0 14px 40px -18px rgba(5,150,105,0.40)',
        card: '0 10px 30px -16px rgba(5,150,105,0.20)',
      },
    },
  },
  plugins: [],
};

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx,js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Space Grotesk', 'Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        neon: {
          magenta: '#FF00FF',
          green: '#39FF14',
          blue: '#00F0FF',
          purple: '#BC13FE',
          orange: '#FF5E00',
        },
        navy: {
          950: '#020617',
          900: '#0B0B0F',
          800: '#14141A',
          700: '#1E1E26',
        },
      },
      letterSpacing: {
        'geometric': '0.1em',
        'wide': '0.05em',
      },
      lineHeight: {
        'relaxed-geo': '1.75',
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
}


/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{html,ts}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Paleta dark-only do protótipo (acento roxo)
        primary: '#a78bfa',
        bg: '#0c0c0f',
        sidebar: '#0f0f13',
        card: '#16171c',
        card2: '#1c1d23',
        chip: '#26262e',
        tx: '#eceef2',
        tx2: '#c4c4cc',
        mut: '#8b8b95',
        dim: '#6c6c76',
        faint: '#46464e',
        accent: '#a78bfa',
        accent2: '#b79dff',
        accentsoft: '#c9b6ff',
        accentstrong: '#8b5cf6',
        pos: '#4ade80',
        neg: '#fb7185'
      },
      borderColor: {
        bd: 'rgba(255,255,255,0.06)',
        bd2: 'rgba(255,255,255,0.05)'
      },
      fontFamily: {
        display: ['Hanken Grotesk', 'system-ui', 'sans-serif'],
        sans: ['Hanken Grotesk', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace']
      },
      borderRadius: {
        DEFAULT: '0.25rem',
        lg: '0.5rem',
        xl: '0.75rem',
        '2xl': '1rem',
        full: '9999px'
      },
      boxShadow: {
        card: '0 1px 3px rgba(0,0,0,.4),0 8px 20px -12px rgba(0,0,0,.5)',
        cardlg: '0 1px 3px rgba(0,0,0,.4),0 10px 30px -14px rgba(0,0,0,.6)'
      }
    }
  },
  plugins: [require('@tailwindcss/forms'), require('@tailwindcss/container-queries')]
};

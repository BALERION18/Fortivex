/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx}'
  ],
  theme: {
    extend: {
      colors: {
        slate: {
          950: '#1e1e1e', // Figma canvas background
          900: '#252526', // Figma card / container surface
          850: '#282829',
          800: '#383838', // Figma standard divider / border
          700: '#484848', // Figma hover / active border
          600: '#666666',
          500: '#8c8c8c',
          400: '#b3b3b3', // Figma secondary label text
          300: '#d4d4d4', // Figma primary body text
          200: '#e5e5e5',
          100: '#f5f5f5',
          50: '#ffffff'
        },
        figma: {
          canvas: '#1e1e1e',
          panel: '#2c2c2c',
          card: '#252526',
          input: '#181818',
          hover: '#383838',
          border: '#383838',
          blue: '#0d99ff',
          blueHover: '#007be5',
          purple: '#7b61ff',
          green: '#14ae5c',
          red: '#f24822',
          amber: '#ffcd29'
        },
        brand: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          500: '#0d99ff',
          600: '#0284c7',
          700: '#0369a1',
          900: '#0c4a6e'
        }
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'Menlo', 'monospace']
      },
      borderRadius: {
        '2xl': '8px', // Prevent AI-ish 16px/24px bubble radius
        'xl': '6px',
        'lg': '6px',
        'md': '4px',
        'sm': '3px'
      },
      boxShadow: {
        'sm': '0 1px 2px 0 rgba(0, 0, 0, 0.4)',
        DEFAULT: '0 1px 3px 0 rgba(0, 0, 0, 0.5)',
        'md': '0 2px 4px 0 rgba(0, 0, 0, 0.5)',
        'lg': '0 4px 6px -1px rgba(0, 0, 0, 0.5)',
        'xl': '0 4px 8px 0 rgba(0, 0, 0, 0.6)',
        '2xl': '0 6px 12px 0 rgba(0, 0, 0, 0.6)',
        'inner': 'inset 0 1px 2px 0 rgba(0, 0, 0, 0.4)'
      }
    }
  },
  plugins: []
};

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#EEF2FF',
          100: '#E0E7FF',
          500: '#6366F1',
          600: '#4F46E5',
          700: '#4338CA',
        },
        secondary: {
          500: '#06B6D4',
        },
        slate: {
          50: '#F8FAFC',   // Background
          100: '#F1F5F9',
          200: '#E2E8F0',  // Border
          300: '#CBD5E1',
          400: '#94A3B8',
          500: '#64748B',  // Muted text
          600: '#475569',
          700: '#334155',
          800: '#1E293B',  // Main text
          900: '#0F172A',
        }
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.5rem',
      },
      boxShadow: {
        'soft': '0 1px 2px 0 rgb(0 0 0 / 0.05)',
        'medium': '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
        'glow': '0 0 15px rgba(79, 70, 229, 0.3)',
      }
    },
  },
  plugins: [],
}

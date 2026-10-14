/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        posadas: {
          blue: '#1E3A8A',
          red: '#DC2626',
          green: '#059669',
          dark: '#0F172A',
          river: '#0284C7',
          riverDark: '#0369A1',
          emerald: '#10B981',
          emeraldDark: '#047857',
          midnight: '#0F172A',
          midnightDeep: '#0B1329',
        },
      },
    },
  },
  plugins: [],
};

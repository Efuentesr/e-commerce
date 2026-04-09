/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        amazon: {
          blue: '#131921',
          'blue-light': '#232f3e',
          orange: '#f90',
          'orange-dark': '#e47911',
          teal: '#067D62',
        },
      },
    },
  },
  plugins: [],
}

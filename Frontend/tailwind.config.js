/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}", // <--- Quan trọng: Dòng này giúp Tailwind quét file React
  ],
  theme: {
    extend: {
      // Sau này muốn thêm màu riêng thì thêm ở đây
      colors: {
        primary: "#4F46E5", 
      }
    },
  },
  plugins: [],
}
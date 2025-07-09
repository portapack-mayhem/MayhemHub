import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        "component-bg": "rgba(23, 35, 52, 0.45)",
        "modal-bg": "rgba(23, 35, 52, 0.45)",
        "modal-border": "rgb(17, 24, 39)",
        overlay: "rgba(0, 0, 0, 0.5)",
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
      boxShadow: {
        glow: "0 0 10px 0 var(--tw-shadow-color)",
      },
    },
  },
  plugins: [require("daisyui")],
};
export default config;

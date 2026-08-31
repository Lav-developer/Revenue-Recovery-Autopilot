import type { Config } from "tailwindcss";
import forms from "@tailwindcss/forms";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#0B0A08", surface: "#12110F", elevated: "#181613",
        border: "#292621", paper: "#F3EEE5", muted: "#AAA39A",
        quiet: "#777168", amber: "#F2A93B", success: "#55C98A",
        warning: "#F2B84B", danger: "#EF6B6B", info: "#79A9FF"
      },
      fontFamily: { sans: ["Inter", "ui-sans-serif", "system-ui"] }
    }
  },
  plugins: [forms]
};
export default config;

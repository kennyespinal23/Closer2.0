/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // Closer palette — pure black, white ink, white chrome.
        // Per-sermon-type colors live in `constants/sermonTypes.ts` and
        // are used only for ambient glows / gradients — never for chrome.
        bg: "#000000",
        surface: "#0F0F0F",
        ink: {
          DEFAULT: "#FFFFFF",
          muted: "#A1A1AA",
          subtle: "#71717A",
        },
        primary: {
          DEFAULT: "#FFFFFF",
          pressed: "#E5E5E5",
          fg: "#000000", // text/icons rendered ON a primary surface
        },
        accent: {
          DEFAULT: "#FFFFFF",
          soft: "#1A1A1A", // dark backdrop for accent badges (avatars, pills)
        },
        border: {
          DEFAULT: "#1F1F1F",
          strong: "#2A2A2A",
        },
      },
      fontFamily: {
        sans: ["PlusJakartaSans_400Regular"],
        medium: ["PlusJakartaSans_500Medium"],
        semibold: ["PlusJakartaSans_600SemiBold"],
        bold: ["PlusJakartaSans_700Bold"],
        extrabold: ["PlusJakartaSans_800ExtraBold"],
      },
    },
  },
  plugins: [],
};

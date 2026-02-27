/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: {
                    50: "#eef2ff",
                    100: "#e0e7ff",
                    200: "#c7d2fe",
                    300: "#a5b4fc",
                    400: "#818cf8",
                    500: "#6366f1", // Main brand color (Indigo modern)
                    600: "#4f46e5",
                    700: "#4338ca",
                    800: "#3730a3",
                    900: "#312e81",
                },

                accent: {
                    500: "#06b6d4", // Cyan pop for buttons / highlights
                    600: "#0891b2",
                },

                success: "#22c55e",
                warning: "#f59e0b",
                danger: "#ef4444",

                neutral: {
                    50: "#f8fafc",
                    100: "#f1f5f9",
                    200: "#e2e8f0",
                    300: "#cbd5e1",
                    400: "#94a3b8",
                    500: "#64748b",
                    600: "#475569",
                    700: "#334155",
                    800: "#1e293b",
                    900: "#0f172a",
                },
            },

            borderRadius: {
                xl: "1rem",
                "2xl": "1.5rem",
            },

            boxShadow: {
                soft: "0 4px 20px rgba(0,0,0,0.08)",
                glow: "0 0 15px rgba(99,102,241,0.4)",
            },

            backgroundImage: {
                "primary-gradient":
                    "linear-gradient(135deg, #6366f1 0%, #06b6d4 100%)",
            },

            fontFamily: {
                sans: ["Inter", "Poppins", "ui-sans-serif", "system-ui"],
            },
        },
    },
    plugins: [],
};
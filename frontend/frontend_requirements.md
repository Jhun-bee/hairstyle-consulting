# Frontend Requirements & Dependencies

This project is built with **React** + **Vite**.
The dependency management file is `package.json`, but here is a summary of the key libraries used.

## Core Framework
*   **react**: UI Framework
*   **react-dom**: DOM rendering for React
*   **vite**: Next-generation frontend tooling (Bundler + Dev Server)

## Styling & UI
*   **tailwindcss**: Utility-first CSS framework for styling
*   **postcss**: Tool for transforming CSS with JS plugins (required by Tailwind)
*   **autoprefixer**: Parse CSS and add vendor prefixes (required by Tailwind)
*   **lucide-react**: Icon library (clean and consistent icons)
*   **framer-motion**: Animation library for smooth transitions

## Logic & API
*   **react-router-dom**: Routing library (Navigation)
*   **axios**: HTTP Client for making API requests to the Backend

## Installation Command
Since `package.json` already contains all dependencies, you just need to run:

```bash
# 1. Install all libraries
npm install

# 2. Run the development server
npm run dev
```

## Note on "Vite" vs "React"
You might see the "Vite" logo, but **you are definitely using React!**
*   **React**: The library used to write the UI code (Components, Hooks).
*   **Vite**: The tool that runs your code. It replaces the old "Create React App" and is much faster. 
*   Think of it like: **React is the Engine, Vite is the Car Body & Starter.**

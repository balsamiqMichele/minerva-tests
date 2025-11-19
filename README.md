# Todo List App Skeleton

This project is a skeleton Todo List app built with:

- **React** (UI library)
- **Vite** (build tool)
- **Tailwind CSS** (utility-first CSS framework)
- **Radix UI** (accessible UI primitives)
- **ESLint** (linting)

## Getting Started

1. **Install dependencies:**

   ```sh
   npm install
   ```

2. **Start the development server:**

   ```sh
   npm run dev
   ```

3. **Open your browser:**
   Visit [http://localhost:5173](http://localhost:5173)

## Tailwind CSS Setup

- Tailwind is configured via `tailwind.config.js` and `postcss.config.cjs`.
- Main styles are imported in `src/index.css` using:
  ```css
  @tailwind base;
  @tailwind components;
  @tailwind utilities;
  ```
- If you use ES modules (`"type": "module"` in `package.json`), ensure your PostCSS config file is named `postcss.config.cjs`.
- As of Tailwind v4, you must use the `@tailwindcss/postcss` plugin in your PostCSS config:
  ```js
  module.exports = {
    plugins: {
      "@tailwindcss/postcss": {},
      autoprefixer: {},
    },
  };
  ```

## Radix UI

- Radix UI provides accessible, unstyled primitives. Use Tailwind classes or custom CSS to style Radix components.

## Troubleshooting

- If you see errors about PostCSS config or Tailwind plugin, make sure:
  - You have installed `@tailwindcss/postcss`.
  - Your PostCSS config uses the correct plugin name.
  - The config file is named `postcss.config.cjs` if using ES modules.

## ESLint

- ESLint is set up for code linting. You can expand the configuration for TypeScript or stricter rules as needed.

---

Original Vite/React template info below:

# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

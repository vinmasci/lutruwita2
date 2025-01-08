.
├── .gitignore - Specifies files to ignore in version control
├── eslint.config.js - ESLint configuration for code linting
├── index.html - Main HTML entry point for the Vite application
├── package-lock.json - Lock file for npm dependencies
├── package.json - Project dependencies and scripts configuration
├── postcss.config.js - PostCSS configuration (likely for Tailwind)
├── README.md - Project documentation
├── tailwind.config.js - Tailwind CSS configuration
├── tsconfig.app.json - TypeScript config for application code
├── tsconfig.json - Base TypeScript configuration
├── tsconfig.node.json - TypeScript config for Node/backend
├── vite.config.ts - Vite build tool configuration
├── public/
│   └── vite.svg - Vite logo asset
└── src/
    ├── App.css - Main application styles
    ├── App.tsx - Root React component
    ├── index.css - Global styles
    ├── main.tsx - Application entry point
    ├── vite-env.d.ts - Vite environment type declarations
    ├── assets/
    │   └── react.svg - React logo asset
    ├── components/
    │   ├── layout/
    │   │   └── main-layout.tsx - Main layout component
    │   └── ui/
    │       ├── bottom-tabs.tsx - Bottom navigation tabs component
    │       ├── button.tsx - Button component
    │       ├── elevation-profile.tsx - Elevation profile UI component
    │       ├── map-container.tsx - Map container component
    │       ├── map-controls.tsx - Map controls UI
    │       ├── navbar.tsx - Navigation bar component
    │       ├── sidebar.tsx - Sidebar component
    │       └── tabs.tsx - Tabbed interface component
    ├── lib/
    │   └── utils.ts - Utility functions
    ├── pages/
    │   ├── create.tsx - Create page component
    │   ├── explore.tsx - Explore page component
    │   └── home.tsx - Home page component
    └── types/
        └── map-types.ts - Type definitions for mapping functionality
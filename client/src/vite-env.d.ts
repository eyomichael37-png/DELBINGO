/// <reference types="vite/client" />

// Global type augmentations for Vite
declare global {
    interface ImportMetaEnv {
      readonly VITE_API_URL?: string
      readonly PROD: boolean
      readonly DEV: boolean
      readonly MODE: string
    }
  
    interface ImportMeta {
      readonly env: ImportMetaEnv
    }
  }
  
  // CSS modules
  declare module '*.css' {
    const content: string
    export default content
  }
  
  // SVG modules
  declare module '*.svg' {
    const content: string
    export default content
  }
  
  export {}
  
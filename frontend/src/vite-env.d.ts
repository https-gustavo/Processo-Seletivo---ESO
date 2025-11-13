/// <reference types="vite/client" />

// Tipos opcionais para variáveis de ambiente usadas no projeto
interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string
}
interface ImportMeta {
  readonly env: ImportMetaEnv
}

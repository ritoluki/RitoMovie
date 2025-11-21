/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL?: string
  readonly VITE_API_BASE_URL?: string
  readonly VITE_TMDB_IMAGE_BASE_URL?: string
  // Thêm các environment variables khác nếu cần
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}


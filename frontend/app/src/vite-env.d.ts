/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_NAME: string;
  readonly VITE_APP_URL: string;
  readonly VITE_API_URL: string;
  readonly VITE_ENVIRONMENT: string;
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  readonly VITE_SUPER_ADMIN_UUID: string;
  readonly VITE_GOOGLE_ADSENSE_CLIENT: string;
  readonly VITE_ENABLE_ADSENSE: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

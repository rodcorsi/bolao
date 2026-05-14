declare namespace NodeJS {
  interface ProcessEnv {
    FOOTBAL_DATA_ORG_API_KEY: string;
    FOOTBALL_DATA_ORG_COMPETITION?: string;
    FOOTBALL_DATA_ORG_SEASON?: string;
    SUPABASE_URL: string;
    SUPABASE_ANON_KEY: string;
    REDIS_HOST: string;
    REDIS_PORT: string;
    REDIS_PASSWORD: string;
  }
}

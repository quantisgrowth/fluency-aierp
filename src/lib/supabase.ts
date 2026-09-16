import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://piwxpveprnwxkqlkjgux.supabase.co";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBpd3hwdmVwcm53eGtxbGtqZ3V4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk0MDE0MTgsImV4cCI6MjEwNDk3NzQxOH0.zRtboVqzZ6myjKQCG22qp4zHvTp9VsTuSwBLy-KNfb8";

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

export interface ConnectionStatus {
  connected: boolean;
  latencyMs: number;
  message: string;
  error?: string;
}

/**
 * Checks connectivity and latency with the Supabase project.
 */
export async function checkSupabaseConnection(): Promise<ConnectionStatus> {
  if (!isSupabaseConfigured) {
    return {
      connected: false,
      latencyMs: 0,
      message: "Credenciais do Supabase não configuradas no ambiente.",
    };
  }

  const start = performance.now();
  try {
    // Attempt a light ping via auth session or schema info
    const { error } = await supabase.auth.getSession();
    const latencyMs = Math.round(performance.now() - start);

    if (error) {
      return {
        connected: false,
        latencyMs,
        message: "Erro na resposta do Supabase.",
        error: error.message,
      };
    }

    return {
      connected: true,
      latencyMs,
      message: `Conectado com sucesso (${latencyMs}ms)`,
    };
  } catch (err: unknown) {
    const latencyMs = Math.round(performance.now() - start);
    const errorMessage = err instanceof Error ? err.message : String(err);
    return {
      connected: false,
      latencyMs,
      message: "Falha na comunicação com o Supabase.",
      error: errorMessage,
    };
  }
}

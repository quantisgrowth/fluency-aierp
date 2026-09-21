import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env["VITE_SUPABASE_URL"];
const supabaseAnonKey = import.meta.env["VITE_SUPABASE_ANON_KEY"];

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = createClient(
  supabaseUrl || "https://invalid.supabase.co",
  supabaseAnonKey || "not-configured",
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  },
);

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

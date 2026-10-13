import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env["VITE_SUPABASE_URL"];
const supabaseAnonKey =
  import.meta.env["VITE_SUPABASE_PUBLISHABLE_KEY"] || import.meta.env["VITE_SUPABASE_ANON_KEY"];

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

function createConfiguredClient() {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "Supabase não configurado. Defina VITE_SUPABASE_URL e VITE_SUPABASE_PUBLISHABLE_KEY.",
    );
  }

  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });
}

let client: ReturnType<typeof createConfiguredClient> | undefined;

// A criação tardia permite compilar a aplicação sem credenciais. Em execução,
// o ambiente precisa declarar explicitamente o projeto correto; nunca há
// fallback silencioso para produção.
export const supabase = new Proxy({} as ReturnType<typeof createConfiguredClient>, {
  get(_, property, receiver) {
    client ??= createConfiguredClient();
    return Reflect.get(client, property, receiver);
  },
});

export interface ConnectionStatus {
  connected: boolean;
  latencyMs: number;
  message: string;
  error?: string;
}

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
    return { connected: true, latencyMs, message: `Conectado com sucesso (${latencyMs}ms)` };
  } catch (error: unknown) {
    const latencyMs = Math.round(performance.now() - start);
    return {
      connected: false,
      latencyMs,
      message: "Falha na comunicação com o Supabase.",
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

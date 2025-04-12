declare module '@supabase/supabase-js' {
  interface User {
    id: string;
    email: string | null;
    user_metadata?: {
      name?: string;
    };
  }

  interface Session {
    access_token: string;
    refresh_token: string;
    expires_at?: number;
  }

  interface AuthResponse {
    data: {
      user: User | null;
      session: Session | null;
    };
    error: Error | null;
  }

  interface SupabaseClient {
    auth: {
      signUp: (credentials: {
        email: string;
        password: string;
      }) => Promise<AuthResponse>;
      signInWithPassword: (credentials: {
        email: string;
        password: string;
      }) => Promise<AuthResponse>;
      signOut: () => Promise<{ error: Error | null }>;
      getUser: (
        token: string,
      ) => Promise<{ data: { user: User }; error: Error | null }>;
    };
  }

  export function createClient(url: string, key: string): SupabaseClient;
  export type { User, Session, AuthResponse, SupabaseClient };
}

import { Session } from '@supabase/supabase-js';

export interface User {
  id: string;
  email: string;
  name: string;
}

export interface AuthResult {
  data?: {
    user: {
      id: string;
      email: string | null;
      user_metadata?: {
        name?: string;
      };
    };
    session: Session | null;
  };
  error?: Error | null;
  user?: User;
  session?: Session | null;
}

export interface TokenResponse {
  token: string;
  user: User;
}

export interface JwtPayload {
  sub: string;
  iat?: number;
  exp?: number;
}



export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          username: string | null;
          // Add more fields from your schema
        };
        Insert: {
          id: string;
          email: string;
          username?: string | null;
        };
        Update: {
          username?: string | null;
        };
      };
      // Add other tables here (listings, likes, etc.)
    };
    Views: {};
    Functions: {};
  };
}

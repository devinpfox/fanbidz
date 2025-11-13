// import type { Database as BaseDB } from "./supabase";

// declare module "./supabase" {
//   interface Database {
//     public: BaseDB["public"] & {
//       Tables: BaseDB["public"]["Tables"] & {
//         saves: {
//           Row: { id: string; user_id: string; listing_id: string; created_at: string };
//           Insert: { user_id: string; listing_id: string; created_at?: string };
//           Update: { user_id?: string; listing_id?: string; created_at?: string };
//         };
//       };
//     };
//   }
// }
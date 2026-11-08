import { createIdentityHandler } from './handler.mjs';
Deno.serve(createIdentityHandler({
  url: Deno.env.get('SUPABASE_URL'), serviceKey: Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'),
  allowedOrigins: (Deno.env.get('ACCOUNTS_ALLOWED_ORIGINS') || '').split(',').map(value => value.trim()).filter(Boolean),
}));

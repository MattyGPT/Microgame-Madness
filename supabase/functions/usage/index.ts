import { createUsageHandler } from './handler.mjs';

Deno.serve(createUsageHandler({
  url: Deno.env.get('SUPABASE_URL'), serviceKey: Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'),
  token: Deno.env.get('USAGE_REPORT_TOKEN'),
  allowedOrigins: (Deno.env.get('ACCOUNTS_ALLOWED_ORIGINS') || '').split(',').map(value => value.trim()).filter(Boolean),
}));

// These are the same rule/catalog modules shipped to the browser; no second reward table.
import '../../../web/achievements.js';
import '../../../web/customs-expansion.js';
import '../../../web/customs.js';
import '../../../web/shop.js';
import '../../../web/trails.js';
import '../../../web/turtle-customs.js';
import '../../../shared/account-rules.js';
import { createHandler } from './handler.mjs';

Deno.serve(createHandler({
  url: Deno.env.get('SUPABASE_URL'),
  serviceKey: Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'),
  // @ts-ignore Portable scripts intentionally export their API on globalThis.
  rules: globalThis.AccountRules,
  writesEnabled: Deno.env.get('ACCOUNTS_WRITES_ENABLED') !== 'false',
  importsEnabled: Deno.env.get('ACCOUNTS_IMPORTS_ENABLED') !== 'false',
  purchasesEnabled: Deno.env.get('ACCOUNTS_PURCHASES_ENABLED') !== 'false',
  allowedOrigins: (Deno.env.get('ACCOUNTS_ALLOWED_ORIGINS') || '').split(',').map(value => value.trim()).filter(Boolean),
}));

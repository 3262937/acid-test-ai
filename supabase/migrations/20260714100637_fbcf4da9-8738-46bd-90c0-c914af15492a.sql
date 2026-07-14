DROP TABLE IF EXISTS public.credit_ledger CASCADE;
DROP TABLE IF EXISTS public.user_credits CASCADE;
DROP TABLE IF EXISTS public.credit_packages CASCADE;
DROP TABLE IF EXISTS public.stripe_customers CASCADE;
DROP TABLE IF EXISTS public.subscriptions CASCADE;
DROP FUNCTION IF EXISTS public.debit_credits(integer, text) CASCADE;
DROP FUNCTION IF EXISTS public.apply_ledger_to_balance() CASCADE;
DROP FUNCTION IF EXISTS public.has_active_subscription(uuid, text) CASCADE;
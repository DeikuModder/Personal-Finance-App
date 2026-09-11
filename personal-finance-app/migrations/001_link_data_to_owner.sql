-- FinTrack migration: link all existing data to the app owner account.
-- Run ONCE after deploying the multi-user (email OTP) backend.
--
-- Usage (no shell redirection; stdin pipe works fine):
--   Get-Content .\migrations\001_link_data_to_owner.sql -Raw | docker exec -i personal-finance-app-db-1 psql -U fintrack -d fintrack
-- or mount/volumes-copy the file into the container and run:
--   docker exec -i personal-finance-app-db-1 psql -U fintrack -d fintrack -f /tmp/001_link_data_to_owner.sql

BEGIN;

-- Ensure the owner user exists and is a superadmin (idempotent).
INSERT INTO users (id, email, role, created_at)
SELECT gen_random_uuid(), 'gabrieltc555@gmail.com', 'superadmin', now()
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'gabrieltc555@gmail.com');

UPDATE users SET role = 'superadmin' WHERE email = 'gabrieltc555@gmail.com';

-- Reparent every existing row to the owner (safe to run once; no-op if already owned).
DO $$
DECLARE
  owner_id uuid := (SELECT id FROM users WHERE email = 'gabrieltc555@gmail.com');
BEGIN
  UPDATE accounts           SET "userId" = owner_id WHERE "userId" IS DISTINCT FROM owner_id;
  UPDATE transactions       SET "userId" = owner_id WHERE "userId" IS DISTINCT FROM owner_id;
  UPDATE budgets            SET "userId" = owner_id WHERE "userId" IS DISTINCT FROM owner_id;
  UPDATE budget_items       SET "userId" = owner_id WHERE "userId" IS DISTINCT FROM owner_id;
  UPDATE categories         SET "userId" = owner_id WHERE "userId" IS DISTINCT FROM owner_id;
  UPDATE debts              SET "userId" = owner_id WHERE "userId" IS DISTINCT FROM owner_id;
  UPDATE goals              SET "userId" = owner_id WHERE "userId" IS DISTINCT FROM owner_id;
  UPDATE investments        SET "userId" = owner_id WHERE "userId" IS DISTINCT FROM owner_id;
  UPDATE wishlist_items     SET "userId" = owner_id WHERE "userId" IS DISTINCT FROM owner_id;
  UPDATE challenge_configs  SET user_id = owner_id WHERE user_id IS DISTINCT FROM owner_id;

  RAISE NOTICE 'Owner user id: %', owner_id;
END $$;

COMMIT;

-- Verification (run after COMMIT in a new session):
--   SELECT email, role FROM users WHERE email = 'gabrieltc555@gmail.com';
--   SELECT 'accounts' AS t, count(*) FROM accounts WHERE "userId" = (SELECT id FROM users WHERE email='gabrieltc555@gmail.com')
--   UNION ALL SELECT 'transactions', count(*) FROM transactions WHERE "userId" = (SELECT id FROM users WHERE email='gabrieltc555@gmail.com')
--   UNION ALL SELECT 'budgets', count(*) FROM budgets WHERE "userId" = (SELECT id FROM users WHERE email='gabrieltc555@gmail.com')
--   UNION ALL SELECT 'budget_items', count(*) FROM budget_items WHERE "userId" = (SELECT id FROM users WHERE email='gabrieltc555@gmail.com')
--   UNION ALL SELECT 'categories', count(*) FROM categories WHERE "userId" = (SELECT id FROM users WHERE email='gabrieltc555@gmail.com')
--   UNION ALL SELECT 'debts', count(*) FROM debts WHERE "userId" = (SELECT id FROM users WHERE email='gabrieltc555@gmail.com')
--   UNION ALL SELECT 'goals', count(*) FROM goals WHERE "userId" = (SELECT id FROM users WHERE email='gabrieltc555@gmail.com')
--   UNION ALL SELECT 'investments', count(*) FROM investments WHERE "userId" = (SELECT id FROM users WHERE email='gabrieltc555@gmail.com')
--   UNION ALL SELECT 'wishlist_items', count(*) FROM wishlist_items WHERE "userId" = (SELECT id FROM users WHERE email='gabrieltc555@gmail.com')
--   UNION ALL SELECT 'challenge_configs', count(*) FROM challenge_configs WHERE "userId" = (SELECT id FROM users WHERE email='gabrieltc555@gmail.com');
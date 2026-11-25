ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "emailVerified" TIMESTAMP(3);

-- Admins são criados pelo dono: marcados como verificados para não perder o acesso
-- caso o envio de e-mail falhe. Contas CLIENT confirmam no próximo login.
UPDATE "users" SET "emailVerified" = CURRENT_TIMESTAMP WHERE "role" = 'ADMIN' AND "emailVerified" IS NULL;

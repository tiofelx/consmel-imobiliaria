-- E-mails passam a ser gravados e buscados em minúsculas.
-- Contas que colidiriam entre si ficam como estão.
UPDATE "users" AS u SET "email" = lower(u."email")
WHERE u."email" <> lower(u."email")
  AND NOT EXISTS (SELECT 1 FROM "users" AS o WHERE o."id" <> u."id" AND lower(o."email") = lower(u."email"));

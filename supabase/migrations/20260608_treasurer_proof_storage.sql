-- ============================================================
-- Migration : Trésorier + Preuve de paiement + Stockage
-- À exécuter dans Supabase SQL Editor
-- ============================================================

-- 1. Ajouter proof_url à donations (si absent)
ALTER TABLE donations ADD COLUMN IF NOT EXISTS proof_url TEXT;

-- 2. Ajouter le rôle "treasurer" dans admin_users
-- Si role est un enum PostgreSQL :
DO $$ BEGIN
  ALTER TYPE admin_role ADD VALUE IF NOT EXISTS 'treasurer';
EXCEPTION WHEN others THEN
  -- Si ce n'est pas un enum (contrainte CHECK), on met à jour la contrainte
  ALTER TABLE admin_users DROP CONSTRAINT IF EXISTS admin_users_role_check;
  ALTER TABLE admin_users ADD CONSTRAINT admin_users_role_check
    CHECK (role IN ('super_admin', 'finance_manager', 'communication_manager', 'treasurer'));
END $$;

-- Si le bloc DO échoue (Supabase ENUM strict), exécutez manuellement :
-- ALTER TABLE admin_users DROP CONSTRAINT IF EXISTS admin_users_role_check;
-- ALTER TABLE admin_users ADD CONSTRAINT admin_users_role_check
--   CHECK (role IN ('super_admin', 'finance_manager', 'communication_manager', 'treasurer'));

-- 3. Créer le bucket de stockage pour les preuves de paiement
-- public=true : les URLs sont opaques (timestamp + user_id), peu devinables.
-- Pour plus de sécurité, passer à false + signed URLs côté serveur ultérieurement.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'donation-proofs',
  'donation-proofs',
  true,
  5242880,  -- 5 Mo max
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- 4. RLS Storage : les donateurs peuvent uploader dans leur propre dossier
CREATE POLICY "donor_upload_proof"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'donation-proofs' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- 5. RLS Storage : chaque donateur voit ses propres fichiers, les admins/trésorier voient tout
CREATE POLICY "view_proofs"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'donation-proofs' AND (
      (storage.foldername(name))[1] = auth.uid()::text OR
      EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid())
    )
  );

-- 6. RLS Storage : les donateurs peuvent supprimer leurs propres fichiers
CREATE POLICY "donor_delete_proof"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'donation-proofs' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

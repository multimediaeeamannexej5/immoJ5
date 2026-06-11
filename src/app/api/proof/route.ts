import { NextResponse } from 'next/server'
import { createClient }      from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * GET /api/proof?id=<donation_id>
 *
 * Proxy authentifié pour les reçus de paiement.
 * Masque l'URL Supabase — seule l'URL /api/proof?id=... est visible.
 * Accès réservé aux admin_users (tous les rôles).
 *
 * Utilise le SDK Supabase (.download) plutôt que fetch() direct
 * pour éviter les échecs de redirection HTTP sous undici (Node ≥ 18).
 */

const BUCKET = 'donation-proofs'

/** Déduit le MIME type à partir de l'extension */
function mimeFromExt(ext: string): string {
  const map: Record<string, string> = {
    jpg:  'image/jpeg',
    jpeg: 'image/jpeg',
    png:  'image/png',
    webp: 'image/webp',
    gif:  'image/gif',
    svg:  'image/svg+xml',
    pdf:  'application/pdf',
  }
  return map[ext.toLowerCase()] ?? 'application/octet-stream'
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const donationId = searchParams.get('id')

    if (!donationId) {
      return NextResponse.json({ error: 'Paramètre id manquant.' }, { status: 400 })
    }

    /* ── Vérification auth ─────────────────────────────────────── */
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })
    }

    const adminClient = createAdminClient()
    const { data: adminData } = await adminClient
      .from('admin_users')
      .select('id')
      .eq('id', user.id)
      .single()

    if (!adminData) {
      return NextResponse.json({ error: 'Accès refusé.' }, { status: 403 })
    }

    /* ── Récupérer l'URL stockée du reçu ─────────────────────── */
    const { data: donation } = await adminClient
      .from('donations')
      .select('proof_url')
      .eq('id', donationId)
      .single()

    if (!donation?.proof_url) {
      return NextResponse.json({ error: 'Reçu introuvable.' }, { status: 404 })
    }

    /* ── Extraire le chemin relatif dans le bucket ─────────────
     * proof_url ressemble à :
     * https://<ref>.supabase.co/storage/v1/object/public/donation-proofs/monthly/xxx.jpg
     * On extrait la partie après "/object/public/donation-proofs/"
     * ─────────────────────────────────────────────────────────── */
    const urlObj = new URL(donation.proof_url)
    const marker = `/object/public/${BUCKET}/`
    const idx    = urlObj.pathname.indexOf(marker)
    if (idx === -1) {
      return NextResponse.json({ error: 'URL de reçu invalide.' }, { status: 500 })
    }
    const filePath = decodeURIComponent(urlObj.pathname.slice(idx + marker.length))

    /* ── Télécharger via le SDK (aucun fetch HTTP direct → pas de
     *    problème de redirection undici)                          */
    const { data: blob, error: downloadError } = await adminClient.storage
      .from(BUCKET)
      .download(filePath)

    if (downloadError || !blob) {
      console.error('[api/proof] download error', downloadError)
      return NextResponse.json({ error: 'Fichier inaccessible.' }, { status: 502 })
    }

    /* ── Retransmettre ─────────────────────────────────────────── */
    const buffer   = await blob.arrayBuffer()
    const ext      = filePath.split('.').pop() ?? 'bin'
    const contentType = blob.type && blob.type !== 'application/octet-stream'
      ? blob.type
      : mimeFromExt(ext)
    const filename = `recu_${donationId.slice(0, 8)}.${ext}`

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type':        contentType,
        'Content-Disposition': `inline; filename="${filename}"`,
        'Cache-Control':       'private, max-age=3600',
        'Referrer-Policy':     'no-referrer',
      },
    })
  } catch (err) {
    console.error('[api/proof]', err)
    return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 })
  }
}

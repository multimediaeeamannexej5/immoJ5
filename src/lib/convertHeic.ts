/**
 * Conversion HEIC/HEIF → JPEG côté client.
 * Importé dynamiquement pour ne jamais s'exécuter côté serveur (SSR).
 *
 * Retourne le fichier original si ce n'est pas du HEIC,
 * ou si la conversion échoue (dégradation gracieuse).
 */
export async function convertHeicIfNeeded(file: File): Promise<File> {
  const isHeic =
    file.name.toLowerCase().endsWith('.heic') ||
    file.name.toLowerCase().endsWith('.heif') ||
    file.type === 'image/heic' ||
    file.type === 'image/heif'

  if (!isHeic) return file

  try {
    // Import dynamique : évite le chargement côté serveur / pendant le SSR
    const heic2any = (await import('heic2any')).default
    const result   = await heic2any({ blob: file, toType: 'image/jpeg', quality: 0.85 })
    const blob     = Array.isArray(result) ? result[0] : result
    const newName  = file.name.replace(/\.(heic|heif)$/i, '.jpg')
    return new File([blob], newName, { type: 'image/jpeg' })
  } catch (err) {
    console.warn('[convertHeic] Conversion échouée, fichier original conservé :', err)
    return file // dégradation gracieuse
  }
}

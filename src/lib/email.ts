import nodemailer from 'nodemailer'

// ── Transport Gmail ────────────────────────────────────────────────────────
const transporter = nodemailer.createTransport({
  host:   'smtp.gmail.com',
  port:   465,
  secure: true, // SSL direct (évite STARTTLS bloqué par certains réseaux)
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
})

const FROM = `EEAM Annexe J5 <${process.env.GMAIL_USER}>`
const SITE  = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

// ── Styles communs ─────────────────────────────────────────────────────────
const emailWrapper = (content: string) => `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head>
<body style="margin:0;padding:0;background:#f0f3f8;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f3f8;padding:32px 16px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #dde3ee;">

        <!-- Header -->
        <tr>
          <td style="background:#0A0B10;padding:24px 32px;text-align:center;">
            <span style="color:#ffffff;font-size:20px;font-weight:700;letter-spacing:-0.5px;">
              EEAM <span style="color:#1A7A8A;">Annexe J5</span>
            </span>
            <br/>
            <span style="color:#6b7280;font-size:12px;">Projet Immobilier</span>
          </td>
        </tr>

        <!-- Contenu -->
        <tr>
          <td style="padding:32px;">
            ${content}
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#f8fafc;border-top:1px solid #dde3ee;padding:20px 32px;text-align:center;">
            <p style="margin:0;color:#94a3b8;font-size:12px;">
              © ${new Date().getFullYear()} EEAM Annexe J5 — Plateforme de dons<br/>
              <a href="${SITE}" style="color:#1A7A8A;text-decoration:none;">${SITE}</a>
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>
`

const btnStyle = 'display:inline-block;padding:12px 28px;background:#BE1E2D;color:#ffffff;text-decoration:none;border-radius:10px;font-weight:700;font-size:14px;'

// ══════════════════════════════════════════════════════════════════════════
// 1. Confirmation de paiement validé
// ══════════════════════════════════════════════════════════════════════════
export async function sendPaymentConfirmationEmail({
  toEmail,
  donorName,
  amount,
  donationId,
}: {
  toEmail:    string
  donorName:  string
  amount:     number
  donationId: string
}) {
  const formatted = new Intl.NumberFormat('fr-MA', {
    style: 'currency', currency: 'MAD', minimumFractionDigits: 2,
  }).format(amount)

  const html = emailWrapper(`
    <h2 style="margin:0 0 8px;color:#0f172a;font-size:22px;">Don confirmé ✓</h2>
    <p style="margin:0 0 20px;color:#475569;font-size:14px;">Bonjour <strong>${donorName}</strong>,</p>
    <p style="margin:0 0 20px;color:#334155;font-size:15px;line-height:1.6;">
      Votre don de <strong style="color:#BE1E2D;">${formatted}</strong> a été vérifié et validé par notre équipe.
      Que Dieu bénisse votre générosité !
    </p>
    <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:16px 20px;margin-bottom:24px;">
      <p style="margin:0;color:#166534;font-size:13px;">
        🙏 Merci pour votre contribution au Projet Immobilier de l'EEAM Annexe J5.
        Chaque don nous rapproche de notre objectif.
      </p>
    </div>
    <p style="margin:0 0 24px;color:#64748b;font-size:13px;">Référence : <code style="background:#f1f5f9;padding:2px 6px;border-radius:4px;font-size:12px;">${donationId}</code></p>
    <a href="${SITE}/dashboard" style="${btnStyle}">Voir mon tableau de bord</a>
    <p style="margin:24px 0 0;color:#94a3b8;font-size:12px;">
      Si vous avez des questions, contactez-nous à <a href="mailto:${process.env.GMAIL_USER}" style="color:#1A7A8A;">${process.env.GMAIL_USER}</a>
    </p>
  `)

  await transporter.sendMail({
    from:    FROM,
    to:      toEmail,
    subject: `✓ Don de ${formatted} confirmé — EEAM Annexe J5`,
    html,
  })
}

// ══════════════════════════════════════════════════════════════════════════
// 2. Rappel mensuel (don en attente / aucun don ce mois)
// ══════════════════════════════════════════════════════════════════════════
export async function sendMonthlyReminderEmail({
  toEmail,
  donorName,
  hasPendingDonation,
}: {
  toEmail:            string
  donorName:          string
  hasPendingDonation: boolean
}) {
  const month = new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })

  const msgBody = hasPendingDonation
    ? `Votre don du mois de <strong>${month}</strong> est en attente de validation.
       Notre équipe le traitera très prochainement.`
    : `Nous n'avons pas encore reçu votre don pour le mois de <strong>${month}</strong>.
       Si vous souhaitez contribuer ce mois-ci, il est encore temps !`

  const html = emailWrapper(`
    <h2 style="margin:0 0 8px;color:#0f172a;font-size:22px;">Rappel — ${month}</h2>
    <p style="margin:0 0 20px;color:#475569;font-size:14px;">Bonjour <strong>${donorName}</strong>,</p>
    <p style="margin:0 0 20px;color:#334155;font-size:15px;line-height:1.6;">${msgBody}</p>
    <div style="background:#fefce8;border:1px solid #fde68a;border-radius:10px;padding:16px 20px;margin-bottom:24px;">
      <p style="margin:0;color:#854d0e;font-size:13px;">
        📌 Votre soutien mensuel est précieux pour atteindre notre objectif de 2 405 000 MAD.
      </p>
    </div>
    <a href="${SITE}/donate" style="${btnStyle}">Faire un don maintenant</a>
    <p style="margin:24px 0 0;color:#94a3b8;font-size:12px;">
      Pour vous désabonner de ces rappels, contactez-nous à
      <a href="mailto:${process.env.GMAIL_USER}" style="color:#1A7A8A;">${process.env.GMAIL_USER}</a>
    </p>
  `)

  await transporter.sendMail({
    from:    FROM,
    to:      toEmail,
    subject: `Rappel don mensuel — ${month} — EEAM Annexe J5`,
    html,
  })
}

// ══════════════════════════════════════════════════════════════════════════
// 3. Email de bienvenue (création de compte)
// ══════════════════════════════════════════════════════════════════════════
export async function sendWelcomeEmail({
  toEmail,
  fullName,
}: {
  toEmail:  string
  fullName: string
}) {
  const html = emailWrapper(`
    <h2 style="margin:0 0 8px;color:#0f172a;font-size:22px;">Bienvenue dans la communauté 🎉</h2>
    <p style="margin:0 0 20px;color:#475569;font-size:14px;">Bonjour <strong>${fullName}</strong>,</p>
    <p style="margin:0 0 20px;color:#334155;font-size:15px;line-height:1.6;">
      Votre compte a été créé avec succès sur la plateforme de dons de
      l&apos;<strong>EEAM Annexe J5</strong>.<br/>
      Vous pouvez dès maintenant vous connecter et contribuer au projet immobilier.
    </p>
    <div style="background:#fef3f2;border:1px solid #fecaca;border-radius:10px;padding:16px 20px;margin-bottom:24px;">
      <p style="margin:0;color:#991b1b;font-size:14px;font-weight:600;">
        🙏 Merci de rejoindre notre communauté.<br/>
        <span style="font-weight:400;">C&apos;est à nous de bâtir la maison de Dieu !</span>
      </p>
    </div>
    <a href="${SITE}/auth/login" style="${btnStyle}">Accéder à mon espace</a>
    <p style="margin:24px 0 0;color:#94a3b8;font-size:12px;">
      Si vous n&apos;avez pas créé ce compte, contactez-nous à
      <a href="mailto:${process.env.GMAIL_USER}" style="color:#1A7A8A;">${process.env.GMAIL_USER}</a>
    </p>
  `)

  await transporter.sendMail({
    from:    FROM,
    to:      toEmail,
    subject: '🙏 Bienvenue sur la plateforme EEAM Annexe J5',
    html,
  })
}

// ══════════════════════════════════════════════════════════════════════════
// 4. Rejet de paiement
// ══════════════════════════════════════════════════════════════════════════
export async function sendRejectionEmail({
  toEmail, donorName, amount, donationId, adminNotes,
}: {
  toEmail:     string
  donorName:   string
  amount:      number
  donationId:  string
  adminNotes?: string
}) {
  const formatted = new Intl.NumberFormat('fr-MA', {
    style: 'currency', currency: 'MAD', minimumFractionDigits: 2,
  }).format(amount)

  const html = emailWrapper(`
    <h2 style="margin:0 0 8px;color:#0f172a;font-size:22px;">Paiement non validé ⚠️</h2>
    <p style="margin:0 0 20px;color:#475569;font-size:14px;">Bonjour <strong>${donorName}</strong>,</p>
    <p style="margin:0 0 20px;color:#334155;font-size:15px;line-height:1.6;">
      Nous avons examiné votre versement de <strong style="color:#BE1E2D;">${formatted}</strong>,
      mais nous n&apos;avons pas pu le valider.
    </p>
    ${adminNotes ? `
    <div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:10px;padding:16px 20px;margin-bottom:24px;">
      <p style="margin:0;color:#9a3412;font-size:13px;">📋 <strong>Motif :</strong> ${adminNotes}</p>
    </div>` : ''}
    <p style="margin:0 0 24px;color:#64748b;font-size:13px;">
      Veuillez soumettre à nouveau votre paiement en vous assurant que le reçu est lisible
      et correspond au bon montant.<br/>
      Référence : <code style="background:#f1f5f9;padding:2px 6px;border-radius:4px;font-size:12px;">${donationId}</code>
    </p>
    <a href="${SITE}/donate" style="${btnStyle}">Soumettre à nouveau</a>
    <p style="margin:24px 0 0;color:#94a3b8;font-size:12px;">
      Pour toute question : <a href="mailto:${process.env.GMAIL_USER}" style="color:#1A7A8A;">${process.env.GMAIL_USER}</a>
    </p>
  `)

  await transporter.sendMail({
    from:    FROM,
    to:      toEmail,
    subject: `⚠️ Votre paiement de ${formatted} n'a pas été validé — EEAM Annexe J5`,
    html,
  })
}

// ══════════════════════════════════════════════════════════════════════════
// 5. Paiement en retard
// ══════════════════════════════════════════════════════════════════════════
export async function sendOverdueEmail({
  toEmail, donorName, amount, donationId,
}: {
  toEmail:    string
  donorName:  string
  amount:     number
  donationId: string
}) {
  const formatted = new Intl.NumberFormat('fr-MA', {
    style: 'currency', currency: 'MAD', minimumFractionDigits: 2,
  }).format(amount)

  const html = emailWrapper(`
    <h2 style="margin:0 0 8px;color:#0f172a;font-size:22px;">Paiement en retard ⏰</h2>
    <p style="margin:0 0 20px;color:#475569;font-size:14px;">Bonjour <strong>${donorName}</strong>,</p>
    <p style="margin:0 0 20px;color:#334155;font-size:15px;line-height:1.6;">
      Votre paiement de <strong style="color:#BE1E2D;">${formatted}</strong> est marqué en retard.
      Nous vous invitons à régulariser votre situation dès que possible.
    </p>
    <div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:10px;padding:16px 20px;margin-bottom:24px;">
      <p style="margin:0;color:#9a3412;font-size:13px;">
        ⏰ Votre engagement mensuel est important pour la progression du projet. Chaque contribution compte !
      </p>
    </div>
    <p style="margin:0 0 24px;color:#64748b;font-size:13px;">
      Référence : <code style="background:#f1f5f9;padding:2px 6px;border-radius:4px;font-size:12px;">${donationId}</code>
    </p>
    <a href="${SITE}/donate" style="${btnStyle}">Régulariser mon paiement</a>
    <p style="margin:24px 0 0;color:#94a3b8;font-size:12px;">
      Pour toute question : <a href="mailto:${process.env.GMAIL_USER}" style="color:#1A7A8A;">${process.env.GMAIL_USER}</a>
    </p>
  `)

  await transporter.sendMail({
    from:    FROM,
    to:      toEmail,
    subject: `⏰ Paiement en retard — EEAM Annexe J5`,
    html,
  })
}

// ══════════════════════════════════════════════════════════════════════════
// 6. Engagement complété (pack entièrement payé)
// ══════════════════════════════════════════════════════════════════════════
export async function sendCompletionEmail({
  toEmail, donorName, packName, totalAmount,
}: {
  toEmail:     string
  donorName:   string
  packName:    string
  totalAmount: number
}) {
  const formatted = new Intl.NumberFormat('fr-MA', {
    style: 'currency', currency: 'MAD', minimumFractionDigits: 2,
  }).format(totalAmount)

  const html = emailWrapper(`
    <h2 style="margin:0 0 8px;color:#0f172a;font-size:22px;">Engagement complété 🎉</h2>
    <p style="margin:0 0 20px;color:#475569;font-size:14px;">Bonjour <strong>${donorName}</strong>,</p>
    <p style="margin:0 0 20px;color:#334155;font-size:15px;line-height:1.6;">
      Félicitations ! Vous avez complété votre engagement pour le pack
      <strong style="color:#1A7A8A;">${packName}</strong>.
      Votre contribution totale de <strong style="color:#BE1E2D;">${formatted}</strong>
      a été entièrement validée.
    </p>
    <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:16px 20px;margin-bottom:24px;">
      <p style="margin:0;color:#166534;font-size:14px;font-weight:600;">
        🙏 Merci infiniment pour votre fidélité et votre générosité !<br/>
        <span style="font-weight:400;">Que Dieu bénisse votre famille et récompense votre sacrifice.</span>
      </p>
    </div>
    <a href="${SITE}/dashboard" style="${btnStyle}">Voir mon tableau de bord</a>
    <p style="margin:24px 0 0;color:#94a3b8;font-size:12px;">
      Pour toute question : <a href="mailto:${process.env.GMAIL_USER}" style="color:#1A7A8A;">${process.env.GMAIL_USER}</a>
    </p>
  `)

  await transporter.sendMail({
    from:    FROM,
    to:      toEmail,
    subject: `🎉 Engagement complété — Merci ${donorName} ! — EEAM Annexe J5`,
    html,
  })
}

// ══════════════════════════════════════════════════════════════════════════
// 7. Code de vérification 2FA
// ══════════════════════════════════════════════════════════════════════════
export async function send2FACodeEmail({
  toEmail,
  fullName,
  code,
}: {
  toEmail:  string
  fullName: string
  code:     string
}) {
  const html = emailWrapper(`
    <h2 style="margin:0 0 8px;color:#0f172a;font-size:22px;">Code de vérification 🔐</h2>
    <p style="margin:0 0 20px;color:#475569;font-size:14px;">Bonjour <strong>${fullName}</strong>,</p>
    <p style="margin:0 0 20px;color:#334155;font-size:15px;line-height:1.6;">
      Voici votre code de vérification à usage unique.
      Il expire dans <strong>10 minutes</strong>.
    </p>
    <div style="background:#f8fafc;border:2px solid #1A7A8A;border-radius:16px;padding:28px;text-align:center;margin-bottom:24px;">
      <div style="font-size:42px;font-weight:800;letter-spacing:14px;color:#0f172a;font-family:monospace;">${code}</div>
    </div>
    <p style="margin:0 0 12px;color:#64748b;font-size:13px;">
      Ne partagez jamais ce code avec quiconque.
      Si vous n&apos;avez pas tenté de vous connecter, ignorez cet email et changez votre mot de passe.
    </p>
    <p style="margin:0;color:#94a3b8;font-size:12px;">
      Ce code est valable <strong>10 minutes</strong> et ne peut être utilisé qu&apos;une seule fois.
    </p>
  `)

  await transporter.sendMail({
    from:    FROM,
    to:      toEmail,
    subject: `🔐 Votre code de connexion : ${code} — EEAM Annexe J5`,
    html,
  })
}

// ══════════════════════════════════════════════════════════════════════════
// 8. Test de connexion SMTP (utilitaire admin)
// ══════════════════════════════════════════════════════════════════════════
export async function verifyEmailConnection(): Promise<boolean> {
  try {
    await transporter.verify()
    return true
  } catch {
    return false
  }
}

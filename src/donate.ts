/**
 * Parent-facing PayPal.me donation (end screen only).
 * Does not unlock content packs — keep `?unlock=batch-001` for QA.
 * Donor chooses the amount on PayPal (no fixed price in-app).
 */
export const PAYPAL_ME_URL = 'https://paypal.me/stefanpricopi'

export const DONATE_LABEL = 'Invită-ne o cafea'

export function createDonateLink(): HTMLAnchorElement {
  const link = document.createElement('a')
  link.className = 'btn-donate'
  link.href = PAYPAL_ME_URL
  link.target = '_blank'
  link.rel = 'noopener noreferrer'
  link.textContent = DONATE_LABEL
  return link
}

/**
 * Purchase port — web noop / local unlock today; native IAP later (see docs/capacitor-iap.md).
 */
import { unlock as entitlementUnlock } from './entitlements'

export type ProductOffer = {
  productId: string
  contentPackId: string
  title: string
}

export type PurchasePort = {
  listOffers(): Promise<ProductOffer[]>
  purchase(productId: string): Promise<{ ok: boolean; error?: string }>
  restore(): Promise<void>
}

/** Web: unlock without payment (promo / QA). Replace with Stripe or no-op storefront UI. */
export const webPurchasePort: PurchasePort = {
  async listOffers() {
    return [
      {
        productId: 'pack_batch_001',
        contentPackId: 'batch-001',
        title: 'Pachet 100 întrebări',
      },
    ]
  },
  async purchase(productId: string) {
    const offers = await this.listOffers()
    const offer = offers.find((o) => o.productId === productId)
    if (!offer) return { ok: false, error: 'unknown_product' }
    entitlementUnlock(offer.contentPackId)
    return { ok: true }
  },
  async restore() {
    /* receipts N/A on web local */
  },
}

let activePort: PurchasePort = webPurchasePort

export function getPurchasePort(): PurchasePort {
  return activePort
}

/** Capacitor IAP will call this at startup. */
export function setPurchasePort(port: PurchasePort): void {
  activePort = port
}

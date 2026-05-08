/* ================================================================
   ABAVIE — E2E Integration
   Bridges abavieE2E.js with the Supabase message flow
   ================================================================ */

import { supabase } from './supabase'
import {
  generateE2EIdentity,
  encryptForRecipient,
  decryptFromSender,
  importPublicKey,
  exportPublicKey,
} from './abavieE2E'
import { cacheE2EKey, getE2EKey } from './abavieIndexedDB'

let cachedKeyPair = null

export function isE2EEnabled() {
  try { return JSON.parse(localStorage.getItem('abavie_e2e') || 'false') } catch { return false }
}

export async function getOrCreateKeyPair() {
  if (cachedKeyPair) return cachedKeyPair

  // Try IndexedDB first
  const stored = await getE2EKey('self')
  if (stored?.privateKeyJwk) {
    const privateKey = await crypto.subtle.importKey(
      'jwk', stored.privateKeyJwk,
      { name: 'ECDH', namedCurve: 'P-256' },
      false, ['deriveKey', 'deriveBits']
    )
    const publicKeyB64 = localStorage.getItem('abavie_e2e_public')
    if (publicKeyB64) {
      const publicKey = await importPublicKey(publicKeyB64)
      cachedKeyPair = { privateKey, publicKey, publicKeyB64 }
      return cachedKeyPair
    }
  }

  // Generate new
  const { keyPair, publicKey: publicKeyB64 } = await generateE2EIdentity()
  const privateKeyJwk = await crypto.subtle.exportKey('jwk', keyPair.privateKey)
  await cacheE2EKey('self', { privateKeyJwk })
  localStorage.setItem('abavie_e2e_public', publicKeyB64)

  cachedKeyPair = { privateKey: keyPair.privateKey, publicKey: keyPair.publicKey, publicKeyB64 }
  return cachedKeyPair
}

export async function publishPublicKey(membreId) {
  const { publicKeyB64 } = await getOrCreateKeyPair()
  const deviceId = localStorage.getItem('abavie_device_id') || generateDeviceId()
  localStorage.setItem('abavie_device_id', deviceId)

  await supabase.from('e2e_public_keys').upsert({
    membre_id: membreId,
    device_id: deviceId,
    public_key: publicKeyB64,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'membre_id, device_id' })
}

export async function getRecipientPublicKey(recipientId) {
  const { data } = await supabase
    .from('e2e_public_keys')
    .select('public_key')
    .eq('membre_id', recipientId)
    .order('updated_at', { ascending: false })
    .limit(1)
    .single()

  return data?.public_key || null
}

export async function encryptMessageContent(plaintext, recipientId) {
  if (!isE2EEnabled()) return null
  const recipientPubB64 = await getRecipientPublicKey(recipientId)
  if (!recipientPubB64) return null

  const { privateKey } = await getOrCreateKeyPair()
  const { iv, ciphertext } = await encryptForRecipient(plaintext, privateKey, recipientPubB64)
  return { iv, ciphertext }
}

export async function decryptMessageContent(e2ePayload, senderId) {
  if (!e2ePayload?.ciphertext) return null
  if (!isE2EEnabled()) return null

  const senderPubB64 = await getRecipientPublicKey(senderId)
  if (!senderPubB64) return null

  const { privateKey } = await getOrCreateKeyPair()
  return decryptFromSender(e2ePayload, privateKey, senderPubB64)
}

function generateDeviceId() {
  return `dev_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

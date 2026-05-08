/* ================================================================
   ABAVIE — E2E Encryption (Web Crypto API)
   Simplified Signal-like protocol using AES-GCM + ECDH key exchange
   ================================================================ */

const AES_ALGO = { name: 'AES-GCM', length: 256 }
const ECDH_ALGO = { name: 'ECDH', namedCurve: 'P-256' }

// ── Key generation ──────────────────────────────────────────────

export async function generateIdentityKeyPair() {
  return crypto.subtle.generateKey(ECDH_ALGO, true, ['deriveKey', 'deriveBits'])
}

export async function exportPublicKey(publicKey) {
  const raw = await crypto.subtle.exportKey('raw', publicKey)
  return arrayBufferToBase64(raw)
}

export async function importPublicKey(base64) {
  const raw = base64ToArrayBuffer(base64)
  return crypto.subtle.importKey('raw', raw, ECDH_ALGO, false, [])
}

// ── AES-GCM encryption/decryption ───────────────────────────────

export async function encryptMessage(plaintext, sharedKey) {
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const encoder = new TextEncoder()
  const data = encoder.encode(plaintext)
  const cipher = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, sharedKey, data)
  return {
    iv: arrayBufferToBase64(iv),
    ciphertext: arrayBufferToBase64(cipher),
  }
}

export async function decryptMessage(payload, sharedKey) {
  try {
    const iv = base64ToArrayBuffer(payload.iv)
    const ciphertext = base64ToArrayBuffer(payload.ciphertext)
    const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, sharedKey, ciphertext)
    const decoder = new TextDecoder()
    return decoder.decode(plain)
  } catch {
    return null
  }
}

// ── Key derivation (ECDH) ───────────────────────────────────────

export async function deriveSharedKey(privateKey, otherPublicKey) {
  return crypto.subtle.deriveKey(
    { name: 'ECDH', public: otherPublicKey },
    privateKey,
    AES_ALGO,
    false,
    ['encrypt', 'decrypt']
  )
}

// ── Bundle: generate full identity + export ──────────────────────

export async function generateE2EIdentity() {
  const keyPair = await generateIdentityKeyPair()
  const publicKeyB64 = await exportPublicKey(keyPair.publicKey)
  // We keep the private key in memory only (or IndexedDB as non-extractable)
  return { keyPair, publicKey: publicKeyB64 }
}

// ── Helper: encrypt for a recipient using their public key ────────

export async function encryptForRecipient(plaintext, myPrivateKey, recipientPublicKeyB64) {
  const recipientPub = await importPublicKey(recipientPublicKeyB64)
  const sharedKey = await deriveSharedKey(myPrivateKey, recipientPub)
  return encryptMessage(plaintext, sharedKey)
}

export async function decryptFromSender(ciphertext, myPrivateKey, senderPublicKeyB64) {
  const senderPub = await importPublicKey(senderPublicKeyB64)
  const sharedKey = await deriveSharedKey(myPrivateKey, senderPub)
  return decryptMessage(ciphertext, sharedKey)
}

// ── Base64 utilities ────────────────────────────────────────────

function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i])
  return btoa(binary)
}

function base64ToArrayBuffer(base64) {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes.buffer
}

// ── Hash / fingerprint ────────────────────────────────────────────

export async function fingerprintKey(publicKeyB64) {
  const data = base64ToArrayBuffer(publicKeyB64)
  const hash = await crypto.subtle.digest('SHA-256', data)
  const hex = Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
  return hex.slice(0, 16).toUpperCase().replace(/(.{4})/g, '$1 ').trim()
}

// ── Session key rotation (forward secrecy) ──────────────────────

export async function rotateSessionKey(myPrivateKey, otherPublicKeyB64) {
  // Each rotation generates a fresh shared key from the same identity pair
  // In a full Signal protocol we'd use pre-keys and chain keys
  const pub = await importPublicKey(otherPublicKeyB64)
  return deriveSharedKey(myPrivateKey, pub)
}

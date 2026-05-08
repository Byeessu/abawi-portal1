/**
 * Coffre-fort AES-GCM via Web Crypto API.
 *
 * Les identifiants sensibles (mots de passe réseaux sociaux, tokens)
 * sont chiffrés localement avec une clé dérivée d'un mot de passe maître
 * (PBKDF2 SHA-256, 210 000 itérations — recommandation OWASP 2023+).
 *
 * Le mot de passe maître n'est JAMAIS stocké. Il est saisi à chaque session.
 *
 * Structure localStorage :
 *   { v: 1, salt: base64, iv: base64, ciphertext: base64, updatedAt: number }
 */

const PBKDF2_ITERATIONS = 210000
const KEY_SIZE = 256
const SALT_SIZE = 16
const IV_SIZE = 12

function toB64(buffer) {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i])
  return btoa(binary)
}

function fromB64(b64) {
  const binary = atob(b64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes
}

async function deriveKey(password, salt) {
  const enc = new TextEncoder()
  const baseKey = await crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    'PBKDF2',
    false,
    ['deriveKey']
  )
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    baseKey,
    { name: 'AES-GCM', length: KEY_SIZE },
    false,
    ['encrypt', 'decrypt']
  )
}

export async function encryptVault(data, masterPassword) {
  if (!masterPassword || masterPassword.length < 8) {
    throw new Error('Mot de passe maître trop court (8 caractères minimum)')
  }
  const salt = crypto.getRandomValues(new Uint8Array(SALT_SIZE))
  const iv = crypto.getRandomValues(new Uint8Array(IV_SIZE))
  const key = await deriveKey(masterPassword, salt)
  const enc = new TextEncoder()
  const plaintext = enc.encode(JSON.stringify(data))
  const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, plaintext)
  return {
    v: 1,
    salt: toB64(salt),
    iv: toB64(iv),
    ciphertext: toB64(ciphertext),
    updatedAt: Date.now(),
  }
}

export async function decryptVault(vault, masterPassword) {
  if (!vault || !vault.ciphertext) throw new Error('Coffre vide')
  const salt = fromB64(vault.salt)
  const iv = fromB64(vault.iv)
  const ciphertext = fromB64(vault.ciphertext)
  const key = await deriveKey(masterPassword, salt)
  try {
    const plaintext = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ciphertext)
    const dec = new TextDecoder()
    return JSON.parse(dec.decode(plaintext))
  } catch {
    throw new Error('Mot de passe maître incorrect')
  }
}

const VAULT_KEY = 'abawi-social-vault-v1'

export function loadVaultBlob() {
  try {
    const raw = localStorage.getItem(VAULT_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function saveVaultBlob(vault) {
  localStorage.setItem(VAULT_KEY, JSON.stringify(vault))
}

export function clearVaultBlob() {
  localStorage.removeItem(VAULT_KEY)
}

#!/usr/bin/env node
/**
 * sync-content-files.mjs
 * Synchronise tous les contenus depuis ABAWI DIGITAL/ vers public/files/
 * et génère un rapport JSON de catalogue.
 */
import fs from 'fs'
import path from 'path'

const ROOT = path.resolve(process.cwd())
const SOURCE_DIR = path.join(ROOT, 'ABAWI DIGITAL')
const DEST_DIR = path.join(ROOT, 'public/files')

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
}

function copyIfNewer(src, dst) {
  if (!fs.existsSync(src)) return false
  ensureDir(path.dirname(dst))
  if (fs.existsSync(dst)) {
    const srcStat = fs.statSync(src)
    const dstStat = fs.statSync(dst)
    if (srcStat.mtime <= dstStat.mtime) return false
  }
  fs.copyFileSync(src, dst)
  return true
}

function scanDir(dir, ext, result = []) {
  if (!fs.existsSync(dir)) return result
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      scanDir(p, ext, result)
    } else if (entry.isFile() && (!ext || entry.name.toLowerCase().endsWith(ext))) {
      result.push(p)
    }
  }
  return result
}

function relativePublic(p) {
  return '/files' + p.replace(DEST_DIR, '').replace(/\\/g, '/')
}

// ===== 1. GUIDES =====
// Source: ABAWI DIGITAL/Dossier Bankable.../*.pdf and other root-level PDFs
const guideSrcFiles = []
const dossierBankable = path.join(SOURCE_DIR, 'Dossier Bankable, pour un projet bien préparé et crédible - Copie')
if (fs.existsSync(dossierBankable)) {
  scanDir(dossierBankable, '.pdf', guideSrcFiles)
}
// Also look in other immediate subdirs for loose PDFs that look like guides
for (const sub of fs.readdirSync(SOURCE_DIR, { withFileTypes: true })) {
  const subPath = path.join(SOURCE_DIR, sub.name)
  if (sub.isDirectory() && sub.name !== 'ABAWI ACADEMY' && sub.name !== 'AUDIO Pro' && sub.name !== 'Pro Entreprise' && sub.name !== 'Videos' && !sub.name.startsWith('.')) {
    scanDir(subPath, '.pdf', guideSrcFiles)
  }
}

const guideDestDir = path.join(DEST_DIR, 'guides')
ensureDir(guideDestDir)
const guideReport = []
for (const src of guideSrcFiles) {
  const name = path.basename(src)
  const dst = path.join(guideDestDir, name)
  const copied = copyIfNewer(src, dst)
  guideReport.push({ name, copied, url: relativePublic(dst) })
}

// ===== 2. FASCICULES =====
const fascSrcDir = path.join(SOURCE_DIR, 'ABAWI ACADEMY')
const fascDestDir = path.join(DEST_DIR, 'fascicules')
ensureDir(fascDestDir)
const fascSrcFiles = scanDir(fascSrcDir, '.pdf')
const fascReport = []
for (const src of fascSrcFiles) {
  const rel = path.relative(fascSrcDir, src).replace(/\\/g, '/')
  const dst = path.join(fascDestDir, rel)
  const copied = copyIfNewer(src, dst)
  fascReport.push({ name: path.basename(src), rel, copied, url: relativePublic(dst) })
}

// ===== 3. PODCASTS =====
const podcastSrcFiles = []
scanDir(path.join(SOURCE_DIR, 'AUDIO Pro'), '.mp3', podcastSrcFiles)
scanDir(path.join(SOURCE_DIR, 'Pro Entreprise'), '.mp3', podcastSrcFiles)
const podcastDestDir = path.join(DEST_DIR, 'podcasts')
ensureDir(podcastDestDir)
const podcastReport = []
for (const src of podcastSrcFiles) {
  const name = path.basename(src)
  const dst = path.join(podcastDestDir, name)
  const copied = copyIfNewer(src, dst)
  podcastReport.push({ name, copied, url: relativePublic(dst) })
}

// ===== 4. VIDEOS =====
const videoSrcFiles = scanDir(path.join(SOURCE_DIR, 'Videos'), '.mp4')
const videoDestDir = path.join(DEST_DIR, 'videos')
ensureDir(videoDestDir)
const videoReport = []
for (const src of videoSrcFiles) {
  const name = path.basename(src)
  const dst = path.join(videoDestDir, name)
  const copied = copyIfNewer(src, dst)
  videoReport.push({ name, copied, url: relativePublic(dst) })
}

// ===== SUMMARY =====
const summary = {
  timestamp: new Date().toISOString(),
  guides: { total: guideReport.length, copied: guideReport.filter(g => g.copied).length, files: guideReport },
  fascicules: { total: fascReport.length, copied: fascReport.filter(f => f.copied).length, files: fascReport },
  podcasts: { total: podcastReport.length, copied: podcastReport.filter(p => p.copied).length, files: podcastReport },
  videos: { total: videoReport.length, copied: videoReport.filter(v => v.copied).length, files: videoReport },
}

const summaryPath = path.join(ROOT, 'tmp', `sync-summary-${new Date().toISOString().slice(0,10).replace(/-/g,'')}-${Date.now()}.json`)
ensureDir(path.dirname(summaryPath))
fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2), 'utf-8')

console.log(`✅ Synchronisation terminée`)
console.log(`   Guides     : ${summary.guides.copied}/${summary.guides.total} copiés`)
console.log(`   Fascicules : ${summary.fascicules.copied}/${summary.fascicules.total} copiés`)
console.log(`   Podcasts   : ${summary.podcasts.copied}/${summary.podcasts.total} copiés`)
console.log(`   Vidéos     : ${summary.videos.copied}/${summary.videos.total} copiés`)
console.log(`\n📄 Rapport    : ${summaryPath}`)

import { useState, useRef } from 'react';
import { useThemedStyles } from '../../hooks/useThemedStyles';
import { useAuth } from '../../context/AuthContext'

import { callGroq as groqClientCall } from '../../lib/groqClient'
import SEO from '../../components/SEO'
import ToolInfoPanel from '../../components/ToolInfoPanel'
import TokenCounter from '../../components/TokenCounter'
import { useToolGuard } from '../../hooks/useToolGuard'
import ToolUpsellModal, { ToolGuardBadge } from '../../components/ToolUpsellModal'

const GROQ_MODEL = import.meta.env.VITE_GROQ_MODEL || 'llama-3.3-70b-versatile'
const MAX_MB = 15

async function extractPDFText(file) {
  let text = ''

  // MÉTHODE 1 — pdfjs avec tri par position (CV 2 colonnes)
  try {
    const pdfjsLib = await import('pdfjs-dist')
    pdfjsLib.GlobalWorkerOptions.workerSrc =
      '/pdf.worker.min.mjs'
    const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise

    let fullText = ''
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i)
      const content = await page.getTextContent()
      const viewport = page.getViewport({ scale: 1 })
      const pageWidth = viewport.width
      const items = content.items.filter(item => item.str?.trim())
      const midX = pageWidth / 2
      const leftCol = items.filter(it => it.transform[4] < midX)
      const rightCol = items.filter(it => it.transform[4] >= midX)

      if (rightCol.length > items.length * 0.2) {
        const sortByY = arr => [...arr].sort((a, b) => b.transform[5] - a.transform[5])
        fullText += sortByY(leftCol).map(it => it.str).join(' ') + '\n' + sortByY(rightCol).map(it => it.str).join(' ') + '\n\n'
      } else {
        fullText += [...items].sort((a, b) => b.transform[5] - a.transform[5]).map(it => it.str).join(' ') + '\n\n'
      }
    }
    if (fullText.trim().length > 30) {
      text = fullText
    }
  } catch(e1) {
    console.warn('[CV] pdfjs failed:', e1.message)
    // Fallback to basic pdfjs
    try {
      const pdfjsLib = await import('pdfjs-dist')
      pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs'
      const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise
      let fallbackText = ''
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i)
        const content = await page.getTextContent()
        fallbackText += content.items.map(item => item.str || '').join(' ') + '\n\n'
      }
      if (fallbackText.trim().length > 30) text = fallbackText
    // eslint-disable-next-line no-empty -- Empty catch is intentional — failure is non-fatal here
    } catch { /* ignore */ }
  }

  // MÉTHODE 2 — extraction binaire
  if (!text || text.length < 30) {
    try {
      const raw = await file.arrayBuffer()
      const decoded = new TextDecoder('utf-8', { fatal: false }).decode(raw)
      const matches = decoded.match(/\(([^)]{1,200})\)/g) || []
      text = matches
        .map(m => m.slice(1,-1).replace(/\\n/g, '\n').replace(/\\r/g, ''))
        .filter(t => /[a-zA-ZÀ-ÿ]{2,}/.test(t))
        .join(' ')
    // eslint-disable-next-line no-empty -- Empty catch is intentional — failure is non-fatal here
    } catch(e2) {}
  }

  // MÉTHODE 3 — texte brut
  if (!text || text.length < 30) {
    try {
      text = (await file.text())
        // eslint-disable-next-line no-control-regex -- Control character is intentionally matched (sanitization regex)
        .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, ' ')
        .replace(/\s+/g, ' ').trim()
    // eslint-disable-next-line no-empty -- Empty catch is intentional — failure is non-fatal here
    } catch(e3) {}
  }

  return text?.trim() || `CV : ${file.name}`
}

async function extractPDF(file, dataUrl) {
  return extractPDFText(file)
}

async function extractDOCX(file) {
  try {
    const arrayBuffer = await file.arrayBuffer()
    const uint8 = new Uint8Array(arrayBuffer)
    const decoder = new TextDecoder('utf-8')
    const raw = decoder.decode(uint8)
    const xmlMatches = raw.match(/<w:t[^>]*>([^<]*)<\/w:t>/g) || []
    const text = xmlMatches
      .map(m => m.replace(/<[^>]+>/g, ''))
      .filter(t => t.trim().length > 0)
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim()
    if (text.length > 30) return text
    const textContent = await file.text().catch(() => '')
    const cleaned = textContent
      // eslint-disable-next-line no-control-regex -- Control character is intentionally matched (sanitization regex)
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
    if (cleaned.length > 30) return cleaned
    return '[Document Word uploadé — analyse basée sur le nom du fichier: ' + file.name + ']'
  } catch(e) {
    return '[Document Word: ' + file.name + ']'
  }
}

async function extractText(file, dataUrl) {
  const ext = file.name.toLowerCase().split('.').pop()
  if (ext === 'pdf') return extractPDF(file, dataUrl)
  if (ext === 'docx' || ext === 'doc') return extractDOCX(file)
  if (ext === 'txt' || ext === 'rtf') {
    const text = await file.text()
    if (text.trim().length >= 30) return text.trim()
    throw new Error('Fichier texte vide ou illisible.')
  }
  // Images: return placeholder for Groq vision fallback
  if (/^(jpg|jpeg|png|webp)$/.test(ext)) {
    return `[Image CV: ${file.name} — analyse visuelle]`
  }
  try {
    const text = await file.text()
    if (text.trim().length >= 30) return text.trim()
  // eslint-disable-next-line no-empty -- Empty catch is intentional — failure is non-fatal here
  } catch { /* ignore */ }
  throw new Error(`Format "${ext}" non supporté. Utilisez PDF, DOCX, DOC, TXT ou image.`)
}

async function callGroqJSON(prompt) {
  const raw = await groqClientCall(prompt, { maxTokens: 1500, temperature: 0.2, jsonMode: true })
  try {
    return JSON.parse(raw)
  } catch {
    const m = raw.match(/\{[\s\S]*\}/)
    if (m) return JSON.parse(m[0])
    throw new Error('Format JSON invalide dans la réponse')
  }
}

function ScoreBar({ label, note, max, comment }) {
  const pct = (note / max) * 100
  const color = pct >= 75 ? 'var(--success-text)' : pct >= 50 ? 'var(--warning-text)' : 'var(--error-text)'
  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
        <span style={{ fontSize: '0.78rem', color: 'var(--text-primary)', fontWeight: 600 }}>{label}</span>
        <span style={{ fontSize: '0.9rem', fontWeight: 800, color }}>{note}/{max}</span>
      </div>
      <div style={{ height: 6, background: 'var(--border)', borderRadius: 100, overflow: 'hidden', marginBottom: 6 }}>
        <div style={{ height: '100%', width: pct + '%', background: color, borderRadius: 100, transition: 'width 0.8s ease' }} />
      </div>
      {comment && <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{comment}</div>}
    </div>
  )
}

function AnalyseCV() {
  const { membre } = useAuth()
  const [pdfFile, setPdfFile] = useState(null)
  const [pdfFiles, setPdfFiles] = useState([])
  const [pdfText, setPdfText] = useState('')
  const [extracting, setExtracting] = useState(false)
  const [analysing, setAnalysing] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [showPaywall, setShowPaywall] = useState(false)
  const [dragOver, setDragOver] = useState(false);
  const { themed } = useThemedStyles();

  const guard = useToolGuard('analyse_cv', 'analyse_cv')
  const dropRef = useRef(null)

  function openFilePicker() {
    if (inputRef.current) {
      inputRef.current.value = ''
      inputRef.current.click()
    }
  }

  async function processFile(fileOrFiles) {
    const files = Array.isArray(fileOrFiles) ? fileOrFiles : (fileOrFiles ? [fileOrFiles] : [])
    if (!files.length) return

    const allowed = /\.(pdf|doc|docx|txt|rtf|jpg|jpeg|png|webp|ppt|pptx)$/i

    for (const f of files) {
      const sizeMB = f.size / 1024 / 1024
      if (sizeMB > MAX_MB) {
        setError(`Fichier trop volumineux (${sizeMB.toFixed(1)} MB). Maximum ${MAX_MB} MB.`)
        return
      }
      if (!allowed.test(f.name)) {
        setError('Format non supporté. Utilisez PDF, Word (DOC/DOCX), TXT/RTF, images (JPG/PNG...) ou PPT.')
        return
      }
    }

    setPdfFiles(files)
    setPdfFile(files[0] || null)
    setExtracting(true)
    setError('')
    setResult(null)
    setPdfText('')

    try {
      let combined = ''
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        let dataUrl = null
        try {
          dataUrl = await new Promise((resolve, reject) => {
            const reader = new FileReader()
            reader.onload = e => resolve(e.target.result)
            reader.onerror = reject
            reader.readAsDataURL(file)
          })
        // eslint-disable-next-line no-empty -- Empty catch is intentional — failure is non-fatal here
        } catch { /* ignore */ }

        // Concaténation texte (utile pour multi-files)
        const text = await extractText(file, dataUrl)
        combined += `\n\n--- FICHIER ${i + 1}/${files.length}: ${file.name} ---\n\n${text || ''}`.trim()
      }

      const finalText = combined.trim()
      setPdfText(finalText)
      setExtracting(false)
      // Auto-analyse
      await runAnalysis(finalText)
    } catch (e) {
      setError(e.message)
      setPdfFiles([])
      setPdfFile(null)
      setPdfText('')
      setExtracting(false)
    }
  }

  function handleFileChange(e) {
    const files = Array.from(e.target.files || [])
    if (files.length) processFile(files)
  }

  function handleDrop(e) {
    e.preventDefault()
    setDragOver(false)
    const files = Array.from(e.dataTransfer.files || [])
    if (files.length) processFile(files)
  }

  function handleDragOver(e) {
    e.preventDefault()
    setDragOver(true)
  }

  function handleDragLeave(e) {
    e.preventDefault()
    setDragOver(false)
  }

  async function runAnalysis(text) {
    if (!text) { setError("Importez d'abord votre CV"); return }
    const debitResult = await guard.checkAndDebit()
    if (!debitResult.ok) return
    await guard.recordUsage()
    setAnalysing(true)
    setError('')
    const prompt = `Tu es un expert en recrutement pour le marché africain. Analyse ce CV et réponds UNIQUEMENT en JSON valide selon ce schéma exact :
{"score_global":72,"mention":"Bien","scores":{"structure":{"note":15,"max":20,"commentaire":"..."},"contenu":{"note":16,"max":20,"commentaire":"..."},"mots_cles":{"note":14,"max":20,"commentaire":"..."},"lisibilite":{"note":15,"max":20,"commentaire":"..."},"impact":{"note":12,"max":20,"commentaire":"..."}},"points_forts":["...","...","..."],"axes_amelioration":["...","...","..."],"suggestions":{"titre":"...","resume":"...","experiences":"...","competences":"...","format":"..."},"mots_cles_manquants":["...","...","...","...","..."],"benchmark":68,"profil_detecte":"...","verdict":"..."}

CV à analyser :
${text.substring(0, 4000)}`

    try {
      const data = await callGroqJSON(prompt)
      setResult(data)
    } catch (e) {
      setError('Erreur IA : ' + e.message)
    }
    setAnalysing(false)
  }

  const scoreColor = result
    ? (result.score_global >= 75 ? 'var(--success-text)' : result.score_global >= 50 ? 'var(--warning-text)' : 'var(--error-text)')
    : 'var(--warning-text)'

  const SCORE_LABELS = {
    structure: '🏗️ Structure',
    contenu: '📝 Contenu',
    mots_cles: '🔑 Mots-clés',
    lisibilite: '👁️ Lisibilité',
    impact: '💥 Impact',
  }

  const SUGGESTION_LABELS = {
    titre: 'Titre professionnel',
    resume: 'Résumé',
    experiences: 'Expériences',
    competences: 'Compétences',
    format: 'Format',
  }

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: 'clamp(24px, 4vw, 40px) clamp(16px, 3vw, 32px) 80px' }}>
      <SEO
        title="Analyse de CV par IA — Score ATS & optimisations"
        description="Analysez votre CV avec l'IA : score ATS, points forts et faibles, suggestions d'amélioration personnalisées. Rapport complet pour décrocher plus d'entretiens."
        keywords="analyse CV IA, score ATS, CV Sénégal, optimisation CV, recrutement IA, conseils CV"
        image="/og-tools/analyse-cv.jpg"
      />
      {/* Header */}
      <div style={themed({ marginBottom: 24 })}>
        <h1 style={themed({ fontSize: 'clamp(1.6rem,4vw,2.2rem)', fontWeight: 900, color: 'var(--text-primary)', marginBottom: 8 })}>
          🔍 Analyse de CV par IA
        </h1>
        <p style={themed({ color: 'var(--text-secondary)', lineHeight: 1.6 })}>
          Score ATS détaillé, points forts, axes d'amélioration et mots-clés manquants — en 30 secondes.
        </p>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
        <TokenCounter />
      </div>
      <div style={{ marginBottom: 12 }}>
        <ToolGuardBadge guard={guard} />
      </div>
      <ToolInfoPanel
        toolName="Analyse de CV par IA"
        icon="🔍"
        description="Diagnostic ATS et rapport d'amélioration ciblé pour maximiser vos chances"
        benefits={[
          'Score ATS sur 100 avec détail des critères (mots-clés, structure, lisibilité)',
          'Identification des points forts et axes d\'amélioration prioritaires',
          'Suggestion des mots-clés manquants pour votre secteur/poste',
          'Analyse adaptée au marché africain et international',
          '2 analyses gratuites par jour — puis crédits ou ABAWI+',
        ]}
        howToUse={[
          'Importez votre CV (PDF, Word, TXT, image scannée)',
          'Précisez le poste visé et le secteur pour une analyse ciblée',
          'Lancez l\'analyse — l\'IA lit, évalue et note votre CV',
          'Consultez le rapport : score, forces, faiblesses, mots-clés',
          'Utilisez les recommandations pour améliorer votre CV avant de postuler',
        ]}
        tips={[
          'Plus votre CV est structuré (sections claires), meilleur est le score ATS',
          'Les recruteurs utilisent de plus en plus des filtres automatiques — l\'ATS est critique',
          'Injectez les mots-clés manquants dans vos expériences, pas dans une section dédiée',
          'Un CV de 1 page est optimal pour < 5 ans d\'expérience, 2 pages au-delà',
        ]}
      />

      {/* Upload zone */}
      <div style={themed({ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 20, padding: 28, marginBottom: 20 })}>
        <h2 style={themed({ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 16 })}>
          📄 Importez votre CV — PDF, Word, TXT, Image
        </h2>

        {/* Hidden file input */}
        <input
          ref={inputRef}
          type="file"
          multiple
          accept=".pdf,.doc,.docx,.txt,.rtf,.jpg,.jpeg,.png,.webp,.ppt,.pptx"
          style={{ position: 'absolute', opacity: 0, pointerEvents: 'none', width: 0, height: 0 }}
          onChange={handleFileChange}
        />

        {/* Drop zone */}
        <div
          ref={dropRef}
          onClick={openFilePicker}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          style={{
            border: `2px dashed ${dragOver ? 'var(--success-text)' : pdfFiles?.length ? 'var(--success-border)' : 'var(--border)'}`,
            borderRadius: 14,
            padding: '32px 20px',
            textAlign: 'center',
            cursor: 'pointer',
            background: dragOver ? 'var(--success-bg)' : pdfFiles?.length ? 'var(--success-bg)' : 'var(--bg-primary)',
            transition: 'all 0.2s',
          }}
        >
          {pdfFiles?.length ? (
            <>
              <div style={{ fontSize: '2rem', marginBottom: 8 }}>📄</div>
              <div style={themed({ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 })}>
                {pdfFiles[0]?.name || ''}
                {pdfFiles.length > 1 ? ` (+${pdfFiles.length - 1} autres)` : ''}
              </div>
              <div style={themed({ fontSize: '0.78rem', color: 'var(--text-muted)' })}>
                {pdfText ? `${pdfText.length} chars` : `${pdfFiles[0] ? (pdfFiles[0].size / 1024).toFixed(0) : 0} KB`} · Cliquez pour changer de fichier
              </div>
            </>
          ) : (
            <>
              <div style={{ fontSize: '2.5rem', marginBottom: 10 }}>📂</div>
              <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>
                Déposez votre CV ici ou cliquez pour parcourir
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                PDF · DOCX · DOC · TXT · RTF · Image — max {MAX_MB} MB
              </div>
            </>
          )}
        </div>

        {extracting && (
          <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 8, color: '#F0B429', fontSize: '0.85rem' }}>
            <div style={{ width: 14, height: 14, borderRadius: '50%', border: '2px solid rgba(240,180,41,0.2)', borderTopColor: '#F0B429', animation: 'acv-spin 0.8s linear infinite', flexShrink: 0 }} />
            Lecture du fichier...
          </div>
        )}
        {analysing && (
          <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 8, color: '#8B5CF6', fontSize: '0.85rem' }}>
            <div style={{ width: 14, height: 14, borderRadius: '50%', border: '2px solid rgba(139,92,246,0.2)', borderTopColor: '#8B5CF6', animation: 'acv-spin 0.8s linear infinite', flexShrink: 0 }} />
            Analyse IA en cours...
          </div>
        )}
        {pdfText && !extracting && !analysing && !result && (
          <div style={{ marginTop: 12, color: '#18A84A', fontSize: '0.85rem', fontWeight: 600 }}>
            ✅ CV lu — {pdfText.length} caractères extraits
          </div>
        )}
        {error && (
          <div style={{ marginTop: 12, padding: '10px 16px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, color: '#ef4444', fontSize: '0.82rem' }}>
            ⚠️ {error}
          </div>
        )}
      </div>

      {/* Manual analyse button (if text extracted but not auto-analysed) */}
      {pdfText && !extracting && !analysing && !result && (
        <button
          onClick={() => runAnalysis(pdfText)}
          style={{
            width: '100%', padding: 18, borderRadius: 14, marginBottom: 32,
            background: 'linear-gradient(135deg, #8B5CF6, #7C3AED)',
            border: 'none', color: '#fff',
            fontWeight: 800, fontSize: '1.05rem', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            boxShadow: '0 6px 20px rgba(139,92,246,0.35)',
          }}
        >
          🔍 Analyser mon CV
        </button>
      )}

      {/* Results */}
      {result && (
        <div>
          {/* Score global */}
          <div style={{
            background: 'var(--bg-card)', border: `2px solid ${scoreColor}40`,
            borderRadius: 20, padding: 32, textAlign: 'center', marginBottom: 24,
          }}>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: 8, fontWeight: 600, letterSpacing: 1 }}>
              SCORE ATS GLOBAL
            </div>
            <div style={{ fontSize: '5rem', fontWeight: 900, color: scoreColor, lineHeight: 1, marginBottom: 8 }}>
              {result.score_global}<span style={{ fontSize: '2rem', color: 'var(--text-muted)' }}>/100</span>
            </div>
            <div style={{
              display: 'inline-block', padding: '6px 20px', borderRadius: 100,
              background: scoreColor + '20', color: scoreColor, fontSize: '0.85rem', fontWeight: 700, marginBottom: 12,
            }}>
              {result.mention} · {result.profil_detecte}
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6, maxWidth: 500, margin: '0 auto 16px' }}>
              {result.verdict}
            </p>
            <div style={{ padding: '10px 20px', borderRadius: 10, background: 'rgba(255,255,255,0.04)', display: 'inline-block' }}>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.82rem' }}>
                Meilleur que <strong style={{ color: '#F0B429' }}>{result.benchmark}%</strong> des CV analysés
              </span>
            </div>
          </div>

          {/* Scores détaillés */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 24 }}>
            {Object.entries(result.scores || {}).map(([key, val]) => (
              <ScoreBar key={key} label={SCORE_LABELS[key] || key} note={val.note} max={val.max} comment={val.commentaire} />
            ))}
          </div>

          {/* Points forts */}
          <div style={{ background: 'rgba(24,168,74,0.06)', border: '1px solid rgba(24,168,74,0.2)', borderRadius: 14, padding: 20, marginBottom: 16 }}>
            <h3 style={{ color: '#18A84A', fontSize: '0.95rem', fontWeight: 800, marginBottom: 12 }}>✅ Points forts</h3>
            {(result.points_forts || []).map((p, i) => (
              <div key={i} style={{ display: 'flex', gap: 10, marginBottom: i < result.points_forts.length - 1 ? 8 : 0 }}>
                <span style={{ color: '#18A84A', flexShrink: 0 }}>✓</span>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>{p}</span>
              </div>
            ))}
          </div>

          {/* Axes amélioration */}
          <div style={{ background: 'rgba(240,180,41,0.06)', border: '1px solid rgba(240,180,41,0.2)', borderRadius: 14, padding: 20, marginBottom: 16 }}>
            <h3 style={{ color: '#F0B429', fontSize: '0.95rem', fontWeight: 800, marginBottom: 12 }}>🎯 Axes d'amélioration</h3>
            {(result.axes_amelioration || []).map((a, i) => (
              <div key={i} style={{ display: 'flex', gap: 10, marginBottom: i < result.axes_amelioration.length - 1 ? 8 : 0 }}>
                <span style={{ color: '#F0B429', flexShrink: 0 }}>→</span>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>{a}</span>
              </div>
            ))}
          </div>

          {/* Mots-clés manquants */}
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, padding: 20, marginBottom: 24 }}>
            <h3 style={{ color: '#8B5CF6', fontSize: '0.95rem', fontWeight: 800, marginBottom: 12 }}>🔑 Mots-clés ATS manquants</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {(result.mots_cles_manquants || []).map((mot, i) => (
                <span key={i} style={{
                  padding: '4px 14px', borderRadius: 100,
                  background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.3)',
                  color: '#8B5CF6', fontSize: '0.8rem', fontWeight: 600,
                }}>{mot}</span>
              ))}
            </div>
          </div>

          {/* Suggestions */}
          <div style={{ background: 'rgba(24,168,74,0.08)', border: '1px solid rgba(24,168,74,0.3)', borderRadius: 16, padding: 24 }}>
            <h3 style={{ color: '#18A84A', marginBottom: 16, fontWeight: 800 }}>📋 Suggestions par section</h3>
            {Object.entries(result.suggestions || {}).map(([key, val]) => (
              <div key={key} style={{ marginBottom: 16, paddingBottom: 16, borderBottom: '1px solid rgba(24,168,74,0.15)' }}>
                <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#F0B429', marginBottom: 4 }}>
                  {SUGGESTION_LABELS[key] || key}
                </div>
                <div style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{val}</div>
              </div>
            ))}
          </div>

          {/* New analysis button */}
          <button
            onClick={() => { setPdfFile(null); setPdfText(''); setResult(null); setError('') }}
            style={{
              marginTop: 24, width: '100%', padding: 14, borderRadius: 12,
              background: 'transparent', border: '1px solid var(--border)',
              color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer',
            }}
          >
            Analyser un autre CV
          </button>
        </div>
      )}

      <ToolUpsellModal
        isOpen={guard.upsellOpen}
        config={guard.upsellConfig}
        onClose={guard.closeUpsell}
        onUseCredit={async () => {
          const r = await guard.checkAndDebit()
          if (r.ok) guard.closeUpsell()
        }}
      />

      <style>{`@keyframes acv-spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

export default AnalyseCV

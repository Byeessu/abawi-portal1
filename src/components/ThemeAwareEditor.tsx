/**
 * ABAWI Theme-Aware Editor
 * Éditeur professionnel avec gestion complète des thèmes
 * Respect des modes d'affichage et étalonnage des couleurs
 */

import React, { useState, useRef, useEffect } from 'react';
import themeManager from '../lib/themeManager';
import { applyWritingMode, documentSync, WRITING_MODES } from '../lib/writingModes';

// Typage explicite
const WritingModes = WRITING_MODES as Record<string, any>;

interface ThemeAwareEditorProps {
  initialContent?: string;
  initialMode?: string;
  onContentChange?: (content: string) => void;
  onSave?: (document: any) => void;
}

export default function ThemeAwareEditor({
  initialContent = '',
  initialMode = 'consulting',
  onContentChange,
  onSave
}: ThemeAwareEditorProps) {
  const [content, setContent] = useState(initialContent);
  const [writingMode, setWritingMode] = useState(initialMode);
  const [isPreview, setIsPreview] = useState(false);
  const [documentId, setDocumentId] = useState<string | null>(null);
  const [showFormatPanel, setShowFormatPanel] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentTheme, setCurrentTheme] = useState(themeManager.currentTheme);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (initialContent) {
      setContent(initialContent);
    }
  }, [initialContent]);

  useEffect(() => {
    if (onContentChange) {
      onContentChange(content);
    }
  }, [content, onContentChange]);

  useEffect(() => {
    // Écouter les changements de thème
    const handleThemeChange = (themeName: string, themeColors: any) => {
      setCurrentTheme(themeName);
    };

    themeManager.addListener(handleThemeChange);
    
    return () => {
      themeManager.removeListener(handleThemeChange);
    };
  }, []);

  // Appliquer le thème au chargement du composant
  useEffect(() => {
    themeManager.applyThemeCSS();
  }, []);

  const handleModeChange = (newMode: string) => {
    setWritingMode(newMode);
    const formatted = applyWritingMode(content, newMode);
    setContent(formatted);
  };

  const handleSave = () => {
    const doc = documentSync.saveDocument(
      documentId || `doc_${Date.now()}`,
      content,
      writingMode,
      {
        title: extractTitle(content),
        wordCount: content.split(/\s+/).length
      }
    );
    
    setDocumentId(doc.id);
    if (onSave) {
      onSave(doc);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExport = (format: string) => {
    const exported = documentSync.exportDocument(documentId!, format);
    if (exported) {
      downloadFile(exported, format);
    }
  };

  const downloadFile = (data: any, format: string) => {
    const blob = new Blob([data.content || data], { type: getMimeType(format) });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `document.${format}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getMimeType = (format: string) => {
    switch (format) {
      case 'html': return 'text/html';
      case 'pdf': return 'application/pdf';
      case 'docx': return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      default: return 'text/plain';
    }
  };

  const extractTitle = (text: string) => {
    const lines = text.split('\n');
    const titleLine = lines.find(line => line.startsWith('## '));
    return titleLine ? titleLine.replace('## ', '') : 'Sans titre';
  };

  const insertFormatting = (type: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);
    
    let formattedText = '';
    
    switch (type) {
      case 'bold':
        formattedText = `**${selectedText || 'texte en gras'}**`;
        break;
      case 'italic':
        formattedText = `*${selectedText || 'texte en italique'}*`;
        break;
      case 'title':
        formattedText = `## ${selectedText || 'Titre'}`;
        break;
      case 'subtitle':
        formattedText = `### ${selectedText || 'Sous-titre'}`;
        break;
      case 'list':
        formattedText = `- ${selectedText || 'Élément de liste'}`;
        break;
      case 'quote':
        formattedText = `> ${selectedText || 'Citation'}`;
        break;
      case 'code':
        formattedText = `\`${selectedText || 'code'}\``;
        break;
      case 'link':
        formattedText = `[${selectedText || 'texte du lien'}](url)`;
        break;
      default:
        formattedText = selectedText;
    }
    
    const newContent = content.substring(0, start) + formattedText + content.substring(end);
    setContent(newContent);
    
    // Repositionner le curseur
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + formattedText.length, start + formattedText.length);
    }, 0);
  };

  const renderPreview = () => {
    let html = content;
    
    // Conversion Markdown vers HTML simple
    html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
    html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
    html = html.replace(/^#### (.+)$/gm, '<h4>$1</h4>');
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
    html = html.replace(/`(.+?)`/g, '<code>$1</code>');
    html = html.replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>');
    html = html.replace(/^- (.+)$/gm, '<li>$1</li>');
    html = html.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');
    html = html.replace(/\n/g, '<br>');
    
    return html;
  };

  const themeColors = themeManager.getCurrentTheme();

  return (
    <div className={`abawi-theme-${currentTheme}`} style={{
      minHeight: '100vh',
      background: themeColors.background,
      color: themeColors.text,
      padding: '20px',
      transition: 'all 0.3s ease'
    }}>
      <div style={{ 
        maxWidth: '1200px', 
        margin: '0 auto',
        background: themeColors.surface,
        padding: isFullscreen ? '0' : '20px',
        borderRadius: isFullscreen ? '0' : '12px',
        boxShadow: isFullscreen ? 'none' : '0 4px 12px rgba(0,0,0,0.1)'
      }}>
        {/* Header */}
        <div style={{
          background: `linear-gradient(135deg, ${themeColors.surface} 0%, ${themeColors.background} 100%)`,
          color: themeColors.text,
          padding: '20px',
          borderRadius: '12px',
          marginBottom: '20px',
          border: `1px solid ${themeColors.border}`
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <h1 style={{ margin: 0, fontSize: '1.5rem', color: themeColors.text }}>
                Éditeur Thème-Aware
              </h1>
              <p style={{ margin: '4px 0 0 0', opacity: 0.8, color: themeColors.textSecondary }}>
                Respect des thèmes et étalonnage des couleurs
              </p>
            </div>
            
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <button
                onClick={() => setIsFullscreen(!isFullscreen)}
                style={{
                  padding: '8px 16px',
                  background: themeColors.accent,
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '0.9rem'
                }}
              >
                {isFullscreen ? 'Réduire' : 'Plein écran'}
              </button>
              
              <button
                onClick={() => themeManager.toggle()}
                style={{
                  padding: '8px 16px',
                  background: themeColors.accent,
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '0.9rem'
                }}
              >
                Thème: {themeColors.name}
              </button>
              
              <button
                onClick={() => setIsPreview(!isPreview)}
                style={{
                  padding: '8px 16px',
                  background: themeColors.accent,
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '0.9rem'
                }}
              >
                {isPreview ? 'Édition' : 'Aperçu'}
              </button>
              
              <button
                onClick={handlePrint}
                style={{
                  padding: '8px 16px',
                  background: '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '0.9rem'
                }}
              >
                Imprimer
              </button>
              
              <button
                onClick={handleSave}
                style={{
                  padding: '8px 16px',
                  background: '#059669',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '0.9rem'
                }}
              >
                Sauvegarder
              </button>
            </div>
          </div>
        </div>

        {/* Sélecteur de mode d'écriture */}
        <div style={{
          background: themeColors.card,
          padding: '16px',
          borderRadius: '8px',
          marginBottom: '20px',
          border: `1px solid ${themeColors.border}`
        }}>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {Object.keys(WritingModes).map(mode => (
              <button
                key={mode}
                onClick={() => handleModeChange(mode)}
                style={{
                  padding: '8px 16px',
                  background: writingMode === mode ? themeColors.accent : 'transparent',
                  color: writingMode === mode ? '#ffffff' : themeColors.text,
                  border: `1px solid ${themeColors.border}`,
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '0.9rem'
                }}
              >
                {WritingModes[mode]?.name || mode}
              </button>
            ))}
          </div>
        </div>

        {/* Conteneur principal */}
        <div style={{
          background: themeColors.card,
          borderRadius: '8px',
          border: `1px solid ${themeColors.border}`,
          overflow: 'hidden',
          height: isFullscreen ? 'calc(100vh - 200px)' : '500px'
        }}>
          {isPreview ? (
            <div
              className="abawi-preview-container"
              style={{ 
                height: '100%',
                padding: '40px',
                overflow: 'auto',
                background: 'var(--abawi-preview-bg, #ffffff)',
                color: 'var(--abawi-preview-text, #1e293b)'
              }}
              dangerouslySetInnerHTML={{ __html: renderPreview() }}
            />
          ) : (
            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Commencez à écrire votre document..."
              style={{
                width: '100%',
                height: '100%',
                padding: '40px',
                fontSize: '1rem',
                fontFamily: 'monospace',
                lineHeight: '1.6',
                border: 'none',
                outline: 'none',
                resize: 'none',
                background: 'var(--abawi-preview-bg, #ffffff)',
                color: 'var(--abawi-preview-text, #1e293b)'
              }}
            />
          )}
        </div>

        {/* Barre d'outils de formatage */}
        <div style={{
          background: themeColors.card,
          padding: '16px',
          borderRadius: '8px',
          marginTop: '20px',
          border: `1px solid ${themeColors.border}`
        }}>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {[
              { label: 'Gras', action: 'bold' },
              { label: 'Italique', action: 'italic' },
              { label: 'Titre', action: 'title' },
              { label: 'Sous-titre', action: 'subtitle' },
              { label: 'Liste', action: 'list' },
              { label: 'Citation', action: 'quote' },
              { label: 'Code', action: 'code' },
              { label: 'Lien', action: 'link' }
            ].map(({ label, action }) => (
              <button
                key={action}
                onClick={() => insertFormatting(action)}
                style={{
                  padding: '6px 12px',
                  background: themeColors.code,
                  color: themeColors.codeText,
                  border: `1px solid ${themeColors.border}`,
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '0.85rem'
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Informations sur le thème actuel */}
        <div style={{
          background: themeColors.card,
          padding: '16px',
          borderRadius: '8px',
          marginTop: '20px',
          border: `1px solid ${themeColors.border}`
        }}>
          <h3 style={{ margin: '0 0 12px 0', color: themeColors.text }}>
            Informations de thème
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
            <div>
              <strong style={{ color: themeColors.text }}>Thème actuel:</strong>
              <span style={{ marginLeft: '8px', color: themeColors.textSecondary }}>
                {themeColors.name}
              </span>
            </div>
            <div>
              <strong style={{ color: themeColors.text }}>Arrière-plan:</strong>
              <span style={{ 
                marginLeft: '8px', 
                padding: '2px 8px',
                background: themeColors.background,
                color: themeColors.text,
                borderRadius: '4px',
                border: `1px solid ${themeColors.border}`
              }}>
                {themeColors.background}
              </span>
            </div>
            <div>
              <strong style={{ color: themeColors.text }}>Texte:</strong>
              <span style={{ 
                marginLeft: '8px', 
                padding: '2px 8px',
                background: themeColors.text,
                color: themeColors.background,
                borderRadius: '4px'
              }}>
                {themeColors.text}
              </span>
            </div>
            <div>
              <strong style={{ color: themeColors.text }}>Aperçu:</strong>
              <span style={{ marginLeft: '8px', color: themeColors.textSecondary }}>
                Toujours lisible
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Styles CSS pour l'aperçu */}
      <style>{themeManager.generatePreviewStyles()}</style>
    </div>
  );
}

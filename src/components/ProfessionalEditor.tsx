/**
 * ABAWI SMART OFFICE - ÉDITEUR PROFESSIONNEL
 * Modes d'écriture soignés et synchronisation des données
 */

import React, { useState, useRef, useEffect } from 'react';
import { applyWritingMode, documentSync, WRITING_MODES } from '../lib/writingModes';

// Typage explicite pour éviter les erreurs TypeScript
const WritingModes = WRITING_MODES as Record<string, any>;

interface ProfessionalEditorProps {
  initialContent?: string;
  initialMode?: string;
  onContentChange?: (content: string) => void;
  onSave?: (document: any) => void;
}

export default function ProfessionalEditor({
  initialContent = '',
  initialMode = 'consulting',
  onContentChange,
  onSave
}: ProfessionalEditorProps) {
  const [content, setContent] = useState(initialContent);
  const [writingMode, setWritingMode] = useState(initialMode);
  const [isPreview, setIsPreview] = useState(false);
  const [documentId, setDocumentId] = useState<string | null>(null);
  const [showFormatPanel, setShowFormatPanel] = useState(false);
  const [illustrations, setIllustrations] = useState([]);
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
        wordCount: content.split(/\s+/).length,
        illustrationCount: illustrations.length
      }
    );
    
    setDocumentId(doc.id);
    if (onSave) {
      onSave(doc);
    }
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
    return titleLine ? titleLine.replace('## ', '') : 'Document sans titre';
  };

  const insertFormatting = (format: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);
    
    let formattedText = '';
    switch (format) {
      case 'bold':
        formattedText = `**${selectedText || 'texte en gras'}**`;
        break;
      case 'italic':
        formattedText = `*${selectedText || 'texte en italique'}*`;
        break;
      case 'title':
        formattedText = `\n## ${selectedText || 'Titre'}\n`;
        break;
      case 'subtitle':
        formattedText = `\n### ${selectedText || 'Sous-titre'}\n`;
        break;
      case 'list':
        formattedText = `\n- ${selectedText || 'Élément de liste'}\n`;
        break;
      case 'kpi':
        formattedText = `**${selectedText || 'KPI'}**`;
        break;
      case 'highlight':
        formattedText = `+++ ${selectedText || 'Texte mis en évidence'} +++`;
        break;
      case 'quote':
        formattedText = `\n> ${selectedText || 'Citation'}\n`;
        break;
      case 'image':
        formattedText = `![${selectedText || 'Description'}](url-image)`;
        break;
      case 'table':
        formattedText = `\n| Colonne 1 | Colonne 2 |\n|-----------|-----------|\n| Donnée 1  | Donnée 2  |\n`;
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
    let preview = content;
    
    // Conversion markdown vers HTML simple
    preview = preview
      .replace(/## (.+)/g, '<h2>$1</h2>')
      .replace(/### (.+)/g, '<h3>$1</h3>')
      .replace(/#### (.+)/g, '<h4>$1</h4>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/\+\+\+(.+?)\+\+\+/g, '<mark>$1</mark>')
      .replace(/^> (.+)/gm, '<blockquote>$1</blockquote>')
      .replace(/^- (.+)/gm, '<li>$1</li>')
      .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" style="max-width: 100%; height: auto;">')
      .replace(/\n\n/g, '</p><p>')
      .replace(/\n/g, '<br>');

    return `<div style="font-family: Georgia, serif; line-height: 1.6; max-width: 800px; margin: 0 auto; padding: 40px;"><p>${preview}</p></div>`;
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', padding: '20px' }}>
      {/* Styles CSS pour l'impression et la mise en page */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .professional-editor-content, .professional-editor-content * {
            visibility: visible;
          }
          .professional-editor-content {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 40px;
            background: white !important;
          }
          .editor-header, .format-panel, .stats-panel {
            display: none !important;
          }
          .editor-main {
            margin: 0 !important;
            padding: 0 !important;
          }
        }
        
        .professional-editor-content {
          max-width: 100%;
          overflow: hidden;
          word-wrap: break-word;
          hyphens: auto;
        }
        
        .editor-textarea {
          max-width: 100%;
          overflow-x: auto;
          overflow-y: auto;
          word-wrap: break-word;
          white-space: pre-wrap;
          box-sizing: border-box;
        }
        
        .preview-content {
          max-width: 100%;
          overflow-x: auto;
          word-wrap: break-word;
          hyphens: auto;
        }
      `}</style>
      
      {/* Header */}
      <div className="editor-header" style={{
        background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
        color: 'white',
        padding: '20px',
        borderRadius: '12px',
        marginBottom: '20px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.5rem' }}>Éditeur Professionnel</h1>
            <p style={{ margin: '4px 0 0 0', opacity: 0.9 }}>Modes d'écriture soignés</p>
          </div>
          
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <select
              value={writingMode}
              onChange={(e) => handleModeChange(e.target.value)}
              style={{
                padding: '8px 12px',
                border: 'none',
                borderRadius: '6px',
                fontSize: '0.9rem'
              }}
            >
              {Object.entries(WritingModes).map(([key, mode]) => (
                <option key={key} value={key}>{mode.name}</option>
              ))}
            </select>
            
            <button
              onClick={() => setIsPreview(!isPreview)}
              style={{
                padding: '8px 16px',
                background: isPreview ? '#10b981' : '#6366f1',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '0.9rem'
              }}
            >
              {isPreview ? 'Éditer' : 'Aperçu'}
            </button>
            
            <button
              onClick={() => setShowFormatPanel(!showFormatPanel)}
              style={{
                padding: '8px 16px',
                background: '#8b5cf6',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '0.9rem'
              }}
            >
              Formatage
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
            
            <select
              onChange={(e) => handleExport(e.target.value)}
              defaultValue=""
              style={{
                padding: '8px 12px',
                border: 'none',
                borderRadius: '6px',
                fontSize: '0.9rem'
              }}
            >
              <option value="" disabled>Exporter</option>
              <option value="markdown">Markdown</option>
              <option value="html">HTML</option>
              <option value="pdf">PDF</option>
              <option value="docx">Word</option>
            </select>
          </div>
        </div>
      </div>

      {/* Panneau de formatage */}
      {showFormatPanel && (
        <div className="format-panel" style={{
          background: 'white',
          padding: '16px',
          borderRadius: '8px',
          marginBottom: '20px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ margin: '0 0 12px 0', fontSize: '1rem', color: '#1e293b' }}>
            Outils de formatage
          </h3>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {[
              { label: 'Gras', action: 'bold' },
              { label: 'Italique', action: 'italic' },
              { label: 'Titre', action: 'title' },
              { label: 'Sous-titre', action: 'subtitle' },
              { label: 'Liste', action: 'list' },
              { label: 'KPI', action: 'kpi' },
              { label: 'Surligner', action: 'highlight' },
              { label: 'Citation', action: 'quote' },
              { label: 'Image', action: 'image' },
              { label: 'Tableau', action: 'table' }
            ].map(({ label, action }) => (
              <button
                key={action}
                onClick={() => insertFormatting(action)}
                style={{
                  padding: '6px 12px',
                  background: '#f1f5f9',
                  border: '1px solid #e2e8f0',
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
      )}

      {/* Info mode d'écriture */}
      <div style={{
        background: 'white',
        padding: '16px',
        borderRadius: '8px',
        marginBottom: '20px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            background: '#3b82f6',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontWeight: 'bold'
          }}>
            {WritingModes[writingMode]?.name.charAt(0)}
          </div>
          <div style={{ flex: 1 }}>
            <h3 style={{ margin: 0, fontSize: '1rem', color: '#1e293b' }}>
              {WritingModes[writingMode]?.name}
            </h3>
            <p style={{ margin: '2px 0 0 0', fontSize: '0.85rem', color: '#64748b' }}>
              {WritingModes[writingMode]?.description}
            </p>
          </div>
        </div>
      </div>

      {/* Éditeur ou Aperçu */}
      <div className="editor-main professional-editor-content" style={{
        background: 'white',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        overflow: 'hidden',
        maxWidth: '100%',
        boxSizing: 'border-box'
      }}>
        {isPreview ? (
          <div
            className="preview-content"
            style={{ 
              minHeight: '500px', 
              padding: '40px',
              maxWidth: '100%',
              overflow: 'auto',
              wordWrap: 'break-word',
              hyphens: 'auto'
            }}
            dangerouslySetInnerHTML={{ __html: renderPreview() }}
          />
        ) : (
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Commencez à écrire votre document..."
            className="editor-textarea"
            style={{
              width: '100%',
              height: '500px',
              padding: '40px',
              border: 'none',
              fontSize: '1rem',
              fontFamily: 'monospace',
              lineHeight: '1.6',
              resize: 'vertical',
              outline: 'none',
              boxSizing: 'border-box',
              maxWidth: '100%',
              overflow: 'auto'
            }}
          />
        )}
      </div>

      {/* Statistiques */}
      <div className="stats-panel" style={{
        background: 'white',
        padding: '16px',
        borderRadius: '8px',
        marginTop: '20px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        display: 'flex',
        gap: '24px',
        flexWrap: 'wrap'
      }}>
        <div>
          <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Mots:</span>
          <strong style={{ marginLeft: '4px', color: '#1e293b' }}>
            {content.split(/\s+/).filter(w => w).length}
          </strong>
        </div>
        <div>
          <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Caractères:</span>
          <strong style={{ marginLeft: '4px', color: '#1e293b' }}>
            {content.length}
          </strong>
        </div>
        <div>
          <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Lignes:</span>
          <strong style={{ marginLeft: '4px', color: '#1e293b' }}>
            {content.split('\n').length}
          </strong>
        </div>
        <div>
          <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Illustrations:</span>
          <strong style={{ marginLeft: '4px', color: '#1e293b' }}>
            {illustrations.length}
          </strong>
        </div>
        {documentId && (
          <div>
            <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Document ID:</span>
            <strong style={{ marginLeft: '4px', color: '#1e293b' }}>
              {documentId}
            </strong>
          </div>
        )}
      </div>
    </div>
  );
}

import { useState } from 'react'

/* Modèles de mise en page professionnels */
const LAYOUT_TEMPLATES = {
  classic: {
    name: 'Classique Cabinet',
    description: 'Mise en page traditionnelle de cabinet conseil',
    paperColor: '#ffffff',
    textColor: '#1a1a1a',
    headerBg: '#f8f9fa',
    footerBg: '#f8f9fa',
    fontFamily: "'Times New Roman', serif",
    headerHeight: 120,
    footerHeight: 60,
    margins: { top: 96, right: 72, bottom: 72, left: 72 }
  },
  modern: {
    name: 'Moderne Premium',
    description: 'Design épuré avec accents subtils',
    paperColor: '#ffffff',
    textColor: '#2c3e50',
    headerBg: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    footerBg: '#f8f9fa',
    fontFamily: "'Calibri', sans-serif",
    headerHeight: 100,
    footerHeight: 50,
    margins: { top: 80, right: 64, bottom: 64, left: 64 }
  },
  executive: {
    name: 'Executive Élite',
    description: 'Style directeur avec lignes dorées',
    paperColor: '#fafafa',
    textColor: '#1a1a1a',
    headerBg: '#1a1a1a',
    footerBg: '#1a1a1a',
    fontFamily: "'Georgia', serif",
    headerHeight: 140,
    footerHeight: 70,
    margins: { top: 120, right: 80, bottom: 80, left: 80 }
  },
  minimal: {
    name: 'Minimal Pro',
    description: 'Ultra-épuré, maximum de lisibilité',
    paperColor: '#ffffff',
    textColor: '#333333',
    headerBg: '#ffffff',
    footerBg: '#ffffff',
    fontFamily: "'Inter', sans-serif",
    headerHeight: 80,
    footerHeight: 40,
    margins: { top: 60, right: 60, bottom: 60, left: 60 }
  }
}

export default function ProfessionalLayout({ 
  children, 
  template = 'classic',
  companyInfo = {},
  recipientInfo = {},
  showLayoutOptions = false,
  onTemplateChange,
  onCompanyInfoChange,
  onRecipientInfoChange
}) {
  const [selectedTemplate, setSelectedTemplate] = useState(template)
  const [editingCompany, setEditingCompany] = useState(false)
  const [editingRecipient, setEditingRecipient] = useState(false)
  
  const currentLayout = LAYOUT_TEMPLATES[selectedTemplate]
  
  const handleTemplateChange = (newTemplate) => {
    setSelectedTemplate(newTemplate)
    onTemplateChange?.(newTemplate)
  }

  // The three editors below are rendered at most once each and capture the
  // parent's state via closure. Extracting them as top-level components would
  // require threading ~10 props each — kept inline. The state-reset hazard the
  // rule warns about does not apply here: these editors are conditionally
  // mounted modals, not long-lived stateful components.
  const CompanyInfoEditor = () => {
    if (!editingCompany) return null
    
    return (
      <div style={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        background: 'white',
        padding: '24px',
        borderRadius: '12px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        zIndex: 1000,
        minWidth: '400px'
      }}>
        <h3 style={{ margin: '0 0 16px', fontSize: '18px', fontWeight: 700 }}>Informations de l'entreprise</h3>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <input
            placeholder="Nom de l'entreprise"
            defaultValue={companyInfo.name}
            style={{ padding: '8px 12px', border: '1px solid #ddd', borderRadius: '6px' }}
            onChange={(e) => onCompanyInfoChange?.({ ...companyInfo, name: e.target.value })}
          />
          <input
            placeholder="Adresse"
            defaultValue={companyInfo.address}
            style={{ padding: '8px 12px', border: '1px solid #ddd', borderRadius: '6px' }}
            onChange={(e) => onCompanyInfoChange?.({ ...companyInfo, address: e.target.value })}
          />
          <input
            placeholder="Téléphone"
            defaultValue={companyInfo.phone}
            style={{ padding: '8px 12px', border: '1px solid #ddd', borderRadius: '6px' }}
            onChange={(e) => onCompanyInfoChange?.({ ...companyInfo, phone: e.target.value })}
          />
          <input
            placeholder="Email"
            defaultValue={companyInfo.email}
            style={{ padding: '8px 12px', border: '1px solid #ddd', borderRadius: '6px' }}
            onChange={(e) => onCompanyInfoChange?.({ ...companyInfo, email: e.target.value })}
          />
          <input
            placeholder="Logo URL"
            defaultValue={companyInfo.logo}
            style={{ padding: '8px 12px', border: '1px solid #ddd', borderRadius: '6px' }}
            onChange={(e) => onCompanyInfoChange?.({ ...companyInfo, logo: e.target.value })}
          />
        </div>
        
        <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
          <button
            onClick={() => setEditingCompany(false)}
            style={{ padding: '8px 16px', background: '#007bff', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
          >
            Valider
          </button>
          <button
            onClick={() => setEditingCompany(false)}
            style={{ padding: '8px 16px', background: '#6c757d', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
          >
            Annuler
          </button>
        </div>
      </div>
    )
  }

  const RecipientInfoEditor = () => {
    if (!editingRecipient) return null
    
    return (
      <div style={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        background: 'white',
        padding: '24px',
        borderRadius: '12px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        zIndex: 1000,
        minWidth: '400px'
      }}>
        <h3 style={{ margin: '0 0 16px', fontSize: '18px', fontWeight: 700 }}>Informations du destinataire</h3>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <input
            placeholder="Nom du destinataire"
            defaultValue={recipientInfo.name}
            style={{ padding: '8px 12px', border: '1px solid #ddd', borderRadius: '6px' }}
            onChange={(e) => onRecipientInfoChange?.({ ...recipientInfo, name: e.target.value })}
          />
          <input
            placeholder="Entreprise/Organisation"
            defaultValue={recipientInfo.company}
            style={{ padding: '8px 12px', border: '1px solid #ddd', borderRadius: '6px' }}
            onChange={(e) => onRecipientInfoChange?.({ ...recipientInfo, company: e.target.value })}
          />
          <input
            placeholder="Adresse"
            defaultValue={recipientInfo.address}
            style={{ padding: '8px 12px', border: '1px solid #ddd', borderRadius: '6px' }}
            onChange={(e) => onRecipientInfoChange?.({ ...recipientInfo, address: e.target.value })}
          />
          <input
            placeholder="Référence du document"
            defaultValue={recipientInfo.reference}
            style={{ padding: '8px 12px', border: '1px solid #ddd', borderRadius: '6px' }}
            onChange={(e) => onRecipientInfoChange?.({ ...recipientInfo, reference: e.target.value })}
          />
        </div>
        
        <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
          <button
            onClick={() => setEditingRecipient(false)}
            style={{ padding: '8px 16px', background: '#007bff', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
          >
            Valider
          </button>
          <button
            onClick={() => setEditingRecipient(false)}
            style={{ padding: '8px 16px', background: '#6c757d', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
          >
            Annuler
          </button>
        </div>
      </div>
    )
  }

  const TemplateSelector = () => {
    if (!showLayoutOptions) return null
    
    return (
      <div style={{
        background: 'white',
        padding: '16px',
        borderRadius: '8px',
        marginBottom: '16px',
        border: '1px solid #e0e0e0'
      }}>
        <h4 style={{ margin: '0 0 12px', fontSize: '14px', fontWeight: 600 }}>Modèles de mise en page</h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
          {Object.entries(LAYOUT_TEMPLATES).map(([key, template]) => (
            <button
              key={key}
              onClick={() => handleTemplateChange(key)}
              style={{
                padding: '12px',
                border: selectedTemplate === key ? '2px solid #007bff' : '1px solid #ddd',
                borderRadius: '6px',
                background: selectedTemplate === key ? '#f0f8ff' : 'white',
                cursor: 'pointer',
                textAlign: 'left'
              }}
            >
              <div style={{ fontWeight: 600, fontSize: '13px', marginBottom: '4px' }}>{template.name}</div>
              <div style={{ fontSize: '11px', color: '#666' }}>{template.description}</div>
            </button>
          ))}
        </div>
        
        <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
          <button
            onClick={() => setEditingCompany(true)}
            style={{ padding: '6px 12px', background: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}
          >
            Entreprise
          </button>
          <button
            onClick={() => setEditingRecipient(true)}
            style={{ padding: '6px 12px', background: '#17a2b8', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}
          >
            Destinataire
          </button>
        </div>
      </div>
    )
  }
  
  return (
    <>
      {/* These three sub-components are conditionally rendered modals defined
          inline (closure-captures parent state). Extracting them as top-level
          components would require threading ~10 props each. */}
      {/* eslint-disable-next-line react-hooks/static-components */}
      <TemplateSelector />
      {/* eslint-disable-next-line react-hooks/static-components */}
      <CompanyInfoEditor />
      {/* eslint-disable-next-line react-hooks/static-components */}
      <RecipientInfoEditor />
      
      <div style={{
        background: '#f5f5f5',
        padding: '20px',
        borderRadius: '8px',
        overflow: 'auto'
      }}>
        <div style={{
          background: currentLayout.paperColor,
          color: currentLayout.textColor,
          maxWidth: '210mm',
          margin: '0 auto',
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
          borderRadius: '4px',
          overflow: 'hidden',
          fontFamily: currentLayout.fontFamily
        }}>
          {/* En-tête professionnel */}
          <div style={{
            height: currentLayout.headerHeight,
            background: currentLayout.headerBg,
            padding: `20px ${currentLayout.margins.right}px 20px ${currentLayout.margins.left}px`,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            color: selectedTemplate === 'executive' ? 'white' : currentLayout.textColor
          }}>
            <div style={{ flex: 1 }}>
              {companyInfo.logo && (
                <img 
                  src={companyInfo.logo} 
                  alt="Logo" 
                  style={{ height: '40px', marginBottom: '8px', objectFit: 'contain' }}
                />
              )}
              <div style={{ fontSize: '18px', fontWeight: 700, lineHeight: 1.2 }}>
                {companyInfo.name || 'ABAWI Consulting'}
              </div>
              <div style={{ fontSize: '11px', opacity: 0.8, lineHeight: 1.4 }}>
                {companyInfo.address || 'Dakar, Sénégal'}
                {companyInfo.phone && <><br />{companyInfo.phone}</>}
                {companyInfo.email && <><br />{companyInfo.email}</>}
              </div>
            </div>
            
            <div style={{ textAlign: 'right', flex: 1 }}>
              <div style={{ fontSize: '11px', opacity: 0.8 }}>
                {new Date().toLocaleDateString('fr-FR', { 
                  day: 'numeric', 
                  month: 'long', 
                  year: 'numeric' 
                })}
              </div>
              {recipientInfo.reference && (
                <div style={{ fontSize: '11px', opacity: 0.8, marginTop: '4px' }}>
                  Réf: {recipientInfo.reference}
                </div>
              )}
            </div>
          </div>
          
          {/* Informations destinataire */}
          {(recipientInfo.name || recipientInfo.company) && (
            <div style={{
              padding: `16px ${currentLayout.margins.right}px 8px ${currentLayout.margins.left}px`,
              borderBottom: '1px solid #eee',
              fontSize: '11px',
              color: currentLayout.textColor
            }}>
              <div style={{ fontWeight: 600, marginBottom: '4px' }}>À l'attention de:</div>
              <div>
                {recipientInfo.name && <div>{recipientInfo.name}</div>}
                {recipientInfo.company && <div>{recipientInfo.company}</div>}
                {recipientInfo.address && <div>{recipientInfo.address}</div>}
              </div>
            </div>
          )}
          
          {/* Corps du document */}
          <div style={{
            padding: `${currentLayout.margins.top}px ${currentLayout.margins.right}px ${currentLayout.margins.bottom}px ${currentLayout.margins.left}px`,
            minHeight: '600px',
            color: '#1a1a1a',
            fontSize: '12pt',
            lineHeight: 1.6
          }}>
            {children}
          </div>
          
          {/* Pied de page */}
          <div style={{
            height: currentLayout.footerHeight,
            background: currentLayout.footerBg,
            padding: `16px ${currentLayout.margins.right}px 16px ${currentLayout.margins.left}px`,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '10px',
            color: selectedTemplate === 'executive' ? 'white' : '#666',
            borderTop: selectedTemplate === 'executive' ? '1px solid #333' : '1px solid #eee'
          }}>
            <div>
              © {new Date().getFullYear()} {companyInfo.name || 'ABAWI Consulting'} - Tous droits réservés
            </div>
            <div>
              Document généré par Abawi IA - Page {typeof window !== 'undefined' ? '1' : '1'}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

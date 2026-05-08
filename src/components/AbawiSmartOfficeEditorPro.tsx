/**
 * ABAWI SMART OFFICE - DOCUMENT INTELLIGENCE ENGINE
 * 
 * L'OS de création documentaire intelligent pour l'Afrique
 * Architecture 5 layers : Smart Blocks + AI Agents + Calculation + Workflow + Africa-first
 * 
 * @version 1.0.0
 * @author ABAWI Team
 */

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { cleanIATextLight } from '../lib/cleanText';
import { generateWithGrokLlama, getGrokAgents, GrokSpecialists } from '../lib/grokService';

// ========================================
// TYPES & INTERFACES
// ========================================

interface SmartBlock {
  id: string;
  type: 'kpi' | 'swot' | 'dcf' | 'ohada' | 'cv' | 'rh' | 'immobilier' | 'consultant';
  data: Record<string, any>;
  position: number;
}

interface AIAgent {
  id: string;
  name: string;
  type: 'banking' | 'consulting' | 'legal' | 'hr' | 'realestate' | 'startup';
  prompt: string;
  action: (content: string) => Promise<string>;
}

interface Calculation {
  id: string;
  formula: string;
  inputs: Record<string, number>;
  result: number;
  unit: string;
}

interface Workflow {
  id: string;
  name: string;
  steps: WorkflowStep[];
  triggers: string[];
}

interface WorkflowStep {
  type: 'transform' | 'calculate' | 'generate' | 'export';
  config: Record<string, any>;
}

// ========================================
// SMART BUSINESS BLOCKS
// ========================================

const SmartBlocks = {
  kpi: {
    name: 'KPI Dashboard',
    icon: 'dashboard',
    template: {
      revenue: { value: 0, unit: 'XOF', trend: '+12%' },
      margin: { value: 0, unit: '%', trend: '+2%' },
      growth: { value: 0, unit: '%', trend: '+8%' },
      customers: { value: 0, unit: '', trend: '+15%' }
    }
  },
  
  swot: {
    name: 'Analyse SWOT',
    icon: 'analytics',
    template: {
      strengths: ['Force 1', 'Force 2'],
      weaknesses: ['Faiblesse 1', 'Faiblesse 2'],
      opportunities: ['Opportunité 1', 'Opportunité 2'],
      threats: ['Menace 1', 'Menace 2']
    }
  },
  
  dcf: {
    name: 'DCF Valorisation',
    icon: 'calculator',
    template: {
      fcf: [1000000, 1200000, 1440000],
      wacc: 0.10,
      growth: 0.03,
      terminal: 15000000
    }
  },
  
  ohada: {
    name: 'Document OHADA',
    icon: 'gavel',
    template: {
      type: 'bilan',
      currency: 'XOF',
      normes: ['SYSCOHADA', 'OHADA'],
      pays: 'Sénégal'
    }
  },
  
  cv: {
    name: 'CV ATS Optimisé',
    icon: 'person',
    template: {
      nom: '',
      titre: '',
      experience: [],
      formations: [],
      competences: [],
      score: 0
    }
  },
  
  rh: {
    name: 'Grille Salariale',
    icon: 'work',
    template: {
      niveau: ['Junior', 'Confirmé', 'Senior', 'Manager'],
      salaires: [150000, 250000, 400000, 600000],
      avantages: ['Transport', 'Téléphone', 'Assurance']
    }
  },
  
  immobilier: {
    name: 'Analyse Immobilière',
    icon: 'home',
    template: {
      surface: 0,
      prix_m2: 0,
      rendement: 0,
      charges: 0,
      cashflow: 0
    }
  },
  
  consultant: {
    name: 'Rapport Consulting',
    icon: 'business',
    template: {
      client: '',
      mission: '',
      duree: 0,
      honoraires: 0,
      recommandations: []
    }
  }
};

// ========================================
// AI AGENTS EXPERTS - GROK/Llama
// ========================================

const AIAgents: AIAgent[] = [
  {
    id: 'banking-senegal',
    name: 'Expert Bancaire Grok',
    type: 'banking',
    prompt: 'Transforme ce document en dossier de crédit bancaire selon les normes BCEAO et OHADA',
    action: async (content: string) => {
      return await GrokSpecialists.transformForBanking(content, 'Sénégal');
    }
  },
  
  {
    id: 'consulting-elite',
    name: 'Consultant Senior Élite',
    type: 'consulting',
    prompt: 'Restructure ce document en rapport de consulting niveau cabinet international',
    action: async (content: string) => {
      return await GrokSpecialists.transformForConsulting(content, 'senior');
    }
  },
  
  {
    id: 'legal-ohada',
    name: 'Expert Juridique Grok',
    type: 'legal',
    prompt: 'Transforme en document juridique conforme OHADA',
    action: async (content: string) => {
      return await GrokSpecialists.transformForLegal(content, 'contrat');
    }
  },
  
  {
    id: 'hr-ats',
    name: 'Expert RH Grok',
    type: 'hr',
    prompt: 'Optimise ce CV pour les systèmes ATS',
    action: async (content: string) => {
      return await GrokSpecialists.optimizeCV(content, '');
    }
  },
  
  {
    id: 'realestate-analysis',
    name: 'Expert Immobilier Grok',
    type: 'realestate',
    prompt: 'Analyse la rentabilité de ce projet immobilier',
    action: async (content: string) => {
      return await GrokSpecialists.analyzeRealEstate(content, 'rentabilité');
    }
  }
];

// ========================================
// CALCULATION ENGINE
// ========================================

class CalculationEngine {
  static calculateDCF(fcf: number[], wacc: number, growth: number, terminal: number): number {
    let npv = 0;
    for (let i = 0; i < fcf.length; i++) {
      npv += (fcf[i] ?? 0) / Math.pow(1 + wacc, i + 1);
    }
    npv += terminal / Math.pow(1 + wacc, fcf.length);
    return npv;
  }
  
  static calculateTVA(amount: number, rate: number = 0.18): number {
    return amount * rate;
  }
  
  static calculateMargin(revenue: number, costs: number): number {
    return ((revenue - costs) / revenue) * 100;
  }
  
  static calculateCashFlow(operating: number, investing: number, financing: number): number {
    return operating + investing + financing;
  }
  
  static calculateIRR(cashFlows: number[]): number {
    // Simplified IRR calculation
    let rate = 0.1;
    let npv = 0;
    for (let i = 0; i < 50; i++) {
      npv = cashFlows.reduce((sum, cf, index) => sum + cf / Math.pow(1 + rate, index), 0);
      if (Math.abs(npv) < 0.01) break;
      rate += npv > 0 ? 0.01 : -0.01;
    }
    return rate;
  }
}

// ========================================
// WORKFLOW ENGINE
// ========================================

const Workflows: Workflow[] = [
  {
    id: 'cv-to-pitch',
    name: 'CV vers Pitch Deck',
    steps: [
      { type: 'transform', config: { from: 'cv', to: 'pitch' } },
      { type: 'generate', config: { template: 'pitch-deck' } },
      { type: 'export', config: { format: 'powerpoint' } }
    ],
    triggers: ['cv-completed']
  },
  
  {
    id: 'business-plan-banking',
    name: 'Business Plan vers Dossier Bancaire',
    steps: [
      { type: 'calculate', config: { ratios: 'ohada' } },
      { type: 'transform', config: { style: 'banking' } },
      { type: 'generate', config: { documents: ['dossier-credit', 'garanties'] } }
    ],
    triggers: ['business-plan-ready']
  }
];

// ========================================
// AFRICA-FIRST ENGINE
// ========================================

const AfricaFirstEngine = {
  pays: ['Sénégal', 'Côte d\'Ivoire', 'Mali', 'Burkina Faso', 'Niger', 'Bénin', 'Togo', 'Guinée'],
  
  normes: {
    OHADA: {
      pays: ['Sénégal', 'Côte d\'Ivoire', 'Mali', 'Burkina Faso', 'Niger', 'Bénin', 'Togo', 'Guinée'],
      documents: ['bilan', 'compte-resultat', 'tableau-flux', 'annexes'],
      ratios: ['solvabilité', 'liquidité', 'rentabilité', 'structure']
    },
    
    SYSCOHADA: {
      plan_comptable: 'OHADA',
      tva: { taux: [0, 0.10, 0.18] },
      impots: ['IS', 'IRPP', 'TF', 'CFE'],
      normes: ['IFRS', 'OHADA']
    },
    
    BCEAO: {
      zone: 'UEMOA',
      devise: 'XOF',
      taux_directeur: 0.0275,
      inflation_cible: 0.03
    }
  },
  
  langues: {
    FR: 'Français',
    EN: 'English', 
    WO: 'Wolof'
  },
  
  modeles: {
    senegal: {
      documents: ['statuts', 'immatriculation', 'NINEA', 'CNSS'],
      impots: ['IS 25%', 'TV A 18%', 'TF'],
      banques: ['CBAO', 'Ecobank', 'NSIA', 'SGBS']
    },
    
    coteivoire: {
      documents: ['carte-contribuable', 'registre-commerce', 'CNPS'],
      impots: ['IS 25%', 'TVA 18%', 'CVAE'],
      banques: ['SGBCI', 'Ecobank', 'BIAO', 'NSIA']
    }
  }
};

// ========================================
// COMPOSANT PRINCIPAL
// ========================================

export default function AbawiSmartOfficeEditorPro() {
  const [activeBlock, setActiveBlock] = useState<SmartBlock | null>(null);
  const [activeAgent, setActiveAgent] = useState<AIAgent | null>(null);
  const [calculations, setCalculations] = useState<Calculation[]>([]);
  const [showSlashMenu, setShowSlashMenu] = useState(false);
  const [slashQuery, setSlashQuery] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [documentType, setDocumentType] = useState<'professional' | 'banking' | 'consulting' | 'legal'>('professional');
  const [selectedCountry, setSelectedCountry] = useState('Sénégal');
  const [selectedLanguage, setSelectedLanguage] = useState('FR');
  const [editorContent, setEditorContent] = useState('');
  const editorRef = useRef<HTMLDivElement>(null);
  const isTypingRef = useRef(false);
  const prevContentRef = useRef('');

  // Sync external content changes to editor (AI results, initial load, etc.)
  // Skip if user is currently typing to avoid cursor jumping
  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;
    
    // Only update if content changed externally (not from typing)
    if (!isTypingRef.current && editorContent !== prevContentRef.current) {
      // Save cursor position
      const sel = window.getSelection();
      const range = sel && sel.rangeCount > 0 ? sel.getRangeAt(0) : null;
      const cursorOffset = range ? range.startOffset : 0;
      
      // Update content
      editor.innerHTML = editorContent;
      prevContentRef.current = editorContent;
      
      // Try to restore cursor (approximate)
      if (range && editor.contains(range.startContainer)) {
        try {
          const newRange = document.createRange();
          const textNodes: Node[] = [];
          const walker = document.createTreeWalker(editor, NodeFilter.SHOW_TEXT);
          let node;
          while (node = walker.nextNode()) textNodes.push(node);
          
          if (textNodes.length > 0 && sel) {
            const targetNode = textNodes[Math.min(textNodes.length - 1, Math.floor(cursorOffset / 10))] || textNodes[0];
            if (!targetNode) return;
            const targetOffset = Math.min(targetNode.textContent?.length || 0, cursorOffset % 10);
            newRange.setStart(targetNode, targetOffset);
            newRange.collapse(true);
            sel.removeAllRanges();
            sel.addRange(newRange);
          }
        } catch {}
      }
    }
  }, [editorContent]);

  // ========================================
  // SLASH COMMANDS
  // ========================================
  
  const slashCommands = useMemo(() => [
    { icon: 'dashboard', title: 'KPI Dashboard', description: 'Tableau de bord avec indicateurs', action: () => insertSmartBlock('kpi') },
    { icon: 'analytics', title: 'SWOT', description: 'Analyse forces/faiblesses', action: () => insertSmartBlock('swot') },
    { icon: 'calculator', title: 'DCF', description: 'Valorisation par DCF', action: () => insertSmartBlock('dcf') },
    { icon: 'gavel', title: 'OHADA', description: 'Document juridique OHADA', action: () => insertSmartBlock('ohada') },
    { icon: 'person', title: 'CV ATS', description: 'CV optimisé pour ATS', action: () => insertSmartBlock('cv') },
    { icon: 'work', title: 'RH', description: 'Grille salariale et contrat', action: () => insertSmartBlock('rh') },
    { icon: 'home', title: 'Immobilier', description: 'Rentabilité et financement', action: () => insertSmartBlock('immobilier') },
    { icon: 'business', title: 'Consulting', description: 'Rapport de mission', action: () => insertSmartBlock('consultant') },
    { icon: 'table', title: 'Tableau', description: 'Insérer un tableau', action: () => insertTable() },
    { icon: 'image', title: 'Image', description: 'Insérer une image', action: () => insertImage() },
    { icon: 'link', title: 'Lien', description: 'Ajouter un lien', action: () => insertLink() },
    { icon: 'psychology', title: 'IA Bancaire', description: 'Transformer pour banque', action: () => activateAIAgent('banking') },
    { icon: 'lightbulb', title: 'IA Consulting', description: 'Style cabinet élite', action: () => activateAIAgent('consulting') },
    { icon: 'balance', title: 'IA Juridique', description: 'Conforme OHADA', action: () => activateAIAgent('legal') },
    { icon: 'people', title: 'IA RH', description: 'Optimisation RH', action: () => activateAIAgent('hr') },
    { icon: 'home', title: 'IA Immobilier', description: 'Analyse rentabilité', action: () => activateAIAgent('realestate') }
  ], []);

  const filteredCommands = useMemo(() => {
    if (!slashQuery) return slashCommands;
    return slashCommands.filter(cmd => 
      cmd.title.toLowerCase().includes(slashQuery.toLowerCase()) ||
      cmd.description.toLowerCase().includes(slashQuery.toLowerCase())
    );
  }, [slashQuery, slashCommands]);

  // ========================================
  // CURSOR & INSERTION HELPERS
  // ========================================

  const insertHtmlAtCursor = useCallback((html: string) => {
    editorRef.current?.focus();
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      const range = sel.getRangeAt(0);
      range.deleteContents();
      const fragment = range.createContextualFragment(html);
      range.insertNode(fragment);
      range.collapse(false);
      sel.removeAllRanges();
      sel.addRange(range);
      // Sync state
      setEditorContent(editorRef.current?.innerHTML || '');
    } else {
      // Fallback: append at end
      setEditorContent(prev => prev + html);
    }
  }, []);

  // ========================================
  // SMART BLOCKS INSERTION
  // ========================================

  const insertSmartBlock = useCallback((blockType: keyof typeof SmartBlocks) => {
    const block = SmartBlocks[blockType];
    const blockHtml = generateBlockHTML(blockType, block);

    insertHtmlAtCursor('<br><br>' + blockHtml);
    setShowSlashMenu(false);

    setActiveBlock({
      id: Date.now().toString(),
      type: blockType,
      data: block.template,
      position: editorContent.length
    });
  }, [editorContent, insertHtmlAtCursor]);

  const generateBlockHTML = (type: string, block: any): string => {
    switch (type) {
      case 'kpi':
        return `
          <div class="smart-block kpi-block" data-type="kpi">
            <h3>Tableau de Bord KPI</h3>
            <div class="kpi-grid">
              <div class="kpi-item">
                <span class="kpi-label">Chiffre d'Affaires</span>
                <span class="kpi-value">0 XOF</span>
                <span class="kpi-trend">+12%</span>
              </div>
              <div class="kpi-item">
                <span class="kpi-label">Marge</span>
                <span class="kpi-value">0%</span>
                <span class="kpi-trend">+2%</span>
              </div>
              <div class="kpi-item">
                <span class="kpi-label">Croissance</span>
                <span class="kpi-value">0%</span>
                <span class="kpi-trend">+8%</span>
              </div>
              <div class="kpi-item">
                <span class="kpi-label">Clients</span>
                <span class="kpi-value">0</span>
                <span class="kpi-trend">+15%</span>
              </div>
            </div>
          </div>
        `;
        
      case 'swot':
        return `
          <div class="smart-block swot-block" data-type="swot">
            <h3>Analyse SWOT</h3>
            <div class="swot-grid">
              <div class="swot-quadrant strengths">
                <h4>Forces</h4>
                <ul><li>Force 1</li><li>Force 2</li></ul>
              </div>
              <div class="swot-quadrant weaknesses">
                <h4>Faiblesse</h4>
                <ul><li>Faiblesse 1</li><li>Faiblesse 2</li></ul>
              </div>
              <div class="swot-quadrant opportunities">
                <h4>Opportunités</h4>
                <ul><li>Opportunité 1</li><li>Opportunité 2</li></ul>
              </div>
              <div class="swot-quadrant threats">
                <h4>Menaces</h4>
                <ul><li>Menace 1</li><li>Menace 2</li></ul>
              </div>
            </div>
          </div>
        `;
        
      case 'dcf':
        return `
          <div class="smart-block dcf-block" data-type="dcf">
            <h3>Analyse DCF</h3>
            <div class="DCF-inputs">
              <div class="input-group">
                <label>Free Cash Flow Année 1:</label>
                <input type="number" value="1000000" />
              </div>
              <div class="input-group">
                <label>WACC:</label>
                <input type="number" value="0.10" step="0.01" />
              </div>
              <div class="input-group">
                <label>Taux de croissance:</label>
                <input type="number" value="0.03" step="0.01" />
              </div>
              <div class="input-group">
                <label>Valeur terminale:</label>
                <input type="number" value="15000000" />
              </div>
            </div>
            <div class="DCF-result">
              <h4>Valeur actuelle nette: <span id="dcf-result">0 XOF</span></h4>
            </div>
          </div>
        `;
        
      default:
        return `<div class="smart-block" data-type="${type}"><h3>${block.name}</h3><p>Contenu du bloc ${type}</p></div>`;
    }
  };

  // ========================================
  // AI AGENTS ACTIVATION
  // ========================================
  
  const activateAIAgent = useCallback((agentType: string) => {
    const agent = AIAgents.find(a => a.type === agentType);
    if (!agent) return;
    
    setIsProcessing(true);
    setActiveAgent(agent);
    
    agent.action(editorContent).then(result => {
      const cleanedResult = cleanIATextLight(result);
      setEditorContent(cleanedResult);
      setIsProcessing(false);
      setShowSlashMenu(false);
    });
  }, [editorContent]);

  // ========================================
  // BASIC EDITOR FUNCTIONS
  // ========================================
  
  const insertTable = useCallback(() => {
    const tableHTML = `
      <table border="1" style="border-collapse: collapse; width: 100%;">
        <tr><th>Col 1</th><th>Col 2</th><th>Col 3</th></tr>
        <tr><td>Cell 1</td><td>Cell 2</td><td>Cell 3</td></tr>
        <tr><td>Cell 4</td><td>Cell 5</td><td>Cell 6</td></tr>
      </table>
    `;
    insertHtmlAtCursor(tableHTML);
    setShowSlashMenu(false);
  }, [insertHtmlAtCursor]);

  const insertImage = useCallback(() => {
    const url = prompt('URL de l\'image:');
    if (url) {
      const imageHTML = `<img src="${url}" alt="Image" style="max-width: 100%; height: auto;" />`;
      insertHtmlAtCursor(imageHTML);
    }
    setShowSlashMenu(false);
  }, [insertHtmlAtCursor]);

  const insertLink = useCallback(() => {
    const url = prompt('URL du lien:');
    if (url) {
      const linkHTML = `<a href="${url}" target="_blank">${url}</a>`;
      insertHtmlAtCursor(linkHTML);
    }
    setShowSlashMenu(false);
  }, [insertHtmlAtCursor]);

  // ========================================
  // WORKFLOW EXECUTION
  // ========================================
  
  const executeWorkflow = useCallback(async (workflowId: string) => {
    const workflow = Workflows.find(w => w.id === workflowId);
    if (!workflow) return;
    
    setIsProcessing(true);
    
    for (const step of workflow.steps) {
      switch (step.type) {
        case 'transform':
          // Transformation logic
          break;
        case 'calculate':
          // Calculation logic
          break;
        case 'generate':
          // Generation logic
          break;
        case 'export':
          // Export logic
          break;
      }
    }
    
    setIsProcessing(false);
  }, []);

  // ========================================
  // EXPORT FUNCTIONS
  // ========================================
  
  const exportDocument = useCallback(async (format: 'pdf' | 'word' | 'excel' | 'powerpoint') => {
    switch (format) {
      case 'pdf':
        window.print();
        break;
      case 'word':
        const blob = new Blob([editorContent], { type: 'application/msword' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'document-abawi.doc';
        a.click();
        break;
      case 'excel':
        // Excel export logic
        break;
      case 'powerpoint':
        // PowerPoint export logic
        break;
    }
  }, [editorContent]);

  // ========================================
  // RENDER
  // ========================================
  
  return (
    <div className="abawi-smart-office">
      {/* Header */}
      <div className="aso-header">
        <div className="aso-brand">
          <h1>ABAWI Smart Office</h1>
          <span>Document Intelligence Engine</span>
        </div>
        
        <div className="aso-controls">
          <select 
            value={documentType} 
            onChange={(e) => setDocumentType(e.target.value as any)}
            className="document-type-selector"
          >
            <option value="professional">Professionnel</option>
            <option value="banking">Bancaire</option>
            <option value="consulting">Consulting</option>
            <option value="legal">Juridique</option>
          </select>
          
          <select 
            value={selectedCountry} 
            onChange={(e) => setSelectedCountry(e.target.value)}
            className="country-selector"
          >
            {AfricaFirstEngine.pays.map(pays => (
              <option key={pays} value={pays}>{pays}</option>
            ))}
          </select>
          
          <select 
            value={selectedLanguage} 
            onChange={(e) => setSelectedLanguage(e.target.value)}
            className="language-selector"
          >
            {Object.entries(AfricaFirstEngine.langues).map(([code, name]) => (
              <option key={code} value={code}>{name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Toolbar */}
      <div className="aso-toolbar">
        <div className="toolbar-group">
          <button onClick={() => {
            editorRef.current?.focus();
            document.execCommand('bold', false);
          }}>
            <strong>B</strong>
          </button>
          <button onClick={() => {
            editorRef.current?.focus();
            document.execCommand('italic', false);
          }}>
            <em>I</em>
          </button>
          <button onClick={() => {
            editorRef.current?.focus();
            document.execCommand('underline', false);
          }}>
            <u>U</u>
          </button>
        </div>
        
        <div className="toolbar-group">
          <button onClick={() => {
            editorRef.current?.focus();
            document.execCommand('formatBlock', false, '<h1>');
          }}>H1</button>
          <button onClick={() => {
            editorRef.current?.focus();
            document.execCommand('formatBlock', false, '<h2>');
          }}>H2</button>
          <button onClick={() => {
            editorRef.current?.focus();
            document.execCommand('formatBlock', false, '<h3>');
          }}>H3</button>
        </div>
        
        <div className="toolbar-group">
          <button onClick={() => {
            editorRef.current?.focus();
            document.execCommand('insertUnorderedList', false);
          }}>Bullet</button>
          <button onClick={() => {
            editorRef.current?.focus();
            document.execCommand('insertOrderedList', false);
          }}>Numbered</button>
        </div>
        
        <div className="toolbar-group">
          <button onClick={() => exportDocument('pdf')}>PDF</button>
          <button onClick={() => exportDocument('word')}>Word</button>
          <button onClick={() => exportDocument('excel')}>Excel</button>
          <button onClick={() => exportDocument('powerpoint')}>PPT</button>
        </div>
      </div>

      {/* Editor */}
      <div className="aso-editor-container">
        <div 
          ref={editorRef}
          contentEditable={true}
          className="aso-editor"
          suppressContentEditableWarning={true}
          onInput={(e) => {
            isTypingRef.current = true;
            const content = e.currentTarget.innerHTML;
            setEditorContent(content);
            prevContentRef.current = content;
            
            const text = e.currentTarget.innerText;
            const lastChar = text[text.length - 1];
            
            // Slash command trigger
            if (lastChar === '/') {
              setShowSlashMenu(true);
              setSlashQuery('');
            }
            
            // Auto-hide slash menu
            if (lastChar !== '/' && lastChar !== ' ' && showSlashMenu) {
              setShowSlashMenu(false);
            }
            
            // Reset typing flag after a short delay
            setTimeout(() => { isTypingRef.current = false; }, 100);
          }}
        />
        
        {/* Slash Command Menu */}
        {showSlashMenu && (
          <div className="slash-menu">
            <div className="slash-search">
              <input
                type="text"
                placeholder="Rechercher une commande..."
                value={slashQuery}
                onChange={(e) => setSlashQuery(e.target.value)}
                autoFocus
              />
            </div>
            <div className="slash-commands">
              {filteredCommands.map((cmd, index) => (
                <div
                  key={index}
                  className="slash-command"
                  onClick={cmd.action}
                >
                  <span className="command-icon">{cmd.icon}</span>
                  <div className="command-content">
                    <div className="command-title">{cmd.title}</div>
                    <div className="command-description">{cmd.description}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Processing Overlay */}
        {isProcessing && (
          <div className="processing-overlay">
            <div className="processing-spinner"></div>
            <div>Traitement en cours...</div>
          </div>
        )}
      </div>

      {/* Status Bar */}
      <div className="aso-statusbar">
        <div className="status-left">
          <span>{editorContent.length} caractères</span>
          <span>{editorContent.split(/\s+/).filter(word => word.length > 0).length} mots</span>
        </div>
        <div className="status-right">
          {activeAgent && <span className="active-agent">Agent: {activeAgent.name}</span>}
          {activeBlock && <span className="active-block">Block: {activeBlock.type}</span>}
        </div>
      </div>

      {/* Styles */}
      <style dangerouslySetInnerHTML={{
        __html: `
        .abawi-smart-office {
          display: flex;
          flex-direction: column;
          height: 100%;
          background: var(--bg-primary);
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          color: var(--text-primary);
        }
        
        .aso-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 24px;
          background: var(--gradient-hero);
          border-bottom: 1px solid var(--border);
          color: var(--text-primary);
        }
        
        .aso-brand h1 {
          margin: 0;
          font-size: 1.5rem;
          font-weight: 700;
          color: var(--text-primary);
        }
        
        .aso-brand span {
          font-size: 0.875rem;
          color: var(--text-secondary);
        }
        
        .aso-controls {
          display: flex;
          gap: 12px;
        }
        
        .document-type-selector,
        .country-selector,
        .language-selector {
          padding: 8px 12px;
          border: 1px solid var(--border);
          border-radius: 6px;
          background: var(--bg-card);
          color: var(--text-primary);
          font-size: 0.875rem;
        }
        
        .aso-toolbar {
          display: flex;
          gap: 12px;
          padding: 10px clamp(12px, 2vw, 24px);
          background: var(--bg-secondary);
          border-bottom: 1px solid var(--border);
          flex-wrap: wrap;
          align-items: center;
        }

        .toolbar-group {
          display: flex;
          gap: 4px;
          flex-wrap: wrap;
        }

        .toolbar-group button {
          padding: 7px 11px;
          border: 1px solid var(--border);
          background: var(--bg-card);
          color: var(--text-primary);
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.18s ease;
          font-size: 0.85rem;
        }
        .toolbar-group button:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 10px rgba(0,0,0,0.15);
        }
        
        .toolbar-group button:hover {
          background: var(--bg-card-hover);
        }
        
        .toolbar-group button.active {
          background: var(--accent);
          color: white;
          border-color: var(--accent);
        }
        
        .aso-editor-container {
          flex: 1;
          position: relative;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          padding: clamp(12px, 2vw, 24px);
          box-sizing: border-box;
        }

        .aso-editor {
          flex: 1;
          padding: clamp(20px, 3vw, 40px) clamp(20px, 4vw, 64px);
          overflow-y: auto;
          width: 100%;
          box-sizing: border-box;
          outline: none;
          line-height: 1.7;
          border: 2px solid var(--border);
          border-radius: 12px;
          background: var(--bg-card);
          color: var(--text-primary);
          box-shadow: 0 4px 18px rgba(0,0,0,0.12);
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
          position: relative;
          font-size: clamp(0.95rem, 1.1vw, 1.1rem);
          min-height: 60vh;
        }
        
        .aso-editor:focus {
          border-color: var(--accent);
          box-shadow: 0 4px 20px rgba(59, 130, 246, 0.15);
        }
        
        .aso-editor::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: linear-gradient(90deg, var(--accent), var(--accent2), var(--accent3));
          border-radius: 12px 12px 0 0;
          opacity: 0;
          transition: opacity 0.2s ease;
        }
        
        .aso-editor:focus::before {
          opacity: 1;
        }
        
        .aso-editor h1 {
          font-size: 2rem;
          font-weight: 700;
          margin: 24px 0 16px;
          color: var(--text-primary);
        }
        
        .aso-editor h2 {
          font-size: 1.5rem;
          font-weight: 600;
          margin: 20px 0 12px;
          color: var(--text-primary);
        }
        
        .aso-editor h3 {
          font-size: 1.25rem;
          font-weight: 600;
          margin: 16px 0 8px;
          color: var(--text-primary);
        }
        
        .aso-editor p {
          color: var(--text-secondary);
        }
        
        .slash-menu {
          position: absolute;
          top: 60px;
          left: 50%;
          transform: translateX(-50%);
          width: 400px;
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          z-index: 1000;
          color: var(--text-primary);
        }
        
        .slash-search {
          padding: 12px;
          border-bottom: 1px solid var(--border);
        }
        
        .slash-search input {
          width: 100%;
          padding: 8px;
          border: 1px solid var(--border);
          border-radius: 4px;
          font-size: 0.875rem;
          background: var(--bg-secondary);
          color: var(--text-primary);
        }
        
        .slash-commands {
          max-height: 300px;
          overflow-y: auto;
        }
        
        .slash-command {
          display: flex;
          align-items: center;
          padding: 12px;
          cursor: pointer;
          transition: background 0.2s;
          color: var(--text-primary);
        }
        
        .slash-command:hover {
          background: var(--bg-card-hover);
        }
        
        .command-icon {
          width: 24px;
          height: 24px;
          margin-right: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--bg-secondary);
          border-radius: 4px;
          font-size: 12px;
          color: var(--text-primary);
        }
        
        .command-title {
          font-weight: 600;
          font-size: 0.875rem;
          color: var(--text-primary);
        }
        
        .command-description {
          font-size: 0.75rem;
          color: var(--text-secondary);
        }
        
        .processing-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(var(--bg-primary-rgb, 7, 11, 15), 0.9);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          z-index: 2000;
          color: var(--text-primary);
        }
        
        .processing-spinner {
          width: 40px;
          height: 40px;
          border: 4px solid var(--border);
          border-top: 4px solid var(--accent);
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: 16px;
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        .aso-statusbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 24px;
          background: var(--bg-secondary);
          border-top: 1px solid var(--border);
          font-size: 0.75rem;
          color: var(--text-secondary);
        }
        
        .status-left {
          display: flex;
          gap: 16px;
        }
        
        .status-right {
          display: flex;
          gap: 16px;
        }
        
        .active-agent,
        .active-block {
          color: var(--accent);
          font-weight: 600;
        }
        
        /* Smart Blocks Styles */
        .smart-block {
          margin: 16px 0;
          padding: 16px;
          border: 2px solid var(--border);
          border-radius: 8px;
          background: var(--bg-secondary);
          color: var(--text-primary);
        }
        
        .kpi-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 16px;
          margin-top: 12px;
        }
        
        .kpi-item {
          padding: 16px;
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: 6px;
          text-align: center;
          color: var(--text-primary);
        }
        
        .kpi-label {
          display: block;
          font-size: 0.875rem;
          color: var(--text-secondary);
          margin-bottom: 4px;
        }
        
        .kpi-value {
          display: block;
          font-size: 1.5rem;
          font-weight: 700;
          color: var(--text-primary);
          margin-bottom: 4px;
        }
        
        .kpi-trend {
          display: block;
          font-size: 0.75rem;
          color: #10b981;
        }
        
        .swot-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          margin-top: 12px;
        }
        
        .swot-quadrant {
          padding: 16px;
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: 6px;
          color: var(--text-primary);
        }
        
        .swot-quadrant h4 {
          margin: 0 0 8px 0;
          font-size: 1rem;
          font-weight: 600;
          color: var(--text-primary);
        }
        
        .swot-quadrant.strengths { border-left: 4px solid #10b981; }
        .swot-quadrant.weaknesses { border-left: 4px solid #ef4444; }
        .swot-quadrant.opportunities { border-left: 4px solid #3b82f6; }
        .swot-quadrant.threats { border-left: 4px solid #f59e0b; }
        
        .DCF-inputs {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 16px;
          margin-bottom: 16px;
        }
        
        .input-group {
          display: flex;
          flex-direction: column;
        }
        
        .input-group label {
          font-size: 0.875rem;
          color: var(--text-secondary);
          margin-bottom: 4px;
        }
        
        .input-group input {
          padding: 8px;
          border: 1px solid var(--border);
          border-radius: 4px;
          font-size: 0.875rem;
          background: var(--bg-card);
          color: var(--text-primary);
        }
        
        .DCF-result {
          padding: 16px;
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: 6px;
          text-align: center;
          color: var(--text-primary);
        }
        
        .DCF-result h4 {
          margin: 0;
          font-size: 1.125rem;
          color: var(--text-primary);
        }
        
        .DCF-result span {
          color: #10b981;
          font-weight: 700;
        }
        `
      }} />
    </div>
  );
}

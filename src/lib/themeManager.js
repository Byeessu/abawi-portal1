/**
 * ABAWI Theme Manager
 * Gestionnaire de thèmes pour l'affichage correct des documents
 * Étalonage des couleurs pour éviter les conflits de contraste
 */

// Définition des thèmes avec étalonnage correct
const THEMES = {
  light: {
    name: 'Clair',
    background: '#ffffff',
    surface: '#f8fafc',
    text: '#1e293b',
    textSecondary: '#475569',
    border: '#e2e8f0',
    accent: '#3b82f6',
    card: '#ffffff',
    code: '#f1f5f9',
    codeText: '#1e293b',
    preview: {
      background: '#ffffff',
      text: '#1e293b',
      heading: '#0f172a',
      subheading: '#334155',
      link: '#3b82f6',
      code: '#f8fafc',
      codeText: '#1e293b',
      quote: '#64748b',
      table: '#f8fafc',
      tableBorder: '#e2e8f0'
    }
  },
  
  dark: {
    name: 'Sombre',
    background: '#0f172a',
    surface: '#1e293b',
    text: '#f8fafc',
    textSecondary: '#cbd5e1',
    border: '#334155',
    accent: '#3b82f6',
    card: '#1e293b',
    code: '#1e293b',
    codeText: '#f8fafc',
    preview: {
      background: '#ffffff',
      text: '#1e293b',
      heading: '#0f172a',
      subheading: '#334155',
      link: '#3b82f6',
      code: '#f8fafc',
      codeText: '#1e293b',
      quote: '#64748b',
      table: '#f8fafc',
      tableBorder: '#e2e8f0'
    }
  },
  
  galaxy: {
    name: 'Galaxy',
    background: '#0a0a0f',
    surface: '#1a1a2e',
    text: '#e2e8f0',
    textSecondary: '#a8b2d1',
    border: '#2d3748',
    accent: '#667eea',
    card: '#1a1a2e',
    code: '#2d3748',
    codeText: '#e2e8f0',
    preview: {
      background: '#ffffff',
      text: '#1e293b',
      heading: '#0f172a',
      subheading: '#334155',
      link: '#3b82f6',
      code: '#f8fafc',
      codeText: '#1e293b',
      quote: '#64748b',
      table: '#f8fafc',
      tableBorder: '#e2e8f0'
    }
  },
  
  platinum: {
    name: 'Platine',
    background: '#f8fafc',
    surface: '#ffffff',
    text: '#1a202c',
    textSecondary: '#4a5568',
    border: '#e2e8f0',
    accent: '#805ad5',
    card: '#ffffff',
    code: '#edf2f7',
    codeText: '#1a202c',
    preview: {
      background: '#ffffff',
      text: '#1e293b',
      heading: '#0f172a',
      subheading: '#334155',
      link: '#3b82f6',
      code: '#f8fafc',
      codeText: '#1e293b',
      quote: '#64748b',
      table: '#f8fafc',
      tableBorder: '#e2e8f0'
    }
  }
};

// Gestionnaire de thèmes
class ThemeManager {
  constructor() {
    this.currentTheme = 'light';
    this.listeners = [];
    this.init();
  }

  init() {
    // Détecter le thème système par défaut
    if (typeof window !== 'undefined') {
      const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      this.currentTheme = systemPrefersDark ? 'dark' : 'light';
      
      // Écouter les changements de thème système
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        if (!this.getStoredTheme()) {
          this.setTheme(e.matches ? 'dark' : 'light');
        }
      });
      
      // Charger le thème sauvegardé
      const stored = this.getStoredTheme();
      if (stored) {
        this.setTheme(stored);
      }
    }
  }

  getStoredTheme() {
    if (typeof localStorage !== 'undefined') {
      return localStorage.getItem('abawi-theme');
    }
    return null;
  }

  setTheme(themeName) {
    if (THEMES[themeName]) {
      this.currentTheme = themeName;
      
      // Sauvegarder le thème
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('abawi-theme', themeName);
      }
      
      // Appliquer les variables CSS
      this.applyThemeCSS();
      
      // Notifier les écouteurs
      this.notifyListeners();
    }
  }

  applyThemeCSS() {
    if (typeof document !== 'undefined') {
      const theme = THEMES[this.currentTheme];
      const root = document.documentElement;
      
      // Variables CSS principales
      root.style.setProperty('--abawi-bg', theme.background);
      root.style.setProperty('--abawi-surface', theme.surface);
      root.style.setProperty('--abawi-text', theme.text);
      root.style.setProperty('--abawi-text-secondary', theme.textSecondary);
      root.style.setProperty('--abawi-border', theme.border);
      root.style.setProperty('--abawi-accent', theme.accent);
      root.style.setProperty('--abawi-card', theme.card);
      root.style.setProperty('--abawi-code-bg', theme.code);
      root.style.setProperty('--abawi-code-text', theme.codeText);
      
      // Variables CSS pour l'aperçu (toujours lisible)
      root.style.setProperty('--abawi-preview-bg', theme.preview.background);
      root.style.setProperty('--abawi-preview-text', theme.preview.text);
      root.style.setProperty('--abawi-preview-heading', theme.preview.heading);
      root.style.setProperty('--abawi-preview-subheading', theme.preview.subheading);
      root.style.setProperty('--abawi-preview-link', theme.preview.link);
      root.style.setProperty('--abawi-preview-code-bg', theme.preview.code);
      root.style.setProperty('--abawi-preview-code-text', theme.preview.codeText);
      root.style.setProperty('--abawi-preview-quote', theme.preview.quote);
      root.style.setProperty('--abawi-preview-table-bg', theme.preview.table);
      root.style.setProperty('--abawi-preview-table-border', theme.preview.tableBorder);
      
      // Classe CSS sur le body
      document.body.className = `abawi-theme-${this.currentTheme}`;
    }
  }

  getCurrentTheme() {
    return THEMES[this.currentTheme];
  }

  getThemeColors() {
    return this.getCurrentTheme();
  }

  getPreviewColors() {
    return this.getCurrentTheme().preview;
  }

  // Générer les styles CSS pour l'aperçu des documents
  generatePreviewStyles() {
    const theme = this.getCurrentTheme();
    const preview = theme.preview;
    
    return `
      .abawi-preview-container {
        background: ${preview.background} !important;
        color: ${preview.text} !important;
      }
      
      .abawi-preview-text {
        color: ${preview.text} !important;
      }
      
      .abawi-preview-heading {
        color: ${preview.heading} !important;
        font-weight: 600;
      }
      
      .abawi-preview-subheading {
        color: ${preview.subheading} !important;
        font-weight: 500;
      }
      
      .abawi-preview-link {
        color: ${preview.link} !important;
        text-decoration: underline;
      }
      
      .abawi-preview-code {
        background: ${preview.code} !important;
        color: ${preview.codeText} !important;
        padding: 2px 6px;
        border-radius: 4px;
        font-family: 'Courier New', monospace;
      }
      
      .abawi-preview-quote {
        color: ${preview.quote} !important;
        font-style: italic;
        border-left: 4px solid ${preview.border};
        padding-left: 16px;
        margin: 16px 0;
      }
      
      .abawi-preview-table {
        background: ${preview.table} !important;
        border: 1px solid ${preview.tableBorder} !important;
        border-collapse: collapse;
      }
      
      .abawi-preview-table th,
      .abawi-preview-table td {
        border: 1px solid ${preview.tableBorder} !important;
        padding: 8px 12px;
        color: ${preview.text} !important;
      }
      
      .abawi-preview-table th {
        background: ${preview.code} !important;
        font-weight: 600;
      }
      
      /* Étalonage pour éviter les conflits */
      .abawi-preview-container * {
        color: inherit !important;
      }
      
      .abawi-preview-container h1,
      .abawi-preview-container h2,
      .abawi-preview-container h3,
      .abawi-preview-container h4,
      .abawi-preview-container h5,
      .abawi-preview-container h6 {
        color: ${preview.heading} !important;
      }
      
      .abawi-preview-container p {
        color: ${preview.text} !important;
      }
      
      .abawi-preview-container strong,
      .abawi-preview-container b {
        color: ${preview.heading} !important;
        font-weight: 600;
      }
      
      .abawi-preview-container em,
      .abawi-preview-container i {
        color: ${preview.text} !important;
        font-style: italic;
      }
      
      .abawi-preview-container a {
        color: ${preview.link} !important;
      }
      
      .abawi-preview-container ul,
      .abawi-preview-container ol {
        color: ${preview.text} !important;
      }
      
      .abawi-preview-container li {
        color: ${preview.text} !important;
      }
      
      .abawi-preview-container blockquote {
        color: ${preview.quote} !important;
      }
      
      .abawi-preview-container code {
        background: ${preview.code} !important;
        color: ${preview.codeText} !important;
      }
      
      .abawi-preview-container pre {
        background: ${preview.code} !important;
        color: ${preview.codeText} !important;
        padding: 16px;
        border-radius: 8px;
        overflow-x: auto;
      }
      
      .abawi-preview-container pre code {
        background: transparent !important;
        padding: 0 !important;
      }
    `;
  }

  // Vérifier le contraste entre deux couleurs
  checkContrast(color1, color2) {
    // Simple vérification de contraste (pourrait être améliorée avec WCAG)
    const getLuminance = (color) => {
      const hex = color.replace('#', '');
      const r = parseInt(hex.substr(0, 2), 16) / 255;
      const g = parseInt(hex.substr(2, 2), 16) / 255;
      const b = parseInt(hex.substr(4, 2), 16) / 255;
      
      return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    };
    
    const lum1 = getLuminance(color1);
    const lum2 = getLuminance(color2);
    
    return (Math.max(lum1, lum2) + 0.05) / (Math.min(lum1, lum2) + 0.05);
  }

  // Obtenir la couleur de texte appropriée pour un fond
  getTextColor(background) {
    const whiteContrast = this.checkContrast(background, '#ffffff');
    const blackContrast = this.checkContrast(background, '#000000');
    
    return whiteContrast > blackContrast ? '#ffffff' : '#000000';
  }

  // Ajouter un écouteur de changement de thème
  addListener(callback) {
    this.listeners.push(callback);
  }

  // Retirer un écouteur
  removeListener(callback) {
    this.listeners = this.listeners.filter(listener => listener !== callback);
  }

  // Notifier tous les écouteurs
  notifyListeners() {
    this.listeners.forEach(callback => callback(this.currentTheme, this.getCurrentTheme()));
  }

  // Basculer entre les thèmes
  toggle() {
    const themes = Object.keys(THEMES);
    const currentIndex = themes.indexOf(this.currentTheme);
    const nextIndex = (currentIndex + 1) % themes.length;
    this.setTheme(themes[nextIndex]);
  }

  // Obtenir tous les thèmes disponibles
  getAvailableThemes() {
    return Object.keys(THEMES).map(key => ({
      key,
      name: THEMES[key].name,
      colors: THEMES[key]
    }));
  }
}

// Instance globale
const themeManager = new ThemeManager();

// Export
export { ThemeManager, THEMES, themeManager };
export default themeManager;

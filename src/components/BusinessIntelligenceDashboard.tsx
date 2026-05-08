/**
 * ABAWI Business Intelligence Dashboard
 * Dashboard interactif pour l'analyse financière et business avancée
 */

import React, { useState, useEffect } from 'react';
import { FinancialAnalyzer, CreditScoringEngine, BusinessValuationEngine } from '../lib/businessIntelligence';
import themeManager from '../lib/themeManager';

interface FinancialData {
  ca: number[];
  charges_variables: number[];
  charges_fixes: number[];
  amortissements: number[];
  charges_financieres: number[];
  impots: number[];
  stocks: number;
  creances_clients: number;
  tresorerie_actif: number;
  autres_actifs: number;
  capital_social: number;
  reserves: number;
  resultat: number;
  dettes_lt: number;
  dettes_ct: number;
  dettes_fournisseurs: number;
  tresorerie?: {
    encaissements: number[];
    decaissements: number[];
    tresorerie_initiale: number;
  };
}

interface CompanyInfo {
  nom: string;
  secteur: string;
  annee_creation: number;
  effectif: number;
  pays: string;
}

export default function BusinessIntelligenceDashboard() {
  const [currentTheme, setCurrentTheme] = useState(themeManager.currentTheme);
  const [activeTab, setActiveTab] = useState('ratios');
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo>({
    nom: '',
    secteur: 'Commerce de détail',
    annee_creation: new Date().getFullYear() - 3,
    effectif: 10,
    pays: 'Sénégal'
  });
  
  const [financialData, setFinancialData] = useState<FinancialData>({
    ca: [50000000, 60000000, 75000000],
    charges_variables: [30000000, 36000000, 45000000],
    charges_fixes: [10000000, 12000000, 15000000],
    amortissements: [2000000, 2400000, 3000000],
    charges_financieres: [1000000, 1200000, 1500000],
    impots: [1400000, 1680000, 2100000],
    stocks: 15000000,
    creances_clients: 12000000,
    tresorerie_actif: 8000000,
    autres_actifs: 5000000,
    capital_social: 20000000,
    reserves: 5000000,
    resultat: 3000000,
    dettes_lt: 15000000,
    dettes_ct: 8000000,
    dettes_fournisseurs: 10000000,
    tresorerie: {
      encaissements: Array(12).fill(6250000),
      decaissements: Array(12).fill(5500000),
      tresorerie_initiale: 8000000
    }
  });

  const [analysis, setAnalysis] = useState<any>(null);
  const [creditScore, setCreditScore] = useState<any>(null);
  const [valuation, setValuation] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const themeColors = themeManager.getCurrentTheme();

  useEffect(() => {
    themeManager.addListener((themeName: string, themeColors: any) => {
      setCurrentTheme(themeName);
    });
    return () => themeManager.removeListener(() => {});
  }, []);

  useEffect(() => {
    runAnalysis();
  }, [financialData, companyInfo]);

  const runAnalysis = async () => {
    setLoading(true);
    try {
      const analyzer = new FinancialAnalyzer();
      const scoringEngine = new CreditScoringEngine();
      const valuationEngine = new BusinessValuationEngine();

      // Analyse des ratios
      const ratioAnalysis = analyzer.analyzeRatios(financialData, companyInfo.secteur);
      setAnalysis(ratioAnalysis);

      // Scoring de crédit
      const creditAnalysis = scoringEngine.calculateCreditScore(
        financialData, 
        companyInfo.secteur, 
        75 // Score de gestion par défaut
      );
      setCreditScore(creditAnalysis);

      // Valorisation
      const valuationAnalysis = valuationEngine.calculateValuation(
        financialData, 
        companyInfo.secteur,
        0.15, // 15% croissance
        0.12  // 12% taux d'actualisation
      );
      setValuation(valuationAnalysis);
    } catch (error) {
      console.error('Erreur lors de l\'analyse:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatPercent = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return '#22c55e';
    if (score >= 60) return '#3b82f6';
    if (score >= 40) return '#f59e0b';
    return '#ef4444';
  };

  const getGradeColor = (grade: string) => {
    if (['AAA', 'AA', 'A'].includes(grade)) return '#22c55e';
    if (['BBB', 'BB', 'B'].includes(grade)) return '#3b82f6';
    if (['CCC', 'CC', 'C'].includes(grade)) return '#f59e0b';
    return '#ef4444';
  };

  const renderRatiosTab = () => {
    if (!analysis) return null;

    return (
      <div style={{ display: 'grid', gap: '20px' }}>
        {/* Score Global */}
        <div style={{
          background: themeColors.card,
          border: `1px solid ${themeColors.border}`,
          borderRadius: '12px',
          padding: '20px'
        }}>
          <h3 style={{ margin: '0 0 16px 0', color: themeColors.text }}>
            Score de Santé Financière
          </h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div style={{
              width: '120px',
              height: '120px',
              borderRadius: '50%',
              background: `conic-gradient(${getScoreColor(analysis.score_global)} ${analysis.score_global}%, ${themeColors.code} ${analysis.score_global}%)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative'
            }}>
              <div style={{
                width: '100px',
                height: '100px',
                borderRadius: '50%',
                background: themeColors.card,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'column'
              }}>
                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: themeColors.text }}>
                  {analysis.score_global}
                </div>
                <div style={{ fontSize: '0.8rem', color: themeColors.textSecondary }}>
                  / 100
                </div>
              </div>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '1.1rem', color: themeColors.text, marginBottom: '8px' }}>
                Performance {analysis.score_global >= 80 ? 'Excellente' : analysis.score_global >= 60 ? 'Bonne' : analysis.score_global >= 40 ? 'Moyenne' : 'Faible'}
              </div>
              <div style={{ fontSize: '0.9rem', color: themeColors.textSecondary, lineHeight: '1.5' }}>
                Basé sur l'analyse de {Object.keys(analysis.analysis).length} ratios financiers comparés aux benchmarks sectoriels
              </div>
            </div>
          </div>
        </div>

        {/* Ratios Détaillés */}
        <div style={{
          background: themeColors.card,
          border: `1px solid ${themeColors.border}`,
          borderRadius: '12px',
          padding: '20px'
        }}>
          <h3 style={{ margin: '0 0 16px 0', color: themeColors.text }}>
            Analyse des Ratios Financiers
          </h3>
          <div style={{ display: 'grid', gap: '12px' }}>
            {Object.entries(analysis.analysis).map(([key, data]: [string, any]) => (
              <div key={key} style={{
                background: themeColors.background,
                border: `1px solid ${themeColors.border}`,
                borderRadius: '8px',
                padding: '16px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <div style={{ fontWeight: '600', color: themeColors.text, textTransform: 'capitalize' }}>
                    {key.replace(/_/g, ' ')}
                  </div>
                  <div style={{
                    padding: '4px 12px',
                    borderRadius: '20px',
                    fontSize: '0.8rem',
                    fontWeight: '600',
                    background: data.performance === 'excellent' ? '#22c55e20' : 
                               data.performance === 'bon' ? '#3b82f620' : 
                               data.performance === 'moyen' ? '#f59e0b20' : '#ef444420',
                    color: data.performance === 'excellent' ? '#22c55e' : 
                           data.performance === 'bon' ? '#3b82f6' : 
                           data.performance === 'moyen' ? '#f59e0b' : '#ef4444'
                  }}>
                    {data.performance.toUpperCase()}
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                  <div>
                    <div style={{ fontSize: '0.8rem', color: themeColors.textSecondary, marginBottom: '4px' }}>
                      Valeur actuelle
                    </div>
                    <div style={{ fontSize: '1.2rem', fontWeight: '600', color: themeColors.text }}>
                      {typeof data.valeur === 'number' ? formatPercent(data.valeur) : data.valeur}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.8rem', color: themeColors.textSecondary, marginBottom: '4px' }}>
                      Benchmark secteur
                    </div>
                    <div style={{ fontSize: '1rem', color: themeColors.text }}>
                      {typeof data.benchmark?.avg === 'number' ? formatPercent(data.benchmark.avg) : 'N/A'}
                    </div>
                  </div>
                </div>
                {data.recommandation && (
                  <div style={{
                    marginTop: '8px',
                    padding: '8px 12px',
                    background: themeColors.code,
                    borderRadius: '6px',
                    fontSize: '0.85rem',
                    color: themeColors.codeText
                  }}>
                    <strong>Recommandation:</strong> {data.recommandation}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Alertes */}
        {analysis.alertes && analysis.alertes.length > 0 && (
          <div style={{
            background: themeColors.card,
            border: `1px solid ${themeColors.border}`,
            borderRadius: '12px',
            padding: '20px'
          }}>
            <h3 style={{ margin: '0 0 16px 0', color: themeColors.text }}>
              Points de Vigilance
            </h3>
            <div style={{ display: 'grid', gap: '12px' }}>
              {analysis.alertes.map((alerte: any, index: number) => (
                <div key={index} style={{
                  background: alerte.type === 'critique' ? '#ef444420' : '#f59e0b20',
                  border: `1px solid ${alerte.type === 'critique' ? '#ef4444' : '#f59e0b'}`,
                  borderRadius: '8px',
                  padding: '12px'
                }}>
                  <div style={{ fontWeight: '600', color: themeColors.text, marginBottom: '4px' }}>
                    {alerte.ratio.replace(/_/g, ' ').toUpperCase()}
                  </div>
                  <div style={{ fontSize: '0.9rem', color: themeColors.textSecondary, marginBottom: '8px' }}>
                    {alerte.message}
                  </div>
                  <div style={{ fontSize: '0.85rem', color: themeColors.text }}>
                    <strong>Action:</strong> {alerte.recommandation}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderCreditTab = () => {
    if (!creditScore) return null;

    return (
      <div style={{ display: 'grid', gap: '20px' }}>
        {/* Score de Crédit */}
        <div style={{
          background: themeColors.card,
          border: `1px solid ${themeColors.border}`,
          borderRadius: '12px',
          padding: '20px'
        }}>
          <h3 style={{ margin: '0 0 16px 0', color: themeColors.text }}>
            Évaluation de Crédit
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{
                fontSize: '3rem',
                fontWeight: 'bold',
                color: getScoreColor(creditScore.score),
                marginBottom: '8px'
              }}>
                {creditScore.score}
              </div>
              <div style={{ fontSize: '1.2rem', color: themeColors.text, marginBottom: '4px' }}>
                {creditScore.grade}
              </div>
              <div style={{ fontSize: '0.9rem', color: themeColors.textSecondary }}>
                {creditScore.rating}
              </div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '0.9rem', color: themeColors.textSecondary, marginBottom: '8px' }}>
                Probabilité de Défaut
              </div>
              <div style={{
                fontSize: '1.5rem',
                fontWeight: '600',
                color: creditScore.probability_default < 0.05 ? '#22c55e' : 
                       creditScore.probability_default < 0.15 ? '#f59e0b' : '#ef4444'
              }}>
                {formatPercent(creditScore.probability_default * 100)}
              </div>
            </div>
          </div>
        </div>

        {/* Recommandations de Crédit */}
        <div style={{
          background: themeColors.card,
          border: `1px solid ${themeColors.border}`,
          borderRadius: '12px',
          padding: '20px'
        }}>
          <h3 style={{ margin: '0 0 16px 0', color: themeColors.text }}>
            Recommandations de Financement
          </h3>
          <div style={{ display: 'grid', gap: '12px' }}>
            {creditScore.recommendations.map((rec: string, index: number) => (
              <div key={index} style={{
                background: themeColors.background,
                border: `1px solid ${themeColors.border}`,
                borderRadius: '8px',
                padding: '12px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px'
              }}>
                <div style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  background: themeColors.accent,
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.8rem',
                  fontWeight: 'bold',
                  flexShrink: 0
                }}>
                  {index + 1}
                </div>
                <div style={{ fontSize: '0.9rem', color: themeColors.text, lineHeight: '1.5' }}>
                  {rec}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderValuationTab = () => {
    if (!valuation) return null;

    return (
      <div style={{ display: 'grid', gap: '20px' }}>
        {/* Valeur Estimée */}
        <div style={{
          background: themeColors.card,
          border: `1px solid ${themeColors.border}`,
          borderRadius: '12px',
          padding: '20px'
        }}>
          <h3 style={{ margin: '0 0 16px 0', color: themeColors.text }}>
            Valorisation d'Entreprise
          </h3>
          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <div style={{
              fontSize: '2.5rem',
              fontWeight: 'bold',
              color: themeColors.accent,
              marginBottom: '8px'
            }}>
              {formatCurrency(valuation.valeur_estimee)}
            </div>
            <div style={{ fontSize: '1rem', color: themeColors.textSecondary }}>
              Valeur estimée de l'entreprise
            </div>
          </div>
          
          {/* Méthodes de Valorisation */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
            <div style={{
              background: themeColors.background,
              border: `1px solid ${themeColors.border}`,
              borderRadius: '8px',
              padding: '16px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '0.9rem', color: themeColors.textSecondary, marginBottom: '8px' }}>
                DCF (Discounted Cash Flow)
              </div>
              <div style={{ fontSize: '1.3rem', fontWeight: '600', color: themeColors.text }}>
                {formatCurrency(valuation.methodes.dcf)}
              </div>
              <div style={{ fontSize: '0.8rem', color: themeColors.textSecondary, marginTop: '4px' }}>
                Poids: {formatPercent(valuation.poids.dcf * 100)}
              </div>
            </div>
            <div style={{
              background: themeColors.background,
              border: `1px solid ${themeColors.border}`,
              borderRadius: '8px',
              padding: '16px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '0.9rem', color: themeColors.textSecondary, marginBottom: '8px' }}>
                Multiples Sectoriels
              </div>
              <div style={{ fontSize: '1.3rem', fontWeight: '600', color: themeColors.text }}>
                {formatCurrency(valuation.methodes.multiples)}
              </div>
              <div style={{ fontSize: '0.8rem', color: themeColors.textSecondary, marginTop: '4px' }}>
                Poids: {formatPercent(valuation.poids.multiples * 100)}
              </div>
            </div>
            <div style={{
              background: themeColors.background,
              border: `1px solid ${themeColors.border}`,
              borderRadius: '8px',
              padding: '16px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '0.9rem', color: themeColors.textSecondary, marginBottom: '8px' }}>
                Actif Net Comptable
              </div>
              <div style={{ fontSize: '1.3rem', fontWeight: '600', color: themeColors.text }}>
                {formatCurrency(valuation.methodes.assets)}
              </div>
              <div style={{ fontSize: '0.8rem', color: themeColors.textSecondary, marginTop: '4px' }}>
                Poids: {formatPercent(valuation.poids.assets * 100)}
              </div>
            </div>
          </div>
        </div>

        {/* Analyse de Sensibilité */}
        <div style={{
          background: themeColors.card,
          border: `1px solid ${themeColors.border}`,
          borderRadius: '12px',
          padding: '20px'
        }}>
          <h3 style={{ margin: '0 0 16px 0', color: themeColors.text }}>
            Analyse de Sensibilité
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
            <div style={{
              background: '#ef444420',
              border: '1px solid #ef4444',
              borderRadius: '8px',
              padding: '16px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '0.9rem', color: themeColors.textSecondary, marginBottom: '8px' }}>
                Scénario Pessimiste
              </div>
              <div style={{ fontSize: '1.2rem', fontWeight: '600', color: themeColors.text }}>
                {formatCurrency(valuation.analyse_sensibilite.scenarios.pessimiste)}
              </div>
            </div>
            <div style={{
              background: themeColors.background,
              border: `1px solid ${themeColors.border}`,
              borderRadius: '8px',
              padding: '16px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '0.9rem', color: themeColors.textSecondary, marginBottom: '8px' }}>
                Scénario Base
              </div>
              <div style={{ fontSize: '1.2rem', fontWeight: '600', color: themeColors.text }}>
                {formatCurrency(valuation.analyse_sensibilite.scenarios.base)}
              </div>
            </div>
            <div style={{
              background: '#22c55e20',
              border: '1px solid #22c55e',
              borderRadius: '8px',
              padding: '16px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '0.9rem', color: themeColors.textSecondary, marginBottom: '8px' }}>
                Scénario Optimiste
              </div>
              <div style={{ fontSize: '1.2rem', fontWeight: '600', color: themeColors.text }}>
                {formatCurrency(valuation.analyse_sensibilite.scenarios.optimiste)}
              </div>
            </div>
          </div>
          <div style={{
            marginTop: '16px',
            padding: '12px',
            background: themeColors.code,
            borderRadius: '8px',
            textAlign: 'center',
            fontSize: '0.9rem',
            color: themeColors.codeText
          }}>
            Variance: {valuation.analyse_sensibilite.variance}% entre scénarios pessimiste et optimiste
          </div>
        </div>

        {/* Recommandations */}
        {valuation.recommandations && valuation.recommandations.length > 0 && (
          <div style={{
            background: themeColors.card,
            border: `1px solid ${themeColors.border}`,
            borderRadius: '12px',
            padding: '20px'
          }}>
            <h3 style={{ margin: '0 0 16px 0', color: themeColors.text }}>
              Recommandations Stratégiques
            </h3>
            <div style={{ display: 'grid', gap: '12px' }}>
              {valuation.recommandations.map((rec: string, index: number) => (
                <div key={index} style={{
                  background: themeColors.background,
                  border: `1px solid ${themeColors.border}`,
                  borderRadius: '8px',
                  padding: '12px',
                  fontSize: '0.9rem',
                  color: themeColors.text,
                  lineHeight: '1.5'
                }}>
                  {rec}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={`abawi-theme-${currentTheme}`} style={{
      minHeight: '100vh',
      background: themeColors.background,
      color: themeColors.text,
      padding: '20px'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{
          background: themeColors.surface,
          border: `1px solid ${themeColors.border}`,
          borderRadius: '12px',
          padding: '20px',
          marginBottom: '20px'
        }}>
          <h1 style={{ margin: '0 0 8px 0', fontSize: '1.8rem', color: themeColors.text }}>
            Business Intelligence Dashboard
          </h1>
          <p style={{ margin: 0, color: themeColors.textSecondary }}>
            Analyse financière avancée avec benchmarks sectoriels et intelligence artificielle
          </p>
        </div>

        {/* Company Info */}
        <div style={{
          background: themeColors.surface,
          border: `1px solid ${themeColors.border}`,
          borderRadius: '12px',
          padding: '20px',
          marginBottom: '20px'
        }}>
          <h3 style={{ margin: '0 0 16px 0', color: themeColors.text }}>
            Informations Entreprise
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.9rem', color: themeColors.textSecondary, marginBottom: '4px' }}>
                Nom de l'entreprise
              </label>
              <input
                type="text"
                value={companyInfo.nom}
                onChange={(e) => setCompanyInfo({...companyInfo, nom: e.target.value})}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: `1px solid ${themeColors.border}`,
                  borderRadius: '6px',
                  background: themeColors.background,
                  color: themeColors.text
                }}
                placeholder="Nom de l'entreprise"
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.9rem', color: themeColors.textSecondary, marginBottom: '4px' }}>
                Secteur d'activité
              </label>
              <select
                value={companyInfo.secteur}
                onChange={(e) => setCompanyInfo({...companyInfo, secteur: e.target.value})}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: `1px solid ${themeColors.border}`,
                  borderRadius: '6px',
                  background: themeColors.background,
                  color: themeColors.text
                }}
              >
                <option value="Commerce de détail">Commerce de détail</option>
                <option value="Services B2B">Services B2B</option>
                <option value="Industrie">Industrie</option>
                <option value="Technologie">Technologie</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.9rem', color: themeColors.textSecondary, marginBottom: '4px' }}>
                Effectif
              </label>
              <input
                type="number"
                value={companyInfo.effectif}
                onChange={(e) => setCompanyInfo({...companyInfo, effectif: parseInt(e.target.value) || 0})}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: `1px solid ${themeColors.border}`,
                  borderRadius: '6px',
                  background: themeColors.background,
                  color: themeColors.text
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.9rem', color: themeColors.textSecondary, marginBottom: '4px' }}>
                Pays
              </label>
              <input
                type="text"
                value={companyInfo.pays}
                onChange={(e) => setCompanyInfo({...companyInfo, pays: e.target.value})}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: `1px solid ${themeColors.border}`,
                  borderRadius: '6px',
                  background: themeColors.background,
                  color: themeColors.text
                }}
              />
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{
          background: themeColors.surface,
          border: `1px solid ${themeColors.border}`,
          borderRadius: '12px',
          padding: '8px',
          marginBottom: '20px',
          display: 'flex',
          gap: '8px'
        }}>
          {[
            { id: 'ratios', label: 'Analyse des Ratios', icon: '??' },
            { id: 'credit', label: 'Scoring de Crédit', icon: '??' },
            { id: 'valuation', label: 'Valorisation', icon: '??' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                flex: 1,
                padding: '12px 16px',
                background: activeTab === tab.id ? themeColors.accent : 'transparent',
                color: activeTab === tab.id ? '#ffffff' : themeColors.text,
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '0.9rem',
                fontWeight: activeTab === tab.id ? '600' : '400',
                transition: 'all 0.3s ease'
              }}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={{
          background: themeColors.surface,
          border: `1px solid ${themeColors.border}`,
          borderRadius: '12px',
          padding: '20px',
          minHeight: '400px'
        }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: themeColors.textSecondary }}>
              Analyse en cours...
            </div>
          ) : (
            <>
              {activeTab === 'ratios' && renderRatiosTab()}
              {activeTab === 'credit' && renderCreditTab()}
              {activeTab === 'valuation' && renderValuationTab()}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

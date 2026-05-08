/**
 * ABAWI Business Intelligence Engine
 * Système d'intelligence business avancé pour les outils financiers et business
 */

// Analyse avancée des données financières
export class FinancialAnalyzer {
  constructor() {
    this.industryBenchmarks = this.loadIndustryBenchmarks();
    this.riskModels = this.loadRiskModels();
  }

  // Benchmarks sectoriels pour l'Afrique de l'Ouest
  loadIndustryBenchmarks() {
    return {
      'Commerce de détail': {
        marge_brute: { min: 15, avg: 25, max: 35 },
        roe: { min: 8, avg: 15, max: 25 },
        ratio_endettement: { min: 0.3, avg: 0.6, max: 1.2 },
        delai_paiement_clients: { min: 15, avg: 30, max: 60 },
        delai_paiement_fournisseurs: { min: 30, avg: 45, max: 90 }
      },
      'Services B2B': {
        marge_brute: { min: 40, avg: 55, max: 70 },
        roe: { min: 12, avg: 20, max: 35 },
        ratio_endettement: { min: 0.2, avg: 0.4, max: 0.8 },
        delai_paiement_clients: { min: 30, avg: 45, max: 90 },
        delai_paiement_fournisseurs: { min: 30, avg: 30, max: 60 }
      },
      'Industrie': {
        marge_brute: { min: 20, avg: 30, max: 45 },
        roe: { min: 6, avg: 12, max: 20 },
        ratio_endettement: { min: 0.4, avg: 0.8, max: 1.5 },
        delai_paiement_clients: { min: 45, avg: 60, max: 120 },
        delai_paiement_fournisseurs: { min: 45, avg: 60, max: 120 }
      },
      'Technologie': {
        marge_brute: { min: 50, avg: 70, max: 85 },
        roe: { min: 15, avg: 25, max: 40 },
        ratio_endettement: { min: 0.1, avg: 0.3, max: 0.6 },
        delai_paiement_clients: { min: 0, avg: 15, max: 45 },
        delai_paiement_fournisseurs: { min: 30, avg: 45, max: 90 }
      }
    };
  }

  // Modèles de risque avancés
  loadRiskModels() {
    return {
      credit_score: {
        weight_ratios: 0.4,
        weight_cashflow: 0.3,
        weight_industry: 0.2,
        weight_management: 0.1
      },
      default_probability: {
        base_rate: 0.02, // 2% base default rate
        leverage_multiplier: 1.5,
        liquidity_multiplier: 2.0,
        profitability_multiplier: 1.8
      }
    };
  }

  // Analyse complète des ratios financiers
  analyzeRatios(financialData, industry) {
    const benchmark = this.industryBenchmarks[industry] || this.industryBenchmarks['Commerce de détail'];
    
    const ratios = {
      // Ratios de rentabilité
      marge_brute: this.calculateMargeBrute(financialData),
      marge_nette: this.calculateMargeNette(financialData),
      roe: this.calculateROE(financialData),
      roa: this.calculateROA(financialData),
      ebitda_margin: this.calculateEBITDAMargin(financialData),
      
      // Ratios de structure
      ratio_endettement: this.calculateRatioEndettement(financialData),
      ratio_solvabilite: this.calculateRatioSolvabilite(financialData),
      ratio_liquidite: this.calculateRatioLiquidite(financialData),
      
      // Ratios d'efficacité
      rotation_stocks: this.calculateRotationStocks(financialData),
      delai_paiement_clients: this.calculateDelaiPaiementClients(financialData),
      delai_paiement_fournisseurs: this.calculateDelaiPaiementFournisseurs(financialData),
      
      // Ratios de croissance
      croissance_ca: this.calculateCroissanceCA(financialData),
      croissance_resultat: this.calculateCroissanceResultat(financialData)
    };

    // Analyse comparative avec benchmarks
    const analysis = {};
    for (const [key, value] of Object.entries(ratios)) {
      const bench = benchmark[key];
      if (bench) {
        analysis[key] = {
          valeur: value,
          benchmark: bench,
          performance: this.evaluatePerformance(value, bench),
          recommandation: this.getRatioRecommendation(key, value, bench)
        };
      }
    }

    return {
      ratios,
      analysis,
      score_global: this.calculateGlobalScore(analysis),
      alertes: this.detectAlertes(analysis)
    };
  }

  calculateMargeBrute(data) {
    const ca = data.ca?.[data.ca?.length - 1] || 0;
    const charges_variables = data.charges_variables?.[data.charges_variables?.length - 1] || 0;
    return ca > 0 ? ((ca - charges_variables) / ca * 100) : 0;
  }

  calculateMargeNette(data) {
    const ca = data.ca?.[data.ca?.length - 1] || 0;
    const resultat_net = this.calculateResultatNet(data);
    return ca > 0 ? (resultat_net / ca * 100) : 0;
  }

  calculateROE(data) {
    const resultat_net = this.calculateResultatNet(data);
    const capitaux_propres = this.calculateCapitauxPropres(data);
    return capitaux_propres > 0 ? (resultat_net / capitaux_propres * 100) : 0;
  }

  calculateROA(data) {
    const resultat_net = this.calculateResultatNet(data);
    const actif_total = this.calculateActifTotal(data);
    return actif_total > 0 ? (resultat_net / actif_total * 100) : 0;
  }

  calculateEBITDAMargin(data) {
    const ca = data.ca?.[data.ca?.length - 1] || 0;
    const ebitda = this.calculateEBITDA(data);
    return ca > 0 ? (ebitda / ca * 100) : 0;
  }

  calculateRatioEndettement(data) {
    const dettes_totales = this.calculateDettesTotales(data);
    const capitaux_propres = this.calculateCapitauxPropres(data);
    return capitaux_propres > 0 ? (dettes_totales / capitaux_propres) : 0;
  }

  calculateRatioSolvabilite(data) {
    const actif_total = this.calculateActifTotal(data);
    const dettes_totales = this.calculateDettesTotales(data);
    return actif_total > 0 ? ((actif_total - dettes_totales) / actif_total * 100) : 0;
  }

  calculateRatioLiquidite(data) {
    const actif_courant = this.calculateActifCourant(data);
    const dettes_courantes = this.calculateDettesCourantes(data);
    return dettes_courantes > 0 ? (actif_courant / dettes_courantes) : 0;
  }

  calculateRotationStocks(data) {
    const ca = data.ca?.[data.ca?.length - 1] || 0;
    const stocks = data.stocks || 0;
    return stocks > 0 ? (ca / stocks) : 0;
  }

  calculateDelaiPaiementClients(data) {
    const ca = data.ca?.[data.ca?.length - 1] || 0;
    const creances_clients = data.creances_clients || 0;
    return ca > 0 ? (creances_clients / ca * 365) : 0;
  }

  calculateDelaiPaiementFournisseurs(data) {
    const charges_variables = data.charges_variables?.[data.charges_variables?.length - 1] || 0;
    const dettes_fournisseurs = data.dettes_fournisseurs || 0;
    return charges_variables > 0 ? (dettes_fournisseurs / charges_variables * 365) : 0;
  }

  calculateCroissanceCA(data) {
    const ca = data.ca || [];
    if (ca.length < 2) return 0;
    const current = ca[ca.length - 1];
    const previous = ca[ca.length - 2];
    return previous > 0 ? ((current - previous) / previous * 100) : 0;
  }

  calculateCroissanceResultat(data) {
    const resultats = this.calculateHistoricalResultats(data);
    if (resultats.length < 2) return 0;
    const current = resultats[resultats.length - 1];
    const previous = resultats[resultats.length - 2];
    return previous > 0 ? ((current - previous) / previous * 100) : 0;
  }

  // Fonctions utilitaires de calcul
  calculateResultatNet(data) {
    const ca = data.ca?.[data.ca?.length - 1] || 0;
    const charges_variables = data.charges_variables?.[data.charges_variables?.length - 1] || 0;
    const charges_fixes = data.charges_fixes?.[data.charges_fixes?.length - 1] || 0;
    const amortissements = data.amortissements?.[data.amortissements?.length - 1] || 0;
    const charges_financieres = data.charges_financieres?.[data.charges_financieres?.length - 1] || 0;
    const impots = data.impots?.[data.impots?.length - 1] || 0;
    
    return ca - charges_variables - charges_fixes - amortissements - charges_financieres - impots;
  }

  calculateEBITDA(data) {
    const ca = data.ca?.[data.ca?.length - 1] || 0;
    const charges_variables = data.charges_variables?.[data.charges_variables?.length - 1] || 0;
    const charges_fixes = data.charges_fixes?.[data.charges_fixes?.length - 1] || 0;
    const amortissements = data.amortissements?.[data.amortissements?.length - 1] || 0;
    
    return ca - charges_variables - charges_fixes - amortissements;
  }

  calculateCapitauxPropres(data) {
    return (data.capital_social || 0) + (data.reserves || 0) + (data.resultat || 0);
  }

  calculateActifTotal(data) {
    return (data.immobilisations_nettes || 0) + (data.stocks || 0) + 
           (data.creances_clients || 0) + (data.tresorerie_actif || 0) + 
           (data.autres_actifs || 0);
  }

  calculateDettesTotales(data) {
    return (data.dettes_lt || 0) + (data.dettes_ct || 0) + (data.dettes_fournisseurs || 0);
  }

  calculateActifCourant(data) {
    return (data.stocks || 0) + (data.creances_clients || 0) + (data.tresorerie_actif || 0);
  }

  calculateDettesCourantes(data) {
    return (data.dettes_ct || 0) + (data.dettes_fournisseurs || 0);
  }

  calculateHistoricalResultats(data) {
    const ca = data.ca || [];
    const charges_variables = data.charges_variables || [];
    const charges_fixes = data.charges_fixes || [];
    const amortissements = data.amortissements || [];
    const charges_financieres = data.charges_financieres || [];
    const impots = data.impots || [];
    
    return ca.map((ca_val, i) => {
      return ca_val - (charges_variables[i] || 0) - (charges_fixes[i] || 0) - 
             (amortissements[i] || 0) - (charges_financieres[i] || 0) - (impots[i] || 0);
    });
  }

  // Évaluation de la performance par rapport aux benchmarks
  evaluatePerformance(value, benchmark) {
    if (value >= benchmark.max) return 'excellent';
    if (value >= benchmark.avg) return 'bon';
    if (value >= benchmark.min) return 'moyen';
    return 'faible';
  }

  // Recommandations basées sur les ratios
  getRatioRecommendation(ratio, value, benchmark) {
    const recommendations = {
      marge_brute: {
        faible: 'Optimiser les coûts d\'approvisionnement et négocier de meilleurs prix avec les fournisseurs.',
        moyen: 'Améliorer l\'efficacité opérationnelle et réduire les gaspillages.',
        bon: 'Maintenir les standards actuels et surveiller la concurrence.',
        excellent: 'Explorer des opportunités d\'expansion avec des marges soutenues.'
      },
      roe: {
        faible: 'Améliorer la rentabilité et optimiser la structure des capitaux propres.',
        moyen: 'Renforcer la rentabilité et envisager un levier financier modéré.',
        bon: 'Maintenir la performance actuelle et optimiser l\'allocation du capital.',
        excellent: 'Considérer une distribution de dividendes ou réinvestissement stratégique.'
      },
      ratio_endettement: {
        excellent: 'Envisager un levier financier pour accélérer la croissance.',
        bon: 'Maintenir un niveau d\'endettement optimal.',
        moyen: 'Surveiller le niveau d\'endettement et renforcer les capitaux propres.',
        faible: 'Réduire l\'endettement et améliorer la structure financière.'
      }
    };
    
    const performance = this.evaluatePerformance(value, benchmark);
    return recommendations[ratio]?.[performance] || 'Analyser plus en détail ce ratio.';
  }

  // Calcul du score global de santé financière
  calculateGlobalScore(analysis) {
    const scores = Object.values(analysis).map(item => {
      const performance = item.performance;
      const score_map = { excellent: 4, bon: 3, moyen: 2, faible: 1 };
      return score_map[performance] || 1;
    });
    
    const average = scores.reduce((a, b) => a + b, 0) / scores.length;
    return Math.round(average * 25); // Score sur 100
  }

  // Détection d'alertes et points de vigilance
  detectAlertes(analysis) {
    const alertes = [];
    
    for (const [ratio, data] of Object.entries(analysis)) {
      if (data.performance === 'faible') {
        alertes.push({
          type: 'critique',
          ratio,
          message: `${ratio} est nettement inférieur aux benchmarks sectoriels.`,
          recommandation: data.recommandation
        });
      } else if (data.performance === 'moyen') {
        alertes.push({
          type: 'vigilance',
          ratio,
          message: `${ratio} nécessite une attention particulière.`,
          recommandation: data.recommandation
        });
      }
    }
    
    return alertes;
  }
}

// Système de scoring de crédit avancé
export class CreditScoringEngine {
  constructor() {
    this.weights = {
      financial_ratios: 0.4,
      cash_flow: 0.3,
      industry_risk: 0.2,
      management_quality: 0.1
    };
  }

  calculateCreditScore(financialData, industry, managementScore = 70) {
    const analyzer = new FinancialAnalyzer();
    const ratioAnalysis = analyzer.analyzeRatios(financialData, industry);
    
    // Score basé sur les ratios financiers
    const ratioScore = this.calculateRatioScore(ratioAnalysis);
    
    // Score basé sur les flux de trésorerie
    const cashFlowScore = this.calculateCashFlowScore(financialData);
    
    // Score basé sur le risque sectoriel
    const industryScore = this.calculateIndustryScore(industry);
    
    // Score de gestion (si fourni)
    const managementScoreNormalized = managementScore / 100;
    
    // Score final pondéré
    const finalScore = (
      ratioScore * this.weights.financial_ratios +
      cashFlowScore * this.weights.cash_flow +
      industryScore * this.weights.industry_risk +
      managementScoreNormalized * this.weights.management_quality
    ) * 100;
    
    return {
      score: Math.round(finalScore),
      grade: this.getGrade(finalScore),
      rating: this.getRating(finalScore),
      probability_default: this.calculateDefaultProbability(finalScore),
      recommendations: this.getCreditRecommendations(finalScore, ratioAnalysis)
    };
  }

  calculateRatioScore(ratioAnalysis) {
    const scores = Object.values(ratioAnalysis.analysis).map(item => {
      const performance_map = { excellent: 1.0, bon: 0.8, moyen: 0.6, faible: 0.3 };
      return performance_map[item.performance] || 0.5;
    });
    
    return scores.reduce((a, b) => a + b, 0) / scores.length;
  }

  calculateCashFlowScore(financialData) {
    const tresorerie = financialData.tresorerie || {};
    const encaissements = tresorerie.encaissements || [];
    const decaissements = tresorerie.decaissements || [];
    
    if (encaissements.length === 0) return 0.5;
    
    // Calculer la capacité à générer des flux positifs
    let positiveMonths = 0;
    for (let i = 0; i < Math.min(encaissements.length, 12); i++) {
      if (encaissements[i] > decaissements[i]) {
        positiveMonths++;
      }
    }
    
    return positiveMonths / Math.min(encaissements.length, 12);
  }

  calculateIndustryScore(industry) {
    const industryRisks = {
      'Technologie': 0.9,
      'Services B2B': 0.8,
      'Commerce de détail': 0.7,
      'Industrie': 0.6,
      'Construction': 0.5,
      'Restauration': 0.4
    };
    
    return industryRisks[industry] || 0.6;
  }

  getGrade(score) {
    if (score >= 90) return 'AAA';
    if (score >= 85) return 'AA';
    if (score >= 80) return 'A';
    if (score >= 75) return 'BBB';
    if (score >= 70) return 'BB';
    if (score >= 65) return 'B';
    if (score >= 60) return 'CCC';
    if (score >= 55) return 'CC';
    if (score >= 50) return 'C';
    return 'D';
  }

  getRating(score) {
    if (score >= 80) return 'Excellent';
    if (score >= 70) return 'Bon';
    if (score >= 60) return 'Moyen';
    if (score >= 50) return 'Faible';
    return 'Très faible';
  }

  calculateDefaultProbability(score) {
    // Probabilité de défaut basée sur le score (inverse)
    return Math.max(0.01, Math.min(0.5, (1 - score / 100) * 0.5));
  }

  getCreditRecommendations(score, ratioAnalysis) {
    const recommendations = [];
    
    if (score >= 80) {
      recommendations.push('Profil excellent - peut bénéficier de conditions de financement avantageuses');
      recommendations.push('Envisager une expansion avec un levier financier modéré');
    } else if (score >= 60) {
      recommendations.push('Profil satisfaisant - financement possible avec garanties modérées');
      recommendations.push('Améliorer les ratios de rentabilité pour optimiser les conditions');
    } else {
      recommendations.push('Profil à risque - nécessite des garanties solides');
      recommendations.push('Restructurer la dette avant tout nouvel emprunt');
      recommendations.push('Mettre en place un plan de redressement financier');
    }
    
    // Ajouter des recommandations spécifiques basées sur les ratios
    const criticalRatios = ratioAnalysis.alertes.filter(a => a.type === 'critique');
    if (criticalRatios.length > 0) {
      recommendations.push('Prioriser l\'amélioration des ratios critiques identifiés');
    }
    
    return recommendations;
  }
}

// Système de valorisation d'entreprise
export class BusinessValuationEngine {
  constructor() {
    this.multiples = this.loadIndustryMultiples();
  }

  loadIndustryMultiples() {
    return {
      'Technologie': {
        ebitda_multiple: { min: 8, avg: 12, max: 20 },
        revenue_multiple: { min: 3, avg: 5, max: 8 },
        pe_multiple: { min: 15, avg: 25, max: 40 }
      },
      'Services B2B': {
        ebitda_multiple: { min: 6, avg: 10, max: 15 },
        revenue_multiple: { min: 2, avg: 3.5, max: 6 },
        pe_multiple: { min: 12, avg: 18, max: 25 }
      },
      'Commerce de détail': {
        ebitda_multiple: { min: 4, avg: 6, max: 10 },
        revenue_multiple: { min: 0.5, avg: 1, max: 2 },
        pe_multiple: { min: 8, avg: 12, max: 20 }
      },
      'Industrie': {
        ebitda_multiple: { min: 5, avg: 8, max: 12 },
        revenue_multiple: { min: 1, avg: 1.5, max: 3 },
        pe_multiple: { min: 10, avg: 15, max: 25 }
      }
    };
  }

  calculateValuation(financialData, industry, growthRate = 0.1, discountRate = 0.12) {
    const methods = {
      dcf: this.calculateDCF(financialData, growthRate, discountRate),
      multiples: this.calculateMultiples(financialData, industry),
      assets: this.calculateAssetValue(financialData)
    };
    
    // Pondération des méthodes selon la maturité de l'entreprise
    const weights = this.getValuationWeights(financialData);
    
    const weightedValue = Object.keys(methods).reduce((acc, method) => {
      return acc + methods[method] * weights[method];
    }, 0);
    
    return {
      valeur_estimee: Math.round(weightedValue),
      methodes: methods,
      poids: weights,
      analyse_sensibilite: this.calculateSensitivityAnalysis(methods, growthRate, discountRate),
      recommandations: this.getValuationRecommendations(methods, industry)
    };
  }

  calculateDCF(financialData, growthRate, discountRate) {
    const analyzer = new FinancialAnalyzer();
    const ebitda = analyzer.calculateEBITDA(financialData);
    
    // Projections sur 5 ans
    let presentValue = 0;
    let terminalValue = 0;
    
    for (let year = 1; year <= 5; year++) {
      const projectedEBITDA = ebitda * Math.pow(1 + growthRate, year);
      const discountFactor = Math.pow(1 + discountRate, year);
      presentValue += projectedEBITDA / discountFactor;
    }
    
    // Valeur terminale (Gordon Growth Model)
    const terminalEBITDA = ebitda * Math.pow(1 + growthRate, 6);
    const terminalGrowthRate = 0.03; // 3% croissance perpétuelle
    terminalValue = (terminalEBITDA * (1 + terminalGrowthRate)) / (discountRate - terminalGrowthRate);
    presentValue += terminalValue / Math.pow(1 + discountRate, 6);
    
    return presentValue;
  }

  calculateMultiples(financialData, industry) {
    const multiples = this.multiples[industry] || this.multiples['Services B2B'];
    const analyzer = new FinancialAnalyzer();
    
    const ebitda = analyzer.calculateEBITDA(financialData);
    const ca = financialData.ca?.[financialData.ca?.length - 1] || 0;
    const resultat_net = analyzer.calculateResultatNet(financialData);
    
    const valuations = {
      ebitda: ebitda * multiples.ebitda_multiple.avg,
      revenue: ca * multiples.revenue_multiple.avg,
      pe: resultat_net * multiples.pe_multiple.avg
    };
    
    // Moyenne pondérée
    return Object.values(valuations).reduce((a, b) => a + b, 0) / 3;
  }

  calculateAssetValue(financialData) {
    const actif_total = new FinancialAnalyzer().calculateActifTotal(financialData);
    const dettes_totales = new FinancialAnalyzer().calculateDettesTotales(financialData);
    
    return actif_total - dettes_totales;
  }

  getValuationWeights(financialData) {
    const ca = financialData.ca?.[financialData.ca?.length - 1] || 0;
    
    // Plus l'entreprise est mature, plus on pondère le DCF
    if (ca > 1000000000) { // > 1B FCFA
      return { dcf: 0.5, multiples: 0.3, assets: 0.2 };
    } else if (ca > 100000000) { // > 100M FCFA
      return { dcf: 0.4, multiples: 0.4, assets: 0.2 };
    } else {
      return { dcf: 0.3, multiples: 0.4, assets: 0.3 };
    }
  }

  calculateSensitivityAnalysis(methods, baseGrowthRate, baseDiscountRate) {
    const scenarios = {
      pessimiste: this.calculateDCF(null, baseGrowthRate * 0.7, baseDiscountRate * 1.2),
      base: methods.dcf,
      optimiste: this.calculateDCF(null, baseGrowthRate * 1.3, baseDiscountRate * 0.9)
    };
    
    return {
      scenarios,
      variance: ((scenarios.optimiste - scenarios.pessimiste) / scenarios.base * 100).toFixed(1)
    };
  }

  getValuationRecommendations(methods, industry) {
    const recommendations = [];
    const avgValue = Object.values(methods).reduce((a, b) => a + b, 0) / 3;
    
    if (methods.dcf > methods.multiples * 1.2) {
      recommendations.push('Le DCF suggère une forte croissance - vérifier les hypothèses de taux de croissance');
    } else if (methods.dcf < methods.multiples * 0.8) {
      recommendations.push('Le DCF est plus conservateur - considérer des scénarios de croissance optimistes');
    }
    
    if (methods.assets > avgValue * 0.7) {
      recommendations.push('Valeur actuelle significative - considérer la vente d\'actifs non stratégiques');
    }
    
    return recommendations;
  }
}


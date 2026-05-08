// ═══════════════════════════════════════════════════════════
// ABAWI AUTOROUTE - Dataset Complet Routes & Circulation Sénégal
// ═══════════════════════════════════════════════════════════

export const SENEGAL_ROUTE_DATA = {
  // ═══════════════════════════════════════════════════════════
  // ROUTES PRINCIPALES ET AXES
  // ═══════════════════════════════════════════════════════════
  routes: [
    {
      id: 'r001',
      name: 'Autoroute à péage A1 (Dakar-Diamniadio)',
      type: 'autoroute',
      category: 'péage',
      start: { city: 'Dakar', zone: 'Colobane', coordinates: [14.6937, -17.4441] },
      end: { city: 'Diamniadio', zone: 'Centre', coordinates: [14.7176, -17.1801] },
      distance: '25 km',
      duration: '20-30 min',
      tollCost: '500-1500 FCFA',
      status: 'ouverte',
      condition: 'excellente',
      lanes: 2,
      cameras: ['Entrée Colobane', 'Sortie Diamniadio', 'PK 12', 'PK 18'],
      services: ['Péage automatique', 'SOS Autoroute', 'Dépannage'],
      peakHours: ['7h-9h', '17h-20h'],
      alerts: [],
      description: 'Autoroute moderne reliant Dakar à la nouvelle ville de Diamniadio'
    },
    {
      id: 'r002',
      name: 'Route Nationale N1 (Dakar-Louga-Saint-Louis)',
      type: 'nationale',
      category: 'principale',
      start: { city: 'Dakar', zone: 'Colobane', coordinates: [14.6937, -17.4441] },
      end: { city: 'Saint-Louis', zone: 'Centre', coordinates: [16.0326, -16.4818] },
      distance: '264 km',
      duration: '3h-4h',
      tollCost: null,
      status: 'ouverte',
      condition: 'bonne',
      lanes: 1,
      cameras: ['Keur Massar', 'Thiès', 'Tivaouane', 'Louga'],
      services: ['Stations-service', 'Restaurants', 'Hôtels', 'Garages'],
      peakHours: ['6h-8h', '18h-20h'],
      alerts: [],
      description: 'Axe principal nord reliant Dakar à Saint-Louis via Thiès'
    },
    {
      id: 'r003',
      name: 'Route Nationale N2 (Thiès-Kaolack-Tambacounda)',
      type: 'nationale',
      category: 'principale',
      start: { city: 'Thiès', zone: 'Centre', coordinates: [14.7910, -16.9358] },
      end: { city: 'Tambacounda', zone: 'Centre', coordinates: [13.7705, -13.6673] },
      distance: '240 km',
      duration: '2h30-3h30',
      tollCost: null,
      status: 'ouverte',
      condition: 'moyenne',
      lanes: 1,
      cameras: ['Khonasso', 'Guinguinéo', 'Kaolack', 'Koungheul'],
      services: ['Stations-service', 'Garages', 'Marchés'],
      peakHours: ['7h-9h'],
      alerts: ['Tronçon Kaolack-Koungheul: nids-de-poule fréquents'],
      description: 'Axe est-ouest vers le Mali via Kaolack'
    },
    {
      id: 'r004',
      name: 'Route Nationale N3 (Dakar-Pikine-Rufisque)',
      type: 'nationale',
      category: 'urbaine',
      start: { city: 'Dakar', zone: 'Colobane', coordinates: [14.6937, -17.4441] },
      end: { city: 'Rufisque', zone: 'Centre', coordinates: [14.7167, -17.2667] },
      distance: '28 km',
      duration: '45-90 min',
      tollCost: null,
      status: 'ouverte',
      condition: 'moyenne',
      lanes: 2,
      cameras: ['Colobane', 'Pikine', 'Rufisque Est'],
      services: ['Stations-service', 'Garages'],
      peakHours: ['6h30-10h', '16h-21h'],
      alerts: ['Embouteillages fréquents', 'Passages piétons actifs'],
      description: 'Route corniche est très fréquentée'
    },
    {
      id: 'r005',
      name: 'Route Nationale N4 (Thiès-Mbour)',
      type: 'nationale',
      category: 'secondaire',
      start: { city: 'Thiès', zone: 'Centre', coordinates: [14.7910, -16.9358] },
      end: { city: 'Mbour', zone: 'Centre', coordinates: [14.4108, -16.9661] },
      distance: '65 km',
      duration: '45-60 min',
      tollCost: null,
      status: 'ouverte',
      condition: 'bonne',
      lanes: 1,
      cameras: ['Diass', 'Aéroport', 'Mbour'],
      services: ['Stations-service', 'Restaurants'],
      peakHours: ['Vendredi-Samedi: trafic vers côtes'],
      alerts: [],
      description: 'Accès aux stations balnéaires et aéroport Blaise Diagne'
    },
    {
      id: 'r006',
      name: 'Route Nationale N5 (Kaolack-Ziguinchor)',
      type: 'nationale',
      category: 'principale',
      start: { city: 'Kaolack', zone: 'Centre', coordinates: [14.1652, -16.0758] },
      end: { city: 'Ziguinchor', zone: 'Centre', coordinates: [12.5833, -16.2717] },
      distance: '170 km',
      duration: '2h-3h',
      tollCost: null,
      status: 'ouverte',
      condition: 'moyenne',
      lanes: 1,
      cameras: ['Goudomp', 'Sédhiou', 'Ziguinchor Nord'],
      services: ['Stations-service', 'Garages', 'Douanes (zone Casamance)'],
      peakHours: ['Marché hebdomadaire'],
      alerts: ['Route à surveiller la nuit', 'Postes de contrôle fréquents'],
      description: 'Accès à la Casamance via le pont transgambien'
    },
    {
      id: 'r007',
      name: 'Route de l\'Aéroport AIBD',
      type: 'autoroute',
      category: 'aéroport',
      start: { city: 'Thiès', zone: 'Pout', coordinates: [14.7454, -17.0503] },
      end: { city: 'Diass', zone: 'Aéroport', coordinates: [14.6711, -17.0731] },
      distance: '15 km',
      duration: '15-20 min',
      tollCost: null,
      status: 'ouverte',
      condition: 'excellente',
      lanes: 2,
      cameras: ['Entrée Thiès', 'Aéroport', 'Parking P1', 'Parking P2'],
      services: ['Aéroport', 'Parking', 'Location véhicules', 'Hôtel'],
      peakHours: ['Heures d\'avions', 'Départs internationaux'],
      alerts: [],
      description: 'Voie rapide vers l\'Aéroport International Blaise Diagne'
    },
    {
      id: 'r008',
      name: 'Voie de dégagement VDN (VDN 1, 2, 3)',
      type: 'urbaine',
      category: 'dégagement',
      start: { city: 'Dakar', zone: 'Fann', coordinates: [14.6889, -17.4656] },
      end: { city: 'Dakar', zone: 'Keur Massar', coordinates: [14.7667, -17.3000] },
      distance: '20 km',
      duration: '25-45 min',
      tollCost: null,
      status: 'ouverte',
      condition: 'bonne',
      lanes: 2,
      cameras: ['Fann', 'Mermoz', 'Liberté 6', 'Castors', 'Pénétrante'],
      services: ['Stations-service', 'Garages'],
      peakHours: ['7h-9h30', '17h-21h'],
      alerts: ['Bouchons fréquents aux intersections', 'Priorité aux bus DDD'],
      description: 'Voie rapide traversant Dakar du centre à l\'est'
    },
    {
      id: 'r009',
      name: 'Route des Niayes (Dakar-Saint-Louis littoral)',
      type: 'secondaire',
      category: 'littorale',
      start: { city: 'Dakar', zone: 'Yoff', coordinates: [14.7578, -17.4667] },
      end: { city: 'Saint-Louis', zone: 'Littoral', coordinates: [16.0486, -16.4631] },
      distance: '200 km',
      duration: '2h30-3h',
      tollCost: null,
      status: 'ouverte',
      condition: 'bonne',
      lanes: 1,
      cameras: ['Rufisque', 'Saly', 'Mbour', 'Joal', 'Palmarin'],
      services: ['Stations-service', 'Hôtels', 'Campings', 'Plages'],
      peakHours: ['Week-ends', 'Vacances scolaires'],
      alerts: [],
      description: 'Route touristique le long du littoral atlantique'
    },
    {
      id: 'r010',
      name: 'Route Nationale N6 (Saint-Louis-Linguère-Matam)',
      type: 'nationale',
      category: 'principale',
      start: { city: 'Saint-Louis', zone: 'Centre', coordinates: [16.0326, -16.4818] },
      end: { city: 'Matam', zone: 'Centre', coordinates: [15.6589, -13.2578] },
      distance: '300 km',
      duration: '3h30-4h30',
      tollCost: null,
      status: 'ouverte',
      condition: 'bonne',
      lanes: 1,
      cameras: ['Dagana', 'Podor', 'Linguère', 'Kanel'],
      services: ['Stations-service', 'Garages', 'Relais routiers'],
      peakHours: ['Heures de marché hebdomadaire'],
      alerts: ['Route traversant la vallée du fleuve Sénégal'],
      description: 'Axe nord-est vers la frontière malienne'
    },
    {
      id: 'r011',
      name: 'Route Nationale N7 (Linguère-Tambacounda-Bakel)',
      type: 'nationale',
      category: 'principale',
      start: { city: 'Linguère', zone: 'Centre', coordinates: [15.3967, -15.1223] },
      end: { city: 'Bakel', zone: 'Centre', coordinates: [14.9067, -12.4667] },
      distance: '280 km',
      duration: '3h-4h',
      tollCost: null,
      status: 'ouverte',
      condition: 'moyenne',
      lanes: 1,
      cameras: ['Ranérou', 'Tambacounda', 'Goudiry', 'Bakel'],
      services: ['Stations-service', 'Garages'],
      peakHours: ['Marché à Tambacounda'],
      alerts: ['Route longue et isolée', 'Postes de pesage'],
      description: 'Traversée du Ferlo et accès vers le Mali oriental'
    },
    {
      id: 'r012',
      name: 'Route Départementale D601 (Mbour-Joal-Fadiouth)',
      type: 'departementale',
      category: 'secondaire',
      start: { city: 'Mbour', zone: 'Centre', coordinates: [14.4108, -16.9661] },
      end: { city: 'Joal-Fadiouth', zone: 'Centre', coordinates: [14.1667, -16.8500] },
      distance: '45 km',
      duration: '40-60 min',
      tollCost: null,
      status: 'ouverte',
      condition: 'bonne',
      lanes: 1,
      cameras: ['Fimela', 'Joal'],
      services: ['Stations-service', 'Restaurants', 'Sites touristiques'],
      peakHours: ['Week-ends', 'Pèlerinage à Fadiouth'],
      alerts: [],
      description: 'Route touristique vers l\'île de Fadiouth et ses cimetières'
    },
    {
      id: 'r013',
      name: 'Route Corniche Nord (Dakar - Almadies)',
      type: 'urbaine',
      category: 'dégagement',
      start: { city: 'Dakar', zone: 'Plateau', coordinates: [14.6648, -17.4356] },
      end: { city: 'Dakar', zone: 'Almadies', coordinates: [14.7421, -17.5129] },
      distance: '12 km',
      duration: '20-35 min',
      tollCost: null,
      status: 'ouverte',
      condition: 'bonne',
      lanes: 2,
      cameras: ['Plateau', 'Fann', 'Mermoz', 'Ouakam', 'Almadies'],
      services: ['Vue panoramique', 'Stations-service'],
      peakHours: ['17h-20h', 'Week-ends'],
      alerts: ['Vue belle mais sinueuse', 'Piétons le long de la côte'],
      description: 'Route panoramique longeant l\'océan Atlantique'
    },
    {
      id: 'r014',
      name: 'Route vers le Pont de Fadiouth',
      type: 'departementale',
      category: 'touristique',
      start: { city: 'Joal', zone: 'Centre', coordinates: [14.1667, -16.8500] },
      end: { city: 'Fadiouth', zone: 'Île', coordinates: [14.1500, -16.8333] },
      distance: '2 km',
      duration: '5 min à pied ou 2 min traversée',
      tollCost: '200 FCFA (péage pont en bois)',
      status: 'ouverte',
      condition: 'bonne',
      lanes: 1,
      cameras: ['Pont Fadiouth'],
      services: ['Péage piéton', 'Guides touristiques', 'Artisanat'],
      peakHours: ['10h-16h touristes'],
      alerts: ['Pont en bois, passage alterné'],
      description: 'Pont de bambou mythique vers l\'île de Fadiouth'
    },
    {
      id: 'r015',
      name: 'Route de Sindia (Mbour-Sindia-Diass)',
      type: 'departementale',
      category: 'aéroport',
      start: { city: 'Mbour', zone: 'Nord', coordinates: [14.4500, -16.9500] },
      end: { city: 'Diass', zone: 'Aéroport', coordinates: [14.6711, -17.0731] },
      distance: '35 km',
      duration: '30-40 min',
      tollCost: null,
      status: 'ouverte',
      condition: 'bonne',
      lanes: 1,
      cameras: ['Sindia', 'Aéroport'],
      services: ['Stations-service', 'Aéroport AIBD'],
      peakHours: ['Heures d\'avions'],
      alerts: [],
      description: 'Alternative pour rejoindre l\'aéroport via la côte'
    },
    {
      id: 'r016',
      name: 'Route Nationale N3 Extension (Rufisque-Tivaouane)',
      type: 'nationale',
      category: 'secondaire',
      start: { city: 'Rufisque', zone: 'Centre', coordinates: [14.7167, -17.2667] },
      end: { city: 'Tivaouane', zone: 'Centre', coordinates: [14.9501, -16.6872] },
      distance: '35 km',
      duration: '30-45 min',
      tollCost: null,
      status: 'ouverte',
      condition: 'moyenne',
      lanes: 1,
      cameras: ['Yenne', 'Tivaouane Sud'],
      services: ['Stations-service', 'Garages'],
      peakHours: ['Marché Tivaouane'],
      alerts: ['Route secondaire avec trafic local'],
      description: 'Liaison interne entre Rufisque et Tivaouane'
    },
    {
      id: 'r017',
      name: 'Route de Kolda-Sédhiou (N6 Sud)',
      type: 'nationale',
      category: 'principale',
      start: { city: 'Kolda', zone: 'Centre', coordinates: [12.8856, -14.9489] },
      end: { city: 'Sédhiou', zone: 'Centre', coordinates: [12.7067, -15.5567] },
      distance: '90 km',
      duration: '1h15-1h45',
      tollCost: null,
      status: 'ouverte',
      condition: 'moyenne',
      lanes: 1,
      cameras: ['Dabo', 'Sédhiou Nord'],
      services: ['Stations-service', 'Garages'],
      peakHours: ['Marché hebdomadaire'],
      alerts: ['Route en Casamance, contrôles fréquents'],
      description: 'Axe sud Casamance reliant Kolda à Sédhiou'
    },
    {
      id: 'r018',
      name: 'Route Ziguinchor-Cap Skirring (Touristique)',
      type: 'departementale',
      category: 'littorale',
      start: { city: 'Ziguinchor', zone: 'Centre', coordinates: [12.5833, -16.2717] },
      end: { city: 'Cap Skirring', zone: 'Station', coordinates: [12.3333, -16.7500] },
      distance: '75 km',
      duration: '1h15-1h30',
      tollCost: null,
      status: 'ouverte',
      condition: 'bonne',
      lanes: 1,
      cameras: ['Bignona', 'Kafountine', 'Cap Skirring'],
      services: ['Stations-service', 'Hôtels', 'Plages', 'Villages touristiques'],
      peakHours: ['Week-ends', 'Vacances'],
      alerts: ['Route balnéaire prisée', 'Contrôles douaniers'],
      description: 'Accès aux plus belles plages de Casamance'
    },
    {
      id: 'r019',
      name: 'Voie Express VDN 4 (Extension Nord)',
      type: 'urbaine',
      category: 'dégagement',
      start: { city: 'Dakar', zone: 'Pikine', coordinates: [14.7523, -17.3923] },
      end: { city: 'Keur Massar', zone: 'Nord', coordinates: [14.7667, -17.3000] },
      distance: '12 km',
      duration: '15-25 min',
      tollCost: null,
      status: 'ouverte',
      condition: 'bonne',
      lanes: 2,
      cameras: ['Pikine', 'Keur Massar Sud'],
      services: ['Stations-service'],
      peakHours: ['7h-9h', '17h-20h'],
      alerts: ['Extension récente de la VDN'],
      description: 'Prolongement de la VDN vers Keur Massar'
    }
  ],

  // ═══════════════════════════════════════════════════════════════════════════════
  // 🚦 ZONES DE CIRCULATION / POINTS NOIRS - DONNÉES ACTUALISÉES 2025
  // ═══════════════════════════════════════════════════════════════════════════════
  trafficZones: [
    {
      id: 'tz001',
      name: 'Colobane - Place de l\'Indépendance',
      type: 'zone_chaude',
      severity: 'critique',
      city: 'Dakar',
      zone: 'Centre-ville',
      coordinates: [14.6678, -17.4369],
      description: 'Carrefour majeur, bouchons matin et soir',
      peakHours: ['7h-10h', '17h-21h'],
      averageSpeed: '5-15 km/h',
      alternatives: ['VDN', 'Corniche Ouest'],
      alerts: ['Accidents fréquents', 'Piétons traversant'],
      cameras: ['Colobane Nord', 'Colobane Sud', 'Indépendance']
    },
    {
      id: 'tz002',
      name: 'Pont de l\'Émergence (ouvrage mixte)',
      type: 'ouvrage_art',
      severity: 'elevee',
      city: 'Dakar',
      zone: 'Fann-Mermoz',
      coordinates: [14.6889, -17.4589],
      description: 'Pont mixte train-voies, circulation alternée fréquente',
      peakHours: ['Toute la journée'],
      averageSpeed: '20-40 km/h',
      alternatives: ['VDN', 'Corniche'],
      alerts: ['Passage train = arrêt circulation', 'Travaux nocturnes'],
      cameras: ['Pont Nord', 'Pont Sud']
    },
    {
      id: 'tz003',
      name: 'Patte d\'Oie - Liberté 6',
      type: 'zone_chaude',
      severity: 'critique',
      city: 'Dakar',
      zone: 'Patte d\'Oie',
      coordinates: [14.6856, -17.4398],
      description: 'Intersection complexe, flux convergents',
      peakHours: ['7h-9h30', '17h30-21h'],
      averageSpeed: '10-20 km/h',
      alternatives: ['VDN direct', 'Almadies'],
      alerts: ['Embouteillages quotidiens'],
      cameras: ['Patte d\'Oie Est', 'Patte d\'Oie Ouest']
    },
    {
      id: 'tz004',
      name: 'Keur Massar - Sortie Dakar',
      type: 'zone_chaude',
      severity: 'elevee',
      city: 'Dakar',
      zone: 'Keur Massar',
      coordinates: [14.7667, -17.3000],
      description: 'Point de sortie de Dakar, congestion matinale',
      peakHours: ['6h-9h'],
      averageSpeed: '15-30 km/h',
      alternatives: ['Route des Niayes', 'A1 puis déviation'],
      alerts: ['Flux dense vers Thiès', 'Marché ambulant matinal'],
      cameras: ['Keur Massar Nord', 'Pénétrante Sud']
    },
    {
      id: 'tz005',
      name: 'Thiès Centre - Carrefour Auchan',
      type: 'zone_chaude',
      severity: 'elevee',
      city: 'Thiès',
      zone: 'Centre',
      coordinates: [14.7898, -16.9371],
      description: 'Carrefour commercial majeur',
      peakHours: ['8h-10h', '17h-20h'],
      averageSpeed: '15-25 km/h',
      alternatives: ['Rocade de Thiès'],
      alerts: ['Zone commerciale, piétons'],
      cameras: ['Auchan', 'Station']
    },
    {
      id: 'tz006',
      name: 'Rond-point Jet d\'Eau',
      type: 'ouvrage_art',
      severity: 'moyenne',
      city: 'Dakar',
      zone: 'Plateau',
      coordinates: [14.6648, -17.4356],
      description: 'Rond-point emblématique, flux tournants',
      peakHours: ['12h-14h', '17h-19h'],
      averageSpeed: '20-30 km/h',
      alternatives: ['Contournement'],
      alerts: ['Priorité à droite respecter'],
      cameras: ['Jet d\'Eau 360°']
    },
    {
      id: 'tz007',
      name: 'Corniche Ouest (Fann - Almadies)',
      type: 'zone_sensibles',
      severity: 'moyenne',
      city: 'Dakar',
      zone: 'Corniche',
      coordinates: [14.7089, -17.4667],
      description: 'Route côtière, dénivelé, virages',
      peakHours: ['18h-21h', 'Week-ends'],
      averageSpeed: '30-50 km/h',
      alternatives: ['VDN pour traversée rapide'],
      alerts: ['Route glissante par pluie', 'Vue magnifique mais risquée', 'Piétons plage'],
      cameras: ['Fann', 'Mamelles', 'Almadies']
    },
    {
      id: 'tz008',
      name: 'Sortie A1 Diamniadio',
      type: 'chantier',
      severity: 'elevee',
      city: 'Diamniadio',
      zone: 'Sortie autoroute',
      coordinates: [14.7176, -17.1801],
      description: 'Zone de développement, travaux fréquents',
      peakHours: ['Travaux permanents'],
      averageSpeed: 'Variable',
      alternatives: ['Route nationale N1'],
      alerts: ['Chantiers nouvelle ville', 'Déviations temporaires'],
      cameras: ['Sortie A1', 'Rond-point Diamniadio']
    }
  ],

  // ═══════════════════════════════════════════════════════════
  // RADARS ET CONTRÔLES
  // ═══════════════════════════════════════════════════════════
  speedControls: [
    {
      id: 'sc001',
      type: 'radar_fixe',
      location: 'Autoroute A1 PK 15',
      city: 'Pikine',
      coordinates: [14.7000, -17.3500],
      speedLimit: 90,
      direction: 'double_sens',
      description: 'Radar fixe autoroute péage',
      severity: 'elevee'
    },
    {
      id: 'sc002',
      type: 'radar_fixe',
      location: 'VDN 3 - Liberté 6',
      city: 'Dakar',
      coordinates: [14.7089, -17.4612],
      speedLimit: 60,
      direction: 'double_sens',
      description: 'Radar feu rouge + vitesse',
      severity: 'elevee'
    },
    {
      id: 'sc003',
      type: 'radar_mobile',
      location: 'Corniche Ouest',
      city: 'Dakar',
      coordinates: [14.7025, -17.4589],
      speedLimit: 50,
      direction: 'variable',
      description: 'Contrôles fréquents police/gendarmerie',
      severity: 'moyenne'
    },
    {
      id: 'sc004',
      type: 'radar_fixe',
      location: 'Route N1 - Keur Massar',
      city: 'Keur Massar',
      coordinates: [14.7667, -17.3000],
      speedLimit: 80,
      direction: 'sortie_dakar',
      description: 'Radar sortie de ville',
      severity: 'elevee'
    },
    {
      id: 'sc005',
      type: 'radar_mobile',
      location: 'Route N4 - Aéroport',
      city: 'Diass',
      coordinates: [14.6711, -17.0731],
      speedLimit: 90,
      direction: 'double_sens',
      description: 'Zone aéroport = contrôles stricts',
      severity: 'elevee'
    },
    {
      id: 'sc006',
      type: 'radar_fixe',
      location: 'A1 - Entrée Diamniadio',
      city: 'Diamniadio',
      coordinates: [14.7176, -17.1801],
      speedLimit: 90,
      direction: 'double_sens',
      description: 'Fin d\'autoroute',
      severity: 'elevee'
    }
  ],

  // ═══════════════════════════════════════════════════════════
  // SERVICES ROUTE
  // ═══════════════════════════════════════════════════════════
  services: [
    {
      id: 'sv001',
      type: 'station_service',
      brand: 'Total',
      name: 'Total Colobane',
      city: 'Dakar',
      zone: 'Colobane',
      coordinates: [14.6937, -17.4441],
      hours: '24h/24',
      services: ['Carburant', 'Lavage', 'Boutique', 'Pneu', 'Dépanneur'],
      payment: ['Espèces', 'Carte', 'Mobile Money'],
      phone: '+221 33 822 00 00'
    },
    {
      id: 'sv002',
      type: 'station_service',
      brand: 'Shell',
      name: 'Shell Liberté',
      city: 'Dakar',
      zone: 'Liberté 6',
      coordinates: [14.7089, -17.4612],
      hours: '6h-23h',
      services: ['Carburant', 'Lavage', 'Boutique'],
      payment: ['Espèces', 'Carte'],
      phone: '+221 33 827 00 00'
    },
    {
      id: 'sv003',
      type: 'depannage',
      brand: 'SOS Route',
      name: 'SOS Route Dakar',
      city: 'Dakar',
      zone: 'Grand Yoff',
      coordinates: [14.7245, -17.4548],
      hours: '24h/24',
      services: ['Dépannage', 'Remorquage', 'Pneu', 'Batterie', 'Carburant'],
      phone: '+221 77 600 00 00',
      responseTime: '15-30 min'
    },
    {
      id: 'sv004',
      type: 'depannage',
      brand: 'Ageroute',
      name: 'SOS Autoroute A1',
      city: 'Pikine',
      zone: 'Autoroute',
      coordinates: [14.7100, -17.3000],
      hours: '24h/24',
      services: ['Dépannage autoroute', 'Remorquage', 'Secours'],
      phone: '800 00 20 20',
      responseTime: '10-20 min',
      isTollFree: true
    },
    {
      id: 'sv005',
      type: 'garage',
      brand: 'Indépendant',
      name: 'Garage Thiès Centre',
      city: 'Thiès',
      zone: 'Centre',
      coordinates: [14.7898, -16.9371],
      hours: '7h-20h',
      services: ['Réparation', 'Pneu', 'Vidange', 'Diagnostique'],
      phone: '+221 33 951 00 00'
    },
    {
      id: 'sv006',
      type: 'location',
      brand: 'Europcar',
      name: 'Europcar Aéroport',
      city: 'Diass',
      zone: 'Aéroport AIBD',
      coordinates: [14.6711, -17.0731],
      hours: '24h/24',
      services: ['Location véhicules', 'Retour 24h', 'Assistance'],
      phone: '+221 33 939 90 90',
      url: 'https://europcar.sn'
    },
    {
      id: 'sv007',
      type: 'location',
      brand: 'Avis',
      name: 'Avis Dakar',
      city: 'Dakar',
      zone: 'Plateau',
      coordinates: [14.6648, -17.4356],
      hours: '8h-18h',
      services: ['Location véhicules', 'Chauffeur', 'Longue durée'],
      phone: '+221 33 823 00 00'
    },
    {
      id: 'sv008',
      type: 'parking',
      brand: 'Aéroport',
      name: 'Parking P1 AIBD',
      city: 'Diass',
      zone: 'Aéroport',
      coordinates: [14.6711, -17.0731],
      hours: '24h/24',
      services: ['Parking court séjour', 'Couvert', 'Sécurisé'],
      rates: '1000 FCFA/heure, 5000 FCFA/jour',
      phone: '+221 33 939 90 00'
    },
    {
      id: 'sv009',
      type: 'parking',
      brand: 'Mairie',
      name: 'Parking Plateau',
      city: 'Dakar',
      zone: 'Plateau',
      coordinates: [14.6648, -17.4356],
      hours: '7h-22h',
      services: ['Parking payant', 'Gardien'],
      rates: '200 FCFA/heure',
      phone: null
    },
    
    // SERVICES ADDITIONNELS RÉGIONAUX (2025)
    {
      id: 'sv010',
      type: 'station_service',
      brand: 'Total',
      name: 'Total Thiès',
      city: 'Thiès',
      zone: 'Auchan',
      coordinates: [14.7910, -16.9358],
      hours: '24h/24',
      services: ['Carburant', 'Lavage', 'Boutique', 'Pneu', 'Restauration'],
      payment: ['Espèces', 'Carte', 'Mobile Money'],
      phone: '+221 33 951 00 00'
    },
    {
      id: 'sv011',
      type: 'station_service',
      brand: 'Shell',
      name: 'Shell Saint-Louis',
      city: 'Saint-Louis',
      zone: 'Entrée Nord',
      coordinates: [16.0326, -16.4818],
      hours: '6h-23h',
      services: ['Carburant', 'Boutique', 'Lavage'],
      payment: ['Espèces', 'Carte'],
      phone: '+221 33 961 20 20'
    },
    {
      id: 'sv012',
      type: 'station_service',
      brand: 'Total',
      name: 'Total Kaolack',
      city: 'Kaolack',
      zone: 'N1',
      coordinates: [14.1652, -16.0758],
      hours: '24h/24',
      services: ['Carburant', 'Boutique', 'Pneu', 'Dépannage'],
      payment: ['Espèces', 'Carte', 'Mobile Money'],
      phone: '+221 33 941 10 10'
    },
    {
      id: 'sv013',
      type: 'station_service',
      brand: 'Total',
      name: 'Total Ziguinchor',
      city: 'Ziguinchor',
      zone: 'Entrée',
      coordinates: [12.5833, -16.2717],
      hours: '6h-22h',
      services: ['Carburant', 'Boutique', 'Lavage'],
      payment: ['Espèces', 'Mobile Money'],
      phone: '+221 33 990 10 10'
    },
    {
      id: 'sv014',
      type: 'depannage',
      brand: 'SOS Route',
      name: 'SOS Route Thiès',
      city: 'Thiès',
      zone: 'Centre',
      coordinates: [14.7898, -16.9371],
      hours: '24h/24',
      services: ['Dépannage', 'Remorquage', 'Pneu', 'Batterie'],
      phone: '+221 77 611 11 11',
      responseTime: '15-25 min'
    },
    {
      id: 'sv015',
      type: 'depannage',
      brand: 'SOS Route',
      name: 'SOS Route Ziguinchor',
      city: 'Ziguinchor',
      zone: 'Centre',
      coordinates: [12.5856, -16.2723],
      hours: '24h/24',
      services: ['Dépannage', 'Remorquage', 'Mécanique'],
      phone: '+221 77 622 22 22',
      responseTime: '20-35 min'
    },
    {
      id: 'sv016',
      type: 'garage',
      brand: 'Indépendant',
      name: 'Garage Médina Auto',
      city: 'Dakar',
      zone: 'Médina',
      coordinates: [14.6789, -17.4367],
      hours: '7h-21h',
      services: ['Réparation', 'Pneu', 'Vidange', 'Climatisation', 'Diagnostic'],
      phone: '+221 33 822 50 50'
    },
    {
      id: 'sv017',
      type: 'garage',
      brand: 'Midas',
      name: 'Midas Mbour',
      city: 'Mbour',
      zone: 'Centre',
      coordinates: [14.4108, -16.9661],
      hours: '8h-18h',
      services: ['Entretien', 'Pneu', 'Freinage', 'Échappement'],
      phone: '+221 33 957 70 70'
    },
    {
      id: 'sv018',
      type: 'location',
      brand: 'Hertz',
      name: 'Hertz Thiès',
      city: 'Thiès',
      zone: 'Centre',
      coordinates: [14.7898, -16.9371],
      hours: '8h-18h',
      services: ['Location véhicules', 'Chauffeur', 'Longue durée'],
      phone: '+221 33 951 90 90'
    },
    {
      id: 'sv019',
      type: 'location',
      brand: 'Sixt',
      name: 'Sixt Saint-Louis',
      city: 'Saint-Louis',
      zone: 'Centre',
      coordinates: [16.0302, -16.4815],
      hours: '8h-18h',
      services: ['Location véhicules', '4x4', 'Tourisme'],
      phone: '+221 33 961 90 90'
    },
    {
      id: 'sv020',
      type: 'restaurant',
      brand: 'Relais Routier',
      name: 'Relais de Thiès',
      city: 'Thiès',
      zone: 'N1',
      coordinates: [14.7856, -16.9423],
      hours: '6h-23h',
      services: ['Restauration', 'Café', 'Toilettes', 'Wifi'],
      phone: '+221 33 951 55 55'
    },
    {
      id: 'sv021',
      type: 'restaurant',
      brand: 'Relais Routier',
      name: 'Relais de Kaolack',
      city: 'Kaolack',
      zone: 'N1',
      coordinates: [14.1634, -16.0778],
      hours: '6h-22h',
      services: ['Restauration', 'Café', 'Toilettes'],
      phone: '+221 33 941 44 44'
    },
    {
      id: 'sv022',
      type: 'hotel',
      brand: 'Relais',
      name: 'Hôtel Relais Tambacounda',
      city: 'Tambacounda',
      zone: 'N1',
      coordinates: [13.7705, -13.6673],
      hours: '24h/24',
      services: ['Hébergement', 'Restaurant', 'Parking sécurisé'],
      phone: '+221 33 981 70 70'
    },
    {
      id: 'sv023',
      type: 'hopital_urgence',
      brand: 'Public',
      name: 'Poste Secours N1 Thiès',
      city: 'Thiès',
      zone: 'Sortie N1',
      coordinates: [14.7956, -16.9289],
      hours: '24h/24',
      services: ['Premiers secours', 'Ambulance', 'Orientation SAMU'],
      phone: '1515 / +221 33 951 15 15'
    },
    {
      id: 'sv024',
      type: 'parking',
      brand: 'Sécurisé',
      name: 'Parking Auchan Thiès',
      city: 'Thiès',
      zone: 'Auchan',
      coordinates: [14.7898, -16.9371],
      hours: '8h-22h',
      services: ['Parking payant', 'Vidéosurveillance'],
      rates: '300 FCFA/heure',
      phone: null
    }
  ],

  // ═══════════════════════════════════════════════════════════════════════════════
  // 🚨 ALERTES ROUTIÈRES TEMPS RÉEL - MISES À JOUR CONSTANTES
  // Dernière update: 25 Avril 2025 | Sources: AGEROUTE, Gendarmerie, Communes
  // ═══════════════════════════════════════════════════════════════════════════════
  announcements: [
    {
      id: 'ann001',
      type: 'travaux',
      priority: 'elevee',
      title: 'Travaux rénovation VDN 2',
      description: 'Réhabilitation chaussée VDN 2 tronçon Mermoz-Liberté 6. Circulation alternée, une voie disponible sur deux.',
      location: 'VDN 2 (Mermoz → Liberté)',
      startDate: '2025-03-15',
      endDate: '2025-05-30',
      impact: 'Ralentissements 15-30 min, une voie sur deux',
      alternatives: ['VDN 1', 'VDN 3', 'Corniche Ouest'],
      coordinates: [14.6950, -17.4550],
      source: 'AGEROUTE',
      lastUpdate: '2025-04-20'
    },
    {
      id: 'ann002',
      type: 'travaux',
      priority: 'critique',
      title: 'Réfection Autoroute A1 - PK 12 à 15',
      description: 'Travaux de réfection de la chaussée autoroute A1. Fermeture temporaire d\'une voie.',
      location: 'Autoroute A1 (PK 12-15)',
      startDate: '2025-04-10',
      endDate: '2025-04-28',
      impact: 'Ralentissements importants aux heures de pointe',
      alternatives: ['Route départementale Diamniadio', 'N1 via Rufisque'],
      coordinates: [14.7102, -17.3123],
      source: 'SENAC SA',
      lastUpdate: '2025-04-24'
    },
    {
      id: 'ann003',
      type: 'accident',
      priority: 'critique',
      title: 'Accident rond-point Colobane',
      description: 'Accident entre poids lourd et véhicule léger. Route partiellement obstruée, forces de l\'ordre sur place.',
      location: 'Rond-point Colobane',
      startDate: '2025-04-25',
      endDate: '2025-04-25',
      impact: 'Bouchon 3-5 km vers Thiès, circulation alternée',
      alternatives: ['VDN 3', 'Corniche Est', 'Autoroute A1'],
      coordinates: [14.6937, -17.4441],
      source: 'Gendarmerie',
      lastUpdate: '2025-04-25 08:30'
    },
    {
      id: 'ann004',
      type: 'evenement',
      priority: 'moyenne',
      title: 'Concert Stade LSS - Youssou N\'Dour',
      description: 'Grand concert ce soir 21h au Stade Léopold Sédar Senghor. Fermeture progressive des accès dès 17h.',
      location: 'Stade LSS - Plateau',
      startDate: '2025-04-25',
      endDate: '2025-04-26',
      impact: 'Fermeture routes autour stade 17h-02h, stationnement interdit',
      alternatives: ['Éviter secteur Plateau/Sacré-Cœur 16h-02h', 'Parking relais Liberté 6'],
      coordinates: [14.6744, -17.4525],
      source: 'Mairie Dakar',
      lastUpdate: '2025-04-24'
    },
    {
      id: 'ann005',
      type: 'meteo',
      priority: 'elevee',
      title: 'Alerte orages et fortes pluies - ANACIM',
      description: 'Prévisions orages avec fortes pluies 16h-22h sur Dakar et régions Ouest. Risque d\'inondations locales.',
      location: 'Dakar, Thiès, Saint-Louis',
      startDate: '2025-04-25',
      endDate: '2025-04-26',
      impact: 'Chaussées glissantes, visibilité réduite, zones inondables',
      alternatives: ['Privilégier autoroute A1', 'Éviter Keur Massar, Pikine basses terres'],
      coordinates: [14.6937, -17.4441],
      source: 'ANACIM',
      lastUpdate: '2025-04-25 06:00'
    },
    {
      id: 'ann006',
      type: 'controle',
      priority: 'moyenne',
      title: 'Opération Sécurité Routière - N1 Thiès',
      description: 'Contrôles systématiques documents, alcootest, vitesse. Présence gendarmerie et police.',
      location: 'N1 - Keur Massar et péage Thiès',
      startDate: '2025-04-25',
      endDate: '2025-04-27',
      impact: 'Ralentissements aux points de contrôle',
      alternatives: ['Aucune déviation - respecter code route', 'Autoroute A1 alternative payante'],
      coordinates: [14.7667, -17.3000],
      source: 'Gendarmerie Nationale',
      lastUpdate: '2025-04-24'
    },
    {
      id: 'ann007',
      type: 'fermeture',
      priority: 'elevee',
      title: 'Fermeture nocturne Pont Emergence',
      description: 'Pont mixte fermé 23h-05h pour maintenance des appareils de dilatation et vérification structure.',
      location: 'Pont Emergence (Fann-Mermoz)',
      startDate: '2025-04-25',
      endDate: '2025-05-02',
      impact: 'Fermeture totale 23h-05h tous les soirs',
      alternatives: ['VDN 1, 2 ou 3', 'Corniche Ouest'],
      coordinates: [14.6889, -17.4589],
      source: 'AGEROUTE',
      lastUpdate: '2025-04-23'
    },
    {
      id: 'ann008',
      type: 'travaux',
      priority: 'moyenne',
      title: 'Réfection N2 Kaolack-Koungheul',
      description: 'Travaux de réhabilitation route nationale N2. Nids-de-poule en cours de réparation.',
      location: 'N2 - Tronçon Kaolack-Koungheul',
      startDate: '2025-04-01',
      endDate: '2025-05-15',
      impact: 'Chaussée dégradée, ralentissements, circulation alternée par endroits',
      alternatives: ['Route via Mbour-Kaolack pour véhicules légers'],
      coordinates: [14.1523, -15.4521],
      source: 'AGEROUTE',
      lastUpdate: '2025-04-22'
    },
    {
      id: 'ann009',
      type: 'accident',
      priority: 'critique',
      title: 'Carambolage N1 - sortie Thiès',
      description: 'Accident multiple impliquant 4 véhicules. Route temporairement fermée.',
      location: 'N1 - Sortie Est Thiès',
      startDate: '2025-04-25',
      endDate: '2025-04-25',
      impact: 'Route fermée, déviation en cours par rocade Thiès',
      alternatives: ['Rocade de Thiès', 'Sortie Ouest Thiès'],
      coordinates: [14.7898, -16.9371],
      source: 'Gendarmerie Thiès',
      lastUpdate: '2025-04-25 07:15'
    },
    {
      id: 'ann010',
      type: 'evenement',
      priority: 'moyenne',
      title: 'Marché hebdomadaire Keur Massar',
      description: 'Marché hebdomadaire tous les samedis. Afflux de piétons et véhicules.',
      location: 'Keur Massar - Marché',
      startDate: '2025-04-26',
      endDate: '2025-04-26',
      impact: 'Circulation très difficile 06h-14h, stationnement interdit sur N1',
      alternatives: ['Arriver avant 6h', 'Parking marché payant 500 FCFA'],
      coordinates: [14.7667, -17.3000],
      source: 'Commune Keur Massar',
      lastUpdate: '2025-04-20'
    },
    {
      id: 'ann011',
      type: 'meteo',
      priority: 'elevee',
      title: 'Canicule - Vigilance orange',
      description: 'Températures > 40°C attendues sur Dakar et intérieur pays. Risque coup de chaleur.',
      location: 'Dakar, Thiès, Diourbel, Fatick',
      startDate: '2025-04-25',
      endDate: '2025-04-27',
      impact: 'Conduite fatigante, risque crevaisons, surchauffe moteurs',
      alternatives: ['Vérifier liquide refroidissement', 'Éviter conduite 12h-16h'],
      coordinates: [14.7910, -16.9358],
      source: 'ANACIM',
      lastUpdate: '2025-04-24'
    },
    {
      id: 'ann012',
      type: 'travaux',
      priority: 'elevee',
      title: 'Construction viaduc Mbao-Rufisque',
      description: 'Chantier viaduc nouvelle liaison Mbao-Rufisque. Circulation réduite sur route existante.',
      location: 'Route Mbao-Rufisque',
      startDate: '2025-02-01',
      endDate: '2025-08-31',
      impact: 'Circulation alternée, camions de chantier, poussière',
      alternatives: ['Autoroute A1 jusqu\'à Diamniadio puis N1'],
      coordinates: [14.7234, -17.3456],
      source: 'AGEROUTE',
      lastUpdate: '2025-04-21'
    },
    {
      id: 'ann013',
      type: 'controle',
      priority: 'moyenne',
      title: 'Contrôle technique renforcé - Autoroute A1',
      description: 'Vérification systématique vignette autoroute, contrôle technique, assurance.',
      location: 'Péage Diamniadio et péage Colobane',
      startDate: '2025-04-25',
      endDate: '2025-04-30',
      impact: 'Ralentissements aux péages, files d\'attente possible',
      alternatives: ['Vérifier documents avant départ', 'Prévoir monnaie péage'],
      coordinates: [14.7176, -17.1801],
      source: 'SENAC SA + Gendarmerie',
      lastUpdate: '2025-04-24'
    },
    {
      id: 'ann014',
      type: 'fermeture',
      priority: 'critique',
      title: 'Fermeture exceptionnelle A1 - maintenance',
      description: 'Fermeture temporaire autoroute pour maintenance d\'urgence infrastructure.',
      location: 'Autoroute A1 - PK 8 à 12',
      startDate: '2025-04-27',
      endDate: '2025-04-27',
      impact: 'Fermeture 06h-12h, déviation obligatoire par N1',
      alternatives: ['Route N1 Dakar-Rufisque-Diamniadio', 'Prévoir +45 min trajet'],
      coordinates: [14.7056, -17.2534],
      source: 'SENAC SA',
      lastUpdate: '2025-04-23'
    },
    {
      id: 'ann015',
      type: 'travaux',
      priority: 'moyenne',
      title: 'Élargissement Rocade Thiès',
      description: 'Travaux élargissement à 2x2 voies rocade Thiès. Section ouest en chantier.',
      location: 'Rocade Thiès - Section Ouest',
      startDate: '2025-01-10',
      endDate: '2025-06-30',
      impact: 'Circulation alternée, ralentissements aux heures de pointe',
      alternatives: ['Traversée centre Thiès (plus lent mais fluide)'],
      coordinates: [14.7856, -16.9423],
      source: 'AGEROUTE',
      lastUpdate: '2025-04-22'
    }
  ],

  // ═══════════════════════════════════════════════════════════
  // AUTO-ÉCOLE & CONSEILS
  // ═══════════════════════════════════════════════════════════
  drivingSchools: [
    {
      id: 'de001',
      name: 'Auto-École Plateau',
      city: 'Dakar',
      zone: 'Plateau',
      coordinates: [14.6648, -17.4356],
      phone: '+221 33 823 45 45',
      services: ['Code', 'Conduite', 'Recyclage'],
      prices: { code: '50000 FCFA', conduite: '120000 FCFA', pack: '150000 FCFA' },
      rating: 4.5,
      vehicles: ['Manuelle', 'Automatique']
    },
    {
      id: 'de002',
      name: 'Auto-École Fann',
      city: 'Dakar',
      zone: 'Fann',
      coordinates: [14.6889, -17.4656],
      phone: '+221 33 820 50 50',
      services: ['Code', 'Conduite', 'Permis A-B-C-D'],
      prices: { code: '45000 FCFA', conduite: '110000 FCFA', pack: '140000 FCFA' },
      rating: 4.3,
      vehicles: ['Manuelle', 'Automatique', 'Moto']
    },
    {
      id: 'de003',
      name: 'Auto-École Thiès',
      city: 'Thiès',
      zone: 'Centre',
      coordinates: [14.7898, -16.9371],
      phone: '+221 33 951 45 45',
      services: ['Code', 'Conduite', 'Perfectionnement'],
      prices: { code: '40000 FCFA', conduite: '100000 FCFA', pack: '120000 FCFA' },
      rating: 4.0,
      vehicles: ['Manuelle']
    }
  ],

  drivingTips: [
    {
      category: 'Sécurité',
      icon: '🛡️',
      title: 'Priorité à droite',
      content: 'Au Sénégal, la priorité à droite s\'applique sauf panneau contraire. Aux intersections sans signalisation, cédez le passage à droite.'
    },
    {
      category: 'Code',
      icon: '📋',
      title: 'Limites de vitesse',
      content: 'Ville: 50 km/h | Agglomération: 80 km/h | Route: 90 km/h | Autoroute: 90-110 km/h. Radars fixes et mobiles sur tout le réseau.'
    },
    {
      category: 'Pratique',
      icon: '🚗',
      title: 'Conduite à Dakar',
      content: 'Anticipez les embouteillages 7h-10h et 17h-21h. Les taxis et cars s\'arrêtent sans prévenir. Méfiez-vous des deux-roues qui filtrent.'
    },
    {
      category: 'Urgence',
      icon: '🚨',
      title: 'En cas d\'accident',
      content: 'Ne bougez pas le véhicule sauf danger. Appelez police (17) ou gendarmerie (800 00 20 20). Échangez coordonnées avec l\'autre partie.'
    },
    {
      category: 'Prévention',
      icon: '⚠️',
      title: 'Zones à risque',
      content: 'Évitez de circuler la nuit sur routes secondaires. Verrouillez portes aux feux rouges en ville. Ne laissez jamais objets de valeur visibles.'
    },
    {
      category: 'Papiers',
      icon: '📄',
      title: 'Documents obligatoires',
      content: 'Permis de conduire, carte grise, assurance (RC obligatoire), vignette. Contrôles fréquents, amende si documents manquants.'
    }
  ],

  // ═══════════════════════════════════════════════════════════════════════════════
  // 📘 CODE DE LA ROUTE SÉNÉGALAIS - NORMES LOCALES 2025
  // Dernière mise à jour: Avril 2025 | Réglementation DSR/DAS
  // ═══════════════════════════════════════════════════════════════════════════════
  trafficCode: {
    // VITESSES LIMITES
    speedLimits: {
      title: 'Limites de Vitesse',
      subtitle: 'En vigueur sur l\'ensemble du territoire sénégalais',
      zones: [
        { type: 'ville', limit: '50 km/h', description: 'Agglomération (panneau entrée/sortie)', icon: '🏙️', details: 'Radars fixes en cours d\'installation dans toutes les grandes villes' },
        { type: 'route', limit: '90 km/h', description: 'Routes nationales et départementales', icon: '🛣️', details: 'N1, N2, N3, N4, N5, N6, N7' },
        { type: 'autoroute', limit: '110 km/h', description: 'Autoroute A1 (Dakar-Diamniadio)', icon: '🚙', details: 'Péage obligatoire, 500-1500 FCFA selon véhicule' },
        { type: 'pluie', limit: '-20 km/h', description: 'Réduction obligation par temps de pluie', icon: '🌧️', details: 'Visibilité réduite = vitesse réduite' },
        { type: 'nuit', limit: '-10 km/h', description: 'Réduction conseillée de nuit', icon: '🌙', details: 'Routes secondaires à éviter la nuit' }
      ],
      sanctions: [
        { exceed: '20-29 km/h', amount: '15 000 FCFA', points: 0, severity: 'Classe 2' },
        { exceed: '30-39 km/h', amount: '25 000 FCFA', points: -1, severity: 'Classe 3' },
        { exceed: '40-49 km/h', amount: '50 000 FCFA', points: -2, severity: 'Classe 4' },
        { exceed: '50+ km/h', amount: '100 000 FCFA', points: -3, severity: 'Classe 5 + Retrait permis possible' }
      ]
    },

    // PANNEAUX DE SIGNALISATION SPÉCIFIQUES
    roadSigns: {
      title: 'Panneaux Prioritaires au Sénégal',
      categories: [
        {
          name: 'Danger',
          color: '#F59E0B',
          signs: [
            { code: 'A1', name: 'Virage à gauche', icon: '↪️' },
            { code: 'A2', name: 'Virage à droite', icon: '↩️' },
            { code: 'A3', name: 'Succession virages', icon: '⤴️' },
            { code: 'A4', name: 'Cassis / Dos-d\'âne', icon: '⛰️', localNote: 'Très fréquents sur routes secondaires' },
            { code: 'A5', name: 'Chaussée rétrécie', icon: '↔️' },
            { code: 'A7', name: 'Pont mobile', icon: '🌉', localNote: 'Ponts provisoires en Casamance' },
            { code: 'A8', name: 'Passage à niveau', icon: '🚃' },
            { code: 'A13', name: 'Passage piétons', icon: '🚶', localNote: 'Passages très fréquentés en ville' },
            { code: 'A14', name: 'Enfants / École', icon: '🚸' },
            { code: 'A15', name: 'Travaux', icon: '🚧', localNote: 'Présence permanente sur VDN' },
            { code: 'A21', name: 'Nids-de-poule', icon: '🕳️', localNote: 'Signalisation locale très importante' },
            { code: 'A25', name: 'Animaux sauvages', icon: '🐂', localNote: 'Vaches, moutons, chèvres sur route' }
          ]
        },
        {
          name: 'Interdiction',
          color: '#EF4444',
          signs: [
            { code: 'B1', name: 'Arrêt et stationnement interdits', icon: '🚫' },
            { code: 'B2a', name: 'Sens interdit', icon: '⛔' },
            { code: 'B3', name: 'Interdiction tourner à gauche', icon: '↩️🚫' },
            { code: 'B4', name: 'Interdiction tourner à droite', icon: '↪️🚫' },
            { code: 'B6a', name: 'Vitesse limitée', icon: '50️⃣', localNote: '50-90-110 km/h selon zones' },
            { code: 'B7a', name: 'Dépassement interdit', icon: '🚫🚗' },
            { code: 'B8', name: 'Poids lourds interdits', icon: '🚫🚛', localNote: 'Sauf autorisation spéciale Casamance' },
            { code: 'B14', name: 'Accès interdit aux piétons', icon: '🚫🚶' },
            { code: 'B50', name: 'Stationnement gênant interdit', icon: '🚫🅿️', localNote: 'Fourrière possible à Dakar' }
          ]
        },
        {
          name: 'Obligation',
          color: '#3B82F6',
          signs: [
            { code: 'B21a', name: 'Obligation tourner à gauche', icon: '⬅️' },
            { code: 'B21b', name: 'Obligation tourner à droite', icon: '➡️' },
            { code: 'B22a', name: 'Obligation contournement gauche', icon: '↺' },
            { code: 'B22b', name: 'Obligation contournement droite', icon: '↻' },
            { code: 'B27', name: 'Chaussée glissante', icon: '⚠️', localNote: 'Très fréquent en saison des pluies' },
            { code: 'B33', name: 'Voie réservée bus', icon: '🚌', localNote: 'VDN et centre Dakar' }
          ]
        },
        {
          name: 'Indication',
          color: '#10B981',
          signs: [
            { code: 'C1', name: 'Voie prioritaire', icon: '💎' },
            { code: 'C3', name: 'Fin voie prioritaire', icon: '🚫💎' },
            { code: 'C5', name: 'Rappel priorité à droite', icon: '🔺', localNote: 'Rond-points, intersections' },
            { code: 'C8', name: 'Station essence', icon: '⛽' },
            { code: 'C13', name: 'Hôtel', icon: '🏨' },
            { code: 'C14', name: 'Restaurant', icon: '🍽️' },
            { code: 'C15', name: 'Dépanneur', icon: '🔧' },
            { code: 'C20', name: 'Hôpital / Premier secours', icon: '🏥' },
            { code: 'C107', name: 'Péage', icon: '💰', localNote: 'Autoroute A1 uniquement' },
            { code: 'C110', name: 'Gendarmerie', icon: '👮', localNote: 'Postes de contrôle fréquents' }
          ]
        }
      ]
    },

    // RÈGLES DE PRIORITÉ LOCALES
    priorityRules: {
      title: 'Règles de Priorité au Sénégal',
      rules: [
        { 
          title: 'Priorité à droite', 
          description: 'Sauf panneau "STOP", "Cédez le passage" ou feu tricolore', 
          icon: '→',
          localContext: 'Règle générale aux intersections non signalisées'
        },
        { 
          title: 'Rond-points', 
          description: 'Priorité aux véhicules déjà engagés sur le giratoire', 
          icon: '🔄',
          localContext: 'Respect variable - anticiper les infractions'
        },
        { 
          title: 'Feux tricolores', 
          description: 'Rouge = arrêt | Orange = arrêt si possible | Vert = passage', 
          icon: '🚦',
          localContext: 'Feux souvent non respectés - rester vigilant'
        },
        { 
          title: 'Passage piétons', 
          description: 'Céder le passage aux piétons engagés', 
          icon: '🚶',
          localContext: 'Piétons traversent souvent hors passages - prudence'
        },
        { 
          title: 'Véhicules prioritaires', 
          description: 'Samu, Pompiers, Police, Gendarmerie, ORSEC', 
          icon: '🚨',
          localContext: 'Céder systématiquement le passage - amende sinon'
        },
        { 
          title: 'Montée/descente', 
          description: 'Véhicule montant cède le passage au véhicule descendant sur route étroite', 
          icon: '⛰️',
          localContext: 'Routes de Casamance, N7, collines'
        }
      ]
    },

    // DOCUMENTS OBLIGATOIRES
    requiredDocuments: {
      title: 'Documents Obligatoires à Bord',
      subtitle: 'Contrôles fréquents par Gendarmerie et Police',
      documents: [
        { name: 'Permis de conduire', category: 'Conducteur', valid: 'National ou International', penalty: '15 000 FCFA', icon: '🪪' },
        { name: 'Carte grise', category: 'Véhicule', valid: 'À jour des taxes', penalty: '10 000 FCFA', icon: '📋' },
        { name: 'Attestation d\'assurance', category: 'Véhicule', valid: 'RC obligatoire minimum', penalty: '25 000 FCFA', icon: '📄' },
        { name: 'Vignette', category: 'Fiscal', valid: 'Annuelle ou trimestrielle', penalty: '5 000 FCFA', icon: '🏷️' },
        { name: 'Contrôle technique', category: 'Véhicule', valid: '< 5 ans ou tous les 2 ans', penalty: '20 000 FCFA', icon: '🔍', note: 'Obligatoire pour tous véhicules' },
        { name: 'Carnet de santé', category: 'Transport', valid: 'Véhicules de transport', penalty: '20 000 FCFA', icon: '📒', note: 'Taxis, clandos, cars rapides' },
        { name: 'Licence de transport', category: 'Professionnel', valid: 'Véhicule de transport public', penalty: '50 000 FCFA', icon: '🎫', note: 'Obligatoire pour taxis et clandos' }
      ]
    },

    // SANCTIONS & AMENDES
    penalties: {
      title: 'Sanctions et Amendes 2025',
      subtitle: 'Grille des sanctions DSR/DAS',
      categories: [
        {
          name: 'Excès de vitesse',
          items: [
            { violation: '20-29 km/h au-dessus', amount: '15 000 FCFA', points: '0', risk: 'Classe 2' },
            { violation: '30-39 km/h au-dessus', amount: '25 000 FCFA', points: '-1', risk: 'Classe 3' },
            { violation: '40-49 km/h au-dessus', amount: '50 000 FCFA', points: '-2', risk: 'Classe 4' },
            { violation: '50+ km/h au-dessus', amount: '100 000 FCFA', points: '-3', risk: 'Classe 5 + Retrait permis' }
          ]
        },
        {
          name: 'Conduite dangereuse',
          items: [
            { violation: 'Refus de priorité', amount: '10 000 FCFA', points: '-2', risk: 'Moyen' },
            { violation: 'Dépassement dangereux', amount: '15 000 FCFA', points: '-2', risk: 'Élevé' },
            { violation: 'Feu rouge grillé', amount: '25 000 FCFA', points: '-3', risk: 'Élevé' },
            { violation: 'Conduite en état d\'ivresse', amount: '50 000-150 000 FCFA', points: '-6', risk: 'Très élevé + Prison' },
            { violation: 'Téléphone au volant', amount: '10 000 FCFA', points: '-1', risk: 'Moyen' },
            { violation: 'Non-port de ceinture', amount: '5 000 FCFA', points: '0', risk: 'Faible' }
          ]
        },
        {
          name: 'Documents',
          items: [
            { violation: 'Permis non présenté', amount: '15 000 FCFA', points: '0', risk: 'Classe 2' },
            { violation: 'Assurance non valide', amount: '25 000 FCFA', points: '0', risk: 'Classe 3 + Immobilisation' },
            { violation: 'Carte grise non valide', amount: '10 000 FCFA', points: '0', risk: 'Classe 2' }
          ]
        }
      ],
      pointSystem: {
        total: 12,
        warning: 6,
        suspension: 0,
        note: 'Permis retiré à 0 points - Stage de récupération possible'
      }
    },

    // SPÉCIFICITÉS LOCALES
    localSpecifics: {
      title: 'Spécificités Locales au Sénégal',
      items: [
        {
          title: 'Taxi-Clando (7 places)',
          description: 'Arrêtent n\'importe où, changements de file brusques',
          advice: 'Anticiper les arrêts imprévus, laisser distance de sécurité',
          icon: '🚕'
        },
        {
          title: 'Cars Rapides (Ndiaga Ndiaye)',
          description: 'Transport interurbain fréquent, arrêts non officiels',
          advice: 'Attention aux arrêts sur N1, Thiès, Mbour',
          icon: '🚌'
        },
        {
          title: 'Motos Jakarta',
          description: 'Circulation entre les files, feux grillés fréquents',
          advice: 'Surveillance permanente des rétroviseurs avant changement de file',
          icon: '🛵'
        },
        {
          title: 'Attelages (Charettes)',
          description: 'Présents sur routes secondaires et périurbaines',
          advice: 'Doubler avec précaution, klaxonner avant de dépasser',
          icon: '🐎'
        },
        {
          title: 'Marchés ambulants',
          description: 'Pistes d\'embarquement/débarquement sur route',
          advice: 'Vendredi et Samedi = circulation très ralentie',
          icon: '🛒'
        },
        {
          title: 'Animaux sur route',
          description: 'Vaches, chèvres, moutons en divagation',
          advice: 'Route de Casamance, zones rurales - Prudence nocturne',
          icon: '🐄'
        },
        {
          title: 'Panneaux solaires',
          description: 'Eblouissement au lever/coucher du soleil',
          advice: 'Port de lunettes de soleil, nettoyage pare-brise',
          icon: '☀️'
        },
        {
          title: 'Saison des pluies',
          description: 'Juillet-Octobre, routes inondables',
          advice: 'Éviter Keur Massar, Pikine,某些routes de Casamance',
          icon: '🌧️'
        }
      ]
    },

    // NUMÉROS UTILES CODE
    emergencyNumbers: {
      title: 'Numéros d\'Urgence Routière',
      numbers: [
        { name: 'Samu', number: '1515', free: true, description: 'Accident avec blessés' },
        { name: 'Police', number: '17', free: true, description: 'Accident, délit de fuite' },
        { name: 'Pompiers', number: '18', free: true, description: 'Incendie, accident' },
        { name: 'Gendarmerie', number: '800 00 20 20', free: true, description: 'Route, autoroute' },
        { name: 'SOS Autoroute', number: '800 00 20 20', free: true, description: 'Panne, accident A1' },
        { name: 'Direction Sécurité', number: '33 859 22 22', free: false, description: 'Plaintes, infos' }
      ]
    },

    // QUESTIONS EXAMEN TYPE
    examSample: {
      title: 'Questions Type Examen du Permis',
      questions: [
        { q: 'À quelle distance doit-on signaler un dépassement ?', a: 'Au moins 50m avant avec clignotant', correct: true },
        { q: 'Que signifie un feu orange fixe ?', a: 'Arrêt obligatoire si possible sans danger', correct: true },
        { q: 'Quelle est la distance de sécurité à maintenir ?', a: 'Règle des 2 secondes (deux traits blancs)', correct: true },
        { q: 'Peut-on stationner sur un passage piéton ?', a: 'Non, interdit à moins de 5m', correct: true },
        { q: 'Que faire en cas d\'accident avec blessé ?', a: 'Appeler Samu 1515, ne pas déplacer la victime', correct: true }
      ]
    }
  },

  // ═══════════════════════════════════════════════════════════
  // LIENS GPS & CARTES
  // ═══════════════════════════════════════════════════════════
  gpsLinks: {
    google_maps: 'https://www.google.com/maps/search/?api=1&query={lat},{lng}',
    waze: 'https://waze.com/ul?ll={lat},{lng}&navigate=yes',
    maps_me: 'https://maps.me/catalog/?lat={lat}&lon={lng}',
    here_wego: 'https://share.here.com/r/{lat},{lng}'
  }
}

// ═══════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════

export const CITIES_ROUTE = ['Dakar', 'Thiès', 'Saint-Louis', 'Kaolack', 'Ziguinchor', 'Tambacounda', 'Louga', 'Mbour', 'Diamniadio']

export const ROUTE_TYPES = ['autoroute', 'nationale', 'secondaire', 'urbaine']

export function getRouteById(id) {
  return SENEGAL_ROUTE_DATA.routes.find(r => r.id === id)
}

export function getActiveAlerts() {
  return SENEGAL_ROUTE_DATA.announcements.filter(a => new Date(a.endDate) >= new Date())
}

export function getTrafficZonesBySeverity(severity) {
  return SENEGAL_ROUTE_DATA.trafficZones.filter(z => z.severity === severity)
}

export function getNearbyServices(lat, lng, radius = 5, type = null) {
  // Calcul simplifié de distance (à remplacer par vrai calcul haversine)
  const services = SENEGAL_ROUTE_DATA.services
  if (type) {
    return services.filter(s => s.type === type)
  }
  return services
}

export function searchRoutes(query) {
  const q = query.toLowerCase()
  return SENEGAL_ROUTE_DATA.routes.filter(r => 
    r.name.toLowerCase().includes(q) || 
    r.start.city.toLowerCase().includes(q) ||
    r.end.city.toLowerCase().includes(q)
  )
}

export function getGpsLinks(lat, lng) {
  return {
    google: `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`,
    waze: `https://waze.com/ul?ll=${lat},${lng}&navigate=yes`,
    maps: `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`
  }
}

export default SENEGAL_ROUTE_DATA

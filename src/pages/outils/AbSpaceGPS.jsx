import { useState, useEffect, useRef } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents, Circle } from 'react-leaflet'
import { divIcon } from 'leaflet'
import 'leaflet/dist/leaflet.css'
import ToolHero from '../../components/ToolHero'
import ToolInfoPanel from '../../components/ToolInfoPanel'
import TokenCounter from '../../components/TokenCounter'
import ToolIcon from '../../components/ToolIcon'
import { callGroq } from '../../lib/groqClient'
import { fetchGooglePlacesByCategory } from '../../services/abspaceRealtime'
import PlaceReport from '../../components/abavie/PlaceReport'

// ─── Constants ────────────────────────────────────────────────────────────────
const DAKAR = { lat: 14.6937, lng: -17.4441 }
const OVERPASS = 'https://overpass-api.de/api/interpreter'
const NOM_HEADERS = { 'Accept-Language': 'fr,en', 'User-Agent': 'AbZone-ABAWI/1.0' }

const CATEGORIES = [
  { id: 'restaurant', label: 'Restaurants',  icon: '🍽️', color: '#F97316', tags: [['amenity', 'restaurant|cafe|fast_food|bar|bakery|food_court']] },
  { id: 'sante',      label: 'Santé',        icon: '🏥', color: '#EF4444', tags: [['amenity', 'hospital|clinic|pharmacy|dentist|doctors|health_centre']] },
  { id: 'commerce',   label: 'Commerces',    icon: '🛒', color: '#8B5CF6', tags: [['shop', '.*'], ['amenity', 'marketplace|supermarket|convenience']] },
  { id: 'services',   label: 'Services',     icon: '🏦', color: '#3B82F6', tags: [['amenity', 'bank|atm|post_office|bureau_de_change|money_transfer']] },
  { id: 'transport',  label: 'Transport',    icon: '🚌', color: '#10B981', tags: [['amenity', 'bus_station|taxi|fuel|parking']] },
  { id: 'education',  label: 'Éducation',    icon: '🎓', color: '#F59E0B', tags: [['amenity', 'school|university|college|library|kindergarten']] },
  { id: 'hotel',      label: 'Hébergement',  icon: '🏨', color: '#6366F1', tags: [['tourism', 'hotel|hostel|guest_house|motel']] },
  { id: 'securite',   label: 'Sécurité',     icon: '👮', color: '#14B8A6', tags: [['amenity', 'police|fire_station|courthouse']] },
  { id: 'entreprises',label: 'Entreprises',  icon: '🏢', color: '#475569', tags: [['office', '.*']] },
  { id: 'loisirs',    label: 'Loisirs',      icon: '🎭', color: '#EC4899', tags: [['leisure', 'park|stadium|cinema|sports_centre'], ['tourism', 'attraction|museum|viewpoint']] },
  { id: 'culte',      label: 'Culte',        icon: '🕌', color: '#A78BFA', tags: [['amenity', 'place_of_worship']] },
  { id: 'monuments',  label: 'Monuments',    icon: '🏛️', color: '#D97706', tags: [['historic', '.*'], ['building', 'monument|cathedral|castle|ruins'], ['man_made', 'monument|obelisk|water_tower|lighthouse|tower'], ['tourism', 'monument']] },
  { id: 'logement',   label: 'Logement',     icon: '🏠', color: '#78716C', tags: [['building', 'apartments|house|residential'], ['landuse', 'residential']] },
  { id: 'industrie',  label: 'Industrie',    icon: '🏗️', color: '#64748B', tags: [['landuse', 'commercial|industrial'], ['building', 'commercial|industrial|warehouse']] },
]

const RADII = [
  { v: 300, l: '300m' }, { v: 500, l: '500m' },
  { v: 1000, l: '1 km' }, { v: 2000, l: '2 km' }, { v: 5000, l: '5 km' },
]

// ─── Base de données des quartiers — données réelles et granulaires ──────────
const QUARTIERS = [
  // ═══════════════════════════════════════════════════════════════════════════
  // DAKAR — Commune
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'plateau', nom: 'Plateau', ville: 'Dakar', lat: 14.6928, lng: -17.4467,
    type: 'Centre administratif & commercial',
    population: '~35 000 habitants',
    superficie: '~1.5 km²',
    ambiance: 'Bourgeois, administratif, animé en journée, calme le soir. Bâtiments hausmanniens, larges avenues, jardins publics. Cœur politique et économique du Sénégal.',
    securite: 'Élevée — Présence policière renforcée, éclairage public, zone très fréquentée.',
    transport: 'Bus DDD, minicars, taxis, future station TER (Gare de Dakar). Piéton très praticable.',
    histoire: [
      'Créé en 1857 lors de l\'installation définitive des Français sur la presqu\'île du Cap-Vert.',
      'Ancien quartier européen de la ville coloniale, avec plan en damier et larges boulevards.',
      'Le Palais de la République, construit dans les années 1900, abrite la présidence depuis l\'indépendance en 1960.',
      'La Place de l\'Indépendance fut le théâtre des cérémonies historiques de 1960.',
      'Le Sandaga, ancien marché colonial, était le centre commercial de l\'AOF.',
    ],
    figures: [
      { nom: 'Léopold Sédar Senghor', role: 'Premier président du Sénégal, poète', lien: 'A vécu et travaillé au Plateau pendant sa présidence' },
      { nom: 'Aimé Césaire', role: 'Poète et homme politique martiniquais', lien: 'Résident fréquent lors de ses visites à Dakar' },
      { nom: 'Blaise Diagne', role: 'Premier député africain à l\'Assemblée française', lien: 'A œuvré pour la construction de bâtiments administratifs' },
    ],
    evenements: [
      { date: '4 avril 1960', nom: 'Indépendance du Sénégal', desc: 'Cérémonie officielle sur la Place de l\'Indépendance avec Léopold Sédar Senghor.' },
      { date: '1966', nom: 'Festival mondial des Arts nègres', desc: 'Organisé au Palais de la République et dans les rues du Plateau, événement culturel majeur de la diaspora africaine.' },
      { date: '1988', nom: 'Révolte des étudiants', desc: 'Manifestations sur le Plateau contre la loi sur l\'enseignement supérieur.' },
    ],
    landmarks: [
      { nom: 'Palais de la République', desc: 'Résidence officielle du Président, architecture néo-soudanaise' },
      { nom: 'Hôtel de Ville de Dakar', desc: 'Bâtiment historique de style colonial' },
      { nom: 'Cathédrale du Souvenir africain', desc: 'Église catholique majeure avec architecture moderne africaine' },
      { nom: 'Place de l\'Indépendance', desc: 'Cœur symbolique de la nation' },
      { nom: 'Ancien Palais de Justice', desc: 'Architecture coloniale imposante' },
      { nom: 'Bibliothèque nationale', desc: 'Fondée en 1945, riche collection sur l\'Afrique de l\'Ouest' },
    ],
    commerces: [
      { nom: 'Sea Plaza', type: 'Centre commercial', desc: 'Haut de gamme, boutiques internationales, restaurants vue mer' },
      { nom: 'Sandaga', type: 'Marché', desc: 'Marché historique, tissus, artisanat, épices' },
      { nom: 'Café de Rome', type: 'Restaurant', desc: 'Institution dakaroise depuis les années 30' },
      { nom: 'Le Ngor', type: 'Restaurant', desc: 'Cuisine sénégalaise raffinée' },
    ],
    quartiersVoisins: ['Médina', 'Fann-Point E-Amitié', 'Biscuiterie'],
  },
  {
    id: 'medina', nom: 'Médina', ville: 'Dakar', lat: 14.6865, lng: -17.4389,
    type: 'Quartier populaire historique',
    population: '~150 000 habitants',
    superficie: '~2.5 km²',
    ambiance: 'Très animé, populaire, dense, commerçant. Ruelles étroites, maisons colorées, vie de quartier intense. Parfait pour découvrir le Sénégal authentique.',
    securite: 'Moyenne — Quartier populaire sûr la journée, éviter certaines ruelles isolées la nuit. Solidarité communautaire forte.',
    transport: 'Minicars (ndjanjans), bus, taxis. Très bien desservi mais congesté aux heures de pointe.',
    histoire: [
      'Fondée en 1914 comme quartier indigène pour héberger la population africaine chassée du Plateau.',
      'Conçue sur un plan en damier par l\'administration coloniale, mais rapidement densifiée par les habitants.',
      'Berceau du mouvement syndical et politique sénégalais dans les années 1940-50.',
      'Le stade Demba Diop, construit en 1963, a accueilli les plus grands matchs et concerts du pays.',
      'Théâtre Daniel-Sorano inauguré en 1965, pôle culturel majeur de l\'Afrique francophone.',
    ],
    figures: [
      { nom: 'Blaise Diagne', role: 'Maire de Dakar 1920-1934', lien: 'A œuvré à l\'aménagement des quartiers populaires' },
      { nom: 'Lamine Guèye', role: 'Premier maire africain de Dakar', lien: 'Figure politique majeure du quartier' },
      { nom: 'Youssou N\'Dour', role: 'Musicien mondial', lien: 'A grandi à la Médina, a commencé à chanter dans les ruelles' },
      { nom: 'Wally Seck', role: 'Star de la mbalax', lien: 'Né et formé à la Médina' },
      { nom: 'Papa Djibi', role: 'Lutteur légendaire', lien: 'Ariste de la lutte sénégalaise, symbole du quartier' },
    ],
    evenements: [
      { date: '1914', nom: 'Création de la Médina', desc: 'Décret officiel établissant le quartier indigène de Dakar.' },
      { date: '1963', nom: 'Inauguration du stade Demba Diop', desc: 'Devenu le temple du sport et de la musique sénégalaise.' },
      { date: '1988', nom: 'Émeutes du « Ni Waaw Waaw »', desc: 'Soulèvement populaire contre la vie chère et le chômage.' },
      { date: 'Annuel', nom: 'Korité & Tabaski', desc: 'Célébrations massives dans les rues, ambiance festive unique.' },
    ],
    landmarks: [
      { nom: 'Stade Demba Diop', desc: 'Temple du football et des grands concerts (40 000 places)' },
      { nom: 'Théâtre Daniel-Sorano', desc: 'Scène nationale, danse, théâtre, musique' },
      { nom: 'Marché Tilène', desc: 'Marché traditionnel très coloré' },
      { nom: 'Mosquée de la Médina', desc: 'Grande mosquée du quartier, centre religieux' },
      { nom: 'École Blaise-Diagne', desc: 'Ancienne école des chefs de file de l\'indépendance' },
    ],
    commerces: [
      { nom: 'Marché Tilène', type: 'Marché', desc: 'Tissus wax, produits locaux, artisanat' },
      { nom: 'Cafteria Khadim', type: 'Restaurant', desc: 'Thieboudienne traditionnelle' },
      { nom: 'Boulangerie Jaune', type: 'Boulangerie', desc: 'Pain chaud et café dès 5h du matin' },
      { nom: 'Librairie Clairafrique', type: 'Librairie', desc: 'Livres africains et scolaires' },
    ],
    quartiersVoisins: ['Plateau', 'Colobane', 'Fass'],
  },
  {
    id: 'almadies', nom: 'Les Almadies', ville: 'Dakar', lat: 14.7443, lng: -17.5184,
    type: 'Quartier résidentiel haut de gamme & touristique',
    population: '~25 000 habitants',
    superficie: '~5 km²',
    ambiance: 'Chic, calme, verdoyant, bord de mer. Résidences modernes, hôtels de luxe, embassades, restaurants branchés. Ambiance cosmopolite et décontractée.',
    securite: 'Très élevée — Quartier diplomatique, nombreuses ambassades, sécurité privée renforcée, éclairage optimal.',
    transport: 'Taxis, VTC (Yango, Heetch), bus DDD ligne 8. Vélo et trottinette praticables sur la corniche.',
    histoire: [
      'Ancien village de pêcheurs lébou, traditionnellement dédié à la pêche et à la culture du mil.',
      'Développé à partir des années 1970 comme zone résidentielle pour la classe moyenne et les expatriés.',
      'Le phare des Mamelles, construit en 1864, est l\'un des plus anciens d\'Afrique de l\'Ouest.',
      'Le Monument de la Renaissance africaine, inauguré en 2010, visible depuis tout le quartier.',
      'La Pointe des Almadies est le point le plus occidental du continent africain.',
    ],
    figures: [
      { nom: 'Abdoulaye Wade', role: 'Ancien Président', lien: 'Résidence secondaire dans le quartier, projet du Monument' },
      { nom: 'Pierre Cardin', role: 'Couturier français', lien: 'A acheté une île aux Almadies (île de la Madeleine)' },
      { nom: 'Youssou N\'Dour', role: 'Musicien', lien: 'Propriétaire de la villa de Thiossane, lieu de concerts privés' },
      { nom: 'Akon', role: 'Chanteur américano-sénégalais', lien: 'A investi dans des projets immobiliers aux Almadies' },
    ],
    evenements: [
      { date: '1864', nom: 'Construction du phare des Mamelles', desc: 'Stratégique pour la navigation vers le port de Dakar.' },
      { date: '3 avril 2010', nom: 'Inauguration du Monument de la Renaissance', desc: 'Statue de 49m dédiée à l\'Afrique émergente, polémique et fierté nationale.' },
      { date: 'Annuel', nom: 'Dakar Surf Festival', desc: 'Compétitions de surf sur les spots de Ngor et Yoff.' },
      { date: 'Juillet 2022', nom: 'Dakar New African Production', desc: 'Événement culturel majeur rassemblant créateurs africains.' },
    ],
    landmarks: [
      { nom: 'Monument de la Renaissance africaine', desc: 'Statue colossale de 49m sur la colline des Mamelles' },
      { nom: 'Phare des Mamelles', desc: 'Plus ancien phare d\'Afrique de l\'Ouest, vue panoramique' },
      { nom: 'Pointe des Almadies', desc: 'Pointe le plus occidentale de l\'Afrique' },
      { nom: 'Plage des Almadies', desc: 'Spot de surf et détente prisé' },
      { nom: 'Village des Arts', desc: 'Résidence d\'artistes et ateliers ouverts' },
    ],
    commerces: [
      { nom: 'Lagon 1', type: 'Restaurant', desc: 'Poisson grillé les pieds dans l\'eau' },
      { nom: 'Restaurant Le Patio', type: 'Restaurant', desc: 'Fine dining, cuisine française et locale fusion' },
      { nom: 'Sea Plaza', type: 'Centre commercial', desc: 'Luxury mall à 5 min' },
      { nom: 'Épicerie fine La Pomme d\'Api', type: 'Épicerie', desc: 'Produits importés et bio' },
    ],
    quartiersVoisins: ['Mermoz-Sacré-Cœur', 'Yoff', 'Ngor'],
  },
  {
    id: 'yoff', nom: 'Yoff', ville: 'Dakar', lat: 14.7515, lng: -17.4738,
    type: 'Quartier populaire & village lébou traditionnel',
    population: '~120 000 habitants',
    superficie: '~8 km²',
    ambiance: 'Populaire, authentique, vivant, en bord de mer. Contrasté : plages touristiques côté Almadies, village traditionnel côté intérieur.',
    securite: 'Moyenne à bonne — Solidarité de village forte. Zones côtières très sûres. Éviter de se promener seul tard dans les zones éloignées de la plage.',
    transport: 'Bus DDD, minicars, taxis, future station TER. Axes principaux bien desservis.',
    histoire: [
      'Ancien royaume lébou fondé au XVe siècle, avant l\'arrivée des Européens sur la presqu\'île.',
      'Le cimetière de Yoff est l\'un des plus anciens et plus sacrés du Sénégal, carré musulman emblématique.',
      'Le soufisme y est très présent : la zaouïa de Yoff est un centre de pèlerinage.',
      'La plage de Yoff-Tonghor est historiquement le lieu d\'atterrissage des avions avant l\'aéroport.',
      'Résistance acharnée contre les Français au XIXe siècle avant l\'annexion de la presqu\'île.',
    ],
    figures: [
      { nom: 'Diorum Thiaw', role: 'Chef religieux lébou', lien: 'Figure spirituelle du village, zaouïa de Yoff' },
      { nom: 'Lamine Diakhate', role: 'Intellectuel et journaliste', lien: 'Né à Yoff, figure de la presse sénégalaise' },
      { nom: 'Akon', role: 'Chanteur', lien: 'Originaire de Yoff, a grandi entre le Sénégal et les USA' },
    ],
    evenements: [
      { date: 'XVIIe siècle', nom: 'Fondation du village', desc: 'Installation des clans lébous sur la côte nord de la presqu\'île.' },
      { date: 'Annuel (juillet)', nom: 'Magal de Yoff', desc: 'Grand pèlerinage religieux, rassemblement de dizaines de milliers de fidèles.' },
      { date: 'Annuel', nom: 'Korité à Yoff', desc: 'Célébration traditionnelle sur la plage, prières et festins communautaires.' },
    ],
    landmarks: [
      { nom: 'Cimetière de Yoff', desc: 'Cimetière historique musulman, un des plus anciens du pays' },
      { nom: 'Zaouïa de Yoff', desc: 'Centre soufi et école coranique' },
      { nom: 'Plage de Yoff-Tonghor', desc: 'Longue plage populaire, spot de surf' },
      { nom: 'Lac rose (Retba) proche', desc: 'Visible à l\'horizon, ancienne source de sel' },
    ],
    commerces: [
      { nom: 'Chez Loutcha', type: 'Restaurant', desc: 'Poisson frais grillé, institution dakaroise' },
      { nom: 'Marché de Yoff', type: 'Marché', desc: 'Marché local animé' },
      { nom: 'Boutiques de surf', type: 'Commerce', desc: 'Location de planches et cours' },
    ],
    quartiersVoisins: ['Les Almadies', 'Mermoz-Sacré-Cœur', 'Cambérène'],
  },
  {
    id: 'fann', nom: 'Fann-Point E-Amitié', ville: 'Dakar', lat: 14.6995, lng: -17.4568,
    type: 'Quartier résidentiel & universitaire',
    population: '~80 000 habitants',
    superficie: '~6 km²',
    ambiance: 'Résidentiel, verdoyant, étudiant, côtier. Mélange d\'universités, de résidences cossues et de plages. Ambiance intellectuelle et détendue.',
    securite: 'Bonne — Zones universitaires bien éclairées, résidences avec gardien. Quelques zones isolées à éviter la nuit.',
    transport: 'Bus DDD, minicars, taxis. Accès facile au centre-ville. Vélos très pratiques dans ce quartier plat.',
    histoire: [
      'Aménagé dans les années 1950-60 comme quartier résidentiel pour les cadres de l\'administration et de l\'enseignement.',
      'L\'UCAD (Université Cheikh Anta Diop), fondée en 1957, en fait le cerveau intellectuel du pays.',
      'Le village de Fann existait bien avant la colonisation, berceau de pêcheurs lébous.',
      'Le stade Iba-Mar-Diop, construit dans les années 60, a formé de grands athlètes sénégalais.',
      'Le théâtre national Daniel-Sorano y est initialement implanté avant son transfert à la Médina.',
    ],
    figures: [
      { nom: 'Cheikh Anta Diop', role: 'Historien et scientifique', lien: 'A donné son nom à l\'université, figure de l\'éveil africain' },
      { nom: 'Souleymane Bachir Diagne', role: 'Philosophe', lien: 'Professeur à l\'UCAD, figure de la pensée sénégalaise' },
      { nom: 'Fatou Diome', role: 'Écrivaine', lien: 'A étudié à l\'UCAD, a vécu à Fann' },
      { nom: 'Ousmane Sembène', role: 'Père du cinéma africain', lien: 'Fréquentait le quartier et l\'université' },
    ],
    evenements: [
      { date: '1957', nom: 'Fondation de l\'UCAD', desc: 'Université principale du Sénégal et de l\'Afrique de l\'Ouest francophone.' },
      { date: 'Annuel', nom: 'Campus Festival', desc: 'Festival culturel et musical de l\'université, rassemble 10 000+ étudiants.' },
      { date: 'Mai 1968', nom: 'Mouvement étudiant', desc: 'Grèves et manifestations étudiantes pour la démocratie et l\'afrocentricité.' },
    ],
    landmarks: [
      { nom: 'UCAD — Université Cheikh Anta Diop', desc: 'Plus grande université de l\'Afrique de l\'Ouest, campus historique' },
      { nom: 'Stade Iba-Mar-Diop', desc: 'Stade universitaire et centre de formation' },
      { nom: 'Plage de la Voile d\'Or', desc: 'Plage tranquille près de l\'université' },
      { nom: 'Institut Fondamental d\'Afrique Noire (IFAN)', desc: 'Musée et centre de recherche historique majeur' },
      { nom: 'Jardin botanique de l\'UCAD', desc: 'Collection botanique unique en Afrique de l\'Ouest' },
    ],
    commerces: [
      { nom: 'Patte d\'Oie', type: 'Restaurant', desc: 'Rôtisserie institutionnelle depuis 40 ans' },
      { nom: 'Librairie du Temple', type: 'Librairie', desc: 'Livres universitaires et africains' },
      { nom: 'Pharmacie Fann', type: 'Santé', desc: 'Grande pharmacie du quartier, ouverte 24h/24' },
    ],
    quartiersVoisins: ['Plateau', 'Médina', 'Mermoz-Sacré-Cœur'],
  },
  {
    id: 'ouakam', nom: 'Ouakam', ville: 'Dakar', lat: 14.7159, lng: -17.4665,
    type: 'Quartier aéroportuaire & résidentiel',
    population: '~60 000 habitants',
    superficie: '~5 km²',
    ambiance: 'Aéroportuaire, populaire, résidentiel. Autour de l\'aéroport Léopold-Sédar-Senghor, contrastes entre zones résidentielles et zones populaires.',
    securite: 'Bonne — Zone aéroportuaire sous surveillance, résidences sécurisées. Quelques zones populaires à surveiller.',
    transport: 'Bus DDD, minicars, taxis. Proche de l\'aéroport. Accès rapide aux Almadies et au centre.',
    histoire: [
      'Ancien village lébou, site de résistance contre la pénétration française au XIXe siècle.',
      'L\'aéroport de Ouakam, ouvert en 1944, fut l\'aéroport international principal jusqu\'en 2017 (remplacé par Diass).',
      'Base aérienne française de Ouakam, longtemps présente, a quitté le site en 2011.',
      'Le village des pêcheurs de Ouakam conserve des traditions séculaires.',
    ],
    figures: [
      { nom: 'Léopold Sédar Senghor', role: 'Président', lien: 'L\'aéroport porte son nom, figure emblématique' },
      { nom: 'Cheikh Béthio Thioune', role: 'Chef religieux', lien: 'Mouride influent, zaouïa proche d\'Ouakam' },
    ],
    evenements: [
      { date: '1944', nom: 'Ouverture de l\'aéroport', desc: 'Aéroport international principal du Sénégal pendant 73 ans.' },
      { date: '2011', nom: 'Départ des forces françaises', desc: 'Fin de la présence militaire française sur la base aérienne.' },
    ],
    landmarks: [
      { nom: 'Ancien aéroport LSS', desc: 'Aéroport historique, réaménagé en zone événementielle' },
      { nom: 'Village de pêcheurs', desc: 'Port traditionnel artisanal' },
      { nom: 'Base militaire (anciennement française)', desc: 'Site historique de la défense aérienne' },
    ],
    commerces: [
      { nom: 'Marché de Ouakam', type: 'Marché', desc: 'Marché populaire' },
      { nom: 'Station-service Total', type: 'Services', desc: 'Zone de services proche de l\'aéroport' },
    ],
    quartiersVoisins: ['Mermoz-Sacré-Cœur', 'Les Almadies', 'Yoff'],
  },
  {
    id: 'mermoz', nom: 'Mermoz-Sacré-Cœur', ville: 'Dakar', lat: 14.7083, lng: -17.4667,
    type: 'Quartier résidentiel & administratif',
    population: '~70 000 habitants',
    superficie: '~4.5 km²',
    ambiance: 'Résidentiel, administratif, familial. Grandes avenues, résidences de fonction, écoles, jardins. Calme et arboré.',
    securite: 'Bonne à très bonne — Zone résidentielle avec sécurité. Ambassades et résidences de fonction à proximité.',
    transport: 'Bus DDD, minicars, taxis. Bien desservi, mais moins dense que le centre.',
    histoire: [
      'Aménagé dans les années 1950 pour accueillir les cadres supérieurs de l\'administration coloniale puis de l\'État sénégalais.',
      'Nommé en partie en référence à Jean Mermoz, aviateur français pionnier des lignes aériennes vers l\'Afrique du Sud.',
      'Le Sacré-Cœur est un ancien quartier de villas coloniales.',
    ],
    figures: [
      { nom: 'Jean Mermoz', role: 'Aviateur', lien: 'Pionnier de l\'aviation sur la route de l\'Afrique du Sud' },
    ],
    evenements: [
      { date: 'Annuel', nom: 'Fêtes de fin d\'année', desc: 'Quartier très animé à Noël et au Nouvel An.' },
    ],
    landmarks: [
      { nom: 'Église du Sacré-Cœur', desc: 'Église catholique majeure du quartier' },
      { nom: 'Parc forestier de Mermoz', desc: 'Espace vert et jogging très prisé' },
      { nom: 'Lycée Jean-Mermoz', desc: 'Prestigieux lycée public de Dakar' },
    ],
    commerces: [
      { nom: 'Patisserie Mermoz', type: 'Pâtisserie', desc: 'Gâteaux et viennoiseries réputés' },
      { nom: 'Supérette du Coin', type: 'Commerce', desc: 'Alimentation de proximité' },
    ],
    quartiersVoisins: ['Fann-Point E-Amitié', 'Ouakam', 'Les Almadies'],
  },
  {
    id: 'colobane', nom: 'Colobane', ville: 'Dakar', lat: 14.6795, lng: -17.4335,
    type: 'Quartier populaire & commercial',
    population: '~90 000 habitants',
    superficie: '~2 km²',
    ambiance: 'Populaire, très dense, commercial, vivant. Un des quartiers les plus animés de Dakar, avec le marché Colobane et ses rues bondées.',
    securite: 'Moyenne — Très fréquenté le jour, vigilance le soir. Marché très sûr car toujours peuplé.',
    transport: 'Bus, minicars, taxis. Nœud de transport majeur, très bien desservi.',
    histoire: [
      'Le marché Colobane est l\'un des plus anciens de Dakar, existant depuis l\'époque coloniale.',
      'Berceau de la petite entreprise et du commerce informel à Dakar.',
      'Le terminus des bus interurbains y était situé, en faisant la porte d\'entrée de la capitale.',
    ],
    figures: [
      { nom: 'Cheikh Anta Diop', role: 'Historien', lien: 'A fréquenté le quartier pour ses recherches sur le commerce africain' },
    ],
    evenements: [
      { date: 'Annuel', nom: 'Foire de Colobane', desc: 'Grande foire commerciale avant la Tabaski.' },
    ],
    landmarks: [
      { nom: 'Marché Colobane', desc: 'L\'un des plus grands marchés de Dakar, de tout se trouve ici' },
      { nom: 'Gare routière', desc: 'Ancien terminus des lignes interurbaines' },
    ],
    commerces: [
      { nom: 'Marché Colobane', type: 'Marché', desc: 'Vêtements, électronique, épices, bric-à-brac' },
      { nom: 'Boutiques de tissus', type: 'Commerce', desc: 'Wax et tissus africains à prix cassé' },
    ],
    quartiersVoisins: ['Médina', 'Grand-Dakar', 'Fass'],
  },
  {
    id: 'fass', nom: 'Fass-Colobane-Fann', ville: 'Dakar', lat: 14.6832, lng: -17.4421,
    type: 'Quartier populaire & culturel',
    population: '~100 000 habitants',
    superficie: '~3 km²',
    ambiance: 'Très populaire, dense, culturel. Rues animées, maisons colorées, beaucoup de vie de quartier. Foyer de la musique sénégalaise.',
    securite: 'Moyenne — Vigilance recommandée la nuit. Solidarité communautaire très forte.',
    transport: 'Bus, minicars, taxis. Desservi par plusieurs lignes DDD.',
    histoire: [
      'Fass est historiquement un quartier de pêcheurs lébous.',
      'Devenu un foyer de la musique sénégalaise, notamment le mbalax et le jazz.',
      'De nombreux musiciens célèbres y ont grandi ou y vivent.',
    ],
    figures: [
      { nom: 'Youssou N\'Dour', role: 'Superstar de la musique', lien: 'A grandi à Fass, y possède encore des liens familiaux' },
      { nom: 'Thione Seck', role: 'Chanteur légendaire', lien: 'Résident de Fass, figure du mbalax' },
      { nom: 'Ismaël Lô', role: 'Chanteur et guitariste', lien: 'A grandi dans le quartier' },
    ],
    evenements: [
      { date: 'Annuel', nom: 'Concerts de rue', desc: 'Nombreux concerts spontanés et fêtes de quartier.' },
    ],
    landmarks: [
      { nom: 'Salle de concert local', desc: 'Scène de musique live' },
      { nom: 'Port de pêche artisanal', desc: 'Pêche traditionnelle' },
    ],
    commerces: [
      { nom: 'Dibiteries Fass', type: 'Restaurant', desc: 'Les meilleures dibi (mouton grillé) de Dakar' },
    ],
    quartiersVoisins: ['Colobane', 'Médina', 'Grand-Dakar'],
  },
  {
    id: 'biscuiterie', nom: 'Biscuiterie', ville: 'Dakar', lat: 14.7045, lng: -17.4312,
    type: 'Quartier industriel & portuaire',
    population: '~20 000 habitants',
    superficie: '~3 km²',
    ambiance: 'Industriel, portuaire, en mutation. Zone portuaire majeure, entrepôts, mais aussi projets de réaménagement urbain.',
    securite: 'Moyenne — Zone portuaire surveillée, mais quartiers résidentiels adjacents variés.',
    transport: 'Bus, camions, taxis. Port de Dakar accessible. Route du front de mer.',
    histoire: [
      'Le port de Dakar, construit à partir de 1862, en fait la tête de pont économique du Sénégal.',
      'La zone industrielle abrite entrepôts, usines de transformation et industries portuaires.',
      'Projet de réaménagement urbain pour transformer la zone industrielle en quartier mixte.',
    ],
    figures: [],
    evenements: [],
    landmarks: [
      { nom: 'Port autonome de Dakar', desc: 'Plus grand port d\'Afrique de l\'Ouest' },
      { nom: 'Zone industrielle', desc: 'Entrepôts et industries' },
    ],
    commerces: [],
    quartiersVoisins: ['Plateau', 'Grand-Dakar', 'Gorée'],
  },
  {
    id: 'guediawaye', nom: 'Guédiawaye', ville: 'Dakar', lat: 14.7745, lng: -17.4012,
    type: 'Commune dakaroise populaire',
    population: '~350 000 habitants',
    superficie: '~12 km²',
    ambiance: 'Très populaire, dense, jeune, dynamique. Banlieue pauvre mais pleine de vie, de créativité et de solidarité.',
    securite: 'Moyenne — Solidarité communautaire très forte. Quelques zones sensibles.',
    transport: 'Bus, minicars, taxis. Ligne de train vers Dakar.',
    histoire: [
      'Créée dans les années 1960 pour absorber l\'exode rural vers Dakar.',
      'L\'un des premiers grands quartiers spontanés du Sénégal, avec une architecture auto-construite.',
      'Devenu un haut lieu de la lutte contre le sous-développement et pour l\'émergence citoyenne.',
    ],
    figures: [
      { nom: 'Alioune Sall', role: 'Politicien', lien: 'Ancien maire de Guédiawaye' },
    ],
    evenements: [
      { date: 'Annuel', nom: 'Festival de Guédiawaye', desc: 'Événement culturel et sportif majeur.' },
    ],
    landmarks: [
      { nom: 'Stade Amadou Barry', desc: 'Stade principal de la commune' },
      { nom: 'Mosquée centrale', desc: 'Grande mosquée du quartier' },
    ],
    commerces: [
      { nom: 'Marché de Guédiawaye', type: 'Marché', desc: 'Grand marché populaire' },
    ],
    quartiersVoisins: ['Pikine', 'Thiaroye', 'Yoff'],
  },
  {
    id: 'pikine', nom: 'Pikine', ville: 'Dakar', lat: 14.7628, lng: -17.3905,
    type: 'Commune dakaroise populaire',
    population: '~1 200 000 habitants',
    superficie: '~15 km²',
    ambiance: 'Populaire, très dense, jeune, créatif. Plus grande commune de Dakar, mélange de quartiers spontanés et de zones plus organisées.',
    securite: 'Moyenne — Solidarité communautaire très forte. Zones sensibles existent mais la vie y est chaleureuse.',
    transport: 'Bus, minicars, taxis, train. Très bien desservi.',
    histoire: [
      'Créée en 1952 comme zone de relogement des populations déplacées par les inondations de Guédiawaye.',
      'Est devenue la plus grande commune du Sénégal avec plus d\'un million d\'habitants.',
      'Haut lieu de la création musicale : hip-hop, mbalax, reggae.',
      'Les luttes de la classe populaire sénégalaise s\'y expriment fortement.',
    ],
    figures: [
      { nom: 'Didier Awadi', role: 'Rappeur', lien: 'Figure du hip-hop sénégalais, a grandi à Pikine' },
      { nom: 'Positive Black Soul (PBS)', role: 'Groupe de rap', lien: 'Formé à Pikine, pionnier du rap africain' },
      { nom: 'Niagass', role: 'Chanteur', lien: 'Star du mbalax, originaire de Pikine' },
    ],
    evenements: [
      { date: '1952', nom: 'Création de Pikine', desc: 'Zone de relogement devenue plus grande commune du Sénégal.' },
      { date: 'Annuel', nom: 'Festival hip-hop de Pikine', desc: 'Rassemblement des artistes urbains du pays.' },
    ],
    landmarks: [
      { nom: 'Hôpital de Pikine', desc: 'Principal centre de santé de la banlieue' },
      { nom: 'Stade Alassane Djigo', desc: 'Stade de football du quartier' },
    ],
    commerces: [
      { nom: 'Marché de Pikine', type: 'Marché', desc: 'L\'un des plus grands marchés de la région' },
    ],
    quartiersVoisins: ['Guédiawaye', 'Thiaroye', 'Rufisque'],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // GORÉE — Île historique
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'goree', nom: 'Gorée', ville: 'Gorée', lat: 14.6683, lng: -17.4014,
    type: 'Île historique UNESCO',
    population: '~1 800 habitants',
    superficie: '0.28 km²',
    ambiance: 'Paisible, touristique, historique, intemporel. Ruelles pavées, maisons coloniales colorées, absence de voitures. Atmosphère unique au monde.',
    securite: 'Très élevée — Île sans voiture, surveillance touristique, très sûre jour et nuit.',
    transport: 'Bateau depuis le port de Dakar (20 min), navettes toutes les 30 min. Aucun véhicule sur l\'île.',
    histoire: [
      'Découverte par les Portugais en 1444, Gorée devient le plus grand centre de traite négrière de la côte ouest-africaine.',
      'La Maison des Esclaves, construite en 1776, symbole de la traite négrière avec sa « Porte du Voyage sans Retour ».',
      'Successivement portugaise, néerlandaise, britannique et française, l\'île est un carrefour colonial.',
      'Classée au patrimoine mondial de l\'UNESCO en 1978.',
      'Devenue haut lieu de mémoire : visites de Barack Obama, Nelson Mandela, Pope John Paul II…',
    ],
    figures: [
      { nom: 'Joseph Ndiaye', role: 'Conservateur de la Maison des Esclaves', lien: 'Figure emblématique, a accueilli des millions de visiteurs' },
      { nom: 'Boubacar Joseph Ndiaye', role: 'Historien', lien: 'A œuvré pour la mémoire de la traite' },
      { nom: 'Barack Obama', role: 'Président des États-Unis', lien: 'A visité Gorée en 2013 avec sa famille' },
      { nom: 'Pope John Paul II', role: 'Pape', lien: 'A prié sur l\'île en 1992' },
    ],
    evenements: [
      { date: '1444', nom: 'Découverte par les Portugais', desc: 'Début de l\'histoire coloniale et de la traite.' },
      { date: '1776', nom: 'Construction de la Maison des Esclaves', desc: 'Symbole de la déportation de millions d\'Africains.' },
      { date: '1978', nom: 'Classement UNESCO', desc: 'Patrimoine mondial de l\'humanité.' },
      { date: '2013', nom: 'Visite de Barack Obama', desc: 'Moment historique de mémoire et de réconciliation.' },
    ],
    landmarks: [
      { nom: 'Maison des Esclaves', desc: 'Musée-mémorial de la traite négrière' },
      { nom: 'Musée historique du Sénégal', desc: 'Ancien fort français, collection coloniale' },
      { nom: 'Place du Gouvernement', desc: 'Centre de l\'île, bâtiments historiques' },
      { nom: 'Plage de l\'Estrade', desc: 'Plage paisible avec vue sur Dakar' },
      { nom: 'Jardin de l\'École normale', desc: 'Jardin botanique avec vue panoramique' },
    ],
    commerces: [
      { nom: 'Chez Guy', type: 'Restaurant', desc: 'Poisson frais, institution de l\'île' },
      { nom: 'Boutiques d\'artisanat', type: 'Commerce', desc: 'Sculptures, tableaux, souvenirs' },
    ],
    quartiersVoisins: ['Dakar (par bateau)'],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // SAINT-LOUIS
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'saintlouis', nom: 'Saint-Louis (centre historique)', ville: 'Saint-Louis', lat: 16.0179, lng: -16.4896,
    type: 'Ancienne capitale coloniale, UNESCO',
    population: '~260 000 (ville)',
    superficie: '~10 km² (centre)',
    ambiance: 'Coloniale, artistique, paisible, culturelle. Maisons à balcons, rues pavées, pont Faidherbe, bars jazz. Ville la plus française d\'Afrique.',
    securite: 'Bonne — Ville touristique, très sûre la journée, calme la nuit.',
    transport: 'Taxis, calèches, piéton. Pont Faidherbe accessible en voiture.',
    histoire: [
      'Fondée en 1659 par les Français, première ville européenne d\'Afrique de l\'Ouest.',
      'Capitale de l\'AOF (Afrique occidentale française) de 1895 à 1902, puis de la Mauritanie jusqu\'en 1957.',
      'Le pont Faidherbe, construit par Gustave Eiffel en 1897, symbole de la ville.',
      'Classée au patrimoine mondial de l\'UNESCO en 2000.',
      'Festival international de jazz depuis 1993, plus grand événement jazz d\'Afrique.',
    ],
    figures: [
      { nom: 'Louis Faidherbe', role: 'Gouverneur', lien: 'A modernisé la ville et construit le pont' },
      { nom: 'Léopold Sédar Senghor', role: 'Président & poète', lien: 'Né à Joal, mais a étudié et vécu à Saint-Louis' },
      { nom: 'Aminata Sow Fall', role: 'Écrivaine', lien: 'Résidente de Saint-Louis, figure des lettres africaines' },
    ],
    evenements: [
      { date: '1659', nom: 'Fondation de Saint-Louis', desc: 'Premier comptoir français permanent en Afrique noire.' },
      { date: '1897', nom: 'Pont Faidherbe', desc: 'Construit par Gustave Eiffel, lien entre l\'île et le continent.' },
      { date: '1993', nom: 'Festival de jazz', desc: 'Rend Saint-Louis la capitale du jazz africain.' },
    ],
    landmarks: [
      { nom: 'Pont Faidherbe', desc: 'Pont métallique de Gustave Eiffel' },
      { nom: 'Hôtel de Ville', desc: 'Architecture coloniale majeure' },
      { nom: 'Quartier de Guet Ndar', desc: 'Village de pêcheurs coloré sur la langue de Barbarie' },
      { nom: 'Parc national de la Langue de Barbarie', desc: 'Réserve naturelle et ornithologique' },
    ],
    commerces: [
      { nom: 'La Maison Blanche', type: 'Hôtel-restaurant', desc: 'Colonial chic, rooftop sur le fleuve' },
      { nom: 'Jazz clubs', type: 'Bar', desc: 'Scènes jazz live tous les soirs' },
    ],
    quartiersVoisins: ['Ndar Tout', 'Sor', 'Léona'],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // THIÈS
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'thies', nom: 'Thiès (centre)', ville: 'Thiès', lat: 14.7910, lng: -16.9256,
    type: 'Ville industrielle et universitaire',
    population: '~350 000 habitants',
    superficie: '~20 km²',
    ambiance: 'Industrielle, estudiantine, commerçante. Troisième ville du Sénégal, dynamique, moins touristique mais très authentique.',
    securite: 'Bonne — Ville de province sûre, vigilance classique.',
    transport: 'Train TER Dakar-Diass, bus interurbains, taxis. Nœud ferroviaire majeur.',
    histoire: [
      'Fondée au XIXe siècle comme village de pêcheurs wolofs.',
      'Développée par les Français comme centre ferroviaire et militaire.',
      'L\'École nationale des Travaux publics et l\'Université de Thiès en font un pôle d\'enseignement.',
      'Le rail Dakar-Niger, construit au début du XXe siècle, a transformé Thiès en carrefour.',
    ],
    figures: [
      { nom: 'Pape Diouf', role: 'Chanteur', lien: 'Superstar du mbalax, originaire de Thiès' },
    ],
    evenements: [
      { date: 'Annuel', nom: 'Festival des arts de Thiès', desc: 'Rassemblement culturel régional.' },
    ],
    landmarks: [
      { nom: 'Gare de Thiès', desc: 'Gare historique du rail Dakar-Niger' },
      { nom: 'Marché central', desc: 'Grand marché de la région' },
    ],
    commerces: [
      { nom: 'Marché central', type: 'Marché', desc: 'Commerce de proximité et gros' },
    ],
    quartiersVoisins: ['Firdou', 'Thiès-Mbour', 'Touba Thiès'],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // ZIGUINCHOR
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'ziguinchor', nom: 'Ziguinchor (centre)', ville: 'Ziguinchor', lat: 12.5633, lng: -16.2733,
    type: 'Capitale de la Casamance',
    population: '~200 000 habitants',
    superficie: '~15 km²',
    ambiance: 'Tropicale, détendue, verdoyante, culturelle. Capitale de la Casamance, ambiance différente de Dakar, très verte, rythmée par les cultures diola et mandingue.',
    securite: 'Bonne — Capitale régionale sûre, situation sécuritaire stabilisée depuis les Accords de paix de 2004.',
    transport: 'Taxis, bus locaux, pirogues sur le fleuve Casamance. Aéroport national.',
    histoire: [
      'Fondée par les Portugais au XVe siècle sous le nom de Ziguinchor.',
      'Centre commercial de la Casamance, carrefour entre le Sénégal, la Gambie et la Guinée-Bissau.',
      'Théâtre de la crise casamançaise (1982-2004), aujourd\'hui pacifiée.',
      'Le marché central est l\'un des plus colorés du Sénégal.',
    ],
    figures: [
      { nom: 'Augustin Diamacoune Senghor', role: 'Leader du MFDC', lien: 'Figure de la résistance casamançaise' },
      { nom: 'Ablaye Diop', role: 'Musicien', lien: 'Figure de la musique casamançaise' },
    ],
    evenements: [
      { date: '2004', nom: 'Accords de paix', desc: 'Fin de la crise casamançaise, retour à la stabilité.' },
      { date: 'Annuel', nom: 'Festival de Ziguinchor', desc: 'Célébration des cultures casamançaises.' },
    ],
    landmarks: [
      { nom: 'Marché central', desc: 'Marché aux couleurs vives, artisanat local' },
      { nom: 'Fleuve Casamance', desc: 'Promenades en pirogue' },
    ],
    commerces: [
      { nom: 'Restaurant Le Relais', type: 'Restaurant', desc: 'Cuisine casamançaise' },
    ],
    quartiersVoisins: ['Oussouye', 'Bignona', 'Cap Skirring'],
  },
  {
    id: 'sicap-liberte', nom: 'Sicap-Liberté', ville: 'Dakar', lat: 14.7145, lng: -17.4445,
    type: 'Quartier résidentiel & administratif',
    population: '~200 000 habitants',
    superficie: '~8 km²',
    ambiance: 'Résidentiel, administratif, familial. Vastes étendues de villas et d\'immeubles modernes construits par la Société Immobilière du Cap-Vert (Sicap). Quartier calme et arboré, avec de larges avenues et de nombreux espaces verts.',
    securite: 'Bonne à très bonne — Zones résidentielles avec gardien, éclairage public. Quelques zones commerçantes plus animées.',
    transport: 'Bus DDD (lignes 7, 8, 17), minicars, taxis. Desservi par la future ligne du TER. Accès rapide au Plateau et à l\'aéroport.',
    histoire: [
      'Créé dans les années 1950 par la Société Immobilière du Cap-Vert (Sicap) pour désengorger le centre de Dakar.',
      'Premier grand lotissement planifié du Sénégal, avec un tracé en damier et des parcelles standardisées.',
      'Sicap-Liberté a accueilli les premières classes moyennes sénégalaises après l\'indépendance.',
      'Le stade de Sicap-Liberté (actuel stade Lat-Dior) a été un des premiers stades modernes du pays.',
      'Le siège de la Société Nationale des Eaux du Sénégal (SONES) et de nombreuses administrations y sont installés.',
    ],
    figures: [
      { nom: 'Mamadou Dia', role: 'Premier ministre du Sénégal (1960-1962)', lien: 'A résidé à Sicap-Liberté pendant sa carrière politique' },
      { nom: 'Abdou Diouf', role: 'Ancien Président', lien: 'A vécu dans le quartier avant son accession à la présidence' },
      { nom: 'Moustapha Niasse', role: 'Homme politique, ancien Premier ministre', lien: 'Résident de longue date du quartier' },
    ],
    evenements: [
      { date: '1950s', nom: 'Création de Sicap-Liberté', desc: 'Lancement du premier grand lotissement planifié de Dakar par la Sicap.' },
      { date: '1960', nom: 'Indépendance', desc: 'Le quartier devient le foyer de la nouvelle classe politique sénégalaise.' },
      { date: 'Annuel', nom: 'Tournoi de foot de Sicap', desc: 'Tournoi inter-quartiers très suivi, révélateur de jeunes talents.' },
    ],
    landmarks: [
      { nom: 'Stade Lat-Dior', desc: 'Stade municipal, centre de la vie sportive du quartier' },
      { nom: 'Parc de Sicap-Liberté', desc: 'Espace vert public, jogging et promenades familiales' },
      { nom: 'Siège de la SONES', desc: 'Bâtiment administratif emblématique' },
      { nom: 'École primaire de Sicap-Liberté', desc: 'Une des plus grandes écoles publiques de Dakar' },
      { nom: 'Mosquée centrale de Sicap', desc: 'Grande mosquée du quartier, centre religieux majeur' },
    ],
    commerces: [
      { nom: 'Marché de Sicap-Liberté', type: 'Marché', desc: 'Marché couvert, alimentation, tissus, artisanat' },
      { nom: 'Boulangerie Jaune Sicap', type: 'Boulangerie', desc: 'Pain chaud et petit-déjeuner populaire' },
      { nom: 'Librairie Clairafrique Sicap', type: 'Librairie', desc: 'Livres scolaires et africains' },
      { nom: 'Supérette du Coin', type: 'Commerce', desc: 'Alimentation de proximité ouverte tard' },
    ],
    quartiersVoisins: ['Biscuiterie', 'Grand-Dakar', 'Gueule-Tapée', 'Colobane'],
  },
  {
    id: 'grand-dakar', nom: 'Grand-Dakar', ville: 'Dakar', lat: 14.6895, lng: -17.4255,
    type: 'Quartier populaire & résidentiel',
    population: '~180 000 habitants',
    superficie: '~6 km²',
    ambiance: 'Populaire, dense, commerçant, en pleine mutation. Mélange de vieilles constructions et de nouveaux immeubles. Ambiance de quartier populaire dakarois très authentique.',
    securite: 'Moyenne — Quartier très vivant et sûr le jour. Vigilance la nuit dans certaines ruelles isolées.',
    transport: 'Bus DDD, minicars, taxis. Très bien desservi, nœud de transport entre le centre et l\'est de Dakar.',
    histoire: [
      'Historiquement un quartier de pêcheurs lébous et de commerçants wolofs.',
      'Développé comme zone de relogement pour les populations du centre de Dakar dans les années 1960-70.',
      'Le stade Léopold-Sédar-Senghor (ancien stade de l\'Amitié) a été construit à proximité dans les années 1980.',
      'Quartier de naissance de nombreux artistes et sportifs sénégalais.',
    ],
    figures: [
      { nom: 'Papa Bouba Diop', role: 'Footballeur international', lien: 'Né et formé à Grand-Dakar, héros de la Coupe du Monde 2002' },
      { nom: 'El Hadji Diouf', role: 'Footballeur international', lien: 'A grandi dans le quartier avant sa carrière en Europe' },
      { nom: 'Viviane Chidid', role: 'Chanteuse de mbalax', lien: 'Originaire du quartier, figure de la musique sénégalaise' },
    ],
    evenements: [
      { date: '1985', nom: 'Stade de l\'Amitié', desc: 'Inauguration du stade qui deviendra Léopold-Sédar-Senghor.' },
      { date: 'Annuel', nom: 'Tournoi Nawetaan', desc: 'Championnat de foot inter-quartiers très suivi.' },
    ],
    landmarks: [
      { nom: 'Stade Léopold-Sédar-Senghor', desc: 'Stade national, 60 000 places, temple du foot sénégalais' },
      { nom: 'Marché de Grand-Dakar', desc: 'Grand marché populaire, de tout se trouve ici' },
      { nom: 'Mosquée de Grand-Dakar', desc: 'Centre religieux important du quartier' },
    ],
    commerces: [
      { nom: 'Marché de Grand-Dakar', type: 'Marché', desc: 'Alimentation, vêtements, électronique, bric-à-brac' },
      { nom: 'Dibiteries du coin', type: 'Restaurant', desc: 'Mouton grillé, cuisine locale très prisée' },
    ],
    quartiersVoisins: ['Colobane', 'Médina', 'Fass', 'Gueule-Tapée'],
  },
  {
    id: 'gueule-tapee', nom: 'Gueule-Tapée', ville: 'Dakar', lat: 14.6965, lng: -17.4325,
    type: 'Quartier populaire historique',
    population: '~120 000 habitants',
    superficie: '~4 km²',
    ambiance: 'Très populaire, dense, historique. Un des quartiers les plus anciens de Dakar après la Médina. Rues étroites, maisons colorées, vie communautaire intense.',
    securite: 'Moyenne — Quartier sûr le jour grâce à la densité. Vigilance la nuit. Solidarité communautaire forte.',
    transport: 'Bus DDD, minicars, taxis. Bien desservi mais très congestionné aux heures de pointe.',
    histoire: [
      'Fondé au début du XXe siècle comme quartier indigène aux portes du Plateau colonial.',
      'Son nom viendrait d\'une expression wolof désignant un lieu de rassemblement.',
      'Berceau du mouvement ouvrier et syndical sénégalais dans les années 1930-40.',
      'De nombreux militants de l\'indépendance y ont vécu et organisé des meetings.',
    ],
    figures: [
      { nom: 'Lamine Guèye', role: 'Premier maire africain de Dakar', lien: 'A milité pour les droits des habitants de Gueule-Tapée' },
      { nom: 'Amadou Lamine-Guèye', role: 'Homme politique', lien: 'Figure emblématique du quartier, dont la place porte le nom' },
    ],
    evenements: [
      { date: '1930s', nom: 'Mouvement ouvrier', desc: 'Grèves et manifestations des dockers et ouvriers du quartier.' },
      { date: 'Annuel', nom: 'Fête du quartier', desc: 'Célébrations populaires avec concerts et défilés.' },
    ],
    landmarks: [
      { nom: 'Place Amadou-Lamine-Guèye', desc: 'Place centrale, point de ralliement du quartier' },
      { nom: 'Marché de Gueule-Tapée', desc: 'Marché populaire très coloré' },
      { nom: 'Ancienne gare routière', desc: 'Terminus historique des bus interurbains' },
    ],
    commerces: [
      { nom: 'Marché de Gueule-Tapée', type: 'Marché', desc: 'Produits locaux, tissus, épices' },
      { nom: 'Boutiques de téléphonie', type: 'Commerce', desc: 'Réparation et vente de téléphones' },
    ],
    quartiersVoisins: ['Grand-Dakar', 'Colobane', 'Biscuiterie'],
  },
  {
    id: 'hann-bel-air', nom: 'Hann-Bel-Air', ville: 'Dakar', lat: 14.7125, lng: -17.4185,
    type: 'Quartier portuaire & industriel',
    population: '~80 000 habitants',
    superficie: '~10 km²',
    ambiance: 'Industriel, portuaire, populaire. Zone portuaire majeure du Sénégal avec le port autonome de Dakar. Contrastes entre zones industrielles et quartiers résidentiels populaires.',
    securite: 'Moyenne — Zone portuaire très surveillée. Quartiers résidentiels sûrs le jour.',
    transport: 'Bus, minicars, taxis. Route du front de mer. Gare maritime pour les îles (Gorée, etc.).',
    histoire: [
      'Le port de Dakar, construit à partir de 1862, est la tête de pont économique du Sénégal.',
      'Hann était historiquement un village de pêcheurs lébous avant l\'aménagement du port.',
      'La zone industrielle a été développée dans les années 1960 avec les premières usines de transformation.',
      'Le port est le deuxième plus grand d\'Afrique de l\'Ouest après Abidjan.',
    ],
    figures: [
      { nom: 'Papa Guèye Fall', role: 'Premier directeur sénégalais du port', lien: 'A modernisé le port après l\'indépendance' },
    ],
    evenements: [
      { date: '1862', nom: 'Construction du port', desc: 'Début des travaux du port de Dakar, premier port profond d\'Afrique de l\'Ouest.' },
      { date: 'Annuel', nom: 'Fête de la mer', desc: 'Célébrations des pêcheurs et dockers.' },
    ],
    landmarks: [
      { nom: 'Port autonome de Dakar', desc: 'Port principal du Sénégal, point de transit régional' },
      { nom: 'Zone industrielle de Hann', desc: 'Entrepôts, usines de transformation, industries' },
      { nom: 'Plage de Hann', desc: 'Plage populaire, baignade et pique-nique' },
      { nom: 'Ancienne gare maritime', desc: 'Départ des ferries pour Gorée et les îles' },
    ],
    commerces: [
      { nom: 'Marché de Hann', type: 'Marché', desc: 'Poisson frais, produits portuaires, alimentation' },
      { nom: 'Restaurants de poisson', type: 'Restaurant', desc: 'Poisson grillé frais du port' },
    ],
    quartiersVoisins: ['Biscuiterie', 'Sicap-Liberté', 'Gorée (île)'],
  },
  {
    id: 'camberene', nom: 'Cambérène', ville: 'Dakar', lat: 14.7655, lng: -17.4725,
    type: 'Quartier résidentiel & universitaire',
    population: '~70 000 habitants',
    superficie: '~7 km²',
    ambiance: 'Résidentiel, étudiant, verdoyant. Campus de l\'Université Cheikh Anta Diop (UCAD), maisons étudiantes, résidences familiales. Ambiance jeune et intellectuelle.',
    securite: 'Bonne — Campus avec sécurité, zones résidentielles calmes.',
    transport: 'Bus DDD, minicars, taxis. Desservi par plusieurs lignes vers le centre.',
    histoire: [
      'Ancien village lébou, longtemps isolé au nord de la presqu\'île.',
      'Développé comme campus universitaire dans les années 1970-80 avec l\'extension de l\'UCAD.',
      'Le nom viendrait d\'une expression wolof signifiant \'village proche de la mer\'.',
    ],
    figures: [
      { nom: 'Cheikh Anta Diop', role: 'Historien et scientifique', lien: 'L\'université porte son nom, campus voisin' },
    ],
    evenements: [
      { date: '1970s', nom: 'Extension de l\'UCAD', desc: 'Création des facultés de Cambérène.' },
    ],
    landmarks: [
      { nom: 'Campus de Cambérène (UCAD)', desc: 'Facultés de médecine, sciences et technologie' },
      { nom: 'Plage de Cambérène', desc: 'Plage tranquille, peu fréquentée' },
      { nom: 'Forêt de Cambérène', desc: 'Espace boisé, jogging et randonnées' },
    ],
    commerces: [
      { nom: 'Restaurants universitaires', type: 'Restaurant', desc: 'Resto-U et snacks étudiants' },
      { nom: 'Librairie du campus', type: 'Librairie', desc: 'Livres universitaires' },
    ],
    quartiersVoisins: ['Yoff', 'Les Almadies'],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // KAOLACK
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'kaolack', nom: 'Kaolack (centre)', ville: 'Kaolack', lat: 14.1389, lng: -16.0764,
    type: 'Ville commerciale du Saloum',
    population: '~200 000 habitants',
    superficie: '~12 km²',
    ambiance: 'Commerçante, animée, agricole, portuaire. Carrefour commercial du centre du Sénégal, port sur le Saloum, riche histoire commerciale.',
    securite: 'Bonne — Ville de province dynamique et sûre.',
    transport: 'Bus interurbains, taxis, bateaux pour les îles du Saloum.',
    histoire: [
      'Ancien comptoir de traite négrière sur le fleuve Saloum.',
      'Capitale commerciale de l\'arachide au XXe siècle.',
      'Grande mosquée de Kaolack, construite par la famille Niassène, centre du tariqa Tijaniyya.',
    ],
    figures: [
      { nom: 'El Hadj Ibrahim Niass', role: 'Guide religieux', lien: 'Figure majeure de la Tijaniyya en Afrique' },
    ],
    evenements: [
      { date: 'Annuel', nom: 'Ziarra de Kaolack', desc: 'Grand pèlerinage Tijaniyya.' },
    ],
    landmarks: [
      { nom: 'Grande Mosquée de Kaolack', desc: 'Centre du Tijaniyya en Afrique de l\'Ouest' },
      { nom: 'Port de pêche', desc: 'Port artisanal actif' },
    ],
    commerces: [
      { nom: 'Marché central', type: 'Marché', desc: 'Commerce d\'arachide et de céréales' },
    ],
    quartiersVoisins: ['Ndrondé', 'Gandiaye', 'Kahone'],
  },
]

function findQuartier(lat, lng) {
  let best = null
  let bestDist = Infinity
  for (const q of QUARTIERS) {
    const d = haversine(lat, lng, q.lat, q.lng)
    if (d < bestDist) { bestDist = d; best = q }
  }
  // Seuil strict : on n'affiche le quartier que si on est vraiment dedans (< 800m du centre)
  return bestDist < 800 ? { ...best, distance: Math.round(bestDist) } : null
}

// ─── Base de données Tourist Zone — Zones à visiter au Sénégal ─────────────
const ZONES_TOURISTIQUES = [
  // ═══════════════════════════════════════════════════════════════════════════
  // PARCS NATIONAUX & RÉSERVES
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'niokolo-koba', nom: 'Parc National du Niokolo-Koba', region: 'Kédougou / Tambacounda',
    lat: 13.0389, lng: -13.2934, type: 'Parc National UNESCO',
    description: 'Le plus grand parc national du Sénégal (9 130 km²) et l\'un des plus riches en biodiversité d\'Afrique de l\'Ouest. Savanes arborées, forêts galerie, fleuves et collines abritent une faune spectaculaire. Patrimoine mondial de l\'UNESCO depuis 1981.',
    attractions: [
      { nom: 'Rivière Gambia', desc: 'Coeur du parc, point d\'eau pour animaux, pirogues traditionnelles' },
      { nom: 'Mont Assirik', desc: 'Point culminant, vue panoramique sur la savane' },
      { nom: 'Campement de Simenti', desc: 'Base principale, observatoire de la faune' },
      { nom: 'Point d\'eau de Niokolo-Koba', desc: 'Regroupement d\'éléphants, buffles, antilopes' },
    ],
    periode: 'Novembre à mai (saison sèche) — les animaux se regroupent aux points d\'eau. À éviter de juin à octobre (pluies, pistes impraticables).',
    activites: ['Safari-photo 4x4', 'Pirogue sur la Gambia', 'Randonnée guidée', 'Observation ornithologique', 'Camping bivouac'],
    acces: 'Route de Tamba à Kédougou (piste 60 km). Piste exigeante — 4x4 obligatoire. Compter 2h30 depuis Tambacounda. Vol charters possibles depuis Dakar.',
    duree: '2 à 4 jours',
    label: 'Safari · Nature · UNESCO',
  },
  {
    id: 'djoudj', nom: 'Parc National du Djoudj', region: 'Saint-Louis',
    lat: 16.2833, lng: -16.1833, type: 'Parc National UNESCO',
    description: 'La plus grande réserve ornithologique d\'Afrique de l\'Ouest. Plus de 3 millions d\'oiseaux migrateurs y hivernent chaque année, dont des milliers de flamants roses, pélicans, cigognes et aigles-pêcheurs. Un spectacle naturel unique entre eau douce et eau salée.',
    attractions: [
      { nom: 'Observatoire des flamants', desc: 'Vue imprenable sur les colonies de flamants roses' },
      { nom: 'Île des pélicans', desc: 'Plus grande colonie de pélicans du Sénégal' },
      { nom: 'Canal de Guidimakha', desc: 'Pirogue à travers les roseaux, observation rapprochée' },
      { nom: 'Point d\'eau central', desc: 'Regroupement de cormorans, hérons, aigrettes' },
    ],
    periode: 'Novembre à avril (migration hivernale). Avril : les flamants sont les plus nombreux. Éviter la saison des pluies.',
    activites: ['Observation ornithologique', 'Pirogue guidée', 'Photographie animalière', 'Randonnée pédestre'],
    acces: 'Route de Saint-Louis vers Ross-Béthio, puis 30 km de piste. 4x4 recommandé. Compter 1h30 depuis Saint-Louis.',
    duree: '1 journée ou 2 jours avec bivouac',
    label: 'Oiseaux · UNESCO · Flamants',
  },
  {
    id: 'madeleine', nom: 'Parc National des Îles de la Madeleine', region: 'Dakar',
    lat: 14.6667, lng: -17.4333, type: 'Parc National UNESCO',
    description: 'Deux îlots volcaniques à 4 km au large de Dakar. Paysage minéral, falaises spectaculaires, colonies de fous de Bassan et phoques moines. Site de ponte des tortues vertes. Patrimoine mondial de l\'UNESCO. Accès interdit en dehors des excursions guidées pour préserver l\'écosystème.',
    attractions: [
      { nom: 'Falaise de l\'Île de la Madeleine', desc: 'Falaises volcaniques de 30m, nids de fous de Bassan' },
      { nom: 'Phoque moine', desc: 'Colonie de phoques moines, espèce menacée' },
      { nom: 'Tortues vertes', desc: 'Site de ponte protégé, observation nocturne encadrée' },
      { nom: 'Fond marin', desc: 'Eaux cristallines, snorkeling exceptionnel' },
    ],
    periode: 'Novembre à mai. Juin à octobre : tortues en ponte mais météo capricieuse.',
    activites: ['Excursion en bateau', 'Snorkeling', 'Observation faune', 'Randonnée sur l\'île'],
    acces: 'Embarcadère à la pointe des Almadies, bateau avec guide du parc (20 min). Réservation obligatoire.',
    duree: 'Demi-journée',
    label: 'Îles · Volcan · UNESCO',
  },
  {
    id: 'delta-saloum', nom: 'Parc National du Delta du Saloum', region: 'Fatick',
    lat: 13.7833, lng: -16.5667, type: 'Parc National UNESCO',
    description: 'Labyrinthe d\'îles, de bolongs (bras de mer) et de mangroves formé par les estuaires des rivières Saloum et Diomboss. Ecosystème exceptionnel où la forêt de palétuviers se mêle aux savanes. Plusieurs milliers d\'oiseaux, dugongs (rares), dauphins. Patrimoine mondial UNESCO.',
    attractions: [
      { nom: 'Bolong de Saloum', desc: 'Bras de mer bordé de mangroves, pirogue traditionnelle' },
      { nom: 'Île de Dionewar', desc: 'Village de pêcheurs, plage sauvage, écolodge' },
      { nom: 'Île de Mar Lodj', desc: 'Ancien comptoir français, plages, écolodge' },
      { nom: 'Forêt de palétuviers', desc: 'Mangrove luxuriante, crabe violoniste, oiseaux' },
      { nom: 'Village de Soucouta', desc: 'Porte d\'entrée, piroguiers, artisanat' },
    ],
    periode: 'Octobre à mai. La mangrove est la plus verte en début de saison sèche.',
    activites: ['Pirogue dans les bolongs', 'Observation oiseaux et dauphins', 'Visite villages', 'Plage', 'Pêche traditionnelle'],
    acces: 'Route de Kaolack à Fatick, puis piste vers Palmarin ou Soucouta. 4x4 recommandé. Pirogues depuis plusieurs embarcadères.',
    duree: '2 à 4 jours',
    label: 'Mangrove · UNESCO · Pirogue',
  },
  {
    id: 'langue-barbarie', nom: 'Parc National de la Langue de Barbarie', region: 'Saint-Louis',
    lat: 15.9167, lng: -16.5167, type: 'Parc National',
    description: 'Fine bande de sable de 16 km entre l\'océan Atlantique et l\'estuaire du Sénégal. Réserve naturelle protégée, ponte des tortues caouannes et vertes, colonies d\'oiseaux marins. Paysage désertique et maritime d\'une beauté sauvage.',
    attractions: [
      { nom: 'Plage de la Langue de Barbarie', desc: 'Plage sauvage, baignade, pêcheurs' },
      { nom: 'Ponte des tortues', desc: 'Observation nocturne de tortues caouannes (août à novembre)' },
      { nom: 'Guet Ndar', desc: 'Village de pêcheurs coloré sur la langue de sable' },
      { nom: 'Colonies d\'oiseaux', desc: 'Sternes, laridae, spatules sur les bancs de sable' },
    ],
    periode: 'Novembre à mai. Août-novembre pour les tortues.',
    activites: ['Observation tortues', 'Pêche avec les locaux', 'Baignade', 'Photographie', 'Balade en calèche'],
    acces: 'Depuis Saint-Louis : bateau ou calèche jusqu\'à Guet Ndar, puis marche. Compter 30 min.',
    duree: '1 journée',
    label: 'Plage · Tortues · Nature',
  },
  {
    id: 'bandia', nom: 'Réserve de Bandia', region: 'Mbour',
    lat: 14.4333, lng: -17.0167, type: 'Réserve animalière',
    description: 'Réserve privée de 1 500 hectares à 45 min de Dakar. Safari accessible en une journée : éléphants, girafes, rhinocéros, zèbres, antilopes, gnous, autruches, crocodiles et babouins. Paysage de savane typique avec baobabs et acacias.',
    attractions: [
      { nom: 'Elephants', desc: 'Troupeau d\'éléphants d\'Afrique de l\'Ouest' },
      { nom: 'Girafes', desc: 'Girafes du Niger, approche à quelques mètres' },
      { nom: 'Rhinocéros blancs', desc: 'Espèce menacée, observation guidée' },
      { nom: 'Points d\'eau', desc: 'Regroupements d\'animaux au coucher du soleil' },
      { nom: 'Baobab géant', desc: 'Baobabs centenaires, symboles de la réserve' },
    ],
    periode: 'Toute l\'année. Le matin (8h-11h) et le soir (16h-18h) sont les meilleurs moments.',
    activites: ['Safari 4x4', 'Randonnée pédestre', 'Observation animalière', 'Pique-nique', 'Photos'],
    acces: 'Route de Dakar à Mbour, bifurcation à Pout (piste 10 km). 1h depuis Dakar. 4x4 fourni sur place.',
    duree: 'Demi-journée à 1 journée',
    label: 'Safari · Éléphants · Famille',
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // PLAGES & CÔTES
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'saly', nom: 'Saly Portudal', region: 'Mbour',
    lat: 14.4333, lng: -17.0167, type: 'Station balnéaire',
    description: 'La plus grande station balnéaire du Sénégal. Plage de 7 km bordée de cocotiers, hôtels de standing, restaurants, golf, spas, marina et vie nocturne animée. Destination phare des touristes européens depuis les années 1980.',
    attractions: [
      { nom: 'Plage de Saly', desc: '7 km de sable fin, baignade surveillée, restaurants de plage' },
      { nom: 'Golf de Saly', desc: '18 trous entre mer et forêt tropicale' },
      { nom: 'Port de plaisance', desc: 'Marina, location de bateaux, excursions' },
      { nom: 'Village artisanal', desc: 'Boutiques d\'artisanat, tissus, sculptures' },
      { nom: 'Mbour', desc: 'Port de pêche artisanale à 5 km, débarquement des pirogues colorées' },
    ],
    periode: 'Novembre à mai (26-32°C). Décembre-janvier : idéal. Juillet-septembre : chaud et humide.',
    activites: ['Baignade', 'Jet-ski', 'Planche à voile', 'Pêche en haute mer', 'Golf', 'Quad', 'Spa', 'Discothèques'],
    acces: 'Route de Dakar (80 km, 1h15). Bus, taxi-brousse, VTC. Aéroport de Diass à 50 km.',
    duree: '3 jours à 2 semaines',
    label: 'Plage · Luxe · Famille',
  },
  {
    id: 'cap-skirring', nom: 'Cap Skirring', region: 'Oussouye, Casamance',
    lat: 12.35, lng: -16.7333, type: 'Station balnéaire',
    description: 'Le joyau touristique de la Casamance. Plages de sable fin à perte de vue, eaux turquoise, cocotiers inclinés, village de pêcheurs paisible. Ambiance décontractée, loin de l\'effervescence dakaroise. Un petit paradis atlantique.',
    attractions: [
      { nom: 'Plage de Cap Skirring', desc: 'Plage paradisiaque, baignade, coucher de soleil' },
      { nom: 'Village de pêcheurs', desc: 'Pirogues colorées, poisson frais grillé sur la plage' },
      { nom: 'Forêt de Boucotte', desc: 'Mangrove et forêt tropicale à proximité' },
      { nom: 'Marché de Ziguinchor', desc: 'Épices, fruits tropicaux, artisanat casamançais' },
    ],
    periode: 'Novembre à mai. La Casamance est plus verte et moins ventée que Dakar.',
    activites: ['Baignade', 'Plongée', 'Pêche', 'Pirogue en mangrove', 'Visite villages diola', 'Observation oiseaux'],
    acces: 'Vol Dakar-Ziguinchor (50 min) puis taxi (1h). Ou route depuis Ziguinchor (1h).',
    duree: '5 jours à 2 semaines',
    label: 'Paradis · Plage · Casamance',
  },
  {
    id: 'mbour', nom: 'Mbour & la Petite-Côte', region: 'Mbour',
    lat: 14.4167, lng: -16.9667, type: 'Côte & Pêche',
    description: 'Port de pêche le plus actif du Sénégal. Centaines de pirogues multicolores débarquent le thon, la sardine et le mérou. La Petite-Côte s\'étend sur 150 km de plages : Saly, Nianing, La Somone, Popenguine. Authenticité côtière entre tourisme et tradition.',
    attractions: [
      { nom: 'Port de pêche de Mbour', desc: 'Débarquement à 17h, marché aux poissons vivant' },
      { nom: 'La Somone', desc: 'Lagune, mangrove, oiseaux, golf' },
      { nom: 'Nianing', desc: 'Plage tranquille, village de pêcheurs' },
      { nom: 'Popenguine', desc: 'Village catholique, basilique, plage' },
      { nom: 'Pointe-Sarène', desc: 'Nouvelle station balnéaire haut de gamme' },
    ],
    periode: 'Novembre à mai. Le port est animé toute l\'année.',
    activites: ['Baignade', 'Surf', 'Pêche avec les locaux', 'Golf', 'Visite port', 'Quad'],
    acces: 'Route de Dakar (80 km, 1h15). Très bien desservie.',
    duree: '2 à 5 jours',
    label: 'Pêche · Plage · Authenticité',
  },
  {
    id: 'joal-fadiouth', nom: 'Joal-Fadiouth & l\'Île aux Coquillages', region: 'Joal',
    lat: 14.0833, lng: -16.8167, type: 'Site culturel & insolite',
    description: 'Joal, village natal de Léopold Sédar Senghor. Face à lui, Fadiouth : une île entièrement bâtie sur des amas de coquillages accumulés depuis des siècles. Un pont de bois relie les deux. Un cimetière chrétien sur coquillages, unique au monde, témoigne de la paix religieuse sénégalaise.',
    attractions: [
      { nom: 'Île de Fadiouth', desc: 'Village sur coquillages, ruelles blanches, cases traditionnelles' },
      { nom: 'Cimetière mixte', desc: 'Chrétien et musulman sur coquillages, symbole de tolérance' },
      { nom: 'Maison natale de Senghor', desc: 'Musée consacré au poète-président' },
      { nom: 'Forêt de mangrove', desc: 'Balade en pirogue dans les bolongs' },
      { nom: 'Coopérative de pécheurs', desc: 'Transformation du poisson, artisanat' },
    ],
    periode: 'Novembre à juin.',
    activites: ['Visite guidée de l\'île', 'Pirogue mangrove', 'Rencontre pêcheurs', 'Photographie'],
    acces: 'Route de Dakar (115 km, 2h). Bus et taxis.',
    duree: '1 journée',
    label: 'Coquillages · Culture · Insolite',
  },
  {
    id: 'ngor', nom: 'Île de Ngor', region: 'Dakar',
    lat: 14.7167, lng: -17.5167, type: 'Île & Plage',
    description: 'Petite île volcanique à 400m de la côte des Almadies. Pas de voitures, ruelles sablonneuses, maisons colorées, ateliers d\'artistes, plages tranquilles et spot de surf réputé. Ambiance bohème et villageoise à deux pas de la capitale.',
    attractions: [
      { nom: 'Plage de Ngor', desc: 'Plage de sable fin, surf, baignade' },
      { nom: 'Ngor Village', desc: 'Ruelles pavées, maisons colorées, ateliers d\'artistes' },
      { nom: 'Pointe de Ngor', desc: 'Vue sur Dakar, coucher de soleil' },
      { nom: 'Restaurant "Chez Ndiaga"', desc: 'Poisson grillé, institution de l\'île' },
    ],
    periode: 'Toute l\'année. Surf optimal de novembre à avril.',
    activites: ['Surf', 'Baignade', 'Plongée', 'Visite village', 'Shopping artisanat'],
    acces: 'Embarcadère Ngor (près des Almadies), pirogue 5 min (500 FCFA).',
    duree: 'Demi-journée à 1 journée',
    label: 'Île · Surf · Bohème',
  },
  {
    id: 'elinkine', nom: 'Elinkine', region: 'Oussouye, Casamance',
    lat: 12.5167, lng: -16.8167, type: 'Village de pêcheurs & Plage',
    description: 'Village de pêcheurs diola à l\'embouchure du fleuve Casamance. Plage sauvage bordée de cocotiers, pirogues traditionnelles, mangrove luxuriante. Calme absolu, authenticité casamançaise. Un des endroits les plus préservés de la côte.',
    attractions: [
      { nom: 'Plage d\'Elinkine', desc: 'Sable fin, eaux chaudes, aucun building' },
      { nom: 'Embouchure du fleuve', desc: 'Rencontre eau douce et eau salée' },
      { nom: 'Village diola', desc: 'Cases traditionnelles, rizières, forêt sacrée' },
      { nom: 'Pêche traditionnelle', desc: 'Accompagner les pêcheurs en pirogue' },
    ],
    periode: 'Novembre à mai.',
    activites: ['Baignade', 'Pirogue', 'Pêche', 'Observation oiseaux', 'Randonnée village'],
    acces: 'Depuis Ziguinchor : route puis piste (1h30). 4x4 recommandé en saison des pluies.',
    duree: '2 à 3 jours',
    label: 'Authenticité · Plage · Casamance',
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // SITES CULTURELS & HISTORIQUES
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'popenguine', nom: 'Popenguine-Ndayane & Keur Moussa', region: 'Thiès',
    lat: 14.5, lng: -17.1167, type: 'Site religieux & culturel',
    description: 'Popenguine : village catholique perché sur une falaise, site de pèlerinage marial le 18 mai. Ndayane : pèlerinage musulman. Keur Moussa : abbaye bénédictine célèbre pour ses chants grégoriens en langue africaine. Symbole de la coexistence religieuse.',
    attractions: [
      { nom: 'Basilique de Popenguine', desc: 'Basilique mariale sur falaise, vue imprenable' },
      { nom: 'Pèlerinage du 18 mai', desc: '100 000 pèlerins, messe en plein air' },
      { nom: 'Abbaye de Keur Moussa', desc: 'Moines bénédictins, chants, fromage artisanal' },
      { nom: 'Falaise de Popenguine', desc: 'Vue sur l\'océan, falaise vertigineuse' },
    ],
    periode: 'Mai pour le pèlerinage. Toute l\'année pour l\'abbaye.',
    activites: ['Pèlerinage', 'Visite abbaye', 'Randonnée falaise', 'Achat fromage', 'Méditation'],
    acces: 'Route de Dakar à Mbour, bifurcation à Sébikotane. 1h depuis Dakar.',
    duree: '1 journée',
    label: 'Religion · Pèlerinage · Culture',
  },
  {
    id: 'sine-ngayene', nom: 'Sine Ngayène & Mégalithes du Sénégal', region: 'Kaolack / Kaffrine',
    lat: 14.05, lng: -15.2833, type: 'Site archéologique',
    description: 'Le plus grand site mégalithique du monde avec plus de 10 000 pierres dressées par les Sérères entre le VIIIe et le XIIe siècle. Alignements, tumulus, cirques de pierre géants. UNESCO. Témoin fascinant des civilisations précoloniales de l\'Afrique de l\'Ouest.',
    attractions: [
      { nom: 'Alignements de Wanar', desc: 'Plus de 500 menhirs dressés en cercles' },
      { nom: 'Tumulus de Sine Ngayène', desc: 'Tombeaux royaux sérères, pierres gigantesques' },
      { nom: 'Cirque mégalithique', desc: 'Cercle de 50 pierres de 2m de haut' },
      { nom: 'Musée de Kaolack', desc: 'Artéfacts découverts sur les sites' },
    ],
    periode: 'Novembre à mars (frais et sec).',
    activites: ['Visite archéologique', 'Randonnée', 'Photographie', 'Rencontre villageois'],
    acces: 'Route de Kaolack vers Kaffrine, puis piste. 4x4 recommandé. 2h depuis Kaolack.',
    duree: '1 à 2 jours',
    label: 'Mégalithes · UNESCO · Archéologie',
  },
  {
    id: 'tivaouane', nom: 'Tivaouane', region: 'Tivaouane',
    lat: 14.95, lng: -16.8167, type: 'Ville sainte Tijaniyya',
    description: 'Deuxième ville sainte du Sénégal après Touba. Capitale de la confrérie Tijaniyya en Afrique de l\'Ouest. Mosquées et zaouïas magnifiques, ambiance pieuse et studieuse. Le Magal de Tivaouane rassemble des centaines de milliers de disciples.',
    attractions: [
      { nom: 'Grande Mosquée de Tivaouane', desc: 'Mosquée blanche majestueuse, architecture soudanaise' },
      { nom: 'Zaouïa de El Hadj Malick Sy', desc: 'Centre spirituel Tijaniyya, tombe du guide' },
      { nom: 'Bibliothèque islamique', desc: 'Manuscrits anciens, centre d\'études coraniques' },
      { nom: 'Marché de la ville', desc: 'Artisanat religieux, encens, livres' },
    ],
    periode: 'Toute l\'année. Le Magal (safar) : événement phare.',
    activites: ['Visite mosquées', 'Rencontre talibés', 'Marché', 'Apprentissage coran'],
    acces: 'Route de Dakar à Thiès, puis Tivaouane (1h30 depuis Dakar).',
    duree: '1 journée',
    label: 'Religion · Tijaniyya · Culture',
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // NATURE & PAYSAGES
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'lac-rose', nom: 'Lac Rose / Retba', region: 'Dakar / Niaga',
    lat: 14.85, lng: -17.2333, type: 'Site naturel insolite',
    description: 'Lac salé aux eaux rose saumon dues à une algue halophile et au sel. Autrefois source de sel pour tout l\'empire colonial, aujourd\'hui site touristique et de rallye (arrivée du Paris-Dakar). Baignade impossible (50g de sel par litre) mais promenade sur les dunes et observation des saliniers.',
    attractions: [
      { nom: 'Banc de sel', desc: 'Montagnes de sel blanc, récolte artisanale' },
      { nom: 'Dunes de sable', desc: 'Dunes colorées, panorama sur l\'océan' },
      { nom: 'Village des saliniers', desc: 'Travail du sel, technique ancestrale' },
      { nom: 'Arrivée Paris-Dakar', desc: 'Piste historique du rallye' },
    ],
    periode: 'Novembre à mai. La couleur est plus intense en saison sèche.',
    activites: ['Pirogue sur le lac', 'Quad dans les dunes', 'Observation saliniers', 'Photos', 'Course de rallye'],
    acces: 'Route de Dakar vers Saint-Louis, bifurcation à Keur Massar. 45 min depuis Dakar.',
    duree: 'Demi-journée',
    label: 'Insolite · Rose · Sel',
  },
  {
    id: 'dindefelo', nom: 'Chutes de Dindefelo', region: 'Kédougou',
    lat: 12.3833, lng: -12.3167, type: 'Chute d\'eau',
    description: 'Plus haute chute du Sénégal (80-100m selon les saisons) dans un écrin de forêt tropicale. Bassin naturel en contrebas, baignade possible. Site sacré pour les locaux, cadre de jungle luxuriante. Accessible après une randonnée de 45 min.',
    attractions: [
      { nom: 'Chute principale', desc: 'Cascade de 80m dans la forêt, bruit assourdissant' },
      { nom: 'Bassin naturel', desc: 'Baignade au pied de la chute, eau fraîche' },
      { nom: 'Forêt tropicale', desc: 'Végétation luxuriante, singes, oiseaux rares' },
      { nom: 'Village de Dindefelo', desc: 'Village typique, accueil communautaire' },
    ],
    periode: 'Octobre à juin (chute en eau). Juillet-septembre : trop de pluie, glissant.',
    activites: ['Randonnée', 'Baignade', 'Observation faune', 'Photo', 'Camping'],
    acces: 'Route de Kédougou vers Mali (piste 30 km). 4x4 obligatoire. 2h depuis Kédougou.',
    duree: '1 à 2 jours',
    label: 'Chute · Jungle · Randonnée',
  },
  {
    id: 'lompoul', nom: 'Désert de Lompoul', region: 'Louga',
    lat: 15.4333, lng: -15.0833, type: 'Désert de sable',
    description: 'Dunes orange-rouge s\'étendant sur des kilomètres au cœur du Sahel sénégalais. Paysage sahélien spectaculaire, silence absolu, ciel étoilé exceptionnel. Campement bedouin avec tentes sahariennes, randonnée chameau, et coucher de soleil inoubliable sur les dunes.',
    attractions: [
      { nom: 'Dunes de Lompoul', desc: 'Dunes de 40m, sable fin orange, panorama sahélien' },
      { nom: 'Campement bédouin', desc: 'Tentes sahariennes, repas traditionnel sous les étoiles' },
      { nom: 'Randonnée chameau', desc: 'Traversée des dunes à dos de dromadaire' },
      { nom: 'Coucher de soleil', desc: 'Les dunes s\'embrasent, couleurs intenses' },
    ],
    periode: 'Novembre à février (tempérées). Juin-octobre : trop chaud (45°C).',
    activites: ['Randonnée chameau', 'Sandboard', 'Bivouac', 'Observation étoiles', 'Photographie'],
    acces: 'Route de Louga vers Saint-Louis, bifurcation Lompoul (piste 15 km). 3h depuis Dakar.',
    duree: '1 à 2 nuits',
    label: 'Dunes · Désert · Bivouac',
  },
  {
    id: 'bassari', nom: 'Pays Bassari', region: 'Kédougou / Tambacounda',
    lat: 12.6167, lng: -12.3333, type: 'Paysage culturel UNESCO',
    description: 'Région montagneuse peuplée par les Bassari, Bédik et Peuls. Terrasses agricoles ancestrales, maisons à toits de chaume, forêts sacrées, initiation traditionnelle. UNESCO pour son paysage culturel unique. Randonnée entre villages isolés et nature préservée.',
    attractions: [
      { nom: 'Village de Bandafassi', desc: 'Maisons traditionnelles Bassari, terrasses, initiation' },
      { nom: 'Village Bédik d\'Iwol', desc: 'Maisons perchées sur la colline, toits de chaume pointus' },
      { nom: 'Forêt sacrée de Dina', desc: 'Forêt vierge, cérémonies traditionnelles' },
      { nom: 'Monts du Fouta', desc: 'Trekking, vues panoramiques, cascades' },
    ],
    periode: 'Novembre à février (frais).',
    activites: ['Trekking village à village', 'Rencontre ethnique', 'Camping', 'Photographie', 'Initiation culturelle'],
    acces: 'Route de Kédougou vers Mali, pistes difficiles. 4x4 indispensable. 3-4h depuis Kédougou.',
    duree: '3 à 7 jours',
    label: 'Ethnique · Trekking · UNESCO',
  },
  {
    id: 'guembeul', nom: 'Réserve de Guembeul', region: 'Saint-Louis',
    lat: 16.2833, lng: -16.1667, type: 'Réserve ornithologique',
    description: 'Réserve communautaire de 700 hectares à 10 km de Saint-Louis. Marigots, forêts de palétuviers et savane inondable. Refuge d\'antilopes, varans, crocodiles du Nil et centaines d\'espèces d\'oiseaux. Ecotourisme communautaire avec guides locaux.',
    attractions: [
      { nom: 'Antilopes', desc: 'Gazelles et cob defassa en liberté' },
      { nom: 'Crocodiles du Nil', desc: 'Observation depuis les passerelles' },
      { nom: 'Oiseaux migrateurs', desc: 'Cigognes, pélicans, aigrettes en hiver' },
      { nom: 'Forêt de palétuviers', desc: 'Mangrove, crabe violoniste' },
    ],
    periode: 'Novembre à avril (migration).',
    activites: ['Safari pédestre', 'Observation faune', 'Pirogue', 'Rencontre communautaire'],
    acces: 'Route de Saint-Louis vers Richard-Toll, bifurcation Guembeul. 30 min depuis Saint-Louis.',
    duree: 'Demi-journée',
    label: 'Faune · Oiseaux · Marigot',
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // ÎLES
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'karabane', nom: 'Île de Karabane', region: 'Casamance',
    lat: 12.4167, lng: -16.75, type: 'Île historique',
    description: 'Ancien comptoir de traite négrière et de commerce portugais à l\'embouchure de la Casamance. Ruines du fort, cimetière colonial, plages désertes. Atmosphère mélancolique et sauvage. Un des lieux les plus préservés et méconnus du Sénégal.',
    attractions: [
      { nom: 'Ruines du fort portugais', desc: 'Vestiges du comptoir colonial du XVIIe siècle' },
      { nom: 'Cimetière colonial', desc: 'Tombe anciennes, histoire oubliée' },
      { nom: 'Plage de Karabane', desc: 'Plage vierge, cocotiers, silence absolu' },
      { nom: 'Village de pêcheurs', desc: 'Quelques cases, authenticité totale' },
    ],
    periode: 'Novembre à mai.',
    activites: ['Visite historique', 'Baignade', 'Pêche', 'Camping sauvage'],
    acces: 'Pirogue depuis Elinkine ou Ziguinchor (1-2h). Pas de régulier — négocier avec pêcheurs.',
    duree: '1 à 2 jours',
    label: 'Histoire · Sauvage · Île',
  },
  {
    id: 'mar-lodj', nom: 'Île de Mar Lodj', region: 'Sine-Saloum',
    lat: 13.7833, lng: -16.6167, type: 'Île & Écolodge',
    description: 'Île du Delta du Saloum, ancien comptoir français transformé en destination écotouristique. Plages bordées de mangrove, écolodges de charme, piroguiers locaux. Ambiance Robinson Crusoe avec confort.',
    attractions: [
      { nom: 'Plage de Mar Lodj', desc: 'Plage isolée, eaux chaudes, mangrove' },
      { nom: 'Écolodge', desc: 'Hébergement éco-responsable, cuisine locale' },
      { nom: 'Pêche traditionnelle', desc: 'Accompagner les piroguiers au filet' },
      { nom: 'Bolongs', desc: 'Pirogue dans les canaux bordés de palétuviers' },
    ],
    periode: 'Octobre à mai.',
    activites: ['Baignade', 'Pirogue', 'Observation oiseaux', 'Écotourisme', 'Détente'],
    acces: 'Pirogue depuis Soucouta ou Palmarin (30-45 min). Réservation écolodge recommandée.',
    duree: '2 à 4 jours',
    label: 'Écolodge · Île · Détente',
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // VILLES & ESCALES
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'ziguinchor-ville', nom: 'Ziguinchor', region: 'Casamance',
    lat: 12.5633, lng: -16.2733, type: 'Capitale régionale',
    description: 'Capitale de la Casamance, ville tropicale aux allures différentes du reste du Sénégal. Rues verdoyantes, marché coloré, fleuve Casamance, ambiance détendue. Carrefour entre les cultures diola, mandingue et créole portugais.',
    attractions: [
      { nom: 'Marché central', desc: 'Épices, fruits tropicaux, tissus wax, artisanat' },
      { nom: 'Fleuve Casamance', desc: 'Promenade en pirogue, coucher de soleil sur l\'eau' },
      { nom: 'Ancienne mission catholique', desc: 'Architecture coloniale, jardin botanique' },
      { nom: 'Village artisanal', desc: 'Sculpture sur bois, tissage, poterie' },
    ],
    periode: 'Novembre à mai (moins humide).',
    activites: ['Marché', 'Pirogue', 'Visite villages', 'Festival', 'Gastronomie casamançaise'],
    acces: 'Vol Dakar-Ziguinchor (50 min). Ou route (6h depuis Dakar).',
    duree: '2 à 3 jours',
    label: 'Casamance · Marché · Détente',
  },
  {
    id: 'kolda', nom: 'Kolda', region: 'Sud Sénégal',
    lat: 12.8833, lng: -14.95, type: 'Ville de province',
    description: 'Capitale de la région de Kolda, au cœur de la Casamance orientale. Ville animée, marché vivant, rizières à perte de vue. Porte d\'entrée vers les régions les plus méconnues et verdoyantes du Sénégal.',
    attractions: [
      { nom: 'Marché de Kolda', desc: 'Grand marché régional, bétail, céréales' },
      { nom: 'Rizières', desc: 'Paysages de rizières inondées en saison des pluies' },
      { nom: 'Villages mandingues', desc: 'Cases traditionnelles, griots, traditions' },
    ],
    periode: 'Novembre à mai.',
    activites: ['Marché', 'Visite villages', 'Randonnée', 'Photographie'],
    acces: 'Route depuis Ziguinchor (3h) ou Tambacounda (4h).',
    duree: '1 à 2 jours',
    label: 'Province · Casamance · Rizières',
  },
  {
    id: 'tambacounda', nom: 'Tambacounda', region: 'Est Sénégal',
    lat: 13.7667, lng: -13.6833, type: 'Capitale régionale',
    description: 'Capitale de l\'est du Sénégal, porte du Sahel et du Niokolo-Koba. Ville de transit animée, marché coloré, architecture coloniale. Carrefour entre savane et forêt, Sénégalais et Maliens.',
    attractions: [
      { nom: 'Marché de Tambacounda', desc: 'Marché régional, produits du Sahel' },
      { nom: 'Gare ferroviaire', desc: 'Gare historique du Dakar-Bamako' },
      { nom: 'Musée régional', desc: 'Artéfacts ethnographiques de l\'est' },
    ],
    periode: 'Novembre à février.',
    activites: ['Marché', 'Safari Niokolo-Koba', 'Rencontre locale'],
    acces: 'Route de Dakar (7h) ou vol. Train Dakar-Bamako.',
    duree: '1 journée (transit) ou 3-4 jours (avec safari)',
    label: 'Sahel · Transit · Safari',
  },
  {
    id: 'fatick', nom: 'Fatick', region: 'Sine-Saloum',
    lat: 14.35, lng: -16.4167, type: 'Capitale régionale',
    description: 'Capitale du Sine-Saloum, région sérère. Terroir agricole, cimetières royaux sérères, cases traditionnelles. Porte d\'entrée vers le Delta du Saloum. Ville authentique peu touristique.',
    attractions: [
      { nom: 'Cimetière royal de Ngayokhème', desc: 'Tombeaux des rois sérères, pierres sacrées' },
      { nom: 'Marché de Fatick', desc: 'Marché local, mil, arachide, artisanat' },
      { nom: 'Cases traditionnelles', desc: 'Architecture sérère, toits de chaume' },
    ],
    periode: 'Novembre à mai.',
    activites: ['Visite culturelle', 'Delta du Saloum', 'Rencontre sérère'],
    acces: 'Route de Dakar (2h) ou Kaolack (1h).',
    duree: '1 journée',
    label: 'Culture · Sérère · Delta',
  },
  {
    id: 'louga', nom: 'Louga & le Ferlo', region: 'Louga',
    lat: 15.6167, lng: -16.2167, type: 'Ville & Steppe',
    description: 'Louga : ville du Sahel sénégalais. Aux alentours, le Ferlo : steppe herbeuse, terroir pastoral peul, zaïras (regroupements de troupeaux). Paysage sahélien authentique, villages de bergers, dunes de Lompoul à proximité.',
    attractions: [
      { nom: 'Marché de bétail de Louga', desc: 'Un des plus grands marchés à bétail du Sénégal' },
      { nom: 'Ferlo', desc: 'Steppe infinie, troupeaux de zébus, nomades peuls' },
      { nom: 'Villages peuls', desc: 'Cases rondes, lait frais, traditions pastorales' },
      { nom: 'Désert de Lompoul', desc: 'Dunes à 1h de Louga' },
    ],
    periode: 'Novembre à mars (frais).',
    activites: ['Marché', 'Randonnée steppe', 'Rencontre Peuls', 'Lompoul'],
    acces: 'Route de Dakar (3h) ou Saint-Louis (2h).',
    duree: '2 à 3 jours',
    label: 'Sahel · Pastoral · Steppe',
  },
  {
    id: 'matam', nom: 'Matam & le Fouta', region: 'Matam',
    lat: 15.6167, lng: -13.2667, type: 'Ville & Agriculture irriguée',
    description: 'Matam : ville agricole du nord-est, cœur du Fouta sénégalais. Canaux d\'irrigation du fleuve Sénégal, rizières, vergers de mangues. Carrefour entre Sénégal et Mauritanie. Ambiance sahélienne paisible.',
    attractions: [
      { nom: 'Canaux d\'irrigation', desc: 'Rizières vertes au milieu du Sahel, technique moderne' },
      { nom: 'Marché de Matam', desc: 'Riz, mangues, légumes du Fouta' },
      { nom: 'Fleuve Sénégal', desc: 'Berge du fleuve, pêche, vue sur la Mauritanie' },
    ],
    periode: 'Novembre à février.',
    activites: ['Visite rizières', 'Marché', 'Pêche fleuve', 'Transit Mauritanie'],
    acces: 'Route de Dakar (8h) ou Saint-Louis (5h).',
    duree: '1 journée',
    label: 'Agriculture · Fleuve · Fouta',
  },
]

function findNearestTouristZone(lat, lng) {
  let best = null, bestDist = Infinity
  for (const z of ZONES_TOURISTIQUES) {
    const d = haversine(lat, lng, z.lat, z.lng)
    if (d < bestDist) { bestDist = d; best = z }
  }
  // Seuil 10 km max : on n'affiche une zone touristique que si vraiment proche
  return bestDist < 10000 ? { ...best, distance: Math.round(bestDist) } : null
}

function searchTouristZones(q) {
  if (!q.trim()) return []
  const lower = q.toLowerCase()
  return ZONES_TOURISTIQUES.filter(z =>
    z.nom.toLowerCase().includes(lower) ||
    z.region.toLowerCase().includes(lower) ||
    z.type.toLowerCase().includes(lower) ||
    z.label.toLowerCase().includes(lower) ||
    z.activites.some(a => a.toLowerCase().includes(lower)) ||
    z.attractions.some(a => a.nom.toLowerCase().includes(lower))
  ).slice(0, 8)
}

const TILES = {
  voyager: { url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', attr: '© OSM contributors, © CARTO' },
  osm:     { url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',                       attr: '© OpenStreetMap contributors' },
  dark:    { url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',            attr: '© OSM contributors, © CARTO' },
  sat:     { url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', attr: '© Esri, NASA, USGS' },
}

const MOVE_THRESHOLD_M = 100
const TRAVEL_SPEED_MS  = 5
const SCAN_COOLDOWN_MS = 15000

function haversine(lat1, lng1, lat2, lng2) {
  const R = 6371000
  const toRad = x => x * Math.PI / 180
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a = Math.sin(dLat/2)**2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng/2)**2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
}

function playBeep() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain); gain.connect(ctx.destination)
    osc.frequency.setValueAtTime(880, ctx.currentTime)
    gain.gain.setValueAtTime(0.08, ctx.currentTime)
    osc.start(); setTimeout(() => osc.stop(), 120)
  } catch { /* ignore */ }
}

async function fetchWithRetry(url, opts, retries = 2, delay = 1200) {
  for (let i = 0; i <= retries; i++) {
    try {
      const res = await fetch(url, opts)
      if (res.ok || res.status < 500) return res
      throw new Error('HTTP '+res.status)
    } catch (e) {
      if (i === retries) throw e
      await new Promise(r => setTimeout(r, delay * (i + 1)))
    }
  }
  throw new Error('Max retries')
}

// ─── Overpass query builder ────────────────────────────────────────────────────
function buildQuery(lat, lng, radius, tags) {
  const lines = tags.flatMap(([key, val]) => {
    const filter = val === '.*' ? `["${key}"]` : `["${key}"~"${val}"]`
    return [
      `node${filter}(around:${radius},${lat},${lng});`,
      `way${filter}(around:${radius},${lat},${lng});`,
    ]
  })
  return `[out:json][timeout:30];\n(\n  ${lines.join('\n  ')}\n);\nout center;`
}

// ─── Leaflet icons ─────────────────────────────────────────────────────────────
function catIcon(color, emoji, selected = false) {
  const size = selected ? 40 : 32
  return divIcon({
    className: '',
    html: `<div style="background:${color};width:${size}px;height:${size}px;border-radius:50%;border:${selected?'3':'2'}px solid white;display:flex;align-items:center;justify-content:center;font-size:${selected?16:13}px;box-shadow:0 ${selected?6:3}px ${selected?16:10}px rgba(0,0,0,0.35);transition:all 0.2s">${emoji}</div>`,
    iconSize: [size, size], iconAnchor: [size/2, size/2], popupAnchor: [0, -size/2 - 4],
  })
}
function userIcon() {
  return divIcon({
    className: '',
    html: `<div style="background:#3B82F6;width:18px;height:18px;border-radius:50%;border:3px solid white;box-shadow:0 0 0 5px rgba(59,130,246,0.22),0 3px 8px rgba(0,0,0,0.3)"></div>`,
    iconSize: [18, 18], iconAnchor: [9, 9],
  })
}

// ─── React-leaflet helpers ─────────────────────────────────────────────────────
function MapFly({ center, zoom }) {
  const map = useMap()
  useEffect(() => {
    if (center) map.flyTo([center.lat, center.lng], zoom, { duration: 1.1 })
  }, [center, map, zoom])
  return null
}
function MapClick({ onMapClick }) {
  useMapEvents({ click: e => onMapClick({ lat: e.latlng.lat, lng: e.latlng.lng }) })
  return null
}

// ─── Comprehensive OSM data extractor ─────────────────────────────────────────
function isUrl(s) { return s && (s.startsWith('http') || s.startsWith('www.')) }
function asUrl(s) { return s ? (s.startsWith('http') ? s : `https://${s}`) : null }

function extractPoiData(tags) {
  const t = tags

  // Address (compose from OSM addr:* tags)
  const addrParts = [
    t['addr:housenumber'] && t['addr:street'] ? `${t['addr:housenumber']} ${t['addr:street']}` : t['addr:street'],
    t['addr:full'],
    t['addr:suburb'] || t['addr:neighbourhood'] || t['addr:quarter'],
    t['addr:city'] || t['addr:town'] || t['addr:village'],
    t['addr:district'],
    t['addr:state'],
    t['addr:postcode'],
  ].filter(Boolean)
  const address = addrParts.length ? addrParts.join(', ') : null

  // Phones (deduplicate)
  const phones = [...new Set([t.phone, t['contact:phone'], t['phone:mobile'], t['contact:mobile'], t['phone:2']].filter(Boolean))]

  // Emails
  const emails = [...new Set([t.email, t['contact:email']].filter(Boolean))]

  // Websites
  const websites = [...new Set([t.website, t['contact:website'], t.url, t['contact:url']].filter(Boolean))]

  // Social media
  const socials = [
    t.facebook || t['contact:facebook'] ? { icon:'📘', name:'Facebook', url: asUrl(isUrl(t.facebook||t['contact:facebook']) ? t.facebook||t['contact:facebook'] : `facebook.com/${t.facebook||t['contact:facebook']}`) } : null,
    t.instagram || t['contact:instagram'] ? { icon:'📸', name:'Instagram', url: asUrl(isUrl(t.instagram||t['contact:instagram']) ? t.instagram||t['contact:instagram'] : `instagram.com/${(t.instagram||t['contact:instagram']).replace(/^@/,'')}`) } : null,
    t.twitter || t['contact:twitter'] ? { icon:'🐦', name:'X/Twitter', url: asUrl(isUrl(t.twitter||t['contact:twitter']) ? t.twitter||t['contact:twitter'] : `twitter.com/${t.twitter||t['contact:twitter']}`) } : null,
    t.whatsapp || t['contact:whatsapp'] ? { icon:'💬', name:'WhatsApp', url: `https://wa.me/${(t.whatsapp||t['contact:whatsapp']).replace(/\D/g,'')}` } : null,
    t.telegram || t['contact:telegram'] ? { icon:'✈️', name:'Telegram', url: asUrl(isUrl(t.telegram||t['contact:telegram']) ? t.telegram||t['contact:telegram'] : `t.me/${t.telegram||t['contact:telegram']}`) } : null,
    t.youtube || t['contact:youtube'] ? { icon:'▶️', name:'YouTube', url: asUrl(t.youtube||t['contact:youtube']) } : null,
    t.linkedin || t['contact:linkedin'] ? { icon:'💼', name:'LinkedIn', url: asUrl(t.linkedin||t['contact:linkedin']) } : null,
    t.tiktok || t['contact:tiktok'] ? { icon:'🎵', name:'TikTok', url: asUrl(t.tiktok||t['contact:tiktok']) } : null,
  ].filter(Boolean)

  // Wikipedia/Wikidata
  let wikiUrl = null
  if (t.wikipedia) {
    const parts = t.wikipedia.split(':')
    const lang  = parts.length > 1 ? parts[0] : 'fr'
    const title = parts.length > 1 ? parts.slice(1).join(':') : t.wikipedia
    wikiUrl = `https://${lang}.wikipedia.org/wiki/${encodeURIComponent(title)}`
  }
  const wikidataUrl = t.wikidata ? `https://www.wikidata.org/wiki/${t.wikidata}` : null

  // Service tags
  const services = [
    t.delivery === 'yes' && 'Livraison',
    t.takeaway === 'yes' && 'À emporter',
    t.outdoor_seating === 'yes' && 'Terrasse',
    t.drive_through === 'yes' && 'Drive-through',
    t.air_conditioning === 'yes' && 'Climatisation',
    (t.internet_access && t.internet_access !== 'no') && `WiFi`,
    t.toilets === 'yes' && 'Toilettes',
    t.smoking === 'outside' && 'Fumeurs (extérieur)',
    t.smoking === 'no' && 'Non-fumeurs',
  ].filter(Boolean)

  // Payment
  const payments = [
    (t['payment:cash'] !== 'no') && 'Espèces',
    t['payment:cards'] === 'yes' && 'Carte bancaire',
    t['payment:visa'] === 'yes' && 'Visa',
    t['payment:mastercard'] === 'yes' && 'Mastercard',
    t['payment:mobile_money'] === 'yes' && 'Mobile Money',
    t['payment:wave'] === 'yes' && 'Wave',
    t['payment:orange_money'] === 'yes' && 'Orange Money',
  ].filter(Boolean)

  // Diet
  const diets = [
    t['diet:halal'] === 'yes' && '🟢 Halal',
    t['diet:vegetarian'] === 'yes' && '🥦 Végétarien',
    t['diet:vegan'] === 'yes' && '🌱 Vegan',
    t['diet:kosher'] === 'yes' && 'Casher',
  ].filter(Boolean)

  // Building / structure info
  const building = t.building && t.building !== 'yes' ? t.building : null
  const buildingType = t['building:use'] || t['building:architecture'] || null
  const height = t.height ? `${t.height} m` : null
  const buildingLevels = t['building:levels'] || t.levels || null
  const material = t['building:material'] || t.material || null
  const architecture = t['building:architecture'] || null
  const startDate = t.start_date || t.year_built || null
  const heritage = t.heritage || t['heritage:operator'] || null
  const historic = t.historic || null
  const demolished = t.demolished || null
  const architect = t.architect || null

  return { address, phones, emails, websites, socials, wikiUrl, wikidataUrl, services, payments, diets, building, buildingType, height, buildingLevels, material, architecture, startDate, heritage, historic, demolished, architect }
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function AbSpaceGPS() {
  const [loc,       setLoc]       = useState(DAKAR)
  const [myLoc,     setMyLoc]     = useState(null)
  const [zoom,      setZoom]      = useState(15)
  const [radius,    setRadius]    = useState(1000)
  const [catId,     setCatId]     = useState('restaurant')
  const [pois,      setPois]      = useState([])
  const [loadPois,  setLoadPois]  = useState(false)
  const [poi,       setPoi]       = useState(null)
  const [zone,      setZone]      = useState(null)
  const [loadZone,  setLoadZone]  = useState(false)
  const [quartier,  setQuartier]  = useState(null)
  const [showQTab,  setShowQTab]  = useState('histoire')
  const [touristZone, setTouristZone] = useState(null)
  const [showTZTab, setShowTZTab] = useState('description')
  const [search,    setSearch]    = useState('')
  const [results,   setResults]   = useState([])
  const [searching, setSearching] = useState(false)
  const [analysis,  setAnalysis]  = useState('')
  const [loadIA,    setLoadIA]    = useState(false)
  const [searchCtx, setSearchCtx] = useState('') // contexte web enrichi
  const [loadSearch,setLoadSearch]= useState(false)
  const [tile,      setTile]      = useState('voyager')
  const [notif,     setNotif]     = useState('')
  const [myZoneMode, setMyZoneMode] = useState(false)
  const [nearby,    setNearby]    = useState([])
  const [loadNearby, setLoadNearby] = useState(false)
  const [useRealtime, setUseRealtime] = useState(true)
  const [googlePlaces, setGooglePlaces] = useState([])
  const [loadGoogle, setLoadGoogle] = useState(false)
  const [showPlaceReport, setShowPlaceReport] = useState(false)
  const watchIdRef = useRef(null)
  const autoAnalyzedZoneRef = useRef(null)
  const [isMoving,  setIsMoving]  = useState(false)
  const [moveAlert, setMoveAlert] = useState(null)
  const searchTimer = useRef(null)
  const lastScanRef = useRef(0)
  const lastSigPosRef = useRef(null)
  const cat = CATEGORIES.find(c => c.id === catId) || CATEGORIES[0]

  async function fetchZone(lat, lng) {
    setLoadZone(true)
    try {
      const r = await fetchWithRetry(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1&namedetails=1`, { headers: NOM_HEADERS })
      const d = await r.json()
      const a = d.address || {}
      const name = a.neighbourhood || a.suburb || a.quarter || a.hamlet || a.city_district || a.village || a.town || a.city || d.name || 'Zone'
      const street = a.road || a.pedestrian || a.footway || null

      let wiki = null
      for (const term of [name, a.city, a.town].filter(Boolean)) {
        try {
          const w = await fetch(`https://fr.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(term)}`)
          if (w.ok) { const wd = await w.json(); if (wd.extract) { wiki = wd; break } }
        } catch { /* ignore */ }
      }

      const q = findQuartier(lat, lng)
      setQuartier(q)
      const tz = findNearestTouristZone(lat, lng)
      setTouristZone(tz)
      // Privilégier le nom du quartier local si on est proche (< 800m) plutôt que Nominatim
      // qui peut retourner des noms imprécis ou éloignés
      const zoneName = q ? q.nom : name
      const zoneSuburb = q ? q.nom : (a.suburb || a.neighbourhood)
      setZone({ name: zoneName, street, suburb: zoneSuburb, city: a.city || a.town || a.village, district: a.county || a.state_district, region: a.state, country: a.country, postcode: a.postcode, lat, lng, wiki: wiki?.extract, wikiTitle: wiki?.title, wikiUrl: wiki?.content_urls?.desktop?.page })
    } catch { /* ignore */ }
    setLoadZone(false)
  }

  async function fetchPois(lat, lng, r, c) {
    setLoadPois(true); setPois([]); setPoi(null); setGooglePlaces([])
    const overpassPromise = (async () => {
      const q = buildQuery(lat, lng, r, c.tags)
      const res = await fetchWithRetry(OVERPASS, { method: 'POST', body: q, headers: { 'Content-Type': 'text/plain' } })
      const data = await res.json()
      return (data.elements || [])
        .map(el => ({
          id: el.id, osmType: el.type,
          lat: el.lat ?? el.center?.lat,
          lng: el.lon ?? el.center?.lon,
          name: el.tags?.name || el.tags?.['name:fr'] || el.tags?.['name:en'] || 'Sans nom',
          tags: el.tags || {},
          source: 'osm'
        }))
        .filter(p => p.lat && p.lng)
        .sort((a, b) => Math.hypot(a.lat - lat, a.lng - lng) - Math.hypot(b.lat - lat, b.lng - lng))
        .slice(0, 60)
    })()
    const googlePromise = useRealtime ? (async () => {
      setLoadGoogle(true)
      try {
        const gp = await fetchGooglePlacesByCategory(lat, lng, r, c.id, true)
        return (gp.results || []).map((p, i) => ({
          id: `gp_${p.placeId || i}`,
          osmType: 'google',
          lat: p.lat,
          lng: p.lng,
          name: p.name,
          tags: {
            name: p.name,
            phone: '',
            address: p.address,
            rating: p.rating,
            totalRatings: p.totalRatings,
            openNow: p.openNow,
            photoReference: p.photoReference,
            businessStatus: p.businessStatus,
            placeId: p.placeId,
            types: p.types
          },
          source: 'google',
          googleData: p
        }))
      } catch (e) { console.error(e); return [] }
      finally { setLoadGoogle(false) }
    })() : Promise.resolve([])
    try {
      const [osmItems, gpItems] = await Promise.all([overpassPromise, googlePromise])
      setPois([...osmItems, ...gpItems])
      setGooglePlaces(gpItems)
    } catch { setNotif('Erreur chargement. Vérifiez votre connexion.') }
    setLoadPois(false)
  }

  async function fetchNearbyCommodities(lat, lng, r = 500) {
    setLoadNearby(true); setNearby([])
    try {
      const essentials = CATEGORIES.filter(c => ['restaurant','sante','commerce','services','transport'].includes(c.id))
      const allTags = essentials.flatMap(c => c.tags)
      const q = buildQuery(lat, lng, r, allTags)
      const res = await fetchWithRetry(OVERPASS, { method: 'POST', body: q, headers: { 'Content-Type': 'text/plain' } })
      const data = await res.json()
      const items = (data.elements || [])
        .map(el => ({
          id: el.id, osmType: el.type,
          lat: el.lat ?? el.center?.lat,
          lng: el.lon ?? el.center?.lon,
          name: el.tags?.name || el.tags?.['name:fr'] || el.tags?.['name:en'] || 'Sans nom',
          tags: el.tags || {},
          dist: Math.hypot((el.lat ?? el.center?.lat) - lat, (el.lon ?? el.center?.lon) - lng),
        }))
        .filter(p => p.lat && p.lng)
        .sort((a, b) => a.dist - b.dist)
        .slice(0, 20)
      const enriched = items.map(p => {
        const cat = CATEGORIES.find(c => c.tags.some(([k,v]) => {
          const pv = p.tags[k]
          if (!pv) return false
          if (v === '.*') return true
          const re = new RegExp(v)
          return re.test(pv)
        })) || { id:'autre', label:'Autre', icon:'📍', color:'#64748B' }
        return { ...p, category: cat }
      })
      setNearby(enriched)
    } catch { setNotif('Erreur réseau OSM — réessayez manuellement') }
    setLoadNearby(false)
  }

  // ── Geolocation on mount ──
  useEffect(() => {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(
      p => {
        const acc = p.coords.accuracy
        if (acc && acc > 800) {
          setNotif(`📡 GPS imprécis (${Math.round(acc)}m) — cliquez manuellement sur la carte pour une zone exacte`)
        }
        const l = { lat: p.coords.latitude, lng: p.coords.longitude }
        setLoc(l); setMyLoc(l)
      },
      () => {},
      { timeout: 8000, enableHighAccuracy: true, maximumAge: 60000 }
    )
  }, [])

  // ── My Zone: smart GPS with movement detection ──
  useEffect(() => {
    if (!myZoneMode) {
      if (watchIdRef.current !== null) { navigator.geolocation.clearWatch(watchIdRef.current); watchIdRef.current = null }
      return
    }
    if (!navigator.geolocation) { Promise.resolve().then(() => { setNotif('Géolocalisation non disponible'); setMyZoneMode(false) }); return }
    const id = navigator.geolocation.watchPosition(
      p => {
        const acc = p.coords.accuracy
        // Ignorer les positions trop imprécises en mode MyZone
        if (acc && acc > 1200) {
          setNotif(`📡 Signal GPS faible (${Math.round(acc)}m) — position ignorée`)
          return
        }
        const l = { lat: p.coords.latitude, lng: p.coords.longitude }
        const speed = p.coords.speed
        const now = Date.now()
        setMyLoc(l); setLoc(l)
        if (lastSigPosRef.current) {
          const dist = haversine(lastSigPosRef.current.lat, lastSigPosRef.current.lng, l.lat, l.lng)
          const isFast = speed !== null && speed > TRAVEL_SPEED_MS
          const isFar = dist > MOVE_THRESHOLD_M
          const moving = isFast || isFar
          setIsMoving(moving)
          if (moving && (now - lastScanRef.current > SCAN_COOLDOWN_MS)) {
            lastScanRef.current = now
            lastSigPosRef.current = l
            setMoveAlert({ dist: Math.round(dist), speed: speed ? Math.round(speed * 3.6) : null, at: now })
            playBeep()
            setNotif(`🚗 Déplacement — ${isFar ? Math.round(dist)+'m' : ''}${isFar && isFast ? ' · ' : ''}${isFast ? Math.round(speed*3.6)+' km/h' : ''}`)
            fetchNearbyCommodities(l.lat, l.lng, 500).catch(()=>{})
            fetchZone(l.lat, l.lng).catch(()=>{})
          }
        } else {
          lastSigPosRef.current = l
        }
      },
      err => {
        const msg = err.code === 1 ? 'GPS refusé — autorisez la géolocalisation' :
                    err.code === 2 ? 'Signal GPS indisponible' :
                    err.code === 3 ? 'GPS trop lent — vérifiez votre connexion' : 'Position inaccessible'
        setNotif(msg)
      },
      { enableHighAccuracy: true, maximumAge: 30000, timeout: 15000 }
    )
    watchIdRef.current = id
    return () => { navigator.geolocation.clearWatch(id) }
  }, [myZoneMode])

  // ── Zone info when location changes ──
  useEffect(() => { if (loc) Promise.resolve().then(() => fetchZone(loc.lat, loc.lng)) }, [loc])

  // ── Auto-fetch nearby commodities dès détection (sans myZoneMode) ──
  useEffect(() => {
    if (!loc) return
    const t = setTimeout(() => fetchNearbyCommodities(loc.lat, loc.lng, 500), 800)
    return () => clearTimeout(t)
  }, [loc?.lat, loc?.lng])

  // ── Auto-analyse IA dès que zone + commodités proches sont prêts ──
  useEffect(() => {
    if (!zone || loadIA) return
    if (autoAnalyzedZoneRef.current === zone.name) return
    // Lancer l'analyse même sans nearby (Wikipedia suffit pour l'histoire/figures)
    autoAnalyzedZoneRef.current = zone.name
    const t = setTimeout(() => analyzeZone(), 900)
    return () => clearTimeout(t)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zone?.name, nearby.length])

  // ── POIs when location/cat/radius change ──
  useEffect(() => {
    if (!loc) return
    const t = setTimeout(() => fetchPois(loc.lat, loc.lng, radius, cat), 500)
    return () => clearTimeout(t)
  }, [loc?.lat, loc?.lng, radius, catId, loc, cat])

  // ── Notif auto-dismiss ──
  useEffect(() => { if (notif) { const t = setTimeout(() => setNotif(''), 3500); return () => clearTimeout(t) } }, [notif])

  function onMapClick(newLoc) {
    setLoc(newLoc); setPoi(null); setAnalysis('')
    setQuartier(null); setTouristZone(null)
    autoAnalyzedZoneRef.current = null
  }

  function locateMe() {
    if (!navigator.geolocation) { setNotif('Géolocalisation non disponible'); return }
    navigator.geolocation.getCurrentPosition(
      p => {
        const acc = p.coords.accuracy
        const l = { lat: p.coords.latitude, lng: p.coords.longitude }
        setLoc(l); setMyLoc(l); setZoom(16)
        if (acc && acc > 800) {
          setNotif(`📍 Position détectée — précision ${Math.round(acc)}m. Zoomez ou cliquez sur la carte pour affiner.`)
        } else {
          setNotif('📍 Position détectée')
        }
      },
      () => setNotif('Position inaccessible'),
      { timeout: 8000, enableHighAccuracy: true }
    )
  }

  // Initial scan when MyZone activates; reset refs on deactivate
  useEffect(() => {
    if (myZoneMode && loc) {
      if (!lastScanRef.current) {
        lastScanRef.current = Date.now()
        lastSigPosRef.current = loc
        Promise.resolve().then(() => fetchNearbyCommodities(loc.lat, loc.lng, 1000).catch(()=>{}))
      }
    } else {
      lastScanRef.current = 0
      lastSigPosRef.current = null
      Promise.resolve().then(() => { setIsMoving(false); setMoveAlert(null) })
    }
  }, [myZoneMode, loc])

  async function doSearch(q) {
    if (!q.trim()) { setResults([]); return }
    setSearching(true)
    try {
      const base = `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&namedetails=1`
      const WA_CODES = 'sn,ci,bf,ml,bj,tg,gn,mr,gw,cv,sl,lr,gh,ng,cm,ga'
      // Priorité Afrique de l'Ouest
      const r1 = await fetch(`${base}&q=${encodeURIComponent(q)}&countrycodes=${WA_CODES}&limit=6`, { headers: NOM_HEADERS })
      const d1 = await r1.json()
      if (d1.length > 0) { setResults(d1) }
      else {
        // Fallback mondial si rien trouvé en Afrique de l'Ouest
        const r2 = await fetch(`${base}&q=${encodeURIComponent(q)}&limit=5`, { headers: NOM_HEADERS })
        setResults(await r2.json())
      }
    } catch { /* ignore */ }
    setSearching(false)
  }

  function pickResult(r) {
    const newLoc = { lat: parseFloat(r.lat), lng: parseFloat(r.lon) }
    setLoc(newLoc); setSearch(r.display_name.split(',')[0]); setResults([])
    setPoi(null); setAnalysis(''); setQuartier(null); setTouristZone(null)
    setZoom(r.type === 'country' ? 5 : r.type === 'state' ? 8 : r.type === 'city' ? 12 : 15)
  }

  function pickQuartier(q) {
    setLoc({ lat: q.lat, lng: q.lng })
    setSearch(q.nom + ', ' + q.ville)
    setResults([])
    setPoi(null); setAnalysis(''); setTouristZone(null)
    setZoom(15)
  }

  function pickTouristZone(z) {
    setLoc({ lat: z.lat, lng: z.lng })
    setSearch(z.nom)
    setResults([])
    setPoi(null); setAnalysis('')
    setZoom(13)
  }

  function doSearchQuartiers(q) {
    if (!q.trim()) return []
    const lower = q.toLowerCase()
    return QUARTIERS.filter(qr =>
      qr.nom.toLowerCase().includes(lower) ||
      qr.ville.toLowerCase().includes(lower) ||
      qr.type.toLowerCase().includes(lower) ||
      qr.landmarks.some(l => l.nom.toLowerCase().includes(lower)) ||
      qr.figures.some(f => f.nom.toLowerCase().includes(lower))
    ).slice(0, 6)
  }

  function doSearchTourist(q) {
    if (!q.trim()) return []
    return searchTouristZones(q)
  }

  // ── Wikipedia geo-search + article summaries near coordinates ──────────
  async function fetchWikiGeoContext(lat, lng, zoneName, city) {
    try {
      const lang = 'fr'
      const results = await Promise.allSettled([
        // Géo-search: articles Wikipedia proches des coordonnées
        fetch(`https://${lang}.wikipedia.org/w/api.php?action=query&list=geosearch&gscoord=${lat}|${lng}&gsradius=8000&gslimit=8&format=json&origin=*`)
          .then(r => r.json()),
        // Recherche textuelle sur le nom de la zone
        fetch(`https://${lang}.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(`${zoneName} ${city || ''}`.trim())}&srlimit=5&format=json&origin=*`)
          .then(r => r.json()),
      ])

      const geoPages = results[0].status === 'fulfilled' ? (results[0].value?.query?.geosearch || []) : []
      const searchPages = results[1].status === 'fulfilled' ? (results[1].value?.query?.search || []) : []

      // Dédupliquer et combiner
      const seen = new Set()
      const titles = []
      ;[...geoPages.map(p => p.title), ...searchPages.map(p => p.title)].forEach(t => {
        if (!seen.has(t)) { seen.add(t); titles.push(t) }
      })

      // Charger les résumés des 6 premiers articles
      const summaries = await Promise.allSettled(
        titles.slice(0, 6).map(title =>
          fetch(`https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`)
            .then(r => r.ok ? r.json() : null)
        )
      )

      const ctx = summaries
        .filter(r => r.status === 'fulfilled' && r.value?.extract)
        .map(r => `### ${r.value.title}\n${r.value.extract.slice(0, 400)}`)
        .join('\n\n')

      return ctx
    } catch { return '' }
  }

  // ── Groq compound-beta: recherche web temps réel ─────────────────────
  async function fetchCompoundSearch(query) {
    const key = import.meta.env.VITE_GROQ_API_KEY
    if (!key || key.startsWith('***')) return ''
    try {
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'compound-beta',
          messages: [{
            role: 'user',
            content: `Recherche des informations récentes et historiques sur: "${query}".
Inclus: histoire, personnalités notables (politiciens, artistes, marabouts, entrepreneurs, sportifs nés ou résidant là),
événements importants, activité économique, infrastructure, données démographiques.
Sois factuel et précis. Réponds en français.`,
          }],
          max_tokens: 700,
          temperature: 0.2,
        })
      })
      if (!res.ok) return ''
      const data = await res.json()
      return data.choices?.[0]?.message?.content || ''
    } catch { return '' }
  }

  async function analyzeZone() {
    if (!zone || loadIA) return
    setLoadIA(true); setAnalysis(''); setSearchCtx('')
    try {
      const searchQuery = [zone.name, zone.city, zone.country].filter(Boolean).join(' ')

      // ── Étape 1 : recherches en parallèle (Wikipedia + web) ──
      setLoadSearch(true)
      const [wikiCtxRaw, webCtxRaw] = await Promise.allSettled([
        fetchWikiGeoContext(zone.lat, zone.lng, zone.name, zone.city),
        fetchCompoundSearch(searchQuery),
      ])
      const wikiCtx  = wikiCtxRaw.status  === 'fulfilled' ? wikiCtxRaw.value  : ''
      const webCtx   = webCtxRaw.status   === 'fulfilled' ? webCtxRaw.value   : ''
      setLoadSearch(false)

      const combinedSearch = [
        zone.wiki ? `## Wikipedia (extrait)\n${zone.wiki.slice(0, 600)}` : '',
        wikiCtx   ? `## Articles Wikipedia proches\n${wikiCtx}` : '',
        webCtx    ? `## Recherche web (compound-beta)\n${webCtx}` : '',
      ].filter(Boolean).join('\n\n')

      if (combinedSearch) setSearchCtx(combinedSearch)

      // ── Étape 2 : contexte OSM + quartier ──
      const nearbyList = nearby.slice(0, 15)
        .map(p => `${p.category.icon} ${p.name} (${p.category.label}, ~${Math.round(p.dist * 111000)}m)`)
        .join('\n')
      const quartierCtx = quartier
        ? `\nQuartier local: ${quartier.nom} — ${quartier.type} — pop. ${quartier.population} — ambiance: ${quartier.ambiance} — sécurité: ${quartier.securite} — transport: ${quartier.transport}`
        : ''

      // ── Étape 3 : prompt enrichi ──
      const prompt = `Tu es AbSpace IA, expert en intelligence territoriale et développement économique pour l'Afrique de l'Ouest.

ZONE: "${zone.name}"
Adresse complète: ${[zone.street, zone.suburb, zone.city, zone.district, zone.region, zone.country].filter(Boolean).join(', ')}
Coordonnées GPS: ${zone.lat?.toFixed(5)}, ${zone.lng?.toFixed(5)}${quartierCtx}
${nearbyList ? `\nÉtablissements détectés par GPS OSM (500m):\n${nearbyList}` : ''}
${combinedSearch ? `\n\n═══ DONNÉES ENRICHIES (Wikipedia + Recherche Web) ═══\n${combinedSearch}` : ''}

INSTRUCTIONS: Produis une FICHE TERRITOIRE COMPLÈTE et TRÈS RICHE. Exploite toutes les données ci-dessus + tes connaissances. Sois factuel, dense, précis. Format exact:

**📍 Identification**
Nom officiel complet, type (quartier/commune/arrondissement/village), statut administratif, superficie estimée, altitude approximative.

**🏛️ Histoire & Chronologie**
Origine du nom et sa signification, date de fondation ou première mention historique, faits historiques marquants (colonisation, indépendance, développement urbain), évolution démographique et urbanistique. Cite des dates précises quand disponibles.

**👤 Personnalités & Figures Marquantes**
Liste des personnalités nées, résidantes ou ayant marqué ce lieu: politiciens, chefs d'État, ministres, marabouts/chefs religieux, artistes (musiciens, acteurs, peintres), entrepreneurs notables, sportifs, intellectuels, leaders associatifs. Pour chaque figure: nom, domaine, période.

**🎭 Événements Notables**
Événements historiques ou récents ayant eu lieu ici (manifestations, inaugurations, conflits, cérémonies importantes, événements culturels annuels récurrents, catastrophes naturelles éventuelles).

**🏘️ Profil Urbain & Démographique**
Type dominant (résidentiel populaire/standing/commercial/mixte/industriel), densité de population estimée, composition ethnique et religieuse, architecture caractéristique (maisons coloniales/HLM/villas/maisons en banco), langues parlées.

**📊 Activité Économique**
Secteurs dominants, marchés importants (noms si connus), principales entreprises ou sièges sociaux, tissu de PME/artisans, secteur informel, salaires moyens, prix de l'immobilier si connu.

**🚗 Transport & Accessibilité**
Axes routiers principaux (noms de routes/autoroutes), transports en commun disponibles (bus, car rapide, Dakar Dem Dikk, BRT, taxi-moto), distance/durée vers le centre-ville et l'aéroport.

**🏥 Services & Infrastructures**
Santé: hôpitaux, cliniques, pharmacies (noms si connus). Éducation: écoles primaires/secondaires, universités, centres de formation. Administration: mairies, préfectures, commissariats. Eau potable, électricité, connexion internet (qualité).

**🌿 Environnement & Cadre de Vie**
Espaces verts, risques naturels (inondations, érosion côtière), qualité de l'air, bruit, pollution éventuelle, salubrité.

**💡 Opportunités Business**
6 opportunités concrètes et actionnables adaptées à ce territoire précis. Pour chacune: secteur, concept, clientèle cible, investissement estimé (faible <5M FCFA / moyen 5-50M / élevé >50M FCFA), justification basée sur les données ci-dessus.

**⚠️ Points d'Attention**
Sécurité réelle (score sur 5), contraintes d'accès (embouteillages, routes dégradées), problèmes récurrents (inondations, coupures d'eau/électricité), aspects culturels à respecter, à savoir absolument avant d'investir.`

      const result = await callGroq(prompt, { maxTokens: 1800, temperature: 0.55 })
      setAnalysis(result || 'Analyse indisponible.')
    } catch (e) { setAnalysis('Erreur lors de l\'analyse : ' + (e?.message || 'connexion')) }
    setLoadIA(false)
    setLoadSearch(false)
  }

  function dirUrl(p) { return `https://www.google.com/maps/dir/?api=1&destination=${p.lat},${p.lng}` }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
      <style>{CSS}</style>

      <ToolHero
        icon={<ToolIcon name="abspacegps" size={44} />}
        badge="GPS · Intelligence territoriale"
        title="AbSpace"
        titleAccent="GPS"
        subtitle="Explorez n'importe quelle zone en temps réel — commerces, services, santé, histoire, opportunités business. Sénégal, Afrique et monde entier."
        gradient="linear-gradient(135deg, #0f172a 0%, #1e3a5f 45%, #1d4ed8 100%)"
        glowColor="rgba(29,78,216,0.4)"
        accentColor="#60A5FA"
        stats={[['📍','GPS intelligent'],['🏪','13 catégories'],['🛰️','Vue satellite'],['🤖','Analyse IA']]}
      />

      <div style={{ maxWidth: 1440, margin: '0 auto', padding: '20px 16px 80px' }}>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
          <TokenCounter />
        </div>
        <ToolInfoPanel
          toolName="AbSpace GPS"
          icon={<ToolIcon name="abspacegps" size={28} />}
          description="Intelligence territoriale en temps réel — explorez, orientez-vous, découvrez l'histoire et les opportunités de n'importe quelle zone"
          benefits={[
            'Détection intelligente de mouvement : scan auto uniquement quand vous bougez',
            '13 catégories : restaurants, santé, commerces, transport, hôtels, culte…',
            'Vue satellite (Esri/NASA) pour une exploration précise du territoire',
            'Analyse IA : profil économique + opportunités business concrètes',
            'Alerte sonore + visuelle en cas de déplacement significatif (100m+)',
            'Scan manuel à la demande — plus de rafraîchissements inutiles',
          ]}
          howToUse={[
            'Activez "Ma Zone" pour le suivi GPS intelligent avec détection de mouvement',
            'L\'app scanne automatiquement quand vous vous déplacez de 100m+',
            'Cliquez sur 📡 Scan pour un scan manuel instantané à la demande',
            'Sélectionnez une catégorie, ajustez le rayon, cliquez sur la carte pour explorer',
            'Appuyez sur 🛰️ pour basculer en vue satellite (Esri/World Imagery)',
            'Lancez l\'Analyse IA pour des opportunités business contextualisées',
          ]}
          tips={[
            'Le GPS intelligent évite les scans inutiles : analyse uniquement en mouvement',
            'Le bip sonore vous alerte dès qu\'un déplacement significatif est détecté',
            'La vue satellite révèle l\'infrastructure réelle (routes, bâtiments, zones vertes)',
          ]}
        />

        {notif && <div className="az-toast">{notif}</div>}

        {/* Movement alert */}
        {moveAlert && (
          <div className="az-move-alert" onClick={() => setMoveAlert(null)}>
            <div className="az-move-alert-inner">
              <span className="az-move-alert-icon">🚗</span>
              <div>
                <strong>Déplacement détecté</strong>
                <span>{moveAlert.dist > 0 ? `${moveAlert.dist}m parcourus` : ''}{moveAlert.speed ? ` · ${moveAlert.speed} km/h` : ''}</span>
              </div>
              <button className="az-move-alert-btn" onClick={e => { e.stopPropagation(); setMoveAlert(null); if (loc) { lastScanRef.current = Date.now(); fetchNearbyCommodities(loc.lat, loc.lng, 500); fetchZone(loc.lat, loc.lng); } }}>🔄 Actualiser</button>
              <button className="az-move-alert-close" onClick={e => { e.stopPropagation(); setMoveAlert(null); }}>✕</button>
            </div>
          </div>
        )}

        <div className="az-layout">

          {/* ── LEFT PANEL ── */}
          <div className="az-panel">

            {/* Search */}
            <div className="az-search-wrap">
              <input
                className="az-search-input"
                placeholder="🔍 Rechercher un quartier, ville, lieu, personnage…"
                value={search}
                onChange={e => {
                  setSearch(e.target.value)
                  clearTimeout(searchTimer.current)
                  searchTimer.current = setTimeout(() => doSearch(e.target.value), 480)
                }}
                onKeyDown={e => e.key === 'Escape' && setResults([])}
              />
              {searching && <div className="az-spin-sm" />}
              {(results.length > 0 || search.trim()) && (
                <div className="az-dropdown">
                  {doSearchTourist(search).map((z, i) => (
                    <button key={'tz'+i} className="az-result-row az-result-tourist" onClick={() => { pickTouristZone(z); setSearch(''); }}>
                      <span className="az-result-name">🌴 {z.nom} — {z.region}</span>
                      <span className="az-result-type">{z.type} · {z.label}</span>
                    </button>
                  ))}
                  {doSearchQuartiers(search).map((q, i) => (
                    <button key={'q'+i} className="az-result-row az-result-quartier" onClick={() => { pickQuartier(q); setSearch(''); }}>
                      <span className="az-result-name">🏘️ {q.nom} — {q.ville}</span>
                      <span className="az-result-type">{q.type} · {q.population}</span>
                    </button>
                  ))}
                  {results.map((r, i) => (
                    <button key={i} className="az-result-row" onClick={() => pickResult(r)}>
                      <span className="az-result-name">{r.display_name.split(',').slice(0,2).join(', ')}</span>
                      <span className="az-result-type">{r.type}</span>
                    </button>
                  ))}
                  {results.length === 0 && doSearchQuartiers(search).length === 0 && doSearchTourist(search).length === 0 && (
                    <div className="az-result-row" style={{cursor:'default'}}>
                      <span className="az-result-type">Aucun résultat</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Zone card */}
            <div className="az-zone-card">
              {loadZone ? (
                <div className="az-skeletons">
                  <div className="az-sk az-sk-line w70" /><div className="az-sk az-sk-line w50" /><div className="az-sk az-sk-line w40" />
                </div>
              ) : zone ? (
                <>
                  <div className="az-zone-top">
                    <div className="az-zone-pin">📍</div>
                    <div style={{ flex: 1 }}>
                      <div className="az-zone-name">{zone.name}</div>
                      {zone.street && zone.street !== zone.name && (
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: 2 }}>🛣️ {zone.street}</div>
                      )}
                      <div className="az-zone-sub">
                        {[
                          zone.suburb !== zone.name && zone.suburb,
                          zone.city && zone.city !== zone.name && zone.city,
                          zone.district,
                          zone.region,
                          zone.country,
                        ].filter(Boolean).join(' · ')}
                      </div>
                    </div>
                  </div>
                  {zone.wiki && (
                    <div className="az-zone-wiki">
                      <p>{zone.wiki.slice(0, 320)}{zone.wiki.length > 320 ? '…' : ''}</p>
                      {zone.wikiUrl && <a href={zone.wikiUrl} target="_blank" rel="noreferrer" className="az-wiki-link">Lire sur Wikipédia →</a>}
                    </div>
                  )}
                  <div className="az-zone-coords">📐 {zone.lat.toFixed(5)}, {zone.lng.toFixed(5)}</div>
                </>
              ) : (
                <div className="az-zone-empty">
                  <span>🗺️</span>
                  <p>Autorisez la géolocalisation ou cliquez sur la carte</p>
                </div>
              )}
            </div>

            {/* ── Quartier Detail Panel ── */}
            {quartier && (
              <div className="az-quartier-card">
                <div className="az-q-header">
                  <div className="az-q-title">🏘️ {quartier.nom}</div>
                  <div className="az-q-sub">{quartier.type} · {quartier.ville} · {quartier.population} · {quartier.superficie}</div>
                  <div className="az-q-distance">{quartier.distance}m de vous</div>
                </div>

                <div className="az-q-meta">
                  <div className="az-q-meta-item"><strong>Ambiance</strong>{quartier.ambiance}</div>
                  <div className="az-q-meta-item"><strong>Sécurité</strong>{quartier.securite}</div>
                  <div className="az-q-meta-item"><strong>Transport</strong>{quartier.transport}</div>
                  {quartier.quartiersVoisins.length > 0 && (
                    <div className="az-q-meta-item"><strong>Voisins</strong>{quartier.quartiersVoisins.join(', ')}</div>
                  )}
                </div>

                <div className="az-q-tabs">
                  {[
                    { k: 'histoire', label: '📜 Histoire' },
                    { k: 'figures', label: '👤 Figures' },
                    { k: 'evenements', label: '⚡ Événements' },
                    { k: 'landmarks', label: '🏛️ Lieux' },
                    { k: 'commerces', label: '🏪 Commerces' },
                  ].map(t => (
                    <button key={t.k} className={`az-q-tab ${showQTab === t.k ? 'on' : ''}`} onClick={() => setShowQTab(t.k)}>{t.label}</button>
                  ))}
                </div>

                <div className="az-q-body">
                  {showQTab === 'histoire' && (
                    <div className="az-q-list">
                      {quartier.histoire.map((h, i) => (
                        <div key={i} className="az-q-item">
                          <span className="az-q-bullet">{i+1}</span>
                          <span className="az-q-text">{h}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {showQTab === 'figures' && (
                    <div className="az-q-list">
                      {quartier.figures.length === 0 ? <p className="az-q-empty">Aucune figure répertoriée pour ce quartier.</p> : quartier.figures.map((f, i) => (
                        <div key={i} className="az-q-item az-q-figure">
                          <span className="az-q-fig-avatar">👤</span>
                          <div>
                            <div className="az-q-fig-name">{f.nom}</div>
                            <div className="az-q-fig-role">{f.role}</div>
                            <div className="az-q-fig-lien">{f.lien}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {showQTab === 'evenements' && (
                    <div className="az-q-list">
                      {quartier.evenements.length === 0 ? <p className="az-q-empty">Aucun événement répertorié.</p> : quartier.evenements.map((e, i) => (
                        <div key={i} className="az-q-item">
                          <span className="az-q-bullet">📅</span>
                          <div>
                            <div className="az-q-ev-date">{e.date}</div>
                            <div className="az-q-ev-name">{e.nom}</div>
                            <div className="az-q-ev-desc">{e.desc}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {showQTab === 'landmarks' && (
                    <div className="az-q-list">
                      {quartier.landmarks.map((l, i) => (
                        <div key={i} className="az-q-item">
                          <span className="az-q-bullet">🏛️</span>
                          <div>
                            <div className="az-q-lm-name">{l.nom}</div>
                            <div className="az-q-lm-desc">{l.desc}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {showQTab === 'commerces' && (
                    <div className="az-q-list">
                      {quartier.commerces.length === 0 ? <p className="az-q-empty">Aucun commerce répertorié.</p> : quartier.commerces.map((c, i) => (
                        <div key={i} className="az-q-item">
                          <span className="az-q-bullet">🏪</span>
                          <div>
                            <div className="az-q-lm-name">{c.nom} <span className="az-q-tag">{c.type}</span></div>
                            <div className="az-q-lm-desc">{c.desc}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── Tourist Zone Panel ── */}
            {touristZone && (
              <div className="az-tourist-card">
                <div className="az-tz-header">
                  <div className="az-tz-badge">🌴 Tourist Zone</div>
                  <div className="az-tz-title">{touristZone.nom}</div>
                  <div className="az-tz-sub">{touristZone.type} · {touristZone.region} · {touristZone.label}</div>
                  <div className="az-tz-distance">{touristZone.distance >= 1000 ? (touristZone.distance/1000).toFixed(1) + ' km' : touristZone.distance + ' m'} de vous</div>
                </div>

                <div className="az-tz-meta">
                  <div className="az-tz-meta-item"><strong>🗓️ Période idéale</strong>{touristZone.periode}</div>
                  <div className="az-tz-meta-item"><strong>🕐 Durée</strong>{touristZone.duree}</div>
                  <div className="az-tz-meta-item"><strong>🚗 Accès</strong>{touristZone.acces}</div>
                </div>

                <div className="az-tz-tabs">
                  {[
                    { k: 'description', label: '📖 Description' },
                    { k: 'attractions', label: '🏛️ Attractions' },
                    { k: 'activites', label: '🎯 Activités' },
                  ].map(t => (
                    <button key={t.k} className={`az-tz-tab ${showTZTab === t.k ? 'on' : ''}`} onClick={() => setShowTZTab(t.k)}>{t.label}</button>
                  ))}
                </div>

                <div className="az-tz-body">
                  {showTZTab === 'description' && (
                    <div className="az-tz-desc">{touristZone.description}</div>
                  )}
                  {showTZTab === 'attractions' && (
                    <div className="az-tz-list">
                      {touristZone.attractions.map((a, i) => (
                        <div key={i} className="az-tz-item">
                          <span className="az-tz-bullet">🏛️</span>
                          <div>
                            <div className="az-tz-at-name">{a.nom}</div>
                            <div className="az-tz-at-desc">{a.desc}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {showTZTab === 'activites' && (
                    <div className="az-tz-list">
                      {touristZone.activites.map((a, i) => (
                        <div key={i} className="az-tz-item">
                          <span className="az-tz-bullet">✓</span>
                          <span className="az-tz-text">{a}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Radius + tiles */}
            <div className="az-ctrl-row">
              <div className="az-ctrl-group">
                <span className="az-ctrl-label">Rayon</span>
                <div className="az-pills">
                  {RADII.map(r => (
                    <button key={r.v} className={`az-pill ${radius === r.v ? 'on' : ''}`} onClick={() => setRadius(r.v)}>{r.l}</button>
                  ))}
                </div>
              </div>
              <div className="az-tile-btns">
                {Object.keys(TILES).map(k => (
                  <button key={k} className={`az-tile-btn ${tile === k ? 'on' : ''}`} onClick={() => setTile(k)} title={k}>
                    {k === 'voyager' ? '🗺️' : k === 'osm' ? '🌿' : k === 'dark' ? '🌑' : '🛰️'}
                  </button>
                ))}
              </div>
            </div>

            {/* Realtime toggle */}
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:4, padding:'6px 10px', background:'rgba(16,185,129,0.07)', borderRadius:10, border:'1px solid rgba(16,185,129,0.15)' }}>
              <label style={{ display:'flex', alignItems:'center', gap:6, cursor:'pointer', fontSize:'0.78rem', fontWeight:700, color:'var(--text-primary)' }}>
                <input type="checkbox" checked={useRealtime} onChange={e => setUseRealtime(e.target.checked)} style={{ accentColor:'#10B981' }} />
                🌐 Temps réel Google
              </label>
              {loadGoogle && <span style={{ fontSize:'0.7rem', color:'var(--text-muted)' }}>Chargement…</span>}
              {googlePlaces.length > 0 && <span style={{ fontSize:'0.7rem', color:'#10B981', fontWeight:700 }}>{googlePlaces.length} lieu(s) ouvert(s) Google</span>}
            </div>

            {/* Category tabs */}
            <div className="az-cats">
              {CATEGORIES.map(c => (
                <button key={c.id}
                  className={`az-cat ${catId === c.id ? 'on' : ''}`}
                  style={catId === c.id ? { '--cc': c.color } : {}}
                  onClick={() => setCatId(c.id)}>
                  <span>{c.icon}</span>
                  <span className="az-cat-lbl">{c.label}</span>
                </button>
              ))}
            </div>

            {/* Nearby Commodities — affiché dès détection */}
            {(loadNearby || nearby.length > 0) && (
              <div className="az-myzone-section">
                <div className="az-myzone-hdr">
                  <div>
                    <strong style={{ fontSize: '0.85rem' }}>📍 À proximité</strong>
                    <span style={{ display:'block', fontSize:'0.7rem', color:'var(--text-muted)', marginTop:1 }}>Lieux dans un rayon de 500m</span>
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                    {isMoving && <span className="az-move-badge">● Mouvement</span>}
                    <button
                      className="az-scan-btn"
                      onClick={() => { if (loc) { fetchNearbyCommodities(loc.lat, loc.lng, 500); fetchZone(loc.lat, loc.lng); } }}
                      disabled={loadNearby}
                      title="Rescanner"
                    >
                      {loadNearby ? '⏳' : '↺ Actualiser'}
                    </button>
                    <button
                      onClick={() => setMyZoneMode(prev => !prev)}
                      style={{
                        padding: '5px 10px', borderRadius: 8, border: '1px solid',
                        borderColor: myZoneMode ? '#0EA5E9' : 'var(--border)',
                        background: myZoneMode ? 'rgba(14,165,233,0.12)' : 'transparent',
                        color: myZoneMode ? '#38BDF8' : 'var(--text-muted)',
                        fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer',
                      }}
                      title="Suivi GPS en temps réel avec détection de mouvement"
                    >
                      {myZoneMode ? '📡 GPS actif' : '📡 Suivi GPS'}
                    </button>
                  </div>
                </div>
                {loadNearby ? (
                  <div className="az-poi-loading" style={{ padding:'12px 16px' }}>
                    {[1,2,3].map(i => (
                      <div key={i} className="az-sk-poi">
                        <div className="az-sk az-sk-circle" />
                        <div style={{ flex:1 }}><div className="az-sk az-sk-line w70" /><div className="az-sk az-sk-line w40" /></div>
                      </div>
                    ))}
                  </div>
                ) : nearby.length === 0 ? (
                  <div className="az-poi-empty" style={{ padding:'20px 16px' }}>
                    <span>🔍</span>
                    <p>Aucune commodité trouvée à proximité</p>
                  </div>
                ) : (
                  <div className="az-poi-list">
                    {nearby.map(p => (
                      <button key={p.id}
                        className={`az-poi-row ${poi?.id === p.id ? 'on' : ''}`}
                        onClick={() => {
                          const same = poi?.id === p.id
                          setPoi(same ? null : p)
                          if (!same) { setLoc({ lat: p.lat, lng: p.lng }); setZoom(18) }
                        }}>
                        <div className="az-poi-ico" style={{ background: p.category.color + '1a', borderColor: p.category.color + '55' }}>{p.category.icon}</div>
                        <div className="az-poi-txt">
                          <div className="az-poi-name">{p.name}</div>
                          <div className="az-poi-hint">{p.category.label} · {Math.round(p.dist)}m</div>
                        </div>
                        <span className="az-poi-arrow" style={{ color: poi?.id === p.id ? p.category.color : undefined }}>
                          {poi?.id === p.id ? '▲' : '›'}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* POI list header */}
            <div className="az-pois-wrap">
              <div className="az-pois-hdr">
                <span>{cat.icon} <strong>{cat.label}</strong></span>
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <button className="az-btn-ghost" onClick={() => setShowPlaceReport(true)} style={{ fontSize:'0.7rem', padding:'4px 10px' }}>📍 Signaler un lieu</button>
                  <span className="az-pois-count">{loadPois ? '…' : `${pois.length} résultats`}</span>
                </div>
              </div>

              {loadPois ? (
                <div className="az-poi-loading">
                  {[1,2,3].map(i => (
                    <div key={i} className="az-sk-poi">
                      <div className="az-sk az-sk-circle" />
                      <div style={{ flex:1 }}><div className="az-sk az-sk-line w70" /><div className="az-sk az-sk-line w40" /></div>
                    </div>
                  ))}
                </div>
              ) : pois.length === 0 ? (
                <div className="az-poi-empty">
                  <span>{cat.icon}</span>
                  <p>Aucun lieu dans ce rayon</p>
                  {radius < 5000 && <button className="az-btn-ghost" onClick={() => setRadius(r => Math.min(r*2,5000))}>Élargir le rayon</button>}
                </div>
              ) : (
                <div className="az-poi-list">
                  {pois.map(p => {
                    const isGoogle = p.source === 'google'
                    return (
                      <button key={p.id}
                        className={`az-poi-row ${poi?.id === p.id ? 'on' : ''}`}
                        onClick={() => {
                          const same = poi?.id === p.id
                          setPoi(same ? null : p)
                          if (!same) { setLoc({ lat: p.lat, lng: p.lng }); setZoom(18) }
                        }}>
                        <div className="az-poi-ico" style={{ background: (isGoogle ? '#10B981' : cat.color) + '1a', borderColor: (isGoogle ? '#10B981' : cat.color) + '55' }}>{isGoogle ? '🟢' : cat.icon}</div>
                        <div className="az-poi-txt">
                          <div className="az-poi-name">{p.name}</div>
                          {isGoogle && typeof p.tags.rating === 'number' && (
                            <div className="az-poi-hint">⭐ {p.tags.rating}/5 ({p.tags.totalRatings || 0} avis)</div>
                          )}
                          {isGoogle && p.tags.openNow && (
                            <div className="az-poi-hint" style={{ color:'#10B981', fontWeight:700 }}>🟢 Ouvert maintenant</div>
                          )}
                          {!isGoogle && p.tags.opening_hours && <div className="az-poi-hint">🕐 {p.tags.opening_hours.slice(0,35)}</div>}
                          {!isGoogle && p.tags.cuisine && !p.tags.opening_hours && <div className="az-poi-hint">🍴 {p.tags.cuisine.replace(/;/g,', ').slice(0,35)}</div>}
                          {isGoogle && <div className="az-poi-hint" style={{ color:'#10B981' }}>🌐 Google Places</div>}
                        </div>
                        <span className="az-poi-arrow" style={{ color: poi?.id === p.id ? (isGoogle ? '#10B981' : cat.color) : undefined }}>
                          {poi?.id === p.id ? '▲' : '›'}
                        </span>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Selected POI detail — full OSM data */}
            {poi && (() => {
              const isGoogle = poi.source === 'google'
              const d = extractPoiData(poi.tags)
              const t = poi.tags
              return (
                <div className="az-poi-detail" style={{ borderColor: (isGoogle ? '#10B981' : cat.color) + '55' }}>

                  {/* Header */}
                  <div className="az-poi-detail-hdr">
                    <div className="az-poi-ico lg" style={{ background: (isGoogle ? '#10B981' : cat.color) + '1a', borderColor: (isGoogle ? '#10B981' : cat.color) + '55' }}>{isGoogle ? '🟢' : cat.icon}</div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div className="az-poi-detail-name">{poi.name}</div>
                      {isGoogle && typeof t.rating === 'number' && (
                        <div style={{ fontSize:'0.75rem', color:'#F59E0B', fontWeight:700 }}>
                          {'⭐'.repeat(Math.round(t.rating))} {t.rating}/5 ({t.totalRatings || 0} avis)
                        </div>
                      )}
                      {isGoogle && t.openNow && (
                        <div style={{ fontSize:'0.75rem', color:'#10B981', fontWeight:700 }}>🟢 Ouvert maintenant</div>
                      )}
                      {isGoogle && <div style={{ fontSize:'0.7rem', color:'#10B981', marginTop:2 }}>🌐 Google Places</div>}
                      {!isGoogle && t.alt_name && <div style={{ fontSize:'0.7rem', color:'var(--text-muted)', fontStyle:'italic' }}>aussi : {t.alt_name}</div>}
                      {!isGoogle && (
                        <div className="az-poi-detail-cat">
                          {cat.label}
                          {t.operator && ` · ${t.operator}`}
                          {t.brand && t.brand !== poi.name && ` · ${t.brand}`}
                        </div>
                      )}
                    </div>
                    <button
                      className="az-copy-btn"
                      onClick={() => { navigator.clipboard?.writeText(`${poi.lat},${poi.lng}`); setNotif('✓ Coordonnées copiées') }}
                      title="Copier les coordonnées">📋</button>
                  </div>

                  {/* ── Itinéraire — prominent section ── */}
                  <div className="az-itin-section">
                    <div className="az-itin-label">🧭 Itinéraire vers ce lieu</div>
                    <div className="az-itin-btns">
                      <a href={`https://www.google.com/maps/dir/?api=1${myLoc?`&origin=${myLoc.lat},${myLoc.lng}`:''}&destination=${poi.lat},${poi.lng}`} target="_blank" rel="noreferrer" className="az-itin-btn primary">
                        📍 Google Maps
                      </a>
                      <a href={`maps://maps.apple.com/?daddr=${poi.lat},${poi.lng}`} target="_blank" rel="noreferrer" className="az-itin-btn">
                        🍎 Apple Maps
                      </a>
                      <a href={`https://waze.com/ul?ll=${poi.lat},${poi.lng}&navigate=yes`} target="_blank" rel="noreferrer" className="az-itin-btn">
                        🔵 Waze
                      </a>
                    </div>
                  </div>

                  {/* ── Adresse & localisation ── */}
                  <div className="az-detail-section-title">📍 Localisation</div>
                  {d.address && (
                    <div className="az-drow">
                      <span className="az-drow-ico">🏠</span>
                      <span className="az-drow-val">{d.address}</span>
                    </div>
                  )}
                  <div className="az-drow">
                    <span className="az-drow-ico">📐</span>
                    <span className="az-drow-val mono">{poi.lat.toFixed(6)}, {poi.lng.toFixed(6)}</span>
                  </div>
                  {t['addr:postcode'] && (
                    <div className="az-drow">
                      <span className="az-drow-ico">📮</span>
                      <span className="az-drow-val">Code postal : {t['addr:postcode']}</span>
                    </div>
                  )}

                  {/* ── Contacts ── */}
                  {(d.phones.length > 0 || d.emails.length > 0 || d.websites.length > 0) && (
                    <div className="az-detail-section-title">📞 Contacts</div>
                  )}
                  {d.phones.map((p, i) => (
                    <div key={i} className="az-drow">
                      <span className="az-drow-ico">📞</span>
                      <a href={`tel:${p}`} className="az-poi-link">{p}</a>
                    </div>
                  ))}
                  {d.emails.map((e, i) => (
                    <div key={i} className="az-drow">
                      <span className="az-drow-ico">✉️</span>
                      <a href={`mailto:${e}`} className="az-poi-link">{e}</a>
                    </div>
                  ))}
                  {d.websites.map((w, i) => (
                    <div key={i} className="az-drow">
                      <span className="az-drow-ico">🌐</span>
                      <a href={w.startsWith('http') ? w : `https://${w}`} target="_blank" rel="noreferrer" className="az-poi-link">{w.replace(/^https?:\/\//, '').replace(/\/$/, '').slice(0, 50)}</a>
                    </div>
                  ))}
                  {d.socials.length > 0 && (
                    <div className="az-drow az-drow-wrap">
                      <span className="az-drow-ico">📱</span>
                      <div className="az-tags">
                        {d.socials.map((s, i) => (
                          <a key={i} href={s.url} target="_blank" rel="noreferrer" className="az-tag-link">{s.icon} {s.name}</a>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* ── Horaires ── */}
                  {t.opening_hours && (
                    <>
                      <div className="az-detail-section-title">🕐 Horaires</div>
                      <div className="az-drow">
                        <span className="az-drow-ico">🕐</span>
                        <span className="az-drow-val">{t.opening_hours}</span>
                      </div>
                    </>
                  )}

                  {/* ── Informations ── */}
                  {(t.cuisine || t.amenity || t.shop || t.tourism || t.office || t['healthcare:speciality'] || t.stars || t.rooms || t.beds || t.capacity || t.fee || t.levels || t.network) && (
                    <div className="az-detail-section-title">ℹ️ Informations</div>
                  )}
                  {t.amenity && <div className="az-drow"><span className="az-drow-ico">🏷️</span><span className="az-drow-val">Type : {t.amenity}</span></div>}
                  {t.shop && <div className="az-drow"><span className="az-drow-ico">🏷️</span><span className="az-drow-val">Commerce : {t.shop}</span></div>}
                  {t.tourism && <div className="az-drow"><span className="az-drow-ico">🏷️</span><span className="az-drow-val">Tourisme : {t.tourism}</span></div>}
                  {t.office && <div className="az-drow"><span className="az-drow-ico">🏷️</span><span className="az-drow-val">Bureau : {t.office}</span></div>}
                  {t.cuisine && <div className="az-drow"><span className="az-drow-ico">🍴</span><span className="az-drow-val">{t.cuisine.replace(/;/g,', ')}</span></div>}
                  {d.diets.length > 0 && <div className="az-drow az-drow-wrap"><span className="az-drow-ico">🥗</span><div className="az-tags">{d.diets.map((d,i) => <span key={i} className="az-tag">{d}</span>)}</div></div>}
                  {t.stars && <div className="az-drow"><span className="az-drow-ico">⭐</span><span className="az-drow-val">{'⭐'.repeat(Math.min(+t.stars||0,5))} ({t.stars} étoiles)</span></div>}
                  {t.rooms && <div className="az-drow"><span className="az-drow-ico">🏨</span><span className="az-drow-val">{t.rooms} chambres</span></div>}
                  {t.beds && <div className="az-drow"><span className="az-drow-ico">🛏️</span><span className="az-drow-val">{t.beds} lits</span></div>}
                  {t.capacity && <div className="az-drow"><span className="az-drow-ico">👥</span><span className="az-drow-val">{t.capacity} places</span></div>}
                  {t['healthcare:speciality'] && <div className="az-drow"><span className="az-drow-ico">🩺</span><span className="az-drow-val">{t['healthcare:speciality'].replace(/;/g,', ')}</span></div>}
                  {t.emergency === 'yes' && <div className="az-drow"><span className="az-drow-ico">🚨</span><span className="az-drow-val" style={{color:'#EF4444',fontWeight:700}}>Urgences 24h/24</span></div>}
                  {t.fee === 'yes' && <div className="az-drow"><span className="az-drow-ico">💰</span><span className="az-drow-val">Payant{t.fee_details ? ` — ${t.fee_details}` : ''}</span></div>}
                  {t.fee === 'no' && <div className="az-drow"><span className="az-drow-ico">🆓</span><span className="az-drow-val">Gratuit</span></div>}
                  {t.levels && <div className="az-drow"><span className="az-drow-ico">🏢</span><span className="az-drow-val">{t.levels} niveaux</span></div>}
                  {t.network && <div className="az-drow"><span className="az-drow-ico">🔗</span><span className="az-drow-val">Réseau : {t.network}</span></div>}
                  {t.ref && <div className="az-drow"><span className="az-drow-ico">🔢</span><span className="az-drow-val">Réf : {t.ref}</span></div>}

                  {/* ── Structure & Bâtiment ── */}
                  {(d.building || d.buildingType || d.height || d.buildingLevels || d.material || d.architecture || d.startDate || d.heritage || d.historic || d.architect) && (
                    <div className="az-detail-section-title">🏗️ Structure & Bâtiment</div>
                  )}
                  {d.historic && <div className="az-drow"><span className="az-drow-ico">🏛️</span><span className="az-drow-val">Type historique : {d.historic}</span></div>}
                  {d.building && <div className="az-drow"><span className="az-drow-ico">🏢</span><span className="az-drow-val">Type de bâtiment : {d.building}</span></div>}
                  {d.architecture && <div className="az-drow"><span className="az-drow-ico">🏛️</span><span className="az-drow-val">Architecture : {d.architecture}</span></div>}
                  {d.height && <div className="az-drow"><span className="az-drow-ico">📏</span><span className="az-drow-val">Hauteur : {d.height}</span></div>}
                  {d.buildingLevels && <div className="az-drow"><span className="az-drow-ico">🏢</span><span className="az-drow-val">Étages : {d.buildingLevels}</span></div>}
                  {d.material && <div className="az-drow"><span className="az-drow-ico">🧱</span><span className="az-drow-val">Matériau : {d.material}</span></div>}
                  {d.startDate && <div className="az-drow"><span className="az-drow-ico">📅</span><span className="az-drow-val">Construction : {d.startDate}</span></div>}
                  {d.architect && <div className="az-drow"><span className="az-drow-ico">✏️</span><span className="az-drow-val">Architecte : {d.architect}</span></div>}
                  {d.heritage && <div className="az-drow"><span className="az-drow-ico">🛡️</span><span className="az-drow-val" style={{color:'#F59E0B',fontWeight:700}}>Patrimoine protégé</span></div>}
                  {d.demolished && <div className="az-drow"><span className="az-drow-ico">⚠️</span><span className="az-drow-val" style={{color:'#EF4444'}}>Démoli / Détruit</span></div>}

                  {/* ── Services & Paiement ── */}
                  {(d.services.length > 0 || d.payments.length > 0) && (
                    <div className="az-detail-section-title">🛎️ Services & Paiement</div>
                  )}
                  {d.services.length > 0 && (
                    <div className="az-drow az-drow-wrap">
                      <span className="az-drow-ico">✅</span>
                      <div className="az-tags">{d.services.map((s,i) => <span key={i} className="az-tag">{s}</span>)}</div>
                    </div>
                  )}
                  {d.payments.length > 0 && (
                    <div className="az-drow az-drow-wrap">
                      <span className="az-drow-ico">💳</span>
                      <div className="az-tags">{d.payments.map((p,i) => <span key={i} className="az-tag">{p}</span>)}</div>
                    </div>
                  )}
                  {t.wheelchair && (
                    <div className="az-drow">
                      <span className="az-drow-ico">♿</span>
                      <span className="az-drow-val">Accessibilité PMR : {t.wheelchair === 'yes' ? 'Oui' : t.wheelchair === 'no' ? 'Non' : t.wheelchair === 'limited' ? 'Limitée' : t.wheelchair}</span>
                    </div>
                  )}

                  {/* ── Description ── */}
                  {(t.description || t['description:fr'] || t.note || t['note:fr']) && (
                    <>
                      <div className="az-detail-section-title">📝 Description</div>
                      <div className="az-detail-desc">{t['description:fr'] || t.description || t['note:fr'] || t.note}</div>
                    </>
                  )}

                  {/* ── Wikipedia / Sources ── */}
                  {(d.wikiUrl || d.wikidataUrl) && (
                    <>
                      <div className="az-detail-section-title">📖 En savoir plus</div>
                      <div className="az-drow az-drow-wrap">
                        <span className="az-drow-ico">📖</span>
                        <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                          {d.wikiUrl && <a href={d.wikiUrl} target="_blank" rel="noreferrer" className="az-poi-link">Wikipédia →</a>}
                          {d.wikidataUrl && <a href={d.wikidataUrl} target="_blank" rel="noreferrer" className="az-poi-link">Wikidata →</a>}
                        </div>
                      </div>
                    </>
                  )}

                  {/* OSM source link */}
                  <div style={{ marginTop:12, paddingTop:10, borderTop:'1px solid var(--border)', display:'flex', justifyContent:'flex-end' }}>
                    <a href={`https://www.openstreetmap.org/${poi.osmType}/${poi.id}`} target="_blank" rel="noreferrer"
                      style={{ fontSize:'0.68rem', color:'var(--text-muted)', textDecoration:'none', fontWeight:600 }}>
                      Source : OpenStreetMap →
                    </a>
                  </div>
                </div>
              )
            })()}

            {/* AI Fiche Zone — apparaît automatiquement */}
            <div className="az-ai-section">
              <div className="az-ai-hdr">
                <div>
                  <div style={{ fontWeight:800, fontSize:'0.88rem', color:'var(--text-primary)' }}>
                    🤖 Fiche Intelligence Territoriale
                    {loadIA && <span style={{ marginLeft:8, fontSize:'0.72rem', color:'var(--text-muted)', fontWeight:600 }}>Analyse en cours…</span>}
                    {analysis && !loadIA && <span style={{ marginLeft:8, fontSize:'0.68rem', color:'#10B981', fontWeight:700 }}>✓ Automatique</span>}
                  </div>
                  <div style={{ fontSize:'0.72rem', color:'var(--text-muted)', marginTop:2 }}>
                    Histoire · Personnalités · Économie · Opportunités · Infrastructure
                  </div>
                </div>
                <button
                  className="az-btn-primary"
                  onClick={() => { autoAnalyzedZoneRef.current = null; analyzeZone() }}
                  disabled={!zone || loadIA}
                  style={{ fontSize:'0.75rem', padding:'7px 14px', flexShrink:0 }}
                >
                  {loadIA ? '⏳…' : '↻ Actualiser'}
                </button>
              </div>

              {loadIA && !analysis && (
                <div style={{ padding:'20px 16px' }}>
                  {[1,2,3,4].map(i => (
                    <div key={i} style={{ marginBottom:12 }}>
                      <div className="az-sk az-sk-line" style={{ width:'40%', marginBottom:6 }} />
                      <div className="az-sk az-sk-line" style={{ width:'90%', marginBottom:4 }} />
                      <div className="az-sk az-sk-line" style={{ width:'80%' }} />
                    </div>
                  ))}
                </div>
              )}

              {analysis && (
                <div className="az-ai-result">
                  {(() => {
                    // Parse sections by **titre** markers
                    const SECTION_COLORS = {
                      '📍': '#3B82F6', '🏛️': '#8B5CF6', '👤': '#F59E0B',
                      '🏘️': '#10B981', '📊': '#0EA5E9', '🚗': '#64748B',
                      '🏥': '#EF4444', '🎭': '#EC4899', '💡': '#F0B429', '⚠️': '#F97316',
                    }
                    const lines = analysis.split('\n')
                    const sections = []
                    let current = null
                    lines.forEach(line => {
                      const trimmed = line.trim()
                      if (!trimmed) return
                      const isHeader = trimmed.startsWith('**') && trimmed.endsWith('**')
                      if (isHeader) {
                        if (current) sections.push(current)
                        const title = trimmed.replace(/\*\*/g, '')
                        const emoji = title.match(/^[\u{1F300}-\u{1FFFF}📍🏛️👤🏘️📊🚗🏥🎭💡⚠️]/u)?.[0] || ''
                        current = { title, emoji, color: SECTION_COLORS[emoji] || '#8B5CF6', lines: [] }
                      } else if (current) {
                        current.lines.push(trimmed.replace(/\*\*/g, '').replace(/^\*\s/, '• '))
                      } else {
                        // text before first section
                        sections.push({ title: '', emoji: '', color: '#64748B', lines: [trimmed.replace(/\*\*/g, '')] })
                      }
                    })
                    if (current) sections.push(current)

                    if (sections.length === 0) {
                      // fallback: no sections parsed, show raw
                      return lines.filter(l => l.trim()).map((line, i) => {
                        const clean = line.replace(/\*\*/g, '')
                        return <p key={i} style={{ margin:'3px 0', fontSize:'0.8rem', color:'var(--text-secondary)', lineHeight:1.65 }}>{clean}</p>
                      })
                    }

                    return sections.map((sec, si) => (
                      <div key={si} style={{
                        marginBottom: 14,
                        borderRadius: 10,
                        background: sec.title ? `${sec.color}08` : 'transparent',
                        border: sec.title ? `1px solid ${sec.color}22` : 'none',
                        padding: sec.title ? '10px 12px' : '0',
                      }}>
                        {sec.title && (
                          <div style={{
                            fontWeight: 800, fontSize: '0.8rem', color: sec.color,
                            marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6,
                          }}>
                            <span style={{
                              background: `${sec.color}18`, borderRadius: 6, padding: '2px 6px',
                              fontSize: '0.68rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.5px',
                            }}>
                              {sec.title}
                            </span>
                          </div>
                        )}
                        {sec.lines.map((line, li) => (
                          <p key={li} style={{
                            margin: '2px 0', fontSize: '0.79rem',
                            color: 'var(--text-secondary)', lineHeight: 1.65,
                          }}>
                            {line}
                          </p>
                        ))}
                      </div>
                    ))
                  })()}
                </div>
              )}

              {!analysis && !loadIA && (
                <div style={{ padding:'16px', textAlign:'center', color:'var(--text-muted)', fontSize:'0.82rem' }}>
                  <span style={{ fontSize:'1.5rem', display:'block', marginBottom:6 }}>🤖</span>
                  Localisation détectée — fiche générée automatiquement
                </div>
              )}
            </div>
          </div>

          {/* ── RIGHT: MAP ── */}
          <div className="az-map-wrap">

            {/* Map overlay controls */}
            <div className="az-map-ctrls">
              <button className="az-map-btn" onClick={locateMe} title="Ma position">📍</button>
              <button className="az-map-btn" onClick={() => setZoom(z => Math.min(z+1,19))} title="Zoom +">+</button>
              <button className="az-map-btn" onClick={() => setZoom(z => Math.max(z-1,3))} title="Zoom −">−</button>
              <button className={`az-map-btn ${tile === 'sat' ? 'on' : ''}`} onClick={() => setTile(t => t === 'sat' ? 'voyager' : 'sat')} title="Vue satellite">🛰️</button>
            </div>

            {/* POI counter badge */}
            {!loadPois && pois.length > 0 && !myZoneMode && (
              <div className="az-map-badge">
                {cat.icon} {pois.length} {cat.label}
              </div>
            )}

            {/* My Zone badge */}
            {myZoneMode && (
              <div className="az-map-badge" style={{ background:'rgba(16,185,129,0.15)', borderColor:'rgba(16,185,129,0.4)', color:'#10B981', fontWeight:800 }}>
                📡 Ma Zone · {nearby.length} commodités
              </div>
            )}

            {loc ? (
              <MapContainer
                center={[loc.lat, loc.lng]}
                zoom={zoom}
                style={{ width:'100%', height:'100%' }}
                zoomControl={false}
              >
                <TileLayer key={tile} url={TILES[tile].url} attribution={TILES[tile].attr} />
                <MapFly center={loc} zoom={zoom} />
                <MapClick onMapClick={onMapClick} />

                {/* GPS position */}
                {myLoc && (
                  <Marker position={[myLoc.lat, myLoc.lng]} icon={userIcon()}>
                    <Popup><strong>📍 Ma position</strong></Popup>
                  </Marker>
                )}

                {/* Radius circle */}
                <Circle
                  center={[loc.lat, loc.lng]}
                  radius={radius}
                  pathOptions={{ color: cat.color, fillColor: cat.color, fillOpacity: 0.05, weight: 1.5, dashArray: '6 4' }}
                />

                {/* My Zone radius circle */}
                {myZoneMode && myLoc && (
                  <Circle
                    center={[myLoc.lat, myLoc.lng]}
                    radius={500}
                    pathOptions={{ color: '#10B981', fillColor: '#10B981', fillOpacity: 0.04, weight: 1.5, dashArray: '4 6' }}
                  />
                )}

                {/* POI markers */}
                {!myZoneMode && pois.map(p => {
                  const isGoogle = p.source === 'google'
                  return (
                    <Marker
                      key={p.id}
                      position={[p.lat, p.lng]}
                      icon={catIcon(isGoogle ? '#10B981' : cat.color, isGoogle ? '🟢' : cat.icon, poi?.id === p.id)}
                      eventHandlers={{ click: () => setPoi(poi?.id === p.id ? null : p) }}
                    >
                      <Popup>
                        <div style={{ minWidth:170, fontFamily:'inherit' }}>
                          <strong style={{ fontSize:'0.88rem', display:'block', marginBottom:4 }}>{p.name}</strong>
                          {isGoogle && (
                            <>
                              {p.tags.address && <div style={{ fontSize:'0.75rem', color:'#555', marginBottom:2 }}>📍 {p.tags.address}</div>}
                              {typeof p.tags.rating === 'number' && (
                                <div style={{ fontSize:'0.75rem', color:'#F59E0B', marginBottom:2 }}>
                                  {'⭐'.repeat(Math.round(p.tags.rating))} {p.tags.rating}/5 ({p.tags.totalRatings || 0} avis)
                                </div>
                              )}
                              {p.tags.openNow && <div style={{ fontSize:'0.75rem', color:'#10B981', fontWeight:700, marginBottom:2 }}>🟢 Ouvert maintenant</div>}
                              <div style={{ fontSize:'0.7rem', color:'#10B981', marginBottom:4 }}>🌐 Google Places</div>
                            </>
                          )}
                          {!isGoogle && p.tags.opening_hours && <div style={{ fontSize:'0.75rem', color:'#555', marginBottom:2 }}>🕐 {p.tags.opening_hours}</div>}
                          {!isGoogle && p.tags.phone && <div style={{ fontSize:'0.75rem', marginBottom:2 }}>📞 {p.tags.phone}</div>}
                          {p.tags.address && !isGoogle && <div style={{ fontSize:'0.75rem', color:'#555', marginBottom:2 }}>📍 {p.tags.address}</div>}
                          <a href={dirUrl(p)} target="_blank" rel="noreferrer" style={{ display:'block', marginTop:6, fontSize:'0.75rem', color:'#3B82F6', fontWeight:600 }}>🧭 Itinéraire →</a>
                        </div>
                      </Popup>
                    </Marker>
                  )
                })}

                {/* My Zone nearby markers */}
                {myZoneMode && nearby.map(p => (
                  <Marker
                    key={p.id}
                    position={[p.lat, p.lng]}
                    icon={catIcon(p.category.color, p.category.icon, poi?.id === p.id)}
                    eventHandlers={{ click: () => setPoi(poi?.id === p.id ? null : p) }}
                  >
                    <Popup>
                      <div style={{ minWidth:170, fontFamily:'inherit' }}>
                        <strong style={{ fontSize:'0.88rem', display:'block', marginBottom:4 }}>{p.name}</strong>
                        <div style={{ fontSize:'0.75rem', color:'#555', marginBottom:2 }}>{p.category.label} · {Math.round(p.dist)}m</div>
                        {p.tags.opening_hours && <div style={{ fontSize:'0.75rem', color:'#555', marginBottom:2 }}>🕐 {p.tags.opening_hours}</div>}
                        {p.tags.phone && <div style={{ fontSize:'0.75rem', marginBottom:2 }}>📞 {p.tags.phone}</div>}
                        <a href={dirUrl(p)} target="_blank" rel="noreferrer" style={{ display:'block', marginTop:6, fontSize:'0.75rem', color:'#3B82F6', fontWeight:600 }}>🧭 Itinéraire →</a>
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            ) : (
              <div className="az-map-placeholder">
                <div className="az-spin-lg" />
                <p>Chargement de la carte…</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {showPlaceReport && <PlaceReport onClose={()=>setShowPlaceReport(false)} onSuccess={()=>{setNotif('📍 Lieu signalé avec succès'); setShowPlaceReport(false)}} />}
    </div>
  )
}

// ─── CSS ──────────────────────────────────────────────────────────────────────
const CSS = `
/* Fix Leaflet div icons */
.leaflet-div-icon { background:transparent!important; border:none!important; }
.leaflet-container { font-family: inherit; }

/* Toast */
.az-toast {
  position:fixed; top:calc(var(--navbar-total-h,60px)+16px); right:20px; z-index:9999;
  padding:10px 18px; border-radius:12px; backdrop-filter:blur(12px);
  background:rgba(16,185,129,0.15); border:1px solid rgba(16,185,129,0.35); color:#10B981;
  font-weight:600; font-size:0.85rem; max-width:300px;
  box-shadow:0 8px 24px rgba(0,0,0,0.15);
}

/* Layout */
.az-layout {
  display:grid; grid-template-columns:400px 1fr; gap:20px;
  align-items:start; margin-top:20px;
}
@media(max-width:1100px) { .az-layout { grid-template-columns:340px 1fr; } }
@media(max-width:860px)  { .az-layout { grid-template-columns:1fr; } }

/* Map */
.az-map-wrap {
  height:calc(100vh - 160px); min-height:520px; max-height:900px;
  position:sticky; top:calc(var(--navbar-total-h,60px)+20px);
  border-radius:20px; overflow:hidden; border:1px solid var(--border);
  box-shadow:0 12px 40px rgba(0,0,0,0.14); background:var(--bg-card);
}
@media(max-width:860px) { .az-map-wrap { height:440px; position:relative; top:0; } }

.az-map-placeholder {
  display:flex; flex-direction:column; align-items:center; justify-content:center;
  height:100%; gap:14px; color:var(--text-muted); font-size:0.9rem;
}
.az-map-ctrls {
  position:absolute; top:12px; right:12px; z-index:999;
  display:flex; flex-direction:column; gap:5px;
}
.az-map-btn {
  width:36px; height:36px; border-radius:10px; background:var(--bg-card);
  border:1px solid var(--border); box-shadow:0 4px 12px rgba(0,0,0,0.18);
  cursor:pointer; display:flex; align-items:center; justify-content:center;
  font-size:0.9rem; font-weight:700; font-family:inherit; transition:all 0.2s;
}
.az-map-btn:hover { border-color:var(--accent); transform:scale(1.08); }
.az-map-badge {
  position:absolute; bottom:14px; left:14px; z-index:999;
  padding:5px 12px; border-radius:100px; background:var(--bg-card);
  border:1px solid var(--border); font-size:0.75rem; font-weight:700;
  color:var(--text-primary); box-shadow:0 4px 12px rgba(0,0,0,0.15);
  backdrop-filter:blur(8px);
}

/* Panel */
.az-panel { display:flex; flex-direction:column; gap:14px; }

/* Search */
.az-search-wrap { position:relative; }
.az-search-input {
  width:100%; padding:12px 38px 12px 16px; border-radius:12px;
  border:1.5px solid var(--border); background:var(--bg-card);
  color:var(--text-primary); font-size:0.9rem; outline:none; font-family:inherit;
  box-sizing:border-box; transition:border-color 0.2s, box-shadow 0.2s;
  box-shadow:0 2px 8px rgba(0,0,0,0.06);
}
.az-search-input:focus { border-color:var(--accent); box-shadow:0 0 0 3px color-mix(in srgb,var(--accent) 12%,transparent); }
.az-search-input::placeholder { color:var(--text-muted); }
.az-spin-sm {
  position:absolute; right:12px; top:50%; transform:translateY(-50%);
  width:16px; height:16px; border:2px solid var(--border); border-top-color:var(--accent);
  border-radius:50%; animation:azSpin 0.8s linear infinite;
}
.az-spin-lg { width:36px; height:36px; border:3px solid var(--border); border-top-color:var(--accent); border-radius:50%; animation:azSpin 0.8s linear infinite; }
@keyframes azSpin { to{transform:rotate(360deg)} }
.az-dropdown {
  position:absolute; top:calc(100%+6px); left:0; right:0; z-index:300;
  background:var(--bg-card); border:1px solid var(--border); border-radius:12px;
  box-shadow:0 16px 36px rgba(0,0,0,0.22); overflow:hidden; backdrop-filter:blur(18px);
}
.az-result-row {
  display:flex; flex-direction:column; gap:2px; padding:10px 14px;
  width:100%; background:transparent; border:none; border-bottom:1px solid var(--border);
  cursor:pointer; text-align:left; font-family:inherit; transition:background 0.15s;
}
.az-result-row:last-child { border-bottom:none; }
.az-result-row:hover { background:var(--nav-link-hover-bg); }
.az-result-name { font-size:0.85rem; font-weight:600; color:var(--text-primary); }
.az-result-type { font-size:0.7rem; color:var(--text-muted); text-transform:capitalize; }

/* Zone card */
.az-zone-card {
  background:color-mix(in srgb,var(--bg-card) 92%,transparent);
  border:1px solid var(--border); border-radius:16px; padding:16px 18px;
  backdrop-filter:blur(8px);
}
.az-zone-top { display:flex; gap:12px; align-items:flex-start; }
.az-zone-pin { font-size:1.5rem; flex-shrink:0; }
.az-zone-name { font-weight:900; font-size:1rem; color:var(--text-primary); line-height:1.2; }
.az-zone-sub { font-size:0.73rem; color:var(--text-muted); margin-top:3px; line-height:1.4; }
.az-zone-wiki { margin-top:10px; padding-top:10px; border-top:1px solid var(--border); }
.az-zone-wiki p { margin:0; font-size:0.79rem; color:var(--text-secondary); line-height:1.65; }
.az-wiki-link { display:inline-block; margin-top:6px; font-size:0.75rem; color:var(--accent); text-decoration:none; font-weight:600; }
.az-wiki-link:hover { text-decoration:underline; }
.az-zone-coords { margin-top:8px; font-size:0.7rem; color:var(--text-muted); font-family:monospace; }
.az-zone-empty { display:flex; flex-direction:column; align-items:center; gap:8px; padding:10px 0; color:var(--text-muted); text-align:center; }
.az-zone-empty span { font-size:2rem; }
.az-zone-empty p { font-size:0.82rem; margin:0; color:var(--text-secondary); }

/* Skeletons */
.az-skeletons { display:flex; flex-direction:column; gap:8px; }
.az-sk { border-radius:6px; background:color-mix(in srgb,var(--border) 80%,transparent); animation:azPulse 1.5s ease infinite; }
.az-sk-line { height:12px; }
.az-sk-circle { width:34px; height:34px; border-radius:50%; flex-shrink:0; }
.az-sk-poi { display:flex; align-items:center; gap:10px; }
.w40{width:40%} .w50{width:50%} .w70{width:70%}
@keyframes azPulse { 0%,100%{opacity:0.35} 50%{opacity:0.75} }

/* Controls */
.az-ctrl-row { display:flex; align-items:center; justify-content:space-between; gap:10px; flex-wrap:wrap; }
.az-ctrl-group { display:flex; align-items:center; gap:8px; flex-wrap:wrap; }
.az-ctrl-label { font-size:0.7rem; font-weight:800; color:var(--text-muted); text-transform:uppercase; letter-spacing:0.8px; white-space:nowrap; }
.az-pills { display:flex; gap:4px; flex-wrap:wrap; }
.az-pill {
  padding:4px 10px; border-radius:999px; border:1.5px solid var(--border);
  background:transparent; cursor:pointer; font-size:0.72rem; font-weight:700;
  color:var(--text-secondary); font-family:inherit; transition:all 0.18s;
}
.az-pill:hover { border-color:var(--accent); color:var(--accent); }
.az-pill.on { border-color:var(--accent); background:color-mix(in srgb,var(--accent) 12%,transparent); color:var(--accent); }
.az-tile-btns { display:flex; gap:5px; }
.az-tile-btn {
  width:32px; height:32px; border-radius:8px; border:1.5px solid var(--border);
  background:transparent; cursor:pointer; font-size:0.85rem;
  display:flex; align-items:center; justify-content:center; transition:all 0.18s;
}
.az-tile-btn:hover { border-color:var(--accent); }
.az-tile-btn.on { border-color:var(--accent); background:color-mix(in srgb,var(--accent) 10%,transparent); }

/* Categories */
.az-cats { display:flex; gap:5px; flex-wrap:wrap; }
.az-cat {
  display:inline-flex; align-items:center; gap:5px; padding:5px 10px;
  border-radius:999px; border:1.5px solid var(--border); background:transparent;
  cursor:pointer; font-family:inherit; transition:all 0.18s; white-space:nowrap;
}
.az-cat:hover { border-color:color-mix(in srgb,var(--accent) 40%,transparent); }
.az-cat.on { border-color:var(--cc,var(--accent)); background:color-mix(in srgb,var(--cc,var(--accent)) 12%,transparent); }
.az-cat-lbl { font-size:0.7rem; font-weight:700; color:var(--text-secondary); }
.az-cat.on .az-cat-lbl { color:var(--cc,var(--accent)); }

/* POI section */
.az-pois-wrap {
  background:color-mix(in srgb,var(--bg-card) 92%,transparent);
  border:1px solid var(--border); border-radius:16px; overflow:hidden;
}
.az-pois-hdr {
  display:flex; align-items:center; justify-content:space-between;
  padding:11px 16px; border-bottom:1px solid var(--border);
  font-size:0.82rem; color:var(--text-primary);
}
.az-pois-count { font-size:0.72rem; color:var(--text-muted); font-weight:600; }
.az-poi-loading { padding:12px 16px; display:flex; flex-direction:column; gap:10px; }
.az-poi-empty { padding:24px 16px; text-align:center; color:var(--text-muted); }
.az-poi-empty span { font-size:2rem; display:block; margin-bottom:6px; }
.az-poi-empty p { font-size:0.82rem; margin:0 0 10px; }
.az-poi-list { max-height:320px; overflow-y:auto; }
.az-poi-row {
  display:flex; align-items:center; gap:10px; padding:10px 14px;
  width:100%; background:transparent; border:none; border-bottom:1px solid var(--border);
  cursor:pointer; font-family:inherit; text-align:left; transition:background 0.15s;
}
.az-poi-row:last-child { border-bottom:none; }
.az-poi-row:hover { background:var(--nav-link-hover-bg); }
.az-poi-row.on { background:color-mix(in srgb,var(--accent) 6%,transparent); }
.az-poi-ico {
  width:34px; height:34px; border-radius:9px; border:1.5px solid;
  display:flex; align-items:center; justify-content:center; font-size:0.95rem; flex-shrink:0;
}
.az-poi-ico.lg { width:42px; height:42px; border-radius:12px; font-size:1.25rem; }
.az-poi-txt { flex:1; min-width:0; }
.az-poi-name { font-size:0.84rem; font-weight:700; color:var(--text-primary); overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.az-poi-hint { font-size:0.7rem; color:var(--text-muted); overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.az-poi-arrow { font-size:0.85rem; color:var(--text-muted); transition:color 0.2s; }

/* POI detail */
.az-poi-detail {
  background:color-mix(in srgb,var(--bg-card) 92%,transparent);
  border:1.5px solid; border-radius:16px; padding:15px 17px;
  animation:azFadeUp 0.2s ease; backdrop-filter:blur(8px);
}
@keyframes azFadeUp { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
.az-poi-detail-hdr { display:flex; gap:10px; align-items:flex-start; margin-bottom:12px; }
.az-poi-detail-name { font-size:0.95rem; font-weight:800; color:var(--text-primary); line-height:1.25; }
.az-poi-detail-cat { font-size:0.72rem; color:var(--text-muted); margin-top:2px; }
.az-poi-val { color:var(--text-secondary); font-size:0.82rem; }
.az-poi-val.mono { font-family:monospace; font-size:0.78rem; }
.az-poi-link { color:var(--accent); text-decoration:none; font-weight:600; font-size:0.82rem; }
.az-poi-link:hover { text-decoration:underline; }

/* Copy button */
.az-copy-btn {
  width:30px; height:30px; border-radius:8px; border:1px solid var(--border);
  background:transparent; cursor:pointer; font-size:0.8rem; flex-shrink:0;
  display:flex; align-items:center; justify-content:center; transition:all 0.2s;
}
.az-copy-btn:hover { border-color:var(--accent); background:color-mix(in srgb,var(--accent) 8%,transparent); }

/* Itinerary section */
.az-itin-section {
  background:color-mix(in srgb,var(--accent) 6%,transparent);
  border:1px solid color-mix(in srgb,var(--accent) 20%,transparent);
  border-radius:12px; padding:12px 14px; margin-bottom:12px;
}
.az-itin-label { font-size:0.72rem; font-weight:800; color:var(--accent); text-transform:uppercase; letter-spacing:0.8px; margin-bottom:8px; }
.az-itin-btns { display:flex; gap:7px; flex-wrap:wrap; }
.az-itin-btn {
  padding:7px 12px; border-radius:9px; font-size:0.76rem; font-weight:700;
  border:1.5px solid var(--border); background:var(--bg-card); color:var(--text-secondary);
  text-decoration:none; cursor:pointer; font-family:inherit; transition:all 0.2s; white-space:nowrap;
  display:inline-flex; align-items:center; gap:5px;
}
.az-itin-btn:hover { border-color:var(--accent); color:var(--accent); transform:translateY(-1px); }
.az-itin-btn.primary {
  background:linear-gradient(135deg,var(--accent),color-mix(in srgb,var(--accent) 78%,#000));
  color:#fff; border-color:transparent;
  box-shadow:0 3px 10px color-mix(in srgb,var(--accent) 30%,transparent);
}
.az-itin-btn.primary:hover { transform:translateY(-1px); box-shadow:0 5px 15px color-mix(in srgb,var(--accent) 42%,transparent); }

/* Detail sections */
.az-detail-section-title {
  font-size:0.68rem; font-weight:800; text-transform:uppercase; letter-spacing:1px;
  color:var(--text-muted); margin:12px 0 6px; padding-bottom:5px;
  border-bottom:1px solid var(--border);
}
.az-drow {
  display:flex; align-items:flex-start; gap:8px; padding:4px 0;
  font-size:0.82rem;
}
.az-drow-wrap { align-items:flex-start; }
.az-drow-ico { font-size:0.85rem; flex-shrink:0; margin-top:1px; }
.az-drow-val { color:var(--text-secondary); line-height:1.4; }
.az-drow-val.mono { font-family:monospace; font-size:0.75rem; }

/* Tags & pills */
.az-tags { display:flex; flex-wrap:wrap; gap:5px; }
.az-tag {
  padding:2px 9px; border-radius:999px; font-size:0.68rem; font-weight:700;
  background:color-mix(in srgb,var(--accent) 10%,transparent);
  border:1px solid color-mix(in srgb,var(--accent) 22%,transparent);
  color:var(--text-secondary);
}
.az-tag-link {
  padding:3px 10px; border-radius:999px; font-size:0.72rem; font-weight:700;
  background:var(--bg-primary); border:1px solid var(--border);
  color:var(--text-secondary); text-decoration:none; transition:all 0.15s;
  display:inline-flex; align-items:center; gap:4px;
}
.az-tag-link:hover { border-color:var(--accent); color:var(--accent); }

/* Description */
.az-detail-desc {
  font-size:0.8rem; color:var(--text-secondary); line-height:1.65;
  padding:8px 10px; border-radius:8px; background:var(--bg-primary);
  border:1px solid var(--border); margin:4px 0;
}

/* My Zone */
.az-myzone-toggle {
  display:flex; align-items:center; gap:12px;
  width:100%; padding:12px 14px; border-radius:12px;
  border:1.5px solid var(--border); background:var(--bg-primary);
  cursor:pointer; font-family:inherit; transition:all 0.2s;
  color:var(--text-primary); text-align:left;
}
.az-myzone-toggle:hover { border-color:var(--accent); }
.az-myzone-toggle[data-active="true"] {
  border-color:rgba(16,185,129,0.5);
  background:rgba(16,185,129,0.08);
}
.az-myzone-toggle strong { display:block; font-size:0.85rem; font-weight:800; }

.az-myzone-section {
  background:color-mix(in srgb,var(--bg-card) 92%,transparent);
  border:1px solid var(--border); border-radius:16px; overflow:hidden;
}
.az-myzone-hdr {
  display:flex; align-items:center; justify-content:space-between;
  padding:11px 16px; border-bottom:1px solid var(--border);
  font-size:0.82rem; color:var(--text-primary);
}

/* AI section */
.az-ai-section {
  background:color-mix(in srgb,var(--bg-card) 92%,transparent);
  border:1px solid var(--border); border-radius:16px; padding:16px 18px;
}
.az-ai-hdr { display:flex; align-items:flex-start; justify-content:space-between; gap:12px; }
.az-ai-result {
  margin-top:12px; padding:12px 14px; border-radius:10px;
  background:var(--bg-primary); border:1px solid var(--border);
  max-height:280px; overflow-y:auto;
}

/* Buttons */
.az-btn-primary {
  display:inline-flex; align-items:center; justify-content:center; gap:6px;
  padding:10px 18px; border-radius:10px; border:none;
  background:linear-gradient(135deg,var(--accent),color-mix(in srgb,var(--accent) 78%,#000));
  color:#fff; font-size:0.82rem; font-weight:700; cursor:pointer; font-family:inherit;
  transition:all 0.2s; box-shadow:0 4px 12px color-mix(in srgb,var(--accent) 28%,transparent);
}
.az-btn-primary:hover:not(:disabled) { transform:translateY(-1px); box-shadow:0 6px 18px color-mix(in srgb,var(--accent) 42%,transparent); }
.az-btn-primary:disabled { opacity:0.45; cursor:not-allowed; }
.az-btn-ghost {
  display:inline-flex; align-items:center; gap:6px; padding:8px 14px;
  border-radius:10px; border:1.5px solid var(--border); background:transparent;
  color:var(--text-secondary); font-size:0.82rem; font-weight:600; cursor:pointer;
  font-family:inherit; transition:all 0.2s; text-decoration:none;
}
.az-btn-ghost:hover { border-color:var(--accent); color:var(--accent); }

/* Movement alert */
.az-move-alert {
  position:fixed; top:calc(var(--navbar-total-h,60px)+62px); right:20px; z-index:9998;
  max-width:360px; animation:azSlideIn 0.35s ease;
}
@keyframes azSlideIn { from{opacity:0;transform:translateX(40px)} to{opacity:1;transform:translateX(0)} }
.az-move-alert-inner {
  padding:12px 16px; border-radius:14px; backdrop-filter:blur(14px);
  background:rgba(245,158,11,0.12); border:1px solid rgba(245,158,11,0.4);
  box-shadow:0 10px 30px rgba(0,0,0,0.18);
  display:flex; align-items:center; gap:10px; cursor:pointer;
}
.az-move-alert-icon { font-size:1.4rem; flex-shrink:0; }
.az-move-alert-inner div { flex:1; min-width:0; display:flex; flex-direction:column; }
.az-move-alert-inner strong { font-size:0.82rem; font-weight:800; color:#F59E0B; }
.az-move-alert-inner span { font-size:0.72rem; color:var(--text-muted); }
.az-move-alert-btn {
  padding:6px 12px; border-radius:8px; border:none; background:rgba(245,158,11,0.2);
  color:#F59E0B; font-size:0.72rem; font-weight:700; cursor:pointer; font-family:inherit;
  white-space:nowrap; transition:all 0.2s;
}
.az-move-alert-btn:hover { background:rgba(245,158,11,0.35); }
.az-move-alert-close {
  width:24px; height:24px; border-radius:50%; border:none; background:transparent;
  color:var(--text-muted); cursor:pointer; font-size:0.8rem; display:flex;
  align-items:center; justify-content:center; flex-shrink:0;
}
.az-move-alert-close:hover { color:var(--text-primary); }

.az-move-badge {
  font-size:0.68rem; font-weight:700; color:#10B981; background:rgba(16,185,129,0.1);
  padding:2px 8px; border-radius:999px; border:1px solid rgba(16,185,129,0.25);
  animation:azPulseBadge 1.2s ease infinite;
}
@keyframes azPulseBadge { 0%,100%{opacity:0.8} 50%{opacity:1} }

.az-scan-btn {
  padding:4px 10px; border-radius:8px; border:1.5px solid rgba(16,185,129,0.4);
  background:rgba(16,185,129,0.08); color:#10B981; font-size:0.7rem;
  font-weight:700; cursor:pointer; font-family:inherit; transition:all 0.2s;
}
.az-scan-btn:hover { background:rgba(16,185,129,0.18); }
.az-scan-btn:disabled { opacity:0.4; cursor:not-allowed; }

.az-map-btn.on { border-color:var(--accent); background:color-mix(in srgb,var(--accent) 12%,transparent); }

/* ── Quartier Panel ── */
.az-quartier-card {
  background: color-mix(in srgb, var(--bg-card) 92%, transparent);
  border: 1px solid var(--border); border-radius: 16px; overflow:hidden;
  animation: azFadeUp 0.3s ease;
}
.az-q-header {
  background: linear-gradient(135deg, #2e1065, #4c1d95);
  padding: 14px 16px; color: #fff;
}
.az-q-title { font-size: 1rem; font-weight: 800; line-height:1.25; margin-bottom:4px; }
.az-q-sub { font-size: 0.72rem; color: rgba(255,255,255,0.8); font-weight: 600; }
.az-q-distance { font-size: 0.7rem; color: #C4B5FD; margin-top:4px; font-weight: 700; }

.az-q-meta { padding: 12px 14px; display:flex; flex-direction:column; gap:8px; border-bottom:1px solid var(--border); }
.az-q-meta-item { font-size: 0.78rem; color: var(--text-secondary); line-height:1.55; }
.az-q-meta-item strong { display:block; font-size:0.68rem; font-weight:800; color: var(--accent); text-transform:uppercase; letter-spacing:0.6px; margin-bottom:2px; }

.az-q-tabs { display:flex; gap:4px; padding: 8px 10px; border-bottom:1px solid var(--border); overflow-x:auto; }
.az-q-tab {
  padding: 5px 10px; border-radius: 8px; border: 1.5px solid var(--border); background: transparent;
  cursor:pointer; font-family:inherit; font-size:0.72rem; font-weight:700; color: var(--text-secondary);
  white-space:nowrap; transition: all 0.18s;
}
.az-q-tab:hover { border-color: var(--accent); color: var(--accent); }
.az-q-tab.on { border-color: var(--accent); background: color-mix(in srgb, var(--accent) 12%, transparent); color: var(--accent); }

.az-q-body { padding: 10px 12px; max-height: 320px; overflow-y:auto; }
.az-q-list { display:flex; flex-direction:column; gap:8px; }
.az-q-item { display:flex; align-items:flex-start; gap:8px; padding: 7px 8px; border-radius: 8px; background: var(--bg-primary); border: 1px solid var(--border); }
.az-q-bullet { width: 22px; height: 22px; border-radius: 50%; background: color-mix(in srgb, var(--accent) 15%, transparent); color: var(--accent); font-size:0.7rem; font-weight:800; display:flex; align-items:center; justify-content:center; flex-shrink:0; margin-top:1px; }
.az-q-text { font-size: 0.78rem; color: var(--text-secondary); line-height:1.55; flex:1; }
.az-q-empty { font-size: 0.78rem; color: var(--text-muted); text-align:center; padding: 12px; }

.az-q-figure { gap:10px; }
.az-q-fig-avatar { font-size:1.4rem; flex-shrink:0; }
.az-q-fig-name { font-size:0.82rem; font-weight:800; color: var(--text-primary); }
.az-q-fig-role { font-size:0.72rem; color: var(--accent); font-weight:700; margin:1px 0; }
.az-q-fig-lien { font-size:0.72rem; color: var(--text-muted); }

.az-q-ev-date { font-size:0.68rem; font-weight:800; color: #F59E0B; text-transform:uppercase; letter-spacing:0.5px; }
.az-q-ev-name { font-size:0.82rem; font-weight:700; color: var(--text-primary); margin:2px 0; }
.az-q-ev-desc { font-size:0.75rem; color: var(--text-secondary); line-height:1.5; }

.az-q-lm-name { font-size:0.82rem; font-weight:700; color: var(--text-primary); }
.az-q-lm-desc { font-size:0.75rem; color: var(--text-secondary); line-height:1.5; margin-top:1px; }
.az-q-tag { display:inline-block; padding: 1px 7px; border-radius: 999px; font-size:0.65rem; font-weight:700; background: color-mix(in srgb, var(--accent) 10%, transparent); color: var(--accent); margin-left:4px; }

.az-result-quartier { background: rgba(139,92,246,0.05); }
.az-result-quartier:hover { background: rgba(139,92,246,0.12); }
.az-result-tourist { background: rgba(245,158,11,0.06); }
.az-result-tourist:hover { background: rgba(245,158,11,0.14); }

/* ── Tourist Zone Panel ── */
.az-tourist-card {
  background: color-mix(in srgb, var(--bg-card) 92%, transparent);
  border: 1px solid var(--border); border-radius: 16px; overflow:hidden;
  animation: azFadeUp 0.3s ease;
}
.az-tz-header {
  background: linear-gradient(135deg, #065f46, #047857);
  padding: 14px 16px; color: #fff;
}
.az-tz-badge { font-size: 0.68rem; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; color: #6EE7B7; margin-bottom: 6px; }
.az-tz-title { font-size: 1rem; font-weight: 800; line-height:1.25; margin-bottom:4px; }
.az-tz-sub { font-size: 0.72rem; color: rgba(255,255,255,0.8); font-weight: 600; }
.az-tz-distance { font-size: 0.7rem; color: #6EE7B7; margin-top:4px; font-weight: 700; }

.az-tz-meta { padding: 12px 14px; display:flex; flex-direction:column; gap:8px; border-bottom:1px solid var(--border); }
.az-tz-meta-item { font-size: 0.78rem; color: var(--text-secondary); line-height:1.55; }
.az-tz-meta-item strong { display:block; font-size:0.68rem; font-weight:800; color: #059669; text-transform:uppercase; letter-spacing:0.6px; margin-bottom:2px; }

.az-tz-tabs { display:flex; gap:4px; padding: 8px 10px; border-bottom:1px solid var(--border); overflow-x:auto; }
.az-tz-tab {
  padding: 5px 10px; border-radius: 8px; border: 1.5px solid var(--border); background: transparent;
  cursor:pointer; font-family:inherit; font-size:0.72rem; font-weight:700; color: var(--text-secondary);
  white-space:nowrap; transition: all 0.18s;
}
.az-tz-tab:hover { border-color: #059669; color: #059669; }
.az-tz-tab.on { border-color: #059669; background: rgba(5,150,105,0.12); color: #059669; }

.az-tz-body { padding: 10px 12px; max-height: 320px; overflow-y:auto; }
.az-tz-desc { font-size: 0.8rem; color: var(--text-secondary); line-height:1.65; padding: 6px 4px; }
.az-tz-list { display:flex; flex-direction:column; gap:8px; }
.az-tz-item { display:flex; align-items:flex-start; gap:8px; padding: 7px 8px; border-radius: 8px; background: var(--bg-primary); border: 1px solid var(--border); }
.az-tz-bullet { width: 22px; height: 22px; border-radius: 50%; background: rgba(245,158,11,0.15); color: #F59E0B; font-size:0.7rem; font-weight:800; display:flex; align-items:center; justify-content:center; flex-shrink:0; margin-top:1px; }
.az-tz-text { font-size: 0.78rem; color: var(--text-secondary); line-height:1.55; flex:1; }
.az-tz-at-name { font-size:0.82rem; font-weight:700; color: var(--text-primary); }
.az-tz-at-desc { font-size:0.75rem; color: var(--text-secondary); line-height:1.5; margin-top:1px; }

@media(max-width: 520px) {
  .az-q-tabs { gap:3px; padding: 6px 8px; }
  .az-q-tab { padding: 4px 8px; font-size:0.68rem; }
  .az-tz-tabs { gap:3px; padding: 6px 8px; }
  .az-tz-tab { padding: 4px 8px; font-size:0.68rem; }
}
`

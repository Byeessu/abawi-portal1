import { useState, useMemo, useEffect } from 'react';
import SEO from '../components/SEO';
import { useAuth } from '../context/AuthContext';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import { divIcon } from 'leaflet'
import 'leaflet/dist/leaflet.css'
import SENEGAL_HEALTH_DATA, {
  CITIES, ZONES, SPECIALTIES,
  filterByCity, filterByZone, filterBySpecialty,
  getOnDutyPharmacies, getRealtimeOnDutyPharmacies, searchHealth
} from '../data/senegalHealthData'
import {
  fetchGooglePlacesPharmacies,
  fetchSupabaseGuardShifts
} from '../services/pharmacyRealtime'
import PharmacyGuardReport from '../components/abavie/PharmacyGuardReport'
import { callGroq } from '../lib/groqClient'
import {
  HospitalIcon, PharmacyIcon, DoctorIcon, LabIcon, AmbulanceIcon,
  EmergencyIcon, ThermometerIcon, HeadacheIcon, MaskIcon, FatigueIcon,
  StomachIcon, RashIcon, NauseaIcon, HeartIcon, LungsIcon, BoneIcon,
  BloodIcon, WaterIcon, DetectionIcon, ShieldIcon, VaccineIcon,
  LightbulbIcon, BookIcon, DocumentIcon, StoreIcon, SparklesIcon,
  PhoneIcon, MapPinIcon, ClockIcon, BedIcon, SpecialtyIcon,
  CheckCircleIcon, MoonIcon, TestTubeIcon, CarIcon, MapIcon,
  BuildingIcon,
} from '../components/abavie/AbavieIcons'
import ToolHero from '../components/ToolHero'
import ToolInfoPanel from '../components/ToolInfoPanel'
import { BOUTIQUE_CATEGORIES, ProductDetailModal, OrderModal } from '../components/abavie/AbavieBoutique'
import './Abavie.css';

function mkIcon(emoji, bg, size=34) {
  return divIcon({
    className: '',
    html: `<div style="background:${bg};width:${size}px;height:${size}px;border-radius:50%;border:2.5px solid white;display:flex;align-items:center;justify-content:center;font-size:${Math.round(size*0.44)}px;box-shadow:0 4px 12px rgba(0,0,0,0.3)">${emoji}</div>`,
    iconSize:[size,size], iconAnchor:[size/2,size/2], popupAnchor:[0,-size/2-4]
  })
}
const hospitalIcon = mkIcon('🏥','#EF4444',38)
const hospitalPrivateIcon = mkIcon('🏥','#F97316',38)
const pharmacyIcon = mkIcon('💊','#10B981',32)
const pharmacyDutyIcon = mkIcon('🚨','#EF4444',36)
function userGPSIcon() { return divIcon({ className:'', html:`<div style="background:#3B82F6;width:16px;height:16px;border-radius:50%;border:3px solid white;box-shadow:0 0 0 5px rgba(59,130,246,0.22)"></div>`, iconSize:[16,16], iconAnchor:[8,8] }) }

const TILES = {
  voyager: { url:'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', attr:'© OSM contributors, © CARTO' },
  osm:     { url:'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', attr:'© OpenStreetMap contributors' },
  dark:    { url:'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', attr:'© OSM contributors, © CARTO' },
}

/* ── ÉDUCATION SANITAIRE & DÉTECTION ── */
const HEALTH_EDUCATION = [
  {
    cat: 'Détection',
    icon: '🔬',
    title: 'Signes d\'alerte — consultez vite',
    items: [
      'Fièvre > 39°C persistante plus de 48h',
      'Douleur thoracique + essoufflement',
      'Maux de tête violents + raideur de nuque',
      'Saignement inexpliqué ou ecchymoses multiples',
      'Perte de poids rapide (>5% en 1 mois)',
      'Soif excessive + urines fréquentes = possible diabète',
      'Fatigue intense + pâleur = possible anémie (carence fer)',
      'Fractures répétées = possible carence vitamine D / calcium',
      'Vision floue soudaine = urgence ophtalmologique',
      'Gonflement des chevilles + urines mousseuses = possible insuffisance rénale',
      'Douleur abdominale aiguë avec fièvre = possible appendicite, choléra ou péritonite',
      'Confusion mentale soudaine chez une personne âgée = possible infection, AVC ou déshydratation',
      'Respiration rapide (>30/min) + fatigue extrême = possible insuffisance respiratoire ou cardiaque',
    ]
  },
  {
    cat: 'Carences',
    icon: '🩸',
    title: 'Carences nutritionnelles fréquentes au Sénégal',
    items: [
      'Carence fer → anémie : fatigue, pâleur, essoufflement. Solution : feuilles de naïté, foie, haricot rouge, supplémentation.',
      'Carence vitamine A → xérophtalmie (yeux secs), infections fréquentes. Solution : carotte, patate douce, foie, mangue.',
      'Carence iode → goitre, retard mental chez l\'enfant. Solution : sel iodé, poisson de mer.',
      'Carence zinc → retard de croissance, infections cutanées. Solution : viande, crustacés, graines de courge.',
      'Carence calcium → crampes, osteoporosis. Solution : lait, fromage local (warang), feuilles de baobab.',
      'Carence vitamine D → os fragiles, fatigue. Solution : exposition solaire matinale 15-20 min, poisson gras.',
      'Carence vitamine B12 → neuropathie, anémie mégaloblastique. Solution : foie, viande rouge, œufs, ou supplémentation.',
      'Carence acide folique → anémie, troubles du tube neural chez le fœtus. Solution : légumes verts, légumineuses, supplémentation prénatale.',
      'Carence protéines (kwashiorkor/marasmus) → retard croissance, infections. Solution : niébé, arachide, poisson, lait.',
      'Carence sélénium → baisse immunité, cardiomyopathie. Solution : noix, graines, céréales complètes.',
    ]
  },
  {
    cat: 'Maladies tropicales',
    icon: '🦟',
    title: 'Maladies endémiques — prévention & détection',
    items: [
      'Paludisme : fièvre + frissons + sueurs cycliques. Prévention : moustiquaire, répulsifs, éliminer eaux stagnantes. Traitement : consultation immédiate (ACT).',
      'Fièvre typhoïde : fièvre prolongée, diarrhée, rose spots. Prévention : eau potable, lavage des mains.',
      'Bilharziose : sang dans les urines, douleur abdominale. Prévention : éviter eaux douces stagnantes.',
      'Maladie de Verneuil (dracunculose) : éradiquée mais vigilance.',
      'Dengue : fièvre + myalgies + rash. Prévention : lutte antivectorielle.',
      'Méningite : fièvre + raideur nuque + vomissements. Vaccination disponible.',
      'Hépatite B : vaccination obligatoire, dépistage VIH associé.',
      'Tuberculose : toux > 3 semaines, hémoptysie, sueurs nocturnes. Dépistage gratuit aux centres de santé.',
      'Fièvre jaune : vaccination obligatoire au Sénégal. Fièvre, jaunisse, hémorragie. Prévention : vaccination + lutte antivectorielle.',
      'Choléra : diarrhée aqueuse profuse, vomissements, déshydratation rapide. Prévention : eau traitée, hygiène. Traitement : SRO immédiat.',
      'Lèpre : taches dépigmentées, insensibilité. Prévention : dépistage précoce, traitement multidrogue disponible gratuitement.',
      'Rage : morsure d\'animal suspect = lavage immédiat + vaccin post-exposition urgent.',
    ]
  },
  {
    cat: 'Bonne pratique',
    icon: '✅',
    title: 'Les 15 gestes qui sauvent',
    items: [
      '1. Lavez-vous les mains avec du savon avant chaque repas et après les toilettes.',
      '2. Faites vacciner vos enfants (BCG, DTC, Rougeole, Hépatite B, Fièvre jaune, pneumocoque).',
      '3. Dormez sous moustiquaire imprégnée, même en saison sèche.',
      '4. Buvez de l\'eau traitée ou bouillie. Conservez l\'eau dans des récipients propres et couverts.',
      '5. Consommez 5 portions de fruits/légumes par jour. Privilégiez les produits locaux et de saison.',
      '6. Faites un dépistage VIH/sida régulier — gratuit et confidentiel dans les centres de santé.',
      '7. Contrôlez votre tension artérielle au moins 1 fois par an après 30 ans.',
      '8. Évitez l\'automédication avec des antibiotiques — résistance antimicrobienne.',
      '9. Allezz à la selle régulièrement, mangez fibres (mil, niebé, légumes) pour prévenir les cancers digestifs.',
      '10. Faites un bilan complet (glycémie, créatinine, transaminases, NFS) une fois par an.',
      '11. Portez un casque à moto et attachez la ceinture en voiture — traumatismes sont la 1ère cause de mortalité chez les jeunes.',
      '12. Protégez-vous du soleil (10h-16h) : chapeau, lunettes, écran solaire pour éviter cancers de la peau.',
      '13. Gardez vos papiers vaccinaux et faites le rappel du tétanos tous les 10 ans.',
      '14. Désinfectez les coupures avec de l\'eau de javel diluée ou de l\'eau oxygénée, pas avec du beurre ou huile.',
      '15. Consultez un dentiste au moins 1 fois par an, brossez-vous les dents 2 fois/jour.',
    ]
  },
  {
    cat: 'Femme & Mère',
    icon: '🤱',
    title: 'Santé maternelle et infantile',
    items: [
      'Consultation prénatale dès le 1er mois, idéalement 4 visites pendant la grossesse.',
      'Supplémentation en fer + acide folique pendant la grossesse.',
      'Accouchement assisté obligatoire — évitez les accouchements à domicile non assistés.',
      'Allaitement exclusif pendant 6 mois — meilleure protection immunitaire.',
      'Vaccination du nourrisson selon le calendrier national (BCG, Polio, Penta, Rougeole, Fièvre jaune).',
      'Dépistage du cancer du col de l\'utérus (frottis/HPV) dès 25 ans.',
      'Dépistage du cancer du sein (auto-palpation mensuelle, mammographie >40 ans).',
      'Planification familiale : contraception, espacement des naissances pour la santé maternelle.',
      'Gestion des infections génitales (IST) : consultation systématique en cas de symptômes.',
      'Dépistage du diabète gestationnel entre 24 et 28 semaines de grossesse.',
      'Supplémentation en calcium pendant la grossesse pour réduire le risque d\'eclampsie.',
      'Préparation à l\'accouchement et signes d\'alerte : perte de liquide, saignements, contractions régulières.',
    ]
  },
  {
    cat: 'Hygiène alimentaire',
    icon: '🍲',
    title: 'Prévention des toxi-infections alimentaires',
    items: [
      'Lavez fruits et légumes avec de l\'eau traitée ou chlorée avant consommation.',
      'Cuisez la viande et le poisson à cœur (température interne > 70°C).',
      'Conservez les aliments au frais (< 5°C) — ne laissez pas les plats cuisinés > 2h à température ambiante.',
      'Séparez aliments crus et cuits dans le réfrigérateur.',
      'Réchauffez les plats à feu vif jusqu\'à ébullition.',
      'Lavez-vous les mains avant de préparer les repas et après avoir touché de la viande crue.',
      'Utilisez de l\'eau potable pour la préparation des aliments et des glaçons.',
      'Évitez les aliments crus en période de fortes chaleurs ou de forte humidité.',
      'Nettoyez et désinfectez régulièrement les plans de travail et ustensiles de cuisine.',
      'Jetez les conserves bombées ou à l\'odeur suspecte — risque de botulisme.',
    ]
  },
  {
    cat: 'Santé mentale',
    icon: '🧠',
    title: 'Bien-être psychologique et santé mentale',
    items: [
      'Parlez de vos émotions : la dépression n\'est pas une faiblesse, c\'est une maladie traitable.',
      'Signes d\'alerte : tristesse persistante > 2 semaines, perte d\'intérêt, pensées suicidaires = consultation urgente.',
      'Anxiété et crises de panique : respiration profonde, ancrage sensoriel, consultation si répétées.',
      'Stress chronique : source de maladies cardiovasculaires, diabète et troubles digestifs.',
      'Sommeil : 7-8h par nuit, routine fixe, évitez les écrans 1h avant le coucher.',
      'Soutien social : rester connecté à famille et amis réduit le risque de dépression de 40%.',
      'Addictions : tabac, alcool, tramadol — dépistage et prise en charge disponibles dans les CTA.',
      'Violences conjugales et VBG : non, ce n\'est pas normal. Aide disponible via le 1515 et associations.',
      'Santé mentale des adolescents : surveillance des changements brusques de comportement et d\'humeur.',
      'Professionnels de santé mentale : psychiatres, psychologues, conseillers — liste disponible dans l\'annuaire.',
    ]
  },
  {
    cat: 'Maladies chroniques',
    icon: '💊',
    title: 'Diabète, HTA, asthme et maladies chroniques',
    items: [
      'Diabète type 2 : 1 Sénégalais sur 10 en est atteint. Contrôle glycémique régulier, régime, activité physique.',
      'Hypertension artérielle (HTA) : "tueuse silencieuse". Mesure annuelle après 30 ans, traitement de fond si > 140/90.',
      'Asthme : utiliser correctement l\'inhalateur (buccal puis pulmonaire), éviter la fumée et les poussières.',
      'Insuffisance cardiaque : surveillance du poids quotidien, restriction sodée, traitement régulier.',
      'BPCO (bronchite chronique) : arrêt du tabac primordial, vaccination grippe + pneumocoque annuelle.',
      'Maladie rénale chronique : contrôle tension + glycémie + protéinurie. Éviter les AINS en surdosage.',
      'Épilepsie : traitement quotidien sans interruption, éviter la natation et la conduite seul.',
      'Thyroïdite d\'Hashimoto / goitre : iodation du sel, TSH annuelle, traitement substitutif si hypothyroïdie.',
      'Suivi chronique : carnet de santé, prise de médicaments quotidienne, rendez-vous réguliers.',
      'Complications du diabète : pied diabétique (contrôle quotidien), rétinopathie (fond d\'œil annuel), néphropathie.',
    ]
  },
  {
    cat: 'Santé bucco-dentaire',
    icon: '🦷',
    title: 'Hygiène dentaire et prévention buccale',
    items: [
      'Brossez-vous les dents 2 fois par jour minimum, 2 minutes, mouvements circulaires doux.',
      'Utilisez du fil dentaire ou des brossettes interdentaires quotidiennement.',
      'Consultez un dentiste au moins 1 fois par an, dès l\'apparition de la 1ère dent chez le bébé.',
      'Caries : limiter les sucreries, soda et jus industriels — rincer la bouche après consommation.',
      'Fluorose dentaire : contrôler l\'apport en fluor (eau de puits, dentifrice enfant) dans les zones endémiques.',
      'Maladie parodontale (gencives) : saignements, mauvaise haleine = consultation parodontale.',
      'Traumatismes dentaires : conserver la dent cassée dans du lait ou salive, consulter en urgence.',
      'Dents de sagesse : douleur, infection, kyste = avis chirurgical si nécessaire.',
      'Mauvaise haleine chronique : cause digestive ou dentaire — ne pas se contenter de menthes.',
      'Prothèses dentaires : nettoyage quotidien, contrôle d\'ajustement tous les 2 ans.',
    ]
  },
  {
    cat: 'Enfant & Ado',
    icon: '👶',
    title: 'Santé pédiatrique et adolescente',
    items: [
      'Croissance : suivi du périmètre brachial, taille, poids, périmètre crânien (0-2 ans).',
      'Développement psycho-moteur : tenir la tête à 3 mois, marcher à 12 mois, phrases à 2 ans.',
      'Diarrhée chez l\'enfant : SRO immédiatement, continuer l\'allaitement, danger = déshydratation.',
      'Fièvre chez le nourrisson < 3 mois > 38°C = urgence pédiatrique immédiate.',
      'Convulsions fébriles : mettre l\'enfant en PLS, ne rien mettre dans la bouche, appeler les urgences.',
      'Malnutrition : bracelet MUAC < 11,5 cm (6-59 mois) = malnutrition aiguë sévère = référencement urgent.',
      'Accidents domestiques : brûlures, intoxications, noyade — sécuriser le domicile, supervision.',
      'Adolescence : vaccination HPV (fille + garçon), éducation sexuelle, prévention addictions.',
      'Anémie chez l\'enfant : fer + vitamine A + déparasitage systématique tous les 6 mois.',
      'Dépistage précoce : surdité (réflexe auditif néonatal), rétinopathie du prématuré, dépistage métabolique.',
    ]
  },
  {
    cat: 'Environnement',
    icon: '🌍',
    title: 'Santé environnementale et changement climatique',
    items: [
      'Chaleur extrême (canicule) : boire 2-3L/jour, rester à l\'ombre 11h-16h, surveiller personnes âgées.',
      'Qualité de l\'air : éviter les brûlages sauvages de déchets, utiliser des foyers améliorés.',
      'Eaux stagnantes : éliminer les gîtes larvaires pour réduire paludisme et dengue.',
      'Déchets médicaux : ne pas jeter seringues ou médicaments dans la nature — retour pharmacie/incinération.',
      'Plomb et métaux lourds : faire attention aux poteries traditionnelles et tuyauteries anciennes.',
      'Pesticides : lavage soigné des fruits/légumes, limiter l\'exposition des enfants aux produits agricoles.',
      'Inondations et épidémies post-inondation : choléra, leptospirose — eau de javel pour la désinfection.',
      'Santé au travail : protection individuelle, pauses hydratation, formation aux risques professionnels.',
      'Maladies liées à l\'eau : dracunculose, bilharziose — filtrer/bouillir l\'eau de surface.',
      'Biodiversité et santé : protection des forêts pour réduire les zoonoses (maladies animales-humains).',
    ]
  },
  {
    cat: 'Cœur & Vaisseaux',
    icon: '❤️',
    title: 'Prévention cardiovasculaire',
    items: [
      'HTA : "tueuse silencieuse". Mesurez votre tension au moins 1 fois/an après 30 ans.',
      'Diabète + HTA + cholestérol = risque multiplié par 10 d\'infarctus et d\'AVC.',
      'Arrêter de fumer : le plus important geste de prévention cardiovasculaire, quel que soit l\'âge.',
      'Alimentation cardioprotectrice : poisson gras, fruits, légumes, huile d\'arachide, limiter sel et graisses.',
      'Activité physique : 30 minutes de marche rapide/jour réduit le risque cardiaque de 30%.',
      'AVC (accident vasculaire cérébral) : FASTR — Face (sourire asymétrique), Arms (bras qui tombe), Speech (parole confuse), Time (appeler 1515).',
      'Infarctus : douleur thoracique + sueurs + nausées = urgence absolue, aspirine 250mg si disponible.',
      'Insuffisance veineuse : élévation des jambes, compression médicale, éviter station debout prolongée.',
      'Fibrillation auriculaire : pouls irrégulier = risque d\'AVC, anticoagulation nécessaire.',
      'Cholestérol : LDL élevé = statines + régime, contrôle annuel chez les > 40 ans.',
    ]
  },
  {
    cat: 'Sexualité & MST',
    icon: '🩺',
    title: 'Santé sexuelle et reproductive',
    items: [
      'Dépistage VIH : gratuit, confidentiel, disponible dans tous les centres de santé et CTA.',
      'PrEP (Pré-exposition) : pilule quotidienne pour personnes à haut risque, efficacité > 90%.',
      'Contraception : préservatif (protection MST+VIH), pilule, DIU, implant, injectable — choix personnalisé.',
      'IST (gonocoque, chlamydiae, syphilis) : souvent silencieuses, dépistage régulier recommandé.',
      'VPH et cancer du col : vaccination dès 9 ans, frottis/HPV dès 25 ans.',
      'Grossesse non désirée : contraception d\'urgence disponible en pharmacie jusqu\'à 72h après.',
      'Avortement sécurisé : légal au Sénégal en cas de danger pour la mère ou viol — consultation obligatoire.',
      'Infertilité : bilan du couple après 1 an de tentatives infructueuses, prise en charge multidisciplinaire.',
      'Hépatite B : vaccination obligatoire dès la naissance, dépistage du partenaire.',
      'Éducation sexuelle : dialogue parent-enfant, consentement, prévention des violences sexuelles.',
    ]
  },
  {
    cat: 'Nutrition',
    icon: '🥗',
    title: 'Alimentation sénégalaise et nutrition équilibrée',
    items: [
      'Assiette sénégalaise équilibrée : 1/2 légumes (salade, chou, naïté), 1/4 céréale (riz, mil, couscous), 1/4 protéine (poisson, poulet, niébé).',
      'Aliments locaux riches : moringa (vitamines A/C), baobab (vitamine C, calcium), fonio (gluten-free, fer), niebé (protéines, fibres).',
      'Limitation du sel : < 5g/jour pour prévenir l\'HTA. Éviter les cubes de bouillon industriels.',
      'Sucre : limiter jus industriels, soda, sucreries — risque de diabète et caries.',
      'Graines et noix : arachide (protéines, bon gras), néré (fer, calcium), sésame (calcium).',
      'Fermentation traditionnelle : dégé (niébé fermenté) — probiotiques naturels pour la digestion.',
      'Poisson : 2-3 fois/semaine (omega-3), privilégier le petit poisson entier (apport calcium).',
      'Eau : 1,5-2L/jour minimum, plus en cas de chaleur. Éviter les boissons sucrées pour hydrater.',
      'Petit-déjeuner : indispensable pour les enfants (concentration scolaire) et adultes (énergie).',
      'Complémentation : fer + vitamine A + acide folique + zinc selon les recommandations nationales.',
    ]
  },
  {
    cat: 'Vaccination',
    icon: '💉',
    title: 'Vaccination adulte et du voyageur',
    items: [
      'Tétanos : rappel tous les 10 ans, ou 5 ans en cas de plaie sale.',
      'Fièvre jaune : vaccin obligatoire au Sénégal, valable à vie (OMS 2016).',
      'Méningite A : vaccination de masse régulière dans la ceinture méningitique.',
      'Hépatite B : 3 doses (0, 1, 6 mois), protection durable.',
      'Pneumocoque : recommandé > 65 ans et insuffisants cardiaques/pulmonaires.',
      'Grippe saisonnière : annuelle, recommandée pour personnes âgées, diabétiques, cardiaques.',
      'COVID-19 : maintien de la vaccination à jour selon recommandations nationales.',
      'Voyageur en Afrique : vaccins obligatoires (fièvre jaune) + conseillés (hépatite A/B, typhoïde, méningite).',
      'Pèlerinage (Hajj/Oumra) : vaccination méningocoque ACWY obligatoire, grippe recommandée.',
      'Femme en âge de procréer : rubéole si séronégative, avant toute grossesse.',
    ]
  },
  {
    cat: 'Activité & Sommeil',
    icon: '🏃',
    title: 'Activité physique et hygiène du sommeil',
    items: [
      'Marche rapide : 30 min/jour minimum, accessible à tous, sans équipement.',
      'Renforcement musculaire : 2 séances/semaine pour préserver la masse musculaire et osseuse.',
      'Sédentarité : se lever toutes les 30-45 min si travail de bureau, marcher 10 000 pas/jour idéal.',
      'Sport et chaleur : hydratation accrue, éviter 11h-16h, reconnaître les signes d\'insolation.',
      'Sommeil : 7-8h pour adultes, 8-10h pour adolescents, 9-12h pour enfants (3-12 ans).',
      'Insomnie : routine fixe, chambre fraîche et obscure, pas de café après 14h, pas d\'écrans 1h avant.',
      'Apnée du sommeil : ronflements + pauses respiratoires = risque cardiovasculaire, consultation ORL.',
      'Yoga et méditation : réduction du stress, meilleure qualité de sommeil, baisse de la tension artérielle.',
      'Activité physique et maladies chroniques : le sport est un médicament pour diabète, HTA et dépression.',
      'Personnes âgées : marche + équilibre + souplesse pour prévenir les chutes (1ère cause de mortalité chez les +75 ans).',
    ]
  },
]

/* ── DOCUMENTATION MÉDICALE COMPLÈTE ── */
const HEALTH_DOCUMENTATION = [
  {
    cat: 'Bonne pratique',
    icon: '✅',
    title: 'Bonnes pratiques médicales — référentiel Abavie',
    items: [
      'Toujours se laver les mains avant et après chaque consultation ou soin.',
      'Stériliser le matériel réutilisable (ciseaux, pinces, bistouris) à chaque usage.',
      'Respecter la chaîne du froid pour les vaccins et médicaments thermosensibles.',
      'Utiliser des gants à usage unique pour tout contact avec sang, liquides biologiques ou plaies ouvertes.',
      'Tenir un dossier médical à jour pour chaque patient : antécédents, allergies, traitements en cours.',
      'Informer le patient de son diagnostic, des options de traitement et des effets secondaires possibles.',
      'Prescrire les antibiotiques uniquement en cas d\'infection bactérienne prouvée ou fortement suspectée.',
      'Encourager la vaccination et la prévention comme première ligne de défense sanitaire.',
      'Faire un examen physique systématique avant tout diagnostic — ne pas se fier qu\'aux symptômes rapportés.',
      'Rédiger les ordonnances de façon lisible, avec posologie, durée et mode d\'administration clairs.',
      'Vérifier les allergies (y compris au latex et aux colorants) avant toute prescription ou injection.',
      'Identifier correctement le patient (nom + date de naissance) avant tout soin, échantillon ou transfusion.',
      'Signaler les effets indésirables graves au pharmacovigilant national (CNPV).',
      'Utiliser la stérilisation par autoclave (121°C, 15 min) pour tout matériel chirurgical réutilisable.',
    ]
  },
  {
    cat: 'À ne pas négliger',
    icon: '⚠️',
    title: 'Signes et situations à ne jamais négliger',
    items: [
      'Douleur thoracique irradiant vers le bras gauche ou la mâchoire = possible infarctus.',
      'Maux de tête soudains et violents ("coup de tonnerre") = possible hémorragie méningée.',
      'Perte de conscience brutale, même brève = consultation neurologique urgente.',
      'Fièvre > 40°C chez un enfant de moins de 3 ans = urgence pédiatrique.',
      'Toux persistante > 3 semaines avec perte de poids = dépistage tuberculose obligatoire.',
      'Saignement entre les règles ou après la ménopause = avis gynécologique immédiat.',
      'Changement de forme ou couleur d\'un grain de beauté = possible mélanome.',
      'Soif excessive + polyurie + amaigrissement = bilan diabète urgent.',
      'Gonflement unilatéral du mollet + douleur + chaleur = possible thrombose veineuse profonde.',
      'Douleur abdominale aiguë avec défense = possible appendicite/perforation — ne pas masquer avec antalgiques.',
      'Dyspnée soudaine + tachycardie + douleur thoracique = embolie pulmonaire possible.',
      'Ictère (jaunisse) chez le nouveau-né dans les 24 premières heures = urgence néonatale (kernictère).',
      'Douleur lombaire + fièvre + troubles urinaires = possible pyélonéphrite aiguë.',
      'Traumatisme crânien avec vomissements répétés ou amnésie = scanner cérébral urgent.',
    ]
  },
  {
    cat: 'Méthodes éprouvées',
    icon: '🔬',
    title: 'Méthodes validées par la science et l\'OMS',
    items: [
      'Allaitement maternel exclusif 6 mois : réduit de 50% les infections respiratoires et diarrhéiques.',
      'Dormir sous moustiquaire imprégnée : réduction de 60-70% des cas de paludisme simple.',
      'Traitement préventif intermittent du paludisme chez la femme enceinte (TPI) : 3 doses de SP minimum.',
      'Déshydratation orale (SRO) : méthode OMS éprouvée, sauve des millions de vies chaque année.',
      'Chimiothérapie préventive du VIH (PrEP) : efficacité > 90% si prise quotidienne régulière.',
      'Traitement antirétroviral (ARV) : charge virale indétectable = non transmissible (I=I).',
      'Dépistage du cancer du col par VIA ou HPV : réduction de 70% de la mortalité si couverture > 70%.',
      'Réhydratation + zinc pour diarrhée aiguë chez l\'enfant : réduit durée et gravité (recommandation OMS).',
      'Accouchement assisté par personnel qualifié : réduction drastique de la mortalité maternelle et néonatale.',
      'Contrôle de la tension artérielle + statines après 10 ans d\'hypertension : réduction AVC et infarctus de 25-30%.',
      'Kangourou mother care : peau-à-peau pour prématurés, réduit mortalité néonatale de 40%.',
      'Chimiothérapie du paludisme à base d\'ACT : artémisinine + luméfantrine/amodiaquine = traitement de 1ère ligne.',
      'Circumcision médicale masculine : réduction du risque de transmission VIH de 60%.',
      'Supplémentation vitamine A chez l\'enfant 6-59 mois : réduction mortalité de 23%, 2 fois/an.',
    ]
  },
  {
    cat: 'Interdits',
    icon: '🚫',
    title: 'Pratiques dangereuses et contre-indications absolues',
    items: [
      'Jamais d\'antibiotique sans prescription ni diagnostic : résistance antimicrobienne = menace mondiale.',
      'Ne jamais prescrire de chloroquine seule pour le paludisme : résistance massive au Sénégal.',
      'Interdiction de faire vomir après ingestion d\'un produit caustique ou d\'hydrocarbure.',
      'Ne pas administrer d\'aspirine à un enfant avec fièvre virale (risque de syndrome de Reye).',
      'Contre-indication absolue : AINS (ibuprofène, diclofénac) en fin de grossesse (> 6 mois).',
      'Ne jamais laisser un patient inconscient sur le dos sans surveillance des voies aériennes.',
      'Interdit de réutiliser une seringue ou une aiguille, même sur le même patient.',
      'Ne pas appliquer de beurre, huile ou dentifrice sur une brûlure : risque d\'infection et d\'évolution défavorable.',
      'Automédication à base de plantes sans avis médical : interactions, toxicité hépatique, contrefaçon.',
      'Charlatanisme et guérisseurs non réglementés : danger pour la santé publique, report de soins.',
      'Ne jamais interrompre un traitement ARV : risque de résistance et échec thérapeutique.',
      'Contre-indication absolue : quinine IV en 1ère intention du paludisme simple (toxicité cardiaque).',
      'Ne pas administrer de vitamine K antagoniste (Aspirine, AINS) au nouveau-né (risque hémorragique).',
      'Interdiction de vente de médicaments psychotropes (tramadol, codéine) sans ordonnance stricte.',
    ]
  },
  {
    cat: 'Morale',
    icon: '🕊️',
    title: 'Éthique, déontologie et valeurs en santé',
    items: [
      'Confidentialité médicale absolue : le secret professionnel est sacré et protégé par la loi.',
      'Consentement éclairé : tout patient a le droit de refuser un traitement après information complète.',
      'Non-discrimination : accès aux soins garanti sans distinction de race, religion, fortune ou origine.',
      'Dignité du patient : préserver l\'intimité, le respect et l\'autonomie de décision en toute circonstance.',
      'Justice dans l\'accès aux soins : prioriser l\'urgence vitale et l\'équité dans la distribution des ressources.',
      'Vérité au patient : annoncer un diagnostic grave avec empathie, clarté et sans mensonge thérapeutique.',
      'Responsabilité professionnelle : maintenir ses compétences à jour et reconnaître ses limites.',
      'Bienveillance : le primum non nocere (d\'abord ne pas nuire) guide toute décision médicale.',
      'Solidarité santé : participer aux campagnes de vaccination, de dépistage et d\'éducation sanitaire communautaire.',
      'Protection des vulnérables : enfants, personnes âgées, handicapés et malades mentaux méritent une attention renforcée.',
      'Équité genre : garantir l\'accès égal aux soins pour les femmes, notamment en santé reproductive.',
      'Protection des données : respecter la loi sur la protection des données personnelles de santé (loi Sénégal 2008-12).',
      'Conflit d\'intérêts : déclarer tout lien avec l\'industrie pharmaceutique lors des prescriptions.',
      'Fin de vie : respecter la dignité, soulager la souffrance, accompagner le patient et sa famille.',
    ]
  },
  {
    cat: 'Protocoles',
    icon: '📋',
    title: 'Protocoles de soins standardisés',
    items: [
      'Prise en charge du choc : position de Trendelenburg, oxygène, 2 voies veineuses, remplissage cristalloïde, recherche cause.',
      'Prise en charge de l\'AVC : FAST + bilan neuro + glycémie + tension + référencement neurochirurgie < 4h30 si thrombolyse.',
      'Prise en charge du paludisme grave : TDR + NFS + glycémie + artéméther IV/IM + transfusion si Hb < 5g/dL.',
      'Prise en charge de la déshydratation aiguë : évaluation clinique (yeux, soif, pli cutané) + SRO selon degré.',
      'Prise en charge de l\'eclampsie : sulfate de magnésium IV + contrôle tension + accouchement dans les 12-24h.',
      'Prise en charge de l\'hémorragie du post-partum : ocytocine 10 UI IM/IV, massage utérin, remplissage, chirurgie si échec.',
      'Prise en charge du traumatisme : ABCDE (Airway, Breathing, Circulation, Disability, Exposure) + immobilisation cervicale.',
      'Prise en charge de l\'hypoglycémie : glycémie capillaire, 15g de glucose per os ou 1 ampoule de G10% IV.',
      'Prise en charge de l\'asthme aigu grave : salbutamol + oxygène + corticoïdes, référencement si réponse insuffisante.',
      'Prise en charge du sepsis : antibiothérapie dans l\'heure, cultures, remplissage, vasopresseurs si besoin.',
      'Prise en charge du nouveau-né asphyxié : séchage + stimulation + ventilation masque-bouche si apnée.',
      'Prise en charge de l\'intoxication : identification produit, ne pas faire vomir si caustique, charbon activé si < 1h.',
      'Prise en charge de l\'HTA aiguë : nicardipine ou urapidil IV, objectif baisse progressive (pas brutale).',
      'Prise en charge de la fracture : immobilisation, analgésie, dégagement si nécessaire, référencement orthopédique.',
    ]
  },
  {
    cat: 'Hygiène',
    icon: '🧼',
    title: 'Hygiène hospitalière & lutte anti-infectieuse',
    items: [
      'Antisepsie des mains : 30 secondes de friction hydroalcoolique entre chaque patient.',
      'Pentaphylle (5 moments) : avant contact patient, avant soin aseptique, après risque de contamination, après contact patient, après contact environnement.',
      'Surveillance des infections nosocomiales : déclaration obligatoire, enquête, mesures de contrôle.',
      'Précautions standard : gants, blouse, lunettes, masque si risque de projection.',
      'Précautions complémentaires : contact (gants + blouse), gouttelettes (masque chirurgical), aérosol (FFP2/N95).',
      'Stérilisation des dispositifs médicaux : nettoyage → désinfection → stérilisation selon classe de risque.',
      'Gestion des déchets biomédicaux : tri, collecte, transport, stockage et élimination par incinération.',
      'Surveillance de la résistance aux antibiotiques : antibiogramme systématique, programme AMS (Antimicrobial Stewardship).',
      'Désinfection des surfaces : chlore 0,1% (1000ppm) pour surfaces contaminées, changement quotidien des draps.',
      'Isolement des patients : contact, gouttelettes, aérosol selon le germe et le risque de transmission.',
      'Prévention de la thrombose veineuse : héparine de bas poids moléculaire chez patients alités > 48h.',
      'Prophylaxie chirurgicale : antibiotique 30-60 min avant incision, pas de prolongation inutile post-op.',
      'Contrôle de la température ambiante : 22-24°C en salle d\'opération, 50-60% d\'humidité relative.',
      'Surveillance du port de bijoux et ongles : interdiction en bloc opératoire et en réanimation.',
    ]
  },
  {
    cat: 'Pharmacovigilance',
    icon: '💊',
    title: 'Bon usage du médicament et pharmacovigilance',
    items: [
      'Déclaration obligatoire des effets indésirables graves : formulaire national jaune (CNPV, Direction de la Pharmacie).',
      'Vérification systématique : bon patient, bon médicament, bonne posologie, bonne voie, bon moment.',
      'Interactions médicamenteuses : contrôler anticoagulants + AINS, statines + macrolides, etc.',
      'Grossesse et médicaments : classe de risque (A, B, C, D, X), éviter tératogènes (valproate, isotrétinoïne).',
      'Allaitement et médicaments : L1-L5 (Hale), privilégier compatibles (paracétamol, pénicillines).',
      'Insuffisance rénale : adaptation posologique nécessaire pour aminosides, vancomycine, metformine.',
      'Insuffisance hépatique : éviter paracétamol > 3g/jour, médicaments hépatotoxiques (isoniazide, pyrazinamide).',
      'Médicaments à marge thérapeutique étroite : digoxine, lithium, warfarine — dosage sanguin régulier.',
      'Médicaments à effet anticholinergique cumulatif : risque de confusion chez personnes âgées (cognitive burden).',
      'Génériques : bioéquivalence garantie, substitution possible sauf contre-indication médicale spécifique.',
      'Médicaments contrefaits : acheter en pharmacie agréée, vérifier emballage et numéro de lot.',
      'Automédication : limiter au paracétamol, SRO, antiseptiques locaux. Consulter au-delà de 48h.',
      'Stockage des médicaments : à l\'abri de la chaleur (< 25°C), de la lumière et de l\'humidité.',
      'Péremption : jeter les médicaments périmés, ne pas les donner. Programme de récupération en pharmacie.',
    ]
  },
  {
    cat: 'E-santé',
    icon: '📱',
    title: 'Télémédecine, e-santé et innovation digitale',
    items: [
      'Télémédecine au Sénégal : cadre légal en cours, téléconsultation, téléexpertise, télésurveillance, téléassistance.',
      'Dossier médical informatisé (DMI) : traçabilité, réduction des erreurs, coordination des soins.',
      'Téléconsultation : indication pour suivi chronique, répétition ordonnance, conseil préventif.',
      'Limites de la télémédecine : pas d\'examen physique, urgence, diagnostic complexe = consultation présentielle.',
      'Santé connectée (m-santé) : applications de suivi glycémique, tension, activité physique, rappel de pilule.',
      'Télémédecine en zone rurale : connexion satellite/4G, kiosques santé, drones livraison échantillons/vaccins.',
      'Intelligence artificielle en santé : aide au diagnostic (imagerie), prédiction des épidémies, chatbots éducatifs.',
      'Sécurité des données : chiffrement, authentification forte, conformité RGPD/loi sénégalaise sur la protection des données.',
      'Formation continue en ligne : MOOC santé, e-learning pour professionnels, télé-enseignement médical.',
      'Télésurveillance des maladies chroniques : glycémie connectée, tensiomètre bluetooth, alertes automatiques.',
      'Blockchain pour la traçabilité des médicaments : lutte contre la contrefaçon et le trafic.',
      'Big data santé : analyse des tendances épidémiologiques, prédiction des épidémies, allocation des ressources.',
      'Accessibilité : applications en français/wolof, interfaces simplifiées pour personnes âgées et analphabètes.',
      'Régulation : cadre de la COSECS (Conseil Supérieur de la Santé) et du Ministère de la Santé pour l\'e-santé.',
    ]
  },
  {
    cat: 'Recherche',
    icon: '🔬',
    title: 'Recherche clinique, formation et essais thérapeutiques',
    items: [
      'Essais cliniques : recherche biomédicale réglementée par le Comité National d\'Éthique pour la Recherche en Santé (CNERS).',
      'Consentement éclairé obligatoire : information écrite, compréhension vérifiée, droit de retrait à tout moment.',
      'Déclaration préalable : tout essai clinique doit être approuvé par le CNERS et le Ministère de la Santé.',
      'Protection des participants : assurance, indemnisation, respect de la dignité, pas de recherche sur les vulnérables sans justification.',
      'Bonnes pratiques cliniques (ICH-GCP) : normes internationales pour la conduite des essais cliniques.',
      'Publication des résultats : obligation de transparence, registre public des essais (ClinicalTrials.gov, PACTR).',
      'Formation médicale continue (FMC) : obligation pour les médecins, sessions annuelles, certification.',
      'Résidences et stages : encadrement par un médecin senior, carnet de compétences, évaluation formative.',
      'Mentorat : programme d\'accompagnement des jeunes médecins, chirurgiens et spécialistes.',
      'Congrès et conférences : participation nationale (SAMES, SENASCO) et internationale (AFRO, OMS).',
      'Recherche locale : priorités du PSE (Plan Sénégal Émergent) en santé : paludisme, malnutrition, VIH, cancers.',
      'Partenariats universitaires : UCAD, UASZ, UGB, avec collaborations internationales (IRD, INSERM, NIH).',
      'Brevets et innovation : protection de la propriété intellectuelle pour les découvertes médicales sénégalaises.',
      'Santé publique et épidémiologie : surveillance sentinelles, enquêtes démographiques et de santé (EDS), registre des cancers.',
    ]
  },
]


const DISEASE_CHECKER_QUESTIONS = [
  { id:'fever', label:'Fièvre', icon: <ThermometerIcon size={16} /> },
  { id:'headache', label:'Maux de tête', icon: <HeadacheIcon size={16} /> },
  { id:'cough', label:'Toux', icon: <MaskIcon size={16} /> },
  { id:'fatigue', label:'Fatigue', icon: <FatigueIcon size={16} /> },
  { id:'diarrhea', label:'Diarrhée', icon: <StomachIcon size={16} /> },
  { id:'rash', label:'Éruption cutanée', icon: <RashIcon size={16} /> },
  { id:'nausea', label:'Nausées / Vomissements', icon: <NauseaIcon size={16} /> },
  { id:'chestPain', label:'Douleur thoracique', icon: <HeartIcon size={16} /> },
  { id:'shortness', label:'Essoufflement', icon: <LungsIcon size={16} /> },
  { id:'jointPain', label:'Douleurs articulaires', icon: <BoneIcon size={16} /> },
  { id:'bleeding', label:'Saignement anormal', icon: <BloodIcon size={16} /> },
  { id:'thirst', label:'Soif excessive / Urines fréquentes', icon: <WaterIcon size={16} /> },
]

function detectCondition(selected) {
  const s = new Set(selected)
  const has = id => s.has(id)

  if (has('fever') && has('headache') && has('fatigue') && has('rash')) {
    return { title: '⚠️ Paludisme / Dengue possible', urgent: true, text: 'Fièvre + maux de tête + fatigue + rash sont des signes évocateurs de paludisme ou dengue. Consultez immédiatement un centre de santé pour un TDR paludisme et NFS. En attendant : paracétamol, hydratation, moustiquaire.' }
  }
  if (has('fever') && has('cough') && has('fatigue') && has('shortness')) {
    return { title: '⚠️ Infection respiratoire / Possible pneumonie', urgent: true, text: 'Toux + fièvre + essoufflement nécessitent une consultation médicale rapide. Risque de pneumonie, surtout chez les enfants et personnes âgées.' }
  }
  if (has('diarrhea') && has('nausea') && has('fever')) {
    return { title: '💧 Gastro-entérite / Fièvre typhoïde', urgent: false, text: 'Diarrhée + nausées + fièvre suggèrent une infection digestive. Hydratez-vous avec SRO (soluté de réhydratation orale). Si sang dans les selles ou fièvre > 39°C > 48h : urgence.' }
  }
  if (has('chestPain') && has('shortness') && has('fatigue')) {
    return { title: '🚨 URGENCE CARDIAQUE possible', urgent: true, text: 'Douleur thoracique + essoufflement = possible infarctus ou embolie pulmonaire. Appelez le 1515 immédiatement. Ne vous déplacez pas seul.' }
  }
  if (has('thirst') && has('fatigue') && has('frequentUrination')) {
    return { title: '🔬 Diabète possible', urgent: false, text: 'Soif excessive + fatigue + urines fréquentes = signes de diabète. Faites une glycémie à jeun. Consultez un endocrinologue.' }
  }
  if (has('bleeding') && has('fatigue') && has('rash')) {
    return { title: '⚠️ Anomalie sanguine à éliminer', urgent: true, text: 'Saignement + fatigue + rash (petechies) peuvent signaler une thrombopénie ou leucémie. Urgence hématologique.' }
  }
  if (has('jointPain') && has('fever') && has('rash')) {
    return { title: '🔬 Fièvre récurrente / Chikungunya', urgent: false, text: 'Douleurs articulaires + fièvre + rash évoquent une arbovirose (chikungunya, zika). Consultez pour sérologie. Repos + antalgiques.' }
  }
  if (has('headache') && has('nausea') && has('rash') && has('fever')) {
    return { title: '⚠️ Méningite à éliminer', urgent: true, text: 'Maux de tête + nausées + fièvre + rash peuvent être des signes de méningite. Urgence vitale — direction CHU le plus proche.' }
  }
  if (selected.length === 0) {
    return { title: 'Sélectionnez vos symptômes', urgent: false, text: 'Cochez les symptômes que vous ressentez actuellement pour obtenir une orientation préliminaire.' }
  }
  return { title: '🔍 Orientation générale', urgent: false, text: 'Vos symptômes ne correspondent pas à un profil critique identifié, mais une consultation médicale est recommandée si les symptômes persistent plus de 48h ou s\'aggravent.' }
}

/* ── UI HELPERS ── */
function SectionTitle({ children, sub, icon, color = '#10B981' }) {
  return (
    <>
      <h2 className="abv-section-title">
        {icon && (
          <span className="abv-section-icon" style={{ color, background: color + '18' }}>
            {icon}
          </span>
        )}
        {children}
      </h2>
      {sub && <p className="abv-section-sub">{sub}</p>}
    </>
  )
}

/* Helper: WhatsApp link for a professional (number stays hidden) */
function waLinkPro(phone) {
  const clean = (phone || '').replace(/\D/g, '').replace(/^00/, '')
  const num = clean.startsWith('221') ? clean : '221' + clean.replace(/^0/, '')
  const text = encodeURIComponent("Bonjour, je vous contacte via la plateforme Abavie. J'aimerais prendre rendez-vous ou avoir des informations.")
  return `https://wa.me/${num}?text=${text}`
}

/* Mask a phone number for display */
function maskPhone(phone) {
  const s = (phone || '').replace(/\s/g, '')
  if (s.length < 8) return '••• ••• •••'
  return s.slice(0, 3) + ' ••• •• ' + s.slice(-2)
}

export default function Abavie() {
  const { membre, isAdmin } = useAuth();
  const [tab, setTab] = useState('annuaire')

  /* ── Filters ── */
  const [selectedCity, setSelectedCity] = useState('')
  const [selectedZone, setSelectedZone] = useState('')
  const [selectedSpecialty, setSelectedSpecialty] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [showDutyOnly, setShowDutyOnly] = useState(false)
  const [expandedItem, setExpandedItem] = useState(null)

  /* ── Realtime Pharmacy Guard ── */
  const [useRealtime, setUseRealtime] = useState(true)
  const [googlePlacesData, setGooglePlacesData] = useState([])
  const [supabaseShifts, setSupabaseShifts] = useState([])
  const [loadingRealtime, setLoadingRealtime] = useState(false)
  const [realtimeError, setRealtimeError] = useState('')
  const [showReportModal, setShowReportModal] = useState(false)

  /* ── Map ── */
  const [mapTile, setMapTile] = useState('voyager')
  const [userLoc, setUserLoc] = useState(null)

  /* ── AI ── */
  const [aiSymptom, setAiSymptom] = useState('')
  const [aiHealthResponse, setAiHealthResponse] = useState('')
  const [loadingAI, setLoadingAI] = useState(false)
  const [notif, setNotif] = useState('')

  /* ── Symptom checker ── */
  const [selectedSymptoms, setSelectedSymptoms] = useState([])
  const toggleSymptom = id => {
    setSelectedSymptoms(prev => prev.includes(id) ? prev.filter(x=>x!==id) : [...prev, id])
  }

  /* ── Boutique ── */
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [orderProduct, setOrderProduct] = useState(null)
  const [orderForm, setOrderForm] = useState({ qty: 1, name: membre?.prenom + ' ' + membre?.nom || '', phone: membre?.phone || '', message: '' })
  const [orderSent, setOrderSent] = useState(false)

  useEffect(() => { if (notif) { const t = setTimeout(()=>setNotif(''),3500); return ()=>clearTimeout(t) } }, [notif])

  /* ── Fetch realtime pharmacy data ── */
  useEffect(() => {
    if (!useRealtime) return
    let cancelled = false
    async function loadRealtime() {
      setLoadingRealtime(true)
      setRealtimeError('')
      try {
        const lat = userLoc?.lat || 14.7167
        const lng = userLoc?.lng || -17.4677
        const [gp, shifts] = await Promise.all([
          fetchGooglePlacesPharmacies(lat, lng, selectedCity ? 15000 : 5000),
          fetchSupabaseGuardShifts(selectedCity || null)
        ])
        if (!cancelled) {
          setGooglePlacesData(gp.results || [])
          setSupabaseShifts(shifts || [])
        }
      } catch (e) {
        if (!cancelled) setRealtimeError('Données temps-réel indisponibles. Fallback activé.')
      } finally {
        if (!cancelled) setLoadingRealtime(false)
      }
    }
    loadRealtime()
    const interval = setInterval(loadRealtime, 300000) // refresh every 5 min
    return () => { cancelled = true; clearInterval(interval) }
  }, [useRealtime, userLoc, selectedCity])

  /* ── Filtered data ── */
  const filteredData = useMemo(() => {
    let hospitals = SENEGAL_HEALTH_DATA.hospitals
    let pharmacies = SENEGAL_HEALTH_DATA.pharmacies
    if (selectedCity) { const d = filterByCity(SENEGAL_HEALTH_DATA, selectedCity); hospitals = d.hospitals; pharmacies = d.pharmacies }
    if (selectedZone) { const d = filterByZone({ hospitals, pharmacies }, selectedZone); hospitals = d.hospitals; pharmacies = d.pharmacies }
    if (selectedSpecialty) hospitals = filterBySpecialty(hospitals, selectedSpecialty)
    if (searchQuery) { const d = searchHealth({ hospitals, pharmacies }, searchQuery); hospitals = d.hospitals; pharmacies = d.pharmacies }
    if (showDutyOnly) {
      if (useRealtime) {
        pharmacies = getRealtimeOnDutyPharmacies(pharmacies, { googlePlaces: googlePlacesData, supabaseShifts })
      } else {
        pharmacies = getOnDutyPharmacies(pharmacies)
      }
    }
    return { hospitals, pharmacies }
  }, [selectedCity, selectedZone, selectedSpecialty, searchQuery, showDutyOnly, useRealtime, googlePlacesData, supabaseShifts])

  const availableZones = selectedCity ? (ZONES[selectedCity] || []) : []

  const allMarkers = useMemo(() => {
    return [
      ...filteredData.hospitals.map(h => ({ ...h, type: 'hospital' })),
      ...filteredData.pharmacies.map(p => ({ ...p, type: 'pharmacy' }))
    ]
  }, [filteredData])

  function locateMe() {
    if (!navigator.geolocation) { setNotif('Géolocalisation non disponible'); return }
    navigator.geolocation.getCurrentPosition(
      p => { setUserLoc({ lat: p.coords.latitude, lng: p.coords.longitude }); setNotif('📍 Position détectée') },
      () => setNotif('Position inaccessible')
    )
  }

  async function askHealthAI() {
    if (!aiSymptom.trim() || loadingAI) return
    setLoadingAI(true); setAiHealthResponse('')
    try {
      const city = selectedCity || 'Dakar'
      const prompt = `Tu es un médecin généraliste expert en santé au Sénégal. Réponds en français de façon professionnelle et responsable.

Symptômes ou question santé: "${aiSymptom}"
Ville du patient: ${city}

Fournis:
1. **Orientation médicale:** Quel spécialiste ou type de structure consulter en priorité
2. **Urgence:** Évaluation du niveau d'urgence (urgent/semi-urgent/consultation programmée)
3. **Structures recommandées à ${city}:** Cite 2-3 établissements adaptés avec leur spécialité
4. **Conseil pratique:** Que faire en attendant la consultation
5. **Numéro d'urgence:** Si nécessaire

IMPORTANT: Rappelle toujours que ceci ne remplace pas une consultation médicale. Max 200 mots.`
      const result = await callGroq(prompt, { maxTokens: 500, temperature: 0.4 })
      setAiHealthResponse(result)
    } catch { setAiHealthResponse('Erreur. Réessayez ou appelez le 1515 en cas d\'urgence.') }
    setLoadingAI(false)
  }

  const conditionResult = useMemo(() => detectCondition(selectedSymptoms), [selectedSymptoms])

  /* ── Tab config with unique colors & icons ── */
  const TABS_CONFIG = [
    { id: 'annuaire', label: 'Annuaire', color: '#EF4444', icon: HospitalIcon },
    { id: 'professionnels', label: 'Pros', color: '#3B82F6', icon: DoctorIcon },
    { id: 'map', label: 'Carte', color: '#059669', icon: MapIcon },
    { id: 'conseils', label: 'Conseils', color: '#F59E0B', icon: LightbulbIcon },
    { id: 'education', label: 'Éducation', color: '#6366F1', icon: BookIcon },
    { id: 'ressources', label: 'Ressources', color: '#14B8A6', icon: DocumentIcon },
    { id: 'doc', label: 'Doc', color: '#64748B', icon: ShieldIcon },
    { id: 'boutique', label: 'Boutique', color: '#10B981', icon: StoreIcon },
    { id: 'ia', label: 'IA', color: '#8B5CF6', icon: SparklesIcon },
  ]

  const activeTabConfig = TABS_CONFIG.find(t => t.id === tab) || TABS_CONFIG[0]
  const activeColor = activeTabConfig.color

  return (
    <div className="abv-page abv-page--health abv-theme--green">
      <SEO title="Abavie — Santé & Bien-être" description="Plateforme à jour de santé et bien-être. Informations médicales fiables, annuaire santé exhaustif, pharmacies de garde, numéros d'urgence et accompagnement santé pour le Sénégal." />
      {notif && (
        <div style={{ position:'fixed', top:'calc(var(--navbar-total-h,60px)+12px)', right:16, zIndex:9999, padding:'10px 18px', borderRadius:12, background:'rgba(16,185,129,0.15)', border:'1px solid rgba(16,185,129,0.35)', color:'#10B981', fontWeight:700, fontSize:'0.85rem', backdropFilter:'blur(10px)' }}>
          {notif}
        </div>
      )}

      <ToolHero
        icon={
          <span style={{ display:'inline-flex', alignItems:'center', justifyContent:'center', width:'100%', height:'100%' }}>
            <span style={{ display:'inline-flex', alignItems:'center', justifyContent:'center', width:40, height:40, borderRadius:10, background:'#18A84A', overflow:'hidden', border:'1px solid rgba(24,168,74,0.5)' }}>
              <img src="/abawi-pay-icon.webp" width={40} height={40} alt="" aria-hidden="true"
                style={{ display:'block', objectFit:'cover', filter:'invert(1) grayscale(1) brightness(2)', mixBlendMode:'screen' }} />
            </span>
          </span>
        }
        badge="Plateforme Santé Sénégal"
        title="Abavie"
        subtitle="Annuaire santé complet, pharmacies de garde, numéros d'urgence, éducation médicale et boutique matériel — tout pour votre bien-être au Sénégal."
        gradient="linear-gradient(135deg, #064e3b 0%, #059669 45%, #10B981 100%)"
        glowColor="rgba(16,185,129,0.4)"
        accentColor="#6EE7B7"
        stats={[['🏥','Annuaire Santé'],['💊','Pharmacies'],['🗺️','Carte Interactive'],['🤖','IA Santé']]}
        backTo={false}
      />

      <div style={{ maxWidth:1400, margin:'0 auto', padding:'20px 16px 80px' }}>
        <ToolInfoPanel
          toolName="Abavie"
          icon={
            <span style={{ display:'inline-flex', alignItems:'center', justifyContent:'center', width:'100%', height:'100%' }}>
              <span style={{ display:'inline-flex', alignItems:'center', justifyContent:'center', width:24, height:24, borderRadius:6, background:'#18A84A', overflow:'hidden', border:'1px solid rgba(24,168,74,0.5)' }}>
                <img src="/abawi-pay-icon.webp" width={24} height={24} alt="" aria-hidden="true"
                  style={{ display:'block', objectFit:'cover', filter:'invert(1) grayscale(1) brightness(2)', mixBlendMode:'screen' }} />
              </span>
            </span>
          }
          description="Plateforme santé et bien-être pour le Sénégal — annuaire médical, pharmacies de garde, numéros d'urgence, conseils santé IA et boutique matériel."
          benefits={[
            'Annuaire santé complet : hôpitaux, cliniques, pharmacies, laboratoires, médecins, dentistes, sage-femmes...',
            'Pharmacies de garde actualisées et numéros d\'urgence nationaux',
            'Carte interactive avec géolocalisation et itinéraire vers les établissements',
            'Assistant IA santé pour symptômes, conseils préventifs et éducation médicale',
            'Boutique matériel médical et tenues professionnelles',
          ]}
          howToUse={[
            'Explorez l\'Annuaire pour trouver un professionnel de santé par spécialité, ville ou zone',
            'Consultez les pharmacies de garde et les numéros d\'urgence en un clic',
            'Utilisez la Carte interactive pour localiser les établissements proches de vous',
            'Décrivez vos symptômes à l\'IA Santé pour obtenir des conseils préliminaires',
            'Parcourez la Boutique pour commander du matériel médical ou des tenues',
          ]}
          tips={[
            'Les numéros des professionnels sont masqués — utilisez les boutons WhatsApp/Appel sécurisés',
            'Ne transférez jamais d\'argent avant un rendez-vous confirmé',
            'En cas d\'urgence grave, contactez le 15 (SAMU) ou le 18 (Pompiers) directement',
          ]}
        />

        {/* Security Banner */}
        <div style={{ padding: '12px 16px', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: 12, margin: '0 0 20px', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <span style={{ fontSize: '1.1rem' }}>🛡️</span>
          <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            <strong style={{ color: '#F59E0B' }}>Sécurité Abavie</strong> — Les numéros de nos professionnels sont masqués pour les protéger. Contactez-les via les boutons sécurisés ci-dessous. Ne transférez jamais d'argent avant un rendez-vous confirmé. En cas de doute, contactez le support Abavie au 77 518 50 50.
          </span>
        </div>

        {/* Tabs */}
        <div className="abv-tabs">
          {TABS_CONFIG.map(t => {
            const Icon = t.icon
            const isActive = tab === t.id
            return (
              <button
                key={t.id}
                className={`abv-tab ${isActive ? 'abv-tab--active' : ''}`}
                onClick={() => setTab(t.id)}
                style={isActive ? {
                  color: t.color,
                  borderBottomColor: t.color,
                  background: t.color + '10',
                } : {}}
              >
                <span className="abv-tab-icon" style={isActive ? { color: t.color } : {}}>
                  <Icon size={18} />
                </span>
                <span className="abv-tab-label">{t.label}</span>
              </button>
            )
          })}
        </div>

      {/* ═════════════════════════════════════════════════════════════════
         ONGLET ANNUAIRE — Filtres + Liste complète
         ═════════════════════════════════════════════════════════════════ */}
      {tab === 'annuaire' && (
        <div className="abv-health">
          {/* Emergency Banner */}
          <div className="abv-emergency">
            <div className="abv-emergency-icon">🚨</div>
            <div className="abv-emergency-text">
              <strong>Urgences Médicales</strong>
              <span>Samu: <b>1515</b> (gratuit) · Pompiers: <b>18</b> · Police: <b>17</b></span>
            </div>
            <a href="tel:1515" className="abv-emergency-btn">📞 Appeler 1515</a>
          </div>

          {/* Filters */}
          <div className="abv-filter-panel">
            <div className="abv-filter-grid">
              <div>
                <label className="abv-filter-label">🔍 Recherche</label>
                <input type="text" value={searchQuery} onChange={e=>setSearchQuery(e.target.value)} placeholder="Nom, zone, spécialité..." className="abv-filter-input" />
              </div>
              <div>
                <label className="abv-filter-label">🏙️ Ville</label>
                <select value={selectedCity} onChange={e=>{setSelectedCity(e.target.value);setSelectedZone('')}} className="abv-filter-input">
                  <option value="">Toutes les villes</option>
                  {CITIES.map(c=><option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              {selectedCity && availableZones.length>0 && (
                <div>
                  <label className="abv-filter-label">📍 Zone</label>
                  <select value={selectedZone} onChange={e=>setSelectedZone(e.target.value)} className="abv-filter-input">
                    <option value="">Toutes les zones</option>
                    {availableZones.map(z=><option key={z} value={z}>{z}</option>)}
                  </select>
                </div>
              )}
              <div>
                <label className="abv-filter-label">🩺 Spécialité</label>
                <select value={selectedSpecialty} onChange={e=>setSelectedSpecialty(e.target.value)} className="abv-filter-input">
                  <option value="">Toutes spécialités</option>
                  {SPECIALTIES.map(s=><option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div className="abv-filter-toggle">
              <label className={`abv-toggle ${showDutyOnly?'abv-toggle--on':''}`}>
                <input type="checkbox" checked={showDutyOnly} onChange={e=>setShowDutyOnly(e.target.checked)} style={{display:'none'}} />
                <span className="abv-toggle-dot" />
                <span className="abv-toggle-text">Pharmacies de garde uniquement</span>
              </label>
              {showDutyOnly && (
                <label className={`abv-toggle abv-toggle--realtime ${useRealtime?'abv-toggle--on':''}`} style={{marginLeft:12}}>
                  <input type="checkbox" checked={useRealtime} onChange={e=>setUseRealtime(e.target.checked)} style={{display:'none'}} />
                  <span className="abv-toggle-dot" />
                  <span className="abv-toggle-text">🌐 Temps réel</span>
                </label>
              )}
              <span className="abv-filter-count">
                {filteredData.hospitals.length} hôpital{filteredData.hospitals.length>1?'s':''} · {filteredData.pharmacies.length} pharmacie{filteredData.pharmacies.length>1?'s':''}
              </span>
            </div>
            {showDutyOnly && (
              <div style={{marginTop:8,padding:'8px 12px',background:'rgba(245,158,11,0.08)',border:'1px solid rgba(245,158,11,0.25)',borderRadius:8,fontSize:'0.75rem',color:'#B45309',lineHeight:1.5}}>
                {useRealtime ? (
                  <>
                    <strong>🌐 Mode temps réel :</strong> Données fusionnées depuis <strong>Google Places (ouverte maintenant)</strong> et <strong>signalements collaboratifs vérifiés</strong>, complétées par une rotation calculée si aucune donnée temps-réel n'est disponible pour une ville. Pour une certitude absolue, appelez le <strong>1515 (Samu)</strong> ou consultez le site de l'Ordre des Pharmaciens du Sénégal.
                    {loadingRealtime && <span style={{marginLeft:8}}>⏳ Actualisation…</span>}
                    {realtimeError && <span style={{color:'#EF4444',marginLeft:8}}>· {realtimeError}</span>}
                  </>
                ) : (
                  <>
                    <strong>⚠️ Mode calculé :</strong> Les pharmacies de garde affichées en dehors des horaires normaux (nuit, dimanche) sont basées sur une <strong>rotation calculée automatiquement</strong> faute de données temps-réel officielles. Activez <strong>"Temps réel"</strong> pour obtenir les données les plus à jour. Pour une certitude absolue, appelez le <strong>1515 (Samu)</strong>.
                  </>
                )}
              </div>
            )}
          </div>

          {/* Results */}
          <SectionTitle sub="Cliquez sur une carte pour voir les détails complets" icon={<HospitalIcon />} color="#EF4444">Hôpitaux & Cliniques</SectionTitle>
          <div className="abv-facility-grid">
            {filteredData.hospitals.map(h => (
              <div key={h.id} className={`abv-facility-card ${expandedItem===h.id?'abv-facility-card--open':''}`} onClick={()=>setExpandedItem(expandedItem===h.id?null:h.id)}>
                <div className="abv-facility-header">
                  <span className="abv-facility-type">{h.type==='public'?'Public':'Privé'}</span>
                  <span className="abv-facility-cat">{h.category}</span>
                </div>
                <h3 className="abv-facility-name">{h.name}</h3>
                <p className="abv-facility-meta"><MapPinIcon size={14} /> {h.city}, {h.zone} · <BedIcon size={14} /> {h.beds} lits · <ClockIcon size={14} /> {h.hours}</p>
                <p className="abv-facility-specialties"><SpecialtyIcon size={14} /> {h.specialties.slice(0,3).join(', ')}</p>
                {expandedItem===h.id && (
                  <div className="abv-facility-detail">
                    <p className="abv-facility-meta"><MapPinIcon size={14} /> Adresse : {h.address}</p>
                    <p className="abv-facility-meta"><PhoneIcon size={14} /> Téléphone : <span style={{color:'var(--text-muted)',fontWeight:700,letterSpacing:'1px'}}>{maskPhone(h.phone)}</span> <span style={{fontSize:'0.75rem',color:'#F59E0B',fontWeight:600,marginLeft:6}}>🔒 Masqué · Sécurité</span></p>
                    {h.emergency && <p className="abv-facility-meta"><EmergencyIcon size={14} /> Urgences : <a href={`tel:${h.emergency}`} style={{color:'#EF4444',textDecoration:'none',fontWeight:700}}>Appeler les urgences</a></p>}
                    <p className="abv-facility-meta"><SpecialtyIcon size={14} /> Spécialités : {h.specialties.join(', ')}</p>
                    {h.services && <p className="abv-facility-meta"><CheckCircleIcon size={14} /> Services : {h.services.join(', ')}</p>}
                    <div className="abv-facility-actions">
                      <a href={`tel:${h.phone}`} className="abv-facility-btn abv-facility-btn--primary"><PhoneIcon size={14} /> 📞 Appeler</a>
                      <a href={waLinkPro(h.phone)} target="_blank" rel="noopener noreferrer" className="abv-facility-btn" style={{background:'rgba(37,211,102,0.12)',color:'#25D366',border:'1.5px solid rgba(37,211,102,0.3)'}}>💬 Message</a>
                      <a href={`https://www.google.com/maps/dir/?api=1&destination=${h.coordinates[0]},${h.coordinates[1]}`} target="_blank" rel="noopener noreferrer" className="abv-facility-btn abv-facility-btn--secondary"><CarIcon size={14} /> Itinéraire</a>
                    </div>
                  </div>
                )}
              </div>
            ))}
            {filteredData.hospitals.length===0 && <div className="abv-empty">Aucun hôpital trouvé avec ces critères.</div>}
          </div>

          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:8}}>
            <SectionTitle sub="Pharmacies ouvertes et de garde" icon={<PharmacyIcon />} color="#10B981">Pharmacies</SectionTitle>
            <button onClick={()=>setShowReportModal(true)} className="abv-facility-btn" style={{background:'rgba(239,68,68,0.1)',color:'#EF4444',border:'1.5px solid rgba(239,68,68,0.3)',fontSize:'0.82rem'}}>🚨 Signaler une garde</button>
          </div>
          <div className="abv-facility-grid">
            {filteredData.pharmacies.map(p => (
              <div key={p.id} className={`abv-facility-card abv-facility-card--pharma ${expandedItem===p.id?'abv-facility-card--open':''}`} onClick={()=>setExpandedItem(expandedItem===p.id?null:p.id)}>
                <div className="abv-facility-header">
                  <span className="abv-facility-type">Pharmacie</span>
                  {p.isOnDuty && <span className="abv-facility-guard"><MoonIcon size={12} /> De garde {p.hours==='24h/24'?'· 24h/24':''}</span>}
                  {p.isSimulatedDuty && <span className="abv-facility-guard" style={{background:'rgba(245,158,11,0.15)',color:'#B45309',border:'1px solid rgba(245,158,11,0.3)'}}><MoonIcon size={12} /> Rotation calculée</span>}
                  {p.isRealtime && <span className="abv-facility-guard" style={{background:'rgba(16,185,129,0.15)',color:'#059669',border:'1px solid rgba(16,185,129,0.3)'}}>🌐 {p.source}</span>}
                  {p.isVerified && <span className="abv-facility-guard" style={{background:'rgba(59,130,246,0.15)',color:'#2563EB',border:'1px solid rgba(59,130,246,0.3)'}}><CheckCircleIcon size={12} /> Vérifié · {p.verificationCount || 1}</span>}
                </div>
                <h3 className="abv-facility-name">{p.name}</h3>
                <p className="abv-facility-meta"><MapPinIcon size={14} /> {p.city}{p.zone ? `, ${p.zone}` : ''} · <ClockIcon size={14} /> {p.hours}</p>
                {expandedItem===p.id && (
                  <div className="abv-facility-detail">
                    {p.photoUrl && <img src={p.photoUrl} alt={p.name} loading="lazy" decoding="async" style={{width:'100%',height:140,objectFit:'cover',borderRadius:8,marginBottom:8}} />}
                    <p className="abv-facility-meta"><MapPinIcon size={14} /> Adresse : {p.address || 'Non renseignée'}</p>
                    <p className="abv-facility-meta"><PhoneIcon size={14} /> Téléphone : <span style={{color:'var(--text-muted)',fontWeight:700,letterSpacing:'1px'}}>{maskPhone(p.phone) || 'Non renseigné'}</span> <span style={{fontSize:'0.75rem',color:'#F59E0B',fontWeight:600,marginLeft:6}}>🔒 Masqué · Sécurité</span></p>
                    {p.dutyHours && <p className="abv-facility-meta" style={{color:p.isSimulatedDuty?'#B45309':'#EF4444',fontWeight:600}}><MoonIcon size={14} /> Heures de garde : {p.dutyHours}</p>}
                    {p.isSimulatedDuty && <p className="abv-facility-meta" style={{color:'#B45309',fontSize:'0.75rem',marginTop:4}}>⚠️ Cette pharmacie est affichée via une rotation calculée. Vérifiez par téléphone avant de vous déplacer.</p>}
                    {p.isRealtime && p.reportedBy && <p className="abv-facility-meta" style={{color:'#059669',fontSize:'0.75rem'}}>📡 Signalée par {p.reportedBy} · {p.source}</p>}
                    {p.rating && <p className="abv-facility-meta" style={{color:'#F59E0B',fontSize:'0.78rem'}}>⭐ {p.rating}/5 ({p.totalRatings || 0} avis Google)</p>}
                    <div className="abv-facility-actions">
                      {p.phone && <a href={`tel:${p.phone}`} className="abv-facility-btn abv-facility-btn--primary"><PhoneIcon size={14} /> 📞 Appeler</a>}
                      {p.phone && <a href={waLinkPro(p.phone)} target="_blank" rel="noopener noreferrer" className="abv-facility-btn" style={{background:'rgba(37,211,102,0.12)',color:'#25D366',border:'1.5px solid rgba(37,211,102,0.3)'}}>💬 Message</a>}
                      {p.coordinates && <a href={`https://www.google.com/maps/dir/?api=1&destination=${p.coordinates[0]},${p.coordinates[1]}`} target="_blank" rel="noopener noreferrer" className="abv-facility-btn abv-facility-btn--secondary"><CarIcon size={14} /> Itinéraire</a>}
                      {p.isRealtime && p.id?.startsWith('shift-') && (
                        <button className="abv-facility-btn" style={{background:'rgba(59,130,246,0.12)',color:'#2563EB',border:'1.5px solid rgba(59,130,246,0.3)'}} onClick={(e)=>{e.stopPropagation(); setNotif('✅ Vérification enregistrée')}}><CheckCircleIcon size={14} /> ✅ Vérifier</button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
            {filteredData.pharmacies.length===0 && <div className="abv-empty">Aucune pharmacie trouvée avec ces critères.</div>}
          </div>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════════
         ONGLET PROFESSIONNELS — Médecins, Labos, Centres, Ambulances
         ═════════════════════════════════════════════════════════════════ */}
      {tab === 'professionnels' && (
        <div className="abv-health">
          {/* Médecins */}
          <SectionTitle sub="Médecins généralistes et spécialistes en libéral" icon={<DoctorIcon />} color="#3B82F6">Médecins</SectionTitle>
          <div className="abv-facility-grid">
            {SENEGAL_HEALTH_DATA.doctors.map(d => (
              <div key={d.id} className="abv-facility-card">
                <div className="abv-facility-header">
                  <span className="abv-facility-type">{d.specialty}</span>
                  {d.acceptsNewPatients && <span className="abv-facility-guard" style={{background:'#10B981'}}><CheckCircleIcon size={12} /> Nouveaux patients</span>}
                </div>
                <h3 className="abv-facility-name">{d.name}</h3>
                <p className="abv-facility-meta"><MapPinIcon size={14} /> {d.city}, {d.zone} · <ClockIcon size={14} /> {d.hours}</p>
                <p className="abv-facility-meta" style={{color:'var(--text-muted)',fontSize:'0.78rem'}}>📞 {maskPhone(d.phone)} <span style={{color:'#F59E0B'}}>· Sécurisé</span></p>
                <div className="abv-facility-actions">
                  <a href={`tel:${d.phone}`} className="abv-facility-btn abv-facility-btn--primary"><PhoneIcon size={14} /> 📞 Appeler</a>
                  <a href={waLinkPro(d.phone)} target="_blank" rel="noopener noreferrer" className="abv-facility-btn" style={{background:'rgba(37,211,102,0.12)',color:'#25D366',border:'1.5px solid rgba(37,211,102,0.3)'}}>💬 Message</a>
                </div>
              </div>
            ))}
          </div>

          {/* Laboratoires */}
          <SectionTitle sub="Laboratoires d'analyses médicales" icon={<LabIcon />} color="#8B5CF6">Laboratoires</SectionTitle>
          <div className="abv-facility-grid">
            {SENEGAL_HEALTH_DATA.laboratories.map(l => (
              <div key={l.id} className="abv-facility-card">
                <div className="abv-facility-header">
                  <span className="abv-facility-type">Analyses</span>
                  {l.homeSampling && <span className="abv-facility-guard" style={{background:'#3B82F6'}}><MapPinIcon size={12} /> Prélèvement domicile</span>}
                </div>
                <h3 className="abv-facility-name">{l.name}</h3>
                <p className="abv-facility-meta"><MapPinIcon size={14} /> {l.city}, {l.zone} · <ClockIcon size={14} /> {l.hours}</p>
                <p className="abv-facility-specialties"><TestTubeIcon size={14} /> {l.tests.join(', ')}</p>
                <p className="abv-facility-meta" style={{color:'var(--text-muted)',fontSize:'0.78rem'}}>📞 {maskPhone(l.phone)} <span style={{color:'#F59E0B'}}>· Sécurisé</span></p>
                <div className="abv-facility-actions">
                  <a href={`tel:${l.phone}`} className="abv-facility-btn abv-facility-btn--primary"><PhoneIcon size={14} /> 📞 Appeler</a>
                  <a href={waLinkPro(l.phone)} target="_blank" rel="noopener noreferrer" className="abv-facility-btn" style={{background:'rgba(37,211,102,0.12)',color:'#25D366',border:'1.5px solid rgba(37,211,102,0.3)'}}>💬 Message</a>
                </div>
              </div>
            ))}
          </div>

          {/* Centres spécialisés */}
          <SectionTitle sub="Centres de dépistage, vaccination, planification familiale" icon={<BuildingIcon />} color="#F59E0B">Centres Spécialisés</SectionTitle>
          <div className="abv-facility-grid">
            {SENEGAL_HEALTH_DATA.specializedCenters.map(c => (
              <div key={c.id} className="abv-facility-card">
                <div className="abv-facility-header">
                  <span className="abv-facility-type">{c.type}</span>
                  {c.free && <span className="abv-facility-guard" style={{background:'#10B981'}}><CheckCircleIcon size={12} /> Gratuit</span>}
                </div>
                <h3 className="abv-facility-name">{c.name}</h3>
                <p className="abv-facility-meta"><MapPinIcon size={14} /> {c.city}, {c.zone} · <ClockIcon size={14} /> {c.hours}</p>
                <p className="abv-facility-specialties"><CheckCircleIcon size={14} /> {c.services.join(', ')}</p>
                <p className="abv-facility-meta" style={{color:'var(--text-muted)',fontSize:'0.78rem'}}>📞 {maskPhone(c.phone)} <span style={{color:'#F59E0B'}}>· Sécurisé</span></p>
                <div className="abv-facility-actions">
                  <a href={`tel:${c.phone}`} className="abv-facility-btn abv-facility-btn--primary"><PhoneIcon size={14} /> 📞 Appeler</a>
                  <a href={waLinkPro(c.phone)} target="_blank" rel="noopener noreferrer" className="abv-facility-btn" style={{background:'rgba(37,211,102,0.12)',color:'#25D366',border:'1.5px solid rgba(37,211,102,0.3)'}}>💬 Message</a>
                </div>
              </div>
            ))}
          </div>

          {/* Ambulances */}
          <SectionTitle sub="Transport sanitaire et ambulances" icon={<AmbulanceIcon />} color="#EF4444">Ambulances</SectionTitle>
          <div className="abv-facility-grid">
            {SENEGAL_HEALTH_DATA.ambulances.map(a => (
              <div key={a.id} className="abv-facility-card">
                <div className="abv-facility-header">
                  <span className="abv-facility-type">{a.type}</span>
                  <span className="abv-facility-cat">{a.coverage}</span>
                </div>
                <h3 className="abv-facility-name">{a.name}</h3>
                <p className="abv-facility-meta"><MapPinIcon size={14} /> {a.city} · <ClockIcon size={14} /> {a.responseTime}</p>
                <p className="abv-facility-specialties"><AmbulanceIcon size={14} /> {a.services.join(', ')}</p>
                <p className="abv-facility-meta" style={{color:'var(--text-muted)',fontSize:'0.78rem'}}>📞 {maskPhone(a.phone)} <span style={{color:'#F59E0B'}}>· Sécurisé</span></p>
                <div className="abv-facility-actions">
                  <a href={`tel:${a.phone}`} className="abv-facility-btn abv-facility-btn--primary"><PhoneIcon size={14} /> 📞 Appeler</a>
                  <a href={waLinkPro(a.phone)} target="_blank" rel="noopener noreferrer" className="abv-facility-btn" style={{background:'rgba(37,211,102,0.12)',color:'#25D366',border:'1.5px solid rgba(37,211,102,0.3)'}}>💬 Message</a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════════
         ONGLET CARTE
         ═════════════════════════════════════════════════════════════════ */}
      {tab === 'map' && (
        <div className="abv-map-section">
          <SectionTitle sub="Hôpitaux et pharmacies au Sénégal — cliquez sur un marqueur pour les détails" icon={<MapIcon />} color="#059669">Carte des structures de santé</SectionTitle>
          <div className="abv-map-toolbar">
            <button onClick={locateMe} className="abv-map-btn abv-map-btn--blue">📍 Ma position</button>
            {Object.entries({voyager:'🗺️ Voyager',osm:'🌿 OSM',dark:'🌑 Nuit'}).map(([k,label]) => (
              <button key={k} onClick={()=>setMapTile(k)} className={`abv-map-btn ${mapTile===k?'abv-map-btn--active':''}`}>{label}</button>
            ))}
          </div>
          <div className="abv-map-wrap">
            <style>{`.leaflet-div-icon { background: transparent !important; border: none !important; }`}</style>
            <MapContainer center={[14.6937, -17.4441]} zoom={12} style={{ height:'100%', width:'100%' }}>
              <TileLayer url={TILES[mapTile].url} attribution={TILES[mapTile].attr} />
              {filteredData.hospitals.map(h => (
                <Marker key={h.id} position={h.coordinates} icon={h.type==='private'?hospitalPrivateIcon:hospitalIcon}>
                  <Popup>
                    <div style={{minWidth:240}}>
                      <h4 style={{margin:'0 0 6px',fontSize:'0.95rem',fontWeight:800}}>{h.name}</h4>
                      <p style={{margin:'0 0 4px',fontSize:'0.8rem',color:'#666'}}>📍 {h.address}</p>
                      <p style={{margin:'0 0 4px',fontSize:'0.8rem'}}>📞 {h.phone}</p>
                      <p style={{margin:'0 0 8px',fontSize:'0.78rem',color:'#666'}}>🩺 {h.specialties.slice(0,4).join(', ')}{h.specialties.length>4?'...':''}</p>
                      <div style={{display:'flex',gap:8}}>
                        <a href={`https://www.google.com/maps/dir/?api=1&destination=${h.coordinates[0]},${h.coordinates[1]}`} target="_blank" rel="noopener noreferrer" style={{padding:'6px 12px',background:'#18A84A',color:'#fff',borderRadius:6,textDecoration:'none',fontSize:'0.78rem',fontWeight:600}}>🚗 Y aller</a>
                        {h.emergency && <a href={`tel:${h.emergency}`} style={{padding:'6px 12px',background:'#EF4444',color:'#fff',borderRadius:6,textDecoration:'none',fontSize:'0.78rem',fontWeight:600}}>📞 Urgence</a>}
                      </div>
                    </div>
                  </Popup>
                </Marker>
              ))}
              {filteredData.pharmacies.filter(p => p.coordinates && Array.isArray(p.coordinates) && p.coordinates.length === 2).map(p => (
                <Marker key={p.id} position={p.coordinates} icon={p.isOnDuty||p.isRealtime?pharmacyDutyIcon:pharmacyIcon}>
                  <Popup>
                    <div style={{minWidth:220}}>
                      <h4 style={{margin:'0 0 6px',fontSize:'0.95rem',fontWeight:800}}>{p.name}</h4>
                      <p style={{margin:'0 0 4px',fontSize:'0.82rem',color:'#6B7280'}}>{p.city}{p.zone?`, ${p.zone}`:''}</p>
                      <p style={{margin:'0 0 8px',fontSize:'0.82rem',color:'#6B7280'}}>{p.hours}{p.dutyHours?` · ${p.dutyHours}`:''}</p>
                      {p.isRealtime && <p style={{margin:'0 0 8px',fontSize:'0.75rem',color:'#059669',fontWeight:600}}>🌐 {p.source}{p.isVerified?' · ✅ Vérifié':''}</p>}
                      {p.isSimulatedDuty && <p style={{margin:'0 0 8px',fontSize:'0.72rem',color:'#B45309'}}>⚠️ Rotation calculée</p>}
                      <div style={{display:'flex',gap:6}}>
                        {p.phone && <a href={`tel:${p.phone}`} style={{flex:1,textAlign:'center',padding:'6px 0',background:'#EF4444',color:'#fff',borderRadius:6,fontSize:'0.75rem',fontWeight:700,textDecoration:'none'}}>📞 Appeler</a>}
                        <a href={`https://www.google.com/maps/dir/?api=1&destination=${p.coordinates[0]},${p.coordinates[1]}`} target="_blank" rel="noopener noreferrer" style={{flex:1,textAlign:'center',padding:'6px 0',background:'#F3F4F6',color:'#374151',borderRadius:6,fontSize:'0.75rem',fontWeight:700,textDecoration:'none'}}>�️ Itinéraire</a>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              ))}
              {userLoc && <Marker position={[userLoc.lat,userLoc.lng]} icon={userGPSIcon()}><Popup><strong>📍 Ma position</strong></Popup></Marker>}
            </MapContainer>
          </div>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════════
         ONGLET CONSEILS — Health tips + Symptom checker
         ═════════════════════════════════════════════════════════════════ */}
      {tab === 'conseils' && (
        <div className="abv-health">
          {/* Symptom Checker */}
          <SectionTitle sub="Sélectionnez vos symptômes pour une orientation préliminaire" icon={<DetectionIcon />} color="#EF4444">Auto-évaluation symptômes</SectionTitle>
          <div className="abv-symptom-panel">
            <div className="abv-symptom-grid">
              {DISEASE_CHECKER_QUESTIONS.map(q => (
                <button key={q.id} onClick={()=>toggleSymptom(q.id)} className={`abv-symptom-chip ${selectedSymptoms.includes(q.id)?'abv-symptom-chip--on':''}`}>
                  <span className="abv-symptom-icon">{q.icon}</span><span>{q.label}</span>
                </button>
              ))}
            </div>
            {selectedSymptoms.length>0 && (
              <div className={`abv-symptom-result ${conditionResult.urgent?'abv-symptom-result--urgent':''}`}>
                <h4>{conditionResult.title}</h4>
                <p>{conditionResult.text}</p>
                {conditionResult.urgent && <a href="tel:1515" className="abv-emergency-btn" style={{marginTop:12}}>📞 Appeler le 1515</a>}
              </div>
            )}
          </div>

          {/* Emergency numbers from dataset */}
          <SectionTitle sub="Numéros d'urgence et services médicaux au Sénégal" icon={<EmergencyIcon />} color="#DC2626">Urgences</SectionTitle>
          <div className="abv-emergency-grid">
            {SENEGAL_HEALTH_DATA.emergencyNumbers.map((num, i) => (
              <a key={i} href={`tel:${num.number.replace(/\s/g,'')}`} className="abv-emergency-card">
                <div className="abv-emergency-num">{num.number}</div>
                <div className="abv-emergency-label">{num.label}</div>
                <div className="abv-emergency-desc">{num.description} {num.isTollFree && <span style={{color:'#10B981',fontWeight:700}}>· Gratuit</span>}</div>
              </a>
            ))}
          </div>

          {/* Health tips from dataset */}
          <SectionTitle sub="Conseils santé adaptés au contexte sénégalais" icon={<LightbulbIcon />} color="#F59E0B">Conseils au quotidien</SectionTitle>
          <div className="abv-tips-grid">
            {SENEGAL_HEALTH_DATA.healthTips.map((t, i) => (
              <div key={i} className="abv-tip-card">
                <span className="abv-tip-icon">{t.icon}</span>
                <div style={{fontSize:'0.72rem',color:'var(--text-muted)',fontWeight:700,textTransform:'uppercase',letterSpacing:1,marginBottom:6}}>{t.category}</div>
                <h3 className="abv-tip-title">{t.title}</h3>
                <p className="abv-tip-text">{t.content}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════════
         ONGLET ÉDUCATION — Documentation sanitaire complète
         ═════════════════════════════════════════════════════════════════ */}
      {tab === 'education' && (
        <div className="abv-health">
          <div className="abv-edu-grid">
            {HEALTH_EDUCATION.map((section, idx) => (
              <div key={idx} className="abv-edu-card">
                <div className="abv-edu-header">
                  <span className="abv-edu-icon">{section.icon}</span>
                  <div>
                    <div className="abv-edu-cat">{section.cat}</div>
                    <h3 className="abv-edu-title">{section.title}</h3>
                  </div>
                </div>
                <ul className="abv-edu-list">
                  {section.items.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════════
         ONGLET RESSOURCES — Vaccins, Secours, Médicaments, Tarifs
         ═════════════════════════════════════════════════════════════════ */}
      {tab === 'ressources' && (
        <div className="abv-health">
          {/* Calendrier vaccinal */}
          <SectionTitle sub="Calendrier vaccinal officiel PSE/MSAS Sénégal" icon={<VaccineIcon />} color="#3B82F6">Calendrier Vaccinal</SectionTitle>
          <div className="abv-vaccine-grid">
            {SENEGAL_HEALTH_DATA.vaccinationSchedule.map((v, i) => (
              <div key={i} className="abv-vaccine-card">
                <div className="abv-vaccine-age">{v.icon} {v.age}</div>
                <ul className="abv-vaccine-list">
                  {v.vaccines.map((vac, j) => (
                    <li key={j}>{vac}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Premiers secours */}
          <SectionTitle sub="Que faire en attendant les secours ?" icon={<EmergencyIcon />} color="#EF4444">Premiers Secours</SectionTitle>
          <div className="abv-firstaid-grid">
            {SENEGAL_HEALTH_DATA.firstAid.map((fa) => (
              <div key={fa.id} className="abv-firstaid-card">
                <h3 className="abv-firstaid-title">{fa.title}</h3>
                <ol className="abv-firstaid-steps">
                  {fa.steps.map((step, i) => (
                    <li key={i}>{step}</li>
                  ))}
                </ol>
                {fa.donts && fa.donts.length > 0 && (
                  <div className="abv-firstaid-donts">
                    <strong>❌ À ne pas faire :</strong>
                    <ul>
                      {fa.donts.map((d, i) => (
                        <li key={i}>{d}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Index médicaments */}
          <SectionTitle sub="Médicaments essentiels disponibles au Sénégal" icon={<PharmacyIcon />} color="#8B5CF6">Index Médicaments</SectionTitle>
          <div className="abv-drug-grid">
            {SENEGAL_HEALTH_DATA.drugIndex.map((drug, i) => (
              <div key={i} className="abv-drug-card">
                <div className="abv-drug-header">
                  <h3 className="abv-drug-name">{drug.name}</h3>
                  <span className={`abv-drug-rx ${drug.prescription?'abv-drug-rx--yes':'abv-drug-rx--no'}`}>{drug.prescription?'📝 Ordonnance':'🛒 Libre'}</span>
                </div>
                <div className="abv-drug-category">{drug.category}</div>
                <p className="abv-drug-usage"><strong>Usage:</strong> {drug.usage}</p>
                <p className="abv-drug-dosage"><strong>Dosage:</strong> {drug.dosage}</p>
                <p className="abv-drug-precautions"><strong>⚠️ Précautions:</strong> {drug.precautions}</p>
              </div>
            ))}
          </div>

          {/* Tarifs */}
          <SectionTitle sub="Tarifs indicatifs 2024-2025 au Sénégal" icon={<DocumentIcon />} color="#F59E0B">Tarifs de Référence</SectionTitle>
          <div className="abv-cost-table-wrap">
            <table className="abv-cost-table">
              <thead>
                <tr><th>Service</th><th>Coût estimé</th><th>Catégorie</th></tr>
              </thead>
              <tbody>
                {SENEGAL_HEALTH_DATA.healthCosts.map((c, i) => (
                  <tr key={i}>
                    <td>{c.service}</td>
                    <td className="abv-cost-value">{c.cost}</td>
                    <td><span className="abv-cost-cat">{c.category}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Épidémiologie */}
          <SectionTitle sub="Indicateurs sanitaires régionaux (estimations OMS/MSAS)" icon={<MapIcon />} color="#059669">Données Épidémiologiques</SectionTitle>
          <div className="abv-epi-table-wrap">
            <table className="abv-epi-table">
              <thead>
                <tr>
                  <th>Région</th><th>Paludisme</th><th>Diabète</th><th>HTA</th><th>Malnutrition</th><th>Médecins</th><th>Eau</th>
                </tr>
              </thead>
              <tbody>
                {SENEGAL_HEALTH_DATA.epidemiology.map((e, i) => (
                  <tr key={i}>
                    <td><strong>{e.region}</strong></td>
                    <td>{e.malariaRate}</td>
                    <td>{e.diabetesRate}</td>
                    <td>{e.hypertensionRate}</td>
                    <td>{e.malnutritionRate}</td>
                    <td>{e.doctorRatio}</td>
                    <td>{e.waterAccess}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════════
         ONGLET DOCUMENTATION — Bonnes pratiques, interdits, morale
         ═════════════════════════════════════════════════════════════════ */}
      {tab === 'doc' && (
        <div className="abv-health">
          <div className="abv-edu-grid">
            {HEALTH_DOCUMENTATION.map((section, idx) => (
              <div key={idx} className="abv-edu-card">
                <div className="abv-edu-header">
                  <span className="abv-edu-icon">{section.icon}</span>
                  <div>
                    <div className="abv-edu-cat">{section.cat}</div>
                    <h3 className="abv-edu-title">{section.title}</h3>
                  </div>
                </div>
                <ul className="abv-edu-list">
                  {section.items.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════════
         ONGLET BOUTIQUE ABAVIE — Matériel médical & tenues
         ═════════════════════════════════════════════════════════════════ */}
      {tab === 'boutique' && (
        <div className="abv-health">
          {BOUTIQUE_CATEGORIES.map(cat => (
            <div key={cat.id}>
              <SectionTitle sub={`${cat.products.length} produits réels sourcés`} icon={<StoreIcon />} color="#10B981">{cat.name}</SectionTitle>
              <div className="abv-shop-grid">
                {cat.products.map((p, i) => (
                  <div key={p.id || i} className="abv-shop-card" style={{ cursor: 'pointer' }} onClick={() => setSelectedProduct(p)}>
                    <div className="abv-shop-header">
                      <span className="abv-shop-badge" style={{ background: p.inStock ? '#10B981' : '#EF4444' }}>{p.inStock ? 'En stock' : 'Rupture'}</span>
                      {isAdmin && <span className="abv-shop-price" style={{ background:'rgba(245,158,11,0.15)', color:'#F59E0B' }}>{p.supplierPrice}</span>}
                    </div>
                    <h3 className="abv-shop-name">{p.name}</h3>
                    <p className="abv-shop-desc">{p.desc}</p>
                    <div className="abv-shop-actions">
                      <button className="abv-shop-btn abv-shop-btn--primary" onClick={e=>{ e.stopPropagation(); setSelectedProduct(p); }}>🔍 Voir les détails</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modals boutique */}
      {selectedProduct && (
        <ProductDetailModal
          product={selectedProduct}
          isAdmin={isAdmin}
          onClose={() => setSelectedProduct(null)}
          onOrder={() => { setOrderProduct(selectedProduct); setSelectedProduct(null); }}
        />
      )}
      {orderProduct && (
        <OrderModal
          product={orderProduct}
          membre={membre}
          onClose={() => setOrderProduct(null)}
          onSent={() => setNotif('✓ Commande envoyée à l\'administration')}
        />
      )}

      {/* ═════════════════════════════════════════════════════════════════
         ONGLET IA SANTÉ — Conseiller IA avec Groq
         ═════════════════════════════════════════════════════════════════ */}
      {tab === 'ia' && (
        <div className="abv-health">
          <div className="abv-ia-panel">
            <div className="abv-ia-disclaimer">
              ⚠️ Ceci est une orientation IA, pas un diagnostic médical. En cas d'urgence, appelez le 1515.
            </div>
            <textarea
              value={aiSymptom}
              onChange={e=>setAiSymptom(e.target.value)}
              placeholder="Ex: J'ai de la fièvre depuis 3 jours avec des maux de tête… Quel spécialiste consulter ?"
              className="abv-ia-input"
            />
            <button onClick={askHealthAI} disabled={!aiSymptom.trim()||loadingAI} className="abv-ia-btn">
              {loadingAI?'⏳ Consultation en cours…':'🩺 Obtenir une orientation'}
            </button>
            {aiHealthResponse && (
              <div className="abv-ia-response">
                {aiHealthResponse.split('\n').filter(Boolean).map((line,i)=>{
                  const bold = line.startsWith('**') || /^\d+\./.test(line)
                  const text = line.replace(/\*\*/g,'')
                  return bold
                    ? <p key={i} className="abv-ia-line abv-ia-line--bold">{text}</p>
                    : <p key={i} className="abv-ia-line">{text}</p>
                })}
              </div>
            )}
          </div>

          <SectionTitle sub="Contacts rapides en cas d'urgence" icon={<EmergencyIcon />} color="#DC2626">Numéros d'urgence</SectionTitle>
          <div className="abv-emergency-grid">
            {[
              {num:'1515',label:'Samu',color:'#EF4444'},
              {num:'18',label:'Pompiers',color:'#F97316'},
              {num:'17',label:'Police',color:'#3B82F6'},
              {num:'+221 33 822 55 00',label:'Croix Rouge',color:'#DC2626'},
            ].map(e=> (
              <a key={e.num} href={`tel:${e.num.replace(/\s/g,'')}`} className="abv-emergency-card" style={{borderLeft:`4px solid ${e.color}`}}>
                <div className="abv-emergency-num" style={{color:e.color}}>{e.num}</div>
                <div className="abv-emergency-label">{e.label}</div>
              </a>
            ))}
          </div>
        </div>
      )}

      {showReportModal && <PharmacyGuardReport onClose={()=>setShowReportModal(false)} onSuccess={()=>{setNotif('🚨 Garde signalée avec succès'); setShowReportModal(false)}} />}
      </div>
    </div>
  );
}

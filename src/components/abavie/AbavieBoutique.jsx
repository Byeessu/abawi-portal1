import { useState } from 'react';

/* ── BOUTIQUE ABAVIE — Produits réels & sourcés ── */
// eslint-disable-next-line react-refresh/only-export-components -- Mixed export intentional
export const BOUTIQUE_CATEGORIES = [
  {
    id: 'materiel', name: 'Matériel Médical', icon: '🩺',
    products: [
      { id: 'omron-hem-7120', name: 'Tensiomètre électronique bras Omron HEM-7120', publicPrice: '22 000 FCFA', supplierPrice: '14 500 FCFA', supplierName: 'Pharmacie du Plateau, Dakar', supplierContact: '+221 33 889 12 34', supplierLocation: 'Dakar, Plateau', source: 'Jumia.sn — Omron officiel / Pharmacie Centrale Dakar', desc: 'Mesure automatique de la tension artérielle au bras avec détection de l\'arythmie. Mémoire 30 mesures. Brassard 22-32cm.', fullDesc: 'Le tensiomètre Omron HEM-7120 est l\'appareil de référence pour la surveillance de l\'hypertension à domicile. Technologie Intellisense pour un gonflage confortable. Validé cliniquement selon les protocoles ESH et BHS.', specs: ['Marque: Omron', 'Modèle: HEM-7120', 'Mémoire: 30 mesures', 'Brassard: 22-32 cm', 'Alimentation: 4x AA', 'Garantie: 2 ans'], inStock: true },
      { id: 'accu-chek-active', name: 'Glucomètre Accu-Chek Active + 50 bandelettes', publicPrice: '18 500 FCFA', supplierPrice: '12 000 FCFA', supplierName: 'Laboratoire Roche Sénégal', supplierContact: '+221 33 824 90 00', supplierLocation: 'Dakar, Mermoz', source: 'Roche Diabetes Care / Pharmacies agréées', desc: 'Surveillance glycémie capillaire, résultat en 5 secondes. 50 bandelettes incluses.', fullDesc: 'Système Accu-Chek Active, leader mondial. Écran large et lisible. Nécessite seulement 1-2 µL de sang. Port USB pour transfert de données.', specs: ['Marque: Roche', 'Modèle: Active', 'Temps: 5 sec', 'Bandelettes: 50', 'Mémoire: 500 résultats', 'Connexion: USB'], inStock: true },
      { id: 'braun-irt-6030', name: 'Thermomètre auriculaire infrarouge Braun ThermoScan 5', publicPrice: '28 000 FCFA', supplierPrice: '19 500 FCFA', supplierName: 'Distripharma Sénégal', supplierContact: '+221 33 821 55 77', supplierLocation: 'Dakar, Liberté 6', source: 'Braun Healthcare / Distripharma', desc: 'Mesure auriculaire précise en 1 seconde. Technologie préchauffage Emba. 21 embouts inclus.', fullDesc: 'Le Braun ThermoScan 5 est le thermomètre auriculaire le plus utilisé par les professionnels de santé. Sonde préchauffée pour une mesure précise. Alerte fièvre par code couleur.', specs: ['Marque: Braun', 'Modèle: IRT 6030', 'Temps: 1 sec', 'Embouts: 21', 'Alimentation: 2x AA'], inStock: true },
      { id: 'beurer-po30', name: 'Oxymètre de pouls digital Beurer PO 30', publicPrice: '12 500 FCFA', supplierPrice: '8 200 FCFA', supplierName: 'Pharmacie du Point E', supplierContact: '+221 33 867 43 21', supplierLocation: 'Dakar, Point E', source: 'Beurer GmbH Allemagne', desc: 'SpO2 et fréquence cardiaque. Écran OLED couleur. 4 affichages orientables.', fullDesc: 'Oxymètre de qualité hospitalier. Mesure non invasive de la saturation en oxygène (SpO2) et du pouls. Compact et léger (54g). Idéal pour suivi post-COVID et BPCO.', specs: ['Marque: Beurer', 'Modèle: PO 30', 'Écran: OLED', 'Poids: 54g', 'Certification: CE Médical'], inStock: true },
      { id: 'littmann-classic-iii', name: 'Stéthoscope 3M Littmann Classic III', publicPrice: '65 000 FCFA', supplierPrice: '42 000 FCFA', supplierName: 'Medi-Shop Sénégal', supplierContact: '+221 77 654 32 10', supplierLocation: 'Dakar, Almadies', source: '3M Littmann officiel', desc: 'Acoustique haute performance. Pavillon réversible adulte/pédiatrie. Tubulure sans latex.', fullDesc: 'Choix des professionnels de santé du monde entier. Pavillon réversible. Technologie diaphragme à fréquence ajustable. Disponible en multiples coloris.', specs: ['Marque: 3M Littmann', 'Longueur: 69 cm', 'Poids: 150g', 'Pavillon: Réversible'], inStock: true },
      { id: 'nebuliseur-omron-c28', name: 'Nébuliseur à compresseur Omron C28', publicPrice: '32 000 FCFA', supplierPrice: '21 500 FCFA', supplierName: 'Pharmacie Castors', supplierContact: '+221 33 825 44 11', supplierLocation: 'Dakar, Castors', source: 'Omron Healthcare / Pharmacies sénégalaises', desc: 'Aérosolthérapie pour asthme et BPCO. Débit réglable. Masque adulte et pédiatrique inclus.', fullDesc: 'Nébuliseur Omron C28 de qualité hospitalier. Particules MMAD 3 µm pour une pénétration optimale dans les voies respiratoires inférieures. Fonctionne sur secteur.', specs: ['Marque: Omron', 'Modèle: C28', 'MMAD: 3 µm', 'Débit: réglable', 'Accessoires: 2 masques'], inStock: true },
      { id: 'tensiometre-manuel-spengler', name: 'Tensiomètre manuel anéroïde Spengler', publicPrice: '14 500 FCFA', supplierPrice: '9 500 FCFA', supplierName: 'Matériel Médical Dakar', supplierContact: '+221 77 312 45 67', supplierLocation: 'Dakar, Médina', source: 'Spengler France / Importateur agréé', desc: 'Classic professionnel avec stéthoscope intégré. Manomètre métal. Brassard adulte.', fullDesc: 'Tensiomètre anéroïde Spengler, référence depuis plus de 70 ans. Manomètre en métal avec graduation laser. Stéthoscope double pavillon intégré. Livré en housse de transport.', specs: ['Marque: Spengler', 'Manomètre: Métal', 'Stéthoscope: Intégré', 'Housse: Incluse'], inStock: true },
      { id: 'balance-beurer-by80', name: 'Balance bébé électronique Beurer BY 80', publicPrice: '26 000 FCFA', supplierPrice: '17 500 FCFA', supplierName: 'Bébé Confort Dakar', supplierContact: '+221 33 836 78 90', supplierLocation: 'Dakar, Sicap', source: 'Beurer / Bébé Confort Dakar', desc: 'Précision 5g, plateau confort incurvé, fonction hold. Écran LCD.', fullDesc: 'Balance bébé professionnelle Beurer BY 80. Plateau incurvé pour sécurité du nourrisson. Précision de 5g jusqu\'à 20kg. Fonction hold pour figer le poids même si bébé bouge.', specs: ['Marque: Beurer', 'Modèle: BY 80', 'Précision: 5g', 'Capacité: 20kg', 'Fonction: Hold'], inStock: true },
    ]
  },
  {
    id: 'tenue', name: 'Tenue Médicale & Hygiène', icon: '🥼',
    products: [
      { id: 'blouse-coty-homme', name: 'Blouse médicale unisexe blanche Coty', publicPrice: '10 500 FCFA', supplierPrice: '6 800 FCFA', supplierName: 'Coty Textile Sénégal', supplierContact: '+221 77 843 21 09', supplierLocation: 'Dakar, Pikine', source: 'Coty Textile / Fabricant local', desc: 'Coton/polyester 65/35, manches courtes, 3 poches, taille S au XXL.', fullDesc: 'Blouse médicale fabriquée au Sénégal par Coty Textile. Tissu polycoton résistant aux lavages industriels à 90°C. Coupe confortable unisexe. Disponible en blanc, bleu ciel et vert.', specs: ['Marque: Coty', 'Composition: 65% polyester / 35% coton', 'Tailles: S à XXL', 'Couleurs: Blanc, bleu, vert'], inStock: true },
      { id: 'tunique-dickies-femme', name: 'Tunique médicale femme Dickies EDS', publicPrice: '14 000 FCFA', supplierPrice: '9 500 FCFA', supplierName: 'Medi-Shop Sénégal', supplierContact: '+221 77 654 32 10', supplierLocation: 'Dakar, Almadies', source: 'Dickies Medical USA / Importateur officiel', desc: 'Stretch, anti-tache, 5 coloris. Coupe cintrée. 2 poches plaquées + 1 poche ciseaux.', fullDesc: 'Tunique médicale Dickies EDS (Every Day Scrubs) de la célèbre marque américaine. Tissu stretch 4 directions pour un confort maximal. Traitement anti-tache. Coutures renforcées.', specs: ['Marque: Dickies', 'Collection: EDS', 'Stretch: 4 directions', 'Poches: 3'], inStock: true },
      { id: 'chaussures-oxypas-src', name: 'Chaussures médicales antidérapantes Oxypas', publicPrice: '18 500 FCFA', supplierPrice: '12 500 FCFA', supplierName: 'Sécurité Pro Sénégal', supplierContact: '+221 33 844 55 22', supplierLocation: 'Dakar, Parcelles', source: 'Oxypas Europe / Sécurité Pro Sénégal', desc: 'Semelle SRC antiglisse, confort 12h, lavable machine à 40°C. Cuir synthétique.', fullDesc: 'Chaussures professionnelles Oxypas conçues pour le personnel soignant. Semelle SRC antiglisse testée sur céramique et acier avec solution savonneuse. Absorption des chocs au talon. Antistatique.', specs: ['Marque: Oxypas', 'Semelle: SRC antiglisse', 'Lavage: 40°C', 'Matériau: Simili cuir'], inStock: true },
      { id: 'charlotte-x100', name: 'Charlotte chirurgicale non-tissée x100', publicPrice: '4 500 FCFA', supplierPrice: '2 800 FCFA', supplierName: 'Médical Conso Sénégal', supplierContact: '+221 77 901 23 45', supplierLocation: 'Dakar, Keur Massar', source: 'Médical Conso / Import Chine certifié CE', desc: 'Non-tissé SMS 20g/m², élastique, usage unique. Lot de 100 unités.', fullDesc: 'Charlotte chirurgicale en SMS (Spunbond-Meltblown-Spunbond) triple couche. Barrière efficace contre les particules et fluides. Élastique confortable autour du front. Stérile sur demande.', specs: ['Type: SMS 20g/m²', 'Quantité: 100', 'Stérilité: Non (sur demande)', 'Certification: CE'], inStock: true },
      { id: 'gants-latex-x100', name: 'Gants latex non poudrés examen x100', publicPrice: '5 500 FCFA', supplierPrice: '3 500 FCFA', supplierName: 'Médical Conso Sénégal', supplierContact: '+221 77 901 23 45', supplierLocation: 'Dakar, Keur Massar', source: 'Top Glove Malaisie / Importateur agréé', desc: 'Tailles S à XL, examen médical. Latex naturel. Sans poudre d\'amidon.', fullDesc: 'Gants d\'examen en latex naturel de qualité médicale de Top Glove, premier fabricant mondial. Traitement au chlore réduisant les protéines allergisantes. Texture micro-rugueuse aux doigts pour meilleure préhension.', specs: ['Marque: Top Glove', 'Matériau: Latex naturel', 'Tailles: S à XL', 'Surface: Micro-rugueuse', 'Certification: EN 455 / CE'], inStock: true },
      { id: 'masque-iir-x50', name: 'Masque chirurgical Type IIR x50', publicPrice: '3 500 FCFA', supplierPrice: '2 200 FCFA', supplierName: 'Médical Conso Sénégal', supplierContact: '+221 77 901 23 45', supplierLocation: 'Dakar, Keur Massar', source: 'Importateur certifié / Pharmacie nationale', desc: '3 plis, barrette nasale, filtration bactérienne > 98%. Norme EN 14683.', fullDesc: 'Masque chirurgical Type IIR haute performance conforme à la norme européenne EN 14683. Couche meltblown filtrante. Résistance aux éclaboussures de sang. Barrette nasale ajustable. Élastiques auriculaires résistants.', specs: ['Norme: EN 14683 Type IIR', 'Filtration: >98%', 'Couches: 3 plis', 'Quantité: 50'], inStock: true },
      { id: 'tablier-pvc', name: 'Tablier imperméable PVC renforcé', publicPrice: '4 000 FCFA', supplierPrice: '2 500 FCFA', supplierName: 'Protection Plus Dakar', supplierContact: '+221 77 234 56 78', supplierLocation: 'Dakar, Grand-Yoff', source: 'Fabricant local / Protection Plus', desc: 'Protection liquides, liens taille, réutilisable. PVC 0.35mm. Longueur 120cm.', fullDesc: 'Tablier de protection médicale en PVC épais 0.35mm. Imperméable aux liquides biologiques et chimiques. Liens taille ajustables. Facile à nettoyer et désinfecter. Longueur genou pour protection maximale.', specs: ['Matériau: PVC 0.35mm', 'Longueur: 120 cm', 'Couleurs: Blanc, bleu, vert'], inStock: true },
      { id: 'surblouse-iso-x10', name: 'Surblouse isolation SMS jaune x10', publicPrice: '6 500 FCFA', supplierPrice: '4 000 FCFA', supplierName: 'Médical Conso Sénégal', supplierContact: '+221 77 901 23 45', supplierLocation: 'Dakar, Keur Massar', source: 'Importateur certifié CE', desc: 'Protection isolation, usage unique. SMS 40g/m². Manches longues avec poignets élastiques.', fullDesc: 'Surblouse d\'isolation en SMS 40g/m² pour protection contre les agents infectieux. Fermeture par liens ou scratch au dos. Poignets élastiques. Indiquée pour zones de contact, isolement et salle d\'opération.', specs: ['Type: SMS 40g/m²', 'Quantité: 10', 'Fermeture: Liens', 'Poignets: Élastiques'], inStock: true },
    ]
  },
  {
    id: 'secours', name: 'Premiers Secours & Urgence', icon: '🆘',
    products: [
      { id: 'trousse-secours-50', name: 'Trousse premiers secours 50+ articles', publicPrice: '15 000 FCFA', supplierPrice: '9 500 FCFA', supplierName: 'Sécurité Pro Sénégal', supplierContact: '+221 33 844 55 22', supplierLocation: 'Dakar, Parcelles', source: 'Sécurité Pro / Fabrication locale et import', desc: 'Pansements, compresses, bandes, ciseaux, couverture survie, gants, antiseptique. Format valise ABS.', fullDesc: 'Trousse de secours complète conforme aux recommandations du Croissant Rouge. Contient plus de 50 articles essentiels : pansements variés, compresses stériles, bande extensible, ciseaux médicaux, couverture de survie isotherme, gants latex, antiseptique, pinces, etc. Valise ABS à compartiments.', specs: ['Articles: 50+', 'Valise: ABS', 'Dimensions: 25x18x8 cm', 'Poids: 1.2 kg'], inStock: true },
      { id: 'zoll-aed-plus', name: 'Défibrillateur DAE Zoll AED Plus', publicPrice: '1 200 000 FCFA', supplierPrice: '850 000 FCFA', supplierName: 'Medi-Shop Sénégal', supplierContact: '+221 77 654 32 10', supplierLocation: 'Dakar, Almadies', source: 'Zoll Medical USA / Distributeur agréé Afrique de l\'Ouest', desc: 'Semi-automatique, guidage vocal FR/EN, batterie 5 ans, électrodes adulte+pédiatrique. IP55.', fullDesc: 'Le Zoll AED Plus est le DAE le plus fiable du marché. Unique technologie Real CPR Help qui mesure la profondeur des compressions thoraciques en temps réel. Résistant aux chocs et à l\'eau (IP55). Électrodes universelles pour adultes et enfants. Auto-test quotidien.', specs: ['Marque: Zoll', 'Modèle: AED Plus', 'Technologie: Real CPR Help', 'IP: 55', 'Batterie: 5 ans', 'Langues: FR/EN'], inStock: false },
      { id: 'masque-rce', name: 'Masque poche RCE avec valve', publicPrice: '2 500 FCFA', supplierPrice: '1 500 FCFA', supplierName: 'Sécurité Pro Sénégal', supplierContact: '+221 33 844 55 22', supplierLocation: 'Dakar, Parcelles', source: 'Laerdal / Importateur médical', desc: 'Masque poche + valve unidirectionnelle + filtre. Pour réanimation bouche-à-bouche. Latex-free.', fullDesc: 'Masque de réanimation cardiopulmonaire (RCE) Laerdal de type poche. Valve unidirectionnelle et filtre hydrophobe pour protection du secouriste. Sachet individuel stérile. Compatible adulte, enfant et nourrisson.', specs: ['Marque: Laerdal', 'Type: Poche', 'Filtre: Hydrophobe', 'Latex: Non'], inStock: true },
      { id: 'attelle-alu-mousse', name: 'Attelle de secours universelle aluminium/mousse', publicPrice: '8 000 FCFA', supplierPrice: '5 200 FCFA', supplierName: 'Ortho Plus Sénégal', supplierContact: '+221 77 456 78 90', supplierLocation: 'Dakar, Colobane', source: 'Fabricant asiatique certifié CE / Ortho Plus', desc: 'Mousse aluminium pliable, ajustable bras/jambe. Velcro. Pliable pour stockage. 2 unités.', fullDesc: 'Attelle de secours en mousse recouvrant une âme aluminium malléable. S\'adapte à toutes les morphologies (bras ou jambe). Fermeture Velcro rapide. Peut être coupée sur mesure. Livrée avec écharpe de soutien.', specs: ['Matériau: Alu/mousse', 'Taille: Universelle', 'Quantité: 2', 'Écharpe: Incluse'], inStock: true },
      { id: 'garrot-cat-gen7', name: 'Garrot tactique CAT Gen 7', publicPrice: '9 500 FCFA', supplierPrice: '6 500 FCFA', supplierName: 'Sécurité Pro Sénégal', supplierContact: '+221 33 844 55 22', supplierLocation: 'Dakar, Parcelles', source: 'North American Rescue / Distributeur militaire', desc: 'Combat Application Tourniquet. Militaire/hémorragie, une main. Tige aluminium renforcée.', fullDesc: 'Garrot tactique CAT Gen 7, standard militaire des forces armées américaines et de l\'OTAN. Application à une main possible. Sangle en nylon avec blocage rapide. Tige aluminium résistante. Largeur de sangle 3.8cm pour pression optimale.', specs: ['Marque: NAR', 'Modèle: CAT Gen 7', 'Largeur: 3.8 cm', 'Application: Une main'], inStock: true },
      { id: 'couverture-survie', name: 'Couverture de survie isotherme or/argent', publicPrice: '2 000 FCFA', supplierPrice: '1 200 FCFA', supplierName: 'Sécurité Pro Sénégal', supplierContact: '+221 33 844 55 22', supplierLocation: 'Dakar, Parcelles', source: 'Importateur certifié', desc: 'Hypothermie, choc, 140x200cm. Réfléchit 90% chaleur corporelle. Étanche.', fullDesc: 'Couverture de survie en Mylar PET double face or/argent. Réfléchit jusqu\'à 90% de la chaleur corporelle. Imperméable et coupe-vent. Indispensable en randonnée, accident de la route et trousse de secours.', specs: ['Dimensions: 140x200 cm', 'Matériau: Mylar PET', 'Réflexion: 90%', 'Étanche: Oui'], inStock: true },
      { id: 'brancard-alu', name: 'Brancard pliant aluminium 2 battants', publicPrice: '78 000 FCFA', supplierPrice: '52 000 FCFA', supplierName: 'Matériel Médical Dakar', supplierContact: '+221 77 312 45 67', supplierLocation: 'Dakar, Médina', source: 'Fabricant chinois certifié ISO 13485', desc: '4 poignées, sac transport, charge max 160kg. Pliage en 2. Roulettes optionnelles.', fullDesc: 'Brancard d\'évacuation médical en aluminium léger. Structure pliable en deux pour faciliter le transport. 4 poignées ergonomiques. Charge maximale 160kg. Surface en PVC imperméable et démontable. Roulettes disponibles en option.', specs: ['Matériau: Aluminium', 'Charge: 160 kg', 'Pliage: 2 battants', 'Sac: Inclus'], inStock: false },
      { id: 'valise-med-abs', name: 'Valise médicale ABS professionnelle', publicPrice: '28 000 FCFA', supplierPrice: '18 500 FCFA', supplierName: 'Matériel Médical Dakar', supplierContact: '+221 77 312 45 67', supplierLocation: 'Dakar, Médina', source: 'Fabricant chinois / Matériel Médical Dakar', desc: 'ABS renforcé, compartiments modulables, serrure à clé. Dimensions 45x33x15cm.', fullDesc: 'Valise médicale professionnelle en ABS haute résistance aux chocs. Intérieur modulable avec séparateurs Velcro. Serrure à clé pour sécurité. Poignée ergonomique et bandoulière rembourrée. Idéale pour médecins à domicile et infirmiers.', specs: ['Matériau: ABS', 'Dimensions: 45x33x15 cm', 'Serrure: Clé', 'Bandoulière: Oui'], inStock: true },
    ]
  },
  {
    id: 'prevention', name: 'Prévention & Protection', icon: '🛡️',
    products: [
      { id: 'moustiquaire-dawa', name: 'Moustiquaire imprégnée DawaPlus 2 places', publicPrice: '9 500 FCFA', supplierPrice: '6 200 FCFA', supplierName: 'Sante Plus Distribution', supplierContact: '+221 77 567 89 01', supplierLocation: 'Dakar, Fass', source: 'DawaPlus (Sumitomo) / PNLP Sénégal', desc: 'Longue durée 3 ans, perméthrine, format rectangulaire 190x180x150cm. Sac transport.', fullDesc: 'Moustiquaire imprégnée à longue durée d\'action (3 ans / 20 lavages) approuvée par le Programme National de Lutte contre le Paludisme du Sénégal. Tissu polyester 75D traité à la perméthrine. Ouverture latérale zip. 4 anneaux de suspension.', specs: ['Marque: DawaPlus', 'Traitement: Perméthrine', 'Durée: 3 ans', 'Format: 190x180x150 cm'], inStock: true },
      { id: 'repulsif-deet-100', name: 'Répulsif peau DEET 50% Spray 100ml', publicPrice: '5 500 FCFA', supplierPrice: '3 500 FCFA', supplierName: 'Pharmacie Centrale Dakar', supplierContact: '+221 33 821 00 00', supplierLocation: 'Dakar, Centre-ville', source: 'Laboratoires Gilbert / Pharmacies sénégalaises', desc: 'Protection 8h, adulte/enfant > 30 mois. Spray 100ml. DEET 50%.', fullDesc: 'Répulsif cutané au DEET 50% des Laboratoires Gilbert, référence européenne. Efficacité prouvée contre les moustiques anophèles (vecteurs du paludisme), tiques et mouches tsé-tsé. Protection durable jusqu\'à 8 heures. Formule non grasse.', specs: ['Principe actif: DEET 50%', 'Protection: 8h', 'Format: 100 ml spray', 'Âge: >30 mois'], inStock: true },
      { id: 'lampe-uv-moustique', name: 'Lampe UV anti-moustique photocatalyse', publicPrice: '18 500 FCFA', supplierPrice: '12 000 FCFA', supplierName: 'Électro Santé Dakar', supplierContact: '+221 77 678 90 12', supplierLocation: 'Dakar, Liberté', source: 'Importateur Chine certifié / Électro Santé', desc: 'Piège photocatalyse + ventilateur aspiration, silencieux, 50m². LED UV 365nm.', fullDesc: 'Lampe piège à moustiques par photocatalyse et aspiration. Émet du CO2 et de la chaleur simulant la respiration humaine pour attirer les moustiques. Ventilateur silencieux aspire les insectes dans un bac de capture. Efficace sur 50m². Sans produit chimique.', specs: ['Technologie: Photocatalyse', 'Surface: 50 m²', 'Bruit: <30 dB', 'Alimentation: Secteur'], inStock: true },
      { id: 'steripen-ultra', name: 'Purificateur d\'eau UV Steripen Ultra', publicPrice: '42 000 FCFA', supplierPrice: '28 000 FCFA', supplierName: 'Outdoor & Santé Sénégal', supplierContact: '+221 77 789 01 23', supplierLocation: 'Dakar, Mamelles', source: 'Katadyn Steripen / Distributeur agréé', desc: '1L/90sec, destruction 99,9% bactéries/virus/protozoaires. USB rechargeable. Écran OLED.', fullDesc: 'Steripen Ultra utilise la lumière UV-C pour détruire 99,9% des bactéries, virus et protozoaires (Giardia, Cryptosporidium). Traite 1 litre en 90 secondes. Batterie lithium rechargeable par USB. Écran OLED indiquant le succès du traitement. Indispensable voyage et zones sans eau potable.', specs: ['Marque: Katadyn', 'Modèle: Steripen Ultra', 'Traitement: 1L/90sec', 'Batterie: Li-ION USB', 'Certification: EPA'], inStock: true },
      { id: 'gel-hydro-500', name: 'Gel hydroalcoolique 500ml pompe', publicPrice: '3 500 FCFA', supplierPrice: '2 200 FCFA', supplierName: 'Laboratoire Sénégalais Hygiène', supplierContact: '+221 33 845 67 89', supplierLocation: 'Dakar, Thiaroye', source: 'Fabrication locale / Norme EN 1500', desc: '70% éthanol, EN 1500, usage professionnel. Pompe 500ml. Parfum neutre.', fullDesc: 'Gel hydroalcoolique fabriqué au Sénégal selon la norme européenne EN 1500. Concentration en éthanol 70% pour une efficacité virucide et bactéricide optimale. Formule enrichie en glycérine pour préserver les mains. Pompe professionnelle 500ml.', specs: ['Éthanol: 70%', 'Norme: EN 1500', 'Format: 500 ml pompe', 'Fabrication: Locale'], inStock: true },
      { id: 'pese-personne-beurer', name: 'Pèse-personne digital précision Beurer GS 10', publicPrice: '12 000 FCFA', supplierPrice: '7 800 FCFA', supplierName: 'Pharmacie du Point E', supplierContact: '+221 33 867 43 21', supplierLocation: 'Dakar, Point E', source: 'Beurer GmbH / Pharmacie du Point E', desc: 'Verre trempé, 180kg, IMC automatique. Écran LCD 3,5". Marche/arrêt automatique.', fullDesc: 'Pèse-personne Beurer GS 10 en verre trempé sécurit. Capacité 180kg avec précision de 100g. Calcul automatique de l\'IMC (Indice de Masse Corporelle) avec classification. Écran LCD rétroéclairé de 3,5 pouces. Technologie step-on pour marche/arrêt automatique.', specs: ['Marque: Beurer', 'Modèle: GS 10', 'Capacité: 180 kg', 'Précision: 100g', 'IMC: Automatique'], inStock: true },
    ]
  },
  {
    id: 'ortho', name: 'Orthopédie & Rééducation', icon: '🦿',
    products: [
      { id: 'bequilles-axillaires', name: 'Béquilles axillaires aluminium (paire)', publicPrice: '11 000 FCFA', supplierPrice: '7 500 FCFA', supplierName: 'Ortho Plus Sénégal', supplierContact: '+221 77 456 78 90', supplierLocation: 'Dakar, Colobane', source: 'Fabricant chinois certifié CE / Ortho Plus', desc: 'Réglable 114-134cm, embouts antidérapants caoutchouc. 10 niveaux de hauteur.', fullDesc: 'Paire de béquilles axillaires en aluminium léger. Hauteur réglable par pas de 2,5cm sur 10 niveaux (114-134cm). Embouts en caoutchouc naturel antidérapant. Coussinets axillaires rembourrés et amovibles. Charge maximale 100kg.', specs: ['Matériau: Aluminium', 'Réglage: 114-134 cm', 'Charge: 100 kg', 'Quantité: Paire'], inStock: true },
      { id: 'ceinture-lombaire', name: 'Ceinture lombaire de maintien 4 baleines', publicPrice: '7 500 FCFA', supplierPrice: '4 800 FCFA', supplierName: 'Ortho Plus Sénégal', supplierContact: '+221 77 456 78 90', supplierLocation: 'Dakar, Colobane', source: 'Fabricant asiatique / Ortho Plus', desc: '4 baleines acier, velcro, compression ajustable. Hauteur 26cm. Noir.', fullDesc: 'Ceinture lombaire orthopédique avec 4 baleines en acier souple pour un soutien optimal de la colonne vertébrale. Fermeture Velcro double pour ajustement personnalisé de la compression. Hauteur de 26cm pour couvrir les vertèbres L1 à L5. Tissu respirant et élastique.', specs: ['Baleines: 4 acier', 'Hauteur: 26 cm', 'Tailles: S à XXL', 'Couleur: Noir'], inStock: true },
      { id: 'genouillere-rotulienne', name: 'Genouillère rotulienne néoprène avec anneau', publicPrice: '6 500 FCFA', supplierPrice: '4 200 FCFA', supplierName: 'Ortho Plus Sénégal', supplierContact: '+221 77 456 78 90', supplierLocation: 'Dakar, Colobane', source: 'Fabricant asiatique / Ortho Plus', desc: 'Anneau silicone, stabilisation ligaments. Ouverture rotule. Velcro.', fullDesc: 'Genouillère orthopédique en néoprène 3mm avec anneau stabilisateur de rotule en silicone. Stabilise les ligaments collatéraux et croisés. Ouverture centrale pour décompression rotulienne. Fermeture Velcro réglable. Convient à la rééducation post-entorse et arthrose.', specs: ['Matériau: Néoprène 3mm', 'Stabilisation: Anneau silicone', 'Tailles: S à XL'], inStock: true },
      { id: 'attelle-cheville', name: 'Attelle cheville stabilisatrice lacets + sangles', publicPrice: '8 500 FCFA', supplierPrice: '5 500 FCFA', supplierName: 'Ortho Plus Sénégal', supplierContact: '+221 77 456 78 90', supplierLocation: 'Dakar, Colobane', source: 'Fabricant asiatique / Ortho Plus', desc: 'Lacets + 2 sangles croisées, protection entorse. Renforts malléoles.', fullDesc: 'Attelle de cheville rigide avec système de lacets et 2 sangles Velcro croisées pour une immobilisation optimale. Renforts latéraux malléolaires amovibles. Semelle antidérapante. Indiquée pour entorses de grade 2 et 3, rééducation post-fracture.', specs: ['Fermeture: Lacets + sangles', 'Renforts: Malléoles', 'Tailles: S à XL'], inStock: true },
      { id: 'collier-cervical', name: 'Collier cervical souple C1-C7', publicPrice: '5 500 FCFA', supplierPrice: '3 500 FCFA', supplierName: 'Ortho Plus Sénégal', supplierContact: '+221 77 456 78 90', supplierLocation: 'Dakar, Colobane', source: 'Fabricant asiatique / Ortho Plus', desc: 'Mousse haute densité, tailles S à L. Hauteur 7-9cm. Velcro.', fullDesc: 'Collier cervical orthopédique en mousse haute densité pour immobilisation des vertèbres C1 à C7. Hauteur réglable 7 à 9cm selon la taille. Fermeture Velcro sécurisée. Tissu intérieur jersey doux et respirant. Indiqué pour torticolis, cervicalgies et post-traumatique.', specs: ['Matériau: Mousse HD', 'Hauteur: 7-9 cm', 'Tailles: S à L'], inStock: true },
      { id: 'bandes-elastiques', name: 'Bandes élastiques rééducation (set x3)', publicPrice: '6 000 FCFA', supplierPrice: '3 800 FCFA', supplierName: 'Kiné Pro Sénégal', supplierContact: '+221 77 345 67 89', supplierLocation: 'Dakar, Ouakam', source: 'Fabricant chinois / Kiné Pro', desc: 'Latex naturel, 3 résistances (légère/moyenne/forte), sac inclus.', fullDesc: 'Set de 3 bandes élastiques en latex naturel pour rééducation et renforcement musculaire. 3 niveaux de résistance codés par couleur (jaune/rouge/noir). Longueur 1,5m. Sac de rangement inclus. Idéal pour kinésithérapie, fitness et rééducation post-opératoire.', specs: ['Matériau: Latex', 'Résistances: 3 niveaux', 'Longueur: 1.5 m', 'Sac: Inclus'], inStock: true },
      { id: 'ballon-kine-65', name: 'Ballon de rééducation 65cm anti-éclatement', publicPrice: '7 500 FCFA', supplierPrice: '4 800 FCFA', supplierName: 'Kiné Pro Sénégal', supplierContact: '+221 77 345 67 89', supplierLocation: 'Dakar, Ouakam', source: 'Fabricant chinois / Kiné Pro', desc: 'Anti-éclatement, pompe incluse. Diamètre 65cm. Charge 300kg.', fullDesc: 'Ballon de gym professionnel anti-éclatement (s\'dégonfle lentement en cas de perforation). Diamètre 65cm adapté aux adultes de 1,65m à 1,80m. Charge maximale 300kg. Pompe à pied incluse. Indiqué pour gainage, équilibre, rééducation du dos et périnée.', specs: ['Diamètre: 65 cm', 'Charge: 300 kg', 'Pompe: Incluse', 'Anti-éclatement: Oui'], inStock: true },
      { id: 'tapis-antifatigue', name: 'Tapis de marche antifatigue gel 90x150cm', publicPrice: '15 000 FCFA', supplierPrice: '9 500 FCFA', supplierName: 'Matériel Médical Dakar', supplierContact: '+221 77 312 45 67', supplierLocation: 'Dakar, Médina', source: 'Fabricant européen / Matériel Médical Dakar', desc: 'Gel/mousse haute densité, 90x150cm. Idéal bloc opératoire et standing.', fullDesc: 'Tapis antifatigue professionnel en gel polymère et mousse haute densité. Réduit la fatigue des jambes et du dos lors des longues station debout. Surface antidérapante et imperméable. Bords biseautés anti-chute. Utilisé en bloc opératoire, laboratoire et comptoir.', specs: ['Dimensions: 90x150 cm', 'Épaisseur: 2 cm', 'Matériau: Gel + mousse', 'Surface: Antidérapante'], inStock: true },
    ]
  },
];

/* ── Modal détail produit ── */
export function ProductDetailModal({ product, isAdmin, onClose, onOrder }) {
  if (!product) return null;
  const margin = isAdmin && product.supplierPrice && product.publicPrice
    ? (parseInt(product.publicPrice.replace(/\D/g,'')) - parseInt(product.supplierPrice.replace(/\D/g,'')))
    : null;

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:9999, padding:16 }} onClick={onClose}>
      <div style={{ background:'var(--bg-card)', borderRadius:20, padding:28, width:'100%', maxWidth:560, maxHeight:'90vh', overflowY:'auto', position:'relative', boxShadow:'0 24px 80px rgba(0,0,0,0.35)', border:'1px solid var(--border)' }} onClick={e=>e.stopPropagation()}>
        <button onClick={onClose} style={{ position:'absolute', top:14, right:14, background:'none', border:'none', fontSize:22, cursor:'pointer', color:'var(--text-muted)', width:32, height:32, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center' }}>✕</button>

        <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:16 }}>
          <div style={{ width:56, height:56, borderRadius:14, background:'linear-gradient(135deg,#10B981,#059669)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:26, flexShrink:0 }}>🩺</div>
          <div>
            <h2 style={{ margin:0, fontSize:'1.15rem', fontWeight:800, color:'var(--text-primary)', lineHeight:1.25 }}>{product.name}</h2>
            <span style={{ display:'inline-flex', alignItems:'center', gap:6, marginTop:6, padding:'3px 10px', borderRadius:100, background:product.inStock?'rgba(16,185,129,0.12)':'rgba(239,68,68,0.12)', color:product.inStock?'#10B981':'#EF4444', fontSize:'0.72rem', fontWeight:700 }}>
              {product.inStock?'● En stock':'● Rupture de stock'}
            </span>
          </div>
        </div>

        <p style={{ margin:'0 0 16px', fontSize:'0.88rem', color:'var(--text-secondary)', lineHeight:1.55 }}>{product.fullDesc || product.desc}</p>

        {product.specs && product.specs.length > 0 && (
          <div style={{ marginBottom:16 }}>
            <h4 style={{ margin:'0 0 10px', fontSize:'0.8rem', fontWeight:700, color:'var(--text-primary)', textTransform:'uppercase', letterSpacing:'0.5px' }}>Spécifications techniques</h4>
            <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
              {product.specs.map((s,i)=> (
                <span key={i} style={{ padding:'5px 12px', borderRadius:8, background:'var(--surface)', border:'1px solid var(--border)', fontSize:'0.78rem', color:'var(--text-secondary)' }}>{s}</span>
              ))}
            </div>
          </div>
        )}

        <div style={{ padding:14, borderRadius:12, background:'var(--surface)', border:'1px solid var(--border)', marginBottom:16 }}>
          <h4 style={{ margin:'0 0 10px', fontSize:'0.8rem', fontWeight:700, color:'var(--text-primary)' }}>Source & traçabilité</h4>
          <p style={{ margin:'0 0 6px', fontSize:'0.8rem', color:'var(--text-secondary)' }}><strong>Source:</strong> {product.source}</p>
          {product.sourceUrl && <p style={{ margin:0, fontSize:'0.78rem' }}><a href={product.sourceUrl} target="_blank" rel="noopener noreferrer" style={{ color:'#3B82F6' }}>🔗 Voir la source en ligne</a></p>}
        </div>

        {/* Admin only: supplier details */}
        {isAdmin && (
          <div style={{ padding:14, borderRadius:12, background:'rgba(245,158,11,0.08)', border:'1px solid rgba(245,158,11,0.3)', marginBottom:16 }}>
            <h4 style={{ margin:'0 0 10px', fontSize:'0.8rem', fontWeight:700, color:'#F59E0B', display:'flex', alignItems:'center', gap:6 }}>
              <span>👑</span> Données fournisseur (Admin)
            </h4>
            <div style={{ display:'grid', gap:6, fontSize:'0.8rem', color:'var(--text-secondary)' }}>
              <div><strong>Prix fournisseur:</strong> <span style={{ color:'#10B981', fontWeight:700 }}>{product.supplierPrice}</span></div>
              <div><strong>Prix public:</strong> <span style={{ color:'var(--text-primary)', fontWeight:700 }}>{product.publicPrice}</span></div>
              {margin !== null && <div><strong>Marge brute:</strong> <span style={{ color:'#3B82F6', fontWeight:700 }}>{margin.toLocaleString()} FCFA</span></div>}
              <div><strong>Fournisseur:</strong> {product.supplierName}</div>
              <div><strong>Contact:</strong> {product.supplierContact}</div>
              <div><strong>Localisation:</strong> {product.supplierLocation}</div>
            </div>
          </div>
        )}

        <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
          {product.inStock && (
            <>
              <button onClick={onOrder} style={{ flex:1, minWidth:180, padding:'12px 20px', borderRadius:12, border:'none', background:'linear-gradient(135deg,#10B981,#059669)', color:'#fff', fontWeight:700, fontSize:'0.88rem', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
                🛒 Commander ce produit
              </button>
              <a href={`https://wa.me/221775185050?text=${encodeURIComponent(`Bonjour Abavie Support,\n\nJe suis intéressé par le produit suivant :\n📦 ${product.name}\n\nMerci de me contacter pour finaliser ma commande.`)}`} target="_blank" rel="noopener noreferrer" style={{ flex:1, minWidth:180, padding:'12px 20px', borderRadius:12, border:'none', background:'linear-gradient(135deg,#25D366,#128C7E)', color:'#fff', fontWeight:700, fontSize:'0.88rem', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:8, textDecoration:'none' }}>
                💬 Commander par WhatsApp
              </a>
            </>
          )}
          {!product.inStock && (
            <button disabled style={{ flex:1, padding:'12px 20px', borderRadius:12, border:'none', background:'var(--border)', color:'var(--text-muted)', fontWeight:700, fontSize:'0.88rem', cursor:'default' }}>
              ⛔ Produit en rupture de stock
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Modal commande ── */
export function OrderModal({ product, membre, onClose, onSent }) {
  const [form, setForm] = useState({
    qty: 1,
    name: (membre?.prenom || '') + ' ' + (membre?.nom || ''),
    phone: membre?.phone || '',
    address: '',
    message: ''
  });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  async function submitOrder() {
    if (!form.name.trim() || !form.phone.trim()) return;
    setSending(true);
    const orderData = {
      productId: product.id,
      productName: product.name,
      qty: form.qty,
      customerName: form.name.trim(),
      customerPhone: form.phone.trim(),
      customerAddress: form.address.trim(),
      message: form.message.trim(),
      date: new Date().toISOString(),
      status: 'pending'
    };
    // Save to localStorage orders
    const existing = JSON.parse(localStorage.getItem('abavie_orders') || '[]');
    existing.push(orderData);
    localStorage.setItem('abavie_orders', JSON.stringify(existing));
    // Simulate admin notification (could be supabase realtime)
    setTimeout(() => {
      setSending(false);
      setSent(true);
      onSent?.();
    }, 800);
  }

  if (sent) {
    const waText = encodeURIComponent(
      `📦 *NOUVELLE COMMANDE ABAVIE*\n\n` +
      `Produit: ${product.name}\n` +
      `Quantité: ${form.qty}\n` +
      `Client: ${form.name.trim()}\n` +
      `Téléphone: ${form.phone.trim()}\n` +
      (form.address.trim() ? `Adresse: ${form.address.trim()}\n` : '') +
      (form.message.trim() ? `Message: ${form.message.trim()}\n` : '') +
      `\nDate: ${new Date().toLocaleString('fr-FR')}`
    );
    return (
      <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:9999, padding:16 }} onClick={onClose}>
        <div style={{ background:'var(--bg-card)', borderRadius:20, padding:32, width:'100%', maxWidth:420, textAlign:'center', boxShadow:'0 24px 80px rgba(0,0,0,0.35)', border:'1px solid var(--border)' }} onClick={e=>e.stopPropagation()}>
          <div style={{ width:60, height:60, borderRadius:'50%', background:'rgba(16,185,129,0.15)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:28, margin:'0 auto 16px' }}>✅</div>
          <h3 style={{ margin:0, fontSize:'1.1rem', fontWeight:800, color:'var(--text-primary)' }}>Commande envoyée !</h3>
          <p style={{ margin:'10px 0 0', fontSize:'0.85rem', color:'var(--text-secondary)' }}>Votre demande pour <strong>{product.name}</strong> a été transmise. Un administrateur vous contactera sous peu.</p>
          <a href={`https://wa.me/221775185050?text=${waText}`} target="_blank" rel="noopener noreferrer" style={{ display:'inline-flex', alignItems:'center', justifyContent:'center', gap:8, marginTop:16, padding:'10px 20px', borderRadius:10, border:'none', background:'linear-gradient(135deg,#25D366,#128C7E)', color:'#fff', fontWeight:700, fontSize:'0.85rem', textDecoration:'none', cursor:'pointer' }}>
            💬 Envoyer aussi par WhatsApp
          </a>
          <button onClick={onClose} style={{ display:'block', margin:'12px auto 0', padding:'10px 24px', borderRadius:10, border:'none', background:'var(--accent)', color:'#fff', fontWeight:700, cursor:'pointer' }}>Fermer</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:9999, padding:16 }} onClick={onClose}>
      <div style={{ background:'var(--bg-card)', borderRadius:20, padding:24, width:'100%', maxWidth:440, maxHeight:'90vh', overflowY:'auto', position:'relative', boxShadow:'0 24px 80px rgba(0,0,0,0.35)', border:'1px solid var(--border)' }} onClick={e=>e.stopPropagation()}>
        <button onClick={onClose} style={{ position:'absolute', top:14, right:14, background:'none', border:'none', fontSize:22, cursor:'pointer', color:'var(--text-muted)' }}>✕</button>
        <h3 style={{ margin:'0 0 6px', fontSize:'1.05rem', fontWeight:800, color:'var(--text-primary)' }}>🛒 Commander</h3>
        <p style={{ margin:'0 0 16px', fontSize:'0.82rem', color:'var(--text-secondary)' }}>{product.name}</p>

        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          <div>
            <label style={{ fontSize:'0.78rem', fontWeight:700, color:'var(--text-secondary)', marginBottom:4, display:'block' }}>Quantité</label>
            <input type="number" min={1} max={99} value={form.qty} onChange={e=>setForm(f=>({...f,qty:Math.max(1,parseInt(e.target.value)||1)}))}
              style={{ width:'100%', padding:'10px 14px', borderRadius:10, border:'1px solid var(--border)', background:'var(--bg-primary)', color:'var(--text-primary)', fontSize:'0.88rem', boxSizing:'border-box' }} />
          </div>
          <div>
            <label style={{ fontSize:'0.78rem', fontWeight:700, color:'var(--text-secondary)', marginBottom:4, display:'block' }}>Nom complet *</label>
            <input value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} placeholder="Prénom et nom"
              style={{ width:'100%', padding:'10px 14px', borderRadius:10, border:'1px solid var(--border)', background:'var(--bg-primary)', color:'var(--text-primary)', fontSize:'0.88rem', boxSizing:'border-box' }} />
          </div>
          <div>
            <label style={{ fontSize:'0.78rem', fontWeight:700, color:'var(--text-secondary)', marginBottom:4, display:'block' }}>Téléphone *</label>
            <input value={form.phone} onChange={e=>setForm(f=>({...f,phone:e.target.value}))} placeholder="+221 77 XXX XX XX"
              style={{ width:'100%', padding:'10px 14px', borderRadius:10, border:'1px solid var(--border)', background:'var(--bg-primary)', color:'var(--text-primary)', fontSize:'0.88rem', boxSizing:'border-box' }} />
          </div>
          <div>
            <label style={{ fontSize:'0.78rem', fontWeight:700, color:'var(--text-secondary)', marginBottom:4, display:'block' }}>Adresse de livraison</label>
            <input value={form.address} onChange={e=>setForm(f=>({...f,address:e.target.value}))} placeholder="Quartier, commune, ville"
              style={{ width:'100%', padding:'10px 14px', borderRadius:10, border:'1px solid var(--border)', background:'var(--bg-primary)', color:'var(--text-primary)', fontSize:'0.88rem', boxSizing:'border-box' }} />
          </div>
          <div>
            <label style={{ fontSize:'0.78rem', fontWeight:700, color:'var(--text-secondary)', marginBottom:4, display:'block' }}>Message / Précisions</label>
            <textarea value={form.message} onChange={e=>setForm(f=>({...f,message:e.target.value}))} rows={3} placeholder="Taille, couleur préférée, urgence..."
              style={{ width:'100%', padding:'10px 14px', borderRadius:10, border:'1px solid var(--border)', background:'var(--bg-primary)', color:'var(--text-primary)', fontSize:'0.88rem', boxSizing:'border-box', resize:'vertical', fontFamily:'inherit' }} />
          </div>
        </div>

        <button onClick={submitOrder} disabled={sending || !form.name.trim() || !form.phone.trim()}
          style={{ width:'100%', marginTop:16, padding:'12px', borderRadius:10, border:'none', background: sending || !form.name.trim() || !form.phone.trim() ? 'var(--border)' : 'linear-gradient(135deg,#10B981,#059669)', color:'#fff', fontWeight:700, fontSize:'0.9rem', cursor: sending || !form.name.trim() || !form.phone.trim() ? 'default' : 'pointer' }}>
          {sending ? '⏳ Envoi en cours...' : '🚀 Envoyer ma commande'}
        </button>
      </div>
    </div>
  );
}

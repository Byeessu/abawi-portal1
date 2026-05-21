// Données indicatives — mise à jour mai 2026
export const MARKET_DATA = [
  { label: 'USD/XOF', value: '601', change: '-0.3%', up: false },
  { label: 'EUR/XOF', value: '655.96', change: '0%', up: true },
  { label: 'BRVM Comp.', value: '268.4', change: '+1.1%', up: true },
  { label: 'Or', value: '$3 280/oz', change: '+0.6%', up: true },
  { label: 'Brent', value: '$74/bbl', change: '-1.2%', up: false },
  { label: 'Bitcoin', value: '$96K', change: '+3.1%', up: true },
  { label: 'FCFA/USDT', value: '601', change: '-0.3%', up: false },
  { label: 'Cacao', value: '10 400$/t', change: '-2.1%', up: false },
];

export const TAG_COLORS = {
  'Digital': { bg: 'var(--accent2)', text: 'var(--bg-primary)' },
  'Business': { bg: 'var(--accent)', text: 'var(--bg-primary)' },
  'Finance': { bg: 'var(--green)', text: 'var(--bg-primary)' },
  'Innovation': { bg: 'var(--accent3)', text: 'var(--bg-primary)' },
  'Education': { bg: 'var(--orange)', text: 'var(--bg-primary)' },
  'Tech': { bg: 'var(--cyan)', text: 'var(--bg-primary)' },
  'Afrique': { bg: 'var(--red)', text: 'var(--bg-primary)' },
  'Economie': { bg: 'var(--green)', text: 'var(--bg-primary)' },
  'Geopolitique': { bg: 'var(--purple)', text: 'var(--bg-primary)' },
  'Telecom': { bg: 'var(--pink)', text: 'var(--bg-primary)' },
  'IA & TECH': { bg: 'var(--cyan)', text: 'var(--bg-primary)' },
  'ECONOMIE': { bg: 'var(--green)', text: 'var(--bg-primary)' },
  'COMMERCE': { bg: 'var(--accent)', text: 'var(--bg-primary)' },
  'GEOPOLITIQUE': { bg: 'var(--purple)', text: 'var(--bg-primary)' },
  'TELECOM': { bg: 'var(--pink)', text: 'var(--bg-primary)' },
  'MATIERES': { bg: 'var(--lime)', text: 'var(--bg-primary)' },
};

export const TAG_EMOJI = {
  'Digital': '📱', 'Business': '💼', 'Finance': '📈', 'Tech': '💻',
  'Education': '🎓', 'Afrique': '🌍', 'Innovation': '🚀', 'Economie': '📊',
  'Geopolitique': '🌐', 'Telecom': '📡', 'IA & TECH': '🤖', 'ECONOMIE': '📊',
  'COMMERCE': '🏪', 'GEOPOLITIQUE': '🌐', 'TELECOM': '📡', 'MATIERES': '🌾',
};

export const DEMO_NEWS = [
  { id: 'd1', ti: "Le Senegal enregistre une croissance de 8,3% en 2025 tiree par le petrole et le gaz", su: "Le Senegal consolide sa position de locomotive economique en Afrique de l Ouest. Les revenus gaziers du projet Sangomar et du Grand Tortue Ahmeyim commencent a structurer les finances publiques. Le FMI prevoit une acceleration des investissements etrangers directs dans les secteurs de l energie et des infrastructures. L Etat compte reinjecter une partie des revenus petroliers dans la diversification economique, notamment l agriculture, la peche et le numerique. Les banques de developpement s engagent a financer les chaines de valeur locales pour eviter la maladie neerlandaise.", tag: 'Economie', dt: '9 avril 2026', rt: '5 min', pr: true },
  { id: 'd2', ti: "Wave leve 100 millions de dollars pour conquerir l Afrique francophone", su: "Le leader du mobile money senegalais vient de boucler une serie C de 100 millions de dollars, la plus importante levee de fonds fintech en Afrique de l Ouest depuis 2024. Wave compte deployer ses services dans cinq nouveaux pays d ici fin 2026, en commencant par la Cote d Ivoire et le Burkina Faso. La startup a deja traite plus de 15 milliards de dollars de transactions en 2025 et affiche une croissance mensuelle de 12%. Cette levee permettra de renforcer la securite, d embaucher 300 ingenieurs et de lancer des produits de credit et d epargne.", tag: 'Telecom', dt: '8 avril 2026', rt: '4 min', pr: true },
  { id: 'd3', ti: "Les startups africaines en IA attirent les plus grands fonds mondiaux", su: "Les investissements en intelligence artificielle sur le continent africain ont triple en dix-huit mois pour atteindre 850 millions de dollars. Dakar, Lagos et Nairobi forment un triangle innovant qui concentre 70% des projets. Les fonds Sequoia, Partech et Y Combinator ont ouvert des bureaux regionaux. L Afrique compte desormais plus de 400 startups actives dans le machine learning, le NLP africain et l agriculture de precision. Les gouvernements lancent des strategies nationales IA pour capter ces flux.", tag: 'Tech', dt: '7 avril 2026', rt: '6 min', pr: true },
  { id: 'd4', ti: "Le e-commerce senegalais franchit la barre des 200 milliards FCFA en 2025", su: "Le commerce en ligne au Senegal a progresse de 45% sur un an, porte par les ventes via WhatsApp Business, Instagram et des plateformes locales comme Afrikrea et Jumia. Les jeunes entrepreneurs digitalisent le commerce de proximite en proposant des livraisons en moins d une heure dans Dakar. Les paiements mobile et la confiance croissante des consommateurs expliquent cette dynamique. Le gouvernement travaille sur un cadre fiscal specifique pour encadrer ce boom tout en soutenant l innovation.", tag: 'Business', dt: '6 avril 2026', rt: '5 min', pr: true },
  { id: 'd5', ti: "Le G5 Sahel se restructure face a une menace securitaire qui s etend", su: "Les chefs d Etat du Sahel ont decide lors du sommet de Niamey de renforcer leur cooperation operationnelle face a l intensification des attaques terroristes. La creation d une force conjointe de 10 000 hommes est prevue pour juin 2026. Les partenaires internationaux promettent 2 milliards de dollars pour financer la stabilisation, l education et l emploi des jeunes dans les zones frontalieres. Cette reponse integree marque un tournant dans la strategie antiterroriste de la region.", tag: 'Geopolitique', dt: '5 avril 2026', rt: '7 min', pr: true },
  { id: 'd6', ti: "La BRVM gagne 12% au premier trimestre, les valeurs bancaires en tete", su: "La Bourse Regionale des Valeurs Mobilieres affiche sa meilleure performance trimestrielle depuis 2019. Les banques et les operateurs telecoms tirent l indice vers le haut dans un contexte de stabilite monetaire BCEAO. Le volume des transactions a atteint 85 milliards FCFA, en hausse de 28%. Les investisseurs etrangers institutionnels renouent avec les marches ouest-africains apres une periode d observation. Les analystes prevoient une poursuite de cette tendance soutenue par les resultats des societes cotees.", tag: 'Finance', dt: '4 avril 2026', rt: '4 min', pr: true },
  { id: 'd7', ti: "Un fonds de 50 milliards FCFA pour transformer 10 000 PME senegalaises", su: "Le gouvernement senegalais et la Banque Centrale des Etats de l Afrique de l Ouest lancent un fonds dedie a la transformation numerique des petites et moyennes entreprises. Ce fonds prevoit des subventions allant jusqu a 5 millions FCFA par entreprise pour l acquisition de logiciels, la formation des equipes et la digitalisation des processus. L objectif est de permettre aux PME d acceder aux marches regionaux via des plateformes e-commerce et de moderniser leur gestion.", tag: 'Digital', dt: '3 avril 2026', rt: '5 min', pr: true },
  { id: 'd8', ti: "Free Senegal obtient la licence 5G, le deploiement commence en juin", su: "L Autorite de Regulation des Telecoms et des Postes a attribue la premiere licence 5G au Senegal a Free, suivie de proche par Orange et Expresso. Le deploiement progressif debutera a Dakar et s etendra aux regions cles d ici fin 2027. Les vitesses annoncees atteindront 1 Gbps, ouvrant la voie a la telemedecine, aux villes intelligentes et a l industrie 4.0. Les operateurs ont investi 80 milliards FCFA dans la modernisation de leurs infrastructures pour accompagner cette transition majeure.", tag: 'Telecom', dt: '2 avril 2026', rt: '4 min', pr: true },
  { id: 'd9', ti: "Les plateformes agritech revolutionnent les campagnes senegalaises", su: "Des startups comme SenAgri et FarmConnect facilitent la connexion directe entre 25 000 producteurs ruraux et les acheteurs urbains. Les rendements moyens ont progresse de 18% grace aux conseils agronomiques par SMS et aux previsions meteorologiques par IA. Les pertes post-recolte ont chute de 30% grace aux plateformes de logistique frais. L Etat prevoit de generaliser ces solutions dans les regions de Kaolack, Kolda et Matam d ici 2027 pour renforcer la souverainete alimentaire.", tag: 'Business', dt: '1 avril 2026', rt: '5 min', pr: true },
  { id: 'd10', ti: "La Zlecaf entre en vigueur avec 46 pays, le Senegal se positionne", su: "La Zone de libre-echange continentale africaine lance officiellement ses premiers echanges tarifaires preferentiels entre les pays signataires. Le Senegal, avec ses accords de partenariat dans l agroalimentaire et la pharmacie, vise une augmentation de 25% de ses exportations regionales d ici 2028. Les industriels locaux investissent dans la certification des normes pour acceder aux marches nigerian, egyptien et sud-africain. La Zlecaf represente un marche de 1,4 milliard de consommateurs avec un PIB cumule de 3 400 milliards de dollars.", tag: 'Economie', dt: '31 mars 2026', rt: '6 min', pr: true },
];

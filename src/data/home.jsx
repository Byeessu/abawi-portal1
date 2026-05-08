import AcademyIcon from '../components/icons/AcademyIcon';
import DigitalIcon from '../components/icons/DigitalIcon';
import NewsIcon from '../components/icons/NewsIcon';

export const sections = [
  {
    title: 'ABAWI Digital',
    desc: 'Guides PDF premium. Marketing digital, business, productivité et stratégies concrètes pour entreprendre.',
    path: '/digital',
    color: 'gold',
    icon: <DigitalIcon />,
  },
  {
    title: 'ABAWI Academy',
    desc: 'Fascicules scolaires et universitaires. Du Bac aux études supérieures — cours, exercices corrigés et préparation concours.',
    path: '/academy',
    color: 'green',
    icon: <AcademyIcon />,
  },
  {
    title: 'ABAWI News',
    desc: "L'actualité économique décryptée. Sources fiables et vérifiées. Actualité économique du Sénégal et de l'Afrique de l'Ouest.",
    path: '/news',
    color: 'green',
    icon: <NewsIcon />,
  },
];

export const stats = [
  { value: '70+', label: 'Guides premium' },
  { value: '100+', label: 'Fascicules scolaires' },
  { value: '75+', label: 'Podcasts audio' },
  { value: '✓', label: 'Sources vérifiées' },
];

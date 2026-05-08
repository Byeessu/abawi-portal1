import XLSX from 'xlsx';
import { createClient } from '@supabase/supabase-js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Utiliser les valeurs par défaut depuis supabase.js
const supabaseUrl = 'https://nqpfmnsecjhqxuvfkqhi.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5xcGZtbnNlY2pocXh1dmZrcWhpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQzODI0MDgsImV4cCI6MjA4OTk1ODQwOH0.BCSmlEUmieRHFzT9AfIpSbauOCd2whl-NqQW-W0HIno';

const supabase = createClient(supabaseUrl, supabaseKey);

// Images Unsplash améliorées par catégorie
const CATEGORY_IMAGES = {
  'PC PORTABLE': [
    'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=800&q=80',
    'https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?w=800&q=80',
    'https://images.unsplash.com/photo-1593640408182-31c70c8268f5?w=800&q=80',
    'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&q=80',
  ],
  'PC BUREAU': [
    'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=800&q=80',
    'https://images.unsplash.com/photo-1593640408182-31c70c8268f5?w=800&q=80',
    'https://images.unsplash.com/photo-1587831990711-23ca6441447b?w=800&q=80',
  ],
  'IMPRIMANTE': [
    'https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6?w=800&q=80',
    'https://images.unsplash.com/photo-1563205764-9f5b8f066f91?w=800&q=80',
    'https://images.unsplash.com/photo-1618336753974-aae8e04506aa?w=800&q=80',
    'https://images.unsplash.com/photo-1614064641938-3bbee52942c7?w=800&q=80',
  ],
  'ECRAN': [
    'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=800&q=80',
    'https://images.unsplash.com/photo-1587132749359-3e6e1e8f1b7b?w=800&q=80',
  ],
  'CLAVIER': [
    'https://images.unsplash.com/photo-1587829741301-dc798b91add1?w=800&q=80',
    'https://images.unsplash.com/photo-1595225476474-87563907a212?w=800&q=80',
  ],
  'SOURIS': [
    'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=800&q=80',
    'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=800&q=80',
  ],
  'DISQUE DUR': [
    'https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?w=800&q=80',
    'https://images.unsplash.com/photo-1563205764-9f5b8f066f91?w=800&q=80',
  ],
  'RAM': [
    'https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?w=800&q=80',
    'https://images.unsplash.com/photo-1563205764-9f5b8f066f91?w=800&q=80',
  ],
  'WEBCAM': [
    'https://images.unsplash.com/photo-1587826080692-f439cd0b70da?w=800&q=80',
    'https://images.unsplash.com/photo-1588508065123-287b28e013da?w=800&q=80',
  ],
  'CASQUE': [
    'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80',
    'https://images.unsplash.com/photo-1618366712018-f77ae64c9083?w=800&q=80',
  ],
  'SAC': [
    'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&q=80',
    'https://images.unsplash.com/photo-1621360841013-c768371e93cf?w=800&q=80',
  ],
  'SERVICES': [
    'https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?w=800&q=80',
  ],
};

function clean(s) { return (s || '').toString().trim(); }
function stripHtml(s) { return clean(s).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim(); }
function firstImage(imgs) {
  const s = clean(imgs);
  return s ? (s.split(',')[0].trim() || null) : null;
}
function allImages(imgs) {
  const s = clean(imgs);
  return s ? s.split(',').map(x => x.trim()).filter(Boolean) : [];
}

function getBetterImage(category, name, existingImage) {
  // Si l'image existante est déjà une image Unsplash de bonne qualité, la garder
  if (existingImage && existingImage.includes('unsplash.com') && existingImage.includes('w=800')) {
    return existingImage;
  }
  
  // Sinon, choisir une image aléatoire de la catégorie
  const categoryUpper = category ? category.toUpperCase() : 'SERVICES';
  const images = CATEGORY_IMAGES[categoryUpper] || CATEGORY_IMAGES['SERVICES'];
  const randomIndex = Math.floor(Math.random() * images.length);
  return images[randomIndex];
}

async function importProducts() {
  console.log('� Vérification du schéma de la table store_products...');
  const { data: schemaData, error: schemaError } = await supabase
    .from('store_products')
    .select('*')
    .limit(1);
  
  if (schemaError) {
    console.error('Erreur lecture schéma:', schemaError);
  } else if (schemaData && schemaData.length > 0) {
    console.log('📋 Colonnes disponibles:', Object.keys(schemaData[0]));
  } else {
    console.log('⚠️ Table vide ou inaccessible, utilisation des champs par défaut');
  }
  
  console.log('�📂 Lecture du fichier Excel...');
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);
  const wb = XLSX.readFile(join(__dirname, '../public/ABAWI_PC_Imprimantes_SEO_IMPROVED.xlsx'));
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet);
  
  console.log(`✅ ${rows.length} produits trouvés dans le fichier Excel`);
  
  const products = rows.map((r, index) => {
    const published = r['Published'];
    const actif = published === '1' || published === 1 || published === true || String(published).toLowerCase() === 'true' || String(published).toLowerCase() === 'yes';
    const featured = r['Featured'];
    const isFeatured = featured === '1' || featured === 1 || featured === true || String(featured).toLowerCase() === 'true' || String(featured).toLowerCase() === 'yes';
    
    const category = clean(r['Categories']) || 'Divers';
    const existingImage = firstImage(r['Images']);
    const betterImage = getBetterImage(category, r['Name'], existingImage);
    
    return {
      nom: clean(r['Name']),
      categorie: category,
      description: stripHtml(r['Description']),
      prix: parseInt(r['Regular price']) || 0,
      image_url: betterImage,
      actif: actif,
      stock: parseInt(r['Stock']) || (r['In stock?'] === '1' ? 10 : 0),
    };
  }).filter(p => p.nom);
  
  console.log(`📦 ${products.length} produits à importer après filtrage`);
  
  // Supprimer tous les produits existants (mode replace)
  console.log('🗑️ Suppression des produits existants...');
  const { error: deleteError } = await supabase.from('store_products').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  if (deleteError) {
    console.error('Erreur suppression:', deleteError);
  } else {
    console.log('✅ Produits existants supprimés');
  }
  
  // Importer par lots
  const batchSize = 20;
  let done = 0;
  const errors = [];
  
  for (let i = 0; i < products.length; i += batchSize) {
    const batch = products.slice(i, i + batchSize);
    console.log(`📤 Import du lot ${Math.floor(i / batchSize) + 1}/${Math.ceil(products.length / batchSize)} (${batch.length} produits)...`);
    
    const { error } = await supabase.from('store_products').insert(batch);
    if (error) {
      errors.push({ batch: Math.floor(i / batchSize) + 1, message: error.message });
      console.error(`❌ Erreur lot ${Math.floor(i / batchSize) + 1}:`, error.message);
    } else {
      console.log(`✅ Lot ${Math.floor(i / batchSize) + 1} importé avec succès`);
    }
    done += batch.length;
  }
  
  console.log('\n📊 Résumé:');
  console.log(`- Produits importés: ${done}/${products.length}`);
  console.log(`- Erreurs: ${errors.length}`);
  
  if (errors.length > 0) {
    console.log('\n⚠️ Détails des erreurs:');
    errors.forEach(e => console.log(`  - Lot ${e.batch}: ${e.message}`));
  }
  
  console.log('\n✅ Import terminé !');
}

importProducts().catch(console.error);

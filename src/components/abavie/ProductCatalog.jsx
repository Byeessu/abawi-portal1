import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';

const DEFAULT_PRODUCTS = [
  // ── Digitaux ──
  { id: 'p1', name: 'Template Business Plan Pro', category: 'digital', subcategory: 'template', price: 15000, currency: 'XOF', description: 'Template complet avec projections financières, modèle canvas et pitch deck.', stock: 999, image: '📊', seller: 'ABAWI Studio' },
  { id: 'p2', name: 'Pack CV Premium + Lettre', category: 'digital', subcategory: 'template', price: 5000, currency: 'XOF', description: '5 modèles de CV ATS-friendly + 3 lettres de motivation adaptables.', stock: 999, image: '📄', seller: 'ABAWI Studio' },
  { id: 'p3', name: 'Cours Marketing Digital Sénégal', category: 'digital', subcategory: 'cours', price: 25000, currency: 'XOF', description: '40h de vidéo : SEO, réseaux sociaux, publicité Meta, emailing.', stock: 999, image: '🎓', seller: 'ABAWI Academy' },
  { id: 'p4', name: 'E-book : Lancer son Startup', category: 'digital', subcategory: 'ebook', price: 3500, currency: 'XOF', description: 'Guide pratique du founder africain : levée de fonds, juridique, growth.', stock: 999, image: '📚', seller: 'ABAWI Editions' },
  { id: 'p5', name: 'Script Automatisation WhatsApp', category: 'digital', subcategory: 'logiciel', price: 12000, currency: 'XOF', description: 'Bot WhatsApp Business API avec intégration catalogue et paiement.', stock: 50, image: '🤖', seller: 'DevTeam ABAWI' },
  { id: 'p6', name: 'Pack Icônes ABAWI Pro (300 SVG)', category: 'digital', subcategory: 'design', price: 8000, currency: 'XOF', description: '300 icônes vectorielles style line, solid et duotone. Licence commerciale.', stock: 999, image: '🎨', seller: 'ABAWI Studio' },
  { id: 'p7', name: 'API Clé — 10k requêtes/mois', category: 'digital', subcategory: 'service', price: 10000, currency: 'XOF', description: 'Accès API ABAWI 360 : CRM, facturation, analytics, messagerie.', stock: 200, image: '⚡', seller: 'ABAWI Cloud' },
  { id: 'p8', name: 'Template Site E-commerce React', category: 'digital', subcategory: 'template', price: 35000, currency: 'XOF', description: 'Template complet Next.js + Stripe + Supabase. Responsive, dark mode.', stock: 30, image: '🛒', seller: 'ABAWI Studio' },
  // ── Physiques ──
  { id: 'p9', name: 'T-shirt ABAWI Édition Limitée', category: 'physical', subcategory: 'merch', price: 8000, currency: 'XOF', description: '100% coton bio, sérigraphie dorée. Tailles S à XXL.', stock: 45, image: '👕', seller: 'ABAWI Merch' },
  { id: 'p10', name: 'Mug Thermos ABAWI 500ml', category: 'physical', subcategory: 'merch', price: 5500, currency: 'XOF', description: 'Inox double paroi, gravure laser logo ABAWI. 12h chaud/froid.', stock: 78, image: '☕', seller: 'ABAWI Merch' },
  { id: 'p11', name: 'Sac à Dos Laptop 15" Pro', category: 'physical', subcategory: 'accessoire', price: 18000, currency: 'XOF', description: 'Nylon imperméable, compartiment laptop + organiseur cables.', stock: 23, image: '🎒', seller: 'ABAWI Gear' },
  { id: 'p12', name: 'Kit Station Travail Nomade', category: 'physical', subcategory: 'equipement', price: 45000, currency: 'XOF', description: 'Support laptop pliable + hub USB-C 7-en-1 + tapis antidérapant.', stock: 12, image: '💻', seller: 'ABAWI Gear' },
  { id: 'p13', name: 'Carnet ABAWI Gold Edition', category: 'physical', subcategory: 'papeterie', price: 6500, currency: 'XOF', description: 'Cuir vegan doré, 200 pages lignées, marque-page doré.', stock: 60, image: '📓', seller: 'ABAWI Merch' },
  { id: 'p14', name: 'Webcam HD 1080p + Ring Light', category: 'physical', subcategory: 'equipement', price: 32000, currency: 'XOF', description: 'Caméra 1080p 30fps + ring light 6" avec trépied flexible.', stock: 18, image: '📷', seller: 'ABAWI Gear' },
  { id: 'p15', name: 'Casque Bluetooth ANC Pro', category: 'physical', subcategory: 'equipement', price: 55000, currency: 'XOF', description: 'Réduction active du bruit, 30h autonomie, micro intégré.', stock: 15, image: '🎧', seller: 'ABAWI Gear' },
];

const CATEGORIES = [
  { id: 'all', label: 'Tout', emoji: '🏪' },
  { id: 'digital', label: 'Digitaux', emoji: '💾' },
  { id: 'physical', label: 'Physiques', emoji: '📦' },
];

const SUBCATEGORIES = {
  digital: [
    { id: 'template', label: 'Templates', emoji: '📐' },
    { id: 'cours', label: 'Cours', emoji: '🎓' },
    { id: 'ebook', label: 'E-books', emoji: '📚' },
    { id: 'logiciel', label: 'Logiciels', emoji: '💻' },
    { id: 'design', label: 'Design', emoji: '🎨' },
    { id: 'service', label: 'Services API', emoji: '🔌' },
  ],
  physical: [
    { id: 'merch', label: 'Merch', emoji: '👕' },
    { id: 'accessoire', label: 'Accessoires', emoji: '🔌' },
    { id: 'equipement', label: 'Équipement', emoji: '🖥️' },
    { id: 'papeterie', label: 'Papeterie', emoji: '📓' },
  ],
};

export default function ProductCatalog({ onShareProduct }) {
  const { membre } = useAuth();
  const [products, setProducts] = useState(() => {
    try {
      const saved = localStorage.getItem('abtalk_catalog_products');
      return saved ? JSON.parse(saved) : DEFAULT_PRODUCTS;
    } catch { return DEFAULT_PRODUCTS; }
  });
  const [cart, setCart] = useState(() => {
    try { return JSON.parse(localStorage.getItem('abtalk_catalog_cart') || '[]'); } catch { return []; }
  });
  const [wishlist, setWishlist] = useState(() => {
    try { return JSON.parse(localStorage.getItem('abtalk_catalog_wishlist') || '[]'); } catch { return []; }
  });
  const [filterCat, setFilterCat] = useState('all');
  const [filterSub, setFilterSub] = useState('all');
  const [search, setSearch] = useState('');
  const [view, setView] = useState('grid'); // 'grid' | 'add'
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showCart, setShowCart] = useState(false);

  // New product form
  const [newProduct, setNewProduct] = useState({
    name: '', description: '', price: '', category: 'digital', subcategory: 'template', stock: '', image: '📦'
  });

  useEffect(() => {
    localStorage.setItem('abtalk_catalog_products', JSON.stringify(products));
  }, [products]);
  useEffect(() => {
    localStorage.setItem('abtalk_catalog_cart', JSON.stringify(cart));
  }, [cart]);
  useEffect(() => {
    localStorage.setItem('abtalk_catalog_wishlist', JSON.stringify(wishlist));
  }, [wishlist]);

  const filtered = useMemo(() => {
    let list = products;
    if (filterCat !== 'all') list = list.filter(p => p.category === filterCat);
    if (filterSub !== 'all') list = list.filter(p => p.subcategory === filterSub);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(p => p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q) || p.seller.toLowerCase().includes(q));
    }
    return list;
  }, [products, filterCat, filterSub, search]);

  function addToCart(product) {
    setCart(prev => {
      const exists = prev.find(c => c.id === product.id);
      if (exists) return prev.map(c => c.id === product.id ? { ...c, qty: c.qty + 1 } : c);
      return [...prev, { ...product, qty: 1 }];
    });
  }

  function removeFromCart(id) {
    setCart(prev => prev.filter(c => c.id !== id));
  }

  function updateCartQty(id, qty) {
    if (qty <= 0) { removeFromCart(id); return; }
    setCart(prev => prev.map(c => c.id === id ? { ...c, qty } : c));
  }

  function toggleWishlist(id) {
    setWishlist(prev => prev.includes(id) ? prev.filter(w => w !== id) : [...prev, id]);
  }

  function shareProduct(product) {
    const text = `🛍️ *${product.name}* — ${product.price.toLocaleString()} ${product.currency}\n${product.description}\nVendeur: ${product.seller}`;
    window.dispatchEvent(new CustomEvent('abtalk-insert-template', { detail: text }));
    onShareProduct?.(product);
  }

  function addProduct() {
    if (!newProduct.name.trim() || !newProduct.price) return;
    const p = {
      id: 'custom-' + Date.now(),
      name: newProduct.name.trim(),
      description: newProduct.description.trim(),
      price: Number(newProduct.price),
      currency: 'XOF',
      category: newProduct.category,
      subcategory: newProduct.subcategory,
      stock: Number(newProduct.stock) || 1,
      image: newProduct.image,
      seller: membre?.nom || 'Moi',
    };
    setProducts(prev => [p, ...prev]);
    setNewProduct({ name: '', description: '', price: '', category: 'digital', subcategory: 'template', stock: '', image: '📦' });
    setView('grid');
  }

  const cartTotal = cart.reduce((sum, c) => sum + c.price * c.qty, 0);
  const cartCount = cart.reduce((sum, c) => sum + c.qty, 0);

  if (selectedProduct) {
    const p = selectedProduct;
    const inWishlist = wishlist.includes(p.id);
    const inCart = cart.find(c => c.id === p.id);
    return (
      <div className="abv-catalog-detail">
        <div className="abv-catalog-detail-header">
          <button className="abv-biz-back" onClick={() => setSelectedProduct(null)}>← Retour</button>
        </div>
        <div className="abv-catalog-detail-hero">
          <div className="abv-catalog-detail-image">{p.image}</div>
          <div className="abv-catalog-detail-info">
            <span className={`abv-catalog-badge abv-catalog-badge--${p.category}`}>{p.category === 'digital' ? '💾 Digital' : '📦 Physique'}</span>
            <h4>{p.name}</h4>
            <p className="abv-catalog-detail-seller">par {p.seller}</p>
            <p className="abv-catalog-detail-price">{p.price.toLocaleString()} {p.currency}</p>
            <p className="abv-catalog-detail-desc">{p.description}</p>
            <div className="abv-catalog-detail-actions">
              <button className="abv-catalog-btn abv-catalog-btn--primary" onClick={() => { addToCart(p); }}>
                {inCart ? `🛒 ${inCart.qty} dans le panier` : 'Ajouter au panier'}
              </button>
              <button className={`abv-catalog-btn${inWishlist ? ' is-active' : ''}`} onClick={() => toggleWishlist(p.id)}>
                {inWishlist ? '❤️' : '🤍'} Souhait
              </button>
              <button className="abv-catalog-btn" onClick={() => shareProduct(p)}>📤 Partager</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (view === 'add') {
    const subs = SUBCATEGORIES[newProduct.category] || [];
    return (
      <div className="abv-catalog-add">
        <div className="abv-catalog-detail-header">
          <button className="abv-biz-back" onClick={() => setView('grid')}>← Retour</button>
        </div>
        <div className="abv-biz-label">Ajouter un produit</div>
        <div className="abv-catalog-form">
          <input placeholder="Nom du produit" value={newProduct.name} onChange={e => setNewProduct(p => ({ ...p, name: e.target.value }))} />
          <textarea placeholder="Description" value={newProduct.description} onChange={e => setNewProduct(p => ({ ...p, description: e.target.value }))} rows={3} />
          <div className="abv-catalog-form-row">
            <input type="number" placeholder="Prix (XOF)" value={newProduct.price} onChange={e => setNewProduct(p => ({ ...p, price: e.target.value }))} />
            <input type="number" placeholder="Stock" value={newProduct.stock} onChange={e => setNewProduct(p => ({ ...p, stock: e.target.value }))} />
          </div>
          <div className="abv-catalog-form-row">
            <select value={newProduct.category} onChange={e => { const cat = e.target.value; setNewProduct(p => ({ ...p, category: cat, subcategory: (SUBCATEGORIES[cat] || [])[0]?.id || 'template' })); }}>
              <option value="digital">Digital</option>
              <option value="physical">Physique</option>
            </select>
            <select value={newProduct.subcategory} onChange={e => setNewProduct(p => ({ ...p, subcategory: e.target.value }))}>
              {subs.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
            </select>
          </div>
          <input placeholder="Emoji image (ex: 📦)" value={newProduct.image} onChange={e => setNewProduct(p => ({ ...p, image: e.target.value }))} maxLength={2} />
          <button className="abv-catalog-btn abv-catalog-btn--primary" onClick={addProduct}>➕ Publier le produit</button>
        </div>
      </div>
    );
  }

  return (
    <div className="abv-catalog">
      {/* Header toolbar */}
      <div className="abv-catalog-toolbar">
        <div className="abv-catalog-search">
          <span>🔍</span>
          <input placeholder="Rechercher un produit…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <button className="abv-catalog-toolbar-btn" onClick={() => setShowCart(v => !v)} title="Panier">
          🛒 {cartCount > 0 && <span className="abv-catalog-toolbar-badge">{cartCount}</span>}
        </button>
        <button className="abv-catalog-toolbar-btn" onClick={() => setView('add')} title="Ajouter">➕</button>
      </div>

      {/* Cart drawer */}
      {showCart && (
        <div className="abv-cart-drawer">
          <div className="abv-cart-header">
            <span>🛒 Panier ({cartCount})</span>
            <button onClick={() => setShowCart(false)}>✕</button>
          </div>
          {cart.length === 0 ? (
            <div className="abv-cart-empty">Votre panier est vide</div>
          ) : (
            <>
              <div className="abv-cart-list">
                {cart.map(c => (
                  <div key={c.id} className="abv-cart-item">
                    <span>{c.image}</span>
                    <div className="abv-cart-item-info">
                      <span>{c.name}</span>
                      <span>{(c.price * c.qty).toLocaleString()} {c.currency}</span>
                    </div>
                    <div className="abv-cart-item-qty">
                      <button onClick={() => updateCartQty(c.id, c.qty - 1)}>−</button>
                      <span>{c.qty}</span>
                      <button onClick={() => updateCartQty(c.id, c.qty + 1)}>+</button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="abv-cart-total">
                <strong>Total : {cartTotal.toLocaleString()} XOF</strong>
                <button className="abv-catalog-btn abv-catalog-btn--primary" onClick={() => alert('Passage au paiement via ABAWI Pay…')}>💳 Commander</button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Category filters */}
      <div className="abv-catalog-cats">
        {CATEGORIES.map(c => (
          <button key={c.id} className={`abv-catalog-cat${filterCat === c.id ? ' is-active' : ''}`} onClick={() => { setFilterCat(c.id); setFilterSub('all'); }}>
            {c.emoji} {c.label}
          </button>
        ))}
      </div>

      {/* Subcategory filters */}
      {filterCat !== 'all' && SUBCATEGORIES[filterCat] && (
        <div className="abv-catalog-subs">
          <button className={`abv-catalog-sub${filterSub === 'all' ? ' is-active' : ''}`} onClick={() => setFilterSub('all')}>Tout</button>
          {SUBCATEGORIES[filterCat].map(s => (
            <button key={s.id} className={`abv-catalog-sub${filterSub === s.id ? ' is-active' : ''}`} onClick={() => setFilterSub(s.id)}>
              {s.emoji} {s.label}
            </button>
          ))}
        </div>
      )}

      {/* Product grid */}
      <div className="abv-catalog-grid">
        {filtered.map(p => {
          const inWishlist = wishlist.includes(p.id);
          const inCart = cart.find(c => c.id === p.id);
          return (
            <div key={p.id} className="abv-catalog-card" onClick={() => setSelectedProduct(p)}>
              <div className="abv-catalog-card-image">{p.image}</div>
              <div className="abv-catalog-card-body">
                <div className="abv-catalog-card-name">{p.name}</div>
                <div className="abv-catalog-card-meta">
                  <span className="abv-catalog-card-price">{p.price.toLocaleString()} {p.currency}</span>
                  <span className="abv-catalog-card-stock">{p.stock < 20 ? `⚠️ ${p.stock} restants` : '✅ En stock'}</span>
                </div>
                <div className="abv-catalog-card-actions" onClick={e => e.stopPropagation()}>
                  <button className="abv-catalog-card-btn" onClick={() => addToCart(p)} title="Ajouter au panier">
                    {inCart ? `🛒 ${inCart.qty}` : '🛒'}
                  </button>
                  <button className={`abv-catalog-card-btn${inWishlist ? ' is-active' : ''}`} onClick={() => toggleWishlist(p.id)} title="Souhait">
                    {inWishlist ? '❤️' : '🤍'}
                  </button>
                  <button className="abv-catalog-card-btn" onClick={() => shareProduct(p)} title="Partager">📤</button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="abv-catalog-empty">Aucun produit trouvé</div>
      )}
    </div>
  );
}

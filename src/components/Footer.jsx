import logo from '/logo.svg'
import './Footer.css'
import { Link } from 'react-router-dom'

function Footer() {
  return (
    <footer className="footer">
      <div className="footer-inner">
        <div className="footer-grid">
          <div className="footer-col">
            <img src={logo} alt="ABAWI" height="36" className="footer-logo" />
            <h4 className="footer-heading" style={{ color: '#4CAF50' }}>ABAWI Digital</h4>
            <ul>
              <li><Link to="/digital">Tous les guides</Link></li>
              <li><Link to="/digital">Marketing Digital</Link></li>
              <li><Link to="/digital">Business en ligne</Link></li>
              <li><Link to="/digital">Productivité</Link></li>
              <li><Link to="/plans">ABAWI Plus</Link></li>
            </ul>
          </div>

          <div className="footer-col">
            <h4 className="footer-heading footer-heading--green">ABAWI Academy</h4>
            <ul>
              <li><Link to="/academy">Tous les fascicules</Link></li>
              <li><Link to="/academy">Mathématiques</Link></li>
              <li><Link to="/academy">Physique-Chimie</Link></li>
              <li><Link to="/academy">Français</Link></li>
              <li><Link to="/academy">Philosophie</Link></li>
            </ul>
          </div>

          <div className="footer-col">
            <h4 className="footer-heading footer-heading--green">ABAWI News</h4>
            <ul>
              <li><Link to="/news">Économie</Link></li>
              <li><Link to="/news">Tech & IA</Link></li>
              <li><Link to="/news">Télécoms</Link></li>
              <li><Link to="/news">Matières premières</Link></li>
              <li><Link to="/news">Géopolitique</Link></li>
            </ul>
          </div>

          <div className="footer-col">
            <h4 className="footer-heading footer-heading--green">Solutions Business</h4>
            <ul>
              <li><Link to="/offres-commerciales">Offres commerciales</Link></li>
              <li><Link to="/catalogue">Catalogue produits</Link></li>
              <li><Link to="/presentation">Présentation ABAWI</Link></li>
              <li><Link to="/store">Store IT</Link></li>
              <li><Link to="/abavie">Abavie Santé</Link></li>
            </ul>
          </div>

          <div className="footer-col">
            <h4 className="footer-heading">Contact</h4>
            <ul className="footer-contact">
              <li>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
                VDN Liberté 6 Extension, Dakar
              </li>
              <li>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--whatsapp)" strokeWidth="2"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6A19.79 19.79 0 012.12 4.18 2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg>
                <a href="https://wa.me/221775185050" target="_blank" rel="noopener noreferrer">77 518 50 50</a>
              </li>
            </ul>
            <Link to="/admin" className="footer-admin-link">Admin</Link>
            <div className="footer-social">
              <a href="https://www.instagram.com/abawi_sn" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
              </a>
              <a href="https://www.facebook.com/abawisenegal" target="_blank" rel="noopener noreferrer" aria-label="Facebook">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
              </a>
              <a href="https://www.tiktok.com/@abawi_sn" target="_blank" rel="noopener noreferrer" aria-label="TikTok">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 00-.79-.05A6.34 6.34 0 003.15 15.2a6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.34-6.34V8.7a8.18 8.18 0 004.76 1.52v-3.4a4.85 4.85 0 01-1-.13z"/></svg>
              </a>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <p>&copy; 2026 ABAWI SN. Tous droits réservés.</p>
          <div className="footer-bottom-links">
            <Link to="/docs">Aide & Documentation</Link>
            <Link to="/a-propos">À propos</Link>
            <Link to="/mentions-legales">Mentions légales</Link>
            <Link to="/cgu">CGU</Link>
            <Link to="/politique-confidentialite">Confidentialité</Link>
            <Link to="/politique-cookies">Cookies</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer

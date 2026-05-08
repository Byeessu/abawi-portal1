import { useState, useEffect } from 'react';
import SEO from '../components/SEO';
import ChatSidebar from '../components/abavie/ChatSidebar';
import ChatWindow from '../components/abavie/ChatWindow';
import ExternalSend from '../components/abavie/ExternalSend';
import { abavieSettings } from '../lib/abavieSettings';
import './Abavie.css';
export { AbavieLogoSVG } from '../components/abavie/AbavieLogoSVG';

const WALLPAPER_STYLES = {
  'gradient-1': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  'gradient-2': 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  'gradient-3': 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
  'dots': 'radial-gradient(circle, rgba(255,255,255,0.08) 1px, transparent 1px)',
  'lines': 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.03) 10px, rgba(255,255,255,0.03) 20px)',
  'mesh': 'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
  'abstract-1': 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
  'abstract-2': 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)',
  'abstract-3': 'linear-gradient(135deg, #1e3c72 0%, #2a5298 50%, #1e3c72 100%)',
};

export default function Abavie() {
  const [activeChat, setActiveChat] = useState(null);
  const [showChat, setShowChat] = useState(false);
  const [showExternal, setShowExternal] = useState(false);
  const [externalBody, setExternalBody] = useState('');
  const [themeColor, setThemeColor] = useState(() => abavieSettings.get('theme_color'));
  const [wallpaper, setWallpaper] = useState(() => abavieSettings.get('chat_wallpaper'));

  useEffect(() => {
    const handler = () => {
      setThemeColor(abavieSettings.get('theme_color'));
      setWallpaper(abavieSettings.get('chat_wallpaper'));
    };
    window.addEventListener('abavie-settings-change', handler);
    return () => window.removeEventListener('abavie-settings-change', handler);
  }, []);

  function handleSelectChat(conv) {
    setActiveChat(conv);
    setShowChat(true);
  }

  function handleOpenExternal(body) {
    setExternalBody(body);
    setShowExternal(true);
  }

  const pageStyle = wallpaper && WALLPAPER_STYLES[wallpaper]
    ? { background: WALLPAPER_STYLES[wallpaper] }
    : {};

  return (
    <div className={`abv-page abv-theme--${themeColor || 'green'}`} style={pageStyle}>
      <SEO title="ABAWI — Messagerie" description="Messagerie sécurisée nouvelle génération pour les membres ABAWI." />
      <ChatSidebar activeChat={activeChat} onSelectChat={handleSelectChat} hidden={showChat} />
      <ChatWindow conversation={activeChat} visible={showChat} onBack={() => setShowChat(false)} onOpenExternal={handleOpenExternal} />
      {showExternal && <ExternalSend body={externalBody} onClose={() => setShowExternal(false)} />}
    </div>
  );
}

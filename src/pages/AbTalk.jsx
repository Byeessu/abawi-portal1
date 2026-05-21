import { useState, useEffect } from 'react';
import SEO from '../components/SEO';
import ChatSidebar from '../components/abavie/ChatSidebar';
import ChatWindow from '../components/abavie/ChatWindow';
import ExternalSend from '../components/abavie/ExternalSend';
import GlobalSearch from '../components/abavie/GlobalSearch';
import { abTalkSettings } from '../lib/abTalkSettings';
import { supabase } from '../lib/supabase';
import './AbTalk.css';
export { AbTalkLogoSVG } from '../components/clair/AbTalkLogoSVG';

/* ================================================================
   Fonds disponibles — classés par luminosité (clairs en premier)
   ================================================================ */
const WALLPAPERS = [
  { id: 'clair-blanc',   label: 'Blanc pur',      preview: '#FAFAFA' },
  { id: 'clair-sky',     label: 'Ciel doux',       preview: '#E0F2FE' },
  { id: 'clair-mint',    label: 'Menthe',          preview: '#DCFCE7' },
  { id: 'clair-lavande', label: 'Lavande',         preview: '#EDE9FE' },
  { id: 'clair-peche',   label: 'Pêche',           preview: '#FED7AA' },
  { id: 'dots-clair',    label: 'Points discrets', preview: '#F8FAFC' },
  { id: 'nuit-bleu',     label: 'Nuit bleue',      preview: '#1e3c72' },
  { id: 'nuit-violet',   label: 'Nuit violet',     preview: '#0f0c29' },
]

export default function AbTalk() {
  const [activeChat, setActiveChat] = useState(null);
  const [showChat, setShowChat] = useState(false);
  const [showExternal, setShowExternal] = useState(false);
  const [externalBody, setExternalBody] = useState('');
  const [themeColor, setThemeColor] = useState(() => abTalkSettings.get('theme_color') || 'sky');
  const [wallpaper, setWallpaper] = useState(() => abTalkSettings.get('chat_wallpaper'));
  const [showGlobalSearch, setShowGlobalSearch] = useState(false);
  const [jumpTo, setJumpTo] = useState(null);

  useEffect(() => {
    const handler = () => {
      setThemeColor(abTalkSettings.get('theme_color') || 'sky');
      setWallpaper(abTalkSettings.get('chat_wallpaper'));
    };
    window.addEventListener('abtalk-settings-change', handler);
    return () => window.removeEventListener('abtalk-settings-change', handler);
  }, []);

  function handleSelectChat(conv) {
    setActiveChat(conv);
    setShowChat(true);
  }

  function handleOpenExternal(body) {
    setExternalBody(body);
    setShowExternal(true);
  }

  function handleJumpToMessage(convId, msgId) {
    setJumpTo({ convId, msgId });
  }

  // Navigue vers la bonne conversation puis ChatWindow s'occupe du scroll
  useEffect(() => {
    if (!jumpTo) return;
    const { convId, msgId } = jumpTo;
    if (activeChat?.id === convId) {
      // La conversation est déjà ouverte — on re-déclenche le jumpTo
      setJumpTo({ convId, msgId, ts: Date.now() });
      return;
    }
    supabase
      .from('conversations')
      .select('*')
      .eq('id', convId)
      .single()
      .then(({ data }) => {
        if (data) handleSelectChat(data);
      });
  }, [jumpTo?.convId, jumpTo?.msgId]); // eslint-disable-line react-hooks/exhaustive-deps

  const wallpaperClass = wallpaper ? `abv-wp--${wallpaper}` : '';

  return (
    <div className={`abv-page abv-theme--${themeColor} ${wallpaperClass}`}>
      <SEO
        title="AbTalk — La messagerie qui s'adapte"
        description="Messagerie intelligente ABAWI : discussions sécurisées, appels, partage de fichiers et recherche globale. La messagerie qui s'adapte à vous."
      />
      <ChatSidebar
        activeChat={activeChat}
        onSelectChat={handleSelectChat}
        hidden={showChat}
        onOpenGlobalSearch={() => setShowGlobalSearch(true)}
      />
      <ChatWindow
        conversation={activeChat}
        visible={showChat}
        onBack={() => setShowChat(false)}
        onOpenExternal={handleOpenExternal}
        jumpTo={jumpTo}
      />
      {showExternal && (
        <ExternalSend body={externalBody} onClose={() => setShowExternal(false)} />
      )}
      <GlobalSearch
        visible={showGlobalSearch}
        onClose={() => setShowGlobalSearch(false)}
        onJumpToMessage={handleJumpToMessage}
      />
    </div>
  );
}

import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useEffect, lazy, Suspense } from 'react'
// Critical — loaded synchronously (above-the-fold, every page)
import Navbar  from './components/Navbar'
import Home    from './pages/Home'
import './App.css'
import { BackgroundJobsProvider } from './context/BackgroundJobsContext'
import RouteAnalytics from './components/RouteAnalytics'

// Non-critical UI — deferred after initial render (no layout shift risk)
const Footer                 = lazy(() => import('./components/Footer'))
const InstallBanner          = lazy(() => import('./components/InstallBanner'))
const WhatsAppButton         = lazy(() => import('./components/WhatsAppButton'))
const MiniPlayer             = lazy(() => import('./components/MiniPlayer'))
const BackgroundJobsIndicator = lazy(() => import('./components/BackgroundJobsIndicator'))
const CookieConsent          = lazy(() => import('./components/CookieConsent'))
const FullscreenButton       = lazy(() => import('./components/FullscreenButton'))
const ContactSupport         = lazy(() => import('./components/ContactSupport'))
const RoutePrefetcher        = lazy(() => import('./components/RoutePrefetcher'))

// Lazy-loaded pages — each route gets its own chunk.
// Home is intentionally NOT lazy: it is the landing page, so deferring its
// chunk just adds a visible blank flash before render.
const Store = lazy(() => import('./pages/Store'))
const StoreTest = lazy(() => import('./pages/StoreTest'))
const StoreProductDetail = lazy(() => import('./pages/StoreProductDetail'))
const AbavieStore = lazy(() => import('./pages/AbavieStore'))
const AbavieProductDetail = lazy(() => import('./pages/AbavieProductDetail'))
const News = lazy(() => import('./pages/News'))
const Digital = lazy(() => import('./pages/Digital'))
const Academy = lazy(() => import('./pages/Academy'))
const Podcasts = lazy(() => import('./pages/Podcasts'))
const VideoDetail = lazy(() => import('./pages/detail/VideoDetail'))
const APropos = lazy(() => import('./pages/APropos'))
const Documentation = lazy(() => import('./pages/Documentation'))
const MentionsLegales = lazy(() => import('./pages/MentionsLegales'))
const PolitiqueConfidentialite = lazy(() => import('./pages/PolitiqueConfidentialite'))
const CGU = lazy(() => import('./pages/CGU'))
const PolitiqueCookies = lazy(() => import('./pages/PolitiqueCookies'))
const NewsAdmin = lazy(() => import('./pages/NewsAdmin'))
const Merci = lazy(() => import('./pages/Merci'))
const MerciAbonnement = lazy(() => import('./pages/MerciAbonnement'))
const AbawiPlus = lazy(() => import('./pages/AbawiPlus'))
const Plans = lazy(() => import('./pages/Plans'))
const Favoris = lazy(() => import('./pages/Favoris'))
const GuideDetail = lazy(() => import('./pages/detail/GuideDetail'))
const ArticleDetail = lazy(() => import('./pages/detail/ArticleDetail'))
const FasciculeDetail = lazy(() => import('./pages/detail/FasciculeDetail'))
const PodcastDetail = lazy(() => import('./pages/detail/PodcastDetail'))
const PackDetail = lazy(() => import('./pages/detail/PackDetail'))
const Admin = lazy(() => import('./pages/admin/Admin'))
const Membre = lazy(() => import('./pages/membre/Membre'))
const Inscription = lazy(() => import('./pages/membre/Inscription'))
const Login = lazy(() => import('./pages/membre/Login'))
const BienvenueVip = lazy(() => import('./pages/membre/BienvenueVip'))
const Outils = lazy(() => import('./pages/outils/Outils'))
const CVCreator = lazy(() => import('./pages/outils/CVCreator'))
const LettreMotivation = lazy(() => import('./components/outils/LettreMotivation'))
const BusinessPlan = lazy(() => import('./pages/outils/BusinessPlanEliteSimple'))
const PitchDeck = lazy(() => import('./pages/outils/PitchDeck'))
const FactureCreator = lazy(() => import('./pages/outils/FactureCreator'))
const AnalyseCV = lazy(() => import('./pages/outils/AnalyseCV'))
const DictionnaireElite = lazy(() => import('./pages/outils/DictionnaireElite'))
const AbawiTranslatorElite = lazy(() => import('./pages/outils/AbawiTranslatorElite'))
const InfographiePro = lazy(() => import('./pages/outils/InfographiePro'))
const PhotoStudioPro = lazy(() => import('./pages/outils/PhotoStudioPro'))
const AudioStudioElite = lazy(() => import('./pages/outils/AudioStudioElite'))
const StudioVisuelPro = lazy(() => import('./pages/outils/StudioVisuelPro'))
const SmartOfficeDemo = lazy(() => import('./pages/SmartOfficeDemo'))
const SmartOffice = lazy(() => import('./pages/SmartOffice'))
const SimpleSmartOffice = lazy(() => import('./components/SimpleSmartOffice'))
const ProfessionalEditor = lazy(() => import('./components/ProfessionalEditor'))
const CleanProfessionalEditor = lazy(() => import('./components/CleanProfessionalEditor'))
const AbawiStudioPhotoVideoPro = lazy(() => import('./components/AbawiStudioPhotoVideoPro'))
const AnnahAIInterface = lazy(() => import('./components/AnnahAIInterface'))
const ThemeAwareEditor = lazy(() => import('./components/ThemeAwareEditor'))
const BusinessIntelligenceDashboard = lazy(() => import('./components/BusinessIntelligenceDashboard'))
const BackgroundJobPanel = lazy(() => import('./components/BackgroundJobPanel'))
const APIHealthPanel = lazy(() => import('./components/APIHealthPanel'))
const FinanceEliteSimple = lazy(() => import('./pages/outils/FinanceEliteSimple'))
const CommercialOffers = lazy(() => import('./components/marketing/CommercialOffers'))
const CatalogueViewer = lazy(() => import('./components/marketing/CatalogueViewer'))
const BrochureTemplate = lazy(() => import('./components/marketing/BrochureTemplate'))
const PresentationDeck = lazy(() => import('./components/marketing/PresentationDeck'))
const ConsultantEliteSimple = lazy(() => import('./pages/outils/ConsultantEliteSimple'))
const ComptableEliteSimple = lazy(() => import('./pages/outils/ComptableEliteSimple'))
const RHEliteSimple = lazy(() => import('./pages/outils/RHEliteSimple'))
const ImmobilierEliteSimple = lazy(() => import('./pages/outils/ImmobilierEliteSimple'))
const JuridiqueElite = lazy(() => import('./pages/outils/JuridiqueElite'))
const AbawiIA = lazy(() => import('./pages/outils/AbawiIA'))
const AbawiExegetika = lazy(() => import('./pages/outils/AbawiExegetika'))
const AbawiAutoRoute = lazy(() => import('./pages/outils/AbawiAutoRoute'))
const AbZone       = lazy(() => import('./pages/outils/AbZone'))
const AbSpaceGPS   = lazy(() => import('./pages/outils/AbSpaceGPS'))
const ArkelUpCenter= lazy(() => import('./pages/ArkelUpCenter'))
const Tontine = lazy(() => import('./pages/outils/Tontine'))
const SmartWordEditor = lazy(() => import('./pages/outils/SmartWordEditor'))
const MaxAvisElite = lazy(() => import('./pages/outils/MaxAvisElite'))
const MaxAvisPublicForm = lazy(() => import('./pages/MaxAvisPublicForm'))
const ImagePro = lazy(() => import('./pages/outils/ImagePro'))
const FormatConverter = lazy(() => import('./pages/outils/FormatConverter'))
const Credits = lazy(() => import('./pages/Credits'))
const AbawiPay = lazy(() => import('./pages/AbawiPay'))
const QRCodePro    = lazy(() => import('./pages/outils/QRCodePro'))
const ProCardElite = lazy(() => import('./pages/outils/ProCardElite'))
const SenTicket = lazy(() => import('./pages/outils/SenTicket'))
const Abschool = lazy(() => import('./pages/outils/Abschool'))
const RecruteMoiSN = lazy(() => import('./pages/outils/RecruteMoiSN'))
const EspaceOuvrier = lazy(() => import('./pages/outils/EspaceOuvrier'))
const AbaviePage = lazy(() => import('./pages/Abavie'))
const AbTalk = lazy(() => import('./pages/AbTalk'))
const BusinessPage = lazy(() => import('./pages/BusinessPage'))
const AbawiBank = lazy(() => import('./pages/AbawiBank'))
const Abawi360 = lazy(() => import('./pages/Abawi360'))
const CRM = lazy(() => import('./pages/abawi360/CRM'))
const Planification = lazy(() => import('./pages/abawi360/Planification'))
const Statistiques = lazy(() => import('./pages/abawi360/Statistiques'))
const Marketing = lazy(() => import('./pages/abawi360/Marketing'))
const AbawiStudioPro = lazy(() => import('./pages/abawi360/AbawiStudioPro'))
const DissecteurInfosElite = lazy(() => import('./pages/abawi360/DissecteurInfosElite'))
const HistoryManager = lazy(() => import('./components/HistoryManager'))


function PageLoader() {
  return (
    <div style={{
      minHeight: '60vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 16,
    }}>
      <div style={{
        position: 'relative',
        width: 56, height: 56,
      }}>
        <div style={{
          position: 'absolute', inset: 0,
          border: '3px solid rgba(240,180,41,0.15)',
          borderTopColor: '#F0B429',
          borderRadius: '50%',
          animation: 'spin 0.9s cubic-bezier(0.68, -0.55, 0.27, 1.55) infinite',
        }} />
        <div style={{
          position: 'absolute',
          inset: 10,
          border: '3px solid rgba(240,180,41,0.08)',
          borderTopColor: 'rgba(240,180,41,0.45)',
          borderRadius: '50%',
          animation: 'spin 0.7s linear infinite reverse',
        }} />
      </div>
      <div style={{
        fontSize: '0.78rem',
        color: '#8B95A5',
        letterSpacing: '2px',
        textTransform: 'uppercase',
        fontWeight: 700,
      }}>
        Chargement
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => { window.scrollTo({ top: 0, behavior: 'instant' }) }, [pathname])
  return null
}

// Affiche le bouton plein écran — pill labellisé sur les outils, icône discrète ailleurs.
function GlobalFullscreenLauncher() {
  const { pathname } = useLocation()
  const blocked =
    pathname === '/' ||
    pathname.startsWith('/cgu') ||
    pathname.startsWith('/mentions') ||
    pathname.startsWith('/politique') ||
    pathname.startsWith('/merci') ||
    pathname.startsWith('/inscription') ||
    pathname.startsWith('/connexion') ||
    pathname.startsWith('/login') ||
    pathname.startsWith('/admin')
  if (blocked) return null
  return <FullscreenButton position="bottom-right" />
}

function App() {
  return (
    <BackgroundJobsProvider>
    <div className="app">
      <ScrollToTop />
      <RouteAnalytics />
      <GlobalFullscreenLauncher />
      <Navbar />
      <div className="page-content">
        <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/news" element={<News />} />
          <Route path="/news/:slug" element={<ArticleDetail />} />
          <Route path="/recrutement" element={<Navigate to="/outils/recrute-moi-sn" replace />} />
          <Route path="/digital" element={<Digital />} />
          <Route path="/digital/pack/abawi-plus/inscription" element={<Inscription />} />
          <Route path="/digital/pack/abawi-plus" element={<AbawiPlus />} />
          <Route path="/digital/pack/:slug" element={<PackDetail />} />
          <Route path="/digital/:slug" element={<GuideDetail />} />
          <Route path="/academy" element={<Academy />} />
          <Route path="/academy/pack/:slug" element={<PackDetail />} />
          <Route path="/academy/:slug" element={<FasciculeDetail />} />
          <Route path="/podcasts" element={<Podcasts />} />
          <Route path="/podcasts/:slug" element={<PodcastDetail />} />
          <Route path="/videos/:slug" element={<VideoDetail />} />
          <Route path="/store" element={<Store />} />
          <Route path="/store-test" element={<StoreTest />} />
          <Route path="/store/:id" element={<StoreProductDetail />} />
          <Route path="/boutique-sante" element={<AbavieStore />} />
          <Route path="/boutique-sante/:id" element={<AbavieProductDetail />} />
          <Route path="/outils" element={<Outils />} />
          <Route path="/outils/cv" element={<CVCreator />} />
          <Route path="/outils/lettre" element={<LettreMotivation />} />
          <Route path="/outils/business-plan" element={<BusinessPlan />} />
          <Route path="/outils/pitch" element={<PitchDeck />} />
          <Route path="/outils/facture" element={<FactureCreator />} />
          <Route path="/outils/qr-code-pro" element={<QRCodePro />} />
          <Route path="/outils/pro-card-elite" element={<ProCardElite />} />
          <Route path="/offres-commerciales" element={<CommercialOffers />} />
          <Route path="/catalogue" element={<CatalogueViewer />} />
          <Route path="/brochure" element={<BrochureTemplate />} />
          <Route path="/presentation" element={<PresentationDeck />} />
          <Route path="/outils/analyse-cv" element={<AnalyseCV />} />
          <Route path="/outils/dictionnaire-elite" element={<DictionnaireElite />} />
          <Route path="/outils/translator-elite" element={<AbawiTranslatorElite />} />
          <Route path="/outils/infographie-pro" element={<InfographiePro />} />
          <Route path="/outils/photo-studio-pro" element={<PhotoStudioPro />} />
          <Route path="/outils/audio-studio-elite" element={<AudioStudioElite />} />
          <Route path="/outils/format-converter" element={<FormatConverter />} />
          <Route path="/outils/studio-visuel-pro" element={<StudioVisuelPro />} />
          <Route path="/outils/finance" element={<FinanceEliteSimple />} />
          <Route path="/smart-office-demo" element={<SmartOfficeDemo />} />
          <Route path="/smart-office" element={<SmartOffice />} />
          <Route path="/outils/smart-office" element={<SmartOffice />} />
          <Route path="/smart-office-test" element={<SimpleSmartOffice />} />
          <Route path="/professional-editor" element={<ProfessionalEditor />} />
          <Route path="/clean-editor" element={<CleanProfessionalEditor />} />
          <Route path="/studio-photo-video" element={<AbawiStudioPhotoVideoPro />} />
          <Route path="/annah-ai" element={<AnnahAIInterface />} />
          <Route path="/theme-aware-editor" element={<ThemeAwareEditor />} />
          <Route path="/business-intelligence" element={<BusinessIntelligenceDashboard />} />
          <Route path="/background-jobs" element={<BackgroundJobPanel />} />
          <Route path="/api-health" element={<APIHealthPanel />} />
          <Route path="/outils/juridique" element={<JuridiqueElite />} />
          <Route path="/outils/comptable" element={<ComptableEliteSimple />} />
          <Route path="/outils/rh" element={<RHEliteSimple />} />
          <Route path="/outils/immobilier" element={<ImmobilierEliteSimple />} />
          <Route path="/outils/consultant" element={<ConsultantEliteSimple />} />
          <Route path="/outils/abawi-ia" element={<AbawiIA />} />
          <Route path="/outils/exegetika" element={<AbawiExegetika />} />
          <Route path="/outils/sante" element={<AbaviePage />} />
          <Route path="/outils/autoroute" element={<AbawiAutoRoute />} />
          <Route path="/outils/editeur-pro" element={<SmartWordEditor />} />
          <Route path="/outils/smart-word-editor" element={<SmartWordEditor />} />
          <Route path="/outils/maxavis" element={<MaxAvisElite />} />
          <Route path="/outils/image-pro" element={<ImagePro />} />
          <Route path="/maxavis/:surveyId" element={<MaxAvisPublicForm />} />
          <Route path="/historique" element={<HistoryManager />} />
          <Route path="/outils/abzone" element={<AbZone />} />
          <Route path="/outils/abspacegps" element={<AbSpaceGPS />} />
          <Route path="/arkel-up-center" element={<ArkelUpCenter />} />
          <Route path="/outils/tontine" element={<Tontine />} />
          <Route path="/credits" element={<Credits />} />
          <Route path="/abawi-pay" element={<AbawiPay />} />
          <Route path="/outils/senticket" element={<SenTicket />} />
          <Route path="/outils/abschool" element={<Abschool />} />
          <Route path="/outils/recrute-moi-sn" element={<RecruteMoiSN />} />
          <Route path="/outils/espace-ouvrier" element={<EspaceOuvrier />} />
          <Route path="/outils/place-ouvrier" element={<EspaceOuvrier />} />
          <Route path="/abavie" element={<AbaviePage />} />
          <Route path="/abtalk" element={<AbTalk />} />
          <Route path="/business" element={<BusinessPage />} />
          <Route path="/abawi-bank" element={<AbawiBank />} />
          <Route path="/abawi360" element={<Abawi360 />} />
          <Route path="/abawi360/crm" element={<CRM />} />
          <Route path="/abawi360/planification" element={<Planification />} />
          <Route path="/abawi360/statistiques" element={<Statistiques />} />
          <Route path="/abawi360/marketing" element={<Marketing />} />
          <Route path="/abawi360/studio-pro" element={<AbawiStudioPro />} />
          <Route path="/abawi360/dissecteur-elite" element={<DissecteurInfosElite />} />
          <Route path="/docs" element={<Documentation />} />
          <Route path="/a-propos" element={<APropos />} />
          <Route path="/mentions-legales" element={<MentionsLegales />} />
          <Route path="/politique-confidentialite" element={<PolitiqueConfidentialite />} />
          <Route path="/cgu" element={<CGU />} />
          <Route path="/politique-cookies" element={<PolitiqueCookies />} />
          <Route path="/news/admin" element={<NewsAdmin />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/login" element={<Login />} />
          <Route path="/inscription" element={<Inscription />} />
          <Route path="/membre" element={<Membre />} />
          <Route path="/plans" element={<Plans />} />
          <Route path="/abawi-plus" element={<Navigate to="/digital/pack/abawi-plus" replace />} />
          <Route path="/abawi-plus/inscription" element={<Navigate to="/digital/pack/abawi-plus/inscription" replace />} />
          <Route path="/bienvenue-vip" element={<BienvenueVip />} />
          <Route path="/merci" element={<Merci />} />
          <Route path="/merci-abonnement" element={<MerciAbonnement />} />
          <Route path="/favoris" element={<Favoris />} />
        </Routes>
        </Suspense>
      </div>
      {/* Non-critical shell — lazy, no visible fallback = no layout shift */}
      <Suspense fallback={null}>
        <Footer />
        <MiniPlayer />
        <WhatsAppButton />
        <ContactSupport />
        <InstallBanner />
        <BackgroundJobsIndicator />
        <CookieConsent />
        <RoutePrefetcher />
      </Suspense>
    </div>
    </BackgroundJobsProvider>
  )
}

export default App

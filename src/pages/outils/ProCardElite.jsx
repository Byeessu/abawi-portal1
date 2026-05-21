import { useState, useEffect, useRef } from 'react';
import SEO from '../../components/SEO'
import QRCode from 'qrcode';
import { useAuth } from '../../context/AuthContext';
import ToolHero from '../../components/ToolHero';
import ToolInfoPanel from '../../components/ToolInfoPanel';
import { useToolGuard } from '../../hooks/useToolGuard'
import ToolUpsellModal, { ToolGuardBadge } from '../../components/ToolUpsellModal'

// ─── Real SVG Brand Icons ─────────────────────────────────────────────────────
const BRAND_ICONS = {
  whatsapp:  { color:'#25D366', path:'M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.272-.099-.47-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.273.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347M11.99 2C6.476 2 2 6.477 2 12c0 1.873.515 3.63 1.41 5.136L2 22l4.984-1.31A9.96 9.96 0 0011.99 22C17.515 22 22 17.523 22 12S17.515 2 11.99 2z' },
  instagram: { color:'#E1306C', path:'M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z' },
  linkedin:  { color:'#0A66C2', path:'M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z' },
  twitter:   { color:'#000000', path:'M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.748l7.73-8.835L1.254 2.25H8.08l4.259 5.63 5.905-5.63zm-1.161 17.52h1.833L7.084 4.126H5.117z' },
  facebook:  { color:'#1877F2', path:'M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z' },
  github:    { color:'#181717', path:'M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12' },
  tiktok:    { color:'#000000', path:'M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z' },
  youtube:   { color:'#FF0000', path:'M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z' },
  telegram:  { color:'#26A5E4', path:'M11.944 0A12 12 0 000 12a12 12 0 0012 12 12 12 0 0012-12A12 12 0 0012 0a12 12 0 00-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 01.171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z' },
  discord:   { color:'#5865F2', path:'M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057c.002.022.011.043.031.056a19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z' },
  behance:   { color:'#1769FF', path:'M7.443 5.35c.639 0 1.23.05 1.77.149.539.099.998.276 1.381.53.38.254.679.593.898 1.017.218.424.326.945.326 1.565 0 .67-.151 1.231-.454 1.682-.302.451-.754.82-1.356 1.108.82.237 1.428.655 1.824 1.254.398.598.595 1.312.595 2.14 0 .671-.129 1.254-.389 1.748-.258.495-.61.901-1.057 1.22-.447.317-.963.549-1.553.695-.59.145-1.207.217-1.852.217H0V5.35h7.443zm-.443 5.263c.532 0 .966-.124 1.3-.37.333-.248.5-.633.5-1.159 0-.29-.053-.535-.16-.731a1.14 1.14 0 00-.43-.46 1.807 1.807 0 00-.617-.237 3.546 3.546 0 00-.73-.07H2.884v3.027h4.116zm.174 5.507c.268 0 .521-.027.762-.083a1.87 1.87 0 00.637-.274 1.37 1.37 0 00.43-.516c.107-.213.16-.473.16-.782 0-.638-.18-1.086-.539-1.344-.36-.257-.836-.386-1.43-.386H2.884v3.385h4.29zM19.895 9.2c.392.388.59.942.592 1.663H14.67c.03.695.23 1.216.6 1.563.368.348.844.521 1.428.521.389 0 .726-.097 1.009-.293.284-.196.48-.408.588-.637h2.022c-.325 1.006-.825 1.723-1.505 2.152-.68.428-1.498.643-2.453.643-.667 0-1.268-.11-1.804-.33-.534-.22-.99-.534-1.365-.944-.373-.41-.662-.903-.866-1.476-.203-.574-.304-1.196-.304-1.869 0-.649.107-1.25.321-1.804.214-.555.516-1.035.905-1.439.39-.404.859-.72 1.406-.944.547-.226 1.152-.338 1.815-.338.74 0 1.387.141 1.938.422.552.281 1.006.665 1.362 1.149.356.484.61 1.044.762 1.68.152.636.195 1.313.126 2.028h-5.503c.025-.604.233-1.079.592-1.427.36-.348.815-.521 1.365-.521.41 0 .755.1 1.035.297.278.197.466.44.563.737h2.022c-.093-.639-.326-1.2-.697-1.633zm-2.46-2.566H14.27V5.35h3.165v1.284z' },
  dribbble:  { color:'#EA4C89', path:'M12 24C5.385 24 0 18.615 0 12S5.385 0 12 0s12 5.385 12 12-5.385 12-12 12zm10.12-10.358c-.35-.11-3.17-.953-6.384-.438 1.34 3.684 1.887 6.684 1.992 7.308 2.3-1.555 3.936-4.02 4.395-6.87zm-6.115 7.808c-.153-.9-.75-4.032-2.19-7.77l-.066.02c-5.79 2.015-7.86 6.017-8.04 6.404 1.73 1.35 3.92 2.165 6.29 2.165 1.42 0 2.77-.29 4-.814zm-11.62-2.071c.232-.396 3.045-5.055 8.332-6.765.135-.045.27-.084.405-.12-.26-.585-.54-1.167-.832-1.74C7.17 11.775 2.206 11.71 1.756 11.7l-.004.312c0 2.633.998 5.037 2.634 6.855zm-2.42-8.955c.46.008 4.683.026 9.477-1.248-1.698-3.018-3.53-5.558-3.8-5.928-2.868 1.35-5.01 3.99-5.676 7.176zM9.6 2.052c.282.38 2.145 2.914 3.822 6 3.645-1.365 5.19-3.44 5.373-3.702-1.81-1.61-4.19-2.586-6.795-2.586-.477 0-.945.04-1.4.112zm13.44 9.21c-.236-.09-2.764-.88-5.584-.382.737 2.02 1.304 4.07 1.498 5.693 1.81-1.243 3.09-3.127 3.593-5.304z' },
}
function SocialIcon({ id, size = 20, className = '' }) {
  const b = BRAND_ICONS[id]
  if (!b) return <span style={{ fontSize: size * 0.65 }}>●</span>
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={b.color} className={className} aria-hidden>
      <path d={b.path} />
    </svg>
  )
}

// ─── Mini inline SVG icons for card fields ────────────────────────────────────
const MiniIcon = {
  user:      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  briefcase: <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>,
  building:  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21h18M5 21V7l10-4v18M19 21V11l-4-2"/></svg>,
  phone:     <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>,
  mail:      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>,
  globe:     <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>,
  pin:       <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>,
};

// ─── Digital Card Templates ───────────────────────────────────────────────────
const DIGITAL_TPLS = [
  {
    id:'neo-minimal', name:'Neo Minimal', tier:'PRO',
    wrap: { background:'#F8FAFC' },
    card: { background:'#FFFFFF', border:'1px solid #E8ECF0', borderRadius:24, boxShadow:'0 20px 60px rgba(0,0,0,0.08), 0 4px 16px rgba(0,0,0,0.04)' },
    hdr:  { background:'linear-gradient(135deg,#EEF2FF,#F0F9FF)', borderBottom:'1px solid #E8ECF0', padding:'28px 28px 24px' },
    accent:'#2563EB', nameColor:'#111827', titleColor:'#6B7280', companyColor:'#2563EB',
    btnBg:'#F8FAFC', btnBorder:'#E2E8F0', btnText:'#374151',
    socialBg:'#F1F5F9', socialBorder:'#E2E8F0',
    pillBg:'rgba(37,99,235,0.08)', pillBorder:'rgba(37,99,235,0.2)', pillText:'#2563EB',
  },
  {
    id:'midnight-gold', name:'Midnight Gold', tier:'PREMIUM',
    wrap: { background:'linear-gradient(160deg,#0a0a14,#14102a,#1a1033)' },
    card: { background:'linear-gradient(160deg,#0a0a14 0%,#14102a 50%,#1a0d2e 100%)', border:'1px solid rgba(240,180,41,0.18)', borderRadius:24, boxShadow:'0 24px 70px rgba(0,0,0,0.5), 0 0 40px rgba(240,180,41,0.08)' },
    hdr:  { background:'transparent', borderBottom:'1px solid rgba(240,180,41,0.12)', padding:'28px 28px 24px' },
    accent:'#F0B429', nameColor:'#FFFFFF', titleColor:'rgba(255,255,255,0.6)', companyColor:'#F0B429',
    btnBg:'rgba(255,255,255,0.05)', btnBorder:'rgba(255,255,255,0.1)', btnText:'rgba(255,255,255,0.85)',
    socialBg:'rgba(255,255,255,0.06)', socialBorder:'rgba(255,255,255,0.1)',
    pillBg:'rgba(240,180,41,0.1)', pillBorder:'rgba(240,180,41,0.25)', pillText:'#F0B429',
    pattern:'dots',
  },
  {
    id:'aurora', name:'Aurora', tier:'PREMIUM',
    wrap: { background:'linear-gradient(135deg,#1a0d3d,#2d1b69,#3730a3)' },
    card: { background:'linear-gradient(160deg,#1a0d3d 0%,#2d1b69 50%,#1e1b4b 100%)', border:'1px solid rgba(139,92,246,0.3)', borderRadius:24, boxShadow:'0 24px 70px rgba(99,102,241,0.3), inset 0 1px 0 rgba(255,255,255,0.06)' },
    hdr:  { background:'transparent', borderBottom:'1px solid rgba(255,255,255,0.06)', padding:'28px 28px 24px' },
    accent:'#A78BFA', nameColor:'#FFFFFF', titleColor:'rgba(255,255,255,0.65)', companyColor:'#A78BFA',
    btnBg:'rgba(255,255,255,0.06)', btnBorder:'rgba(139,92,246,0.25)', btnText:'rgba(255,255,255,0.9)',
    socialBg:'rgba(139,92,246,0.12)', socialBorder:'rgba(139,92,246,0.25)',
    pillBg:'rgba(167,139,250,0.12)', pillBorder:'rgba(167,139,250,0.3)', pillText:'#A78BFA',
    pattern:'circuit',
  },
  {
    id:'coral-flame', name:'Coral Flame', tier:'DESIGN',
    wrap: { background:'#FFF5F0' },
    card: { background:'#FFFFFF', border:'1px solid #FDDCC7', borderRadius:24, boxShadow:'0 20px 60px rgba(249,115,22,0.1), 0 4px 16px rgba(0,0,0,0.04)' },
    hdr:  { background:'linear-gradient(135deg,#F97316,#EA580C)', borderBottom:'none', padding:'28px 28px 24px' },
    accent:'#F97316', nameColor:'#FFFFFF', titleColor:'rgba(255,255,255,0.8)', companyColor:'rgba(255,255,255,0.9)',
    hdrLight: true,
    btnBg:'#FFF5F0', btnBorder:'#FDDCC7', btnText:'#374151',
    socialBg:'#FFF5F0', socialBorder:'#FDDCC7',
    pillBg:'rgba(249,115,22,0.08)', pillBorder:'rgba(249,115,22,0.2)', pillText:'#F97316',
    bodyNameColor:'#111827', bodyTitleColor:'#6B7280', bodyCompanyColor:'#F97316',
  },
  {
    id:'glass-neon', name:'Glass Neon', tier:'DESIGN',
    wrap: { background:'linear-gradient(135deg,#0a0a1a,#1a1a2e,#0d1117)' },
    card: { background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.15)', borderRadius:24, boxShadow:'0 24px 60px rgba(0,0,0,0.5)', backdropFilter:'blur(20px)', WebkitBackdropFilter:'blur(20px)' },
    hdr:  { background:'rgba(255,255,255,0.04)', borderBottom:'1px solid rgba(255,255,255,0.08)', padding:'28px 28px 24px' },
    accent:'#00F5FF', nameColor:'#FFFFFF', titleColor:'rgba(255,255,255,0.65)', companyColor:'#00F5FF',
    btnBg:'rgba(255,255,255,0.06)', btnBorder:'rgba(0,245,255,0.2)', btnText:'rgba(255,255,255,0.85)',
    socialBg:'rgba(0,245,255,0.06)', socialBorder:'rgba(0,245,255,0.18)',
    pillBg:'rgba(0,245,255,0.08)', pillBorder:'rgba(0,245,255,0.22)', pillText:'#00F5FF',
    glow:'0 0 30px rgba(0,245,255,0.15)',
  },
  {
    id:'forest-exec', name:'Forest Executive', tier:'PREMIUM',
    wrap: { background:'linear-gradient(135deg,#012117,#022C22)' },
    card: { background:'linear-gradient(160deg,#012117 0%,#022C22 50%,#064E3B 100%)', border:'1px solid rgba(52,211,153,0.2)', borderRadius:24, boxShadow:'0 24px 70px rgba(6,78,59,0.4), inset 0 1px 0 rgba(255,255,255,0.04)' },
    hdr:  { background:'transparent', borderBottom:'1px solid rgba(52,211,153,0.12)', padding:'28px 28px 24px' },
    accent:'#34D399', nameColor:'#ECFDF5', titleColor:'rgba(236,253,245,0.6)', companyColor:'#34D399',
    btnBg:'rgba(255,255,255,0.05)', btnBorder:'rgba(52,211,153,0.2)', btnText:'rgba(236,253,245,0.85)',
    socialBg:'rgba(52,211,153,0.08)', socialBorder:'rgba(52,211,153,0.2)',
    pillBg:'rgba(52,211,153,0.1)', pillBorder:'rgba(52,211,153,0.25)', pillText:'#34D399',
    pattern:'dots',
  },
  {
    id:'rose-luxe', name:'Rose Luxe', tier:'PREMIUM',
    wrap: { background:'linear-gradient(135deg,#1f0014,#3b0026)' },
    card: { background:'linear-gradient(160deg,#1f0014 0%,#3b0026 50%,#500724 100%)', border:'1px solid rgba(249,168,212,0.2)', borderRadius:24, boxShadow:'0 24px 70px rgba(131,24,67,0.4)' },
    hdr:  { background:'transparent', borderBottom:'1px solid rgba(249,168,212,0.1)', padding:'28px 28px 24px' },
    accent:'#F9A8D4', nameColor:'#FFF1F9', titleColor:'rgba(255,241,249,0.6)', companyColor:'#F9A8D4',
    btnBg:'rgba(255,255,255,0.05)', btnBorder:'rgba(249,168,212,0.2)', btnText:'rgba(255,241,249,0.85)',
    socialBg:'rgba(249,168,212,0.08)', socialBorder:'rgba(249,168,212,0.2)',
    pillBg:'rgba(249,168,212,0.1)', pillBorder:'rgba(249,168,212,0.25)', pillText:'#F9A8D4',
  },
  {
    id:'ocean-deep', name:'Ocean Deep', tier:'DESIGN',
    wrap: { background:'linear-gradient(135deg,#01122a,#023E8A)' },
    card: { background:'linear-gradient(160deg,#01122a 0%,#023E8A 60%,#0077B6 100%)', border:'1px solid rgba(144,224,239,0.2)', borderRadius:24, boxShadow:'0 24px 70px rgba(2,62,138,0.5)' },
    hdr:  { background:'transparent', borderBottom:'1px solid rgba(144,224,239,0.12)', padding:'28px 28px 24px' },
    accent:'#90E0EF', nameColor:'#FFFFFF', titleColor:'rgba(255,255,255,0.65)', companyColor:'#90E0EF',
    btnBg:'rgba(255,255,255,0.06)', btnBorder:'rgba(144,224,239,0.2)', btnText:'rgba(255,255,255,0.9)',
    socialBg:'rgba(144,224,239,0.08)', socialBorder:'rgba(144,224,239,0.2)',
    pillBg:'rgba(144,224,239,0.1)', pillBorder:'rgba(144,224,239,0.25)', pillText:'#90E0EF',
  },
  {
    id:'ui-ux-pro', name:'UI/UX Pro', tier:'PRO',
    wrap: { background:'#F3F0FF' },
    card: { background:'#FFFFFF', border:'1px solid #D8D0F0', borderRadius:24, boxShadow:'0 20px 60px rgba(124,58,237,0.1), 0 4px 16px rgba(0,0,0,0.04)' },
    hdr:  { background:'linear-gradient(135deg,#7C3AED,#A78BFA)', borderBottom:'none', padding:'28px 28px 24px' },
    accent:'#7C3AED', nameColor:'#FFFFFF', titleColor:'rgba(255,255,255,0.8)', companyColor:'rgba(255,255,255,0.9)',
    hdrLight: true,
    btnBg:'#F3F0FF', btnBorder:'#DDD6FE', btnText:'#374151',
    socialBg:'#F3F0FF', socialBorder:'#DDD6FE',
    pillBg:'rgba(124,58,237,0.08)', pillBorder:'rgba(124,58,237,0.2)', pillText:'#7C3AED',
    bodyNameColor:'#111827', bodyTitleColor:'#6B7280', bodyCompanyColor:'#7C3AED',
  },
  {
    id:'carbon-executive', name:'Carbon Executive', tier:'PREMIUM',
    wrap: { background:'linear-gradient(135deg,#111827,#1F2937)' },
    card: { background:'linear-gradient(160deg,#111827 0%,#1F2937 50%,#374151 100%)', border:'1px solid rgba(156,163,175,0.18)', borderRadius:24, boxShadow:'0 24px 70px rgba(0,0,0,0.5), 0 0 40px rgba(255,255,255,0.04)' },
    hdr:  { background:'transparent', borderBottom:'1px solid rgba(156,163,175,0.12)', padding:'28px 28px 24px' },
    accent:'#9CA3AF', nameColor:'#F9FAFB', titleColor:'rgba(156,163,175,0.7)', companyColor:'#D1D5DB',
    btnBg:'rgba(255,255,255,0.05)', btnBorder:'rgba(156,163,175,0.12)', btnText:'rgba(243,244,246,0.85)',
    socialBg:'rgba(255,255,255,0.06)', socialBorder:'rgba(156,163,175,0.12)',
    pillBg:'rgba(209,213,219,0.1)', pillBorder:'rgba(209,213,219,0.2)', pillText:'#D1D5DB',
    pattern:'dots',
  },
  {
    id:'sahara-gold', name:'Sahara Gold', tier:'DESIGN',
    wrap: { background:'linear-gradient(135deg,#2A1B0A,#5C3A1E)' },
    card: { background:'linear-gradient(160deg,#2A1B0A 0%,#5C3A1E 50%,#8B5A2B 100%)', border:'1px solid rgba(251,191,36,0.25)', borderRadius:24, boxShadow:'0 24px 70px rgba(92,58,30,0.5)' },
    hdr:  { background:'transparent', borderBottom:'1px solid rgba(251,191,36,0.12)', padding:'28px 28px 24px' },
    accent:'#FBBF24', nameColor:'#FFFBEB', titleColor:'rgba(251,191,36,0.65)', companyColor:'#FBBF24',
    btnBg:'rgba(255,255,255,0.05)', btnBorder:'rgba(251,191,36,0.2)', btnText:'rgba(255,251,235,0.85)',
    socialBg:'rgba(251,191,36,0.08)', socialBorder:'rgba(251,191,36,0.2)',
    pillBg:'rgba(251,191,36,0.1)', pillBorder:'rgba(251,191,36,0.25)', pillText:'#FBBF24',
    pattern:'dots',
  },
  {
    id:'tokyo-neon', name:'Tokyo Neon', tier:'DESIGN',
    wrap: { background:'linear-gradient(135deg,#0a0a0a,#1a0a1a)' },
    card: { background:'linear-gradient(160deg,#0a0a0a 0%,#1a0a1a 50%,#2D1B4E 100%)', border:'1px solid rgba(236,72,153,0.25)', borderRadius:24, boxShadow:'0 24px 70px rgba(236,72,153,0.3), 0 0 40px rgba(236,72,153,0.06)' },
    hdr:  { background:'transparent', borderBottom:'1px solid rgba(236,72,153,0.12)', padding:'28px 28px 24px' },
    accent:'#EC4899', nameColor:'#FFFFFF', titleColor:'rgba(236,72,153,0.65)', companyColor:'#EC4899',
    btnBg:'rgba(255,255,255,0.05)', btnBorder:'rgba(236,72,153,0.2)', btnText:'rgba(255,255,255,0.85)',
    socialBg:'rgba(236,72,153,0.08)', socialBorder:'rgba(236,72,153,0.2)',
    pillBg:'rgba(236,72,153,0.1)', pillBorder:'rgba(236,72,153,0.25)', pillText:'#EC4899',
    pattern:'circuit',
  },
  {
    id:'ivory-elegance', name:'Ivory Elegance', tier:'PRO',
    wrap: { background:'#FAF8F5' },
    card: { background:'#FFFFFF', border:'1px solid #E7E5E4', borderRadius:24, boxShadow:'0 20px 60px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.03)' },
    hdr:  { background:'linear-gradient(135deg,#F5F5F4,#E7E5E4)', borderBottom:'1px solid #E7E5E4', padding:'28px 28px 24px' },
    accent:'#78716C', nameColor:'#292524', titleColor:'#78716C', companyColor:'#57534E',
    btnBg:'#F5F5F4', btnBorder:'#D6D3D1', btnText:'#44403C',
    socialBg:'#F5F5F4', socialBorder:'#D6D3D1',
    pillBg:'rgba(120,113,108,0.08)', pillBorder:'rgba(120,113,108,0.2)', pillText:'#78716C',
  },
  {
    id:'volcanic-red', name:'Volcanic Red', tier:'DESIGN',
    wrap: { background:'linear-gradient(135deg,#2A0A0A,#7F1D1D)' },
    card: { background:'linear-gradient(160deg,#2A0A0A 0%,#7F1D1D 50%,#991B1B 100%)', border:'1px solid rgba(252,165,165,0.2)', borderRadius:24, boxShadow:'0 24px 70px rgba(153,27,27,0.4)' },
    hdr:  { background:'transparent', borderBottom:'1px solid rgba(252,165,165,0.1)', padding:'28px 28px 24px' },
    accent:'#FCA5A5', nameColor:'#FEF2F2', titleColor:'rgba(252,165,165,0.6)', companyColor:'#FCA5A5',
    btnBg:'rgba(255,255,255,0.05)', btnBorder:'rgba(252,165,165,0.2)', btnText:'rgba(254,242,242,0.85)',
    socialBg:'rgba(252,165,165,0.08)', socialBorder:'rgba(252,165,165,0.2)',
    pillBg:'rgba(252,165,165,0.1)', pillBorder:'rgba(252,165,165,0.25)', pillText:'#FCA5A5',
  },
  {
    id:'nordic-frost', name:'Nordic Frost', tier:'PRO',
    wrap: { background:'linear-gradient(135deg,#F0F9FF,#E0F2FE)' },
    card: { background:'#FFFFFF', border:'1px solid #BAE6FD', borderRadius:24, boxShadow:'0 20px 60px rgba(14,165,233,0.08), 0 4px 16px rgba(0,0,0,0.03)' },
    hdr:  { background:'linear-gradient(135deg,#0EA5E9,#38BDF8)', borderBottom:'none', padding:'28px 28px 24px' },
    accent:'#0EA5E9', nameColor:'#FFFFFF', titleColor:'rgba(255,255,255,0.8)', companyColor:'rgba(255,255,255,0.9)',
    hdrLight: true,
    btnBg:'#F0F9FF', btnBorder:'#BAE6FD', btnText:'#0C4A6E',
    socialBg:'#F0F9FF', socialBorder:'#BAE6FD',
    pillBg:'rgba(14,165,233,0.08)', pillBorder:'rgba(14,165,233,0.2)', pillText:'#0EA5E9',
    bodyNameColor:'#0C4A6E', bodyTitleColor:'#0369A1', bodyCompanyColor:'#0EA5E9',
  },
  {
    id:'royal-velvet', name:'Royal Velvet', tier:'PREMIUM',
    wrap: { background:'linear-gradient(135deg,#1E1B4B,#312E81)' },
    card: { background:'linear-gradient(160deg,#1E1B4B 0%,#312E81 50%,#4338CA 100%)', border:'1px solid rgba(165,180,252,0.2)', borderRadius:24, boxShadow:'0 24px 70px rgba(49,46,129,0.5)' },
    hdr:  { background:'transparent', borderBottom:'1px solid rgba(165,180,252,0.1)', padding:'28px 28px 24px' },
    accent:'#A5B4FC', nameColor:'#EEF2FF', titleColor:'rgba(165,180,252,0.65)', companyColor:'#A5B4FC',
    btnBg:'rgba(255,255,255,0.05)', btnBorder:'rgba(165,180,252,0.2)', btnText:'rgba(238,242,255,0.85)',
    socialBg:'rgba(165,180,252,0.08)', socialBorder:'rgba(165,180,252,0.2)',
    pillBg:'rgba(165,180,252,0.1)', pillBorder:'rgba(165,180,252,0.25)', pillText:'#A5B4FC',
    pattern:'dots',
  },
  {
    id:'magma-orange', name:'Magma Orange', tier:'DESIGN',
    wrap: { background:'linear-gradient(135deg,#2A0A00,#7C2D12)' },
    card: { background:'linear-gradient(160deg,#2A0A00 0%,#7C2D12 50%,#9A3412 100%)', border:'1px solid rgba(251,146,60,0.2)', borderRadius:24, boxShadow:'0 24px 70px rgba(124,45,18,0.5)' },
    hdr:  { background:'transparent', borderBottom:'1px solid rgba(251,146,60,0.1)', padding:'28px 28px 24px' },
    accent:'#FB923C', nameColor:'#FFF7ED', titleColor:'rgba(251,146,60,0.65)', companyColor:'#FB923C',
    btnBg:'rgba(255,255,255,0.05)', btnBorder:'rgba(251,146,60,0.2)', btnText:'rgba(255,247,237,0.85)',
    socialBg:'rgba(251,146,60,0.08)', socialBorder:'rgba(251,146,60,0.2)',
    pillBg:'rgba(251,146,60,0.1)', pillBorder:'rgba(251,146,60,0.25)', pillText:'#FB923C',
    pattern:'circuit',
  },
  {
    id:'mint-fresh', name:'Mint Fresh', tier:'PRO',
    wrap: { background:'#ECFDF5' },
    card: { background:'#FFFFFF', border:'1px solid #A7F3D0', borderRadius:24, boxShadow:'0 20px 60px rgba(16,185,129,0.08), 0 4px 16px rgba(0,0,0,0.03)' },
    hdr:  { background:'linear-gradient(135deg,#10B981,#34D399)', borderBottom:'none', padding:'28px 28px 24px' },
    accent:'#10B981', nameColor:'#FFFFFF', titleColor:'rgba(255,255,255,0.8)', companyColor:'rgba(255,255,255,0.9)',
    hdrLight: true,
    btnBg:'#ECFDF5', btnBorder:'#A7F3D0', btnText:'#064E3B',
    socialBg:'#ECFDF5', socialBorder:'#A7F3D0',
    pillBg:'rgba(16,185,129,0.08)', pillBorder:'rgba(16,185,129,0.2)', pillText:'#10B981',
    bodyNameColor:'#064E3B', bodyTitleColor:'#047857', bodyCompanyColor:'#10B981',
  },
  {
    id:'obsidian-luxe', name:'Obsidian Luxe', tier:'PREMIUM',
    wrap: { background:'linear-gradient(135deg,#0F0F0F,#1A1A1A)' },
    card: { background:'linear-gradient(160deg,#0F0F0F 0%,#1A1A1A 50%,#262626 100%)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:24, boxShadow:'0 24px 70px rgba(0,0,0,0.6)' },
    hdr:  { background:'transparent', borderBottom:'1px solid rgba(255,255,255,0.06)', padding:'28px 28px 24px' },
    accent:'#E5E5E5', nameColor:'#FFFFFF', titleColor:'rgba(255,255,255,0.55)', companyColor:'#D4D4D4',
    btnBg:'rgba(255,255,255,0.04)', btnBorder:'rgba(255,255,255,0.08)', btnText:'rgba(255,255,255,0.75)',
    socialBg:'rgba(255,255,255,0.05)', socialBorder:'rgba(255,255,255,0.1)',
    pillBg:'rgba(255,255,255,0.08)', pillBorder:'rgba(255,255,255,0.15)', pillText:'#E5E5E5',
    pattern:'dots',
  },
  {
    id:'solar-flare', name:'Solar Flare', tier:'DESIGN',
    wrap: { background:'linear-gradient(135deg,#431407,#EA580C)' },
    card: { background:'linear-gradient(160deg,#431407 0%,#EA580C 50%,#F97316 100%)', border:'1px solid rgba(253,186,116,0.2)', borderRadius:24, boxShadow:'0 24px 70px rgba(234,88,12,0.4)' },
    hdr:  { background:'transparent', borderBottom:'1px solid rgba(253,186,116,0.1)', padding:'28px 28px 24px' },
    accent:'#FDBA74', nameColor:'#FFF7ED', titleColor:'rgba(253,186,116,0.65)', companyColor:'#FDBA74',
    btnBg:'rgba(255,255,255,0.05)', btnBorder:'rgba(253,186,116,0.2)', btnText:'rgba(255,247,237,0.85)',
    socialBg:'rgba(253,186,116,0.08)', socialBorder:'rgba(253,186,116,0.2)',
    pillBg:'rgba(253,186,116,0.1)', pillBorder:'rgba(253,186,116,0.25)', pillText:'#FDBA74',
    pattern:'circuit',
  },
  {
    id:'platinum-edge', name:'Platinum Edge', tier:'PREMIUM',
    wrap: { background:'linear-gradient(135deg,#F8FAFC,#E2E8F0)' },
    card: { background:'#FFFFFF', border:'1px solid #CBD5E1', borderRadius:24, boxShadow:'0 20px 60px rgba(100,116,139,0.08), 0 4px 16px rgba(0,0,0,0.03)' },
    hdr:  { background:'linear-gradient(135deg,#64748B,#94A3B8)', borderBottom:'none', padding:'28px 28px 24px' },
    accent:'#64748B', nameColor:'#FFFFFF', titleColor:'rgba(255,255,255,0.8)', companyColor:'rgba(255,255,255,0.9)',
    hdrLight: true,
    btnBg:'#F1F5F9', btnBorder:'#CBD5E1', btnText:'#334155',
    socialBg:'#F1F5F9', socialBorder:'#CBD5E1',
    pillBg:'rgba(100,116,139,0.08)', pillBorder:'rgba(100,116,139,0.2)', pillText:'#64748B',
    bodyNameColor:'#0F172A', bodyTitleColor:'#475569', bodyCompanyColor:'#64748B',
  },
  {
    id:'sunset-premium', name:'Sunset Premium', tier:'PREMIUM',
    wrap: { background:'linear-gradient(135deg,#4a044e,#701a75)' },
    card: { background:'linear-gradient(160deg,#4a044e 0%,#701a75 50%,#a21caf 100%)', border:'1px solid rgba(232,121,249,0.2)', borderRadius:24, boxShadow:'0 24px 70px rgba(112,26,117,0.4)' },
    hdr:  { background:'transparent', borderBottom:'1px solid rgba(232,121,249,0.1)', padding:'28px 28px 24px' },
    accent:'#E879F9', nameColor:'#FAE8FF', titleColor:'rgba(232,121,249,0.6)', companyColor:'#E879F9',
    btnBg:'rgba(255,255,255,0.05)', btnBorder:'rgba(232,121,249,0.2)', btnText:'rgba(250,232,255,0.85)',
    socialBg:'rgba(232,121,249,0.08)', socialBorder:'rgba(232,121,249,0.2)',
    pillBg:'rgba(232,121,249,0.1)', pillBorder:'rgba(232,121,249,0.25)', pillText:'#E879F9',
  },
  {
    id:'slate-minimal', name:'Slate Minimal', tier:'PRO',
    wrap: { background:'#F8FAFC' },
    card: { background:'#FFFFFF', border:'1px solid #CBD5E1', borderRadius:16, boxShadow:'0 12px 40px rgba(15,23,42,0.06), 0 2px 8px rgba(0,0,0,0.03)' },
    hdr:  { background:'transparent', borderBottom:'1px solid #E2E8F0', padding:'28px 28px 24px' },
    accent:'#475569', nameColor:'#0F172A', titleColor:'#64748B', companyColor:'#475569',
    btnBg:'#F1F5F9', btnBorder:'#CBD5E1', btnText:'#334155',
    socialBg:'#F1F5F9', socialBorder:'#CBD5E1',
    pillBg:'rgba(71,85,105,0.06)', pillBorder:'rgba(71,85,105,0.15)', pillText:'#475569',
  },
  {
    id:'emerald-pro', name:'Emerald Pro', tier:'PRO',
    wrap: { background:'#ECFDF5' },
    card: { background:'#FFFFFF', border:'1px solid #A7F3D0', borderRadius:20, boxShadow:'0 16px 48px rgba(6,95,70,0.08), 0 4px 12px rgba(0,0,0,0.03)' },
    hdr:  { background:'linear-gradient(135deg,#059669,#10B981)', borderBottom:'none', padding:'28px 28px 24px' },
    accent:'#059669', nameColor:'#FFFFFF', titleColor:'rgba(255,255,255,0.8)', companyColor:'rgba(255,255,255,0.9)',
    hdrLight: true,
    btnBg:'#ECFDF5', btnBorder:'#A7F3D0', btnText:'#064E3B',
    socialBg:'#ECFDF5', socialBorder:'#A7F3D0',
    pillBg:'rgba(5,150,105,0.08)', pillBorder:'rgba(5,150,105,0.2)', pillText:'#059669',
    bodyNameColor:'#064E3B', bodyTitleColor:'#047857', bodyCompanyColor:'#059669',
  },
  {
    id:'memphis-blast', name:'Memphis Blast', tier:'DESIGN',
    wrap: { background:'linear-gradient(135deg,#fef3c7,#fbcfe8)' },
    card: { background:'#FEF3C7', border:'1px solid #FCD34D', borderRadius:24, boxShadow:'0 20px 60px rgba(245,158,11,0.1), 0 4px 16px rgba(0,0,0,0.04)' },
    hdr:  { background:'linear-gradient(135deg,#F59E0B,#FBBF24)', borderBottom:'none', padding:'28px 28px 24px' },
    accent:'#F59E0B', nameColor:'#FFFFFF', titleColor:'rgba(255,255,255,0.8)', companyColor:'rgba(255,255,255,0.9)',
    hdrLight: true,
    btnBg:'#FEF3C7', btnBorder:'#FCD34D', btnText:'#451A03',
    socialBg:'#FEF3C7', socialBorder:'#FCD34D',
    pillBg:'rgba(245,158,11,0.08)', pillBorder:'rgba(245,158,11,0.2)', pillText:'#F59E0B',
    bodyNameColor:'#451A03', bodyTitleColor:'#92400E', bodyCompanyColor:'#F59E0B',
    pattern:'dots',
  },
  {
    id:'bauhaus-construct', name:'Bauhaus Construct', tier:'DESIGN',
    wrap: { background:'linear-gradient(135deg,#1e1b4b,#be185d)' },
    card: { background:'#1E1B4B', border:'1px solid rgba(251,191,36,0.25)', borderRadius:24, boxShadow:'0 24px 70px rgba(30,27,75,0.5)' },
    hdr:  { background:'transparent', borderBottom:'1px solid rgba(251,191,36,0.15)', padding:'28px 28px 24px' },
    accent:'#FBBF24', nameColor:'#FFFFFF', titleColor:'rgba(251,191,36,0.65)', companyColor:'#FBBF24',
    btnBg:'rgba(255,255,255,0.05)', btnBorder:'rgba(251,191,36,0.2)', btnText:'rgba(255,255,255,0.85)',
    socialBg:'rgba(251,191,36,0.08)', socialBorder:'rgba(251,191,36,0.2)',
    pillBg:'rgba(251,191,36,0.1)', pillBorder:'rgba(251,191,36,0.25)', pillText:'#FBBF24',
    pattern:'grid',
  },
  {
    id:'duotone-pop', name:'Duotone Pop', tier:'DESIGN',
    wrap: { background:'linear-gradient(135deg,#0891b2,#a855f7)' },
    card: { background:'linear-gradient(160deg,#0891B2 0%,#7C3AED 100%)', border:'1px solid rgba(167,139,250,0.3)', borderRadius:24, boxShadow:'0 24px 70px rgba(124,58,237,0.4)' },
    hdr:  { background:'transparent', borderBottom:'1px solid rgba(167,139,250,0.15)', padding:'28px 28px 24px' },
    accent:'#A78BFA', nameColor:'#FFFFFF', titleColor:'rgba(167,139,250,0.65)', companyColor:'#A78BFA',
    btnBg:'rgba(255,255,255,0.06)', btnBorder:'rgba(167,139,250,0.25)', btnText:'rgba(255,255,255,0.9)',
    socialBg:'rgba(167,139,250,0.1)', socialBorder:'rgba(167,139,250,0.25)',
    pillBg:'rgba(167,139,250,0.12)', pillBorder:'rgba(167,139,250,0.3)', pillText:'#A78BFA',
    pattern:'circuit',
  },
  {
    id:'terrazzo-warm', name:'Terrazzo Warm', tier:'PRO',
    wrap: { background:'#FAF8F5' },
    card: { background:'#FFFFFF', border:'1px solid #E7E5E4', borderRadius:24, boxShadow:'0 20px 60px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.03)' },
    hdr:  { background:'linear-gradient(135deg,#78716C,#A8A29E)', borderBottom:'none', padding:'28px 28px 24px' },
    accent:'#78716C', nameColor:'#FFFFFF', titleColor:'rgba(255,255,255,0.8)', companyColor:'rgba(255,255,255,0.9)',
    hdrLight: true,
    btnBg:'#FAF8F5', btnBorder:'#D6D3D1', btnText:'#292524',
    socialBg:'#FAF8F5', socialBorder:'#D6D3D1',
    pillBg:'rgba(120,113,108,0.08)', pillBorder:'rgba(120,113,108,0.2)', pillText:'#78716C',
    bodyNameColor:'#292524', bodyTitleColor:'#57534E', bodyCompanyColor:'#78716C',
    pattern:'dots',
  },
  {
    id:'brutalist-concrete', name:'Brutalist Concrete', tier:'DESIGN',
    wrap: { background:'linear-gradient(135deg,#0a0a0a,#171717)' },
    card: { background:'#0A0A0A', border:'1px solid #FF0000', borderRadius:4, boxShadow:'0 24px 70px rgba(0,0,0,0.6)' },
    hdr:  { background:'transparent', borderBottom:'2px solid #FF0000', padding:'28px 28px 24px' },
    accent:'#FF0000', nameColor:'#FFFFFF', titleColor:'rgba(255,255,255,0.55)', companyColor:'#FF0000',
    btnBg:'#171717', btnBorder:'#FF0000', btnText:'#FFFFFF',
    socialBg:'#171717', socialBorder:'#FF0000',
    pillBg:'rgba(255,0,0,0.1)', pillBorder:'rgba(255,0,0,0.3)', pillText:'#FF0000',
    pattern:'lines',
  },
  {
    id:'gradient-aurora', name:'Gradient Aurora', tier:'DESIGN',
    wrap: { background:'linear-gradient(135deg,#0891b2,#a855f7,#db2777)' },
    card: { background:'linear-gradient(160deg,#0891B2 0%,#7C3AED 50%,#BE185D 100%)', border:'1px solid rgba(167,139,250,0.25)', borderRadius:24, boxShadow:'0 24px 70px rgba(124,58,237,0.5)' },
    hdr:  { background:'transparent', borderBottom:'1px solid rgba(255,255,255,0.08)', padding:'28px 28px 24px' },
    accent:'#E0E7FF', nameColor:'#FFFFFF', titleColor:'rgba(224,231,255,0.65)', companyColor:'#E0E7FF',
    btnBg:'rgba(255,255,255,0.06)', btnBorder:'rgba(167,139,250,0.25)', btnText:'rgba(255,255,255,0.9)',
    socialBg:'rgba(167,139,250,0.1)', socialBorder:'rgba(167,139,250,0.2)',
    pillBg:'rgba(224,231,255,0.1)', pillBorder:'rgba(224,231,255,0.25)', pillText:'#E0E7FF',
    pattern:'circuit',
  },
]

const TIER_COLORS = { PRO:'#3B82F6', PREMIUM:'#F0B429', DESIGN:'#A855F7' }

// ─── Storage ──────────────────────────────────────────────────────────────────
const CARD_KEY       = 'procard_current_v1';
const COLLECTION_KEY = 'procard_collection_v1';
function ls(k, d)  { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } }
function ss(k, v)  { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* ignore */ } }
function newId()   { return `card_${Date.now().toString(36)}_${Math.random().toString(36).slice(2,5)}`; }
function dateFR(i) { return new Date(i).toLocaleDateString('fr-FR', { day:'numeric', month:'short', year:'numeric' }); }

// ─── Templates ────────────────────────────────────────────────────────────────
const TEMPLATES = [
  {
    id: 'minimal',
    name: 'Minimal Pro',
    preview: 'linear-gradient(135deg,#fff,#f8fafc)',
    front: { bg:'#FFFFFF', text:'#111827', accent:'#2563EB', sub:'#6B7280', bar:'#2563EB', pattern:false },
    back:  { bg:'#F8FAFC', text:'#374151', accent:'#2563EB', qrBg:'#FFFFFF' },
  },
  {
    id: 'dark-elite',
    name: 'Dark Élite',
    preview: 'linear-gradient(135deg,#0a0a0a,#1a1a2e)',
    front: { bg:'#0D0D1A', text:'#FFFFFF', accent:'#F0B429', sub:'#8B95A5', bar:'#F0B429', pattern:'dots' },
    back:  { bg:'#111122', text:'#E2E8F0', accent:'#F0B429', qrBg:'#FFFFFF' },
  },
  {
    id: 'gold-premium',
    name: 'Gold Premium',
    preview: 'linear-gradient(135deg,#451a03,#d97706)',
    front: { bg:'linear-gradient(135deg,#1C0D00 0%,#3D1A00 50%,#1C0D00 100%)', text:'#FFF8E7', accent:'#F0B429', sub:'#C9A84C', bar:'#F0B429', pattern:'lines' },
    back:  { bg:'linear-gradient(135deg,#2A1200,#1C0D00)', text:'#FFF8E7', accent:'#F0B429', qrBg:'#FFF8E7' },
  },
  {
    id: 'glass',
    name: 'Glass Morphism',
    preview: 'linear-gradient(135deg,#667eea,#764ba2)',
    front: { bg:'linear-gradient(135deg,#4F46E5,#7C3AED)', text:'#FFFFFF', accent:'#E0E7FF', sub:'rgba(255,255,255,0.7)', bar:'rgba(255,255,255,0.4)', pattern:'grid' },
    back:  { bg:'linear-gradient(135deg,#3730A3,#4F46E5)', text:'#EEF2FF', accent:'#A5B4FC', qrBg:'#FFFFFF' },
  },
  {
    id: 'ocean',
    name: 'Océan',
    preview: 'linear-gradient(135deg,#0c2461,#0652dd)',
    front: { bg:'linear-gradient(135deg,#023E8A,#0077B6)', text:'#FFFFFF', accent:'#90E0EF', sub:'rgba(255,255,255,0.72)', bar:'#90E0EF', pattern:'waves' },
    back:  { bg:'linear-gradient(135deg,#03045E,#0077B6)', text:'#CAF0F8', accent:'#90E0EF', qrBg:'#FFFFFF' },
  },
  {
    id: 'forest',
    name: 'Forest Élite',
    preview: 'linear-gradient(135deg,#064e3b,#059669)',
    front: { bg:'linear-gradient(135deg,#064E3B,#065F46)', text:'#ECFDF5', accent:'#6EE7B7', sub:'rgba(236,253,245,0.7)', bar:'#34D399', pattern:'dots' },
    back:  { bg:'linear-gradient(135deg,#022C22,#064E3B)', text:'#D1FAE5', accent:'#6EE7B7', qrBg:'#ECFDF5' },
  },
  {
    id: 'sunset',
    name: 'Sunset',
    preview: 'linear-gradient(135deg,#f43f5e,#fb923c)',
    front: { bg:'linear-gradient(135deg,#881337,#C2410C)', text:'#FFF1F2', accent:'#FCA5A5', sub:'rgba(255,241,242,0.72)', bar:'#FB923C', pattern:false },
    back:  { bg:'linear-gradient(135deg,#7F1D1D,#92400E)', text:'#FEF2F2', accent:'#FECACA', qrBg:'#FFF1F2' },
  },
  {
    id: 'neon',
    name: 'Neon Tech',
    preview: 'linear-gradient(135deg,#0f0f1a,#1a0030)',
    front: { bg:'#0A0A1A', text:'#FFFFFF', accent:'#00F5FF', sub:'rgba(255,255,255,0.6)', bar:'#00F5FF', pattern:'circuit' },
    back:  { bg:'#0A0A1A', text:'#E0F7FF', accent:'#00F5FF', qrBg:'#FFFFFF' },
  },
  {
    id: 'rose',
    name: 'Rose Luxe',
    preview: 'linear-gradient(135deg,#831843,#db2777)',
    front: { bg:'linear-gradient(135deg,#500724,#9D174D)', text:'#FFF1F9', accent:'#F9A8D4', sub:'rgba(249,168,212,0.8)', bar:'#F472B6', pattern:'dots' },
    back:  { bg:'linear-gradient(135deg,#3B0764,#701A75)', text:'#FAE8FF', accent:'#E879F9', qrBg:'#FFF1F9' },
  },
  {
    id: 'corporate',
    name: 'Corporate',
    preview: 'linear-gradient(135deg,#1e3a5f,#2563eb)',
    front: { bg:'#1E3A5F', text:'#FFFFFF', accent:'#DBEAFE', sub:'rgba(219,234,254,0.75)', bar:'#60A5FA', pattern:false },
    back:  { bg:'#F8FAFF', text:'#1E3A5F', accent:'#2563EB', qrBg:'#FFFFFF' },
  },
  {
    id: 'senegal',
    name: 'Sénégal Pride',
    preview: 'linear-gradient(135deg,#009a3d,#fcd116)',
    front: { bg:'linear-gradient(135deg,#003300,#006400)', text:'#FFFFFF', accent:'#FCD116', sub:'rgba(255,255,255,0.75)', bar:'#FCD116', pattern:'dots' },
    back:  { bg:'linear-gradient(135deg,#1a0000,#4d0000)', text:'#FFF5F5', accent:'#E8112D', qrBg:'#FFFFFF' },
  },
  {
    id: 'noir',
    name: 'Noir & Or',
    preview: 'linear-gradient(135deg,#000,#2a2a2a)',
    front: { bg:'#000000', text:'#FFFFFF', accent:'#D4AF37', sub:'rgba(255,255,255,0.6)', bar:'#D4AF37', pattern:'lines' },
    back:  { bg:'#111111', text:'#F5F5F5', accent:'#D4AF37', qrBg:'#FFFFFF' },
  },
  {
    id: 'azure',
    name: 'Azure Pro',
    preview: 'linear-gradient(135deg,#0284c7,#38bdf8)',
    front: { bg:'linear-gradient(135deg,#0369A1,#0284C7)', text:'#FFFFFF', accent:'#BAE6FD', sub:'rgba(255,255,255,0.75)', bar:'#38BDF8', pattern:'grid' },
    back:  { bg:'#F0F9FF', text:'#0C4A6E', accent:'#0284C7', qrBg:'#FFFFFF' },
  },
  {
    id: 'terra',
    name: 'Terre d\'Afrique',
    preview: 'linear-gradient(135deg,#7c2d12,#c2410c)',
    front: { bg:'linear-gradient(135deg,#431407,#7C2D12)', text:'#FEF3C7', accent:'#FBB040', sub:'rgba(254,243,199,0.7)', bar:'#F97316', pattern:'waves' },
    back:  { bg:'linear-gradient(135deg,#292524,#3C1A0A)', text:'#FDE68A', accent:'#FBB040', qrBg:'#FEF3C7' },
  },
  {
    id: 'arctic',
    name: 'Arctic Ice',
    preview: 'linear-gradient(135deg,#e0f2fe,#f8fafc)',
    front: { bg:'#FFFFFF', text:'#0C4A6E', accent:'#0EA5E9', sub:'#64748B', bar:'#0EA5E9', pattern:'dots' },
    back:  { bg:'linear-gradient(135deg,#F0F9FF,#E0F2FE)', text:'#0C4A6E', accent:'#0284C7', qrBg:'#FFFFFF' },
  },
  {
    id: 'midnight',
    name: 'Midnight Galaxy',
    preview: 'linear-gradient(135deg,#0f0c29,#302b63,#24243e)',
    front: { bg:'linear-gradient(135deg,#0F0C29,#302B63,#24243E)', text:'#EEF2FF', accent:'#818CF8', sub:'rgba(238,242,255,0.65)', bar:'#6366F1', pattern:'circuit' },
    back:  { bg:'linear-gradient(135deg,#1e1b4b,#0f0c29)', text:'#C7D2FE', accent:'#818CF8', qrBg:'#EEF2FF' },
  },
  {
    id: 'emerald',
    name: 'Emerald Luxe',
    preview: 'linear-gradient(135deg,#022c22,#047857)',
    front: { bg:'linear-gradient(135deg,#022C22,#065F46)', text:'#ECFDF5', accent:'#34D399', sub:'rgba(236,253,245,0.7)', bar:'#10B981', pattern:'lines' },
    back:  { bg:'#F0FDF4', text:'#022C22', accent:'#047857', qrBg:'#FFFFFF' },
  },
  {
    id: 'copper',
    name: 'Copper Luxe',
    preview: 'linear-gradient(135deg,#451a03,#b45309)',
    front: { bg:'linear-gradient(135deg,#1C1007,#3D2000)', text:'#FEF3C7', accent:'#B45309', sub:'rgba(254,243,199,0.7)', bar:'#D97706', pattern:'dots' },
    back:  { bg:'linear-gradient(135deg,#292524,#1C1007)', text:'#FDE68A', accent:'#B45309', qrBg:'#FEF3C7' },
  },
  {
    id: 'sakura',
    name: 'Sakura',
    preview: 'linear-gradient(135deg,#fdf2f8,#fce7f3)',
    front: { bg:'linear-gradient(135deg,#BE185D,#9D174D)', text:'#FFF1F9', accent:'#FBCFE8', sub:'rgba(255,241,249,0.8)', bar:'#F472B6', pattern:'waves' },
    back:  { bg:'#FDF2F8', text:'#831843', accent:'#DB2777', qrBg:'#FFFFFF' },
  },
  {
    id: 'soft-cream',
    name: 'Soft Cream',
    preview: 'linear-gradient(135deg,#faf8f5,#f3efe6)',
    front: { bg:'#FAF8F5', text:'#2A2118', accent:'#C9A84C', sub:'#7A6B5A', bar:'#D4AF37', pattern:'dots' },
    back:  { bg:'#F3EFE6', text:'#3D3225', accent:'#C9A84C', qrBg:'#FFFFFF' },
  },
  {
    id: 'deep-purple',
    name: 'Deep Purple',
    preview: 'linear-gradient(135deg,#2e1065,#6b21a8)',
    front: { bg:'linear-gradient(135deg,#2E1065,#4C1D95)', text:'#F3E8FF', accent:'#E9D5FF', sub:'rgba(233,213,255,0.75)', bar:'#A855F7', pattern:'grid' },
    back:  { bg:'#1E1B4B', text:'#E9D5FF', accent:'#C084FC', qrBg:'#FFFFFF' },
  },
  {
    id: 'carbon',
    name: 'Carbon Tech',
    preview: 'linear-gradient(135deg,#111,#222)',
    front: { bg:'#111111', text:'#FFFFFF', accent:'#00E5FF', sub:'rgba(255,255,255,0.55)', bar:'#00E5FF', pattern:'circuit' },
    back:  { bg:'#0A0A0A', text:'#E0F7FA', accent:'#00E5FF', qrBg:'#FFFFFF' },
  },
  {
    id: 'tropical',
    name: 'Tropical',
    preview: 'linear-gradient(135deg,#064e3b,#a3e635)',
    front: { bg:'linear-gradient(135deg,#064E3B,#065F46)', text:'#ECFDF5', accent:'#A3E635', sub:'rgba(163,230,53,0.8)', bar:'#84CC16', pattern:'waves' },
    back:  { bg:'#022C22', text:'#D9F99D', accent:'#A3E635', qrBg:'#ECFDF5' },
  },
  {
    id: 'royal-blue',
    name: 'Royal Blue',
    preview: 'linear-gradient(135deg,#1e3a8a,#3b82f6)',
    front: { bg:'linear-gradient(135deg,#1E3A8A,#1D4ED8)', text:'#FFFFFF', accent:'#FCD34D', sub:'rgba(252,211,77,0.8)', bar:'#FBBF24', pattern:false },
    back:  { bg:'#172554', text:'#EFF6FF', accent:'#FCD34D', qrBg:'#FFFFFF' },
  },
  {
    id: 'blush-pink',
    name: 'Blush Pink',
    preview: 'linear-gradient(135deg,#fce7f3,#fbcfe8)',
    front: { bg:'#FCE7F3', text:'#500724', accent:'#DB2777', sub:'#9D174D', bar:'#F472B6', pattern:'dots' },
    back:  { bg:'#FBCFE8', text:'#831843', accent:'#DB2777', qrBg:'#FFFFFF' },
  },
  {
    id: 'industrial',
    name: 'Industrial',
    preview: 'linear-gradient(135deg,#1f2937,#374151)',
    front: { bg:'linear-gradient(135deg,#1F2937,#111827)', text:'#F3F4F6', accent:'#F97316', sub:'rgba(249,115,22,0.75)', bar:'#F97316', pattern:'lines' },
    back:  { bg:'#0F172A', text:'#E5E7EB', accent:'#FB923C', qrBg:'#F3F4F6' },
  },
  {
    id: 'nordic',
    name: 'Nordic',
    preview: 'linear-gradient(135deg,#e0f2fe,#f0f9ff)',
    front: { bg:'#E0F2FE', text:'#0C4A6E', accent:'#0284C7', sub:'#0369A1', bar:'#0EA5E9', pattern:'dots' },
    back:  { bg:'#F0F9FF', text:'#0C4A6E', accent:'#0284C7', qrBg:'#FFFFFF' },
  },
  {
    id: 'cyberpunk',
    name: 'Cyberpunk',
    preview: 'linear-gradient(135deg,#0a0a0a,#ff00ff)',
    front: { bg:'#0A0A0A', text:'#FFFFFF', accent:'#FF00FF', sub:'rgba(255,0,255,0.65)', bar:'#00FFFF', pattern:'circuit' },
    back:  { bg:'#050505', text:'#F0F0F0', accent:'#FF00FF', qrBg:'#FFFFFF' },
  },
  {
    id: 'safari',
    name: 'Safari',
    preview: 'linear-gradient(135deg,#78350f,#d97706)',
    front: { bg:'linear-gradient(135deg,#78350F,#92400E)', text:'#FEF3C7', accent:'#FCD34D', sub:'rgba(252,211,77,0.8)', bar:'#F59E0B', pattern:'dots' },
    back:  { bg:'#451A03', text:'#FEF3C7', accent:'#FBBF24', qrBg:'#FEF3C7' },
  },
  {
    id: 'ocean-breeze',
    name: 'Ocean Breeze',
    preview: 'linear-gradient(135deg,#cffafe,#ecfeff)',
    front: { bg:'#CFFAFE', text:'#164E63', accent:'#0891B2', sub:'#155E75', bar:'#06B6D4', pattern:'waves' },
    back:  { bg:'#ECFEFF', text:'#164E63', accent:'#0891B2', qrBg:'#FFFFFF' },
  },
  {
    id: 'cherry-red',
    name: 'Cherry Red',
    preview: 'linear-gradient(135deg,#7f1d1d,#dc2626)',
    front: { bg:'linear-gradient(135deg,#7F1D1D,#991B1B)', text:'#FEF2F2', accent:'#FCA5A5', sub:'rgba(252,165,165,0.8)', bar:'#EF4444', pattern:false },
    back:  { bg:'#450A0A', text:'#FEF2F2', accent:'#FCA5A5', qrBg:'#FFFFFF' },
  },
  {
    id: 'lavender',
    name: 'Lavender',
    preview: 'linear-gradient(135deg,#ede9fe,#ddd6fe)',
    front: { bg:'#EDE9FE', text:'#2E1065', accent:'#7C3AED', sub:'#5B21B6', bar:'#8B5CF6', pattern:'dots' },
    back:  { bg:'#DDD6FE', text:'#2E1065', accent:'#7C3AED', qrBg:'#FFFFFF' },
  },
  {
    id: 'monochrome',
    name: 'Monochrome',
    preview: 'linear-gradient(135deg,#000,#333)',
    front: { bg:'#000000', text:'#FFFFFF', accent:'#FFFFFF', sub:'rgba(255,255,255,0.6)', bar:'#FFFFFF', pattern:'lines' },
    back:  { bg:'#FFFFFF', text:'#000000', accent:'#000000', qrBg:'#000000' },
  },
  {
    id: 'sunset-vibe',
    name: 'Sunset Vibe',
    preview: 'linear-gradient(135deg,#f97316,#db2777,#7c3aed)',
    front: { bg:'linear-gradient(135deg,#C2410C,#DB2777)', text:'#FFF1F2', accent:'#FDE047', sub:'rgba(253,224,71,0.8)', bar:'#FACC15', pattern:'waves' },
    back:  { bg:'linear-gradient(135deg,#7F1D1D,#701A75)', text:'#FAE8FF', accent:'#FDE047', qrBg:'#FFFFFF' },
  },
  {
    id: 'memphis-pop',
    name: 'Memphis Pop',
    preview: 'linear-gradient(135deg,#fef3c7,#fbcfe8)',
    front: { bg:'#FEF3C7', text:'#451A03', accent:'#DB2777', sub:'#92400E', bar:'#F59E0B', pattern:'dots' },
    back:  { bg:'#FDF2F8', text:'#500724', accent:'#DB2777', qrBg:'#FFFFFF' },
  },
  {
    id: 'bauhaus-geo',
    name: 'Bauhaus Geo',
    preview: 'linear-gradient(135deg,#1e1b4b,#be185d)',
    front: { bg:'#1E1B4B', text:'#FFFFFF', accent:'#FBBF24', sub:'rgba(251,191,36,0.75)', bar:'#F59E0B', pattern:'grid' },
    back:  { bg:'#312E81', text:'#EEF2FF', accent:'#FBBF24', qrBg:'#FFFFFF' },
  },
  {
    id: 'duotone-sky',
    name: 'Duotone Sky',
    preview: 'linear-gradient(135deg,#0ea5e9,#a855f7)',
    front: { bg:'linear-gradient(135deg,#0284C7,#7C3AED)', text:'#FFFFFF', accent:'#E0E7FF', sub:'rgba(224,231,255,0.8)', bar:'#A78BFA', pattern:'waves' },
    back:  { bg:'#1E1B4B', text:'#E0E7FF', accent:'#A78BFA', qrBg:'#FFFFFF' },
  },
  {
    id: 'terrazzo-mint',
    name: 'Terrazzo Mint',
    preview: 'linear-gradient(135deg,#ecfdf5,#d1fae5)',
    front: { bg:'#ECFDF5', text:'#064E3B', accent:'#059669', sub:'#047857', bar:'#10B981', pattern:'dots' },
    back:  { bg:'#D1FAE5', text:'#064E3B', accent:'#059669', qrBg:'#FFFFFF' },
  },
  {
    id: 'art-deco-gold',
    name: 'Art Déco Gold',
    preview: 'linear-gradient(135deg,#451a03,#b45309)',
    front: { bg:'linear-gradient(135deg,#2A1200,#5C3A1E)', text:'#FFFBEB', accent:'#FCD34D', sub:'rgba(252,211,77,0.8)', bar:'#FBBF24', pattern:'lines' },
    back:  { bg:'#451A03', text:'#FEF3C7', accent:'#FCD34D', qrBg:'#FFFBEB' },
  },
  {
    id: 'neon-grid',
    name: 'Neon Grid',
    preview: 'linear-gradient(135deg,#0f0f23,#1a1a2e)',
    front: { bg:'#0F0F23', text:'#00F5FF', accent:'#FF00FF', sub:'rgba(0,245,255,0.65)', bar:'#00F5FF', pattern:'grid' },
    back:  { bg:'#1A1A2E', text:'#E0F7FF', accent:'#00F5FF', qrBg:'#FFFFFF' },
  },
  {
    id: 'soft-pastel',
    name: 'Soft Pastel',
    preview: 'linear-gradient(135deg,#fce7f3,#e0e7ff)',
    front: { bg:'#FCE7F3', text:'#831843', accent:'#818CF8', sub:'#6D28D9', bar:'#A78BFA', pattern:'dots' },
    back:  { bg:'#E0E7FF', text:'#312E81', accent:'#818CF8', qrBg:'#FFFFFF' },
  },
  {
    id: 'brutalist',
    name: 'Brutalist',
    preview: 'linear-gradient(135deg,#000,#ff0000)',
    front: { bg:'#000000', text:'#FFFFFF', accent:'#FF0000', sub:'rgba(255,255,255,0.6)', bar:'#FF0000', pattern:'lines' },
    back:  { bg:'#FFFFFF', text:'#000000', accent:'#FF0000', qrBg:'#000000' },
  },
  {
    id: 'kinetic-wave',
    name: 'Kinetic Wave',
    preview: 'linear-gradient(135deg,#4c1d95,#db2777)',
    front: { bg:'linear-gradient(135deg,#4C1D95,#BE185D)', text:'#FFFFFF', accent:'#FDE047', sub:'rgba(253,224,71,0.8)', bar:'#FACC15', pattern:'waves' },
    back:  { bg:'#312E81', text:'#EEF2FF', accent:'#FDE047', qrBg:'#FFFFFF' },
  },
  {
    id: 'gradient-mesh',
    name: 'Gradient Mesh',
    preview: 'linear-gradient(135deg,#0891b2,#a855f7,#db2777)',
    front: { bg:'linear-gradient(135deg,#0891B2,#7C3AED,#BE185D)', text:'#FFFFFF', accent:'#E0E7FF', sub:'rgba(224,231,255,0.85)', bar:'#A78BFA', pattern:false },
    back:  { bg:'#1E1B4B', text:'#E0E7FF', accent:'#A78BFA', qrBg:'#FFFFFF' },
  },
  {
    id: 'paper-craft',
    name: 'Paper Craft',
    preview: 'linear-gradient(135deg,#fafaf9,#e7e5e4)',
    front: { bg:'#FAFAF9', text:'#292524', accent:'#78716C', sub:'#57534E', bar:'#A8A29E', pattern:'dots' },
    back:  { bg:'#F5F5F4', text:'#44403C', accent:'#78716C', qrBg:'#FFFFFF' },
  },
  {
    id: 'cyber-amber',
    name: 'Cyber Amber',
    preview: 'linear-gradient(135deg,#0a0a0a,#f59e0b)',
    front: { bg:'#0A0A0A', text:'#FEF3C7', accent:'#F59E0B', sub:'rgba(245,158,11,0.65)', bar:'#F59E0B', pattern:'circuit' },
    back:  { bg:'#171717', text:'#FEF3C7', accent:'#F59E0B', qrBg:'#FFFFFF' },
  },
];

const FONTS = [
  { id:'outfit',   label:'Outfit',          css:'"Outfit",sans-serif' },
  { id:'inter',    label:'Inter',           css:'"Inter",system-ui,sans-serif' },
  { id:'syne',     label:'Syne',            css:'"Syne",sans-serif' },
  { id:'playfair', label:'Playfair Display',css:'"Playfair Display",Georgia,serif' },
  { id:'mono',     label:'Space Mono',      css:'"Space Mono",monospace' },
  { id:'system',   label:'Système',         css:'system-ui,sans-serif' },
];

const LAYOUTS = [
  { id:'left',   label:'Aligné gauche' },
  { id:'center', label:'Centré' },
  { id:'split',  label:'Split (logo droite)' },
];

const SOCIAL_OPTIONS = [
  { id:'whatsapp',  icon:'💬', label:'WhatsApp',  prefix:'https://wa.me/' },
  { id:'instagram', icon:'📸', label:'Instagram',  prefix:'https://instagram.com/' },
  { id:'linkedin',  icon:'💼', label:'LinkedIn',   prefix:'https://linkedin.com/in/' },
  { id:'twitter',   icon:'🐦', label:'X/Twitter',  prefix:'https://twitter.com/' },
  { id:'facebook',  icon:'📘', label:'Facebook',   prefix:'https://facebook.com/' },
  { id:'github',    icon:'⚙️', label:'GitHub',     prefix:'https://github.com/' },
  { id:'tiktok',    icon:'🎵', label:'TikTok',     prefix:'https://tiktok.com/@' },
  { id:'youtube',   icon:'▶️',  label:'YouTube',    prefix:'https://youtube.com/@' },
  { id:'telegram',  icon:'✈️',  label:'Telegram',   prefix:'https://t.me/' },
  { id:'discord',   icon:'🎮', label:'Discord',    prefix:'https://discord.gg/' },
  { id:'behance',   icon:'🎨', label:'Behance',    prefix:'https://behance.net/' },
  { id:'dribbble',  icon:'🏀', label:'Dribbble',   prefix:'https://dribbble.com/' },
];

const CARD_SIZES = [
  { id:'eu',   label:'EU Standard (85×54mm)',   w:800, h:510 },
  { id:'us',   label:'US Standard (89×51mm)',   w:800, h:455 },
  { id:'sq',   label:'Carré (70×70mm)',         w:660, h:660 },
  { id:'mini', label:'Mini (50×35mm)',           w:475, h:332 },
];

const CARD_INITIAL = {
  name:'Votre Nom', title:'Directeur / CEO', company:'ABAWI Group',
  email:'contact@abawi.sn', tel:'+221 77 000 00 00', website:'https://abawi.sn',
  address:'Dakar, Sénégal', tagline:'Excellence Africaine',
  bio:'', portfolio:'', bookingUrl:'', paymentLink:'',
  skills:'', languages:'', certifications:'',
  socials:{ whatsapp:'', instagram:'', linkedin:'', twitter:'', facebook:'', github:'', tiktok:'', youtube:'', telegram:'', discord:'', behance:'', dribbble:'' },
  templateId:'dark-elite', font:'outfit', layout:'left',
  cardSize:'eu', showQrBack:true, logoUrl:'',
  customColor:'', useCustomColor:false,
  textScale:1,
  textPositions:{},
  avatarShape:'square',
  textGlow:0,
  tiltEffect:true,
};

// ─── Main Component ───────────────────────────────────────────────────────────
export default function ProCardElite() {
  const { membre } = useAuth();
  const guard = useToolGuard('pro_card_elite', 'pro_card_elite')

  const [card, setCard]           = useState(() => ls(CARD_KEY, CARD_INITIAL));
  const [collection, setCol]      = useState(() => ls(COLLECTION_KEY, []));
  const [tab, setTab]             = useState('design');
  const [side, setSide]           = useState('front');
  const [flipping, setFlipping]   = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [exporting,    setExporting]    = useState('');
  const [notif,        setNotif]        = useState('');
  const [logoPreview,  setLogoPreview]  = useState(card.logoUrl || '');
  const [digitalTpl,   setDigitalTpl]   = useState('midnight-gold');
  const [designMode, setDesignMode] = useState(false);
  const [inlineEdit, setInlineEdit] = useState(null); // { side, field, value }
  const [digitalFullscreen, setDigitalFullscreen] = useState(false);
  const [showAllPhysical, setShowAllPhysical] = useState(false);
  const [showAllDigital, setShowAllDigital] = useState(false);
  const dragInfo = useRef(null);

  const frontRef = useRef(null);
  const backRef  = useRef(null);

  const tpl = TEMPLATES.find(t => t.id === card.templateId) || TEMPLATES[0];
  const font = FONTS.find(f => f.id === card.font) || FONTS[0];
  const size = CARD_SIZES.find(s => s.id === card.cardSize) || CARD_SIZES[0];

  // Persist
  useEffect(() => { ss(CARD_KEY, card); }, [card]);

  // Generate QR for card back
  // eslint-disable-next-line react-hooks/exhaustive-deps -- card fields already listed individually
  useEffect(() => {
    const content = buildVCardContent(card);
    QRCode.toDataURL(content, { width:160, margin:1, color:{ dark:'#000000', light:'#ffffff' } })
      .then(url => setQrDataUrl(url)).catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [card.name, card.tel, card.email, card.website]);

  useEffect(() => { if (notif) { const t = setTimeout(() => setNotif(''), 3000); return () => clearTimeout(t); } }, [notif]);

  // 3D Tilt effect on preview scene
  const sceneRef = useRef(null);
  useEffect(() => {
    const el = sceneRef.current;
    if (!el || !card.tiltEffect) { if (el) el.style.transform = ''; return; }
    const onMove = (e) => {
      const rect = el.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;
      const rotX = (0.5 - y) * 14;
      const rotY = (x - 0.5) * 14;
      el.style.transform = `perspective(1000px) rotateX(${rotX}deg) rotateY(${rotY}deg) scale3d(1.02,1.02,1.02)`;
    };
    const onLeave = () => { el.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) scale3d(1,1,1)'; };
    el.addEventListener('mousemove', onMove);
    el.addEventListener('mouseleave', onLeave);
    return () => { el.removeEventListener('mousemove', onMove); el.removeEventListener('mouseleave', onLeave); };
  }, [card.tiltEffect]);

  function patch(k, v) { setCard(c => ({ ...c, [k]: v })); }
  function patchSocial(k, v) { setCard(c => ({ ...c, socials: { ...c.socials, [k]: v } })); }

  function handleLogoFile(e) {
    const f = e.target.files[0];
    if (!f) return;
    if (f.size > 2 * 1024 * 1024) { setNotif('Image trop grande (max 2MB)'); return; }
    const reader = new FileReader();
    reader.onload = ev => { patch('logoUrl', ev.target.result); setLogoPreview(ev.target.result); };
    reader.readAsDataURL(f);
  }

  function flip() {
    if (flipping || designMode) return;
    setFlipping(true);
    setTimeout(() => { setSide(s => s === 'front' ? 'back' : 'front'); setFlipping(false); }, 320);
  }

  // ── Drag & Drop helpers ──────────────────────────────
  function startDrag(e, side, field) {
    if (!designMode) return;
    e.preventDefault();
    e.stopPropagation();
    const faceEl = e.currentTarget.closest('.card-face');
    const rect = faceEl.getBoundingClientRect();
    const origPos = card.textPositions?.[`${side}:${field}`] || { top: 0, left: 0 };
    dragInfo.current = { side, field, startX: e.clientX, startY: e.clientY, origPos, rect, faceEl };
    document.body.style.cursor = 'grabbing';
  }
  function handleDragMove(e) {
    const d = dragInfo.current;
    if (!d) return;
    const dx = ((e.clientX - d.startX) / d.rect.width) * 100;
    const dy = ((e.clientY - d.startY) / d.rect.height) * 100;
    const el = d.faceEl.querySelector(`[data-field="${d.side}:${d.field}"]`);
    if (el) {
      const left = Math.max(0, Math.min(90, d.origPos.left + dx));
      const top = Math.max(0, Math.min(90, d.origPos.top + dy));
      el.style.left = left + '%';
      el.style.top = top + '%';
      el.style.transform = 'translate(0,0)';
    }
  }
  function handleDragUp() {
    const d = dragInfo.current;
    if (!d) return;
    const el = d.faceEl.querySelector(`[data-field="${d.side}:${d.field}"]`);
    if (el) {
      const left = parseFloat(el.style.left) || 0;
      const top = parseFloat(el.style.top) || 0;
      setCard(c => ({
        ...c,
        textPositions: { ...(c.textPositions || {}), [`${d.side}:${d.field}`]: { left, top } }
      }));
      el.style.transform = '';
    }
    dragInfo.current = null;
    document.body.style.cursor = '';
  }

  useEffect(() => {
    if (!designMode) return;
    window.addEventListener('mousemove', handleDragMove);
    window.addEventListener('mouseup', handleDragUp);
    return () => { window.removeEventListener('mousemove', handleDragMove); window.removeEventListener('mouseup', handleDragUp); };
  }, [designMode, card.textPositions]);

  async function checkAccessThen(action) {
    const debitResult = await guard.checkAndDebit()
    if (!debitResult.ok) return false
    await guard.recordUsage({ action })
    return true
  }

  async function exportPNG(which = 'front') {
    const ref = which === 'front' ? frontRef : backRef;
    if (!ref.current) return;
    setExporting(which === 'front' ? 'png-front' : 'png-back');
    try {
      const { default: html2canvas } = await import('html2canvas')
      const canvas = await html2canvas(ref.current, { scale: 4, useCORS: true, backgroundColor: null, logging: false });
      const url = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = url; a.download = `carte_${which}_${card.name.replace(/\s+/g,'_')}.png`; a.click();
      setNotif(`✓ PNG ${which === 'front' ? 'recto' : 'verso'} téléchargé (4×)`);
    } catch(e) { setNotif('Erreur export : ' + e.message); }
    setExporting('');
  }

  async function exportPDF() {
    const fRef = frontRef.current;
    const bRef = backRef.current;
    if (!fRef) return;
    setExporting('pdf');
    try {
      const { default: jsPDF } = await import('jspdf');
      const { default: html2canvas } = await import('html2canvas')
      const fCanvas = await html2canvas(fRef, { scale:4, useCORS:true, backgroundColor:null, logging:false });
      const bCanvas = bRef ? await html2canvas(bRef, { scale:4, useCORS:true, backgroundColor:null, logging:false }) : null;

      const mmW = 85, mmH = 54;
      const pdf = new jsPDF({ orientation:'landscape', unit:'mm', format:[mmW, mmH] });
      pdf.addImage(fCanvas.toDataURL('image/png'), 'PNG', 0, 0, mmW, mmH);
      if (bCanvas) {
        pdf.addPage([mmW, mmH], 'landscape');
        pdf.addImage(bCanvas.toDataURL('image/png'), 'PNG', 0, 0, mmW, mmH);
      }
      pdf.save(`carte_${card.name.replace(/\s+/g,'_')}.pdf`);
      setNotif('✓ PDF recto/verso téléchargé (prêt à imprimer)');
    } catch(e) { setNotif('Erreur PDF : ' + e.message); }
    setExporting('');
  }

  function exportVCard() {
    const vcf = buildVCardContent(card);
    const blob = new Blob([vcf], { type:'text/vcard' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `${card.name.replace(/\s+/g,'_')}.vcf`; a.click();
    URL.revokeObjectURL(url);
    setNotif('✓ vCard (.vcf) téléchargée');
  }

  function shareCard() {
    const text = `${card.name} — ${card.title} @ ${card.company}\n📞 ${card.tel}\n✉️ ${card.email}\n🌐 ${card.website}`;
    if (navigator.share) {
      navigator.share({ title: `Carte de ${card.name}`, text, url: card.website });
    } else {
      navigator.clipboard?.writeText(text).then(() => setNotif('✓ Infos copiées dans le presse-papiers'));
    }
  }

  function saveToCollection() {
    const entry = { id: newId(), ...card, savedAt: new Date().toISOString(), logoPreview };
    const next = [entry, ...collection].slice(0, 20);
    setCol(next); ss(COLLECTION_KEY, next);
    setNotif('✓ Carte sauvegardée dans la collection');
  }

  function loadFromCollection(c) {
    const { id, savedAt, ...rest } = c;
    setCard(rest); setLogoPreview(rest.logoUrl || ''); setTab('design');
    setNotif('✓ Carte chargée');
  }

  return (
    <div style={{ minHeight:'100vh', background:'var(--bg-primary)' }}>
      <SEO title="Pro Card Élite — Cartes de visite premium" description="Cartes de visite physiques et numériques. 12 templates, QR code, vCard NFC, export PDF print-ready." image="/og-tools/pro-card-elite.jpg" />
      <style>{CSS}</style>
      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '8px 16px 0' }}>
        <ToolGuardBadge guard={guard} />
      </div>

      <ToolHero
        icon="💳"
        badge="Business Card · Élite"
        title="Pro Card"
        titleAccent="Élite"
        subtitle="Créez des cartes de visite professionnelles physiques et numériques — 35 templates premium, QR code intégré, export PDF print-ready, carte digitale NFC."
        gradient="linear-gradient(135deg,#0D0D1A 0%,#1a1a2e 45%,#2D1B4E 100%)"
        glowColor="rgba(240,180,41,0.35)"
        accentColor="#F0B429"
        stats={[['🎨','35 Templates'],['📐','Print-ready PDF'],['📲','vCard NFC'],['🔗','12 Réseaux sociaux']]}
      />

      <div style={{ maxWidth:1400, margin:'0 auto', padding:'20px 16px 80px' }}>
        <ToolInfoPanel
          toolName="Pro Card Élite"
          icon="💳"
          description="Créateur de cartes de visite professionnelles physiques et numériques — 35 designs premium, édition et placement manuel, effet 3D Tilt"
          benefits={[
            '35 templates premium : Minimal, Dark Élite, Gold, Glass, Neon Tech, Sénégal Pride, Cyberpunk, Royal Blue…',
            'Mode Designer : glissez-déposez chaque texte sur la carte, double-cliquez pour éditer inline',
            'Échelle texte 60%–140% · Lueur du texte · Forme du logo (carré, rond, hexagone) · Effet 3D Tilt',
            'Export PDF print-ready 85×54mm avec bleed · PNG 4× haute résolution · vCard .vcf',
            'QR code généré automatiquement depuis vos infos — scannable directement',
          ]}
          howToUse={[
            'Choisissez un template et renseignez vos informations professionnelles',
            'Activez le Mode Designer pour repositionner et éditer le texte directement sur la carte',
            'Ajustez la taille du texte, la forme du logo et l\'effet 3D Tilt dans Mise en page avancée',
            'Uploadez votre logo ou photo de profil',
            'Exportez en PDF print-ready ou PNG haute résolution · partagez en vCard',
          ]}
          tips={[
            'Le PDF est pré-formaté à 85×54mm pour l\'impression chez un imprimeur',
            'Le Mode Designer sauvegarde les positions en % : la carte reste responsive',
            'La vCard (.vcf) se synchronise directement dans les contacts iPhone/Android',
          ]}
        />

        {notif && <div className="card-notif">{notif}</div>}

        {/* ── DESIGN ── */}
        {tab === 'design' && (
          <div className="card-layout">

            {/* LEFT — Editor */}
            <div className="card-editor">

              {/* Choisir un template */}
              <div className="card-section" style={{ padding: '22px 18px', borderRadius: 16, background: 'var(--surface)', border: '1.5px solid var(--border)' }}>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom: 16 }}>
                  <h3 className="card-sect-title" style={{ fontSize: '0.9rem', letterSpacing: '1.5px', margin: 0 }}>Choisir un template</h3>
                  <span style={{ fontSize:'0.7rem', fontWeight:700, color:'var(--text-muted)' }}>{TEMPLATES.length} designs</span>
                </div>
                <div className="card-tpl-grid">
                  {(showAllPhysical ? TEMPLATES : TEMPLATES.slice(0, 8)).map(t => (
                    <button key={t.id} onClick={() => patch('templateId', t.id)}
                      className={`card-tpl-btn ${card.templateId===t.id?'active':''}`}
                      title={t.name}>
                      <div className="card-tpl-preview" style={{ background: t.preview }} />
                      <span className="card-tpl-name">{t.name}</span>
                    </button>
                  ))}
                </div>
                {TEMPLATES.length > 8 && (
                  <button onClick={() => setShowAllPhysical(v => !v)}
                    style={{ marginTop: 14, width: '100%', padding: '10px', borderRadius: 10, border: '1.5px dashed var(--border)', background: 'transparent', color: 'var(--text-muted)', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s' }}>
                    {showAllPhysical ? '↑ Réduire' : `↓ Voir les ${TEMPLATES.length} templates`}
                  </button>
                )}
              </div>

              {/* Infos recto */}
              <div className="card-section">
                <h3 className="card-sect-title">Informations — Recto</h3>
                <div className="card-grid-2">
                  <input className="card-input" placeholder="Nom complet *" value={card.name} onChange={e=>patch('name',e.target.value)} />
                  <input className="card-input" placeholder="Titre / Poste" value={card.title} onChange={e=>patch('title',e.target.value)} />
                </div>
                <input className="card-input" placeholder="Entreprise / Organisation" value={card.company} onChange={e=>patch('company',e.target.value)} style={{marginTop:8}} />
                <input className="card-input" placeholder="Tagline (ex: Excellence Africaine)" value={card.tagline} onChange={e=>patch('tagline',e.target.value)} style={{marginTop:8}} />
              </div>

              {/* Contacts verso */}
              <div className="card-section">
                <h3 className="card-sect-title">Contacts — Verso</h3>
                <div className="card-grid-2">
                  <input className="card-input" placeholder="📞 Téléphone" type="tel" value={card.tel} onChange={e=>patch('tel',e.target.value)} />
                  <input className="card-input" placeholder="✉️ Email" type="email" value={card.email} onChange={e=>patch('email',e.target.value)} />
                </div>
                <input className="card-input" placeholder="🌐 Site web" value={card.website} onChange={e=>patch('website',e.target.value)} style={{marginTop:8}} />
                <input className="card-input" placeholder="📍 Ville / Adresse" value={card.address} onChange={e=>patch('address',e.target.value)} style={{marginTop:8}} />
              </div>

              {/* Réseaux sociaux */}
              <div className="card-section">
                <h3 className="card-sect-title">Réseaux sociaux (verso)</h3>
                <div className="card-grid-2">
                  {SOCIAL_OPTIONS.map(s => (
                    <div key={s.id} style={{ display:'flex', alignItems:'center', gap:6 }}>
                      <span style={{ flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', width:22 }}><SocialIcon id={s.id} size={18} /></span>
                      <input className="card-input" placeholder={s.label} value={card.socials[s.id]||''} onChange={e=>patchSocial(s.id,e.target.value)} style={{ fontSize:'0.82rem' }} />
                    </div>
                  ))}
                </div>
              </div>

              {/* Champs optionnels */}
              <div className="card-section">
                <h3 className="card-sect-title">Infos optionnelles — Carte digitale</h3>
                <p style={{ fontSize:'0.75rem', color:'var(--text-muted)', marginBottom:12 }}>Visibles sur la carte digitale NFC (pas sur le recto/verso papier)</p>
                <textarea className="card-input" rows={2} placeholder="Bio / À propos de vous (optionnel)" value={card.bio||''} onChange={e=>patch('bio',e.target.value)} style={{ resize:'vertical', marginBottom:8 }} />
                <input className="card-input" placeholder="Portfolio / Travaux (URL)" value={card.portfolio||''} onChange={e=>patch('portfolio',e.target.value)} style={{ marginBottom:8 }} />
                <input className="card-input" placeholder="Lien de réservation / Calendrier (URL)" value={card.bookingUrl||''} onChange={e=>patch('bookingUrl',e.target.value)} style={{ marginBottom:8 }} />
                <input className="card-input" placeholder="Lien de paiement Wave/Orange Money (URL)" value={card.paymentLink||''} onChange={e=>patch('paymentLink',e.target.value)} style={{ marginBottom:8 }} />
                <input className="card-input" placeholder="Compétences clés (ex: Design, Stratégie, IA)" value={card.skills||''} onChange={e=>patch('skills',e.target.value)} style={{ marginBottom:8 }} />
                <input className="card-input" placeholder="Langues (ex: Français, Wolof, Anglais)" value={card.languages||''} onChange={e=>patch('languages',e.target.value)} style={{ marginBottom:8 }} />
                <input className="card-input" placeholder="Certifications (ex: PMP, MBA, CFA…)" value={card.certifications||''} onChange={e=>patch('certifications',e.target.value)} />
              </div>

              {/* Design */}
              <div className="card-section">
                <h3 className="card-sect-title">Design & Format</h3>
                <div className="card-grid-2">
                  <div className="card-field">
                    <label>Police</label>
                    <select className="card-select" value={card.font} onChange={e=>patch('font',e.target.value)}>
                      {FONTS.map(f=><option key={f.id} value={f.id}>{f.label}</option>)}
                    </select>
                  </div>
                  <div className="card-field">
                    <label>Mise en page</label>
                    <select className="card-select" value={card.layout} onChange={e=>patch('layout',e.target.value)}>
                      {LAYOUTS.map(l=><option key={l.id} value={l.id}>{l.label}</option>)}
                    </select>
                  </div>
                </div>
                <div className="card-grid-2" style={{marginTop:10}}>
                  <div className="card-field">
                    <label>Format</label>
                    <select className="card-select" value={card.cardSize} onChange={e=>patch('cardSize',e.target.value)}>
                      {CARD_SIZES.map(s=><option key={s.id} value={s.id}>{s.label}</option>)}
                    </select>
                  </div>
                  <div className="card-field">
                    <label style={{ display:'flex', alignItems:'center', gap:6, cursor:'pointer' }}>
                      <input type="checkbox" checked={card.showQrBack} onChange={e=>patch('showQrBack',e.target.checked)} />
                      QR code au verso
                    </label>
                  </div>
                </div>
              </div>

              {/* Logo */}
              <div className="card-section">
                <h3 className="card-sect-title">Logo / Photo</h3>
                <div style={{ display:'flex', gap:12, alignItems:'center', flexWrap:'wrap' }}>
                  <label className="card-logo-upload">
                    <input type="file" accept="image/*" style={{display:'none'}} onChange={handleLogoFile} />
                    <span>{logoPreview ? '✅ Changer le logo' : '📷 Uploader logo/photo'}</span>
                  </label>
                  {logoPreview && (
                    <div style={{ position:'relative' }}>
                      <img src={logoPreview} alt="Logo" style={{ width:48, height:48, borderRadius:10, objectFit:'cover', border:'1.5px solid var(--border)' }} />
                      <button onClick={() => { patch('logoUrl',''); setLogoPreview(''); }} style={{ position:'absolute', top:-6, right:-6, width:18, height:18, borderRadius:'50%', background:'#EF4444', border:'none', color:'#fff', fontSize:'0.6rem', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>✕</button>
                    </div>
                  )}
                </div>
                <input className="card-input" placeholder="OU URL d'une image (logo)" value={card.logoUrl.startsWith('data:') ? '' : card.logoUrl} onChange={e=>{ patch('logoUrl',e.target.value); setLogoPreview(e.target.value); }} style={{marginTop:8}} />
              </div>

              {/* Mise en page avancée */}
              <div className="card-section">
                <h3 className="card-sect-title">Mise en page avancée</h3>
                <div className="card-field" style={{ marginBottom:14 }}>
                  <label style={{ display:'flex', justifyContent:'space-between' }}>
                    <span>Taille du texte</span>
                    <span style={{ color:'var(--accent)', fontWeight:700 }}>{Math.round(card.textScale*100)}%</span>
                  </label>
                  <input type="range" min="0.6" max="1.4" step="0.05" value={card.textScale} onChange={e=>patch('textScale',parseFloat(e.target.value))} style={{ width:'100%', marginTop:6, accentColor:'var(--accent)' }} />
                </div>
                <div className="card-grid-2" style={{ marginBottom:12 }}>
                  <div className="card-field">
                    <label>Forme du logo</label>
                    <select className="card-select" value={card.avatarShape} onChange={e=>patch('avatarShape',e.target.value)}>
                      <option value="square">Carré</option>
                      <option value="rounded">Arrondi</option>
                      <option value="circle">Rond</option>
                      <option value="hexagon">Hexagone</option>
                    </select>
                  </div>
                  <div className="card-field">
                    <label>Lueur du texte</label>
                    <select className="card-select" value={card.textGlow} onChange={e=>patch('textGlow',parseInt(e.target.value))}>
                      <option value={0}>Aucune</option>
                      <option value={1}>Légère</option>
                      <option value={2}>Moyenne</option>
                      <option value={3}>Intense</option>
                    </select>
                  </div>
                </div>
                <label style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer', fontSize:'0.82rem', color:'var(--text-secondary)' }}>
                  <input type="checkbox" checked={card.tiltEffect} onChange={e=>patch('tiltEffect',e.target.checked)} />
                  Effet 3D Tilt sur la preview (moderne)
                </label>
                {Object.keys(card.textPositions || {}).length > 0 && (
                  <button onClick={()=>patch('textPositions',{})} className="card-btn-sm" style={{ marginTop:10, fontSize:'0.72rem', color:'#EF4444', borderColor:'rgba(239,68,68,0.3)' }}>
                    🗑 Réinitialiser les positions manuelles
                  </button>
                )}
              </div>
            </div>

            {/* RIGHT — Preview */}
            <div className="card-preview-panel">
              <div className="card-preview-sticky">
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14, flexWrap:'wrap', gap:8 }}>
                  <h3 className="card-sect-title" style={{margin:0}}>
                    {side==='front' ? '↑ Recto' : '↓ Verso'}
                  </h3>
                  <div style={{ display:'flex', gap:6 }}>
                    <button onClick={flip} className="card-btn-sm">🔄 Retourner</button>
                    <button onClick={()=>setDesignMode(d=>!d)} className={`card-btn-sm ${designMode?'accent':''}`}>🎨 Designer</button>
                    <button onClick={saveToCollection} className="card-btn-sm accent">💾 Sauvegarder</button>
                  </div>
                </div>
                {designMode && (
                  <div style={{ fontSize:'0.72rem', color:'var(--accent)', marginBottom:8, textAlign:'center', fontWeight:600 }}>
                    🖱 Glissez les textes pour les repositionner · Double-cliquez pour éditer
                  </div>
                )}

                {/* Card flip scene */}
                <div className={`card-scene ${designMode?'design-mode':''}`} ref={sceneRef} style={{ '--card-ratio': `${size.h/size.w}` }}>
                  <div className={`card-flip ${flipping ? 'flipping' : ''} ${side==='back' ? 'show-back' : ''}`} onClick={flip}>
                    {/* FRONT */}
                    <div className="card-face card-face-front" ref={frontRef}>
                      <CardFront
                        card={card} tpl={tpl} font={font} logoPreview={logoPreview}
                        designMode={designMode} onStartDrag={startDrag}
                        inlineEdit={inlineEdit} setInlineEdit={setInlineEdit} onPatch={patch}
                      />
                    </div>
                    {/* BACK */}
                    <div className="card-face card-face-back" ref={backRef}>
                      <CardBack
                        card={card} tpl={tpl} font={font} qrDataUrl={qrDataUrl}
                        designMode={designMode} onStartDrag={startDrag}
                        inlineEdit={inlineEdit} setInlineEdit={setInlineEdit} onPatch={patch}
                      />
                    </div>
                  </div>
                </div>

                <p style={{ textAlign:'center', fontSize:'0.72rem', color:'var(--text-muted)', marginTop:8 }}>{designMode ? 'Mode designer actif — les exports capturent la carte telle quelle' : 'Cliquez sur la carte pour retourner'}</p>

                {/* Export buttons */}
                <div className="card-exports">
                  <button onClick={async () => { const ok = await checkAccessThen(); if (ok) exportPNG('front') }} disabled={!!exporting} className="card-btn-export primary">
                    {exporting==='png-front' ? '⏳' : '⬇️'} PNG Recto
                  </button>
                  <button onClick={async () => { const ok = await checkAccessThen(); if (ok) exportPNG('back') }} disabled={!!exporting} className="card-btn-export">
                    {exporting==='png-back' ? '⏳' : '⬇️'} PNG Verso
                  </button>
                  <button onClick={async () => { const ok = await checkAccessThen(); if (ok) exportPDF() }} disabled={!!exporting} className="card-btn-export accent">
                    {exporting==='pdf' ? '⏳' : '📄'} PDF Print
                  </button>
                  <button onClick={exportVCard} className="card-btn-export">📱 vCard</button>
                  <button onClick={shareCard} className="card-btn-export">🔗 Partager</button>
                </div>

                {/* Info print */}
                <div className="card-print-info">
                  <span>📐 Format : {CARD_SIZES.find(s=>s.id===card.cardSize)?.label}</span>
                  <span>🖨 Résolution export : 4× (print-ready)</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── COLLECTION ── */}
        {tab === 'collection' && (
          <div className="card-anim">
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16, flexWrap:'wrap', gap:10 }}>
              <h2 style={{ margin:0, fontSize:'1rem', fontWeight:800, color:'var(--text-primary)' }}>Mes cartes ({collection.length})</h2>
              {collection.length>0 && <button onClick={() => { if(confirm('Vider la collection ?')) { setCol([]); ss(COLLECTION_KEY,[]); }}} className="card-btn-sm" style={{color:'#EF4444',borderColor:'rgba(239,68,68,0.3)'}}>🗑 Vider</button>}
            </div>
            {collection.length===0 ? (
              <div style={{ textAlign:'center', padding:'60px 20px', color:'var(--text-muted)' }}>
                <div style={{ fontSize:'3rem', marginBottom:12 }}>📁</div>
                <p style={{ color:'var(--text-secondary)', marginBottom:20 }}>Aucune carte sauvegardée</p>
                <button onClick={() => setTab('design')} className="card-btn-export primary">Créer une carte</button>
              </div>
            ) : (
              <div className="card-collection-grid">
                {collection.map(c => {
                  const t = TEMPLATES.find(x => x.id===c.templateId) || TEMPLATES[0];
                  return (
                    <div key={c.id} className="card-col-item">
                      <div className="card-col-preview" style={{ background: t.preview, fontFamily: FONTS.find(f=>f.id===c.font)?.css }}>
                        <div style={{ fontWeight:800, fontSize:'0.7rem', color:'#fff', textShadow:'0 1px 3px rgba(0,0,0,0.4)' }}>{c.name}</div>
                        <div style={{ fontSize:'0.55rem', color:'rgba(255,255,255,0.8)', marginTop:2 }}>{c.title}</div>
                        <div style={{ fontSize:'0.5rem', color:'rgba(255,255,255,0.65)', marginTop:1 }}>{c.company}</div>
                      </div>
                      <div className="card-col-info">
                        <div className="card-col-name">{c.name}</div>
                        <div className="card-col-date">{dateFR(c.savedAt)}</div>
                        <div style={{ display:'flex', gap:6, marginTop:8 }}>
                          <button onClick={() => loadFromCollection(c)} className="card-btn-sm accent" style={{ flex:1, fontSize:'0.72rem' }}>✏️ Charger</button>
                          <button onClick={() => { const n = collection.filter(x=>x.id!==c.id); setCol(n); ss(COLLECTION_KEY,n); }} className="card-btn-sm" style={{ fontSize:'0.72rem', color:'#EF4444', borderColor:'rgba(239,68,68,0.3)' }}>🗑</button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── DIGITAL CARD ── */}
        {tab === 'digital' && (() => {
          const dt = DIGITAL_TPLS.find(t => t.id === digitalTpl) || DIGITAL_TPLS[0]
          const activeSocials = SOCIAL_OPTIONS.filter(s => card.socials[s.id])
          const nameC  = dt.bodyNameColor    || dt.nameColor
          const titleC = dt.bodyTitleColor   || dt.titleColor
          const compC  = dt.bodyCompanyColor || dt.companyColor

          return (
          <div className="card-anim">
            {/* Choisir un template */}
            <div style={{ marginBottom:24, padding: '22px 18px', borderRadius: 16, background: 'var(--surface)', border: '1.5px solid var(--border)' }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
                <div style={{ fontSize:'0.9rem', fontWeight:800, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'1.5px' }}>Choisir un template</div>
                <span style={{ fontSize:'0.7rem', fontWeight:700, color:'var(--text-muted)' }}>{DIGITAL_TPLS.length} designs</span>
              </div>
              <div className="dig-tpl-scroll">
                {(showAllDigital ? DIGITAL_TPLS : DIGITAL_TPLS.slice(0, 6)).map(t => (
                  <button key={t.id}
                    className={`dig-tpl-btn ${digitalTpl === t.id ? 'active' : ''}`}
                    onClick={() => setDigitalTpl(t.id)}
                    title={`${t.name} · ${t.tier}`}>
                    <div className="dig-tpl-swatch" style={{ background: typeof t.card.background === 'string' ? t.card.background : t.card.background }} />
                    <div style={{ display:'flex', alignItems:'center', gap:5, marginTop:6 }}>
                      <span style={{ fontSize:'0.72rem', fontWeight:700, color:'var(--text-secondary)' }}>{t.name}</span>
                    </div>
                    <span style={{ fontSize:'0.62rem', fontWeight:800, padding:'2px 8px', borderRadius:99, background:TIER_COLORS[t.tier]+'22', color:TIER_COLORS[t.tier], border:`1px solid ${TIER_COLORS[t.tier]}44` }}>{t.tier}</span>
                  </button>
                ))}
              </div>
              {DIGITAL_TPLS.length > 6 && (
                <button onClick={() => setShowAllDigital(v => !v)}
                  style={{ marginTop: 12, width: '100%', padding: '10px', borderRadius: 10, border: '1.5px dashed var(--border)', background: 'transparent', color: 'var(--text-muted)', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s' }}>
                  {showAllDigital ? '↑ Réduire' : `↓ Voir les ${DIGITAL_TPLS.length} templates`}
                </button>
              )}
            </div>

            <div style={{ display:'flex', gap:8, marginBottom:14, flexWrap:'wrap' }}>
              <button onClick={()=>setDigitalFullscreen(true)} className="card-btn-export accent" style={{ flex:1 }}>⛶ Voir en plein écran</button>
            </div>

            <div className="card-digital-layout">
              {/* Digital card render */}
              <div>
                <div style={{ ...dt.wrap, borderRadius:24, padding:24, display:'flex', justifyContent:'center', alignItems:'flex-start', minHeight:200 }}>
                  <div style={{ ...dt.card, width:'100%', maxWidth:400, overflow:'hidden', position:'relative' }}>
                    {/* Dots pattern overlay */}
                    {dt.pattern === 'dots' && (
                      <div style={{ position:'absolute', inset:0, backgroundImage:`radial-gradient(${dt.accent}15 1.5px, transparent 1.5px)`, backgroundSize:'18px 18px', pointerEvents:'none', zIndex:0 }} />
                    )}
                    {dt.pattern === 'circuit' && (
                      <svg style={{ position:'absolute', inset:0, width:'100%', height:'100%', opacity:0.06, pointerEvents:'none', zIndex:0 }} viewBox="0 0 400 600">
                        <path d="M0 100h100M100 100v100h100M200 200h100M300 200v-100h100M150 0v200M250 400h150M50 300h200M200 100v300" stroke={dt.accent} strokeWidth="1.5" fill="none"/>
                        {[100,200,300,150,250].map((x,i) => <circle key={i} cx={x} cy={i%2===0?100:200} r="4" fill={dt.accent} />)}
                      </svg>
                    )}

                    {/* Header */}
                    <div style={{ ...dt.hdr, display:'flex', flexDirection:'column', alignItems:'center', textAlign:'center', position:'relative', zIndex:1 }}>
                      {logoPreview
                        ? <img src={logoPreview} alt="Logo preview" width={72} height={72} style={{ borderRadius:'50%', objectFit:'cover', border:`3px solid ${dt.accent}`, boxShadow:`0 0 0 4px ${dt.accent}22, 0 8px 24px rgba(0,0,0,0.25)`, marginBottom:12 }} />
                        : <div style={{ width:72, height:72, borderRadius:'50%', background:`linear-gradient(135deg,${dt.accent},${dt.accent}88)`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.6rem', fontWeight:900, color:'#fff', marginBottom:12, boxShadow:`0 8px 24px ${dt.accent}44` }}>
                            {card.name.split(' ').map(w=>w[0]).join('').slice(0,2) || '?'}
                          </div>
                      }
                      <div style={{ fontSize:'1.2rem', fontWeight:900, color:dt.nameColor, lineHeight:1.2, letterSpacing:'-0.01em' }}>{card.name || 'Votre Nom'}</div>
                      {card.title && <div style={{ fontSize:'0.82rem', color:dt.titleColor, marginTop:3 }}>{card.title}</div>}
                      {card.company && <div style={{ fontSize:'0.85rem', fontWeight:700, color:dt.companyColor, marginTop:4 }}>{card.company}</div>}
                      {card.tagline && <div style={{ fontSize:'0.75rem', color:dt.titleColor, marginTop:6, fontStyle:'italic', opacity:0.8 }}>{card.tagline}</div>}
                    </div>

                    {/* Body */}
                    <div style={{ padding:'16px 20px 20px', position:'relative', zIndex:1 }}>
                      {/* Bio */}
                      {card.bio && (
                        <div style={{ fontSize:'0.78rem', lineHeight:1.6, color:titleC, padding:'8px 12px', borderRadius:10, background:dt.btnBg, border:`1px solid ${dt.btnBorder}`, marginBottom:12, textAlign:'center' }}>
                          {card.bio}
                        </div>
                      )}

                      {/* Skills / Languages / Certs */}
                      {(card.skills || card.languages || card.certifications) && (
                        <div style={{ display:'flex', flexWrap:'wrap', gap:5, justifyContent:'center', marginBottom:12 }}>
                          {card.skills?.split(',').map(s=>s.trim()).filter(Boolean).map(s => (
                            <span key={s} style={{ padding:'2px 9px', borderRadius:99, fontSize:'0.65rem', fontWeight:700, background:dt.pillBg, border:`1px solid ${dt.pillBorder}`, color:dt.pillText }}>{s}</span>
                          ))}
                          {card.languages?.split(',').map(l=>l.trim()).filter(Boolean).map(l => (
                            <span key={l} style={{ padding:'2px 9px', borderRadius:99, fontSize:'0.65rem', fontWeight:700, background:dt.pillBg, border:`1px solid ${dt.pillBorder}`, color:dt.pillText }}>🌍 {l}</span>
                          ))}
                          {card.certifications?.split(',').map(c=>c.trim()).filter(Boolean).map(c => (
                            <span key={c} style={{ padding:'2px 9px', borderRadius:99, fontSize:'0.65rem', fontWeight:700, background:dt.pillBg, border:`1px solid ${dt.pillBorder}`, color:dt.pillText }}>🏆 {c}</span>
                          ))}
                        </div>
                      )}

                      {/* Contact buttons */}
                      <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                        {[
                          card.tel        && ['📞', card.tel,        `tel:${card.tel}`],
                          card.email      && ['✉️', card.email,      `mailto:${card.email}`],
                          card.website    && ['🌐', card.website,     card.website],
                          card.address    && ['📍', card.address,     `https://maps.google.com/?q=${encodeURIComponent(card.address)}`],
                          card.portfolio  && ['🗂', 'Portfolio',      card.portfolio],
                          card.bookingUrl && ['📅', 'Prendre RDV',    card.bookingUrl],
                          card.paymentLink&& ['💳', 'Paiement mobile',card.paymentLink],
                        ].filter(Boolean).map(([icon, label, href]) => (
                          <a key={label} href={href} target="_blank" rel="noreferrer"
                            style={{ display:'flex', alignItems:'center', gap:9, padding:'9px 13px', borderRadius:10, background:dt.btnBg, border:`1px solid ${dt.btnBorder}`, color:dt.btnText, textDecoration:'none', fontSize:'0.8rem', fontWeight:500, transition:'opacity 0.2s' }}>
                            <span style={{ opacity:0.85 }}>{icon}</span>
                            <span style={{ flex:1 }}>{label}</span>
                            <span style={{ opacity:0.4, fontSize:'0.7rem' }}>›</span>
                          </a>
                        ))}
                      </div>

                      {/* Social icons with REAL SVG brand icons */}
                      {activeSocials.length > 0 && (
                        <div style={{ display:'flex', gap:8, flexWrap:'wrap', justifyContent:'center', marginTop:14 }}>
                          {activeSocials.map(s => (
                            <a key={s.id} href={`${s.prefix}${card.socials[s.id]}`} target="_blank" rel="noreferrer"
                              title={s.label}
                              style={{ width:40, height:40, borderRadius:12, display:'flex', alignItems:'center', justifyContent:'center', background:dt.socialBg, border:`1px solid ${dt.socialBorder}`, textDecoration:'none', transition:'transform 0.2s, opacity 0.2s' }}>
                              <SocialIcon id={s.id} size={19} />
                            </a>
                          ))}
                        </div>
                      )}

                      {/* NFC badge */}
                      <div style={{ display:'flex', alignItems:'center', gap:8, marginTop:14, padding:'8px 12px', borderRadius:10, background:dt.btnBg, border:`1px solid ${dt.btnBorder}` }}>
                        <span style={{ fontSize:'1rem' }}>📡</span>
                        <div>
                          <div style={{ fontWeight:700, fontSize:'0.75rem', color:compC }}>NFC-Ready</div>
                          <div style={{ fontSize:'0.68rem', color:titleC, opacity:0.7 }}>Programmable sur tag NFC</div>
                        </div>
                        <div style={{ marginLeft:'auto', display:'flex', gap:6 }}>
                          <button onClick={exportVCard} style={{ padding:'5px 10px', borderRadius:8, border:`1px solid ${dt.btnBorder}`, background:dt.btnBg, color:dt.btnText, fontSize:'0.7rem', fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>📱 vCard</button>
                          <button onClick={shareCard} style={{ padding:'5px 10px', borderRadius:8, border:`1px solid ${dt.btnBorder}`, background:dt.btnBg, color:dt.btnText, fontSize:'0.7rem', fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>🔗</button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions below card */}
                <div style={{ display:'flex', gap:8, marginTop:12, flexWrap:'wrap' }}>
                  <button onClick={exportVCard} className="card-btn-export primary" style={{ flex:1 }}>📱 Télécharger vCard</button>
                  <button onClick={shareCard} className="card-btn-export" style={{ flex:1 }}>🔗 Partager</button>
                </div>
              </div>

              {/* QR Code */}
              <div className="card-digital-qr">
                <h3 style={{ margin:'0 0 12px', fontSize:'0.88rem', fontWeight:700, color:'var(--text-primary)' }}>QR Code de votre carte</h3>
                {qrDataUrl && (
                  <div style={{ padding:10, borderRadius:14, background:'#fff', display:'inline-block', boxShadow:'0 4px 16px rgba(0,0,0,0.1)' }}>
                    <img src={qrDataUrl} alt="QR" style={{ width:160, height:160, display:'block', borderRadius:6 }} />
                  </div>
                )}
                <p style={{ fontSize:'0.75rem', color:'var(--text-muted)', marginTop:10, textAlign:'center', maxWidth:180, lineHeight:1.5 }}>
                  Scannez pour ajouter directement aux contacts
                </p>
                {qrDataUrl && (
                  <a href={qrDataUrl} download={`qr_carte_${card.name}.png`} className="card-btn-sm" style={{ marginTop:8, textDecoration:'none', display:'inline-flex', alignItems:'center', gap:5 }}>⬇️ Télécharger</a>
                )}

                {/* Info icons for active socials */}
                {activeSocials.length > 0 && (
                  <div style={{ marginTop:16, width:'100%' }}>
                    <div style={{ fontSize:'0.68rem', fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.8px', marginBottom:8 }}>Réseaux actifs</div>
                    <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                      {activeSocials.map(s => (
                        <div key={s.id} title={s.label} style={{ width:32, height:32, borderRadius:8, background:'var(--bg-primary)', border:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                          <SocialIcon id={s.id} size={16} />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          )
        })()}
      </div>

      {/* ── Digital Fullscreen Overlay ── */}
      {digitalFullscreen && (() => {
        const dt = DIGITAL_TPLS.find(t => t.id === digitalTpl) || DIGITAL_TPLS[0];
        const activeSocials = SOCIAL_OPTIONS.filter(s => card.socials[s.id]);
        const nameC = dt.bodyNameColor || dt.nameColor;
        const titleC = dt.bodyTitleColor || dt.titleColor;
        const compC = dt.bodyCompanyColor || dt.companyColor;
        return (
          <div className="dig-fs-overlay" onClick={()=>setDigitalFullscreen(false)}>
            <button className="dig-fs-close" onClick={()=>setDigitalFullscreen(false)}>✕</button>
            <div className="dig-fs-card" onClick={e=>e.stopPropagation()}>
              <div style={{ ...dt.card, width:'100%', maxWidth:480, overflow:'hidden', position:'relative', borderRadius:24 }}>
                {dt.pattern === 'dots' && <div style={{ position:'absolute', inset:0, backgroundImage:`radial-gradient(${dt.accent}15 1.5px, transparent 1.5px)`, backgroundSize:'18px 18px', pointerEvents:'none', zIndex:0 }} />}
                {dt.pattern === 'circuit' && <svg style={{ position:'absolute', inset:0, width:'100%', height:'100%', opacity:0.06, pointerEvents:'none', zIndex:0 }} viewBox="0 0 400 600"><path d="M0 100h100M100 100v100h100M200 200h100M300 200v-100h100M150 0v200M250 400h150M50 300h200M200 100v300" stroke={dt.accent} strokeWidth="1.5" fill="none"/>{[100,200,300,150,250].map((x,i)=><circle key={i} cx={x} cy={i%2===0?100:200} r="4" fill={dt.accent} />)}</svg>}

                <div style={{ ...dt.hdr, display:'flex', flexDirection:'column', alignItems:'center', textAlign:'center', position:'relative', zIndex:1 }}>
                  {logoPreview
                    ? <img src={logoPreview} alt="Logo preview" width={96} height={96} style={{ borderRadius:'50%', objectFit:'cover', border:`3px solid ${dt.accent}`, boxShadow:`0 0 0 4px ${dt.accent}22, 0 8px 24px rgba(0,0,0,0.25)`, marginBottom:14 }} />
                    : <div style={{ width:96, height:96, borderRadius:'50%', background:`linear-gradient(135deg,${dt.accent},${dt.accent}88)`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'2rem', fontWeight:900, color:'#fff', marginBottom:14, boxShadow:`0 8px 24px ${dt.accent}44` }}>{card.name.split(' ').map(w=>w[0]).join('').slice(0,2)||'?'}</div>
                  }
                  <div style={{ fontSize:'1.6rem', fontWeight:900, color:dt.nameColor, lineHeight:1.2 }}>{card.name||'Votre Nom'}</div>
                  {card.title && <div style={{ fontSize:'1rem', color:dt.titleColor, marginTop:4 }}>{card.title}</div>}
                  {card.company && <div style={{ fontSize:'1.05rem', fontWeight:700, color:dt.companyColor, marginTop:6 }}>{card.company}</div>}
                  {card.tagline && <div style={{ fontSize:'0.92rem', color:dt.titleColor, marginTop:8, fontStyle:'italic', opacity:0.8 }}>{card.tagline}</div>}
                </div>

                <div style={{ padding:'20px 24px 24px', position:'relative', zIndex:1 }}>
                  {card.bio && <div style={{ fontSize:'0.9rem', lineHeight:1.6, color:titleC, padding:'10px 14px', borderRadius:12, background:dt.btnBg, border:`1px solid ${dt.btnBorder}`, marginBottom:14, textAlign:'center' }}>{card.bio}</div>}

                  {(card.skills || card.languages || card.certifications) && (
                    <div style={{ display:'flex', flexWrap:'wrap', gap:6, justifyContent:'center', marginBottom:14 }}>
                      {card.skills?.split(',').map(s=>s.trim()).filter(Boolean).map(s=><span key={s} style={{ padding:'3px 11px', borderRadius:99, fontSize:'0.72rem', fontWeight:700, background:dt.pillBg, border:`1px solid ${dt.pillBorder}`, color:dt.pillText }}>{s}</span>)}
                      {card.languages?.split(',').map(l=>l.trim()).filter(Boolean).map(l=><span key={l} style={{ padding:'3px 11px', borderRadius:99, fontSize:'0.72rem', fontWeight:700, background:dt.pillBg, border:`1px solid ${dt.pillBorder}`, color:dt.pillText }}>🌍 {l}</span>)}
                      {card.certifications?.split(',').map(c=>c.trim()).filter(Boolean).map(c=><span key={c} style={{ padding:'3px 11px', borderRadius:99, fontSize:'0.72rem', fontWeight:700, background:dt.pillBg, border:`1px solid ${dt.pillBorder}`, color:dt.pillText }}>🏆 {c}</span>)}
                    </div>
                  )}

                  {/* Contact actions */}
                  <div style={{ display:'flex', flexDirection:'column', gap:8, marginBottom:14 }}>
                    {[
                      card.tel     && ['📞 Appeler', `tel:${card.tel}`, '#10B981'],
                      card.email   && ['✉️ Envoyer un email', `mailto:${card.email}`, '#6366F1'],
                      card.website && ['🌐 Visiter le site', card.website, '#0EA5E9'],
                      card.address && ['📍 Itinéraire', `https://maps.google.com/?q=${encodeURIComponent(card.address)}`, '#EF4444'],
                      card.portfolio && ['🗂 Portfolio', card.portfolio, '#8B5CF6'],
                      card.bookingUrl && ['📅 Prendre RDV', card.bookingUrl, '#F59E0B'],
                    ].filter(Boolean).map(([label, href, color]) => (
                      <a key={label} href={href} target="_blank" rel="noreferrer"
                        style={{ display:'flex', alignItems:'center', gap:10, padding:'12px 16px', borderRadius:12, background:dt.btnBg, border:`1px solid ${dt.btnBorder}`, color:dt.btnText, textDecoration:'none', fontSize:'0.92rem', fontWeight:600, transition:'opacity 0.2s' }}>
                        <span style={{ width:8, height:8, borderRadius:'50%', background:color, flexShrink:0 }} />
                        <span style={{ flex:1 }}>{label}</span>
                        <span style={{ opacity:0.4, fontSize:'0.8rem' }}>›</span>
                      </a>
                    ))}
                  </div>

                  {activeSocials.length > 0 && (
                    <div style={{ display:'flex', gap:10, flexWrap:'wrap', justifyContent:'center', marginBottom:14 }}>
                      {activeSocials.map(s => (
                        <a key={s.id} href={`${s.prefix}${card.socials[s.id]}`} target="_blank" rel="noreferrer" title={s.label}
                          style={{ width:48, height:48, borderRadius:14, display:'flex', alignItems:'center', justifyContent:'center', background:dt.socialBg, border:`1px solid ${dt.socialBorder}`, textDecoration:'none', transition:'transform 0.2s' }}>
                          <SocialIcon id={s.id} size={22} />
                        </a>
                      ))}
                    </div>
                  )}

                  {/* Bottom actions */}
                  <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                    <button onClick={exportVCard} className="card-btn-export primary" style={{ flex:1, fontSize:'0.88rem', padding:'12px' }}>📱 Enregistrer le contact</button>
                    <button onClick={shareCard} className="card-btn-export" style={{ flex:1, fontSize:'0.88rem', padding:'12px' }}>🔗 Partager</button>
                  </div>
                </div>
              </div>

              {/* QR in fullscreen */}
              {qrDataUrl && (
                <div style={{ marginTop:16, display:'flex', flexDirection:'column', alignItems:'center', gap:8 }}>
                  <div style={{ padding:10, borderRadius:14, background:'#fff', display:'inline-block', boxShadow:'0 4px 16px rgba(0,0,0,0.1)' }}>
                    <img src={qrDataUrl} alt="QR" style={{ width:140, height:140, display:'block', borderRadius:6 }} />
                  </div>
                  <span style={{ fontSize:'0.78rem', color:'rgba(255,255,255,0.7)' }}>Scannez pour ajouter aux contacts</span>
                </div>
              )}
            </div>
          </div>
        );
      })()}

      <ToolUpsellModal
        isOpen={guard.upsellOpen}
        config={guard.upsellConfig}
        onClose={guard.closeUpsell}
        onUseCredit={async () => {
          const r = await guard.checkAndDebit()
          if (r.ok) guard.closeUpsell()
        }}
      />
    </div>
  );
}

function getTextGlow(level, color) {
  if (!level) return 'none';
  const c = color || '#fff';
  const intensities = ['0 0 2px','0 0 6px','0 0 14px'];
  const alphas = ['33','55','88'];
  return `${intensities[level-1]} ${c}${alphas[level-1]}`;
}

// ─── CardFront ────────────────────────────────────────────────────────────────
function CardFront({ card, tpl, font, logoPreview, designMode, onStartDrag, inlineEdit, setInlineEdit, onPatch }) {
  const f = tpl.front;
  const scale = card.textScale || 1;
  const glow = getTextGlow(card.textGlow, f.text);
  const shape = card.avatarShape || 'square';

  function posStyle(field, extra = {}) {
    const p = card.textPositions?.[`front:${field}`];
    if (p) return { position:'absolute', left:`${p.left}%`, top:`${p.top}%`, zIndex:2, cursor: designMode?'move':'inherit', ...extra };
    return { position:'relative', cursor: designMode?'move':'inherit', ...extra };
  }
  function handleDrag(field, e) { if (designMode) onStartDrag(e, 'front', field); }
  function handleDbl(field, value) { if (designMode) setInlineEdit({ side:'front', field, value }); }
  function commitInline(val) {
    const map = { name:'name', title:'title', company:'company', tagline:'tagline' };
    if (map[inlineEdit.field]) onPatch(map[inlineEdit.field], val);
    setInlineEdit(null);
  }
  const shapeBorder = shape==='circle'?999:shape==='rounded'?10:6;
  const shapeClip = shape==='hexagon'?'polygon(25% 0%,75% 0%,100% 50%,75% 100%,25% 100%,0% 50%)':'none';

  const InlineInput = ({ field, val, style }) => (
    <input autoFocus value={val} onChange={e=>setInlineEdit({...inlineEdit,value:e.target.value})}
      onBlur={()=>commitInline(inlineEdit.value)} onKeyDown={e=>e.key==='Enter'&&commitInline(inlineEdit.value)}
      style={{ ...style, background:'rgba(0,0,0,0.25)', border:'1px dashed var(--accent)', outline:'none', width:'100%', fontFamily:'inherit', padding:'2px 4px', borderRadius:4, color:style.color }} />
  );

  const isEdit = (f) => inlineEdit?.side==='front' && inlineEdit?.field===f;

  return (
    <div style={{ width:'100%', height:'100%', borderRadius:12, position:'relative', overflow:'hidden', background: f.bg, fontFamily: font.css, display:'flex', flexDirection:'column', justifyContent:'space-between', padding: '8%' }}>
      {f.pattern === 'dots'    && <PatternDots color={f.accent} />}
      {f.pattern === 'lines'   && <PatternLines color={f.accent} />}
      {f.pattern === 'grid'    && <PatternGrid color={f.accent} />}
      {f.pattern === 'circuit' && <PatternCircuit color={f.accent} />}
      {f.pattern === 'waves'   && <PatternWaves color={f.accent} />}

      <div style={{ position:'relative', zIndex:1, flex:1 }}>
        {/* Logo */}
        <div style={posStyle('logo',{ marginBottom:'6%' })} onMouseDown={e=>handleDrag('logo',e)} data-field="front:logo">
          {logoPreview ? (
            <img src={logoPreview} alt="logo" crossOrigin="anonymous"
              style={{ width:'14%', height:'auto', aspectRatio:'1', borderRadius:shapeBorder, objectFit:'cover', border:`1.5px solid ${f.accent}40`, clipPath:shapeClip }} />
          ) : (
            <div style={{ width:'12%', height:0, paddingBottom:'12%', borderRadius:shapeBorder, background:`${f.accent}25`, border:`1.5px solid ${f.accent}40`, flexShrink:0, clipPath:shapeClip }} />
          )}
        </div>

        {/* Name + title */}
        <div style={posStyle('name',{ textAlign:card.layout==='center'?'center':'left', width:'100%' })} onMouseDown={e=>handleDrag('name',e)} data-field="front:name" onDoubleClick={()=>handleDbl('name',card.name)}>
          {isEdit('name') ? (
            <InlineInput field="name" val={inlineEdit.value} style={{ fontSize:`${1.15*scale}em`, fontWeight:900, color:f.text, lineHeight:1.1, letterSpacing:'-0.01em' }} />
          ) : (
            <div style={{ fontSize:`${1.15*scale}em`, fontWeight:900, color:f.text, lineHeight:1.1, letterSpacing:'-0.01em', textShadow:glow, marginBottom:'2%', display:'flex', alignItems:'center', gap:'3%' }}>
              <span style={{ opacity:0.6, display:'flex' }}>{MiniIcon.user}</span>
              <span style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:'90%' }} title={card.name}>{card.name}</span>
            </div>
          )}
        </div>

        <div style={posStyle('title',{ textAlign:card.layout==='center'?'center':'left', width:'100%' })} onMouseDown={e=>handleDrag('title',e)} data-field="front:title" onDoubleClick={()=>handleDbl('title',card.title)}>
          {isEdit('title') ? (
            <InlineInput field="title" val={inlineEdit.value} style={{ fontSize:`${0.55*scale}em`, fontWeight:600, color:f.sub, letterSpacing:'0.8px', textTransform:'uppercase' }} />
          ) : (
            <div style={{ fontSize:`${0.55*scale}em`, fontWeight:600, color:f.sub, letterSpacing:'0.8px', textTransform:'uppercase', textShadow:glow, marginBottom:'3%', display:'flex', alignItems:'center', gap:'3%' }}>
              <span style={{ opacity:0.5, display:'flex' }}>{MiniIcon.briefcase}</span>
              <span style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:'90%' }} title={card.title}>{card.title}</span>
            </div>
          )}
        </div>

        {card.layout !== 'split' && (
          <div style={posStyle('company',{ textAlign:card.layout==='center'?'center':'left', width:'100%' })} onMouseDown={e=>handleDrag('company',e)} data-field="front:company" onDoubleClick={()=>handleDbl('company',card.company)}>
            {isEdit('company') ? (
              <InlineInput field="company" val={inlineEdit.value} style={{ fontSize:`${0.5*scale}em`, fontWeight:700, color:f.accent, letterSpacing:'0.5px' }} />
            ) : (
              <div style={{ fontSize:`${0.5*scale}em`, fontWeight:700, color:f.accent, letterSpacing:'0.5px', textShadow:glow, display:'flex', alignItems:'center', gap:'3%' }}>
                <span style={{ opacity:0.6, display:'flex' }}>{MiniIcon.building}</span>
                <span style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:'90%' }} title={card.company}>{card.company}</span>
              </div>
            )}
          </div>
        )}

        {card.layout === 'split' && (
          <div style={posStyle('company',{ textAlign:'right', width:'100%' })} onMouseDown={e=>handleDrag('company',e)} data-field="front:company" onDoubleClick={()=>handleDbl('company',card.company)}>
            {isEdit('company') ? (
              <InlineInput field="company" val={inlineEdit.value} style={{ fontSize:`${0.55*scale}em`, fontWeight:800, color:f.accent, textTransform:'uppercase', letterSpacing:'2px' }} />
            ) : (
              <div style={{ fontSize:`${0.55*scale}em`, fontWeight:800, color:f.accent, textTransform:'uppercase', letterSpacing:'2px', textShadow:glow, display:'flex', alignItems:'center', gap:'3%', justifyContent:'flex-end' }}>
                <span style={{ opacity:0.6, display:'flex' }}>{MiniIcon.building}</span>
                <span style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:'90%' }} title={card.company}>{card.company}</span>
              </div>
            )}
          </div>
        )}

        {/* Tagline */}
        {card.tagline && (
          <div style={posStyle('tagline',{ marginTop:'auto', paddingTop:'4%' })} onMouseDown={e=>handleDrag('tagline',e)} data-field="front:tagline" onDoubleClick={()=>handleDbl('tagline',card.tagline)}>
            <div style={{ width:'100%', height:'1px', background:`${f.bar}40`, marginBottom:'3%' }} />
            {isEdit('tagline') ? (
              <InlineInput field="tagline" val={inlineEdit.value} style={{ fontSize:`${0.42*scale}em`, color:f.sub, fontStyle:'italic', letterSpacing:'0.3px' }} />
            ) : (
              <div style={{ fontSize:`${0.42*scale}em`, color:f.sub, fontStyle:'italic', letterSpacing:'0.3px', textShadow:glow }}>{card.tagline}</div>
            )}
          </div>
        )}
      </div>

      <div style={{ position:'absolute', bottom:0, left:0, right:0, height:'3%', background:f.bar, opacity:0.85 }} />
    </div>
  );
}

// ─── CardBack ─────────────────────────────────────────────────────────────────
function CardBack({ card, tpl, font, qrDataUrl, designMode, onStartDrag, inlineEdit, setInlineEdit, onPatch }) {
  const b = tpl.back;
  const scale = card.textScale || 1;
  const glow = getTextGlow(card.textGlow, b.text);

  const contacts = [
    card.tel    && [{svg:'phone',color:'#10B981'}, card.tel, 'tel'],
    card.email  && [{svg:'mail',color:'#6366F1'}, card.email, 'email'],
    card.website&& [{svg:'globe',color:'#0EA5E9'}, card.website, 'website'],
    card.address&& [{svg:'pin',color:'#EF4444'}, card.address, 'address'],
  ].filter(Boolean);

  const socials = SOCIAL_OPTIONS.filter(s => card.socials[s.id]);

  function posStyle(field, extra = {}) {
    const p = card.textPositions?.[`back:${field}`];
    if (p) return { position:'absolute', left:`${p.left}%`, top:`${p.top}%`, zIndex:2, cursor: designMode?'move':'inherit', ...extra };
    return { position:'relative', cursor: designMode?'move':'inherit', ...extra };
  }
  function handleDrag(field, e) { if (designMode) onStartDrag(e, 'back', field); }
  function handleDbl(field, value) { if (designMode) setInlineEdit({ side:'back', field, value }); }
  function commitInline(val) {
    const map = { tel:'tel', email:'email', website:'website', address:'address', company:'company' };
    if (map[inlineEdit.field]) onPatch(map[inlineEdit.field], val);
    setInlineEdit(null);
  }

  const InlineInput = ({ val, style }) => (
    <input autoFocus value={val} onChange={e=>setInlineEdit({...inlineEdit,value:e.target.value})}
      onBlur={()=>commitInline(inlineEdit.value)} onKeyDown={e=>e.key==='Enter'&&commitInline(inlineEdit.value)}
      style={{ ...style, background:'rgba(0,0,0,0.25)', border:'1px dashed var(--accent)', outline:'none', width:'100%', fontFamily:'inherit', padding:'2px 4px', borderRadius:4, color:style.color }} />
  );
  const isEdit = (f) => inlineEdit?.side==='back' && inlineEdit?.field===f;

  return (
    <div style={{ width:'100%', height:'100%', borderRadius:12, position:'relative', overflow:'hidden', background:b.bg, fontFamily:font.css, display:'flex', flexDirection:'column', padding:'8%' }}>
      <div style={{ position:'absolute', top:0, left:0, right:0, height:'3%', background:b.accent, opacity:0.8 }} />

      <div style={{ position:'relative', zIndex:1, flex:1, display:'flex', gap:'5%', marginTop:'4%' }}>
        {/* Left: contacts + socials */}
        <div style={posStyle('contacts',{ flex:1, display:'flex', flexDirection:'column', gap:'4%', justifyContent:'center' })} onMouseDown={e=>handleDrag('contacts',e)} data-field="back:contacts">
          {contacts.map(([iconObj, val, key]) => (
            <div key={val} style={{ display:'flex', alignItems:'center', gap:'4%' }}>
              <span style={{ fontSize:`${0.6*scale}em`, opacity:0.85, display:'flex', alignItems:'center', color:iconObj.color }}>{MiniIcon[iconObj.svg]}</span>
              <span title={val} style={{ fontSize:`${0.52*scale}em`, color:b.text, fontWeight:500, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:'80%', textShadow:glow }}>{val}</span>
            </div>
          ))}

          {socials.length > 0 && (
            <div style={{ display:'flex', gap:'4%', flexWrap:'wrap', marginTop:'3%' }}>
              {socials.map(s => (
                <span key={s.id} style={{ fontSize:`${0.45*scale}em`, opacity:0.8 }}>{s.icon}</span>
              ))}
            </div>
          )}
        </div>

        {/* Right: QR */}
        {card.showQrBack && qrDataUrl && (
          <div style={posStyle('qr',{ display:'flex', flexDirection:'column', alignItems:'center', gap:'4%', flexShrink:0 })} onMouseDown={e=>handleDrag('qr',e)} data-field="back:qr">
            <img src={qrDataUrl} alt="QR" crossOrigin="anonymous"
              style={{ width:'20%', height:'auto', aspectRatio:'1', borderRadius:4, background:b.qrBg, padding:'1%', flexShrink:0 }}
              onError={e => { e.target.style.display='none'; }} />
            <div style={{ fontSize:`${0.42*scale}em`, color:b.text, opacity:0.6, textAlign:'center', whiteSpace:'nowrap', textShadow:glow }}>Scanner pour contacts</div>
          </div>
        )}
      </div>

      {/* Company name bottom */}
      <div style={posStyle('company',{ position:'absolute', bottom:'5%', left:'8%', right:'8%', display:'flex', justifyContent:'space-between', alignItems:'flex-end' })} onMouseDown={e=>handleDrag('company',e)} data-field="back:company" onDoubleClick={()=>handleDbl('company',card.company)}>
        {isEdit('company') ? (
          <InlineInput val={inlineEdit.value} style={{ fontSize:`${0.5*scale}em`, fontWeight:800, color:b.accent, textTransform:'uppercase', letterSpacing:'1.5px', opacity:0.9 }} />
        ) : (
          <div style={{ fontSize:`${0.5*scale}em`, fontWeight:800, color:b.accent, textTransform:'uppercase', letterSpacing:'1.5px', opacity:0.9, textShadow:glow }}>{card.company}</div>
        )}
      </div>
    </div>
  );
}

// ─── Patterns ─────────────────────────────────────────────────────────────────
function PatternDots({ color }) {
  return <div style={{ position:'absolute', inset:0, backgroundImage:`radial-gradient(${color}22 1.5px,transparent 1.5px)`, backgroundSize:'18px 18px', pointerEvents:'none' }} />;
}
function PatternLines({ color }) {
  return <div style={{ position:'absolute', inset:0, backgroundImage:`repeating-linear-gradient(45deg,transparent,transparent 12px,${color}15 12px,${color}15 13px)`, pointerEvents:'none' }} />;
}
function PatternGrid({ color }) {
  return <div style={{ position:'absolute', inset:0, backgroundImage:`linear-gradient(${color}15 1px,transparent 1px),linear-gradient(90deg,${color}15 1px,transparent 1px)`, backgroundSize:'20px 20px', pointerEvents:'none' }} />;
}
function PatternCircuit({ color }) {
  return (
    <svg style={{ position:'absolute', inset:0, width:'100%', height:'100%', opacity:0.08, pointerEvents:'none' }} viewBox="0 0 400 250">
      <path d="M0 50h80M80 50v60h60M140 110h80M220 110v-60h60M280 50h120M200 50v150M100 200h200" stroke={color} strokeWidth="1.5" fill="none" />
      {[80,140,220,280,200].map((x,i) => <circle key={i} cx={x} cy={i%2===0?50:110} r="3.5" fill={color} />)}
    </svg>
  );
}
function PatternWaves({ color }) {
  return (
    <svg style={{ position:'absolute', inset:0, width:'100%', height:'100%', opacity:0.08, pointerEvents:'none' }} viewBox="0 0 400 250" preserveAspectRatio="xMidYMid slice">
      {[0,40,80,120,160,200].map((y,i) => (
        <path key={i} d={`M-20 ${y}q50-30 100 0t100 0t100 0t100 0t100 0`} stroke={color} strokeWidth="1.5" fill="none" />
      ))}
    </svg>
  );
}

// ─── vCard builder ────────────────────────────────────────────────────────────
function buildVCardContent(card) {
  return [
    'BEGIN:VCARD', 'VERSION:3.0',
    `FN:${card.name}`,
    `TITLE:${card.title}`,
    `ORG:${card.company}`,
    card.tel     ? `TEL:${card.tel}`             : '',
    card.email   ? `EMAIL:${card.email}`          : '',
    card.website ? `URL:${card.website}`          : '',
    card.address ? `ADR:;;${card.address};;;`     : '',
    card.socials?.whatsapp  ? `X-WHATSAPP:${card.socials.whatsapp}`   : '',
    card.socials?.instagram ? `X-INSTAGRAM:${card.socials.instagram}` : '',
    card.socials?.linkedin  ? `X-LINKEDIN:${card.socials.linkedin}`   : '',
    'END:VCARD',
  ].filter(Boolean).join('\r\n');
}

// ─── CSS ──────────────────────────────────────────────────────────────────────
const CSS = `
@keyframes cardFadeUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
.card-anim { animation: cardFadeUp 0.3s ease-out; }

.card-toast {
  position:fixed; top:calc(var(--navbar-total-h,60px)+16px); right:20px; z-index:9999;
  padding:10px 18px; border-radius:12px; backdrop-filter:blur(10px);
  background:rgba(16,185,129,0.15); border:1px solid rgba(16,185,129,0.35); color:#10B981;
  font-weight:600; font-size:0.85rem; max-width:300px;
  box-shadow:0 8px 24px rgba(0,0,0,0.15);
}

/* Tabs */
.card-tabs { display:flex; gap:8px; flex-wrap:wrap; margin-bottom:24px; }
.card-tab {
  padding:9px 18px; border-radius:100px; border:1.5px solid var(--border);
  background:transparent; color:var(--text-secondary); cursor:pointer;
  font-size:0.82rem; font-weight:600; font-family:inherit; white-space:nowrap; transition:all 0.2s;
}
.card-tab:hover { border-color:color-mix(in srgb,var(--accent) 40%,transparent); color:var(--accent); }
.card-tab.active {
  border-color:var(--accent); background:color-mix(in srgb,var(--accent) 12%,transparent);
  color:var(--accent); font-weight:700;
  box-shadow:0 0 0 3px color-mix(in srgb,var(--accent) 10%,transparent);
}

/* Layout */
.card-layout { display:grid; grid-template-columns:1fr 380px; gap:24px; align-items:start; }
@media(max-width:1024px) { .card-layout { grid-template-columns:1fr; } }
.card-editor { display:flex; flex-direction:column; gap:18px; }
.card-preview-panel {}
.card-preview-sticky { position:sticky; top:calc(var(--navbar-total-h,60px)+20px); }

/* Sections */
.card-section {
  background:color-mix(in srgb,var(--bg-card) 92%,transparent);
  border:1px solid var(--border); border-radius:16px; padding:18px 20px;
  backdrop-filter:blur(8px);
}
.card-sect-title { font-size:0.72rem; font-weight:800; text-transform:uppercase; letter-spacing:1.2px; color:var(--text-muted); margin:0 0 14px; }

/* Templates */
.card-tpl-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(130px,1fr)); gap:10px; }
.card-tpl-btn {
  display:flex; flex-direction:column; align-items:center; gap:8px;
  padding:0 0 8px; border-radius:14px; border:2.5px solid var(--border);
  background:var(--bg); cursor:pointer; font-family:inherit; overflow:hidden;
  transition:all 0.2s ease; box-shadow:0 2px 8px rgba(0,0,0,0.04);
}
.card-tpl-btn:hover { border-color:color-mix(in srgb,var(--accent) 50%,transparent); transform:translateY(-3px); box-shadow:0 8px 20px rgba(0,0,0,0.08); }
.card-tpl-btn.active { border-color:var(--accent); box-shadow:0 0 0 4px color-mix(in srgb,var(--accent) 18%,transparent), 0 8px 24px rgba(0,0,0,0.1); }
.card-tpl-preview { width:100%; height:72px; border-radius:11px 11px 0 0; }
.card-tpl-name { font-size:0.72rem; font-weight:700; color:var(--text-secondary); padding:6px 8px 2px; text-align:center; white-space:nowrap; }
.card-tpl-btn.active .card-tpl-name { color:var(--accent); }

/* Inputs */
.card-grid-2 { display:grid; grid-template-columns:1fr 1fr; gap:10px; }
@media(max-width:480px) { .card-grid-2 { grid-template-columns:1fr; } }
.card-input {
  width:100%; padding:10px 14px; border-radius:10px;
  border:1px solid var(--border); background:var(--bg-card);
  color:var(--text-primary); font-size:0.88rem; outline:none;
  font-family:inherit; box-sizing:border-box;
  transition:border-color 0.2s,box-shadow 0.2s;
}
.card-input:focus { border-color:var(--accent); box-shadow:0 0 0 3px color-mix(in srgb,var(--accent) 12%,transparent); }
.card-input::placeholder { color:var(--text-muted); }
.card-field { display:flex; flex-direction:column; gap:5px; }
.card-field label { font-size:0.72rem; font-weight:700; color:var(--text-muted); text-transform:uppercase; letter-spacing:0.8px; }
.card-select {
  background:var(--bg-card); border:1px solid var(--border); color:var(--text-primary);
  border-radius:10px; padding:9px 12px; font-size:0.82rem; outline:none; cursor:pointer; font-family:inherit;
}

/* Logo upload */
.card-logo-upload {
  display:inline-flex; align-items:center; gap:6px; padding:9px 16px;
  border-radius:10px; border:1.5px dashed var(--border); cursor:pointer;
  color:var(--text-secondary); font-size:0.82rem; font-weight:600;
  transition:all 0.2s;
}
.card-logo-upload:hover { border-color:var(--accent); color:var(--accent); background:color-mix(in srgb,var(--accent) 5%,transparent); }

/* Card scene */
.card-scene {
  width:100%; position:relative; perspective:1000px; cursor:pointer;
  aspect-ratio:1.574; border-radius:14px; margin-bottom:6px;
}
.card-flip {
  width:100%; height:100%; position:relative;
  transform-style:preserve-3d; transition:transform 0.35s cubic-bezier(0.4,0,0.2,1);
  border-radius:14px;
}
.card-flip.flipping { transform:rotateY(90deg); }
.card-flip.show-back { transform:rotateY(180deg); }
.card-face {
  position:absolute; inset:0; border-radius:14px; overflow:hidden;
  backface-visibility:hidden; -webkit-backface-visibility:hidden;
  box-shadow:0 12px 40px rgba(0,0,0,0.25),0 2px 8px rgba(0,0,0,0.15);
  font-size:clamp(24px,5.5vw,38px);
  transition: opacity 0.35s ease, visibility 0.35s ease;
}
.card-face-front { opacity:1; visibility:visible; }
.card-face-back { transform:rotateY(180deg); opacity:0; visibility:hidden; }
.card-flip.show-back .card-face-front { opacity:0; visibility:hidden; }
.card-flip.show-back .card-face-back { opacity:1; visibility:visible; }

/* Design mode */
.card-scene.design-mode { outline:2px dashed var(--accent); outline-offset:4px; border-radius:16px; }
.card-scene.design-mode .card-flip { cursor:default; }
.card-face [data-field] { transition:box-shadow 0.15s; }
.card-scene.design-mode .card-face [data-field]:hover { box-shadow:0 0 0 1.5px var(--accent); border-radius:4px; }

/* Export buttons */
.card-exports { display:grid; grid-template-columns:repeat(3,1fr); gap:8px; margin-top:14px; }
@media(max-width:480px) { .card-exports { grid-template-columns:1fr 1fr; } }
.card-btn-export {
  padding:9px 8px; border-radius:10px; border:1.5px solid var(--border);
  background:transparent; color:var(--text-secondary); font-size:0.75rem;
  font-weight:700; cursor:pointer; font-family:inherit; transition:all 0.2s;
  text-align:center; white-space:nowrap;
}
.card-btn-export:hover:not(:disabled) { border-color:var(--accent); color:var(--accent); background:color-mix(in srgb,var(--accent) 6%,transparent); }
.card-btn-export.primary {
  background:linear-gradient(135deg,var(--accent),color-mix(in srgb,var(--accent) 80%,#000));
  color:#fff; border-color:transparent;
  box-shadow:0 4px 12px color-mix(in srgb,var(--accent) 30%,transparent);
}
.card-btn-export.primary:hover:not(:disabled) { transform:translateY(-1px); box-shadow:0 6px 18px color-mix(in srgb,var(--accent) 45%,transparent); }
.card-btn-export.accent { border-color:color-mix(in srgb,var(--accent) 35%,transparent); color:var(--accent); background:color-mix(in srgb,var(--accent) 8%,transparent); }
.card-btn-export:disabled { opacity:0.45; cursor:not-allowed; }

.card-btn-sm {
  padding:7px 14px; border-radius:8px; border:1.5px solid var(--border);
  background:transparent; color:var(--text-secondary); font-size:0.78rem;
  font-weight:600; cursor:pointer; font-family:inherit; transition:all 0.2s;
}
.card-btn-sm:hover { border-color:var(--accent); color:var(--accent); }
.card-btn-sm.accent { border-color:color-mix(in srgb,var(--accent) 35%,transparent); color:var(--accent); background:color-mix(in srgb,var(--accent) 8%,transparent); }

/* Print info */
.card-print-info {
  display:flex; flex-direction:column; gap:4px; margin-top:10px;
  padding:10px 14px; border-radius:10px; background:var(--bg-primary);
  border:1px solid var(--border); font-size:0.72rem; color:var(--text-muted);
}

/* Collection */
.card-collection-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(240px,1fr)); gap:14px; }
.card-col-item {
  background:var(--bg-card); border:1px solid var(--border); border-radius:14px;
  overflow:hidden; transition:all 0.2s;
}
.card-col-item:hover { transform:translateY(-3px); box-shadow:0 10px 28px rgba(0,0,0,0.1); }
.card-col-preview {
  height:80px; display:flex; flex-direction:column; justify-content:center;
  padding:10px 14px; gap:0;
}
.card-col-info { padding:12px 14px; }
.card-col-name { font-weight:700; font-size:0.88rem; color:var(--text-primary); margin-bottom:2px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.card-col-date { font-size:0.72rem; color:var(--text-muted); }

/* Digital card */
.card-digital-layout { display:grid; grid-template-columns:1fr 240px; gap:24px; align-items:start; }
@media(max-width:800px) { .card-digital-layout { grid-template-columns:1fr; } }
.card-digital-card {
  display:flex; flex-direction:column; align-items:center;
  padding:28px 20px; border-radius:20px;
  background:color-mix(in srgb,var(--bg-card) 90%,transparent);
  border:1px solid var(--border); backdrop-filter:blur(12px);
  box-shadow:0 8px 32px rgba(0,0,0,0.1);
}
.card-digital-qr {
  display:flex; flex-direction:column; align-items:center; gap:6px;
  padding:20px; border-radius:16px; background:var(--bg-card); border:1px solid var(--border);
  position:sticky; top:calc(var(--navbar-total-h,60px)+20px);
}
.card-digital-nfc-badge {
  display:flex; align-items:center; gap:10px; margin-top:16px;
  padding:10px 16px; border-radius:12px;
  background:rgba(99,102,241,0.08); border:1px solid rgba(99,102,241,0.2);
  width:100%; max-width:320px; font-size:1.2rem;
}

/* Digital template selector */
.dig-tpl-scroll {
  display:flex; gap:12px; overflow-x:auto; padding-bottom:10px;
  scrollbar-width:thin; scrollbar-color:var(--border) transparent;
}
.dig-tpl-scroll::-webkit-scrollbar { height:5px; }
.dig-tpl-scroll::-webkit-scrollbar-track { background:transparent; }
.dig-tpl-scroll::-webkit-scrollbar-thumb { background:var(--border); border-radius:3px; }

.dig-tpl-btn {
  flex:0 0 auto; display:flex; flex-direction:column; align-items:center; gap:6px;
  padding:10px 12px 12px; border-radius:14px; border:2.5px solid var(--border);
  background:var(--bg); cursor:pointer; font-family:inherit;
  transition:all 0.2s ease; min-width:110px;
  box-shadow:0 2px 8px rgba(0,0,0,0.04);
}
.dig-tpl-btn:hover { border-color:color-mix(in srgb,var(--accent) 50%,transparent); transform:translateY(-3px); box-shadow:0 8px 20px rgba(0,0,0,0.08); }
.dig-tpl-btn.active {
  border-color:var(--accent);
  box-shadow:0 0 0 4px color-mix(in srgb,var(--accent) 18%,transparent), 0 8px 24px rgba(0,0,0,0.1);
}
.dig-tpl-swatch { width:72px; height:72px; border-radius:12px; overflow:hidden; box-shadow:0 2px 8px rgba(0,0,0,0.18); border:1px solid rgba(255,255,255,0.1); }

/* Digital fullscreen overlay */
.dig-fs-overlay {
  position:fixed; inset:0; z-index:9999;
  background:rgba(0,0,0,0.85); backdrop-filter:blur(12px);
  display:flex; align-items:center; justify-content:center;
  padding:20px; overflow:auto; animation:cardFadeUp 0.25s ease-out;
}
.dig-fs-close {
  position:fixed; top:16px; right:16px; z-index:10000;
  width:44px; height:44px; border-radius:50%;
  background:rgba(255,255,255,0.1); border:1px solid rgba(255,255,255,0.2);
  color:#fff; font-size:1.2rem; cursor:pointer; display:flex;
  align-items:center; justify-content:center; transition:all 0.2s;
}
.dig-fs-close:hover { background:rgba(255,255,255,0.2); transform:scale(1.05); }
.dig-fs-card {
  width:100%; max-width:520px; display:flex; flex-direction:column; align-items:center;
}

input[type="range"] { accent-color: var(--accent); }
`;


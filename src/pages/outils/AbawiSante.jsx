import { useState, useMemo, useEffect } from 'react';
import { useThemedStyles } from '../../hooks/useThemedStyles';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import { Icon } from 'leaflet'
import 'leaflet/dist/leaflet.css'
import SENEGAL_HEALTH_DATA, {
  CITIES, ZONES, SPECIALTIES,
  filterByCity, filterByZone, filterBySpecialty,
  getOnDutyPharmacies, searchHealth
} from '../../data/senegalHealthData'
import ToolInfoPanel from '../../components/ToolInfoPanel'

// Custom marker icons
const hospitalIcon = new Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/684/684908.png',
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32]
})

const hospitalPrivateIcon = new Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/684/684850.png',
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32]
})

const pharmacyIcon = new Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/4320/4320337.png',
  iconSize: [28, 28],
  iconAnchor: [14, 28],
  popupAnchor: [0, -28]
})

const pharmacyDutyIcon = new Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/4320/4320356.png',
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32]
})

// Map bounds updater
function MapBounds({ markers }) {
  const map = useMap()
  useEffect(() => {
    if (markers.length > 0) {
      const bounds = markers.map(m => m.coordinates)
      map.fitBounds(bounds, { padding: [50, 50] })
    }
  }, [markers, map])
  return null
}

function AbawiSante() {
  const [selectedCity, setSelectedCity] = useState('Dakar')
  const [selectedZone, setSelectedZone] = useState('')
  const [selectedSpecialty, setSelectedSpecialty] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState('map') // 'map', 'list', 'emergency', 'tips'
  const [showDutyOnly, setShowDutyOnly] = useState(false)
  const [selectedItem, setSelectedItem] = useState(null);
  const { themed } = useThemedStyles();

  // Filter data
  const filteredData = useMemo(() => {
    let hospitals = SENEGAL_HEALTH_DATA.hospitals
    let pharmacies = SENEGAL_HEALTH_DATA.pharmacies

    if (selectedCity) {
      const cityData = filterByCity(SENEGAL_HEALTH_DATA, selectedCity)
      hospitals = cityData.hospitals
      pharmacies = cityData.pharmacies
    }

    if (selectedZone) {
      const zoneData = filterByZone(SENEGAL_HEALTH_DATA, selectedZone)
      hospitals = zoneData.hospitals
      pharmacies = zoneData.pharmacies
    }

    if (selectedSpecialty) {
      hospitals = filterBySpecialty(hospitals, selectedSpecialty)
    }

    if (searchQuery) {
      const searchData = searchHealth(SENEGAL_HEALTH_DATA, searchQuery)
      hospitals = searchData.hospitals
      pharmacies = searchData.pharmacies
    }

    if (showDutyOnly) {
      pharmacies = getOnDutyPharmacies(pharmacies)
    }

    return { hospitals, pharmacies }
  }, [selectedCity, selectedZone, selectedSpecialty, searchQuery, showDutyOnly])

  // All markers for map
  const allMarkers = useMemo(() => {
    return [
      ...filteredData.hospitals.map(h => ({ ...h, type: 'hospital' })),
      ...filteredData.pharmacies.map(p => ({ ...p, type: 'pharmacy' }))
    ]
  }, [filteredData])

  const availableZones = selectedCity ? ZONES[selectedCity] || [] : []

  return (
    <main style={themed({ maxWidth: 1400, margin: '0 auto', padding: '20px 16px 80px' })}>
      <ToolInfoPanel
        toolName="ABAWI Santé+"
        icon="🏥"
        description="Annuaire santé complet du Sénégal - Hôpitaux, cliniques, pharmacies, numéros d'urgence"
        benefits={[
          'Base de données exhaustive : 18+ hôpitaux, 23+ pharmacies vérifiées',
          'Cartographie interactive avec filtrage par ville, zone, spécialité',
          'Pharmacies de garde identifiées et horaires en temps réel',
          'Numéros d\'urgence et conseils santé accessibles en un clic',
          'Informations détaillées : lits, spécialités, services, contacts'
        ]}
        howToUse={[
          'Sélectionnez votre ville ou zone pour voir les structures proches',
          'Filtrez par spécialité médicale recherchée',
          'Activez "Garde uniquement" pour les pharmacies ouvertes',
          'Cliquez sur un marqueur carte pour voir les détails et lancer GPS',
          'Consultez les numéros d\'urgence en bas de page'
        ]}
        tips={[
          'En urgence, appelez d\'abord le 1515 (Samu)',
          'Vérifiez toujours les horaires avant de vous déplacer',
          'Les hôpitaux publics (CHU) ont généralement les urgences 24h/24'
        ]}
      />

      {/* Hero Section */}
      <div style={{
        background: 'var(--gradient-hero)',
        borderRadius: 24,
        padding: '36px 32px',
        marginBottom: 28,
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute',
          top: -50,
          right: -50,
          width: 200,
          height: 200,
          background: 'radial-gradient(circle, var(--green-glow) 0%, transparent 70%)',
          borderRadius: '50%'
        }} />
        
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: 24 }}>
          <div style={{
            background: 'var(--accent3)',
            borderRadius: 20,
            padding: '20px 24px',
            border: '1px solid var(--accent-border)'
          }}>
            <span style={{ fontSize: '3.5rem' }}>🏥</span>
          </div>
          
          <div style={{ flex: 1 }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '6px 14px',
              background: 'var(--accent)',
              borderRadius: 20,
              marginBottom: 10
            }}>
              <span style={themed({ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-on-accent)', textTransform: 'uppercase', letterSpacing: '1px' })}>
                Annuaire Santé Sénégal
              </span>
            </div>
            
            <h1 style={themed({ margin: 0, color: 'var(--text-on-accent)', fontSize: 'clamp(1.8rem,3vw,2.4rem)', fontWeight: 800 })}>
              ABAWI Santé+
            </h1>
            <p style={themed({ marginTop: 10, color: 'var(--text-on-accent)', opacity: 0.8, fontSize: '1rem', maxWidth: 600 })}>
              Trouvez un hôpital, une pharmacie de garde ou un numéro d'urgence. 
              Cartographie complète et informations vérifiées.
            </p>
            
            <div style={{ display: 'flex', gap: 12, marginTop: 20, flexWrap: 'wrap' }}>
              {['18 Hôpitaux', '23 Pharmacies', 'Samu 1515', '24h/24'].map((tag, i) => (
                <span key={i} style={{
                  padding: '6px 14px',
                  background: 'var(--accent3)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: 20,
                  fontSize: '0.8rem',
                  color: 'var(--text-on-accent)',
                  fontWeight: 600
                }}>{tag}</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Emergency Banner */}
      <div style={{
        background: 'var(--error-bg)',
        borderRadius: 16,
        padding: '20px 24px',
        marginBottom: 24,
        display: 'flex',
        alignItems: 'center',
        gap: 20,
        flexWrap: 'wrap'
      }}>
        <div style={{ fontSize: '2.5rem' }}>🚨</div>
        <div style={{ flex: 1 }}>
          <div style={themed({ color: 'var(--text-on-error)', fontWeight: 800, fontSize: '1.1rem' })}>Urgences Médicales</div>
          <div style={themed({ color: 'var(--text-on-error)', opacity: 0.85, fontSize: '0.9rem' })}>
            Samu: 1515 (gratuit) | Pompiers: 18 | Police: 17
          </div>
        </div>
        <a href="tel:1515" style={{
          padding: '12px 24px',
          background: 'var(--bg-secondary)',
          color: 'var(--error-text)',
          borderRadius: 12,
          textDecoration: 'none',
          fontWeight: 800,
          fontSize: '0.95rem'
        }}>📞 Appeler 1515</a>
      </div>

      {/* Filters */}
      <div style={themed({
        background: 'var(--bg-card)',
        borderRadius: 16,
        padding: '20px',
        marginBottom: 20,
        border: '1px solid var(--border)'
      })}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
          {/* Search */}
          <div>
            <label style={themed({ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', marginBottom: 6, display: 'block' })}>
              🔍 Recherche
            </label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Nom, zone, spécialité..."
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: 10,
                border: '1px solid var(--border)',
                background: 'var(--bg-primary)',
                color: 'var(--text-primary)',
                fontSize: '0.9rem'
              }}
            />
          </div>

          {/* City */}
          <div>
            <label style={themed({ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', marginBottom: 6, display: 'block' })}>
              🏙️ Ville
            </label>
            <select
              value={selectedCity}
              onChange={(e) => { setSelectedCity(e.target.value); setSelectedZone('') }}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: 10,
                border: '1px solid var(--border)',
                background: 'var(--bg-primary)',
                color: 'var(--text-primary)',
                fontSize: '0.9rem'
              }}
            >
              <option value="">Toutes les villes</option>
              {CITIES.map(city => <option key={city} value={city}>{city}</option>)}
            </select>
          </div>

          {/* Zone */}
          {selectedCity && availableZones.length > 0 && (
            <div>
              <label style={themed({ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', marginBottom: 6, display: 'block' })}>
                📍 Zone
              </label>
              <select
                value={selectedZone}
                onChange={(e) => setSelectedZone(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: 10,
                  border: '1px solid var(--border)',
                  background: 'var(--bg-primary)',
                  color: 'var(--text-primary)',
                  fontSize: '0.9rem'
                }}
              >
                <option value="">Toutes les zones</option>
                {availableZones.map(zone => <option key={zone} value={zone}>{zone}</option>)}
              </select>
            </div>
          )}

          {/* Specialty */}
          <div>
            <label style={themed({ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', marginBottom: 6, display: 'block' })}>
              🩺 Spécialité
            </label>
            <select
              value={selectedSpecialty}
              onChange={(e) => setSelectedSpecialty(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: 10,
                border: '1px solid var(--border)',
                background: 'var(--bg-primary)',
                color: 'var(--text-primary)',
                fontSize: '0.9rem'
              }}
            >
              <option value="">Toutes spécialités</option>
              {SPECIALTIES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>

        {/* Duty Toggle */}
        <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
          <label style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 8, 
            cursor: 'pointer',
            padding: '8px 14px',
            background: showDutyOnly ? 'var(--success-bg)' : 'var(--bg-secondary)',
            borderRadius: 20,
            border: `1px solid ${showDutyOnly ? 'var(--success-border)' : 'var(--border)'}`,
            transition: 'all 0.2s'
          }}>
            <input 
              type="checkbox" 
              checked={showDutyOnly}
              onChange={(e) => setShowDutyOnly(e.target.checked)}
              style={{ display: 'none' }}
            />
            <span style={{ 
              width: 10, 
              height: 10, 
              borderRadius: '50%', 
              background: showDutyOnly ? 'var(--success-text)' : 'var(--text-muted)',
              display: 'inline-block'
            }} />
            <span style={{ 
              fontSize: '0.85rem', 
              color: showDutyOnly ? 'var(--success-text)' : 'var(--text-secondary)',
              fontWeight: 600
            }}>Pharmacies de garde uniquement</span>
          </label>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {[
          { id: 'map', label: '🗺️ Carte', color: 'var(--accent)' },
          { id: 'list', label: '📋 Liste', color: 'var(--accent2)' },
          { id: 'emergency', label: '🚨 Urgences', color: 'var(--error-bg)' },
          { id: 'tips', label: '💡 Conseils', color: 'var(--success-bg)' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '10px 20px',
              borderRadius: 12,
              border: 'none',
              background: activeTab === tab.id ? tab.color : 'var(--bg-card)',
              color: activeTab === tab.id ? 'var(--text-on-accent)' : 'var(--text-secondary)',
              fontWeight: 700,
              fontSize: '0.9rem',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {activeTab === 'map' && (
        <div style={{
          borderRadius: 20,
          overflow: 'hidden',
          border: '1px solid var(--border)',
          height: 500
        }}>
          <MapContainer
            center={[14.6937, -17.4441]}
            zoom={12}
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <MapBounds markers={allMarkers.length > 0 ? allMarkers : [{ coordinates: [14.6937, -17.4441] }]} />
            
            {filteredData.hospitals.map(hospital => (
              <Marker
                key={hospital.id}
                position={hospital.coordinates}
                icon={hospital.type === 'private' ? hospitalPrivateIcon : hospitalIcon}
              >
                <Popup>
                  <div style={themed({ minWidth: 250 })}>
                    <h3 style={themed({ margin: '0 0 8px 0', fontSize: '1rem' })}>{hospital.name}</h3>
                    <div style={themed({ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 8 })}>
                      {hospital.type === 'public' ? '🏛️ Public' : '💼 Privé'} • {hospital.category}
                    </div>
                    <div style={themed({ fontSize: '0.8rem', marginBottom: 4 })}>📍 {hospital.address}</div>
                    <div style={themed({ fontSize: '0.8rem', marginBottom: 4 })}>📞 {hospital.phone}</div>
                    <div style={themed({ fontSize: '0.8rem', marginBottom: 8 })}>⏰ {hospital.hours}</div>
                    <div style={themed({ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 8 })}>
                      🩺 {hospital.specialties.slice(0, 4).join(', ')}{hospital.specialties.length > 4 ? '...' : ''}
                    </div>
                    <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                      <a 
                        href={`https://www.google.com/maps/dir/?api=1&destination=${hospital.coordinates[0]},${hospital.coordinates[1]}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          padding: '6px 12px',
                          background: 'var(--accent)',
                          color: 'var(--text-on-accent)',
                          borderRadius: 6,
                          textDecoration: 'none',
                          fontSize: '0.75rem',
                          fontWeight: 600
                        }}
                      >
                        🚗 Y aller
                      </a>
                      {hospital.emergency && (
                        <a 
                          href={`tel:${hospital.emergency}`}
                          style={{
                            padding: '6px 12px',
                            background: 'var(--error-bg)',
                            color: 'var(--text-on-accent)',
                            borderRadius: 6,
                            textDecoration: 'none',
                            fontSize: '0.75rem',
                            fontWeight: 600
                          }}
                        >
                          📞 Urgence
                        </a>
                      )}
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}
            
            {filteredData.pharmacies.map(pharmacy => (
              <Marker
                key={pharmacy.id}
                position={pharmacy.coordinates}
                icon={pharmacy.isOnDuty ? pharmacyDutyIcon : pharmacyIcon}
              >
                <Popup>
                  <div style={themed({ minWidth: 200 })}>
                    <h3 style={themed({ margin: '0 0 8px 0', fontSize: '1rem' })}>{pharmacy.name}</h3>
                    {pharmacy.isOnDuty && (
                      <div style={{ 
                        background: 'var(--success-bg)', 
                        color: 'var(--text-on-accent)', 
                        padding: '2px 8px', 
                        borderRadius: 4, 
                        fontSize: '0.7rem',
                        display: 'inline-block',
                        marginBottom: 8,
                        fontWeight: 700
                      }}>
                        🌙 DE GARDE
                      </div>
                    )}
                    <div style={themed({ fontSize: '0.8rem', marginBottom: 4 })}>📍 {pharmacy.address}</div>
                    <div style={themed({ fontSize: '0.8rem', marginBottom: 4 })}>📞 {pharmacy.phone}</div>
                    <div style={themed({ fontSize: '0.8rem', marginBottom: 8 })}>⏰ {pharmacy.hours}</div>
                    <a 
                      href={`https://www.google.com/maps/dir/?api=1&destination=${pharmacy.coordinates[0]},${pharmacy.coordinates[1]}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        padding: '6px 12px',
                        background: 'var(--accent)',
                        color: 'var(--text-on-accent)',
                        borderRadius: 6,
                        textDecoration: 'none',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        display: 'inline-block'
                      }}
                    >
                      🚗 Y aller
                    </a>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      )}

      {activeTab === 'list' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: 16 }}>
          {/* Hospitals */}
          {filteredData.hospitals.map(hospital => (
            <div
              key={hospital.id}
              onClick={() => setSelectedItem(selectedItem === hospital.id ? null : hospital.id)}
              style={{
                background: 'var(--bg-card)',
                borderRadius: 16,
                padding: 20,
                border: '1px solid var(--border)',
                cursor: 'pointer',
                transition: 'all 0.2s',
                boxShadow: selectedItem === hospital.id ? '0 4px 20px rgba(59,130,246,0.15)' : 'none'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <div style={{
                  width: 50,
                  height: 50,
                  borderRadius: 14,
                  background: hospital.type === 'public' ? 'var(--accent)' : 'var(--accent2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.5rem',
                  border: `1px solid ${hospital.type === 'public' ? 'var(--accent-border)' : 'var(--accent2-border)'}30`
                }}>
                  {hospital.type === 'public' ? '🏛️' : '💼'}
                </div>
                <div style={{ flex: 1 }}>
                  <h3 style={{ margin: '0 0 4px 0', fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {hospital.name}
                  </h3>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {hospital.category} • {hospital.city}
                  </div>
                </div>
                <div style={{
                  background: hospital.hours === '24h/24' ? 'var(--success-bg)' : 'var(--warning-bg)',
                  color: 'var(--text-on-accent)',
                  padding: '4px 10px',
                  borderRadius: 20,
                  fontSize: '0.7rem',
                  fontWeight: 700
                }}>
                  {hospital.hours === '24h/24' ? '24h/24' : '⚠️ Horaires'}
                </div>
              </div>

              {selectedItem === hospital.id && (
                <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
                  <div style={themed({ fontSize: '0.85rem', marginBottom: 8 })}>
                    <span style={{ color: 'var(--text-muted)' }}>📍 Adresse:</span> {hospital.address}
                  </div>
                  <div style={themed({ fontSize: '0.85rem', marginBottom: 8 })}>
                    <span style={{ color: 'var(--text-muted)' }}>📞 Téléphone:</span>{' '}
                    <a href={`tel:${hospital.phone}`} style={{ color: 'var(--accent)', textDecoration: 'none' }}>{hospital.phone}</a>
                  </div>
                  {hospital.emergency && (
                    <div style={themed({ fontSize: '0.85rem', marginBottom: 8 })}>
                      <span style={{ color: 'var(--text-muted)' }}>🚨 Urgences:</span>{' '}
                      <a href={`tel:${hospital.emergency}`} style={{ color: 'var(--error-text)', fontWeight: 700, textDecoration: 'none' }}>{hospital.emergency}</a>
                    </div>
                  )}
                  <div style={themed({ fontSize: '0.85rem', marginBottom: 8 })}>
                    <span style={{ color: 'var(--text-muted)' }}>🩺 Spécialités:</span> {hospital.specialties.join(', ')}
                  </div>
                  <div style={themed({ fontSize: '0.85rem', marginBottom: 8 })}>
                    <span style={{ color: 'var(--text-muted)' }}>🛏️ Lits:</span> {hospital.beds}
                  </div>
                  {hospital.services && (
                    <div style={{ fontSize: '0.85rem', marginBottom: 12 }}>
                      <span style={{ color: 'var(--text-muted)' }}>✓ Services:</span> {hospital.services.join(', ')}
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${hospital.coordinates[0]},${hospital.coordinates[1]}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        padding: '8px 16px',
                        background: 'var(--accent)',
                        color: 'var(--text-on-accent)',
                        borderRadius: 10,
                        textDecoration: 'none',
                        fontSize: '0.85rem',
                        fontWeight: 700
                      }}
                    >
                      🚗 Itinéraire
                    </a>
                    <a
                      href={`tel:${hospital.phone}`}
                      style={{
                        padding: '8px 16px',
                        background: 'var(--bg-secondary)',
                        color: 'var(--text-primary)',
                        borderRadius: 10,
                        textDecoration: 'none',
                        fontSize: '0.85rem',
                        fontWeight: 700,
                        border: '1px solid var(--border)'
                      }}
                    >
                      📞 Appeler
                    </a>
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* Pharmacies */}
          {filteredData.pharmacies.map(pharmacy => (
            <div
              key={pharmacy.id}
              onClick={() => setSelectedItem(selectedItem === pharmacy.id ? null : pharmacy.id)}
              style={{
                background: pharmacy.isOnDuty ? 'var(--success-bg)' : 'var(--bg-card)',
                borderRadius: 16,
                padding: 20,
                border: pharmacy.isOnDuty ? '1px solid var(--success-border)' : '1px solid var(--border)',
                cursor: 'pointer'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <div style={{
                  width: 50,
                  height: 50,
                  borderRadius: 14,
                  background: pharmacy.isOnDuty ? 'var(--success-bg)' : 'var(--accent)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.5rem',
                  border: pharmacy.isOnDuty ? '1px solid var(--success-border)' : '1px solid var(--accent-border)'
                }}>
                  💊
                </div>
                <div style={{ flex: 1 }}>
                  <h3 style={{ margin: '0 0 4px 0', fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {pharmacy.name}
                  </h3>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {pharmacy.city} • {pharmacy.zone}
                  </div>
                </div>
                {pharmacy.isOnDuty && (
                  <div style={{
                    background: 'var(--success-bg)',
                    color: 'var(--text-on-accent)',
                    padding: '4px 10px',
                    borderRadius: 20,
                    fontSize: '0.7rem',
                    fontWeight: 800
                  }}>
                    🌙 GARDE
                  </div>
                )}
              </div>

              {selectedItem === pharmacy.id && (
                <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
                  <div style={themed({ fontSize: '0.85rem', marginBottom: 8 })}>
                    <span style={{ color: 'var(--text-muted)' }}>📍 Adresse:</span> {pharmacy.address}
                  </div>
                  <div style={themed({ fontSize: '0.85rem', marginBottom: 8 })}>
                    <span style={{ color: 'var(--text-muted)' }}>📞 Téléphone:</span>{' '}
                    <a href={`tel:${pharmacy.phone}`} style={{ color: 'var(--accent)', textDecoration: 'none' }}>{pharmacy.phone}</a>
                  </div>
                  <div style={themed({ fontSize: '0.85rem', marginBottom: 8 })}>
                    <span style={{ color: 'var(--text-muted)' }}>⏰ Horaires:</span> {pharmacy.hours}
                  </div>
                  {pharmacy.dutyHours && (
                    <div style={{ fontSize: '0.85rem', marginBottom: 8, color: 'var(--success-text)', fontWeight: 600 }}>
                      🌙 Heures de garde: {pharmacy.dutyHours}
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${pharmacy.coordinates[0]},${pharmacy.coordinates[1]}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        padding: '8px 16px',
                        background: 'var(--accent)',
                        color: 'var(--text-on-accent)',
                        borderRadius: 10,
                        textDecoration: 'none',
                        fontSize: '0.85rem',
                        fontWeight: 700
                      }}
                    >
                      🚗 Itinéraire
                    </a>
                    <a
                      href={`tel:${pharmacy.phone}`}
                      style={{
                        padding: '8px 16px',
                        background: 'var(--bg-secondary)',
                        color: 'var(--text-primary)',
                        borderRadius: 10,
                        textDecoration: 'none',
                        fontSize: '0.85rem',
                        fontWeight: 700,
                        border: '1px solid var(--border)'
                      }}
                    >
                      📞 Appeler
                    </a>
                  </div>
                </div>
              )}
            </div>
          ))}

          {filteredData.hospitals.length === 0 && filteredData.pharmacies.length === 0 && (
            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>
              <div style={{ fontSize: '3rem', marginBottom: 16 }}>🔍</div>
              <p>Aucun résultat trouvé. Essayez d'autres critères de recherche.</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'emergency' && (
        <div>
          <div style={{
            background: 'var(--error-bg)',
            borderRadius: 20,
            padding: 30,
            marginBottom: 24
          }}>
            <h2 style={{ margin: '0 0 20px 0', color: 'var(--text-on-accent)', fontSize: '1.5rem' }}>🚨 Numéros d'Urgence</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
              {SENEGAL_HEALTH_DATA.emergencyNumbers.map(num => (
                <div key={num.number} style={{
                  background: 'var(--green-glow)',
                  borderRadius: 16,
                  padding: 20,
                  border: '1px solid rgba(255,255,255,0.2)',
                  backdropFilter: 'blur(10px)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                    <div style={{
                      width: 50,
                      height: 50,
                      borderRadius: '50%',
                      background: num.isTollFree ? 'var(--success-bg)' : 'var(--warning-bg)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.3rem'
                    }}>
                      {num.category === 'urgence' ? '🚑' : num.category === 'securite' ? '👮' : '📞'}
                    </div>
                    <div>
                      <div style={{ color: 'var(--text-on-accent)', fontWeight: 800, fontSize: '1.1rem' }}>{num.label}</div>
                      {num.isTollFree && (
                        <span style={{ 
                          background: 'var(--success-bg)', 
                          color: 'var(--text-on-accent)', 
                          padding: '2px 8px', 
                          borderRadius: 4, 
                          fontSize: '0.7rem',
                          fontWeight: 700
                        }}>
                          GRATUIT
                        </span>
                      )}
                    </div>
                  </div>
                  <a 
                    href={`tel:${num.number}`}
                    style={{
                      display: 'block',
                      padding: '14px',
                      background: '#fff',
                      color: 'var(--error-text)',
                      borderRadius: 12,
                      textAlign: 'center',
                      textDecoration: 'none',
                      fontWeight: 800,
                      fontSize: '1.3rem',
                      marginBottom: 8
                    }}
                  >
                    📞 {num.number}
                  </a>
                  <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.85rem' }}>{num.description}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'tips' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
          {SENEGAL_HEALTH_DATA.healthTips.map((tip, i) => (
            <div key={i} style={{
              background: 'var(--bg-card)',
              borderRadius: 16,
              padding: 24,
              border: '1px solid var(--border)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <span style={{ fontSize: '2rem' }}>{tip.icon}</span>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
                    {tip.category}
                  </div>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>{tip.title}</h3>
                </div>
              </div>
              <p style={{ margin: 0, color: 'var(--text-secondary)', lineHeight: 1.6, fontSize: '0.95rem' }}>
                {tip.content}
              </p>
            </div>
          ))}
        </div>
      )}
    </main>
  )
}

export default AbawiSante

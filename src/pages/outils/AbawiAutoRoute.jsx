import { useState, useMemo, useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import { Icon } from 'leaflet'
import 'leaflet/dist/leaflet.css'
import SENEGAL_ROUTE_DATA, {
  CITIES_ROUTE, getActiveAlerts,
  getTrafficZonesBySeverity, getGpsLinks
} from '../../data/senegalRouteData'
import ToolInfoPanel from '../../components/ToolInfoPanel'

// Custom marker icons
const routeIcon = new Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/684/684809.png',
  iconSize: [28, 28],
  iconAnchor: [14, 28],
  popupAnchor: [0, -28]
})

const alertIcon = new Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/564/564619.png',
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32]
})

const serviceIcon = new Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/3125/3125848.png',
  iconSize: [26, 26],
  iconAnchor: [13, 26],
  popupAnchor: [0, -26]
})

const cameraIcon = new Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/2967/2967402.png',
  iconSize: [24, 24],
  iconAnchor: [12, 24],
  popupAnchor: [0, -24]
})

const autoEcoleIcon = new Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/3202/3202926.png',
  iconSize: [28, 28],
  iconAnchor: [14, 28],
  popupAnchor: [0, -28]
})

function MapBounds({ markers }) {
  const map = useMap()
  useEffect(() => {
    if (markers.length > 0) {
      const bounds = markers.map(m => m.coordinates || m.start?.coordinates)
      map.fitBounds(bounds.filter(Boolean), { padding: [50, 50] })
    }
  }, [markers, map])
  return null
}

export default function AbawiAutoRoute() {
  const [selectedRoute, setSelectedRoute] = useState(null)
  const [selectedCity, setSelectedCity] = useState('')
  const [activeTab, setActiveTab] = useState('carte') // 'carte', 'routes', 'alertes', 'services', 'autoecole', 'coderoute'
  const [showAlerts, setShowAlerts] = useState(true)
  const [showServices, setShowServices] = useState(true)
  const [selectedServiceType, setSelectedServiceType] = useState('')

  const activeAlerts = useMemo(() => getActiveAlerts(), [])
  const criticalZones = useMemo(() => getTrafficZonesBySeverity('critique'), [])

  const filteredServices = useMemo(() => {
    let services = SENEGAL_ROUTE_DATA.services
    if (selectedCity) {
      services = services.filter(s => s.city === selectedCity)
    }
    if (selectedServiceType) {
      services = services.filter(s => s.type === selectedServiceType)
    }
    return services
  }, [selectedCity, selectedServiceType])

  const mapMarkers = useMemo(() => {
    const markers = []
    
    if (selectedRoute) {
      markers.push({ coordinates: selectedRoute.start.coordinates, type: 'start' })
      markers.push({ coordinates: selectedRoute.end.coordinates, type: 'end' })
    }
    
    if (showAlerts) {
      activeAlerts.forEach(alert => {
        markers.push({ ...alert, coordinates: alert.coordinates, type: 'alert' })
      })
    }
    
    if (showServices) {
      filteredServices.forEach(service => {
        markers.push({ ...service, type: 'service' })
      })
    }
    
    return markers
  }, [selectedRoute, activeAlerts, filteredServices, showAlerts, showServices])

  return (
    <main style={{ maxWidth: 1400, margin: '0 auto', padding: '20px 16px 80px' }}>
      <ToolInfoPanel
        toolName="ABAWI AutoRoute"
        icon="🚗"
        description="Assistant route et navigation Sénégal - Trafic, alertes, services, auto-écoles"
        benefits={[
          'Carte interactive des routes principales du Sénégal',
          'Alertes circulation en temps réel : travaux, accidents, événements',
          'Localisation stations-service, dépannages, parkings',
          'Auto-écoles et conseils code de la route',
          'Liens GPS directs : Google Maps, Waze'
        ]}
        howToUse={[
          'Consultez la carte pour voir l\'état du trafic',
          'Sélectionnez un itinéraire pour voir les détails et alternatives',
          'Activez les alertes pour les zones à éviter',
          'Trouvez stations-service et dépannage près de vous',
          'Cliquez sur "Y aller" pour lancer votre GPS'
        ]}
        tips={[
          'Évitez les heures de pointe : 7h-10h et 17h-21h à Dakar',
          'Vérifiez les alertes avant de partir sur une route',
          'Le Samu route est joignable au 1515 en cas d\'accident'
        ]}
      />

      {/* Hero Section */}
      <div style={{
        background: 'linear-gradient(135deg, #1e40af 0%, #3730a3 50%, #1e40af 100%)',
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
          background: 'radial-gradient(circle, rgba(96,165,250,0.25) 0%, transparent 70%)',
          borderRadius: '50%'
        }} />
        <div style={{
          position: 'absolute',
          bottom: -30,
          left: 30,
          width: 120,
          height: 120,
          background: 'radial-gradient(circle, rgba(167,139,250,0.2) 0%, transparent 70%)',
          borderRadius: '50%'
        }} />
        
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: 24 }}>
          <div style={{
            background: 'rgba(96,165,250,0.2)',
            borderRadius: 20,
            padding: '20px 24px',
            border: '1px solid rgba(96,165,250,0.3)'
          }}>
            <span style={{ fontSize: '3.5rem' }}>🚗</span>
          </div>
          
          <div style={{ flex: 1 }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '6px 14px',
              background: 'rgba(96,165,250,0.9)',
              borderRadius: 20,
              marginBottom: 10
            }}>
              <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#fff', textTransform: 'uppercase', letterSpacing: '1px' }}>
                Navigation & Circulation
              </span>
            </div>
            
            <h1 style={{ margin: 0, color: '#fff', fontSize: 'clamp(1.8rem,3vw,2.4rem)', fontWeight: 800 }}>
              ABAWI AutoRoute
            </h1>
            <p style={{ marginTop: 10, color: 'rgba(255,255,255,0.8)', fontSize: '1rem', maxWidth: 600 }}>
              Votre copilote de route au Sénégal. Évitez les embouteillages, 
              trouvez les services et naviguez intelligemment.
            </p>
            
            <div style={{ display: 'flex', gap: 12, marginTop: 20, flexWrap: 'wrap' }}>
              {['9 Routes', '8 Zones Chaudes', 'GPS Intégré', 'Temps Réel'].map((tag, i) => (
                <span key={i} style={{
                  padding: '6px 14px',
                  background: 'rgba(255,255,255,0.15)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: 20,
                  fontSize: '0.8rem',
                  color: '#fff',
                  fontWeight: 600
                }}>{tag}</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: 12,
        marginBottom: 24
      }}>
        {[
          { icon: '🚨', label: 'Samu', number: '1515', color: '#EF4444' },
          { icon: '🚔', label: 'Police', number: '17', color: '#3B82F6' },
          { icon: '🚒', label: 'Pompiers', number: '18', color: '#F97316' },
          { icon: '🛣️', label: 'SOS Autoroute', number: '800 00 20 20', color: '#10B981' }
        ].map(service => (
          <a
            key={service.number}
            href={`tel:${service.number}`}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '16px 20px',
              background: service.color,
              borderRadius: 14,
              textDecoration: 'none',
              color: '#fff'
            }}
          >
            <span style={{ fontSize: '1.5rem' }}>{service.icon}</span>
            <div>
              <div style={{ fontSize: '0.75rem', opacity: 0.9 }}>{service.label}</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 800 }}>{service.number}</div>
            </div>
          </a>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {[
          { id: 'carte', label: '🗺️ Carte', color: '#3B82F6' },
          { id: 'routes', label: '🛣️ Routes', color: '#8B5CF6' },
          { id: 'alertes', label: '⚠️ Alertes', color: '#EF4444' },
          { id: 'services', label: '⛽ Services', color: '#10B981' },
          { id: 'autoecole', label: '🎓 Auto-École', color: '#F59E0B' },
          { id: 'coderoute', label: '📘 Code Route', color: '#EC4899' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '12px 24px',
              borderRadius: 12,
              border: 'none',
              background: activeTab === tab.id ? tab.color : 'var(--bg-card)',
              color: activeTab === tab.id ? '#fff' : 'var(--text-secondary)',
              fontWeight: 700,
              fontSize: '0.9rem',
              cursor: 'pointer',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}
          >
            {tab.label}
            {tab.id === 'alertes' && activeAlerts.length > 0 && (
              <span style={{
                background: '#fff',
                color: '#EF4444',
                padding: '2px 8px',
                borderRadius: 10,
                fontSize: '0.7rem',
                fontWeight: 800
              }}>
                {activeAlerts.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Filters */}
      {(activeTab === 'carte' || activeTab === 'services') && (
        <div style={{
          background: 'var(--bg-card)',
          borderRadius: 16,
          padding: '20px',
          marginBottom: 20,
          border: '1px solid var(--border)'
        }}>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={showAlerts}
                onChange={(e) => setShowAlerts(e.target.checked)}
                style={{ width: 18, height: 18, accentColor: '#EF4444' }}
              />
              <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Afficher alertes</span>
            </label>
            
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={showServices}
                onChange={(e) => setShowServices(e.target.checked)}
                style={{ width: 18, height: 18, accentColor: '#10B981' }}
              />
              <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Afficher services</span>
            </label>

            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              style={{
                padding: '10px 14px',
                borderRadius: 10,
                border: '1px solid var(--border)',
                background: 'var(--bg-primary)',
                color: 'var(--text-primary)',
                fontSize: '0.9rem'
              }}
            >
              <option value="">Toutes les villes</option>
              {CITIES_ROUTE.map(city => <option key={city} value={city}>{city}</option>)}
            </select>

            {activeTab === 'services' && (
              <select
                value={selectedServiceType}
                onChange={(e) => setSelectedServiceType(e.target.value)}
                style={{
                  padding: '10px 14px',
                  borderRadius: 10,
                  border: '1px solid var(--border)',
                  background: 'var(--bg-primary)',
                  color: 'var(--text-primary)',
                  fontSize: '0.9rem'
                }}
              >
                <option value="">Tous les services</option>
                <option value="station_service">⛽ Stations-service</option>
                <option value="depannage">🔧 Dépannage</option>
                <option value="garage">🔩 Garages</option>
                <option value="location">🚙 Location</option>
                <option value="parking">🅿️ Parkings</option>
              </select>
            )}
          </div>
        </div>
      )}

      {/* Content */}
      {activeTab === 'carte' && (
        <div style={{
          borderRadius: 20,
          overflow: 'hidden',
          border: '1px solid var(--border)',
          height: 550
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
            <MapBounds markers={mapMarkers.length > 0 ? mapMarkers : [{ coordinates: [14.6937, -17.4441] }]} />
            
            {/* Routes */}
            {SENEGAL_ROUTE_DATA.routes.map(route => (
              <Marker
                key={route.id}
                position={route.start.coordinates}
                icon={routeIcon}
              >
                <Popup>
                  <div style={{ minWidth: 280 }}>
                    <h3 style={{ margin: '0 0 8px 0', fontSize: '1rem' }}>{route.name}</h3>
                    <div style={{ fontSize: '0.8rem', marginBottom: 4 }}>
                      <span style={{ color: '#666' }}>De:</span> {route.start.city} → {route.end.city}
                    </div>
                    <div style={{ fontSize: '0.8rem', marginBottom: 4 }}>
                      <span style={{ color: '#666' }}>📏 Distance:</span> {route.distance}
                    </div>
                    <div style={{ fontSize: '0.8rem', marginBottom: 4 }}>
                      <span style={{ color: '#666' }}>⏱️ Durée:</span> {route.duration}
                    </div>
                    <div style={{ fontSize: '0.8rem', marginBottom: 4 }}>
                      <span style={{ color: '#666' }}>🛣️ État:</span>{' '}
                      <span style={{ 
                        color: route.condition === 'excellente' ? '#10B981' : 
                               route.condition === 'bonne' ? '#3B82F6' : '#F59E0B'
                      }}>
                        {route.condition}
                      </span>
                    </div>
                    {route.tollCost && (
                      <div style={{ fontSize: '0.8rem', marginBottom: 4 }}>
                        <span style={{ color: '#666' }}>💰 Péage:</span> {route.tollCost}
                      </div>
                    )}
                    {route.alerts.length > 0 && (
                      <div style={{ 
                        background: '#FEF3C7', 
                        padding: '8px 12px', 
                        borderRadius: 8, 
                        fontSize: '0.75rem',
                        marginTop: 8,
                        color: '#92400E'
                      }}>
                        ⚠️ {route.alerts[0]}
                      </div>
                    )}
                    <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                      <a 
                        href={getGpsLinks(route.start.coordinates[0], route.start.coordinates[1]).google}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          padding: '6px 12px',
                          background: '#3B82F6',
                          color: '#fff',
                          borderRadius: 6,
                          textDecoration: 'none',
                          fontSize: '0.75rem',
                          fontWeight: 600
                        }}
                      >
                        🚗 Y aller
                      </a>
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}
            
            {/* Traffic Zones */}
            {criticalZones.map(zone => (
              <Marker
                key={zone.id}
                position={zone.coordinates}
                icon={alertIcon}
              >
                <Popup>
                  <div style={{ minWidth: 250 }}>
                    <h3 style={{ margin: '0 0 8px 0', fontSize: '1rem', color: '#EF4444' }}>⚠️ {zone.name}</h3>
                    <div style={{ fontSize: '0.8rem', marginBottom: 4 }}>{zone.description}</div>
                    <div style={{ fontSize: '0.8rem', marginBottom: 4 }}>
                      <span style={{ color: '#666' }}>🚗 Vitesse moyenne:</span> {zone.averageSpeed}
                    </div>
                    <div style={{ fontSize: '0.8rem', marginBottom: 4 }}>
                      <span style={{ color: '#666' }}>⏰ Heures critiques:</span> {zone.peakHours.join(', ')}
                    </div>
                    {zone.alternatives.length > 0 && (
                      <div style={{ fontSize: '0.8rem', marginBottom: 4 }}>
                        <span style={{ color: '#666' }}>🔄 Alternatives:</span> {zone.alternatives.join(', ')}
                      </div>
                    )}
                  </div>
                </Popup>
              </Marker>
            ))}
            
            {/* Services */}
            {showServices && filteredServices.map(service => (
              <Marker
                key={service.id}
                position={service.coordinates}
                icon={serviceIcon}
              >
                <Popup>
                  <div style={{ minWidth: 220 }}>
                    <h3 style={{ margin: '0 0 8px 0', fontSize: '1rem' }}>
                      {service.type === 'station_service' && '⛽ '}
                      {service.type === 'depannage' && '🔧 '}
                      {service.type === 'garage' && '🔩 '}
                      {service.type === 'location' && '🚙 '}
                      {service.type === 'parking' && '🅿️ '}
                      {service.name}
                    </h3>
                    <div style={{ fontSize: '0.8rem', marginBottom: 4 }}>📍 {service.zone}, {service.city}</div>
                    <div style={{ fontSize: '0.8rem', marginBottom: 4 }}>⏰ {service.hours}</div>
                    <div style={{ fontSize: '0.8rem', marginBottom: 4 }}>📞 {service.phone}</div>
                    {service.services && (
                      <div style={{ fontSize: '0.75rem', color: '#666' }}>
                        ✓ {service.services.join(', ')}
                      </div>
                    )}
                    <a 
                      href={getGpsLinks(service.coordinates[0], service.coordinates[1]).google}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'inline-block',
                        marginTop: 8,
                        padding: '6px 12px',
                        background: '#3B82F6',
                        color: '#fff',
                        borderRadius: 6,
                        textDecoration: 'none',
                        fontSize: '0.75rem',
                        fontWeight: 600
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

      {activeTab === 'routes' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: 16 }}>
          {SENEGAL_ROUTE_DATA.routes.map(route => (
            <div key={route.id} style={{
              background: 'var(--bg-card)',
              borderRadius: 16,
              padding: 20,
              border: '1px solid var(--border)',
              transition: 'all 0.2s',
              cursor: 'pointer'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <div style={{
                  background: route.type === 'autoroute' ? '#3B82F6' : 
                             route.type === 'nationale' ? '#8B5CF6' : '#6B7280',
                  color: '#fff',
                  padding: '4px 12px',
                  borderRadius: 20,
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  textTransform: 'uppercase'
                }}>
                  {route.type}
                </div>
                <div style={{
                  background: route.condition === 'excellente' ? 'rgba(16,185,129,0.15)' :
                             route.condition === 'bonne' ? 'rgba(59,130,246,0.15)' : 'rgba(245,158,11,0.15)',
                  color: route.condition === 'excellente' ? '#10B981' :
                         route.condition === 'bonne' ? '#3B82F6' : '#F59E0B',
                  padding: '4px 10px',
                  borderRadius: 20,
                  fontSize: '0.7rem',
                  fontWeight: 700
                }}>
                  {route.condition}
                </div>
              </div>

              <h3 style={{ margin: '0 0 8px 0', fontSize: '1.1rem', fontWeight: 700 }}>{route.name}</h3>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                <div style={{ 
                  background: 'var(--bg-secondary)', 
                  padding: '12px', 
                  borderRadius: 10,
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)' }}>{route.distance}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Distance</div>
                </div>
                <div style={{ 
                  background: 'var(--bg-secondary)', 
                  padding: '12px', 
                  borderRadius: 10,
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)' }}>{route.duration}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Durée estimée</div>
                </div>
              </div>

              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 8 }}>
                <span style={{ color: 'var(--text-muted)' }}>De:</span> {route.start.city} → {route.end.city}
              </div>

              {route.tollCost && (
                <div style={{ fontSize: '0.85rem', marginBottom: 8 }}>
                  <span style={{ color: 'var(--text-muted)' }}>💰 Péage:</span>{' '}
                  <span style={{ color: '#10B981', fontWeight: 600 }}>{route.tollCost}</span>
                </div>
              )}

              {route.alerts.length > 0 && (
                <div style={{ 
                  background: 'rgba(239,68,68,0.1)', 
                  border: '1px solid rgba(239,68,68,0.3)',
                  padding: '10px 14px', 
                  borderRadius: 10, 
                  fontSize: '0.8rem',
                  marginTop: 12,
                  color: '#EF4444'
                }}>
                  ⚠️ {route.alerts[0]}
                </div>
              )}

              <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
                <a
                  href={getGpsLinks(route.start.coordinates[0], route.start.coordinates[1]).google}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    flex: 1,
                    padding: '10px 16px',
                    background: '#3B82F6',
                    color: '#fff',
                    borderRadius: 10,
                    textDecoration: 'none',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    textAlign: 'center'
                  }}
                >
                  🚗 Itinéraire
                </a>
                <a
                  href={getGpsLinks(route.end.coordinates[0], route.end.coordinates[1]).google}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    flex: 1,
                    padding: '10px 16px',
                    background: 'var(--bg-secondary)',
                    color: 'var(--text-primary)',
                    borderRadius: 10,
                    textDecoration: 'none',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    textAlign: 'center',
                    border: '1px solid var(--border)'
                  }}
                >
                  🎯 Destination
                </a>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'alertes' && (
        <div>
          {/* Active Alerts */}
          <h2 style={{ margin: '0 0 20px 0', fontSize: '1.3rem', color: 'var(--text-primary)' }}>
            🚨 Alertes en Cours ({activeAlerts.length})
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16, marginBottom: 30 }}>
            {activeAlerts.map(alert => (
              <div key={alert.id} style={{
                background: alert.priority === 'critique' ? 'rgba(239,68,68,0.08)' : 
                           alert.priority === 'elevee' ? 'rgba(245,158,11,0.08)' : 'var(--bg-card)',
                borderRadius: 16,
                padding: 20,
                border: alert.priority === 'critique' ? '1px solid rgba(239,68,68,0.3)' :
                        alert.priority === 'elevee' ? '1px solid rgba(245,158,11,0.3)' : '1px solid var(--border)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                  <span style={{ fontSize: '1.5rem' }}>
                    {alert.type === 'travaux' && '🚧'}
                    {alert.type === 'accident' && '💥'}
                    {alert.type === 'evenement' && '🎉'}
                    {alert.type === 'meteo' && '🌧️'}
                    {alert.type === 'controle' && '🚔'}
                    {alert.type === 'fermeture' && '🚫'}
                  </span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      <span style={{ 
                        color: alert.priority === 'critique' ? '#EF4444' :
                               alert.priority === 'elevee' ? '#F59E0B' : '#6B7280'
                      }}>
                        {alert.type}
                      </span>
                    </div>
                    <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>{alert.title}</h3>
                  </div>
                </div>
                
                <p style={{ margin: '0 0 12px 0', color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.5 }}>
                  {alert.description}
                </p>

                <div style={{ background: 'var(--bg-secondary)', padding: '10px 14px', borderRadius: 10, marginBottom: 12 }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    📍 {alert.location}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#EF4444', fontWeight: 600, marginTop: 4 }}>
                    ⚠️ Impact: {alert.impact}
                  </div>
                  {alert.alternatives.length > 0 && (
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 4 }}>
                      🔄 Alternatives: {alert.alternatives.join(', ')}
                    </div>
                  )}
                </div>

                <a
                  href={getGpsLinks(alert.coordinates[0], alert.coordinates[1]).google}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-block',
                    padding: '8px 16px',
                    background: '#3B82F6',
                    color: '#fff',
                    borderRadius: 10,
                    textDecoration: 'none',
                    fontSize: '0.85rem',
                    fontWeight: 700
                  }}
                >
                  🚗 Voir sur la carte
                </a>
              </div>
            ))}
          </div>

          {/* Traffic Zones */}
          <h2 style={{ margin: '30px 0 20px 0', fontSize: '1.3rem', color: 'var(--text-primary)' }}>
            🚦 Points Noirs & Zones de Vigilance
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
            {SENEGAL_ROUTE_DATA.trafficZones.map(zone => (
              <div key={zone.id} style={{
                background: zone.severity === 'critique' ? 'rgba(239,68,68,0.05)' :
                           zone.severity === 'elevee' ? 'rgba(245,158,11,0.05)' : 'var(--bg-card)',
                borderRadius: 14,
                padding: 18,
                border: '1px solid var(--border)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                  <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700 }}>{zone.name}</h3>
                  <span style={{
                    padding: '3px 10px',
                    borderRadius: 20,
                    fontSize: '0.65rem',
                    fontWeight: 800,
                    background: zone.severity === 'critique' ? '#EF4444' :
                               zone.severity === 'elevee' ? '#F59E0B' : '#6B7280',
                    color: '#fff',
                    textTransform: 'uppercase'
                  }}>
                    {zone.severity}
                  </span>
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 8 }}>
                  {zone.description}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  🚗 {zone.averageSpeed} • ⏰ {zone.peakHours.join(', ')}
                </div>
                {zone.alternatives.length > 0 && (
                  <div style={{ fontSize: '0.75rem', color: '#3B82F6', marginTop: 6 }}>
                    🔄 Alternatives: {zone.alternatives.join(', ')}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'services' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
          {filteredServices.map(service => (
            <div key={service.id} style={{
              background: 'var(--bg-card)',
              borderRadius: 16,
              padding: 20,
              border: '1px solid var(--border)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <div style={{
                  width: 50,
                  height: 50,
                  borderRadius: 14,
                  background: service.type === 'station_service' ? 'rgba(59,130,246,0.15)' :
                             service.type === 'depannage' ? 'rgba(239,68,68,0.15)' :
                             service.type === 'garage' ? 'rgba(245,158,11,0.15)' :
                             service.type === 'location' ? 'rgba(139,92,246,0.15)' : 'rgba(107,114,128,0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.5rem'
                }}>
                  {service.type === 'station_service' && '⛽'}
                  {service.type === 'depannage' && '🔧'}
                  {service.type === 'garage' && '🔩'}
                  {service.type === 'location' && '🚙'}
                  {service.type === 'parking' && '🅿️'}
                </div>
                <div>
                  <h3 style={{ margin: '0 0 4px 0', fontSize: '1rem', fontWeight: 700 }}>{service.name}</h3>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {service.brand} • {service.city}
                  </div>
                </div>
              </div>

              <div style={{ fontSize: '0.85rem', marginBottom: 6 }}>
                <span style={{ color: 'var(--text-muted)' }}>📍</span> {service.zone}
              </div>
              <div style={{ fontSize: '0.85rem', marginBottom: 6 }}>
                <span style={{ color: 'var(--text-muted)' }}>⏰</span> {service.hours}
              </div>
              <div style={{ fontSize: '0.85rem', marginBottom: 6 }}>
                <span style={{ color: 'var(--text-muted)' }}>📞</span> {service.phone}
              </div>
              {service.responseTime && (
                <div style={{ fontSize: '0.85rem', marginBottom: 6, color: '#10B981' }}>
                  ⚡ Intervention: {service.responseTime}
                </div>
              )}
              {service.rates && (
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 8 }}>
                  💰 {service.rates}
                </div>
              )}

              <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                <a
                  href={getGpsLinks(service.coordinates[0], service.coordinates[1]).google}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    flex: 1,
                    padding: '8px 14px',
                    background: '#3B82F6',
                    color: '#fff',
                    borderRadius: 10,
                    textDecoration: 'none',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    textAlign: 'center'
                  }}
                >
                  🚗 Y aller
                </a>
                <a
                  href={`tel:${service.phone}`}
                  style={{
                    padding: '8px 14px',
                    background: 'var(--bg-secondary)',
                    color: 'var(--text-primary)',
                    borderRadius: 10,
                    textDecoration: 'none',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    border: '1px solid var(--border)'
                  }}
                >
                  📞
                </a>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'autoecole' && (
        <div>
          {/* Driving Schools */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16, marginBottom: 30 }}>
            {SENEGAL_ROUTE_DATA.drivingSchools.map(school => (
              <div key={school.id} style={{
                background: 'var(--bg-card)',
                borderRadius: 16,
                padding: 20,
                border: '1px solid var(--border)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                  <div style={{
                    width: 50,
                    height: 50,
                    borderRadius: 14,
                    background: 'rgba(245,158,11,0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.5rem'
                  }}>
                    🎓
                  </div>
                  <div>
                    <h3 style={{ margin: '0 0 4px 0', fontSize: '1rem', fontWeight: 700 }}>{school.name}</h3>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      ⭐ {school.rating}/5 • {school.city}
                    </div>
                  </div>
                </div>

                <div style={{ fontSize: '0.85rem', marginBottom: 6 }}>
                  <span style={{ color: 'var(--text-muted)' }}>📍</span> {school.zone}
                </div>
                <div style={{ fontSize: '0.85rem', marginBottom: 6 }}>
                  <span style={{ color: 'var(--text-muted)' }}>⏰</span> {school.hours}
                </div>
                <div style={{ fontSize: '0.85rem', marginBottom: 6 }}>
                  <span style={{ color: 'var(--text-muted)' }}>📞</span> {school.phone}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 8 }}>
                  🚗 Véhicules: {school.vehicles.join(', ')}
                </div>

                <div style={{ background: 'var(--bg-secondary)', padding: '10px 14px', borderRadius: 10, marginBottom: 12 }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: 4, textTransform: 'uppercase' }}>
                    Tarifs
                  </div>
                  <div style={{ fontSize: '0.8rem' }}>
                    Code: {school.prices.code} • Conduite: {school.prices.conduite}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#10B981', fontWeight: 600 }}>
                    Pack complet: {school.prices.pack}
                  </div>
                </div>

                <a
                  href={`tel:${school.phone}`}
                  style={{
                    display: 'block',
                    padding: '10px 16px',
                    background: '#F59E0B',
                    color: '#fff',
                    borderRadius: 10,
                    textDecoration: 'none',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    textAlign: 'center'
                  }}
                >
                  📞 Contacter
                </a>
              </div>
            ))}
          </div>

          {/* Driving Tips */}
          <h2 style={{ margin: '0 0 20px 0', fontSize: '1.3rem', color: 'var(--text-primary)' }}>
            📚 Conseils & Code de la Route
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
            {SENEGAL_ROUTE_DATA.drivingTips.map((tip, i) => (
              <div key={i} style={{
                background: 'var(--bg-card)',
                borderRadius: 14,
                padding: 20,
                border: '1px solid var(--border)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                  <span style={{ fontSize: '1.8rem' }}>{tip.icon}</span>
                  <div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
                      {tip.category}
                    </div>
                    <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>{tip.title}</h3>
                  </div>
                </div>
                <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6 }}>
                  {tip.content}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'coderoute' && (
        <div>
          {/* Hero Section Code de la Route */}
          <div style={{
            background: 'linear-gradient(135deg, #EC4899 0%, #8B5CF6 50%, #EC4899 100%)',
            borderRadius: 20,
            padding: '28px 24px',
            marginBottom: 24,
            color: '#fff'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{
                background: 'rgba(255,255,255,0.2)',
                borderRadius: 16,
                padding: '16px 20px',
                fontSize: '2.5rem'
              }}>
                📘
              </div>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800 }}>Code de la Route Sénégal</h2>
                <p style={{ margin: '4px 0 0 0', opacity: 0.9, fontSize: '0.95rem' }}>
                  Normes locales • Amendes 2025 • Panneaux • Spécificités
                </p>
              </div>
            </div>
          </div>

          {/* Limites de Vitesse */}
          <div style={{ marginBottom: 28 }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '1.2rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
              🏎️ {SENEGAL_ROUTE_DATA.trafficCode.speedLimits.title}
            </h3>
            <p style={{ margin: '0 0 16px 0', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              {SENEGAL_ROUTE_DATA.trafficCode.speedLimits.subtitle}
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12, marginBottom: 20 }}>
              {SENEGAL_ROUTE_DATA.trafficCode.speedLimits.zones.map((zone, i) => (
                <div key={i} style={{
                  background: 'var(--bg-card)',
                  borderRadius: 14,
                  padding: 16,
                  border: '1px solid var(--border)',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '2rem', marginBottom: 8 }}>{zone.icon}</div>
                  <div style={{ fontSize: '1.8rem', fontWeight: 800, color: zone.type === 'pluie' || zone.type === 'nuit' ? '#F59E0B' : '#3B82F6' }}>
                    {zone.limit}
                  </div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', marginTop: 4 }}>
                    {zone.description}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 8 }}>
                    {zone.details}
                  </div>
                </div>
              ))}
            </div>
            
            {/* Sanctions Excès de Vitesse */}
            <div style={{
              background: 'rgba(239,68,68,0.08)',
              border: '1px solid rgba(239,68,68,0.2)',
              borderRadius: 14,
              padding: 20,
              marginTop: 16
            }}>
              <h4 style={{ margin: '0 0 12px 0', color: '#EF4444', fontSize: '1rem' }}>
                ⚠️ Sanctions Excès de Vitesse (2025)
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 10 }}>
                {SENEGAL_ROUTE_DATA.trafficCode.speedLimits.sanctions.map((sanction, i) => (
                  <div key={i} style={{
                    background: '#fff',
                    borderRadius: 10,
                    padding: '12px 16px',
                    borderLeft: `4px solid ${sanction.points < -2 ? '#EF4444' : sanction.points < 0 ? '#F59E0B' : '#10B981'}`
                  }}>
                    <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      +{sanction.exceed}: <span style={{ color: '#EF4444' }}>{sanction.amount}</span>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 2 }}>
                      {sanction.points !== 0 && <span>{sanction.points} point(s) • </span>}{sanction.severity}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Documents Obligatoires */}
          <div style={{ marginBottom: 28 }}>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '1.2rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
              📋 {SENEGAL_ROUTE_DATA.trafficCode.requiredDocuments.title}
            </h3>
            <p style={{ margin: '0 0 16px 0', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              {SENEGAL_ROUTE_DATA.trafficCode.requiredDocuments.subtitle}
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
              {SENEGAL_ROUTE_DATA.trafficCode.requiredDocuments.documents.map((doc, i) => (
                <div key={i} style={{
                  background: 'var(--bg-card)',
                  borderRadius: 14,
                  padding: 16,
                  border: '1px solid var(--border)',
                  display: 'flex',
                  gap: 12
                }}>
                  <div style={{ fontSize: '2rem' }}>{doc.icon}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>{doc.name}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 2 }}>{doc.category}</div>
                    <div style={{ fontSize: '0.8rem', color: '#10B981', marginTop: 4 }}>✓ {doc.valid}</div>
                    <div style={{ fontSize: '0.8rem', color: '#EF4444', marginTop: 2 }}>✗ Amende: {doc.penalty}</div>
                    {doc.note && <div style={{ fontSize: '0.75rem', color: '#F59E0B', marginTop: 4 }}>⚠️ {doc.note}</div>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Règles de Priorité */}
          <div style={{ marginBottom: 28 }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '1.2rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
              🚦 {SENEGAL_ROUTE_DATA.trafficCode.priorityRules.title}
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 12 }}>
              {SENEGAL_ROUTE_DATA.trafficCode.priorityRules.rules.map((rule, i) => (
                <div key={i} style={{
                  background: 'var(--bg-card)',
                  borderRadius: 14,
                  padding: 18,
                  border: '1px solid var(--border)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                    <span style={{ fontSize: '1.8rem' }}>{rule.icon}</span>
                    <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>{rule.title}</h4>
                  </div>
                  <p style={{ margin: '0 0 8px 0', color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.5 }}>
                    {rule.description}
                  </p>
                  <div style={{ fontSize: '0.8rem', color: '#F59E0B', background: 'rgba(245,158,11,0.1)', padding: '6px 10px', borderRadius: 8 }}>
                    🇸🇳 {rule.localContext}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Panneaux de Signalisation */}
          <div style={{ marginBottom: 28 }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '1.2rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
              🚧 {SENEGAL_ROUTE_DATA.trafficCode.roadSigns.title}
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
              {SENEGAL_ROUTE_DATA.trafficCode.roadSigns.categories.map((cat, i) => (
                <div key={i} style={{
                  background: 'var(--bg-card)',
                  borderRadius: 16,
                  padding: 20,
                  border: '1px solid var(--border)'
                }}>
                  <h4 style={{ 
                    margin: '0 0 12px 0', 
                    fontSize: '1rem', 
                    color: cat.color,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8
                  }}>
                    <span style={{ 
                      width: 12, 
                      height: 12, 
                      borderRadius: '50%', 
                      background: cat.color 
                    }} />
                    {cat.name}
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {cat.signs.map((sign, j) => (
                      <div key={j} style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        padding: '8px 12px',
                        background: 'var(--bg-secondary)',
                        borderRadius: 8
                      }}>
                        <span style={{ fontSize: '1.3rem' }}>{sign.icon}</span>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{sign.name}</div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{sign.code}</div>
                          {sign.localNote && (
                            <div style={{ fontSize: '0.7rem', color: '#F59E0B', marginTop: 2 }}>🇸🇳 {sign.localNote}</div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Spécificités Locales */}
          <div style={{ marginBottom: 28 }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '1.2rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
              🇸🇳 {SENEGAL_ROUTE_DATA.trafficCode.localSpecifics.title}
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
              {SENEGAL_ROUTE_DATA.trafficCode.localSpecifics.items.map((item, i) => (
                <div key={i} style={{
                  background: 'linear-gradient(135deg, rgba(236,72,153,0.1) 0%, rgba(139,92,246,0.1) 100%)',
                  borderRadius: 14,
                  padding: 16,
                  border: '1px solid rgba(236,72,153,0.2)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                    <span style={{ fontSize: '1.5rem' }}>{item.icon}</span>
                    <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>{item.title}</h4>
                  </div>
                  <p style={{ margin: '0 0 8px 0', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                    {item.description}
                  </p>
                  <div style={{ fontSize: '0.8rem', color: '#10B981', background: 'rgba(16,185,129,0.1)', padding: '6px 10px', borderRadius: 8 }}>
                    💡 {item.advice}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Amendes & Sanctions */}
          <div style={{ marginBottom: 28 }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '1.2rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
              ⚖️ {SENEGAL_ROUTE_DATA.trafficCode.penalties.title}
            </h3>
            <p style={{ margin: '0 0 16px 0', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              {SENEGAL_ROUTE_DATA.trafficCode.penalties.subtitle}
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
              {SENEGAL_ROUTE_DATA.trafficCode.penalties.categories.map((cat, i) => (
                <div key={i} style={{
                  background: 'var(--bg-card)',
                  borderRadius: 16,
                  padding: 18,
                  border: '1px solid var(--border)'
                }}>
                  <h4 style={{ margin: '0 0 12px 0', fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {cat.name}
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {cat.items.map((item, j) => (
                      <div key={j} style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '10px 14px',
                        background: 'var(--bg-secondary)',
                        borderRadius: 8,
                        borderLeft: `3px solid ${item.points.includes('-') ? '#EF4444' : '#10B981'}`
                      }}>
                        <div>
                          <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>{item.violation}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{item.risk}</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#EF4444' }}>{item.amount}</div>
                          <div style={{ fontSize: '0.75rem', color: item.points.includes('-') ? '#EF4444' : '#6B7280' }}>{item.points} pts</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            
            {/* Système de Points */}
            <div style={{
              background: 'linear-gradient(135deg, #1e40af 0%, #3730a3 100%)',
              borderRadius: 14,
              padding: 20,
              marginTop: 20,
              color: '#fff'
            }}>
              <h4 style={{ margin: '0 0 12px 0', fontSize: '1rem' }}>
                🎯 Système de Points sur le Permis
              </h4>
              <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
                <div>
                  <div style={{ fontSize: '2rem', fontWeight: 800 }}>{SENEGAL_ROUTE_DATA.trafficCode.penalties.pointSystem.total}</div>
                  <div style={{ fontSize: '0.85rem', opacity: 0.8 }}>Points de départ</div>
                </div>
                <div>
                  <div style={{ fontSize: '2rem', fontWeight: 800, color: '#F59E0B' }}>{SENEGAL_ROUTE_DATA.trafficCode.penalties.pointSystem.warning}</div>
                  <div style={{ fontSize: '0.85rem', opacity: 0.8 }}>Seuil d'alerte</div>
                </div>
                <div>
                  <div style={{ fontSize: '2rem', fontWeight: 800, color: '#EF4444' }}>{SENEGAL_ROUTE_DATA.trafficCode.penalties.pointSystem.suspension}</div>
                  <div style={{ fontSize: '0.85rem', opacity: 0.8 }}>Retrait permis</div>
                </div>
              </div>
              <p style={{ margin: '12px 0 0 0', fontSize: '0.9rem', opacity: 0.9 }}>
                {SENEGAL_ROUTE_DATA.trafficCode.penalties.pointSystem.note}
              </p>
            </div>
          </div>

          {/* Questions Type Examen */}
          <div style={{ marginBottom: 28 }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '1.2rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
              📝 {SENEGAL_ROUTE_DATA.trafficCode.examSample.title}
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: 12 }}>
              {SENEGAL_ROUTE_DATA.trafficCode.examSample.questions.map((q, i) => (
                <div key={i} style={{
                  background: 'var(--bg-card)',
                  borderRadius: 14,
                  padding: 18,
                  border: '1px solid var(--border)'
                }}>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 6 }}>Question {i + 1}</div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 10 }}>
                    {q.q}
                  </div>
                  <div style={{
                    background: 'rgba(16,185,129,0.1)',
                    borderLeft: '3px solid #10B981',
                    padding: '10px 14px',
                    borderRadius: 8,
                    fontSize: '0.9rem',
                    color: '#10B981'
                  }}>
                    ✓ {q.a}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Numéros d'Urgence */}
          <div>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '1.2rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
              🚨 {SENEGAL_ROUTE_DATA.trafficCode.emergencyNumbers.title}
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
              {SENEGAL_ROUTE_DATA.trafficCode.emergencyNumbers.numbers.map((num, i) => (
                <a
                  key={i}
                  href={`tel:${num.number.replace(/\s/g, '')}`}
                  style={{
                    background: 'var(--bg-card)',
                    borderRadius: 14,
                    padding: 16,
                    border: '1px solid var(--border)',
                    textDecoration: 'none',
                    color: 'inherit',
                    display: 'block'
                  }}
                >
                  <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>{num.name}</div>
                  <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#3B82F6', margin: '6px 0' }}>{num.number}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{num.description}</div>
                  {num.free && <span style={{ fontSize: '0.75rem', color: '#10B981', fontWeight: 600 }}>☎️ Gratuit</span>}
                </a>
              ))}
            </div>
          </div>
        </div>
      )}
    </main>
  )
}

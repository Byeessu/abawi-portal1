import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { Link } from 'react-router-dom'
import SEO from '../components/SEO'
import { supabase } from '../lib/supabase'

export default function MaxAvisPublicForm() {
  const { surveyId } = useParams()
  const [survey, setSurvey] = useState(null)
  const [responses, setResponses] = useState({})
  const [submitted, setSubmitted] = useState(false)
  const [notFound, setNotFound] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadSurvey() {
      // Try Supabase first
      const { data, error } = await supabase
        .from('maxavis_surveys')
        .select('*')
        .eq('id', surveyId)
        .maybeSingle()
      if (data) {
        setSurvey({ ...data, title: data.titre, description: data.description, questions: data.questions || [], settings: data.settings || {} })
        const hasResponded = localStorage.getItem(`maxavis_responded_${data.id}`)
        if (hasResponded) setSubmitted(true)
        setLoading(false)
        return
      }
      // Fallback: localStorage (legacy)
      const stored = JSON.parse(localStorage.getItem('maxavis_surveys') || '[]')
      const found = stored.find(s => s.link?.includes(surveyId) || s.id === surveyId)
      if (found) {
        setSurvey(found)
        const hasResponded = localStorage.getItem(`maxavis_responded_${found.id}`)
        if (hasResponded) setSubmitted(true)
      } else {
        setNotFound(true)
      }
      setLoading(false)
    }
    loadSurvey()
  }, [surveyId])

  const handleResponseChange = (questionId, value) => {
    setResponses(prev => ({
      ...prev,
      [questionId]: value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!survey) return

    // Save response to Supabase
    await supabase.from('maxavis_responses').insert({
      survey_id: survey.id,
      answers: responses,
      respondent: 'anonyme',
    })
    localStorage.setItem(`maxavis_responded_${survey.id}`, 'true')

    setSubmitted(true)
  }

  if (loading) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      }}>
        <div style={{ color: 'white', fontSize: '1.2rem' }}>Chargement...</div>
      </div>
    )
  }

  if (notFound || !survey) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '20px'
      }}>
        <div style={{ 
          background: 'white', 
          padding: '40px', 
          borderRadius: '16px',
          textAlign: 'center',
          maxWidth: '400px'
        }}>
          <div style={{ fontSize: '64px', marginBottom: '16px' }}>😕</div>
          <h2 style={{ marginBottom: '16px', color: '#333' }}>Sondage introuvable</h2>
          <p style={{ color: '#666', marginBottom: '24px' }}>
            Ce sondage n'existe pas ou a été supprimé.
          </p>
          <Link 
            to="/" 
            style={{ 
              display: 'inline-block',
              padding: '12px 24px',
              background: '#667eea',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '8px',
              fontWeight: '500'
            }}
          >
            Retour à l'accueil
          </Link>
        </div>
      </div>
    )
  }

  if (survey.status === 'closed') {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '20px'
      }}>
        <div style={{ 
          background: 'white', 
          padding: '40px', 
          borderRadius: '16px',
          textAlign: 'center',
          maxWidth: '400px'
        }}>
          <div style={{ fontSize: '64px', marginBottom: '16px' }}>🔒</div>
          <h2 style={{ marginBottom: '16px', color: '#333' }}>Sondage clôturé</h2>
          <p style={{ color: '#666', marginBottom: '24px' }}>
            Ce sondage est maintenant terminé et n'accepte plus de réponses.
          </p>
          <Link 
            to="/" 
            style={{ 
              display: 'inline-block',
              padding: '12px 24px',
              background: '#667eea',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '8px',
              fontWeight: '500'
            }}
          >
            Retour à l'accueil
          </Link>
        </div>
      </div>
    )
  }

  if (survey.status === 'draft') {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '20px'
      }}>
        <div style={{ 
          background: 'white', 
          padding: '40px', 
          borderRadius: '16px',
          textAlign: 'center',
          maxWidth: '400px'
        }}>
          <div style={{ fontSize: '64px', marginBottom: '16px' }}>📝</div>
          <h2 style={{ marginBottom: '16px', color: '#333' }}>Sondage non publié</h2>
          <p style={{ color: '#666', marginBottom: '24px' }}>
            Ce sondage n'est pas encore ouvert aux réponses.
          </p>
          <Link 
            to="/" 
            style={{ 
              display: 'inline-block',
              padding: '12px 24px',
              background: '#667eea',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '8px',
              fontWeight: '500'
            }}
          >
            Retour à l'accueil
          </Link>
        </div>
      </div>
    )
  }

  if (submitted) {
    return (
      <div style={{ 
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '40px 20px'
      }}>
        <div style={{ 
          maxWidth: '600px',
          margin: '0 auto',
          background: 'white', 
          padding: '40px', 
          borderRadius: '16px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '80px', marginBottom: '20px' }}>🎉</div>
          <h2 style={{ marginBottom: '16px', color: '#333', fontSize: '1.8rem' }}>
            Merci pour votre participation !
          </h2>
          <p style={{ color: '#666', marginBottom: '24px', fontSize: '1.1rem' }}>
            Votre réponse a été enregistrée avec succès.
          </p>
          <div style={{ 
            background: '#f8f9fa', 
            padding: '20px', 
            borderRadius: '12px',
            marginBottom: '24px'
          }}>
            <p style={{ margin: '0 0 8px 0', color: '#666', fontSize: '0.9rem' }}>Sondage</p>
            <p style={{ margin: 0, fontWeight: '600', color: '#333', fontSize: '1.1rem' }}>{survey.title}</p>
          </div>
          <Link 
            to="/" 
            style={{ 
              display: 'inline-block',
              padding: '12px 24px',
              background: '#667eea',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '8px',
              fontWeight: '500'
            }}
          >
            Retour à l'accueil
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div style={{ 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '20px'
    }}>
      <SEO
        title={`${survey.title} - MaxAvis`}
        description={survey.description || 'Participez à ce sondage MaxAvis'}
      />
      
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ 
          background: 'white',
          borderRadius: '16px',
          padding: '32px',
          marginBottom: '20px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
        }}>
          <div style={{ 
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            marginBottom: '20px'
          }}>
            <div style={{ 
              width: '56px',
              height: '56px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '28px'
            }}>
              📊
            </div>
            <div>
              <h1 style={{ 
                margin: 0,
                fontSize: '1.5rem',
                fontWeight: '700',
                color: '#333'
              }}>
                {survey.title}
              </h1>
              <p style={{ 
                margin: '4px 0 0 0',
                color: '#666',
                fontSize: '0.9rem'
              }}>
                par {survey.author || 'MaxAvis Elite'}
              </p>
            </div>
          </div>
          
          {survey.description && (
            <p style={{ 
              margin: '0 0 20px 0',
              color: '#555',
              lineHeight: '1.6',
              fontSize: '1rem'
            }}>
              {survey.description}
            </p>
          )}
          
          <div style={{ 
            display: 'flex',
            gap: '12px',
            flexWrap: 'wrap',
            fontSize: '0.85rem',
            color: '#888'
          }}>
            <span style={{ 
              background: '#f0f0f0',
              padding: '4px 12px',
              borderRadius: '20px'
            }}>
              📅 {new Date(survey.createdAt).toLocaleDateString('fr-FR')}
            </span>
            <span style={{ 
              background: '#e8f5e9',
              color: '#2e7d32',
              padding: '4px 12px',
              borderRadius: '20px'
            }}>
              ● Ouvert
            </span>
            <span style={{ 
              background: '#f0f0f0',
              padding: '4px 12px',
              borderRadius: '20px'
            }}>
              🔒 Anonyme
            </span>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div style={{ 
            background: 'white',
            borderRadius: '16px',
            padding: '32px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
          }}>
            <h2 style={{ 
              margin: '0 0 24px 0',
              fontSize: '1.1rem',
              color: '#333'
            }}>
              Questions ({survey.questions?.length || 0})
            </h2>

            {survey.questions?.map((question, index) => (
              <div 
                key={question.id}
                style={{ 
                  marginBottom: '24px',
                  paddingBottom: '24px',
                  borderBottom: index < survey.questions.length - 1 ? '1px solid #eee' : 'none'
                }}
              >
                <div style={{ 
                  display: 'flex',
                  gap: '8px',
                  marginBottom: '12px'
                }}>
                  <span style={{ 
                    background: '#667eea',
                    color: 'white',
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    flexShrink: 0
                  }}>
                    {index + 1}
                  </span>
                  <p style={{ 
                    margin: 0,
                    fontWeight: '500',
                    color: '#333',
                    fontSize: '1rem',
                    lineHeight: '1.5'
                  }}>
                    {question.text}
                  </p>
                </div>

                {question.type === 'text' && (
                  <textarea
                    required={question.required}
                    value={responses[question.id] || ''}
                    onChange={(e) => handleResponseChange(question.id, e.target.value)}
                    placeholder="Votre réponse..."
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: '1px solid #ddd',
                      borderRadius: '8px',
                      fontSize: '0.95rem',
                      minHeight: '100px',
                      resize: 'vertical',
                      fontFamily: 'inherit'
                    }}
                  />
                )}

                {question.type === 'single' && question.options && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {question.options.map((option, optIndex) => (
                      <label 
                        key={optIndex}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          padding: '12px 16px',
                          background: responses[question.id] === option ? '#e8eaf6' : '#f8f9fa',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          border: responses[question.id] === option ? '2px solid #667eea' : '2px solid transparent',
                          transition: 'all 0.2s'
                        }}
                      >
                        <input
                          type="radio"
                          name={question.id}
                          value={option}
                          required={question.required}
                          checked={responses[question.id] === option}
                          onChange={(e) => handleResponseChange(question.id, e.target.value)}
                          style={{ width: '18px', height: '18px', accentColor: '#667eea' }}
                        />
                        <span style={{ fontSize: '0.95rem', color: '#333' }}>{option}</span>
                      </label>
                    ))}
                  </div>
                )}

                {question.type === 'multiple' && question.options && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {question.options.map((option, optIndex) => {
                      const selectedOptions = responses[question.id] || []
                      const isSelected = selectedOptions.includes(option)
                      
                      return (
                        <label 
                          key={optIndex}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            padding: '12px 16px',
                            background: isSelected ? '#e8eaf6' : '#f8f9fa',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            border: isSelected ? '2px solid #667eea' : '2px solid transparent',
                            transition: 'all 0.2s'
                          }}
                        >
                          <input
                            type="checkbox"
                            value={option}
                            checked={isSelected}
                            onChange={(e) => {
                              const current = responses[question.id] || []
                              if (e.target.checked) {
                                handleResponseChange(question.id, [...current, option])
                              } else {
                                handleResponseChange(question.id, current.filter(o => o !== option))
                              }
                            }}
                            style={{ width: '18px', height: '18px', accentColor: '#667eea' }}
                          />
                          <span style={{ fontSize: '0.95rem', color: '#333' }}>{option}</span>
                        </label>
                      )
                    })}
                  </div>
                )}

                {question.type === 'scale' && (
                  <div>
                    <div style={{ 
                      display: 'flex',
                      gap: '8px',
                      flexWrap: 'wrap',
                      justifyContent: 'center'
                    }}>
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((value) => (
                        <button
                          key={value}
                          type="button"
                          onClick={() => handleResponseChange(question.id, value)}
                          style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '50%',
                            border: responses[question.id] === value ? '2px solid #667eea' : '1px solid #ddd',
                            background: responses[question.id] === value ? '#667eea' : 'white',
                            color: responses[question.id] === value ? 'white' : '#333',
                            fontWeight: '600',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                          }}
                        >
                          {value}
                        </button>
                      ))}
                    </div>
                    <div style={{ 
                      display: 'flex',
                      justifyContent: 'space-between',
                      marginTop: '8px',
                      fontSize: '0.8rem',
                      color: '#888'
                    }}>
                      <span>Pas du tout d'accord</span>
                      <span>Tout à fait d'accord</span>
                    </div>
                  </div>
                )}

                {question.required && (
                  <p style={{ 
                    margin: '8px 0 0 0',
                    fontSize: '0.8rem',
                    color: '#d32f2f'
                  }}>
                    * Champ obligatoire
                  </p>
                )}
              </div>
            ))}

            <button
              type="submit"
              style={{
                width: '100%',
                padding: '16px 24px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                fontSize: '1.1rem',
                fontWeight: '600',
                cursor: 'pointer',
                marginTop: '16px',
                transition: 'transform 0.2s, box-shadow 0.2s'
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'translateY(-2px)'
                e.target.style.boxShadow = '0 8px 20px rgba(102, 126, 234, 0.4)'
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0)'
                e.target.style.boxShadow = 'none'
              }}
            >
              ✅ Envoyer ma réponse
            </button>
          </div>
        </form>

        {/* Footer */}
        <div style={{ 
          textAlign: 'center',
          padding: '24px',
          color: 'rgba(255,255,255,0.8)',
          fontSize: '0.85rem'
        }}>
          <p>Propulsé par <strong>MaxAvis Elite</strong> — Sondages professionnels</p>
          <p style={{ marginTop: '8px' }}>
            <Link to="/outils/maxavis" style={{ color: 'rgba(255,255,255,0.9)', textDecoration: 'underline' }}>
              Créer votre propre sondage
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

import React, { useState, useEffect, useRef } from 'react'
import { 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend 
} from 'recharts'
import { 
  MessageSquare, 
  Database, 
  BarChart3, 
  Search, 
  LogOut, 
  Play, 
  ShieldAlert, 
  User, 
  Zap,
  Info,
  ChevronRight,
  TrendingUp,
  Award,
  Users,
  Send,
  X
} from 'lucide-react'

// Mock User Details for Google Consent Screen
const teamMembers = [
  { name: "C Chethan Kalyan", email: "chethan.kalyan@example.com", avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=chethan" },
  { name: "Manoj K S", email: "manoj.ks@example.com", avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=manoj" },
  { name: "Mooli Vishnu Sai Reddy", email: "vishnu.reddy@example.com", avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=vishnu" }
]

// === DEPLOYMENT CONFIGURATIONS ===
// Replace these URLs after deploying your backend on Render and Streamlit app on Streamlit Cloud
const DEPLOYED_BACKEND_URL = "https://ecommerce-review-analyzer-backend.onrender.com";
const DEPLOYED_STREAMLIT_URL = "https://ecommerce-analyzer.streamlit.app";

// Override global fetch to automatically prepend backend URL in production
const originalFetch = window.fetch;
window.fetch = function (url, options) {
  if (url.startsWith('/api') && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    url = DEPLOYED_BACKEND_URL + url;
  }
  return originalFetch(url, options);
};

export default function App() {
  const [user, setUser] = useState(null)
  const [showConsentModal, setShowConsentModal] = useState(false)
  const [selectedMember, setSelectedMember] = useState(teamMembers[0])
  const [activeTab, setActiveTab] = useState('dashboard') // dashboard, explorer, sql
  const [stats, setStats] = useState(null)
  const [loadingStats, setLoadingStats] = useState(false)
  
  // Auth Form State
  const [authTab, setAuthTab] = useState('login') // login, register
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  
  const [registerName, setRegisterName] = useState('')
  const [registerEmail, setRegisterEmail] = useState('')
  const [registerPassword, setRegisterPassword] = useState('')
  const [registerConfirmPassword, setRegisterConfirmPassword] = useState('')
  
  const [useGoogleCustom, setUseGoogleCustom] = useState(true)
  const [googleCustomName, setGoogleCustomName] = useState('Karthik')
  const [googleCustomEmail, setGoogleCustomEmail] = useState('karthik@example.com')
  
  // Chatbot State
  const [chatOpen, setChatOpen] = useState(false)
  const [chatMessages, setChatMessages] = useState([
    { sender: 'assistant', text: 'Hello! I am your AI review assistant. Ask me to explain the workflow, query details (e.g., "what is the average rating of books?"), or analyze a custom review text!' }
  ])
  const [chatInput, setChatInput] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  
  // SQL Playground State
  const [sqlQuery, setSqlQuery] = useState('SELECT * FROM reviews LIMIT 10;')
  const [sqlResult, setSqlResult] = useState(null)
  const [sqlError, setSqlError] = useState(null)
  const [sqlLoading, setSqlLoading] = useState(false)
  const [selectedSampleQuery, setSelectedSampleQuery] = useState('')
  
  // Reviews Explorer State
  const [reviewsData, setReviewsData] = useState([])
  const [totalReviews, setTotalReviews] = useState(0)
  const [explorerPage, setExplorerPage] = useState(1)
  const [explorerPages, setExplorerPages] = useState(1)
  const [filterCategory, setFilterCategory] = useState('')
  const [filterSentiment, setFilterSentiment] = useState('')
  const [loadingReviews, setLoadingReviews] = useState(false)
  
  // Real-time Sentiment Analyzer widget
  const [customReviewText, setCustomReviewText] = useState('')
  const [analyzedResult, setAnalyzedResult] = useState(null)
  const [analyzingText, setAnalyzingText] = useState(false)

  // Load user session from local storage on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('user_session')
    if (savedUser) {
      setUser(JSON.parse(savedUser))
    }
  }, [])

  // Fetch stats when user logged in
  useEffect(() => {
    if (user) {
      fetchStats()
      fetchReviews()
    }
  }, [user])

  // Fetch reviews when filters or page changes
  useEffect(() => {
    if (user) {
      fetchReviews()
    }
  }, [explorerPage, filterCategory, filterSentiment])

  const fetchStats = async () => {
    setLoadingStats(true)
    try {
      const res = await fetch('/api/stats')
      if (res.ok) {
        const data = await res.json()
        setStats(data)
      }
    } catch (err) {
      console.error("Failed to fetch dashboard stats", err)
    } finally {
      setLoadingStats(false)
    }
  }

  const fetchReviews = async () => {
    setLoadingReviews(true)
    try {
      let url = `/api/reviews?page=${explorerPage}&page_size=10`
      if (filterCategory) url += `&category=${encodeURIComponent(filterCategory)}`
      if (filterSentiment) url += `&sentiment=${encodeURIComponent(filterSentiment)}`
      
      const res = await fetch(url)
      if (res.ok) {
        const data = await res.json()
        setReviewsData(data.reviews)
        setTotalReviews(data.total)
        setExplorerPages(data.total_pages)
      }
    } catch (err) {
      console.error("Failed to fetch reviews list", err)
    } finally {
      setLoadingReviews(false)
    }
  }

  const handleEmailRegister = async (e) => {
    e.preventDefault()
    if (registerPassword !== registerConfirmPassword) {
      alert("Passwords do not match.")
      return
    }
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: registerName,
          email: registerEmail,
          password: registerPassword
        })
      })
      const data = await res.json()
      if (res.ok) {
        alert("Registration successful! You can now log in.")
        setAuthTab('login')
        setLoginEmail(registerEmail)
        setRegisterName('')
        setRegisterEmail('')
        setRegisterPassword('')
        setRegisterConfirmPassword('')
      } else {
        alert(data.detail || "Registration failed.")
      }
    } catch (err) {
      alert("Error reaching server for registration.")
    }
  }

  const handleEmailLogin = async (e) => {
    e.preventDefault()
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: loginEmail,
          password: loginPassword
        })
      })
      if (res.ok) {
        const session = await res.json()
        localStorage.setItem('user_session', JSON.stringify(session.user))
        setUser(session.user)
      } else {
        const data = await res.json()
        alert(data.detail || "Invalid email or password.")
      }
    } catch (err) {
      alert("Error reaching server for login.")
    }
  }

  const handleGoogleLoginClick = () => {
    setShowConsentModal(true)
  }

  const handleGoogleConsentApprove = async () => {
    setShowConsentModal(false)
    const name = useGoogleCustom ? googleCustomName : selectedMember.name
    const email = useGoogleCustom ? googleCustomEmail : selectedMember.email
    const avatar = useGoogleCustom 
      ? `https://api.dicebear.com/7.x/bottts/svg?seed=${name.replace(/\s+/g, '')}` 
      : selectedMember.avatar
      
    if (!name.trim() || !email.trim()) {
      alert("Name and Email are required to proceed.")
      return
    }

    try {
      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: `mock_google_token_${Date.now()}`,
          email: email,
          name: name,
          picture: avatar
        })
      })
      if (res.ok) {
        const session = await res.json()
        localStorage.setItem('user_session', JSON.stringify(session.user))
        setUser(session.user)
      } else {
        alert("Google Authentication simulation failed.")
      }
    } catch (err) {
      console.error("Auth error", err)
      alert("Error reaching authentication server.")
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('user_session')
    setUser(null)
    setStats(null)
    setReviewsData([])
    setActiveTab('dashboard')
  }

  const handleChatSubmit = async (e, textOverride = '') => {
    if (e) e.preventDefault()
    const msgText = textOverride || chatInput
    if (!msgText.trim()) return

    const newMsgs = [...chatMessages, { sender: 'user', text: msgText }]
    setChatMessages(newMsgs)
    if (!textOverride) setChatInput('')
    setChatLoading(true)

    try {
      const res = await fetch('/api/chatbot/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msgText })
      })
      if (res.ok) {
        const data = await res.json()
        setChatMessages([...newMsgs, { sender: 'assistant', text: data.reply }])
      } else {
        setChatMessages([...newMsgs, { sender: 'assistant', text: "Error: Could not reach the chatbot service." }])
      }
    } catch (err) {
      setChatMessages([...newMsgs, { sender: 'assistant', text: "Network Error: Please check your connection." }])
    } finally {
      setChatLoading(false)
    }
  }

  const executeSQL = async () => {
    setSqlLoading(true)
    setSqlResult(null)
    setSqlError(null)
    try {
      const res = await fetch('/api/sql/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: sqlQuery })
      })
      const data = await res.json()
      if (res.ok) {
        setSqlResult(data)
      } else {
        setSqlError(data.detail || "Query failed.")
      }
    } catch (err) {
      setSqlError("Network failure executing SQL.")
    } finally {
      setSqlLoading(false)
    }
  }

  const analyzeCustomReview = async () => {
    if (!customReviewText.trim()) return
    setAnalyzingText(true)
    setAnalyzedResult(null)
    try {
      const res = await fetch('/api/ml/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: customReviewText })
      })
      if (res.ok) {
        const data = await res.json()
        setAnalyzedResult(data)
      } else {
        alert("Failed to analyze sentiment.")
      }
    } catch (err) {
      console.error(err)
    } finally {
      setAnalyzingText(false)
    }
  }

  const selectSampleSQL = (query) => {
    setSelectedSampleQuery(query)
    if (query) setSqlQuery(query)
  }

  // Pre-configured colors for Recharts cell mappings
  const COLORS = {
    Positive: '#10b981', // green-500
    Neutral: '#f59e0b',  // amber-500
    Negative: '#ef4444', // red-500
    PredPositive: '#3b82f6', // blue-500
    PredNeutral: '#8b5cf6',  // purple-500
    PredNegative: '#ec4899'  // pink-500
  }

  // Render Login page if not authenticated
  if (!user) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', padding: '1.5rem', position: 'relative' }}>
        {/* Glow circles */}
        <div style={{ position: 'absolute', top: '10%', left: '15%', width: '300px', height: '300px', borderRadius: '50%', background: 'var(--primary)', filter: 'blur(120px)', opacity: 0.15, pointerEvents: 'none' }}></div>
        <div style={{ position: 'absolute', bottom: '15%', right: '15%', width: '250px', height: '250px', borderRadius: '50%', background: 'var(--secondary)', filter: 'blur(100px)', opacity: 0.12, pointerEvents: 'none' }}></div>

        <div className="glass-card animate-slide-up" style={{ padding: '2.5rem 2rem', maxWidth: '480px', width: '100%', textAlign: 'center' }}>
          <div style={{ display: 'inline-flex', padding: '0.75rem', background: 'rgba(99, 102, 241, 0.1)', borderRadius: 'var(--radius-xl)', marginBottom: '1rem', color: 'var(--primary)' }}>
            <Zap size={36} />
          </div>
          
          <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem', fontFamily: 'var(--font-display)', fontWeight: 800 }}>
            E-commerce Review <span className="gradient-text">Analyzer</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
            Machine learning-based sentiment extraction, SQL data pipeline, and interactive metrics reporting.
          </p>

          {/* Form Tabs */}
          <div style={{ display: 'flex', background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-md)', padding: '0.25rem', marginBottom: '1.5rem', border: '1px solid var(--border-color)' }}>
            <button 
              className="btn" 
              onClick={() => setAuthTab('login')}
              style={{ 
                flex: 1, 
                padding: '0.5rem', 
                fontSize: '0.85rem', 
                background: authTab === 'login' ? 'var(--primary)' : 'transparent',
                color: '#fff',
                borderRadius: 'var(--radius-sm)'
              }}
            >
              Sign In
            </button>
            <button 
              className="btn" 
              onClick={() => setAuthTab('register')}
              style={{ 
                flex: 1, 
                padding: '0.5rem', 
                fontSize: '0.85rem', 
                background: authTab === 'register' ? 'var(--primary)' : 'transparent',
                color: '#fff',
                borderRadius: 'var(--radius-sm)'
              }}
            >
              Sign Up
            </button>
          </div>

          {authTab === 'login' ? (
            /* Email Login Form */
            <form onSubmit={handleEmailLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', textAlign: 'left' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.35rem', fontWeight: 600 }}>Email Address</label>
                <input 
                  type="email" 
                  className="custom-input"
                  placeholder="name@example.com"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  required
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.35rem', fontWeight: 600 }}>Password</label>
                <input 
                  type="password" 
                  className="custom-input"
                  placeholder="••••••••"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  required
                />
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%', height: '44px', marginTop: '0.5rem' }}>
                Sign In
              </button>

              <div style={{ display: 'flex', alignItems: 'center', margin: '0.75rem 0', gap: '0.5rem' }}>
                <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }}></div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>OR</span>
                <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }}></div>
              </div>
              
              {/* Google login trigger */}
              <button 
                type="button"
                className="btn btn-outline" 
                onClick={handleGoogleLoginClick}
                style={{ display: 'flex', width: '100%', gap: '0.75rem', justifyContent: 'center', height: '46px', fontSize: '0.9rem' }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
                </svg>
                Sign in with Google
              </button>
            </form>
          ) : (
            /* Email Signup Form */
            <form onSubmit={handleEmailRegister} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', textAlign: 'left' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.35rem', fontWeight: 600 }}>Full Name</label>
                <input 
                  type="text" 
                  className="custom-input"
                  placeholder="Karthik"
                  value={registerName}
                  onChange={(e) => setRegisterName(e.target.value)}
                  required
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.35rem', fontWeight: 600 }}>Email Address</label>
                <input 
                  type="email" 
                  className="custom-input"
                  placeholder="karthik@example.com"
                  value={registerEmail}
                  onChange={(e) => setRegisterEmail(e.target.value)}
                  required
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.35rem', fontWeight: 600 }}>Password</label>
                <input 
                  type="password" 
                  className="custom-input"
                  placeholder="••••••••"
                  value={registerPassword}
                  onChange={(e) => setRegisterPassword(e.target.value)}
                  required
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.35rem', fontWeight: 600 }}>Confirm Password</label>
                <input 
                  type="password" 
                  className="custom-input"
                  placeholder="••••••••"
                  value={registerConfirmPassword}
                  onChange={(e) => setRegisterConfirmPassword(e.target.value)}
                  required
                />
              </div>
              <button type="submit" className="btn btn-secondary" style={{ width: '100%', height: '44px', marginTop: '0.5rem' }}>
                Sign Up & Register
              </button>
            </form>
          )}

          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '1.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
            Designed for Google DeepMind Coding Showcase
          </div>
        </div>

        {/* Google Consent Mock Modal */}
        {showConsentModal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
            <div className="glass-card animate-slide-up" style={{ maxWidth: '440px', width: '100%', padding: '2rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
                </svg>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 600 }}>Google Account Authorization</h3>
              </div>
              
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
                **E-commerce Review Analyzer** wants permission to view your email address and basic profile info to sign you in.
              </p>

              {/* Toggle Custom vs Team Member */}
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', background: 'rgba(255,255,255,0.03)', padding: '0.2rem', borderRadius: 'var(--radius-sm)' }}>
                <button 
                  type="button"
                  className="btn" 
                  onClick={() => setUseGoogleCustom(true)}
                  style={{ flex: 1, padding: '0.35rem', fontSize: '0.75rem', background: useGoogleCustom ? 'rgba(99,102,241,0.2)' : 'transparent' }}
                >
                  Custom Account
                </button>
                <button 
                  type="button"
                  className="btn" 
                  onClick={() => setUseGoogleCustom(false)}
                  style={{ flex: 1, padding: '0.35rem', fontSize: '0.75rem', background: !useGoogleCustom ? 'rgba(99,102,241,0.2)' : 'transparent' }}
                >
                  Developer Team
                </button>
              </div>

              {useGoogleCustom ? (
                /* Custom Google Account details inputs (Simulating Karthik or anyone else) */
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem', textAlign: 'left' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Google Profile Name</label>
                    <input 
                      type="text" 
                      className="custom-input"
                      placeholder="Karthik"
                      value={googleCustomName}
                      onChange={(e) => setGoogleCustomName(e.target.value)}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Google Profile Email</label>
                    <input 
                      type="email" 
                      className="custom-input"
                      placeholder="karthik@gmail.com"
                      value={googleCustomEmail}
                      onChange={(e) => setGoogleCustomEmail(e.target.value)}
                    />
                  </div>
                </div>
              ) : (
                /* Select from existing team profiles */
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', marginBottom: '1.5rem' }}>
                  {teamMembers.map((member) => (
                    <div 
                      key={member.email}
                      onClick={() => setSelectedMember(member)}
                      style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '0.75rem', 
                        padding: '0.65rem', 
                        borderRadius: 'var(--radius-md)', 
                        border: `2px solid ${selectedMember.email === member.email ? 'var(--primary)' : 'var(--border-color)'}`,
                        background: selectedMember.email === member.email ? 'rgba(99, 102, 241, 0.1)' : 'rgba(255,255,255,0.02)',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <img src={member.avatar} alt="Avatar" style={{ width: '30px', height: '30px', borderRadius: '50%', background: '#1e293b' }} />
                      <div style={{ textAlign: 'left' }}>
                        <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{member.name}</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{member.email}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '1.25rem', background: 'rgba(255,255,255,0.03)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', textAlign: 'left' }}>
                <strong>Authorized scopes:</strong><br />
                - email: View your email address.<br />
                - profile: View your name and profile picture.
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button className="btn btn-outline" onClick={() => setShowConsentModal(false)}>Cancel</button>
                <button className="btn btn-primary" onClick={handleGoogleConsentApprove}>Allow Permission</button>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  // Data formatters for Recharts
  const getActualSentimentChartData = () => {
    if (!stats || !stats.sentiment_distribution) return []
    return Object.entries(stats.sentiment_distribution).map(([key, val]) => ({
      name: key,
      value: val
    }))
  }

  const getPredictedSentimentChartData = () => {
    if (!stats || !stats.predicted_sentiment_distribution) return []
    return Object.entries(stats.predicted_sentiment_distribution).map(([key, val]) => ({
      name: key,
      value: val
    }))
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      
      {/* Sidebar Navigation */}
      <aside className="glass-sidebar" style={{ width: '260px', display: 'flex', flexDirection: 'column', position: 'sticky', top: 0, height: '100vh' }}>
        <div style={{ padding: '1.75rem', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Zap className="gradient-text" style={{ color: 'var(--primary)' }} />
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.1rem', letterSpacing: '-0.02em' }}>Review Analyzer</span>
        </div>

        <nav style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
          <button 
            className={`btn ${activeTab === 'dashboard' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setActiveTab('dashboard')}
            style={{ width: '100%', justifyContent: 'flex-start', padding: '0.65rem 1rem' }}
          >
            <BarChart3 size={18} />
            Dashboard
          </button>
          
          <button 
            className={`btn ${activeTab === 'explorer' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setActiveTab('explorer')}
            style={{ width: '100%', justifyContent: 'flex-start', padding: '0.65rem 1rem' }}
          >
            <Search size={18} />
            Review Explorer
          </button>

          <button 
            className={`btn ${activeTab === 'sql' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setActiveTab('sql')}
            style={{ width: '100%', justifyContent: 'flex-start', padding: '0.65rem 1rem' }}
          >
            <Database size={18} />
            SQL Playground
          </button>
        </nav>

        {/* User Card at bottom */}
        <div style={{ padding: '1.25rem', borderTop: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <img src={user.picture} alt="profile" style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#1e293b' }} />
          <div style={{ overflow: 'hidden', flex: 1 }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.name}</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.email}</div>
          </div>
          <button onClick={handleLogout} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '0.25rem' }} title="Log out">
            <LogOut size={16} />
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        
        {/* Header */}
        <header className="glass-header" style={{ padding: '1.25rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 50 }}>
          <div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 700 }}>
              {activeTab === 'dashboard' && "Analytics Dashboard"}
              {activeTab === 'explorer' && "Review Catalog Explorer"}
              {activeTab === 'sql' && "SQL Execution Sandbox"}
            </h2>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Project Team: Chethan Kalyan, Manoj K S, Vishnu Reddy
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <a href={window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1' ? DEPLOYED_STREAMLIT_URL : "http://localhost:8501"} target="_blank" rel="noreferrer" className="btn btn-outline" style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}>
              <Database size={16} />
              Open Streamlit
            </a>
          </div>
        </header>

        {/* Tab Content */}
        <div style={{ padding: '2rem', flex: 1 }}>
          
          {/* TAB 1: DASHBOARD OVERVIEW */}
          {activeTab === 'dashboard' && (
            <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              
              {/* KPIs Row */}
              {loadingStats ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}><div className="spinner"></div></div>
              ) : stats ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
                  
                  <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ padding: '0.75rem', borderRadius: 'var(--radius-md)', background: 'rgba(99, 102, 241, 0.1)', color: 'var(--primary)' }}>
                      <MessageSquare size={24} />
                    </div>
                    <div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>Total Reviews</div>
                      <div style={{ fontSize: '1.75rem', fontWeight: 700 }}>{stats.total_reviews.toLocaleString()}</div>
                    </div>
                  </div>

                  <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ padding: '0.75rem', borderRadius: 'var(--radius-md)', background: 'rgba(168, 85, 247, 0.1)', color: 'var(--secondary)' }}>
                      <Award size={24} />
                    </div>
                    <div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>Catalog Products</div>
                      <div style={{ fontSize: '1.75rem', fontWeight: 700 }}>{stats.total_products}</div>
                    </div>
                  </div>

                  <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ padding: '0.75rem', borderRadius: 'var(--radius-md)', background: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)' }}>
                      <Users size={24} />
                    </div>
                    <div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>Customers</div>
                      <div style={{ fontSize: '1.75rem', fontWeight: 700 }}>{stats.total_customers}</div>
                    </div>
                  </div>

                  <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ padding: '0.75rem', borderRadius: 'var(--radius-md)', background: 'rgba(245, 158, 11, 0.1)', color: 'var(--warning)' }}>
                      <TrendingUp size={24} />
                    </div>
                    <div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>Model Match Rate</div>
                      <div style={{ fontSize: '1.75rem', fontWeight: 700 }}>{stats.model_accuracy}%</div>
                    </div>
                  </div>

                </div>
              ) : null}

              {/* Sentiment Pie Charts Comparison */}
              {stats && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem' }}>
                  
                  <div className="glass-card" style={{ padding: '1.5rem' }}>
                    <h3 style={{ fontSize: '1.1rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Info size={16} /> Actual Sentiment (From Ratings)
                    </h3>
                    <div style={{ height: '260px', width: '100%' }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={getActualSentimentChartData()}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={85}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            <Cell key="cell-0" fill={COLORS.Positive} />
                            <Cell key="cell-1" fill={COLORS.Neutral} />
                            <Cell key="cell-2" fill={COLORS.Negative} />
                          </Pie>
                          <Tooltip formatter={(value) => `${value} reviews`} />
                          <Legend verticalAlign="bottom" height={36} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="glass-card" style={{ padding: '1.5rem' }}>
                    <h3 style={{ fontSize: '1.1rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Zap size={16} /> ML Predicted Sentiment (From Text)
                    </h3>
                    <div style={{ height: '260px', width: '100%' }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={getPredictedSentimentChartData()}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={85}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            <Cell key="cell-0" fill={COLORS.PredPositive} />
                            <Cell key="cell-1" fill={COLORS.PredNeutral} />
                            <Cell key="cell-2" fill={COLORS.PredNegative} />
                          </Pie>
                          <Tooltip formatter={(value) => `${value} reviews`} />
                          <Legend verticalAlign="bottom" height={36} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
                {/* Category stats bar chart */}
                {stats && (
                  <div className="glass-card" style={{ padding: '1.5rem' }}>
                    <h3 style={{ fontSize: '1.1rem', marginBottom: '1.5rem' }}>Average Rating by Product Category</h3>
                    <div style={{ height: '300px', width: '100%' }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={stats.category_stats}>
                          <XAxis dataKey="category" stroke="#9ca3af" />
                          <YAxis domain={[0, 5]} stroke="#9ca3af" />
                          <Tooltip formatter={(value) => [`${value} / 5.0`, 'Average Rating']} />
                          <Bar dataKey="avg_rating" fill="#6366f1" radius={[4, 4, 0, 0]}>
                            {stats.category_stats.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#6366f1' : '#a855f7'} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}

                {/* Real-time Review Tester */}
                <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <h3 style={{ fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Zap size={18} style={{ color: 'var(--primary)' }} /> Live ML Sentiment Tester
                  </h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    Type a custom review text below to run real-time sentiment predictions through the TF-IDF and Logistic Regression backend.
                  </p>
                  
                  <textarea 
                    className="custom-textarea"
                    placeholder="Enter review feedback... e.g. This keyboard is excellent with typing but shipping was slow."
                    value={customReviewText}
                    onChange={(e) => setCustomReviewText(e.target.value)}
                    style={{ flex: 1, minHeight: '80px', resize: 'none' }}
                  />
                  
                  <button 
                    className="btn btn-primary"
                    disabled={analyzingText || !customReviewText.trim()}
                    onClick={analyzeCustomReview}
                    style={{ height: '40px', padding: '0' }}
                  >
                    {analyzingText ? "Analyzing..." : "Classify Sentiment"}
                  </button>

                  {analyzedResult && (
                    <div style={{ marginTop: '0.5rem', background: 'rgba(255,255,255,0.03)', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                      <div style={{ fontSize: '0.85rem', display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                        <span>Prediction:</span>
                        <strong style={{ 
                          color: analyzedResult.predicted_sentiment === 'Positive' ? 'var(--success)' : 
                                 analyzedResult.predicted_sentiment === 'Neutral' ? 'var(--warning)' : 'var(--error)' 
                        }}>
                          {analyzedResult.predicted_sentiment}
                        </strong>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.75rem' }}>
                        {Object.entries(analyzedResult.probabilities).map(([sent, prob]) => (
                          <div key={sent} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ color: 'var(--text-secondary)' }}>{sent}:</span>
                            <span>{(prob * 100).toFixed(1)}%</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Top Selling Products */}
              {stats && (
                <div className="glass-card" style={{ padding: '1.5rem', overflowX: 'auto' }}>
                  <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>Top 5 Highest Labeled Products</h3>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                        <th style={{ padding: '0.75rem 0.5rem' }}>Product Name</th>
                        <th style={{ padding: '0.75rem 0.5rem' }}>Category</th>
                        <th style={{ padding: '0.75rem 0.5rem' }}>Avg Rating</th>
                        <th style={{ padding: '0.75rem 0.5rem' }}>Review Count</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.top_products.map((p, i) => (
                        <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                          <td style={{ padding: '0.75rem 0.5rem', fontWeight: 500 }}>{p.product_name}</td>
                          <td style={{ padding: '0.75rem 0.5rem', color: 'var(--text-secondary)' }}>{p.category}</td>
                          <td style={{ padding: '0.75rem 0.5rem', color: 'var(--warning)', fontWeight: 600 }}>★ {p.avg_rating}</td>
                          <td style={{ padding: '0.75rem 0.5rem' }}>{p.count} reviews</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: REVIEW EXPLORER */}
          {activeTab === 'explorer' && (
            <div className="glass-card animate-fade-in" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              
              {/* Filter controls */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', fontWeight: 600 }}>Product Category</label>
                  <select 
                    className="custom-select"
                    value={filterCategory}
                    onChange={(e) => { setFilterCategory(e.target.value); setExplorerPage(1); }}
                  >
                    <option value="">All Categories</option>
                    <option value="Electronics">Electronics</option>
                    <option value="Apparel">Apparel</option>
                    <option value="Home & Kitchen">Home & Kitchen</option>
                    <option value="Books">Books</option>
                    <option value="Beauty">Beauty</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', fontWeight: 600 }}>Labeled Sentiment</label>
                  <select 
                    className="custom-select"
                    value={filterSentiment}
                    onChange={(e) => { setFilterSentiment(e.target.value); setExplorerPage(1); }}
                  >
                    <option value="">All Sentiments</option>
                    <option value="Positive">Positive (★ 4-5)</option>
                    <option value="Neutral">Neutral (★ 3)</option>
                    <option value="Negative">Negative (★ 1-2)</option>
                  </select>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'flex-end' }}>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    Showing **{reviewsData.length}** of **{totalReviews}** reviews
                  </div>
                </div>
              </div>

              {/* Reviews Table */}
              {loadingReviews ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}><div className="spinner"></div></div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                        <th style={{ padding: '0.75rem 0.5rem' }}>Customer</th>
                        <th style={{ padding: '0.75rem 0.5rem' }}>Product</th>
                        <th style={{ padding: '0.75rem 0.5rem' }}>Rating</th>
                        <th style={{ padding: '0.75rem 0.5rem', width: '40%' }}>Review Content</th>
                        <th style={{ padding: '0.75rem 0.5rem' }}>Actual Sentiment</th>
                        <th style={{ padding: '0.75rem 0.5rem' }}>Predicted</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reviewsData.map((rev) => (
                        <tr key={rev.review_id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                          <td style={{ padding: '0.75rem 0.5rem', whiteSpace: 'nowrap' }}>{rev.customer_name}</td>
                          <td style={{ padding: '0.75rem 0.5rem' }}>
                            <div style={{ fontWeight: 500 }}>{rev.product_name}</div>
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', background: 'rgba(255,255,255,0.05)', padding: '0.1rem 0.3rem', borderRadius: 'var(--radius-sm)' }}>{rev.category}</span>
                          </td>
                          <td style={{ padding: '0.75rem 0.5rem', color: 'var(--warning)', fontWeight: 600 }}>★ {rev.rating}</td>
                          <td style={{ padding: '0.75rem 0.5rem', color: 'var(--text-primary)', fontSize: '0.85rem' }}>"{rev.review_text}"</td>
                          <td style={{ padding: '0.75rem 0.5rem' }}>
                            <span style={{ 
                              padding: '0.2rem 0.5rem', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600,
                              background: rev.sentiment === 'Positive' ? 'rgba(16, 185, 129, 0.15)' : 
                                         rev.sentiment === 'Neutral' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                              color: rev.sentiment === 'Positive' ? 'var(--success)' : 
                                     rev.sentiment === 'Neutral' ? 'var(--warning)' : 'var(--error)'
                            }}>
                              {rev.sentiment}
                            </span>
                          </td>
                          <td style={{ padding: '0.75rem 0.5rem' }}>
                            <span style={{ 
                              padding: '0.2rem 0.5rem', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600,
                              background: rev.predicted_sentiment === 'Positive' ? 'rgba(59, 130, 246, 0.15)' : 
                                         rev.predicted_sentiment === 'Neutral' ? 'rgba(139, 92, 246, 0.15)' : 'rgba(236, 72, 153, 0.15)',
                              color: rev.predicted_sentiment === 'Positive' ? '#60a5fa' : 
                                     rev.predicted_sentiment === 'Neutral' ? '#a78bfa' : '#f472b6'
                            }}>
                              {rev.predicted_sentiment || 'None'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Pagination */}
              {explorerPages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '1rem' }}>
                  <button 
                    className="btn btn-outline" 
                    disabled={explorerPage === 1}
                    onClick={() => setExplorerPage(explorerPage - 1)}
                    style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                  >
                    Previous
                  </button>
                  <span style={{ display: 'flex', alignItems: 'center', fontSize: '0.9rem', padding: '0 0.5rem' }}>
                    Page {explorerPage} of {explorerPages}
                  </span>
                  <button 
                    className="btn btn-outline" 
                    disabled={explorerPage === explorerPages}
                    onClick={() => setExplorerPage(explorerPage + 1)}
                    style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                  >
                    Next
                  </button>
                </div>
              )}

            </div>
          )}

          {/* TAB 3: SQL PLAYGROUND */}
          {activeTab === 'sql' && (
            <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1fr', gap: '1.5rem' }}>
                
                {/* Query Editor card */}
                <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Database size={18} style={{ color: 'var(--primary)' }} /> Interactive SQL Terminal
                    </h3>
                    
                    <select 
                      className="custom-select"
                      value={selectedSampleQuery}
                      onChange={(e) => selectSampleSQL(e.target.value)}
                      style={{ width: 'auto', padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
                    >
                      <option value="">-- Load Sample Query --</option>
                      <option value="SELECT * FROM products LIMIT 5;">Select Products</option>
                      <option value="SELECT category, COUNT(*) as total_products, AVG(price) as average_price FROM products GROUP BY category;">Average Product Price by Category</option>
                      <option value="SELECT rating, sentiment, COUNT(*) as count FROM reviews GROUP BY rating, sentiment;">Reviews Sentiment Grouping</option>
                      <option value="SELECT c.customer_name, COUNT(r.review_id) as review_count FROM reviews r JOIN customers c ON r.customer_id = c.customer_id GROUP BY c.customer_id ORDER BY review_count DESC LIMIT 5;">Top Reviewing Customers</option>
                    </select>
                  </div>

                  <textarea 
                    className="custom-textarea"
                    value={sqlQuery}
                    onChange={(e) => setSqlQuery(e.target.value)}
                    style={{ 
                      fontFamily: 'monospace', 
                      minHeight: '180px', 
                      background: '#0d1117', 
                      color: '#c9d1d9', 
                      fontSize: '0.95rem',
                      lineHeight: '1.4'
                    }}
                  />

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      Note: Only read-only <strong>SELECT</strong> queries are permitted.
                    </div>
                    
                    <button 
                      className="btn btn-primary"
                      disabled={sqlLoading || !sqlQuery.trim()}
                      onClick={executeSQL}
                    >
                      <Play size={16} />
                      {sqlLoading ? "Running..." : "Execute Query"}
                    </button>
                  </div>
                </div>

                {/* Schema display card */}
                <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <h3 style={{ fontSize: '1.1rem' }}>Database Schema</h3>
                  <div style={{ overflowY: 'auto', maxHeight: '310px', fontSize: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    
                    <div style={{ background: 'rgba(255,255,255,0.02)', padding: '0.65rem', borderRadius: 'var(--radius-sm)', borderLeft: '3px solid var(--primary)' }}>
                      <strong>customers</strong>
                      <div style={{ color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                        customer_id (PK), customer_name, email
                      </div>
                    </div>

                    <div style={{ background: 'rgba(255,255,255,0.02)', padding: '0.65rem', borderRadius: 'var(--radius-sm)', borderLeft: '3px solid var(--secondary)' }}>
                      <strong>products</strong>
                      <div style={{ color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                        product_id (PK), product_name, category, price
                      </div>
                    </div>

                    <div style={{ background: 'rgba(255,255,255,0.02)', padding: '0.65rem', borderRadius: 'var(--radius-sm)', borderLeft: '3px solid var(--success)' }}>
                      <strong>orders</strong>
                      <div style={{ color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                        order_id (PK), customer_id (FK), product_id (FK), price, order_date
                      </div>
                    </div>

                    <div style={{ background: 'rgba(255,255,255,0.02)', padding: '0.65rem', borderRadius: 'var(--radius-sm)', borderLeft: '3px solid var(--warning)' }}>
                      <strong>reviews</strong>
                      <div style={{ color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                        review_id (PK), order_id (FK), customer_id (FK), product_id (FK), rating, review_text, cleaned_review_text, sentiment, predicted_sentiment
                      </div>
                    </div>

                  </div>
                </div>

              </div>

              {/* SQL Execution Results */}
              <div className="glass-card" style={{ padding: '1.5rem', minHeight: '180px' }}>
                <h4 style={{ fontSize: '1rem', marginBottom: '1rem', color: 'var(--text-secondary)' }}>Query Results</h4>
                
                {sqlResult ? (
                  <div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--success)', marginBottom: '0.75rem', fontWeight: 600 }}>
                      ✓ Success: Query executed successfully returned {sqlResult.row_count} rows.
                    </div>
                    {sqlResult.row_count > 0 ? (
                      <div style={{ overflowX: 'auto', maxHeight: '400px' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                          <thead>
                            <tr style={{ borderBottom: '2px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                              {sqlResult.columns.map((col, idx) => (
                                <th key={idx} style={{ padding: '0.5rem' }}>{col}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {sqlResult.data.map((row, rIdx) => (
                              <tr key={rIdx} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                                {sqlResult.columns.map((col, cIdx) => (
                                  <td key={cIdx} style={{ padding: '0.5rem', color: 'var(--text-primary)' }}>
                                    {row[col] !== null ? String(row[col]) : 'NULL'}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Query returned no records.</div>
                    )}
                  </div>
                ) : sqlError ? (
                  <div style={{ borderLeft: '4px solid var(--error)', background: 'rgba(239, 68, 68, 0.05)', padding: '1rem', borderRadius: 'var(--radius-sm)', color: 'var(--error)' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.25rem' }}>
                      <ShieldAlert size={16} />
                      SQL Syntax/Execution Error
                    </div>
                    <code style={{ fontSize: '0.8rem' }}>{sqlError}</code>
                  </div>
                ) : (
                  <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontStyle: 'italic', padding: '2rem 0' }}>
                    Run a query to display results here.
                  </div>
                )}
              </div>

            </div>
          )}

        </div>
      </main>

      {/* FLOATING RESPONSIVE CHATBOT */}
      <div style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 1000 }}>
        
        {/* Toggle Button */}
        {!chatOpen && (
          <button 
            onClick={() => setChatOpen(true)}
            className="btn btn-primary"
            style={{ 
              borderRadius: '50%', 
              width: '60px', 
              height: '60px', 
              padding: '0', 
              boxShadow: '0 8px 32px 0 rgba(99, 102, 241, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <MessageSquare size={24} />
          </button>
        )}

        {/* Chat Panel Window */}
        {chatOpen && (
          <div 
            className="glass-card animate-slide-up"
            style={{ 
              width: '380px', 
              height: '500px', 
              display: 'flex', 
              flexDirection: 'column', 
              overflow: 'hidden', 
              boxShadow: '0 12px 48px 0 rgba(0, 0, 0, 0.6)' 
            }}
          >
            {/* Chat Header */}
            <div style={{ 
              padding: '1rem 1.25rem', 
              borderBottom: '1px solid var(--border-color)', 
              background: 'rgba(99, 102, 241, 0.15)', 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center' 
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Zap size={16} style={{ color: 'var(--primary)' }} />
                <span style={{ fontWeight: 600, fontSize: '0.95rem', fontFamily: 'var(--font-display)' }}>System Assistant</span>
              </div>
              <button 
                onClick={() => setChatOpen(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '0.25rem' }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Messages Area */}
            <div style={{ flex: 1, padding: '1rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {chatMessages.map((msg, i) => (
                <div 
                  key={i} 
                  className={`chatbot-bubble ${msg.sender === 'user' ? 'chatbot-bubble-user' : 'chatbot-bubble-assistant'}`}
                  style={{ whiteSpace: 'pre-wrap' }}
                >
                  {msg.text}
                </div>
              ))}
              {chatLoading && (
                <div className="chatbot-bubble chatbot-bubble-assistant" style={{ padding: '0.5rem 1rem' }}>
                  <div style={{ display: 'flex', gap: '0.25rem', padding: '4px 0' }}>
                    <div style={{ width: '6px', height: '6px', background: 'var(--text-secondary)', borderRadius: '50%', animation: 'pulse-slow 1s infinite' }}></div>
                    <div style={{ width: '6px', height: '6px', background: 'var(--text-secondary)', borderRadius: '50%', animation: 'pulse-slow 1s infinite 0.2s' }}></div>
                    <div style={{ width: '6px', height: '6px', background: 'var(--text-secondary)', borderRadius: '50%', animation: 'pulse-slow 1s infinite 0.4s' }}></div>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Suggestion Chips */}
            <div style={{ padding: '0.5rem 1rem', display: 'flex', gap: '0.5rem', overflowX: 'auto', borderTop: '1px solid rgba(255, 255, 255, 0.04)', background: 'rgba(255, 255, 255, 0.01)' }}>
              <button 
                onClick={() => handleChatSubmit(null, 'Explain workflow')} 
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '0.25rem 0.5rem', fontSize: '0.75rem', color: 'var(--text-secondary)', cursor: 'pointer', whiteSpace: 'nowrap' }}
              >
                Explain workflow
              </button>
              <button 
                onClick={() => handleChatSubmit(null, 'How many reviews do we have?')}
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '0.25rem 0.5rem', fontSize: '0.75rem', color: 'var(--text-secondary)', cursor: 'pointer', whiteSpace: 'nowrap' }}
              >
                Review counts
              </button>
              <button 
                onClick={() => handleChatSubmit(null, 'What is the average rating of books?')}
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '0.25rem 0.5rem', fontSize: '0.75rem', color: 'var(--text-secondary)', cursor: 'pointer', whiteSpace: 'nowrap' }}
              >
                Books Average
              </button>
            </div>

            {/* Message Input bar */}
            <form 
              onSubmit={handleChatSubmit}
              style={{ 
                padding: '0.75rem 1rem', 
                borderTop: '1px solid var(--border-color)', 
                display: 'flex', 
                gap: '0.5rem',
                alignItems: 'center'
              }}
            >
              <input 
                type="text" 
                className="custom-input"
                placeholder="Ask a question..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                style={{ height: '36px', padding: '0 0.75rem', fontSize: '0.85rem' }}
              />
              <button 
                type="submit"
                disabled={chatLoading || !chatInput.trim()}
                className="btn btn-primary"
                style={{ width: '36px', height: '36px', padding: '0', flexShrink: 0, borderRadius: 'var(--radius-md)' }}
              >
                <Send size={16} />
              </button>
            </form>

          </div>
        )}

      </div>

    </div>
  )
}

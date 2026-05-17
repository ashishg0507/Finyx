import './HomePage.css'
import { Link } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import {
  FiTrendingUp,
  FiPieChart,
  FiCreditCard,
  FiShield,
  FiZap,
  FiBarChart2,
  FiDollarSign,
  FiTarget,
  FiArrowRight,
} from 'react-icons/fi'

const HomePage = () => {
  const { user, signout } = useAuth()
  const features = [
    {
      icon: <FiPieChart size={28} />,
      title: 'Smart Budgeting',
      description: 'Visualize your spending with intuitive charts and categorize expenses automatically.',
      color: 'var(--accent-cyan)',
    },
    {
      icon: <FiCreditCard size={28} />,
      title: 'Track Every Transaction',
      description: 'Connect accounts or log manually. Never lose sight of where your money goes.',
      color: 'var(--accent-indigo)',
    },
    {
      icon: <FiTarget size={28} />,
      title: 'Goal Setting',
      description: 'Set savings goals, track progress, and celebrate milestones along the way.',
      color: 'var(--accent-emerald)',
    },
    {
      icon: <FiShield size={28} />,
      title: 'Bank-Grade Security',
      description: 'Your data is encrypted and secure. We never store your banking credentials.',
      color: 'var(--accent-amber)',
    },
  ]

  const stats = [
    { value: '50K+', label: 'Active Users', icon: <FiZap size={20} /> },
    { value: '₹18Cr+', label: 'Tracked Monthly', icon: <FiDollarSign size={20} /> },
    { value: '98%', label: 'Satisfaction', icon: <FiTrendingUp size={20} /> },
  ]

  return (
    <div className="homepage">
      {/* Decorative background elements */}
      <div className="bg-grid" />
      <div className="bg-blur-orb orb-1" />
      <div className="bg-blur-orb orb-2" />
      <div className="bg-blur-orb orb-3" />

      {/* Navigation */}
      <nav className="nav">
        <div className="nav-brand">
          <div className="logo-icon">
            <FiTrendingUp size={24} />
          </div>
          <span className="logo-text">Finyx</span>
        </div>
        <div className="nav-links">
          <Link to="/transactions">Transactions</Link>
          <Link to="/budget">Budget</Link>
          <Link to="/goals">Goals</Link>
          <Link to="/insights">Insights</Link>
          <Link to="/pricing">Pricing</Link>
          <a href="#features">Features</a>
          <a href="#how-it-works">How it Works</a>
          {user ? (
            <>
              <span className="nav-user-email">{user.email}</span>
              <Link to="/profile" className="btn btn-ghost">Profile</Link>
              <button
                type="button"
                className="btn btn-outline"
                onClick={signout}
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/signin" className="btn btn-ghost">Sign In</Link>
              <Link to="/signup" className="btn btn-primary">Get Started</Link>
            </>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <header className="hero">
        <div className="hero-badge">
          <FiZap size={14} />
          <span>Now with AI-powered insights</span>
        </div>
        <h1 className="hero-title">
          Take control of your
          <span className="gradient-text"> financial future</span>
        </h1>
        <p className="hero-subtitle">
          The smart way to track spending, build budgets, and reach your money goals.
          Beautiful dashboards, zero hassle.
        </p>
        <div className="hero-cta">
          <Link to="/transactions" className="btn btn-primary btn-lg">
            Start Free Trial
            <FiArrowRight size={18} />
          </Link>
          <button className="btn btn-outline btn-lg">Watch Demo</button>
        </div>

        {/* Hero Illustration */}
        <div className="hero-illustration">
          <img src="/finance-illustration.svg" alt="Finance tracking" />
        </div>

        {/* Hero Dashboard Preview */}
        <div className="hero-preview">
          <div className="preview-card">
            <div className="preview-header">
              <span>Your Overview</span>
              <div className="preview-dots">
                <span />
                <span />
                <span />
              </div>
            </div>
            <div className="preview-chart">
              <div className="chart-bars">
                {[65, 85, 45, 90, 70, 55, 80].map((h, i) => (
                  <div key={i} className="chart-bar" style={{ height: `${h}%` }} />
                ))}
              </div>
            </div>
            <div className="preview-stats">
              <div className="preview-stat">
                <FiTrendingUp size={16} className="stat-icon up" />
                <span>Income</span>
                <strong>₹4,25,000</strong>
              </div>
              <div className="preview-stat">
                <FiBarChart2 size={16} className="stat-icon" />
                <span>Expenses</span>
                <strong>$2,180</strong>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Stats Bar */}
      <section className="stats-bar">
        {stats.map((stat, i) => (
          <div key={i} className="stat-item">
            <div className="stat-icon-wrap">{stat.icon}</div>
            <div className="stat-content">
              <strong>{stat.value}</strong>
              <span>{stat.label}</span>
            </div>
          </div>
        ))}
      </section>

      {/* Features Section */}
      <section id="features" className="features">
        <h2 className="section-title">Everything you need to thrive</h2>
        <p className="section-subtitle">
          Powerful tools designed for real people who want to make smarter money decisions.
        </p>
        <div className="features-grid">
          {features.map((feature, i) => (
            <div key={i} className="feature-card">
              <div className="feature-icon" style={{ color: feature.color }}>
                {feature.icon}
              </div>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Visual Section - App Mockup */}
      <section id="how-it-works" className="app-showcase">
        <div className="showcase-content">
          <h2>Your finances, at a glance</h2>
          <p>
            Clean, intuitive dashboards show exactly where you stand. No spreadsheets,
            no confusion—just clarity.
          </p>
          <ul className="showcase-list">
            <li>
              <FiTrendingUp size={20} />
              Real-time balance tracking
            </li>
            <li>
              <FiPieChart size={20} />
              Spending breakdown by category
            </li>
            <li>
              <FiTarget size={20} />
              Goal progress visualization
            </li>
          </ul>
        </div>
        <div className="showcase-visual">
          <div className="phone-mockup">
            <div className="phone-notch" />
            <div className="phone-screen">
              <div className="mock-balance">
                <span>Total Balance</span>
                <strong>₹12,45,000.00</strong>
              </div>
              <div className="mock-categories">
                {['Food', 'Transport', 'Shopping', 'Bills'].map((cat, i) => (
                  <div key={i} className="mock-cat">
                    <div className="mock-cat-bar" style={{ width: `${60 + i * 10}%` }} />
                    <span>{cat}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta">
        <div className="cta-content">
          <h2>Ready to transform your finances?</h2>
          <p>Join thousands who've taken control. Free for 14 days, no card required.</p>
          <Link to="/transactions" className="btn btn-primary btn-lg">
            Get Started for Free
            <FiArrowRight size={18} />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-brand">
          <div className="logo-icon small">
            <FiTrendingUp size={20} />
          </div>
          <span>Finyx</span>
        </div>
        <div className="footer-links">
          <a href="#">Privacy</a>
          <a href="#">Terms</a>
          <a href="#">Contact</a>
        </div>
        <p className="footer-copy">© 2025 Finyx. All rights reserved.</p>
      </footer>
    </div>
  )
}

export default HomePage

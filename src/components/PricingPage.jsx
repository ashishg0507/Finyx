import { Link } from 'react-router-dom'
import { FiTrendingUp, FiCheck, FiArrowLeft, FiStar, FiShield } from 'react-icons/fi'
import './PricingPage.css'

const tiers = [
  {
    name: 'Starter',
    price: 'Free',
    description: 'Perfect to get started with tracking your money.',
    highlight: false,
    features: [
      'Unlimited manual transactions',
      'Basic budgets & goals',
      'Single device access',
      'Email summaries',
    ],
  },
  {
    name: 'Pro',
    price: '₹599 / mo',
    description: 'For power users who want deep insights and automation.',
    highlight: true,
    badge: 'Most popular',
    features: [
      'Everything in Starter',
      'Smart insights & projections',
      'Unlimited goals & categories',
      'Priority support',
    ],
  },
  {
    name: 'Elite',
    price: '₹999 / mo',
    description: 'For serious planners managing complex finances.',
    highlight: false,
    features: [
      'Everything in Pro',
      'Advanced reporting exports',
      'Dedicated onboarding',
      'Upcoming features first',
    ],
  },
]

const PricingPage = () => {
  return (
    <div className="pricing-page">
      <nav className="pricing-nav">
        <div className="nav-left">
          <Link to="/" className="back-link">
            <FiArrowLeft size={18} />
            Home
          </Link>
        </div>
        <div className="nav-brand">
          <div className="logo-icon">
            <FiTrendingUp size={22} />
          </div>
          <span>Finyx</span>
        </div>
      </nav>

      <main className="pricing-main">
        <header className="pricing-hero">
          <span className="pill">
            <FiStar size={14} />
            Simple, transparent pricing
          </span>
          <h1>Choose the plan that fits your money story.</h1>
          <p>
            Start for free, upgrade when you’re ready. No hidden fees, cancel any time.
          </p>
        </header>

        <section className="pricing-grid">
          {tiers.map((tier) => (
            <article
              key={tier.name}
              className={`pricing-card ${tier.highlight ? 'highlight' : ''}`}
            >
              {tier.badge && <div className="badge">{tier.badge}</div>}
              <h2>{tier.name}</h2>
              <p className="price">{tier.price}</p>
              <p className="subtitle">{tier.description}</p>
              <ul className="feature-list">
                {tier.features.map((f) => (
                  <li key={f}>
                    <FiCheck size={16} />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <Link
                to="/signup"
                className={`pricing-btn ${tier.highlight ? 'primary' : 'ghost'}`}
              >
                Get started
              </Link>
            </article>
          ))}
        </section>

        <section className="pricing-faq">
          <div className="faq-card">
            <div className="faq-icon">
              <FiShield size={20} />
            </div>
            <h3>Do I need a card for the free plan?</h3>
            <p>No. You can sign up, explore Finyx, and upgrade only if it’s right for you.</p>
          </div>
          <div className="faq-card">
            <div className="faq-icon">
              <FiShield size={20} />
            </div>
            <h3>Can I cancel any time?</h3>
            <p>Yes. You’re always in control, and your data stays available for export.</p>
          </div>
        </section>
      </main>
    </div>
  )
}

export default PricingPage


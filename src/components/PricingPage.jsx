import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { FiTrendingUp, FiCheck, FiArrowLeft, FiStar, FiShield } from 'react-icons/fi'
import { useAuth } from '../auth/AuthContext'
import { apiFetch } from '../api/client'
import './PricingPage.css'

const tiers = [
  {
    planId: 'starter',
    name: 'Starter',
    price: 'Free',
    description: 'Perfect to get started with tracking your money.',
    highlight: false,
    isFree: true,
    features: [
      'Unlimited manual transactions',
      'Basic budgets & goals',
      'Single device access',
      'Email summaries',
    ],
  },
  {
    planId: 'pro',
    name: 'Pro',
    price: '₹599 / mo',
    description: 'For power users who want deep insights and automation.',
    highlight: true,
    badge: 'Most popular',
    amountINRPaise: 59900,
    features: [
      'Everything in Starter',
      'Smart insights & projections',
      'Unlimited goals & categories',
      'Priority support',
    ],
  },
  {
    planId: 'elite',
    name: 'Elite',
    price: '₹999 / mo',
    description: 'For serious planners managing complex finances.',
    highlight: false,
    amountINRPaise: 99900,
    features: [
      'Everything in Pro',
      'Advanced reporting exports',
      'Dedicated onboarding',
      'Upcoming features first',
    ],
  },
]

const PricingPage = () => {
  const nav = useNavigate()
  const loc = useLocation()
  const { user, token, subscription, refreshMe } = useAuth()

  const [payingPlanId, setPayingPlanId] = useState(null)
  const [error, setError] = useState('')
  const didAutoCheckout = useRef(false)

  const startCheckout = async (planId) => {
    const tier = tiers.find((t) => t.planId === planId)
    if (!tier || tier.isFree) return
    if (!token) throw new Error('Please sign in to continue')

    setError('')
    setPayingPlanId(planId)

    const loadScript = () =>
      new Promise((resolve, reject) => {
        if (window.Razorpay) return resolve(true)
        const script = document.createElement('script')
        script.src = 'https://checkout.razorpay.com/v1/checkout.js'
        script.onload = () => resolve(true)
        script.onerror = () => reject(new Error('Failed to load Razorpay checkout.js'))
        document.body.appendChild(script)
      })

    try {
      const order = await apiFetch('/api/payments/create-order', {
        method: 'POST',
        body: JSON.stringify({ planId }),
      })

      await loadScript()
      if (!window.Razorpay) throw new Error('Razorpay SDK not available')

      const options = {
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        name: 'Finyx',
        description: `${tier.name} subscription`,
        order_id: order.orderId,
        handler: async function (response) {
          try {
            const verification = await apiFetch('/api/payments/verify', {
              method: 'POST',
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }),
            })

            if (!verification?.ok) throw new Error('Payment verification failed')
            await refreshMe()
            nav('/transactions', { replace: true })
          } catch (e) {
            setError(e.message || 'Payment verification failed')
          } finally {
            setPayingPlanId(null)
          }
        },
        prefill: {
          email: user?.email || '',
        },
        modal: {
          ondismiss: () => setPayingPlanId(null),
        },
        theme: { color: '#00c2ff' },
      }

      // eslint-disable-next-line no-new
      new window.Razorpay(options).open()
    } catch (e) {
      setError(e.message || 'Checkout failed')
      setPayingPlanId(null)
    }
  }

  useEffect(() => {
    const params = new URLSearchParams(loc.search)
    const requestedPlanId = params.get('planId')

    if (!token || !requestedPlanId) return
    if (didAutoCheckout.current) return

    const tier = tiers.find((t) => t.planId === requestedPlanId)
    if (!tier || tier.isFree) return

    didAutoCheckout.current = true
    void (async () => {
      try {
        await startCheckout(requestedPlanId)
      } finally {
        nav('/pricing', { replace: true })
      }
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, loc.search, nav])

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
              {tier.isFree ? (
                <Link
                  to="/signup"
                  className={`pricing-btn ${tier.highlight ? 'primary' : 'ghost'}`}
                >
                  Get started
                </Link>
              ) : subscription?.planId === tier.planId ? (
                <button
                  type="button"
                  className={`pricing-btn ${tier.highlight ? 'primary' : 'ghost'}`}
                  disabled
                >
                  Current plan
                </button>
              ) : token ? (
                <button
                  type="button"
                  className={`pricing-btn ${tier.highlight ? 'primary' : 'ghost'}`}
                  disabled={payingPlanId === tier.planId}
                  onClick={() => startCheckout(tier.planId)}
                >
                  {payingPlanId === tier.planId ? 'Processing…' : 'Buy subscription'}
                </button>
              ) : (
                <Link
                  to="/signin"
                  state={{ from: `/pricing?planId=${tier.planId}` }}
                  className={`pricing-btn ${tier.highlight ? 'primary' : 'ghost'}`}
                >
                  Sign in to buy
                </Link>
              )}
            </article>
          ))}
        </section>

        {error && (
          <p style={{ color: 'var(--accent-amber)', margin: '0 0 1rem 0' }}>
            {error}
          </p>
        )}

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


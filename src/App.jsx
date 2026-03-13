import { Routes, Route } from 'react-router-dom'
import HomePage from './components/HomePage'
import TransactionsPage from './components/TransactionsPage'
import BudgetPage from './components/BudgetPage'
import GoalsPage from './components/GoalsPage'
import InsightsPage from './components/InsightsPage'
import SignUpPage from './components/SignUpPage'
import SignInPage from './components/SignInPage'
import PricingPage from './components/PricingPage'
import ProfilePage from './components/ProfilePage'
import RequireAuth from './auth/RequireAuth'

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/pricing" element={<PricingPage />} />
      <Route path="/signup" element={<SignUpPage />} />
      <Route path="/signin" element={<SignInPage />} />

      <Route
        path="/profile"
        element={
          <RequireAuth>
            <ProfilePage />
          </RequireAuth>
        }
      />
      <Route
        path="/transactions"
        element={
          <RequireAuth>
            <TransactionsPage />
          </RequireAuth>
        }
      />
      <Route
        path="/budget"
        element={
          <RequireAuth>
            <BudgetPage />
          </RequireAuth>
        }
      />
      <Route
        path="/goals"
        element={
          <RequireAuth>
            <GoalsPage />
          </RequireAuth>
        }
      />
      <Route
        path="/insights"
        element={
          <RequireAuth>
            <InsightsPage />
          </RequireAuth>
        }
      />
    </Routes>
  )
}

export default App

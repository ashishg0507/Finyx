/**
 * Runs before every test file. Isolates tests from production:
 * - In-memory SQLite (never Railway / Render DB)
 * - No emails or cron
 * - Does not load server/.env
 */
process.env.FINYX_TEST_MODE = '1'
process.env.NODE_ENV = 'test'
process.env.JWT_SECRET = 'finyx-local-test-jwt-secret'
process.env.EMAIL_ENABLED = 'false'
process.env.MONTHLY_SUMMARY_CRON = 'false'
process.env.CORS_ORIGINS = 'http://localhost:5173'
process.env.RAZORPAY_KEY_ID = 'rzp_test_placeholder'
process.env.RAZORPAY_KEY_SECRET = 'test_secret_placeholder'

# PHASE 10: TESTING

## Test Strategy

| Layer | Tool | Scope |
|-------|------|-------|
| Unit Tests | Jest + Supertest | Services, Utilities, Validators |
| Integration | Jest | API endpoints, Database operations |
| Frontend | Vitest + Testing Library | Components, Pages |
| E2E | Cypress (future) | Full user flows |

## Backend Tests

### Test Files
```
backend/tests/
├── auth.test.js           # Authentication API tests
├── health.test.js         # Health check endpoints
├── trek.test.js           # Trek CRUD operations
├── location.test.js       # Location update & history
└── sos.test.js            # SOS trigger & management
```

### Running Tests
```bash
cd backend
npm test                    # Run all tests with coverage
npm run test:watch          # Watch mode
```

### Test Coverage Targets
- Statements: 60%
- Branches: 50%
- Functions: 60%
- Lines: 60%

### Example Test (auth.test.js)
```javascript
const request = require('supertest');
const app = require('../src/app');

describe('POST /api/v1/auth/register', () => {
  it('should register a new user', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: 'test@example.com',
        password: 'TestPass123',
        name: 'Test User',
      });
    expect(res.status).toBe(201);
    expect(res.body.data).toHaveProperty('accessToken');
  });
});
```

## Frontend Tests

### Test Files
```
frontend/src/
├── App.test.jsx                # App render tests
├── components/
│   ├── Layout.test.jsx         # Layout component
│   ├── MapView.test.jsx        # Map component
│   └── SOSButton.test.jsx      # SOS button
└── pages/
    ├── Login.test.jsx          # Login page
    └── Dashboard.test.jsx      # Dashboard page
```

### Running Tests
```bash
cd frontend
npm test                    # Run all tests
npm run test:watch          # Watch mode
```

## Test Data Strategy
- Use separate test database (Neon branch)
- Factory functions for test data generation
- Clean database between test suites
- Mock external services (Google Maps, Email, SMS)

## CI Integration
Tests run automatically on GitHub Actions for:
- Push to main/develop branches
- Pull requests targeting main
- See `.github/workflows/ci.yml`

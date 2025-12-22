# OneNightDrink - Backend API Quick Start

## What Was Created

A complete Node.js/Express backend API with PostgreSQL database to replace localStorage and enable cross-device data sync.

## Backend Structure

```
server/
├── src/
│   ├── db/
│   │   ├── index.ts          # Database connection
│   │   ├── schema.sql        # Database schema
│   │   ├── migrate.ts        # Migration runner
│   │   └── seed.ts           # Initial data seeder
│   ├── middleware/
│   │   └── auth.ts           # JWT authentication
│   ├── routes/
│   │   ├── auth.ts           # User auth endpoints
│   │   ├── bars.ts           # Bar management
│   │   ├── passes.ts         # Pass/reservation endpoints
│   │   ├── parties.ts        # Party endpoints
│   │   └── admin.ts          # Admin endpoints
│   ├── types/
│   │   └── index.ts          # TypeScript types
│   └── index.ts              # Main server file
├── package.json
├── tsconfig.json
├── .env.example
└── README.md
```

## Quick Setup (5 minutes)

### 1. Install PostgreSQL

**Windows (PowerShell as Admin):**
```powershell
choco install postgresql
# Or download from: https://www.postgresql.org/download/windows/
```

**macOS:**
```bash
brew install postgresql@14
brew services start postgresql@14
```

### 2. Create Database

```bash
createdb onenightdrink
```

### 3. Install Dependencies

```bash
cd server
npm install
```

### 4. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` - **IMPORTANT: Update these values:**
```env
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/onenightdrink
JWT_SECRET=GENERATE_A_RANDOM_STRING_HERE
```

Generate JWT secret:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 5. Setup Database

```bash
npm run migrate  # Create tables
npm run seed     # Add initial bar data
```

### 6. Start Server

```bash
npm run dev
```

Server runs on `http://localhost:3001`

Test: `curl http://localhost:3001/health`

## API Endpoints Summary

### Authentication
- `POST /api/auth/register` - Register user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update profile
- `POST /api/auth/admin/login` - Admin login

### Bars
- `GET /api/bars` - List all bars
- `GET /api/bars/featured` - Featured bars
- `POST /api/bars` - Create bar (admin)
- `PUT /api/bars/:id` - Update bar (admin)
- `DELETE /api/bars/:id` - Delete bar (admin)

### Passes
- `GET /api/passes` - User's passes
- `GET /api/passes/active` - Active passes
- `POST /api/passes` - Purchase pass

### Parties
- `GET /api/parties` - List parties
- `POST /api/parties` - Create party
- `POST /api/parties/:id/join` - Join party
- `DELETE /api/parties/:id/leave` - Leave party

### Admin
- `GET /api/admin/members` - All members
- `GET /api/admin/passes` - All passes
- `GET /api/admin/payment-settings` - Payment config
- `PUT /api/admin/payment-settings` - Update settings

## Next Steps

### Frontend Migration (Required)

The frontend currently uses localStorage. You need to:

1. **Create API service layer** in `src/services/api.ts`
2. **Update Zustand store** to call API instead of localStorage
3. **Add JWT token management**
4. **Update all pages** to handle async API calls

See `BACKEND_SETUP.md` for detailed instructions.

### Environment Variables for Frontend

Add to frontend `.env`:
```env
VITE_API_URL=http://localhost:3001
```

Production:
```env
VITE_API_URL=https://api.one-night-drink.com
```

## Production Deployment

### Option 1: Same Server as Frontend

1. Build backend: `npm run build`
2. Use PM2: `pm2 start dist/index.js --name onenightdrink-api`
3. Configure nginx to proxy `/api/*` to backend

### Option 2: Separate Server

1. Deploy backend to separate server/container
2. Update CORS_ORIGIN in backend `.env`
3. Update VITE_API_URL in frontend `.env`

## Database Schema

- **users** - User accounts (email, password, profile)
- **bars** - Bar listings with location and drinks
- **passes** - Purchased drink passes with QR codes
- **parties** - Party/event listings
- **party_members** - Party participants
- **payment_settings** - System configuration

## Security Notes

- JWT tokens expire in 7 days (configurable)
- Passwords hashed with bcrypt
- Admin endpoints require admin token
- CORS configured for specific origins
- SQL injection protected (parameterized queries)

## Troubleshooting

### "Cannot connect to database"
- Check PostgreSQL is running: `pg_isready`
- Verify DATABASE_URL in `.env`
- Check PostgreSQL logs

### "Port 3001 already in use"
- Change PORT in `.env`
- Or kill process: `lsof -i :3001` (macOS/Linux)

### "Migration failed"
- Drop and recreate database:
  ```bash
  dropdb onenightdrink
  createdb onenightdrink
  npm run migrate
  npm run seed
  ```

## Development Workflow

1. Make changes to backend code
2. Server auto-restarts (tsx watch)
3. Test with curl or Postman
4. Update frontend to use new endpoints

## Testing Examples

### Register User
```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"pass123","name":"Test","phone":"12345678"}'
```

### Get Bars
```bash
curl http://localhost:3001/api/bars
```

### Create Pass (requires auth token)
```bash
curl -X POST http://localhost:3001/api/passes \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{"barId":"bar-1","barName":"Dragon-i","personCount":2,"totalPrice":500,"platformFee":250,"barPayment":250}'
```

## Support

- Full docs: `server/README.md`
- Setup guide: `BACKEND_SETUP.md`
- Database schema: `server/src/db/schema.sql`

---

**Status:** Backend API is complete and ready to use. Frontend migration needed to connect to API.

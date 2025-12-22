# OneNightDrink Backend API

Backend API server for OneNightDrink application with PostgreSQL database.

## Setup

### 1. Install Dependencies

```bash
cd server
npm install
```

### 2. Database Setup

Install PostgreSQL and create a database:

```bash
# Create database
createdb onenightdrink

# Or using psql
psql -U postgres
CREATE DATABASE onenightdrink;
```

### 3. Environment Configuration

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

Edit `.env` with your settings:
- `DATABASE_URL`: Your PostgreSQL connection string
- `JWT_SECRET`: Change to a secure random string
- `ADMIN_PASSWORD`: Set your admin password
- `CORS_ORIGIN`: Add your frontend URLs

### 4. Run Migrations

```bash
npm run migrate
```

### 5. Start Server

Development:
```bash
npm run dev
```

Production:
```bash
npm run build
npm start
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update profile
- `POST /api/auth/admin/login` - Admin login

### Bars
- `GET /api/bars` - Get all bars
- `GET /api/bars/featured` - Get featured bars
- `GET /api/bars/:id` - Get bar by ID
- `POST /api/bars` - Create bar (admin)
- `PUT /api/bars/:id` - Update bar (admin)
- `DELETE /api/bars/:id` - Delete bar (admin)
- `POST /api/bars/:id/toggle-featured` - Toggle featured status (admin)

### Passes
- `GET /api/passes` - Get user's passes (auth required)
- `GET /api/passes/active` - Get active passes (auth required)
- `POST /api/passes` - Create pass (auth required)

### Parties
- `GET /api/parties` - Get all parties (query: ?status=open)
- `GET /api/parties/my-hosted` - Get hosted parties (auth required)
- `GET /api/parties/my-joined` - Get joined parties (auth required)
- `POST /api/parties` - Create party (auth required)
- `POST /api/parties/:id/join` - Join party (auth required)
- `DELETE /api/parties/:id/leave` - Leave party (auth required)
- `DELETE /api/parties/:id` - Cancel party (auth required, host only)

### Admin
- `GET /api/admin/members` - Get all members (admin)
- `PUT /api/admin/members/:id` - Update member (admin)
- `DELETE /api/admin/members/:id` - Delete member (admin)
- `GET /api/admin/passes` - Get all passes (admin)
- `GET /api/admin/payment-settings` - Get payment settings (admin)
- `PUT /api/admin/payment-settings` - Update payment settings (admin)

## Authentication

Include JWT token in Authorization header:
```
Authorization: Bearer <token>
```

## Database Schema

- **users** - User accounts and profiles
- **bars** - Bar information
- **passes** - Purchased drink passes
- **parties** - Party/event listings
- **party_members** - Party participants
- **payment_settings** - System payment configuration

## Deployment

### Using systemd (Linux)

1. Build the project:
```bash
npm run build
```

2. Create systemd service file `/etc/systemd/system/onenightdrink-api.service`:
```ini
[Unit]
Description=OneNightDrink API
After=network.target postgresql.service

[Service]
Type=simple
User=www-data
WorkingDirectory=/path/to/YumYum/server
Environment=NODE_ENV=production
ExecStart=/usr/bin/node dist/index.js
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

3. Enable and start:
```bash
sudo systemctl enable onenightdrink-api
sudo systemctl start onenightdrink-api
```

### Using PM2

```bash
npm install -g pm2
pm2 start dist/index.js --name onenightdrink-api
pm2 save
pm2 startup
```

## Development

The server uses:
- **Express** - Web framework
- **PostgreSQL** - Database
- **JWT** - Authentication
- **bcrypt** - Password hashing
- **Zod** - Input validation
- **TypeScript** - Type safety

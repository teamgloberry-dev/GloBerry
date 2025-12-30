# GloBerry - From Airport to Apartment

A student support service website helping international students integrate into Berlin through guidance, services, and community support.

## Features

- 🎆 Service package showcase (Free, Starter, Essentials, Premium)
- 📝 Online booking system for student support packages
- 🤝 Partner and volunteer registration
- 📞 Contact forms and communication
- 🎨 Modern responsive UI with Tailwind CSS
- 🚀 Production-ready deployment configuration

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn

## Installation

1. **Clone and setup**
   ```bash
   cd "GloBerry"
   npm install
   ```

2. **Start Development Server**
   ```bash
   npm run dev
   ```

   Visit: http://localhost:3000

## Production Deployment

### Heroku Deployment

1. **Install Heroku CLI and login**
   ```bash
   heroku login
   ```

2. **Create Heroku app**
   ```bash
   heroku create globerry-app
   ```

3. **Add PostgreSQL addon**
   ```bash
   heroku addons:create heroku-postgresql:hobby-dev
   ```

4. **Set environment variables**
   ```bash
   heroku config:set JWT_SECRET=your_secure_jwt_secret
   heroku config:set NODE_ENV=production
   ```

5. **Deploy**
   ```bash
   git add .
   git commit -m "Initial deployment"
   git push heroku main
   ```

### Railway Deployment

1. **Connect to Railway**
   - Visit [railway.app](https://railway.app)
   - Connect your GitHub repository
   - Add PostgreSQL service

2. **Environment Variables**
   Set in Railway dashboard:
   - `JWT_SECRET`: Your secure JWT secret
   - `NODE_ENV`: production

### DigitalOcean App Platform

1. **Create app from GitHub**
2. **Add PostgreSQL database**
3. **Set environment variables**
4. **Deploy automatically**

## Service Packages

### Free Starter Pack (€0)
- 15-minute consultation
- Welcome coffee
- Basic orientation

### Starter (€50)
- Anmeldung guidance
- University registration help
- Volunteer certificate

### Essentials (€150)
- Everything in Starter
- Bank account setup
- Insurance guidance
- Housing shortlist
- City orientation

### Premium (€250)
- Everything in Essentials
- Extended housing support
- Skill workshops
- Job referral service
- Buddy program
- Language roadmap

## API Endpoints

### Form Submissions
- `POST /api/booking` - Submit package booking
- `POST /api/partner` - Submit partner/volunteer application
- `POST /api/contact` - Submit contact form

### Health Check
- `GET /health` - Server health status

## Development

```bash
# Start development server with auto-reload
npm run dev

# Run in production mode
npm start
```

## Technologies Used

- **Backend**: Node.js, Express.js
- **Frontend**: Vanilla JavaScript, Tailwind CSS
- **Icons**: Font Awesome
- **Styling**: Custom CSS with animations
- **Security**: Helmet, Rate limiting

## Mission & Vision

**Mission**: Helping international students integrate into Berlin through guidance, services, and community support.

**Vision**: To become Germany's leading student support hub, making the transition to life in Berlin seamless and welcoming.

## Partners & Support

- Generation iTrust
- Marc Leberecht-Schneider
- Local NGOs and community organizations

## Contact

- **Email**: team.globerry@gmail.com
- **Phone**: +49 155 10455401
- **Location**: Niederschöneweide, Berlin

## License

MIT License - see LICENSE file for details

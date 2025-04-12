# CabRadar Backend

A real-time location-based event detection and notification system built with NestJS.

## Features

- **Authentication**: Secure user authentication using Supabase
- **Real-time Location Tracking**: Track and update user locations in real-time
- **Event Detection**: Detect nearby events based on user location
- **Push Notifications**: Send notifications using Firebase Cloud Messaging
- **WebSocket Support**: Real-time communication for location updates
- **Rate Limiting**: Protect API endpoints from abuse
- **Caching**: Efficient caching using Redis

## Tech Stack

- **Framework**: NestJS
- **Database**: PostgreSQL (via Supabase)
- **Authentication**: Supabase Auth
- **Real-time**: WebSocket
- **Caching**: Redis
- **Push Notifications**: Firebase Cloud Messaging
- **API Documentation**: Swagger

## Prerequisites

- Node.js (v16 or later)
- npm or yarn
- PostgreSQL database
- Redis server
- Firebase project
- Supabase project

## Installation

1. Clone the repository:

```bash
git clone https://github.com/yourusername/cab-radar-backend.git
cd cab-radar-backend
```

2. Install dependencies:

```bash
npm install
```

3. Create a `.env` file in the root directory with the following variables:

```env
# Server Configuration
PORT=

# Supabase Configuration
SUPABASE_URL=
SUPABASE_KEY=
SUPABASE_JWT_SECRET=

# Redis Configuration
REDIS_HOST=
REDIS_PORT=
REDIS_USERNAME=
REDIS_PASSWORD=

# Firebase Configuration
FIREBASE_PROJECT_ID=
FIREBASE_PRIVATE_KEY=
FIREBASE_CLIENT_EMAIL=

# Database Configuration
DATABASE_URL=
```

4. Run the application:

```bash
npm run start:dev
```

## API Documentation

Once the application is running, you can access the Swagger documentation at:

```
http://localhost:3000/api
```

## Project Structure

```
src/
├── common/           # Shared modules and utilities
├── modules/          # Feature modules
│   ├── auth/        # Authentication module
│   ├── location/    # Location tracking module
│   ├── radar/       # Event detection module
│   └── notification/# Notification module
├── main.ts          # Application entry point
└── app.module.ts    # Root module
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

Made with 🖤 by AM

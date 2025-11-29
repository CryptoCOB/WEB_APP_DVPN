# Simplified DVPN (Decentralized VPN) - COMP229 Group Project

A simplified decentralized VPN demonstration built with Node.js, Express, MongoDB, and AES-256 encryption. This prototype routes encrypted JSON payloads between two nodes (Toronto and Halifax) while demonstrating JWT authentication and full CRUD operations.

## ⚠️ Important Note
This is **NOT a real VPN**. It only routes encrypted JSON payloads between two nodes for educational purposes.

## Project Structure

```
/server
  /config
    db.js                 - MongoDB connection configuration
  /controllers
    userController.js     - User CRUD and authentication logic
    dvpnController.js     - DVPN data routing logic
  /middleware
    authMiddleware.js     - JWT verification middleware
  /models
    User.js               - User schema with password hashing
  /routes
    userRoutes.js         - User endpoints
    dvpnRoutes.js         - DVPN endpoints
  /services
    encryptionService.js  - AES-256-CBC encryption/decryption
    dvpnClient.js         - Client for sending to nodes
  /nodes
    torontoNode.js        - Relay node (port 4001)
    halifaxNode.js        - Decryption endpoint (port 4002)
  server.js               - Main Express server
  package.json            - Dependencies
  .env.example            - Environment variables template
```

## Data Flow

```
┌─────────────────────────────────────────────────────────┐
│  CLIENT SENDS ENCRYPTED DATA THROUGH DVPN TUNNEL        │
└─────────────────────────────────────────────────────────┘

1. Client → /dvpn/send (includes JWT token)
   ↓
2. encryptAES(data)
   ↓
3. Toronto Node (/receive) - Relay point
   ↓
4. Halifax Node (/decrypt) - Decryption endpoint
   ↓
5. decryptAES(data) & return plaintext
   ↓
6. Response back to client
```

## Quick Start

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (running locally or connection string)
- npm

### 1. Install Dependencies

```bash
cd server
npm install
```

### 2. Setup Environment Variables

Create a `.env` file in the `/server` directory (copy from `.env.example`):

```env
# MongoDB Connection
MONGO_URI=mongodb://localhost:27017/dvpn_db

# JWT Secret (generate a random string for production)
JWT_SECRET=your_secret_key_change_this_in_production

# AES Encryption (32-byte key for AES-256)
AES_KEY=0123456789abcdef0123456789abcdef

# AES IV (16-byte initialization vector)
AES_IV=fedcba9876543210

# Node URLs
TORONTO_URL=http://localhost:4001
HALIFAX_URL=http://localhost:4002

# Server Port
PORT=3000
```

### 3. Start MongoDB

Make sure MongoDB is running on your system:

```bash
# Windows
mongod

# macOS
brew services start mongodb-community

# Linux
sudo systemctl start mongod
```

### 4. Start the Nodes (in separate terminals)

Terminal 1 - Start Toronto Node:
```bash
npm run toronto
```

Terminal 2 - Start Halifax Node:
```bash
npm run halifax
```

### 5. Start Main Server (in a third terminal)

```bash
npm start
```

You should see:
```
╔════════════════════════════════════════╗
║  MAIN SERVER - Running on port 3000    ║
║  DVPN Application for COMP229          ║
╚════════════════════════════════════════╝
```

## Postman Testing Guide

### 1. Register a User

**Request:**
```
POST http://localhost:3000/users/register
Content-Type: application/json

{
  "username": "testuser",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "username": "testuser"
  }
}
```

### 2. Login to Get JWT Token

**Request:**
```
POST http://localhost:3000/users/login
Content-Type: application/json

{
  "username": "testuser",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "username": "testuser",
    "role": "user"
  }
}
```

**⚠️ Copy the token value - you'll need it for the next step!**

### 3. Send Data Through DVPN Tunnel

**Request:**
```
POST http://localhost:3000/dvpn/send
Content-Type: application/json
Authorization: Bearer <PASTE_YOUR_JWT_TOKEN_HERE>

{
  "data": "Hello from the encrypted tunnel!"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Data transmitted through DVPN successfully",
  "originalData": "Hello from the encrypted tunnel!",
  "fromHalifax": {
    "from": "halifax",
    "decrypted": {
      "data": "Hello from the encrypted tunnel!",
      "sender": "testuser",
      "timestamp": "2024-11-17T15:30:45.123Z"
    },
    "success": true
  }
}
```

### 4. Get All Users

**Request:**
```
GET http://localhost:3000/users
```

**Response:**
```json
{
  "success": true,
  "users": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "username": "testuser",
      "role": "user",
      "createdAt": "2024-11-17T15:25:30.123Z"
    }
  ]
}
```

### 5. Update User (Protected)

**Request:**
```
PUT http://localhost:3000/users/507f1f77bcf86cd799439011
Content-Type: application/json
Authorization: Bearer <JWT_TOKEN>

{
  "username": "newusername"
}
```

### 6. Delete User (Protected)

**Request:**
```
DELETE http://localhost:3000/users/507f1f77bcf86cd799439011
Authorization: Bearer <JWT_TOKEN>
```

## API Endpoints

### User Management

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/users/register` | No | Register new user |
| POST | `/users/login` | No | Login and get JWT |
| GET | `/users` | No | Get all users |
| PUT | `/users/:id` | Yes | Update user |
| DELETE | `/users/:id` | Yes | Delete user |

### DVPN Routes

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/dvpn/send` | Yes | Send encrypted data through tunnel |

### Node Health Checks

| Method | Endpoint | Port | Description |
|--------|----------|------|-------------|
| GET | `/health` | 3000 | Main server health |
| GET | `/health` | 4001 | Toronto node health |
| GET | `/health` | 4002 | Halifax node health |

## Encryption Details

### AES-256-CBC
- **Algorithm**: AES-256-CBC
- **Key Length**: 256 bits (32 bytes)
- **IV Length**: 128 bits (16 bytes)
- **Encoding**: Base64 for transmission

### How It Works

1. **Encryption Flow**:
   - Plaintext data → AES-256-CBC encrypt → Hex → Base64
   - Transmitted over HTTP

2. **Decryption Flow**:
   - Base64 → Hex → AES-256-CBC decrypt → Plaintext
   - Data returned to client

## JWT Authentication

- **Algorithm**: HS256
- **Expiration**: 24 hours
- **Token Format**: `Bearer <token>`
- **Location**: Authorization header

## Code Architecture

### MVC Pattern
- **Models**: User schema with validation
- **Views**: JSON responses (implicit)
- **Controllers**: Business logic for users and DVPN

### Separation of Concerns
- **Services**: Encryption and client communication
- **Middleware**: Authentication and request logging
- **Routes**: Endpoint definitions
- **Config**: Database connection

## Technology Stack

| Technology | Purpose |
|-----------|---------|
| Express.js | Web framework |
| Mongoose | MongoDB ODM |
| jsonwebtoken | JWT authentication |
| bcryptjs | Password hashing |
| axios | HTTP client |
| crypto | Encryption (built-in) |
| cors | Cross-origin resource sharing |
| dotenv | Environment variables |

## Testing Checklist

- [ ] MongoDB is running
- [ ] All three servers start without errors
- [ ] Register a new user
- [ ] Login and get JWT token
- [ ] Send data through DVPN (check Toronto and Halifax logs)
- [ ] Get all users
- [ ] Update user information
- [ ] Delete user
- [ ] Verify encryption/decryption works

## Common Issues

### "Cannot find module"
```bash
npm install
```

### MongoDB connection failed
- Ensure MongoDB is running
- Check MONGO_URI in .env file
- Try: `mongodb://localhost:27017/dvpn_db`

### ECONNREFUSED on node communication
- Ensure all three servers are running:
  - Main: `npm start` (port 3000)
  - Toronto: `npm run toronto` (port 4001)
  - Halifax: `npm run halifax` (port 4002)

### JWT errors
- Token must be in Authorization header
- Format: `Bearer <token>`
- Token expires after 24 hours

## Key Features

✅ User registration and login with JWT  
✅ Full CRUD operations for users  
✅ AES-256 encryption/decryption  
✅ MongoDB integration with Mongoose  
✅ Multi-node architecture (Toronto ↔ Halifax)  
✅ MVC folder structure  
✅ Protected routes with authentication  
✅ Comprehensive error handling  
✅ Request logging  
✅ CORS enabled  

## Learning Objectives (COMP229)

This project demonstrates:
1. **Backend Development**: Express.js server setup
2. **Authentication**: JWT token implementation
3. **Database**: MongoDB and Mongoose ODM
4. **Security**: Password hashing with bcryptjs
5. **Cryptography**: AES-256-CBC encryption
6. **API Design**: RESTful endpoints
7. **Architecture**: MVC pattern
8. **Middleware**: Request processing pipeline
9. **Error Handling**: Try-catch and error responses
10. **Network Communication**: Inter-node HTTP requests

## Authors
COMP229 Group Project - Web Application Development
Odette Nguenouho, Marc Harty


## License
MIT License

---

**Note**: This is a simplified educational project. Do not use in production without proper security hardening.

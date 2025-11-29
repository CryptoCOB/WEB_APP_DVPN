# DVPN Project - Complete UML & Architecture Documentation

## 📋 Table of Contents
1. [System Architecture](#system-architecture)
2. [Class Diagram](#class-diagram)
3. [Sequence Diagram](#sequence-diagram)
4. [Data Flow](#data-flow)
5. [Deployment Diagram](#deployment-diagram)
6. [Encryption Specifications](#encryption-specifications)
7. [API Flow](#api-flow)

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                          CLIENT APPLICATION                         │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │  • Register User        • Send Encrypted Data                  │ │
│  │  • Login (Get JWT)      • CRUD Users                           │ │
│  └────────────────────────────────────────────────────────────────┘ │
└────────────────────┬────────────────────────────────────────────────┘
                     │ HTTP POST/GET/PUT/DELETE
                     ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    MAIN SERVER (PORT 3000)                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐   │
│  │ Express.js   │  │    Routes    │  │  Auth Middleware         │   │
│  │   Server     │  │   (7 total)  │  │  (JWT Verification)      │   │
│  └──────────────┘  └──────────────┘  └──────────────────────────┘   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐   │
│  │ User Ctrlr   │  │ DVPN Ctrlr   │  │ Services                 │   │
│  │ (CRUD ops)   │  │ (Routing)    │  │ • Encryption             │   │
│  │              │  │              │  │ • DVPN Client            │   │
│  └──────────────┘  └──────────────┘  └──────────────────────────┘   │
└────────────────────┬────────────────────────────────────────────────┘
                     │                  │
        ┌────────────┘                  └─────────────┐
        │                                             │
        ▼                                             ▼
   ┌─────────────┐                          ┌──────────────────┐
   │  MONGODB    │                          │  TORONTO NODE    │
   │  (Port      │                          │  (Port 4001)     │
   │   27017)    │                          │  Relay Point     │
   │             │                          │                  │
   │ User Model: │                          │ /receive         │
   │ • _id       │                          │ /health          │
   │ • username  │                          └─────────┬────────┘
   │ • password  │                                    │
   │   (hashed)  │                                    │ HTTP POST
   │ • role      │                                    │
   │ • createdAt │                                    ▼
   └─────────────┘                          ┌──────────────────┐
                                            │  HALIFAX NODE    │
                                            │  (Port 4002)     │
                                            │  Decrypt Point   │
                                            │                  │
                                            │ /decrypt         │
                                            │ /health          │
                                            └──────────────────┘
```

---

## Class Diagram

```
┌────────────────────────────────────────────────────────────────────┐
│                            USER MODEL                              │
├────────────────────────────────────────────────────────────────────┤
│ Attributes:                                                        │
│  • _id: ObjectId (MongoDB auto-generated)                          │
│  • username: String (required, unique, min 3 chars)                │
│  • password: String (required, hashed with bcryptjs)               │
│  • role: String (enum: 'user', 'admin', default: 'user')           │
│  • createdAt: Date (default: Date.now)                             │
├────────────────────────────────────────────────────────────────────┤
│ Methods:                                                           │
│  + save(): Promise<User>                                           │
│  + comparePassword(enteredPassword): Promise<Boolean>              │
│  # pre-save hook: automatically hash password if modified          │
└────────────────────────────────────────────────────────────────────┘
                                    △
                                    │ uses
                                    │
        ┌───────────────────────────┼───────────────────────────┐
        │                           │                           │
        ▼                           ▼                           ▼
┌──────────────────┐      ┌──────────────────┐      ┌──────────────────┐
│ USER CONTROLLER  │      │ DVPN CONTROLLER  │      │AUTH MIDDLEWARE   │
├──────────────────┤      ├──────────────────┤      ├──────────────────┤
│ Methods:         │      │ Methods:         │      │ Methods:         │
│ + register()     │      │ + sendThroughDV  │      │ + verify()       │
│ + login()        │      │   PN()           │      │   - Reads JWT    │
│ + getUsers()     │      │                  │      │   - Validates    │
│ + updateUser()   │      │ Uses:            │      │   - Attaches     │
│ + deleteUser()   │      │ • DVPNClient     │      │     user to req  │
│                  │      │ • EncryptService │      │                  │
└──────────────────┘      └──────────────────┘      └──────────────────┘
        │                         │                         │
        │ returns JWT             │ encrypts/sends          │ verifies
        │                         │                         │
        ▼                         ▼                         ▼
     TOKEN                  ENCRYPTED DATA          USER OBJECT
```

---

## Sequence Diagram: Complete DVPN Flow

```
Client          MainServer      EncService      Toronto         Halifax
  │                │                │               │               │
  │─ POST/register─>                │               │               │
  │                │─ Create user   │               │               │
  │                │─ Hash password │               │               │
  │                │─ Store in DB   │               │               │
  │                │<────────────────────────────────────────────────│
  │<─ {user, token}│               │               │               │
  │                │               │               │               │
  │─ POST/login───>                │               │               │
  │                │─ Find user    │               │               │
  │                │─ Compare pwd  │               │               │
  │                │─ Generate JWT │               │               │
  │<─ {token}─────│               │               │               │
  │                │               │               │               │
  │─ POST/dvpn/send               │               │               │
  │   + JWT token ─>              │               │               │
  │                │               │               │               │
  │                │─ Verify JWT ─>│               │               │
  │                │               │               │               │
  │                │─ Prepare payload              │               │
  │                │─ encryptAES()─>               │               │
  │                │               │  Base64       │               │
  │                │<─ encrypted ─<│               │               │
  │                │               │               │               │
  │                │─ POST /receive─────────────────>               │
  │                │               │               │               │
  │                │               │               │─ Forward ───────>
  │                │               │               │   (encrypted)   │
  │                │               │               │               │
  │                │               │               │     decryptAES()
  │                │               │<─────────── decryptAES() ──────│
  │                │               │  Plain text   │               │
  │                │               │               │ Return response
  │                │<──────────────────────────────│<──────────────│
  │<─ {success, ───│               │               │               │
  │   original,    │               │               │               │
  │   decrypted}   │               │               │               │
  ▼                ▼               ▼               ▼               ▼
```

---

## Data Flow: Step-by-Step

### Step 1: Authentication
```
Client sends credentials
    ↓
Main Server receives POST /users/login
    ↓
Server finds user in MongoDB
    ↓
Compare submitted password with hashed password (bcryptjs)
    ↓
If valid: Generate JWT token (HS256, 24h expiry)
    ↓
Return token to client
```

### Step 2: Sending Encrypted Data
```
Client sends: POST /dvpn/send
Header: Authorization: Bearer <JWT_TOKEN>
Body: { "data": "Hello encrypted" }
    ↓
Main Server receives request
    ↓
Middleware verifies JWT signature
    ↓
Extract user information from JWT
    ↓
Create payload: { data, sender, timestamp }
    ↓
Call EncryptionService.encryptAES()
    ├─ Serialize to JSON string
    ├─ Create cipher: AES-256-CBC
    ├─ Key: 32 bytes (from .env)
    ├─ IV: 16 bytes (from .env)
    ├─ Encrypt
    ├─ Convert to hex
    └─ Encode as Base64
    ↓
Send to Toronto Node: POST http://localhost:4001/receive
```

### Step 3: Toronto Node Relay
```
Toronto Node receives encrypted data
    ↓
Toronto extracts { encryptedData }
    ↓
Toronto forwards to Halifax Node
POST http://localhost:4002/decrypt
{ encryptedData }
    ↓
Toronto waits for response
```

### Step 4: Halifax Node Decryption
```
Halifax Node receives encrypted data
    ↓
Call EncryptionService.decryptAES()
    ├─ Decode from Base64
    ├─ Convert to hex
    ├─ Create decipher: AES-256-CBC
    ├─ Use same key and IV
    ├─ Decrypt
    └─ Return plaintext
    ↓
Parse JSON
    ↓
Create response: { from: "halifax", decrypted: {...}, success: true }
    ↓
Return to Toronto Node
```

### Step 5: Response Back to Client
```
Toronto receives response from Halifax
    ↓
Forward response to Main Server
    ↓
Main Server receives response
    ↓
Create final response: {
    success: true,
    originalData: "Hello encrypted",
    fromHalifax: { ... }
}
    ↓
Send to Client
    ↓
Client receives complete DVPN response
```

---

## Deployment Diagram

```
┌──────────────────────────────────────────────────────────────────┐
│                    DEVELOPMENT ENVIRONMENT                       │
└──────────────────────────────────────────────────────────────────┘

┌─────────────────────┐
│  CLIENT MACHINE     │
│  ┌───────────────┐  │
│  │ Postman       │  │
│  │ or Browser    │  │
│  └───────────────┘  │
└─────────┬───────────┘
          │ HTTP
          │ (GET/POST/PUT/DELETE)
          ▼
┌──────────────────────────────────────────────────────────────────┐
│               LOCAL DEVELOPMENT SERVER                           │
│                                                                  │
│  ┌─────────────────────┐  ┌─────────────────────┐                │
│  │  MAIN SERVER        │  │  TORONTO NODE       │                │
│  │  Port 3000          │  │  Port 4001          │                │
│  │  ┌───────────────┐  │  │  ┌───────────────┐  │                │
│  │  │ Express app   │  │  │  │ Relay server  │  │                │
│  │  │ User routes   │  │  │  │ /receive      │  │                │
│  │  │ DVPN routes   │  │  │  │ /health       │  │                │
│  │  │ Controllers   │  │  │  └───────────────┘  │                │
│  │  └───────────────┘  │  │                     │                │
│  └────────┬────────────┘  └──────────┬──────────┘                │
│           │                          │                           │
│  ┌────────▼────────────┐  ┌─────────▼──────────┐                │
│  │  HALIFAX NODE       │  │  MONGODB           │                │
│  │  Port 4002          │  │  Port 27017        │                │
│  │  ┌───────────────┐  │  │  ┌───────────────┐ │                │
│  │  │ Decrypt srv   │  │  │  │ User DB       │ │                │
│  │  │ /decrypt      │  │  │  │ Collections   │ │                │
│  │  │ /health       │  │  │  └───────────────┘ │                │
│  │  └───────────────┘  │  │                    │                │
│  └─────────────────────┘  └────────────────────┘                │
│                                                                  │
│  All communicate via HTTP and TCP connections                   │
└──────────────────────────────────────────────────────────────────┘
```

---

## Encryption Specifications

### AES-256-CBC Algorithm

```
╔════════════════════════════════════════════════════╗
║          AES-256-CBC ENCRYPTION DETAILS            ║
╠════════════════════════════════════════════════════╣
║ Algorithm Name:      Advanced Encryption Standard  ║
║ Key Size:            256 bits (32 bytes)           ║
║ Block Size:          128 bits (16 bytes)           ║
║ IV Size:             128 bits (16 bytes)           ║
║ Mode:                Cipher Block Chaining (CBC)   ║
║ Padding:             PKCS7 (automatic)             ║
║ Encoding:            Base64 (for HTTP transmission)║
╚════════════════════════════════════════════════════╝
```

### Encryption Process

```
Plain Text Data
    │
    ▼
{"data": "Hello", "sender": "user123"}
    │
    ▼ JSON.stringify()
    │
"{"data":"Hello","sender":"user123"}"
    │
    ▼ Create Cipher (AES-256-CBC)
    │ Key: 0123456789abcdef0123456789abcdef (32 bytes)
    │ IV:  fedcba9876543210 (16 bytes)
    │
    ▼ Encrypt with crypto.createCipheriv()
    │
Hex String: a1b2c3d4e5f6... (128+ chars)
    │
    ▼ Convert to Base64
    │
Base64 String: aGVsbG8gd29ybGQ=
    │
    ▼
HTTP Transmission (safe in JSON)
```

### Decryption Process

```
Base64 Encrypted String: aGVsbG8gd29ybGQ=
    │
    ▼ Decode from Base64
    │
Hex String: a1b2c3d4e5f6...
    │
    ▼ Create Decipher (AES-256-CBC)
    │ Key: 0123456789abcdef0123456789abcdef (32 bytes)
    │ IV:  fedcba9876543210 (16 bytes)
    │
    ▼ Decrypt with crypto.createDecipheriv()
    │
Plain Text: "{"data":"Hello","sender":"user123"}"
    │
    ▼ JSON.parse()
    │
Object: {data: "Hello", sender: "user123"}
```

---

## API Flow Diagrams

### User Registration Flow

```
POST /users/register
│
├─ Body: {username, password}
│
▼
userController.register()
│
├─ Validate input
├─ Check if username exists
├─ Create new User object
├─ User.pre('save') hook: Hash password with bcryptjs
├─ Save to MongoDB
│
▼
Response: {
  success: true,
  message: "User registered successfully",
  user: {id, username}
}
```

### User Login & JWT Flow

```
POST /users/login
│
├─ Body: {username, password}
│
▼
userController.login()
│
├─ Find user by username
├─ Compare password: bcryptjs.compare()
├─ If valid: jwt.sign({id, username, role})
│  └─ Token expires in 24h
├─ Return token
│
▼
Response: {
  success: true,
  token: "eyJhbGciOiJIUzI1NiIs...",
  user: {id, username, role}
}
```

### Protected Route Access

```
POST /dvpn/send
│
├─ Header: Authorization: Bearer <JWT>
│
▼
authMiddleware.verify()
│
├─ Extract token from "Bearer <token>"
├─ jwt.verify() with JWT_SECRET
├─ If valid: req.user = decoded
├─ If invalid: 401 Unauthorized
│
▼ (if valid)
│
dvpnController.sendThroughDVPN()
│
├─ Access req.user information
├─ Encrypt data
├─ Send to Toronto Node
├─ Wait for Halifax response
├─ Return to client
│
▼
Response: {success, data, fromHalifax}
```

### DVPN Tunnel Complete Flow

```
START: Client → Main Server
  │
  ├─ Verify JWT (authMiddleware)
  ├─ Extract user info
  ├─ Prepare payload
  │
  ├─ ENCRYPT: encryptAES()
  │  ├─ AES-256-CBC
  │  ├─ 32-byte key
  │  ├─ 16-byte IV
  │  └─ Base64 encoding
  │
  ├─ SEND TO TORONTO (HTTP POST /receive)
  │  └─ Toronto relays to Halifax (HTTP POST /decrypt)
  │
  ├─ HALIFAX RECEIVES
  │  ├─ Receive encrypted data
  │  └─ DECRYPT: decryptAES()
  │     ├─ Base64 decode
  │     ├─ Reverse AES-256-CBC
  │     └─ Parse JSON
  │
  ├─ RETURN RESPONSE
  │  ├─ Halifax → Toronto
  │  ├─ Toronto → Main Server
  │  └─ Main Server → Client
  │
END: Response with decrypted data
```

---

## Technology Stack Diagram

```
┌────────────────────────────────────────────────────────────────────┐
│                         APPLICATION LAYER                          │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  Express.js (Web Framework)                                  │  │
│  │  • HTTP server                                               │  │
│  │  • Middleware pipeline                                       │  │
│  │  • Route handling                                            │  │
│  └──────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────┐
│                         BUSINESS LOGIC LAYER                        │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐       │
│  │ Controllers    │  │ Services       │  │ Middleware     │       │
│  │ • User Ctrl    │  │ • Encryption   │  │ • Auth         │       │
│  │ • DVPN Ctrl    │  │ • DVPN Client  │  │ • Validation   │       │
│  └────────────────┘  └────────────────┘  └────────────────┘       │
└────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────┐
│                         DATA ACCESS LAYER                           │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  Mongoose (MongoDB ODM)                                      │  │
│  │  • Schema validation                                         │  │
│  │  • CRUD operations                                           │  │
│  │  • Data relationships                                        │  │
│  └──────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────┐
│                         DATABASE LAYER                              │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  MongoDB (NoSQL Database)                                    │  │
│  │  • Document-based storage                                    │  │
│  │  • Flexible schema                                           │  │
│  │  • Horizontal scalability                                    │  │
│  └──────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────┐
│                      SECURITY & ENCRYPTION LAYER                   │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────┐  │
│  │ JWT (Auth) │  │ bcryptjs   │  │ Crypto     │  │ CORS       │  │
│  │ (12h exp)  │  │ (pwd hash) │  │ (AES-256)  │  │ (C.O.S.)   │  │
│  └────────────┘  └────────────┘  └────────────┘  └────────────┘  │
└────────────────────────────────────────────────────────────────────┘
```

---

## Key Design Principles

### 1. **Separation of Concerns**
- **Routes**: Define endpoints
- **Controllers**: Business logic
- **Services**: Reusable utilities (encryption, HTTP calls)
- **Models**: Data schema and validation

### 2. **Security**
- JWT tokens for stateless authentication
- bcryptjs for password hashing (salt rounds: 10)
- AES-256-CBC for data encryption
- CORS enabled for cross-origin requests

### 3. **Scalability**
- Horizontal scaling: Add more nodes easily
- MongoDB Atlas for cloud database
- Environment-based configuration (.env)

### 4. **Maintainability**
- Clean MVC structure
- Clear code comments for COMP229 assignment
- Comprehensive error handling
- Logging for debugging

---

## Performance Considerations

```
Encryption Speed:     ~1-5ms per message (AES-256-CBC)
Token Generation:     ~2-3ms (JWT with HS256)
Password Hashing:     ~100-200ms (bcryptjs with salt=10)
Network Latency:      ~1-10ms (local HTTP)
Database Query:       ~5-50ms (MongoDB)
─────────────────────────────────────────
Total /dvpn/send:     ~120-280ms (typical)
```

---

## Security Checklist

- ✅ Passwords hashed with bcryptjs (10 rounds)
- ✅ JWT tokens with 24-hour expiration
- ✅ AES-256-CBC encryption for data in transit
- ✅ Authorization middleware on protected routes
- ✅ CORS configured
- ✅ Input validation on all endpoints
- ✅ Environment variables for secrets (.env)
- ✅ Error messages don't leak sensitive info

---

**Generated:** November 17, 2025  
**Project:** DVPN - COMP229 Group Project  
**Status:** Complete & Ready for Testing

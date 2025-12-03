# Translation Management System

A full-stack application for managing multilingual UI text using AWS Translate and DynamoDB.

![Translation Manager](https://img.shields.io/badge/React-18.2-blue) ![Node.js](https://img.shields.io/badge/Node.js-18+-green) ![AWS](https://img.shields.io/badge/AWS-DynamoDB%20%7C%20Translate-orange)

## Features

- 🌐 **Multilingual Support**: Create translations for 40+ languages using AWS Translate
- 📝 **Field-Level Editing**: Edit individual translation keys with real-time updates
- 🔄 **Re-translate Options**: Re-translate individual fields or entire languages
- 💾 **DynamoDB Persistence**: All translations stored in AWS DynamoDB
- ⚡ **In-Memory Caching**: Fast reads with server-side cache
- 🔔 **Cache Sync Detection**: Visual indicator when cache needs refresh
- ➕ **Dynamic Key Management**: Add/remove translation keys from UI
- 🗑️ **Language Management**: Create and delete languages
- 🎨 **Modern UI**: Beautiful glassmorphism design with TailwindCSS

---

## Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   React App     │────▶│   Express API   │────▶│    DynamoDB     │
│   (Frontend)    │◀────│   (Backend)     │◀────│    (Database)   │
└─────────────────┘     └────────┬────────┘     └─────────────────┘
                                 │
                        ┌────────┴────────┐
                        │                 │
                        ▼                 ▼
               ┌─────────────────┐ ┌─────────────────┐
               │  In-Memory      │ │  AWS Translate  │
               │  Cache          │ │  (Service)      │
               └─────────────────┘ └─────────────────┘
```

---

## Cache System (Important!)

### How It Works

The application uses a **two-tier data architecture**:

1. **DynamoDB** - Source of truth (persistent storage)
2. **In-Memory Cache** - Performance optimization layer

```
┌─────────────────────────────────────────────────────────────────┐
│                      CACHE ARCHITECTURE                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   DynamoDB (Source of Truth)                                     │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │ { lang: "en", content: { welcome: "Hello", ... } }      │   │
│   │ { lang: "fr", content: { welcome: "Bonjour", ... } }    │   │
│   └─────────────────────────────────────────────────────────┘   │
│                              │                                   │
│                              │ Sync on:                          │
│                              │ • Server startup                  │
│                              │ • API write operations            │
│                              │ • Manual refresh                  │
│                              ▼                                   │
│   In-Memory Cache (Node.js)                                      │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │ translationCache = {                                    │   │
│   │   en: { welcome: "Hello", goodbye: "Bye" },             │   │
│   │   fr: { welcome: "Bonjour", goodbye: "Au revoir" }      │   │
│   │ }                                                       │   │
│   └─────────────────────────────────────────────────────────┘   │
│                              │                                   │
│                              │ All GET requests                  │
│                              ▼                                   │
│   Frontend (React)                                               │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │ Displays data from cache (fast!)                        │   │
│   └─────────────────────────────────────────────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Data Flow by Operation

| Operation | Reads From | Writes To | Cache Updated? |
|-----------|------------|-----------|----------------|
| `GET /translations/:lang` | **Cache** | - | - |
| `PUT /translations/:lang/:key` | - | DynamoDB | ✅ Yes, immediately |
| `POST /translations/new` | - | DynamoDB | ✅ Yes, immediately |
| `POST /translations/:lang/retranslate` | Cache (English) | DynamoDB | ✅ Yes, immediately |
| `POST /translations/keys` | - | DynamoDB | ✅ Yes, immediately |
| `DELETE /translations/keys/:key` | - | DynamoDB | ✅ Yes, immediately |
| `DELETE /languages/:lang` | - | DynamoDB | ✅ Yes, immediately |
| `POST /cache/refresh` | DynamoDB | Cache | ✅ Full reload |

### When You Modify Data via API

Every write operation automatically updates both DynamoDB AND the cache:

```
┌─────────────────────────────────────────────────────────────┐
│           PUT /translations/en/welcome                       │
│           Body: { "value": "Hello World!" }                  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  Step 1: Write to DynamoDB                                   │
│  Step 2: Re-fetch from DynamoDB (verification)               │
│  Step 3: Update local cache ◄── Cache now has new value!    │
│  Step 4: Increment version number                            │
│  Step 5: Return updated data                                 │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│           GET /translations/en                               │
│           Returns: { welcome: "Hello World!", ... }          │
│                                                              │
│           Reads from cache (already updated!) ✓              │
└─────────────────────────────────────────────────────────────┘
```

### When Do You Need "Refresh Cache"?

| Scenario | Need Manual Refresh? |
|----------|---------------------|
| You update via API/Postman | ❌ No - Cache auto-updates |
| You update via Frontend UI | ❌ No - Cache auto-updates |
| Someone edits DynamoDB directly in AWS Console | ✅ **Yes** |
| Another server instance updates the data | ✅ **Yes** |
| Server restarts | ❌ No - Auto-loads on startup |

### Cache Version Tracking

The backend tracks cache synchronization state:

```javascript
cacheState = {
  lastSyncTime: 1701619200000,    // When cache was last synced
  lastDbModified: 1701619200000,  // When DB was last modified  
  version: 5,                      // Increments with each DB write
  isSynced: true                   // true if cache matches DB
}
```

**Frontend polls `/cache/status` every 30 seconds** to detect if another user/system modified the database. If versions don't match, the refresh button turns amber/orange.

---

## Prerequisites

- Node.js 18+
- AWS Account with:
  - DynamoDB table named "Translations"
  - AWS Translate access
  - IAM credentials with appropriate permissions

## AWS Setup

### 1. Create DynamoDB Table

Create a table with the following configuration:

- **Table Name**: `Translations`
- **Partition Key**: `lang` (String)

### 2. IAM Permissions

Your IAM user/role needs these permissions:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "dynamodb:GetItem",
        "dynamodb:PutItem",
        "dynamodb:UpdateItem",
        "dynamodb:DeleteItem",
        "dynamodb:Scan"
      ],
      "Resource": "arn:aws:dynamodb:*:*:table/Translations"
    },
    {
      "Effect": "Allow",
      "Action": [
        "translate:TranslateText"
      ],
      "Resource": "*"
    }
  ]
}
```

## Installation

### 1. Clone and Install Dependencies

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 2. Configure Environment Variables

**Backend** (`backend/.env`):

```bash
# Copy example and edit
cp env.example .env
```

Edit `.env` with your AWS credentials:

```env
# AWS Configuration
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key_here
AWS_SECRET_ACCESS_KEY=your_secret_key_here

# DynamoDB Table Name
DYNAMODB_TABLE_NAME=Translations

# Server Configuration
PORT=3001

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:5173
```

### 3. Start the Application

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

The application will be available at:
- Frontend: http://localhost:5173
- Backend API: http://localhost:3001

---

## API Endpoints

### Languages

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/languages` | Get list of available languages (from cache) |
| `GET` | `/api/languages/supported` | Get all AWS Translate supported languages |
| `POST` | `/api/translations/new` | Create a new language (translates from English) |
| `DELETE` | `/api/languages/:lang` | Delete a language (cannot delete English) |

### Translations

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/translations/:lang` | Get translations for a language (from cache) |
| `PUT` | `/api/translations/:lang/:key` | Update a single translation key |
| `POST` | `/api/translations/keys` | Add a new key to ALL languages |
| `DELETE` | `/api/translations/keys/:key` | Remove a key from ALL languages |
| `POST` | `/api/translations/:lang/:key/retranslate` | Re-translate a single key |
| `POST` | `/api/translations/:lang/retranslate` | Re-translate all keys for a language |

### Cache

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/cache/refresh` | Refresh entire cache from DynamoDB |
| `GET` | `/api/cache/status` | Get cache sync status (version, timestamps) |

### Health

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/health` | Health check with cache stats |

---

## Postman Collection

A complete Postman collection is included for API testing.

### Import Instructions

1. **Import Collection:**
   - Open Postman
   - Click **Import** button
   - Select `backend/postman/Translation_Manager_API.postman_collection.json`

2. **Import Environment:**
   - Click **Environments** (gear icon)
   - Click **Import**
   - Select `backend/postman/Translation_Manager_Local.postman_environment.json`
   - Select "Translation Manager - Local" from dropdown

### Collection Variables

| Variable | Default Value | Description |
|----------|---------------|-------------|
| `baseUrl` | `http://localhost:3001/api` | API base URL |
| `language` | `en` | Default language for testing |
| `targetLanguage` | `fr` | Target language for testing |
| `translationKey` | `welcome` | Translation key for testing |

---

## Project Structure

```
translate-manager/
├── backend/
│   ├── server.js              # Express server entry point
│   ├── aws/
│   │   ├── config.js          # AWS configuration
│   │   ├── dynamoClient.js    # DynamoDB operations
│   │   └── translateClient.js # AWS Translate operations
│   ├── cache/
│   │   └── translationCache.js # In-memory cache + version tracking
│   ├── routes/
│   │   └── translations.js    # API routes
│   ├── services/
│   │   └── translationService.js # Business logic
│   ├── utils/
│   │   └── asyncHandler.js    # Express utilities
│   └── postman/
│       ├── Translation_Manager_API.postman_collection.json
│       └── Translation_Manager_Local.postman_environment.json
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx            # Main app component
│   │   ├── main.jsx           # Entry point
│   │   ├── components/
│   │   │   ├── Header.jsx
│   │   │   ├── TranslationTable.jsx
│   │   │   ├── NewLanguageModal.jsx
│   │   │   ├── AddKeyModal.jsx
│   │   │   ├── ConfirmModal.jsx
│   │   │   ├── CacheStatus.jsx
│   │   │   ├── LoadingSpinner.jsx
│   │   │   └── Toast.jsx
│   │   ├── hooks/
│   │   │   └── useTranslations.js
│   │   ├── services/
│   │   │   └── api.js         # Axios API client
│   │   └── styles/
│   │       └── index.css      # TailwindCSS styles
│   ├── index.html
│   ├── vite.config.js
│   └── tailwind.config.js
│
└── README.md
```

---

## Usage Guide

### Adding a New Language

1. Select **English** from the language dropdown
2. Click **"New Language"** button
3. Search or select from 40+ supported languages
4. Click **"Create Language"**
5. Wait for AWS Translate to process all keys

### Adding/Removing Translation Keys

**Add Key** (English only):
1. Select **English** from dropdown
2. Click **"Add Key"** button
3. Enter key name and English value
4. Key is automatically translated to all existing languages

**Remove Key** (English only):
1. Select **English** from dropdown
2. Click the trash icon next to any key
3. Confirm deletion
4. Key is removed from ALL languages

### Editing Translations

1. Select a language from the dropdown
2. Edit any translation field
3. Click the ✓ (save) button to persist changes

### Re-translating

- **Single Key**: Click the refresh icon next to any field (non-English only)
- **Entire Language**: Click **"Re-Translate All"** button (non-English only)

### Deleting a Language

1. Select a non-English language
2. Click **"Delete Language"** button
3. Confirm deletion
4. Language is removed from DynamoDB and cache

### Refreshing Cache

Click the refresh icon in the **Cache** status card to reload all data from DynamoDB.

The refresh button turns **amber/orange** when:
- The system detects DynamoDB may have been modified externally
- Another user/system made changes

---

## UI Features by Language

| Feature | English | Other Languages |
|---------|---------|-----------------|
| Add Key | ✅ Yes | ❌ No |
| Remove Key | ✅ Yes | ❌ No |
| New Language | ✅ Yes | ❌ No |
| Re-translate Key | ❌ No | ✅ Yes |
| Re-translate All | ❌ No | ✅ Yes |
| Delete Language | ❌ No | ✅ Yes |
| Edit Values | ✅ Yes | ✅ Yes |
| Save Changes | ✅ Yes | ✅ Yes |

---

## Cost Considerations

AWS Translate charges per character translated. To minimize costs:

- Translations only occur when explicitly requested
- Creating a new language translates all keys once
- Adding a key translates to existing languages once
- Re-translate only when necessary
- The cache prevents unnecessary DB reads

---

## Troubleshooting

### "Credentials not found" error
- Verify AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY in `.env`
- Ensure the IAM user has required permissions

### "Table not found" error
- Create the DynamoDB table named "Translations"
- Verify AWS_REGION matches your table's region

### CORS errors
- Ensure FRONTEND_URL in backend `.env` matches your frontend URL
- Default is `http://localhost:5173`

### Cache seems stale
- Click the refresh button in the Cache status card
- This reloads all data from DynamoDB

### Translation not updating
- Check browser console for errors
- Verify the backend is running
- Check backend logs for AWS errors

---

## License

MIT


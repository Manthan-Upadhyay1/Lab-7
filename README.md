# DineMate AI – MERN Stack (CRUD with MongoDB, Express, React, Node)

The DineMate AI React app, now backed by **MongoDB** through a **Node.js + Express** API
(instead of JSON Server). It performs full **CRUD** on *Dining Profiles* (saved restaurant
preferences) and adds a **search** that runs as a MongoDB query.

```
React (Frontend) → fetch() → Express route → Node.js → Mongoose → MongoDB → Profile document stored
```

## Project structure (same layout as the lab slides)

```
dinemate-mern/
├── client/                      React + Vite app
│   ├── src/
│   │   ├── components/          ui/, profiles/, demo/, layout/, sections/
│   │   ├── hooks/               useProfiles.js (state + CRUD + debounced search) …
│   │   ├── services/            profileApi.js  ← all fetch() calls to the API
│   │   └── …
│   └── .env                     VITE_API_URL, VITE_GOOGLE_MAPS_API_KEY
└── server/
    ├── server.js                Express app + MongoDB connection
    ├── models/Profile.js        Mongoose schema (validation lives here)
    ├── routes/profiles.js       the 5 REST routes
    ├── seed/                    6 sample profiles  (npm run seed)
    └── .env                     PORT, MONGO_URI
```

## 1. Install MongoDB (once)

**Windows** – follow the slides: download *MongoDB Community Server* (msi, "Complete"), keep
the service defaults, untick Compass if you like, add `C:\Program Files\MongoDB\Server\8.2\bin`
to the system `Path`, then install **MongoDB Shell (mongosh)** separately. Verify: `mongod --version`.
MongoDB runs as a Windows service, so you do not need to start it by hand.

**Mac** (Homebrew)
```bash
brew tap mongodb/brew
brew install mongodb-community@8.0
brew services start mongodb-community@8.0      # or:  mongod --dbpath ~/data/db
```

*No local install?* Create a free **MongoDB Atlas** cluster and put its `mongodb+srv://…` string in `server/.env` as `MONGO_URI`.

## 2. Install and run

```bash
npm install            # root: installs "concurrently"
npm run install:all    # installs client/ and server/ dependencies
npm run seed           # (optional) loads 6 sample profiles into MongoDB
npm run dev            # starts the API (3001) and React (5173) together
```

Open **http://localhost:5173** and scroll to **My Profiles**.
Or run them separately in two terminals, as in the slides:
`cd server && node server.js`  and  `cd client && npm run dev`.

You should see `Server Running on Port 3001` and `MongoDB Connected Successfully`.

## 3. CRUD operations

| Operation | HTTP route | Mongoose call | MongoDB shell equivalent |
|---|---|---|---|
| **Create** | `POST /profiles` | `Profile.create(body)` | `db.profiles.insertOne({...})` |
| **Read** | `GET /profiles` | `Profile.find().sort({createdAt:-1})` | `db.profiles.find()` |
| **Search** | `GET /profiles/search/:name` | `Profile.find({ $or: [{ profileName: /name/i }, …] })` | `db.profiles.find({ profileName: /mumbai/i })` |
| **Update** | `PUT /profiles/:id` | `Profile.findByIdAndUpdate(id, {$set: body})` | `db.profiles.updateOne({_id}, {$set: {...}})` |
| **Delete** | `DELETE /profiles/:id` | `Profile.findByIdAndDelete(id)` | `db.profiles.deleteOne({_id})` |

Server-side safeguards: schema validation (name ≥ 3 chars, group size must be 1/2/4/6+, enums for
cuisine/budget/dietary/ambience), only whitelisted fields can be written, invalid ids → `400`,
unknown ids → `404`, database down → `503` with a readable message, search text is regex-escaped.

## 4. Verify in MongoDB (like slide 12)

```bash
mongosh
show dbs
use dinemateDB
show collections            # profiles
db.profiles.find().pretty()
db.profiles.countDocuments()
```

## 5. Quick API test without the UI

```bash
curl http://localhost:3001/profiles
curl http://localhost:3001/profiles/search/mumbai
curl -X POST http://localhost:3001/profiles -H "Content-Type: application/json" \
     -d '{"profileName":"Curl Dinner","destination":"Kochi","groupSize":"2"}'
```
(On Windows PowerShell use `curl.exe`, or test in the browser / Postman.)

## What changed from the JSON Server version

| | JSON Server version | MERN version |
|---|---|---|
| Database | `db.json` file | MongoDB collection `profiles` in `dinemateDB` |
| Backend | none (auto-generated REST) | hand-written Express routes + Mongoose model |
| Record id | numeric `id` | MongoDB `ObjectId` (API still returns it as `id`) |
| Validation | in the React form only | in the form **and** in the Mongoose schema |
| Search | filtered in the browser | `GET /profiles/search/:name`, debounced (250 ms) |
| Timestamps | set by the client | set by Mongoose (`timestamps: true`) |

The UI, design, animations and the AI demo are unchanged.

## Optional: offline phone preview

`cd client && npm run build:preview` builds a single `index.html` that keeps profiles in the
browser's localStorage (no API needed). It is only for quick demos on a phone.

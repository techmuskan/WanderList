
# WanderList

WanderList is a small Express + MongoDB web application for sharing travel listings and reviews. It includes user authentication, image uploads via Cloudinary, location maps using Mapbox, and a minimal responsive UI rendered with EJS.

This README documents how to set up, run and develop the project locally.

## Features

- Create, read, update and delete travel listings
- Add reviews to listings (authenticated users)
- User authentication and sessions (Passport.js)
- Image uploads (Cloudinary)
- Location display using Mapbox
- Server-side validation with Joi
- Pinboard to save favorite destinations

## Requirements

- Node.js (recommended LTS) — package.json specifies an `engines.node` value but any modern Node 18+ should work
- MongoDB (Atlas cloud URI or local MongoDB)
- A Cloudinary account (for image uploads)
- A Mapbox account (for map and geocoding tokens)

## Quick start

1. Install dependencies

	```powershell
	npm install
	```

2. Create a `.env` file in the project root (see Environment variables below)

3. Start the app in development mode

	```powershell
	npm run dev
	```

4. Open http://localhost:8080 in your browser (default port configured in `app.js`)

## Environment variables

Create a `.env` file at the project root and add the following keys (example names used in the codebase):

- ATLASDB_URL - MongoDB connection string (e.g. from MongoDB Atlas)
- SECRET - Session secret used by express-session
- CLOUD_NAME - Cloudinary cloud name
- CLOUD_API_KEY - Cloudinary API key
- CLOUD_API_SECRET - Cloudinary API secret
- MAP_TOKEN - Mapbox public token
- NODE_ENV - set to `production` in production deployments (optional)
- USE_MEMORY_STORE - set to `true` to use in-memory sessions (not recommended for production)

Example `.env` (do not commit to source control):

```text
ATLASDB_URL=mongodb+srv://<user>:<password>@cluster0.example.mongodb.net/wanderlist?retryWrites=true&w=majority
SECRET=your_session_secret_here
CLOUD_NAME=your_cloud_name
CLOUD_API_KEY=your_cloudinary_key
CLOUD_API_SECRET=your_cloudinary_secret
MAP_TOKEN=your_mapbox_token
NODE_ENV=development
```

## Project structure

- `src/app.js` — main Express application
- `src/controllers/` — route handler logic
- `src/models/` — Mongoose schemas (Listing, Review, User)
- `src/routes/` — Express routers
- `views/` — EJS templates
- `public/` — static assets (CSS, client JS, images)
- `src/middleware/` — custom middleware (e.g. auth, validation)
- `src/config/` — app configuration (Cloudinary, Joi schemas)
- `init/` — optional seed data or init scripts

## Scripts

- `npm run dev` — starts the server using nodemon (development)
- `npm start` — starts the server using node (production)
- `npm test` — placeholder test script (no tests configured)

You can also run the app directly with `node app.js` but nodemon is convenient in development.

## Notes on development

- The app uses `connect-mongo` to store sessions in MongoDB when `ATLASDB_URL` is provided.
- Image uploading uses `multer` + Cloudinary; `cloudConfig.js` reads Cloudinary credentials from environment variables.
- Map and geocoding features rely on Mapbox tokens (`MAP_TOKEN`).

## Deployment

This app is ready for standard Node.js hosting (Render, Railway, Fly.io, etc.). Use these guidelines:

1. Set `NODE_ENV=production`.
2. Ensure `ATLASDB_URL` points to your hosted MongoDB instance.
3. Set all required secrets (`SECRET`, Cloudinary, Mapbox).
4. Use the default `npm start` command (runs `node app.js`).
5. Make sure the hosting provider supplies `PORT` (the app listens on `process.env.PORT`).

If your hosting platform does not provide HTTPS by default, you must add it before using `NODE_ENV=production` because session cookies are marked `secure`.

## Troubleshooting

- MongoDB connection errors: verify `ATLASDB_URL` and network access to Atlas (IP allowlist).
- Cloudinary upload errors: verify `CLOUD_NAME`, `CLOUD_API_KEY`, and `CLOUD_API_SECRET`.
- Map features not showing: ensure `MAP_TOKEN` is set and is a valid Mapbox token.

## Contributing

If you'd like to contribute:

1. Fork the repository
2. Create a feature branch
3. Open a pull request with a clear description of changes

## License

This project is published under the ISC license (see `package.json`).

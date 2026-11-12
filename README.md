# EduHub

GitHub Repository: [EduHub](https://github.com/R3BEL-thewanderer/EduHub.git)

## Environment Variables

EduHub uses standardized environment variables across both frontend and backend to securely manage configurations across `development` and `production`.

### Frontend (.env)

- `VITE_APP_NAME`: Name of the application (e.g. `EduHub`)
- `VITE_APP_URL`: The host loopback URL for the frontend (e.g. `https://edu-hub.co.in`)
- `VITE_API_URL`: Backend API endpoint (e.g. `https://api.edu-hub.co.in`)
- `VITE_SUPABASE_URL`: Supabase backend endpoint
- `VITE_SUPABASE_ANON_KEY`: Supabase anon/public key for client
- `VITE_ENABLE_ADSENSE`: Boolean flag enabling Google AdSense script injection
- `VITE_GOOGLE_ADSENSE_CLIENT`: Publisher ID
- `VITE_ENVIRONMENT`: Must be set to `production` or `development`

### Backend (.env)

- `APP_NAME`, `APP_VERSION`, `ENVIRONMENT`: Core metadata
- `FRONTEND_URL`: URL to permit CORS requests from
- `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`: Admin privileges for DB integration
- `DATABASE_URL`: Connection string
- `NVIDIA_API_KEY`: API Key for NIM integrations
- `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`: Secrets for Razorpay
- `LOG_LEVEL`: Application logging verbosity (`DEBUG`, `INFO`)

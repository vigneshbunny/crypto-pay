
# Setup Instructions

## Required Environment Variables

This application requires a TRON API key to function properly. Follow these steps:

1. **Get a TRON API Key:**
   - Go to [TronGrid](https://www.trongrid.io/)
   - Sign up for a free account
   - Generate an API key

2. **Set Environment Variables:**
   - In your Replit project, go to the "Secrets" tab (lock icon in the sidebar)
   - Add the following secrets:
     - `TRON_API_KEY`: Your TronGrid API key
     - `ENCRYPTION_KEY`: A 32-character random string for encrypting private keys
     - `DATABASE_URL`: Your PostgreSQL connection string (if using external DB)

3. **For Development:**
   - The app will work with limited functionality without an API key
   - Wallet generation will work, but balance queries may fail
   - For full functionality, the API key is required

## Testing

After setting up the API key:
1. Try registering a new user
2. Check if wallet generation works
3. Test balance updates
4. Try the QR scanner functionality

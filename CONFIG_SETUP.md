# MapKit Configuration Setup

This project uses separate configuration files for development and production MapKit JS tokens.

## Setup Instructions

1. **Copy the example config files:**
   ```bash
   cp config-dev.json.example config-dev.json
   cp config-prod.json.example config-prod.json
   ```

2. **Add your MapKit JS tokens:**
   - Edit `config-dev.json` and replace `YOUR_DEV_MAPKIT_TOKEN_HERE` with your development token
   - Edit `config-prod.json` and replace `YOUR_PROD_MAPKIT_TOKEN_HERE` with your production token

3. **Configure domain restrictions:**
   - In your Apple Developer account, restrict your production token to your domain (e.g., `papaya.party`)
   - Your development token can be restricted to `localhost` or left unrestricted for local testing

## How It Works

- When running on `localhost` or `127.0.0.1`, the app loads `config-dev.json`
- When running on any other domain, the app loads `config-prod.json`
- The config files are in `.gitignore` to prevent accidentally committing your tokens

## Security Notes

- Never commit `config-dev.json` or `config-prod.json` to version control
- Always use domain restrictions on your production tokens
- Rotate your tokens periodically for security

# TikTok Ads Crawler

This project is a crawler for TikTok Ads using Crawlee and Playwright. It automates the process of logging into TikTok, handling cookie consent, and navigating through the site.

## Features

- Automated cookie consent handling
- Login with email/password
- Human-like behavior simulation to avoid detection
- Modular code structure for easy maintenance and extension

## Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure your credentials:
   - Copy `src/config.sample.ts` to `src/config.ts`
   - Update the email and password in `config.ts` with your TikTok credentials
   ```typescript
   export const config = {
       credentials: {
           email: 'your.actual.email@example.com',
           password: 'your_actual_password',
       },
       // ...
   };
   ```

## Running the Crawler

To run the crawler:

```bash
npm start
```

This will launch a browser, navigate to TikTok Ads, handle the cookie consent, log in with your credentials, and perform the specified actions.

## Project Structure

- `src/main.ts` - Entry point for the crawler
- `src/routes.ts` - Contains the routing logic and main flow of the crawler
- `src/steps.ts` - Contains modular functions for each step of the crawling process
- `src/config.ts` - Configuration file for credentials and settings (not committed to git)

## Customization

To customize the crawler's behavior, you can:

1. Modify the steps in `src/steps.ts` to add new functionality
2. Update the flow in `src/routes.ts` to change the sequence of actions
3. Adjust timing parameters in `src/config.ts` to control waiting periods

## Notes

- The crawler simulates human-like behavior by adding random delays between actions
- Make sure your TikTok credentials are correct and the account has the necessary permissions
- The crawler runs in non-headless mode by default for easier debugging

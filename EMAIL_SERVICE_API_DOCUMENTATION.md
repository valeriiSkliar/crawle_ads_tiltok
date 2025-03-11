# TikTok Mail Server API Guide

This guide provides a comprehensive overview of the TikTok Mail Server API, detailing each endpoint's functionality, request parameters, and response formats.

## API Overview

The TikTok Mail Server API is designed to retrieve, manage, and process verification codes sent via email, primarily for TikTok verification purposes. The server listens on port 3000 by default (configurable via environment variables).

## API Endpoints

### 1. Server Status Check
**Endpoint:** `GET /`

**Description:** Simple endpoint to verify the server is running.

**Response Example:**
```json
"Email server is running. Use /email?sender=example@domain.com to search for emails."
```

### 2. Retrieve Email by Sender
**Endpoint:** `GET /email?sender={senderEmail}`

**Description:** Fetches the latest email from a specified sender.

**Parameters:**
- `sender` (required): Email address of the sender to search for

**Response Example (Success - 200):**
```json
{
  "from": "notifications@tiktok.com",
  "subject": "Your TikTok Verification Code",
  "body": "Raw email content as string"
}
```

**Response Example (Not Found - 404):**
```json
{
  "message": "No matching emails found"
}
```

**Response Example (Error - 400):**
```json
{
  "error": "Missing sender parameter"
}
```

**Response Example (Authentication Error - 401):**
```json
{
  "error": "UKR.NET authentication failed",
  "details": "If you have 2FA enabled, you need to use an App Password. Go to https://myaccount.ukr.net/apppasswords to generate one."
}
```

### 3. Get TikTok Verification Code
**Endpoint:** `GET /tiktok-code`

**Description:** Specialized endpoint to extract and return TikTok verification codes from emails.

**Response:** Returns the extracted verification code and related information.

### 4. Delete TikTok Verification Code
**Endpoint:** `POST /tiktok-code/delete`

**Description:** Marks a TikTok verification code as deleted or used.

**Note:** This endpoint is deprecated and will be removed in future versions.

**Headers in Response:**
```
Deprecation: This endpoint is deprecated and will be removed in future versions.
```

### 5. Check Code Status
**Endpoint:** `GET /code-status`

**Description:** Checks the current status of a verification code (e.g., used, unused, expired).

**Response:** Returns the status information for the specified verification code.

### 6. List All Verification Codes
**Endpoint:** `GET /codes`

**Description:** Retrieves a list of all verification codes with optional filtering capabilities.

**Response:** Returns a list of verification codes matching the filter criteria.

### 7. Update Code Status
**Endpoint:** `POST /code-status/update`

**Description:** Updates the status of a verification code (e.g., mark as used).

**Request Body:**
```json
{
  "code": "123456",
  "status": "used"
}
```

**Response:** Confirms the status update operation.

## Core Functionality

This API serves as a bridge between email communications and TikTok verification processes by:

1. **Email Retrieval**: Connecting to an email server (UKR.NET) to fetch emails
2. **Code Extraction**: Parsing emails to extract verification codes
3. **Status Tracking**: Maintaining a database of verification codes and their statuses
4. **Code Management**: Providing endpoints to check, update, and delete verification codes

The system is particularly useful for automated verification workflows where TikTok sends verification codes via email that need to be programmatically retrieved and processed.

## Technical Implementation

The API is built with:
- Express.js for the web server framework
- Dotenv for environment variable management
- Custom handlers for each endpoint's business logic
- Dedicated services for mail operations and database interactions

## Error Handling

The API implements comprehensive error handling, providing specific error messages for common issues such as:
- Missing parameters
- Authentication failures
- Email retrieval errors
- Database operation failures

Each error response includes an appropriate HTTP status code and descriptive message to aid in troubleshooting.

import axios from 'axios';
import { Log } from 'crawlee';

// Email API service configuration
const EMAIL_API_BASE_URL = process.env.EMAIL_API_BASE_URL || 'http://localhost:3000';

// Interface for TikTok verification code response
interface TikTokVerificationCodeResponse {
  code?: string;
  timestamp?: string;
  status?: string;
  message?: string;
  error?: string;
}

// Interface for email response
interface EmailResponse {
  from?: string;
  subject?: string;
  body?: string;
  message?: string;
  error?: string;
}

// Interface for code status response
interface CodeStatusResponse {
  status: string;
  codes?: {
    code: string;
    timestamp: string;
    status: string;
  }[];
  message?: string;
  error?: string;
}

// Interface for all codes response
interface AllCodesResponse {
  codes: {
    code: string;
    timestamp: string;
    status: string;
    email?: string;
  }[];
  count: number;
  message?: string;
  error?: string;
}

/**
 * Email API Service for interacting with the TikTok Mail Server API
 */
export class EmailApiService {
  private log: Log;
  
  constructor(log: Log) {
    this.log = log;
  }

  /**
   * Get server status to check if the email API is running
   * @returns Promise with server status
   */
  async getServerStatus(): Promise<string> {
    try {
      const response = await axios.get(`${EMAIL_API_BASE_URL}/`);
      return response.data;
    } catch (error) {
      this.log.error('Failed to get email server status:', { error: (error as Error).message });
      throw new Error(`Email server connection failed: ${(error as Error).message}`);
    }
  }

  /**
   * Get the latest email from a specific sender
   * @param senderEmail Email address of the sender to search for
   * @returns Promise with the email data
   */
  async getEmailBySender(senderEmail: string): Promise<EmailResponse> {
    try {
      this.log.info(`Fetching email from sender: ${senderEmail}`);
      const response = await axios.get(`${EMAIL_API_BASE_URL}/email`, {
        params: { sender: senderEmail }
      });
      return response.data;
    } catch (error) {
      this.log.error('Failed to get email by sender:', { 
        sender: senderEmail, 
        error: (error as Error).message 
      });
      
      if (axios.isAxiosError(error) && error.response) {
        if (error.response.status === 404) {
          return { message: 'No matching emails found' };
        }
        return { error: error.response.data.error || error.message };
      }
      
      return { error: (error as Error).message };
    }
  }

  /**
   * Get TikTok verification code from the latest email
   * @returns Promise with the verification code data
   */
  async getTikTokVerificationCode(): Promise<TikTokVerificationCodeResponse> {
    try {
      this.log.info('Fetching TikTok verification code from email server');
      const response = await axios.get(`${EMAIL_API_BASE_URL}/tiktok-code`);
      
      if (response.data && response.data.code) {
        this.log.info('Successfully retrieved TikTok verification code');
        return response.data;
      } else {
        this.log.warning('No verification code found in response', { response: response.data });
        return { 
          message: 'No verification code found',
          ...response.data
        };
      }
    } catch (error) {
      this.log.error('Failed to get TikTok verification code:', { error: (error as Error).message });
      
      if (axios.isAxiosError(error) && error.response) {
        return { 
          error: error.response.data.error || error.message,
          status: 'error'
        };
      }
      
      return { 
        error: (error as Error).message,
        status: 'error'
      };
    }
  }

  /**
   * Check the status of verification codes
   * @returns Promise with the status information
   */
  async checkCodeStatus(): Promise<CodeStatusResponse> {
    try {
      const response = await axios.get(`${EMAIL_API_BASE_URL}/code-status`);
      return response.data;
    } catch (error) {
      this.log.error('Failed to check code status:', { error: (error as Error).message });
      throw new Error(`Failed to check code status: ${(error as Error).message}`);
    }
  }

  /**
   * List all verification codes
   * @returns Promise with list of verification codes
   */
  async listAllCodes(): Promise<AllCodesResponse> {
    try {
      const response = await axios.get(`${EMAIL_API_BASE_URL}/codes`);
      return response.data;
    } catch (error) {
      this.log.error('Failed to list verification codes:', { error: (error as Error).message });
      throw new Error(`Failed to list verification codes: ${(error as Error).message}`);
    }
  }
}

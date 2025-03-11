import axios from 'axios';
import { Log } from 'crawlee';

// Email API service configuration
const EMAIL_API_BASE_URL = process.env.EMAIL_API_BASE_URL || 'http://localhost:3000';

// Interface for TikTok verification code response
export interface TikTokVerificationCodeResponse {
  code?: string;
  timestamp?: string;
  status?: string;
  message?: string;
  error?: string;
}

// Interface for email response
export interface EmailResponse {
  from?: string;
  subject?: string;
  body?: string;
  message?: string;
  error?: string;
}

// Interface for code status response
export interface CodeStatusResponse {
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
export interface AllCodesResponse {
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

  /**
   * Update the status of a verification code after it has been used
   * @param code The verification code that was used
   * @param status The new status to set (e.g., 'used', 'expired')
   * @returns Promise with the updated code status
   */
  async updateCodeStatus(code: string, status: string = 'used'): Promise<CodeStatusResponse> {
    try {
      this.log.info(`Updating code status: ${code} to ${status}`);
      const response = await axios.post(`${EMAIL_API_BASE_URL}/code-status/update`, {
        code,
        status
      });
      
      this.log.info('Code status updated successfully');
      return response.data;
    } catch (error) {
      this.log.error('Failed to update code status:', { 
        code, 
        status, 
        error: (error as Error).message 
      });
      
      if (axios.isAxiosError(error) && error.response) {
        return { 
          status: 'error',
          message: error.response.data.error || error.message
        };
      }
      
      return { 
        status: 'error',
        message: (error as Error).message
      };
    }
  }

  /**
   * Get TikTok verification code with retries and polling
   * @param maxAttempts Maximum number of attempts to retrieve the code
   * @param pollingInterval Time in milliseconds between attempts
   * @returns Promise with the verification code or null if not found
   */
  async getTikTokVerificationCodeWithRetries(
    maxAttempts: number = 5,
    pollingInterval: number = 5000
  ): Promise<{ code: string; success: boolean; message?: string }> {
    this.log.info(`Starting verification code retrieval with ${maxAttempts} attempts`);
    
    let attempts = 0;
    
    while (attempts < maxAttempts) {
      attempts++;
      this.log.info(`Attempting to get verification code (attempt ${attempts}/${maxAttempts})...`);
      
      try {
        const codeResponse = await this.getTikTokVerificationCode();
        
        if (codeResponse.code) {
          this.log.info(`Successfully retrieved verification code: ${codeResponse.code}`);
          return { 
            code: codeResponse.code, 
            success: true 
          };
        } else {
          this.log.warning('No verification code found yet, waiting to retry...', { 
            response: codeResponse 
          });
          
          // Wait before trying again
          await new Promise(resolve => setTimeout(resolve, pollingInterval));
        }
      } catch (error) {
        this.log.error('Error retrieving verification code:', { error: (error as Error).message });
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, pollingInterval / 2));
      }
    }
    
    this.log.error(`Failed to retrieve verification code after ${maxAttempts} attempts`);
    return { 
      code: '', 
      success: false, 
      message: `Failed to retrieve verification code after ${maxAttempts} attempts` 
    };
  }

  /**
   * Complete verification code workflow: get code, use it, and update status
   * @param useCallback Function to execute with the verification code (e.g., entering it in a form)
   * @param maxAttempts Maximum number of attempts to retrieve the code
   * @param pollingInterval Time in milliseconds between attempts
   * @returns Promise with the result of the verification process
   */
  async completeVerificationCodeWorkflow(
    useCallback: (code: string) => Promise<boolean>,
    maxAttempts: number = 5,
    pollingInterval: number = 5000
  ): Promise<{ success: boolean; message: string }> {
    try {
      // Get verification code with retries
      const { code, success, message } = await this.getTikTokVerificationCodeWithRetries(
        maxAttempts,
        pollingInterval
      );
      
      if (!success || !code) {
        return { 
          success: false, 
          message: message || 'Failed to retrieve verification code' 
        };
      }
      
      // Use the code via the provided callback
      this.log.info(`Using verification code: ${code}`);
      const codeUsedSuccessfully = await useCallback(code);
      
      if (codeUsedSuccessfully) {
        // Update code status if used successfully
        await this.updateCodeStatus(code, 'used');
        return { 
          success: true, 
          message: 'Verification completed successfully' 
        };
      } else {
        // Mark code as failed if not used successfully
        await this.updateCodeStatus(code, 'used');
        return { 
          success: false, 
          message: 'Verification code was retrieved but could not be used successfully' 
        };
      }
    } catch (error) {
      this.log.error('Error in verification code workflow:', { error: (error as Error).message });
      return { 
        success: false, 
        message: `Verification process failed: ${(error as Error).message}` 
      };
    }
  }
}



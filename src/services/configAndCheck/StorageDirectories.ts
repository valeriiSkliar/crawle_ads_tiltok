import { existsSync, mkdirSync } from 'fs';
import path from 'path';

export class StorageDirectories {
  private storageDir: string;
  private screenshotsDir: string;
  private dataDir: string;
  private apiResponsesDir: string;

  constructor() {
    this.storageDir = path.resolve(process.cwd(), 'storage');
    this.screenshotsDir = path.resolve(this.storageDir, 'screenshots');
    this.dataDir = path.resolve(this.storageDir, 'data');
    this.apiResponsesDir = path.resolve(this.storageDir, 'api-responses');
  }

  /**
   * Ensures all required storage directories exist
   */
  public ensureDirectories(): void {
    if (!existsSync(this.storageDir)) mkdirSync(this.storageDir, { recursive: true });
    if (!existsSync(this.screenshotsDir)) mkdirSync(this.screenshotsDir, { recursive: true });
    if (!existsSync(this.dataDir)) mkdirSync(this.dataDir, { recursive: true });
    if (!existsSync(this.apiResponsesDir)) mkdirSync(this.apiResponsesDir, { recursive: true });
    
    console.log('Storage directories created/verified');
  }

  /**
   * Get the path to the storage directory
   */
  public getStorageDir(): string {
    return this.storageDir;
  }

  /**
   * Get the path to the screenshots directory
   */
  public getScreenshotsDir(): string {
    return this.screenshotsDir;
  }

  /**
   * Get the path to the data directory
   */
  public getDataDir(): string {
    return this.dataDir;
  }

  /**
   * Get the path to the API responses directory
   */
  public getApiResponsesDir(): string {
    return this.apiResponsesDir;
  }
}

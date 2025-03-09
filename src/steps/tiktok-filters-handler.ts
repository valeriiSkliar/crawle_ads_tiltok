import { ElementHandle, Page } from 'playwright';
import { Log } from 'crawlee';

/**
 * Filter types supported by the TikTok Ads platform
 */
export enum FilterType {
  REGION = 'region',
  INDUSTRY = 'industry',
  OBJECTIVE = 'objective',
  PERIOD = 'period',
  AD_LANGUAGE = 'adLanguage',
  AD_FORMAT = 'adFormat',
  LIKES = 'likes'
}

/**
 * Interface for filter options
 */
export interface FilterOption {
  value: string;
  label: string;
}

/**
 * Interface for filter configuration
 */
export interface FilterConfig {
  [FilterType.REGION]?: string[] | null;
  [FilterType.INDUSTRY]?: string[] | null;
  [FilterType.OBJECTIVE]?: string[] | null;
  [FilterType.PERIOD]?: string | null;
  [FilterType.AD_LANGUAGE]?: string[] | null;
  [FilterType.AD_FORMAT]?: string | null;
  [FilterType.LIKES]?: string[] | null;
}

/**
 * Filter element with metadata
 */
export interface FilterElement {
  id: string;
  type: FilterType;
  element: ElementHandle; // Playwright element
  selector: string;
  isSingleSelect: boolean;
  currentValue?: string | string[] | null;
  options?: FilterOption[];
}

/**
 * Mapping between filter IDs and filter types
 */
const FILTER_ID_TO_TYPE = {
  'topadsRegion': FilterType.REGION,
  'topadsIndustry': FilterType.INDUSTRY, // Assuming this exists
  'topadsObjective': FilterType.OBJECTIVE,
  'topadsPeriod': FilterType.PERIOD,
  'topadsAdLanguage': FilterType.AD_LANGUAGE,
  'topadsFilterAdsFormat': FilterType.AD_FORMAT,
  'topadsLikes': FilterType.LIKES
};

/**
 * Selectors for filter elements
 */
const FILTER_SELECTORS = [
  '#topadsRegion',
  '.byted-cascader.TopadsListFilter_industrySelect__viLb7', // Industry selector
  '#topadsObjective',
  '#topadsPeriod',
  '#topadsAdLanguage',
  '#topadsFilterAdsFormat',
  '#topadsLikes'
];

/**
 * Finds all filter elements on the page and converts them to manageable objects
 * @param page - Playwright page object
 * @param log - Logger instance
 * @returns Promise<FilterElement[]> - Array of filter elements
 */
export async function findFilterElements(page: Page, log: Log): Promise<FilterElement[]> {
  log.info('Finding filter elements on the page...');
  
  const filterElements: FilterElement[] = [];
  
  // Take a screenshot for debugging
  await page.screenshot({ path: 'storage/screenshots/filters-check.png' });
  
  for (const selector of FILTER_SELECTORS) {
    try {
      const elements = await page.$$(selector);
      
      for (const element of elements) {
        // Extract ID from element
        const id = await element.getAttribute('id') || '';
        const filterType = id ? (FILTER_ID_TO_TYPE as Record<string, FilterType>)[id] : null;
        
        if (!filterType && selector.includes('industry')) {
          // Special case for industry which might not have an ID
          filterElements.push({
            id: 'topadsIndustry',
            type: FilterType.INDUSTRY,
            element,
            selector,
            isSingleSelect: !selector.includes('multiple')
          });
          continue;
        }
        
        if (!filterType) {
          log.debug(`No filter type found for element with selector ${selector}`);
          continue;
        }
        
        // Determine if single or multi-select
        const isSingleSelect = !(await element.getAttribute('class') || '').includes('multiple');
        
        // Create filter element object
        filterElements.push({
          id,
          type: filterType,
          element,
          selector,
          isSingleSelect
        });
        
        log.info(`Found filter element: ${id} (${filterType})`);
      }
    } catch (error) {
      log.error(`Error finding filter element with selector ${selector}:`, { error: (error as Error).message });
    }
  }
  
  log.info(`Found ${filterElements.length} filter elements in total`);
  
  // Take another screenshot after finding filters
  await page.screenshot({ path: 'storage/screenshots/filters-found.png' });
  
  return filterElements;
}

/**
 * Clears all selections in a multi-select filter
 * @param page - Playwright page object
 * @param filter - Filter element to clear
 * @param log - Logger instance
 * @returns Promise<void>
 */
async function clearFilterSelections(page: Page, filter: FilterElement, log: Log): Promise<void> {
  log.info(`Clearing selections for filter ${filter.type}`);
  
  try {
    // Click on the filter to open dropdown
    await filter.element.click();
    
    // Wait for dropdown to appear
    await page.waitForTimeout(500);
    
    // Find all close buttons for selected items
    const closeButtons = await page.$$('.CcMultiSelect_ccItemLabelClose__F3dTP, .i-icon-close-small');
    
    if (closeButtons.length > 0) {
      log.info(`Found ${closeButtons.length} selected items to clear`);
      
      // Click each close button to remove the selection
      for (const button of closeButtons) {
        await button.click();
        await page.waitForTimeout(300); // Small delay between clicks
      }
    } else {
      log.info('No selections to clear');
    }
    
    // Click outside to close the dropdown
    await page.click('body', { position: { x: 10, y: 10 } });
    await page.waitForTimeout(500);
  } catch (error) {
    log.error(`Error clearing selections for filter ${filter.type}:`, { error: (error as Error).message });
  }
}

/**
 * Applies filter configuration to the found filter elements
 * @param page - Playwright page object
 * @param log - Logger instance
 * @param filterElements - Array of filter elements
 * @param filterConfig - Filter configuration to apply
 * @returns Promise<boolean> - Whether filters were applied successfully
 */
export async function applyFilters(
  page: Page, 
  log: Log, 
  filterElements: FilterElement[], 
  filterConfig: FilterConfig
): Promise<boolean> {
  log.info('Applying filters from configuration...');
  
  try {
    for (const filter of filterElements) {
      const filterValue = filterConfig[filter.type];
      
      if (filterValue === undefined) {
        log.debug(`No configuration for filter type ${filter.type}, skipping`);
        continue;
      }
      
      // Skip if this is a region filter and the array is empty
      if (filter.type === FilterType.REGION && Array.isArray(filterValue) && filterValue.length === 0) {
        log.info(`Region filter has empty array, clearing any existing selections`);
        await clearFilterSelections(page, filter, log);
        continue;
      }
      
      log.info(`Applying filter for ${filter.type} with value:`, {filterValue});
      
      // Click on the filter to open dropdown
      await filter.element.click();
      
      // Wait for dropdown to appear
      await page.waitForTimeout(500);
      
      if (filter.isSingleSelect) {
        // Single select filter
        if (typeof filterValue === 'string' && filterValue) {
          const optionSelector = `div[title="${filterValue}"], div.option-content:has-text("${filterValue}")`;
          await page.click(optionSelector).catch(async () => {
            // If direct click fails, try to find and click the option
            log.debug(`Could not find option with exact text "${filterValue}", trying partial match`);
            const options = await page.$$('div.byted-select-option');
            for (const option of options) {
              const text = await option.textContent();
              if (text && text.includes(filterValue)) {
                await option.click();
                break;
              }
            }
          });
        }
      } else {
        // Multi-select filter
        if (Array.isArray(filterValue) && filterValue.length > 0) {
          for (const value of filterValue) {
            const optionSelector = `div[title="${value}"], div.option-content:has-text("${value}")`;
            await page.click(optionSelector).catch(async () => {
              // If direct click fails, try to find and click the option
              log.debug(`Could not find option with exact text "${value}", trying partial match`);
              const options = await page.$$('div.byted-select-option');
              for (const option of options) {
                const text = await option.textContent();
                if (text && text.includes(value)) {
                  await option.click();
                  break;
                }
              }
            });
            
            // Wait a bit between selections
            await page.waitForTimeout(300);
          }
        } else if (Array.isArray(filterValue) && filterValue.length === 0) {
          log.info(`Multi-select filter has empty array, clearing any existing selections`);
          await clearFilterSelections(page, filter, log);
        }
      }
      
      // Close the dropdown by clicking elsewhere
      await page.click('body').catch(() => {});
      
      // Wait for dropdown to close
      await page.waitForTimeout(500);
    }
    
    // Take a screenshot after applying filters
    await page.screenshot({ path: 'storage/screenshots/filters-applied.png' });
    
    log.info('Filters applied successfully');
    return true;
  } catch (error) {
    log.error('Error applying filters:', { error: (error as Error).message });
    await page.screenshot({ path: 'storage/screenshots/filters-error.png' });
    return false;
  }
}

/**
 * Main function to find and apply filters based on configuration
 * @param page - Playwright page object
 * @param log - Logger instance
 * @param filterConfig - Filter configuration to apply
 * @returns Promise<boolean> - Whether filters were found and applied successfully
 */
export async function handleFilters(page: Page, log: Log, filterConfig: FilterConfig): Promise<boolean> {
  try {
    // First find all filter elements
    const filterElements = await findFilterElements(page, log);
    
    if (filterElements.length === 0) {
      log.warning('No filter elements found on the page');
      return false;
    }
    
    // Then apply filters
    return await applyFilters(page, log, filterElements, filterConfig);
  } catch (error) {
    log.error('Error in filter handling:', { error: (error as Error).message });
    return false;
  }
}

/**
 * Example usage in your application:
 * 
 * import { handleFilters, FilterType } from './filters-handler';
 * 
 * // In your router or main function
 * const filterConfig = {
 *   [FilterType.REGION]: ['United States', 'Canada'],
 *   [FilterType.INDUSTRY]: ['E-commerce'],
 *   [FilterType.PERIOD]: 'Last 30 days'
 * };
 * 
 * await handleFilters(page, log, filterConfig);
 */
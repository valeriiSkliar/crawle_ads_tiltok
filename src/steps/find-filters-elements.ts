import { Page } from 'playwright';

/**
 * Interface representing a filter element on the TikTok Ads page
 */
export interface FilterElement {
  id: string;           // Element ID (e.g., 'topadsRegion', 'topadsObjective')
  type: FilterType;     // Type of filter (e.g., 'multiSelect', 'singleSelect')
  name: string;         // Human-readable name of the filter
  currentValue?: string | string[]; // Current selected value(s)
  selector: string;     // CSS selector to find this element
}

/**
 * Enum of filter types
 */
export enum FilterType {
  MULTI_SELECT = 'multiSelect',
  SINGLE_SELECT = 'singleSelect',
  CASCADER = 'cascader',
}

/**
 * Configuration interface for filter values
 */
export interface FilterConfig {
  region?: string[];       // Country/region codes
  industry?: string[];     // Industry categories
  objective?: string[];    // Campaign objectives
  period?: string;         // Time period (e.g., 'Last 7 days')
  adLanguage?: string[];   // Ad language codes
  adFormat?: string;       // Ad format
  likes?: string[];        // Likes range
}

/**
 * Finds all filter elements on the TikTok Ads page and converts them into manageable objects
 * 
 * @param page - Playwright Page instance
 * @param config - Optional filter configuration to apply
 * @returns Promise<FilterElement[]> - Array of filter elements found on the page
 */
export async function findFilterElements(page: Page, config?: FilterConfig): Promise<FilterElement[]> {
  console.log('Finding filter elements on the page...');
  
  // Wait for the filter container to be visible
  await page.waitForSelector('.TopadsListFilter_noneInputWrap__CtWQj', { timeout: 30000 });
  
  // Find all filter elements
  const filterElements: FilterElement[] = [];
  
  // Region filter (Multi-select)
  const regionFilter = await findFilterById(page, 'topadsRegion', FilterType.MULTI_SELECT, 'Region');
  if (regionFilter) filterElements.push(regionFilter);
  
  // Industry filter (Cascader)
  const industryFilter = await findCascaderFilter(page, 'Industry', FilterType.CASCADER);
  if (industryFilter) filterElements.push(industryFilter);
  
  // Objective filter (Multi-select)
  const objectiveFilter = await findFilterById(page, 'topadsObjective', FilterType.MULTI_SELECT, 'Objective');
  if (objectiveFilter) filterElements.push(objectiveFilter);
  
  // Period filter (Single-select)
  const periodFilter = await findFilterById(page, 'topadsPeriod', FilterType.SINGLE_SELECT, 'Period');
  if (periodFilter) filterElements.push(periodFilter);
  
  // Ad Language filter (Multi-select)
  const adLanguageFilter = await findFilterById(page, 'topadsAdLanguage', FilterType.MULTI_SELECT, 'Ad Language');
  if (adLanguageFilter) filterElements.push(adLanguageFilter);
  
  // Ad Format filter (Single-select)
  const adFormatFilter = await findFilterById(page, 'topadsFilterAdsFormat', FilterType.SINGLE_SELECT, 'Ad Format');
  if (adFormatFilter) filterElements.push(adFormatFilter);
  
  // Likes filter (Multi-select)
  const likesFilter = await findFilterById(page, 'topadsLikes', FilterType.MULTI_SELECT, 'Likes');
  if (likesFilter) filterElements.push(likesFilter);
  
  console.log(`Found ${filterElements.length} filter elements`);
  
  // Apply configuration if provided
  if (config) {
    console.log('Applying filter configuration:', config);
    // The actual application of filters will be handled by the set-filters.ts file
  }
  
  return filterElements;
}

/**
 * Helper function to find a filter element by its ID
 * 
 * @param page - Playwright Page instance
 * @param id - Element ID
 * @param type - Filter type
 * @param name - Human-readable name
 * @returns Promise<FilterElement | null> - Filter element or null if not found
 */
async function findFilterById(
  page: Page, 
  id: string, 
  type: FilterType, 
  name: string
): Promise<FilterElement | null> {
  try {
    const selector = `#${id}`;
    const exists = await page.$(selector);
    
    if (!exists) {
      console.warn(`Filter element with ID ${id} not found`);
      return null;
    }
    
    // Get current value if available
    let currentValue: string | string[] | undefined;
    
    if (type === FilterType.SINGLE_SELECT) {
      // For single select, try to get the selected text
      const selectedText = await page.$eval(
        `${selector} .CcSelect_ccItemLabelContent__Qe4o_`, 
        (el) => el.textContent
      ).catch(() => null);
      
      if (selectedText) {
        currentValue = selectedText;
      }
    } else if (type === FilterType.MULTI_SELECT) {
      // For multi-select, get all selected items
      const selectedItems = await page.$$eval(
        `${selector} .CcMultiSelect_ccItemLabelContent__1dXUL`, 
        (elements) => elements.map(el => el.textContent)
      ).catch(() => []);
      
      if (selectedItems && selectedItems.length > 0) {
        currentValue = selectedItems.filter(Boolean) as string[];
      }
    }
    
    return {
      id,
      type,
      name,
      currentValue,
      selector
    };
  } catch (error) {
    console.error(`Error finding filter element ${id}:`, error);
    return null;
  }
}

/**
 * Helper function to find a cascader filter element
 * 
 * @param page - Playwright Page instance
 * @param name - Human-readable name
 * @param type - Filter type
 * @returns Promise<FilterElement | null> - Filter element or null if not found
 */
async function findCascaderFilter(
  page: Page,
  name: string,
  type: FilterType
): Promise<FilterElement | null> {
  try {
    const selector = '.byted-cascader-multiple-input-trigger';
    const exists = await page.$(selector);
    
    if (!exists) {
      console.warn(`Cascader filter element for ${name} not found`);
      return null;
    }
    
    // For cascader, we use a different approach since it doesn't have a specific ID
    return {
      id: `cascader${name.replace(/\s+/g, '')}`,
      type,
      name,
      selector
    };
  } catch (error) {
    console.error(`Error finding cascader filter for ${name}:`, error);
    return null;
  }
}
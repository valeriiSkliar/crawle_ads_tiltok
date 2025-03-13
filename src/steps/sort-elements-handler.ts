import { Page } from 'playwright';
import { Log } from 'crawlee';

/**
 * Interface representing a sort option element on the TikTok Ads page
 */
export interface SortElement {
  id: string;           // Element ID (e.g., 'sort-for-you', 'sort-reach')
  type: SortType;       // Type of sort option
  name: string;         // Human-readable name of the sort option
  isSelected: boolean;  // Whether this sort option is currently selected
  selector: string;     // CSS selector to find this element
  testId?: string;      // Test ID attribute value if available
}

/**
 * Enum of sort types
 */
export enum SortType {
  FOR_YOU = 'forYou',
  REACH = 'reach',
  CTR = 'ctr',
  CUSTOM = 'custom'     // For dropdown options like "Others"
}

/**
 * Configuration interface for sort values
 */
export interface SortConfig {
  sortBy?: SortType;    // Which sort option to use
  customValue?: string; // Custom sort option from dropdown if using CUSTOM type
}

/**
 * Finds all sort option elements on the TikTok Ads page and converts them into manageable objects
 * 
 * @param page - Playwright Page instance
 * @param log - Crawlee logger instance
 * @returns Promise<SortElement[]> - Array of sort elements found on the page
 */
export async function findSortElements(page: Page, log: Log): Promise<SortElement[]> {
  log.info('Finding sort elements on the page...');
  
  // Wait for the sort container to be visible
  await page.waitForSelector('.TopadsListFilter_sortByContainer__lBXKp', { timeout: 30000 });
  
  // Capture a screenshot to help with debugging
  await page.screenshot({ path: 'storage/screenshots/sort-elements-detection.png' });
  
  // Find all sort option elements
  const sortElements: SortElement[] = [];
  
  // Find sort items with direct selectors
  const sortItemSelectors = [
    '[data-testid^="cc_commonCom_sortCom_item-"]'
  ];
  
  // Process each sort item
  for (const selector of sortItemSelectors) {
    try {
      const elements = await page.$$(selector);
      log.info(`Found ${elements.length} sort elements with selector: ${selector}`);
      
      for (let i = 0; i < elements.length; i++) {
        const element = elements[i];
        
        // Get the test ID attribute
        const testId = await element.getAttribute('data-testid') || '';
        
        // Get the text content to determine the name
        const textContent = await element.textContent() || '';
        const nameParts = textContent.split(/\s+/).filter(Boolean);
        const name = nameParts.find(part => 
          ['For You', 'Reach', 'CTR'].includes(part)
        ) || '';
        
        if (!name) {
          log.warning(`Could not determine name for sort element with testId: ${testId}`);
          continue;
        }
        
        // Determine if this element is selected (active)
        const isSelected = await element.evaluate(el => {
          const labelElement = el.querySelector('.SortItem_sortItemLabel___LxJN');
          return labelElement ? 
            window.getComputedStyle(labelElement).color === 'rgb(254, 44, 85)' : 
            false;
        });
        
        // Determine type based on name
        let type = SortType.CUSTOM;
        if (name.includes('For You')) type = SortType.FOR_YOU;
        else if (name === 'Reach') type = SortType.REACH;
        else if (name === 'CTR') type = SortType.CTR;
        
        // Create a unique ID
        const id = `sort-${type.toLowerCase()}`;
        
        sortElements.push({
          id,
          type,
          name,
          isSelected,
          selector: `[data-testid="${testId}"]`,
          testId
        });
        
        log.info(`Added sort element: ${name} (${type}), selected: ${isSelected}`);
      }
    } catch (error) {
      log.error(`Error finding sort elements with selector ${selector}:`, { error: (error as Error).message });
    }
  }
  
  // Look for the dropdown sort selector ("Others")
  try {
    const dropdownSelector = '[data-testid="cc_rimless_select_undefined"]';
    const dropdown = await page.$(dropdownSelector);
    
    if (dropdown) {
      // Get the currently selected value text
      const selectedText = await dropdown.$eval('.TopadsListFilter_sortBySelectLabel__aLCoD', 
        el => el.textContent?.trim() || 'Others'
      ).catch(() => 'Others');
      
      sortElements.push({
        id: 'sort-custom',
        type: SortType.CUSTOM,
        name: selectedText,
        isSelected: false, // Usually not pre-selected
        selector: dropdownSelector
      });
      
      log.info(`Added custom sort dropdown with current value: ${selectedText}`);
    }
  } catch (error) {
    log.error('Error finding custom sort dropdown:', { error: (error as Error).message });
  }
  
  log.info(`Found ${sortElements.length} sort elements in total`);
  return sortElements;
}

/**
 * Applies the selected sort option
 * 
 * @param page - Playwright Page instance
 * @param log - Crawlee logger instance
 * @param sortConfig - Sort configuration to apply
 * @returns Promise<boolean> - Whether sort was applied successfully
 */
export async function applySortOption(
  page: Page, 
  log: Log, 
  sortConfig: SortConfig
): Promise<boolean> {
  try {
    log.info(`Applying sort option: ${sortConfig.sortBy}${sortConfig.customValue ? ` (${sortConfig.customValue})` : ''}`);
    
    // Find all sort elements
    const sortElements = await findSortElements(page, log);
    
    if (sortElements.length === 0) {
      log.warning('No sort elements found on the page');
      return false;
    }
    
    // Find the sort element that matches our config
    let targetSort: SortElement | undefined;
    
    if (sortConfig.sortBy !== SortType.CUSTOM) {
      // For standard sort options (For You, Reach, CTR)
      targetSort = sortElements.find(sort => sort.type === sortConfig.sortBy);
    } else if (sortConfig.customValue) {
      // For custom sort from dropdown
      targetSort = sortElements.find(sort => sort.type === SortType.CUSTOM);
    }
    
    if (!targetSort) {
      log.warning(`Could not find sort element matching config: ${sortConfig.sortBy}`);
      return false;
    }
    
    // If the target sort is already selected, no need to click
    if (targetSort.isSelected && sortConfig.sortBy !== SortType.CUSTOM) {
      log.info(`Sort option ${targetSort.name} is already selected`);
      return true;
    }
    
    log.info(`Clicking sort element: ${targetSort.name} (${targetSort.type})`);
    
    if (targetSort.type !== SortType.CUSTOM) {
      // For standard sort options, just click the element
      await page.click(targetSort.selector);
      await page.waitForTimeout(1000); // Wait for sorting to take effect
      
      // Verify the sort was applied by checking if it's now selected
      const updatedSortElements = await findSortElements(page, log);
      const updatedTargetSort = updatedSortElements.find(sort => sort.type === sortConfig.sortBy);
      
      if (updatedTargetSort?.isSelected) {
        log.info(`Successfully applied sort: ${targetSort.name}`);
        return true;
      } else {
        log.warning(`Sort element was clicked but not selected: ${targetSort.name}`);
        return false;
      }
    } else {
      // For custom sort from dropdown
      if (!sortConfig.customValue) {
        log.warning('Cannot apply custom sort without customValue');
        return false;
      }
      
      // Click the dropdown to open it
      await page.click(targetSort.selector);
      await page.waitForTimeout(500);
      
      // Try to find and click the option with the specified text
      const optionSelector = `.byted-select-dropdown-option-content:has-text("${sortConfig.customValue}")`;
      
      const optionExists = await page.$(optionSelector);
      if (optionExists) {
        await page.click(optionSelector);
        await page.waitForTimeout(1000); // Wait for sorting to take effect
        log.info(`Successfully selected custom sort option: ${sortConfig.customValue}`);
        return true;
      } else {
        log.warning(`Custom sort option not found: ${sortConfig.customValue}`);
        // Close the dropdown by clicking elsewhere
        await page.click('body', { position: { x: 10, y: 10 } });
        return false;
      }
    }
  } catch (error) {
    log.error('Error applying sort option:', { error: (error as Error).message });
    await page.screenshot({ path: 'storage/screenshots/sort-error.png' });
    return false;
  }
}

/**
 * Gets the currently selected sort option
 * 
 * @param page - Playwright Page instance
 * @param log - Crawlee logger instance
 * @returns Promise<SortConfig | null> - The current sort configuration or null if not determined
 */
export async function getCurrentSortOption(page: Page, log: Log): Promise<SortConfig | null> {
  try {
    log.info('Getting current sort option');
    
    // Find all sort elements
    const sortElements = await findSortElements(page, log);
    
    if (sortElements.length === 0) {
      log.warning('No sort elements found on the page');
      return null;
    }
    
    // Find the selected sort element
    const selectedSort = sortElements.find(sort => sort.isSelected);
    
    if (selectedSort) {
      log.info(`Current sort is: ${selectedSort.name} (${selectedSort.type})`);
      return { sortBy: selectedSort.type };
    }
    
    // If no standard sort is selected, check the custom dropdown
    const customSort = sortElements.find(sort => sort.type === SortType.CUSTOM);
    if (customSort) {
      log.info(`Current sort appears to be custom: ${customSort.name}`);
      return { 
        sortBy: SortType.CUSTOM,
        customValue: customSort.name
      };
    }
    
    log.warning('Could not determine current sort option');
    return null;
  } catch (error) {
    log.error('Error getting current sort option:', { error: (error as Error).message });
    return null;
  }
}

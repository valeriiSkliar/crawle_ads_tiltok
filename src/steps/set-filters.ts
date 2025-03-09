import { Page } from 'playwright';
import { FilterElement, FilterConfig, findFilterElements } from './find-filters-elements.js';
import { delay } from '../steps.js';

/**
 * Sets filter values based on the provided configuration
 * 
 * @param page - Playwright Page instance
 * @param config - Filter configuration to apply
 * @returns Promise<boolean> - True if filters were applied successfully
 */
export async function setFilters(page: Page, config: FilterConfig): Promise<boolean> {
  console.log('Setting filters with configuration:', config);
  
  try {
    // Find all filter elements on the page
    const filterElements = await findFilterElements(page, config);
    
    if (filterElements.length === 0) {
      console.error('No filter elements found on the page');
      return false;
    }
    
    // Apply each filter based on the configuration
    let filtersApplied = false;
    
    // Apply region filter if configured and not empty
    if (config.region) {
      const regionFilter = filterElements.find(f => f.name === 'Region');
      if (regionFilter) {
        if (config.region.length > 0) {
          await applyMultiSelectFilter(page, regionFilter, config.region);
          filtersApplied = true;
        } else {
          console.log('Region filter has empty array, clearing any existing selections');
          await clearFilterSelections(page, regionFilter);
        }
      }
    }
    
    // Apply industry filter if configured
    if (config.industry && config.industry.length > 0) {
      const industryFilter = filterElements.find(f => f.name === 'Industry');
      if (industryFilter) {
        await applyCascaderFilter(page, industryFilter, config.industry);
        filtersApplied = true;
      }
    }
    
    // Apply objective filter if configured
    if (config.objective && config.objective.length > 0) {
      const objectiveFilter = filterElements.find(f => f.name === 'Objective');
      if (objectiveFilter) {
        await applyMultiSelectFilter(page, objectiveFilter, config.objective);
        filtersApplied = true;
      }
    }
    
    // Apply period filter if configured
    if (config.period) {
      const periodFilter = filterElements.find(f => f.name === 'Period');
      if (periodFilter) {
        await applySingleSelectFilter(page, periodFilter, config.period);
        filtersApplied = true;
      }
    }
    
    // Apply ad language filter if configured
    if (config.adLanguage && config.adLanguage.length > 0) {
      const adLanguageFilter = filterElements.find(f => f.name === 'Ad Language');
      if (adLanguageFilter) {
        await applyMultiSelectFilter(page, adLanguageFilter, config.adLanguage);
        filtersApplied = true;
      }
    }
    
    // Apply ad format filter if configured
    if (config.adFormat) {
      const adFormatFilter = filterElements.find(f => f.name === 'Ad Format');
      if (adFormatFilter) {
        await applySingleSelectFilter(page, adFormatFilter, config.adFormat);
        filtersApplied = true;
      }
    }
    
    // Apply likes filter if configured
    if (config.likes && config.likes.length > 0) {
      const likesFilter = filterElements.find(f => f.name === 'Likes');
      if (likesFilter) {
        await applyMultiSelectFilter(page, likesFilter, config.likes);
        filtersApplied = true;
      }
    }
    
    if (filtersApplied) {
      console.log('Filters applied successfully');
      // Wait for the page to update with the new filters
      await delay(2000);
    } else {
      console.warn('No filters were applied');
    }
    
    return filtersApplied;
  } catch (error) {
    console.error('Error setting filters:', error);
    return false;
  }
}

/**
 * Applies a multi-select filter with the specified values
 * 
 * @param page - Playwright Page instance
 * @param filter - Filter element to apply
 * @param values - Values to select
 */
async function applyMultiSelectFilter(page: Page, filter: FilterElement, values: string[]): Promise<void> {
  console.log(`Applying multi-select filter "${filter.name}" with values:`, values);
  
  try {
    // Click on the filter to open the dropdown
    await page.click(filter.selector);
    await delay(500);
    
    // For each value, find and click the corresponding option
    for (const value of values) {
      // Look for the option with the specified text
      const optionSelector = `.byted-select-dropdown-option-content:has-text("${value}")`;
      
      // Check if the option exists
      const optionExists = await page.$(optionSelector);
      if (optionExists) {
        await page.click(optionSelector);
        await delay(300); // Small delay between selections
      } else {
        console.warn(`Option "${value}" not found for filter "${filter.name}"`);
      }
    }
    
    // Click outside to close the dropdown
    await page.click('body', { position: { x: 10, y: 10 } });
    await delay(500);
  } catch (error) {
    console.error(`Error applying multi-select filter "${filter.name}":`, error);
    throw error;
  }
}

/**
 * Applies a single-select filter with the specified value
 * 
 * @param page - Playwright Page instance
 * @param filter - Filter element to apply
 * @param value - Value to select
 */
async function applySingleSelectFilter(page: Page, filter: FilterElement, value: string): Promise<void> {
  console.log(`Applying single-select filter "${filter.name}" with value: ${value}`);
  
  try {
    // Click on the filter to open the dropdown
    await page.click(filter.selector);
    await delay(500);
    
    // Look for the option with the specified text
    const optionSelector = `.byted-select-dropdown-option-content:has-text("${value}")`;
    
    // Check if the option exists
    const optionExists = await page.$(optionSelector);
    if (optionExists) {
      await page.click(optionSelector);
      await delay(500);
    } else {
      console.warn(`Option "${value}" not found for filter "${filter.name}"`);
      // Close the dropdown by clicking outside
      await page.click('body', { position: { x: 10, y: 10 } });
    }
  } catch (error) {
    console.error(`Error applying single-select filter "${filter.name}":`, error);
    throw error;
  }
}

/**
 * Applies a cascader filter with the specified values
 * 
 * @param page - Playwright Page instance
 * @param filter - Filter element to apply
 * @param values - Values to select (hierarchical path)
 */
async function applyCascaderFilter(page: Page, filter: FilterElement, values: string[]): Promise<void> {
  console.log(`Applying cascader filter "${filter.name}" with values:`, values);
  
  try {
    // Click on the filter to open the cascader
    await page.click(filter.selector);
    await delay(500);
    
    // For cascader, we need to navigate through the hierarchy
    for (let i = 0; i < values.length; i++) {
      const value = values[i];
      
      // Look for the option with the specified text at the current level
      const optionSelector = `.byted-cascader-menu-item:has-text("${value}")`;
      
      // Check if the option exists
      const optionExists = await page.$(optionSelector);
      if (optionExists) {
        await page.click(optionSelector);
        await delay(500); // Wait for the next level to load
      } else {
        console.warn(`Option "${value}" not found for cascader filter "${filter.name}"`);
        break;
      }
    }
    
    // For the last value, we need to confirm the selection
    if (await page.$('.byted-cascader-menu-item-active')) {
      // Click outside to confirm selection
      await page.click('body', { position: { x: 10, y: 10 } });
    }
  } catch (error) {
    console.error(`Error applying cascader filter "${filter.name}":`, error);
    throw error;
  }
}

/**
 * Clears all selections in a filter
 * 
 * @param page - Playwright Page instance
 * @param filter - Filter element to clear
 */
async function clearFilterSelections(page: Page, filter: FilterElement): Promise<void> {
  console.log(`Clearing selections for filter "${filter.name}"`);
  
  try {
    // Click on the filter to open the dropdown
    await page.click(filter.selector);
    await delay(500);
    
    // Find all close buttons for selected items
    const closeButtons = await page.$$(`${filter.selector} .CcMultiSelect_ccItemLabelClose__F3dTP`);
    
    if (closeButtons.length > 0) {
      console.log(`Found ${closeButtons.length} selected items to clear`);
      
      // Click each close button to remove the selection
      for (const button of closeButtons) {
        await button.click();
        await delay(300); // Small delay between clicks
      }
      
      // Click outside to close the dropdown
      await page.click('body', { position: { x: 10, y: 10 } });
      await delay(500);
    } else {
      console.log('No selections to clear');
      // Close the dropdown by clicking outside
      await page.click('body', { position: { x: 10, y: 10 } });
    }
  } catch (error) {
    console.error(`Error clearing selections for filter "${filter.name}":`, error);
    throw error;
  }
}
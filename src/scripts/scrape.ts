// src/scripts/scrape.ts
import puppeteer, { Browser, Page } from 'puppeteer';
import * as fs from 'fs/promises';
import path from 'path';
import { malaysiaStates } from '../lib/malaysia-cities';

interface FirmData {
  id: string;
  name: string;
  address: string;
  phone: string;
  fax?: string;
  email: string;
  type: string;
  state: string;
  city: string;
}

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function extractFirmData(element: Element): Promise<FirmData> {
  const id = element.querySelector('strong')?.textContent?.replace(/\s+/g, ' ').trim().split('&nbsp;')[1] || '';
  const name = element.querySelector('.fa-building-o')?.parentElement?.textContent?.replace(/\s+/g, ' ').trim().split('&nbsp;')[1] || '';
  const address = element.querySelector('.fa-map-marker')?.parentElement?.querySelector('a')?.textContent?.trim() || '';
  const phone = element.querySelector('.fa-phone')?.parentElement?.querySelector('a')?.textContent?.trim() || '';
  const fax = element.querySelector('.fa-fax')?.parentElement?.querySelector('a')?.textContent?.trim();
  const email = element.querySelector('.fa-envelope')?.parentElement?.querySelector('a')?.textContent?.trim() || '';
  const state = address.split(',').slice(-1)[0]?.trim() || '';
  const type = id.split(' ')[0];

  return {
    id,
    name,
    address,
    phone: phone.replace('tel:', ''),
    fax: fax !== '-' ? fax?.replace('fax:', '') : undefined,
    email,
    type,
    state,
    city: address.match(/\d{5}\s+([^,]+)/)?.[1]?.trim() || ''
  };
}

async function scrapeCity(city: string, browser: Browser): Promise<FirmData[]> {
  console.log(`\n🔍 Scraping city: ${city}`);
  const page = await browser.newPage();
  let allFirms: FirmData[] = [];
  
  try {
    // Navigate to the search page
    await page.goto('https://search.lppeh.gov.my/', { 
      waitUntil: 'networkidle0',
      timeout: 60000 
    });
    
    // Wait and click the "Search for Firm" section
    await page.waitForSelector('.collapsible-header');
    await page.evaluate(() => {
      const headers = document.querySelectorAll('.collapsible-header');
      for (const header of headers) {
        if (header.textContent?.includes('Search for Firm')) {
          (header as HTMLElement).click();
        }
      }
    });
    
    // Wait for form to be interactive
    await delay(2000);
    
    // Enter city name
    await page.waitForSelector('#ContentPlaceHolder1_txt_FirmCombineAdd');
    await page.type('#ContentPlaceHolder1_txt_FirmCombineAdd', city);
    
    // Click search button and wait for results
    await Promise.all([
      page.waitForSelector('.card-panel', { timeout: 60000 }),
      page.click('#ContentPlaceHolder1_btnSubmitFirm')
    ]);

    // Wait for results to load
    await delay(2000);

    let hasNextPage = true;
    let pageNum = 1;

    while (hasNextPage) {
      console.log(`Processing page ${pageNum}...`);

      // Extract firms from current page
      const firms = await page.evaluate(() => {
        const results: any[] = [];
        document.querySelectorAll('.card-panel').forEach((card) => {
          if (!card.querySelector('blockquote')) { // Skip header cards
            const id = card.querySelector('strong')?.textContent?.trim().split('&nbsp;').pop() || '';
            const name = card.querySelector('.fa-building-o')?.parentElement?.textContent?.trim().split('&nbsp;').pop() || '';
            const addressEl = card.querySelector('.fa-map-marker')?.parentElement?.querySelector('a');
            const address = addressEl?.textContent?.trim() || '';
            const phone = card.querySelector('.fa-phone')?.parentElement?.querySelector('a')?.textContent?.trim() || '';
            const faxEl = card.querySelector('.fa-fax')?.parentElement;
            const fax = faxEl?.textContent?.includes('-') ? undefined : faxEl?.querySelector('a')?.textContent?.trim();
            const email = card.querySelector('.fa-envelope')?.parentElement?.querySelector('a')?.textContent?.trim() || '';

            if (id && name && address) {
              results.push({ id, name, address, phone, fax, email });
            }
          }
        });
        return results;
      });

      // Process and add firms to collection
      firms.forEach(firm => {
        allFirms.push({
          ...firm,
          type: firm.id.split(' ')[0],
          state: firm.address.split(',').slice(-1)[0]?.trim() || '',
          city
        });
      });

      // Check if there's a next page
      const hasNext = await page.evaluate(() => {
        const nextButton = document.querySelector('#ContentPlaceHolder1_aNext');
        const nextParent = nextButton?.parentElement;
        return nextParent && !nextParent.classList.contains('disabled');
      });

      if (hasNext) {
        // Click next page and wait for content to update
        await Promise.all([
          page.click('#ContentPlaceHolder1_aNext'),
          page.waitForFunction(() => {
            const loadingIndicator = document.querySelector('#ContentPlaceHolder1_UpdateProgress1');
            return loadingIndicator && getComputedStyle(loadingIndicator).display === 'none';
          }, { timeout: 30000 }),
          page.waitForSelector('.card-panel')
        ]);
        
        await delay(2000);
        pageNum++;
      } else {
        hasNextPage = false;
      }
    }

    console.log(`Found ${allFirms.length} firms in ${city}`);
    return allFirms;
    
  } catch (error) {
    console.error(`Error scraping ${city}:`, error);
    if (allFirms.length > 0) {
      console.log(`Saving ${allFirms.length} firms found before error`);
      return allFirms;
    }
    return [];
  } finally {
    await page.close();
  }
}

async function main() {
  console.log('🚀 Starting LPPEH directory scraping...\n');
  
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: { width: 1366, height: 768 },
    args: ['--no-sandbox']
  });
  
  try {
    const dataDir = path.join(process.cwd(), 'data');
    await fs.mkdir(dataDir, { recursive: true });
    
    const allFirms: FirmData[] = [];
    const errors: Record<string, string> = {};
    const startTime = Date.now();
    
    // Scrape each state
    for (const [state, cities] of Object.entries(malaysiaStates)) {
      console.log(`\n📍 Processing state: ${state}`);
      
      for (const city of cities) {
        try {
          const firms = await scrapeCity(city, browser);
          if (firms.length > 0) {
            allFirms.push(...firms);
            
            // Save progress after each city
            await fs.writeFile(
              path.join(dataDir, 'firms.json'),
              JSON.stringify(allFirms, null, 2)
            );
          }
          
          // Add delay between cities
          await delay(3000);
          
        } catch (error) {
          console.error(`\n❌ Error scraping ${city}:`, error);
          errors[`${state}-${city}`] = error instanceof Error ? error.message : 'Unknown error';
        }
      }
    }
    
    // Save final results
    const resultsPath = path.join(dataDir, 'results.json');
    await fs.writeFile(
      resultsPath,
      JSON.stringify({
        firms: allFirms,
        metadata: {
          totalFirms: allFirms.length,
          citiesScraped: Object.values(malaysiaStates).flat().length,
          errors,
          timestamp: new Date().toISOString(),
          duration: (Date.now() - startTime) / 1000
        }
      }, null, 2)
    );
    
    console.log('\n✨ Scraping completed!');
    console.log(`📊 Summary:
    • Total firms: ${allFirms.length}
    • Cities processed: ${Object.values(malaysiaStates).flat().length}
    • Errors: ${Object.keys(errors).length}
    • Time: ${((Date.now() - startTime) / 1000).toFixed(2)}s
    • Results saved to: ${resultsPath}
    `);
    
  } finally {
    await browser.close();
  }
}

main().catch(console.error);
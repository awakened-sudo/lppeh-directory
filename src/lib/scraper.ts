// src/lib/scraper.ts
import axios from 'axios';
import * as cheerio from 'cheerio';
import * as fs from 'fs/promises';
import path from 'path';
import { malaysiaStates } from './malaysia-cities';

interface FirmData {
  id: string;
  name: string;
  address: string;
  phone: string;
  fax?: string;
  email: string;
  type: string;
  state: string;
}

const BASE_URL = 'https://search.lppeh.gov.my/';

async function saveDebugHtml(html: string, state: string, prefix: string = '') {
  const debugDir = path.join(process.cwd(), 'debug');
  await fs.mkdir(debugDir, { recursive: true });
  const filename = `${prefix}${state.toLowerCase()}-${Date.now()}.html`;
  await fs.writeFile(path.join(debugDir, filename), html);
  console.log(`Saved debug HTML to: debug/${filename}`);
}

async function getFormTokens() {
  try {
    const response = await axios.get(BASE_URL);
    const $ = cheerio.load(response.data);
    
    // Save initial page for debugging
    await saveDebugHtml(response.data, 'initial', 'form-');
    
    const tokens = {
      viewState: $('#__VIEWSTATE').val(),
      eventValidation: $('#__EVENTVALIDATION').val(),
      viewStateGenerator: $('#__VIEWSTATEGENERATOR').val(),
    };

    console.log('Retrieved form tokens:', tokens);
    return tokens;
    
  } catch (error) {
    console.error('Error getting form tokens:', error);
    throw new Error('Failed to get form tokens');
  }
}

export async function searchFirms(state: string): Promise<FirmData[]> {
  try {
    console.log(`\nStarting search for state: ${state}`);
    const tokens = await getFormTokens();
    
    // Prepare form data
    const formData = new URLSearchParams();
    formData.append('__VIEWSTATE', String(tokens.viewState));
    formData.append('__VIEWSTATEGENERATOR', String(tokens.viewStateGenerator));
    formData.append('__EVENTVALIDATION', String(tokens.eventValidation));
    formData.append('ctl00$ContentPlaceHolder1$ddl_StateDesc', state);
    formData.append('ctl00$ContentPlaceHolder1$btnSubmitFirm', 'Search');

    console.log('Submitting search with form data:', formData.toString());

    // Make the search request
    const searchResponse = await axios.post(BASE_URL, formData.toString(), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Origin': BASE_URL,
        'Referer': BASE_URL
      },
      maxRedirects: 5
    });

    // Save response for debugging
    await saveDebugHtml(searchResponse.data, state);

    const $ = cheerio.load(searchResponse.data);
    const firms: FirmData[] = [];

    // Try different selectors
    // Selector for divResult container
    const divResult = $('#ContentPlaceHolder1_divResult');
    console.log('Found divResult:', divResult.length > 0);

    // Look for listing items
    const listingItems = $('.Listing-of-active-firms-in-LPPEH');
    console.log('Found listing items:', listingItems.length);

    // Look for firm items
    const firmItems = $('.card');
    console.log('Found firm items:', firmItems.length);

    // Parse each firm
    firmItems.each((_, element) => {
      try {
        const $firm = $(element);
        console.log('\nProcessing firm element:', $firm.html()?.slice(0, 100));

        // Try multiple selectors for each field
        const regNo = $firm.find('[id*="RegNo"]').text().trim() || 
                     $firm.find('strong').first().text().trim();
        
        const name = $firm.find('[id*="FirmName"]').text().trim() ||
                    $firm.find('strong').eq(1).text().trim();
        
        const address = $firm.find('[id*="Address"]').text().trim() ||
                       $firm.find('a[href*="maps"]').text().trim();
        
        const phone = $firm.find('a[href^="tel:"]').text().trim();
        const fax = $firm.find('span:contains("Fax:")').next().text().trim();
        const email = $firm.find('a[href^="mailto:"]').text().trim();

        console.log('Extracted data:', {
          regNo,
          name,
          address: address.slice(0, 50) + '...',
          phone,
          fax,
          email
        });

        if (regNo && name && address) {
          firms.push({
            id: regNo,
            name,
            address,
            phone,
            fax: fax || undefined,
            email,
            type: regNo.split(' ')[0],
            state
          });
        }
      } catch (error) {
        console.error('Error parsing firm:', error);
      }
    });

    console.log(`Found ${firms.length} firms for state: ${state}`);
    return firms;

  } catch (error) {
    console.error(`Error searching firms for state ${state}:`, error);
    throw error;
  }
}

export async function scrapeAllStates() {
  const allFirms: FirmData[] = [];
  const errors: Record<string, string> = {};

  for (const state of Object.keys(malaysiaStates)) {
    try {
      console.log(`\nScraping state: ${state}`);
      const firms = await searchFirms(state);
      allFirms.push(...firms);
      
      // Save progress after each state
      console.log(`Successfully scraped ${firms.length} firms from ${state}`);
      
      // Add delay between requests to avoid overwhelming the server
      const delay = 3000 + Math.random() * 2000; // Random delay between 3-5 seconds
      console.log(`Waiting ${Math.round(delay/1000)} seconds before next request...`);
      await new Promise(resolve => setTimeout(resolve, delay));
      
    } catch (error) {
      console.error(`Error scraping ${state}:`, error);
      errors[state] = error instanceof Error ? error.message : 'Unknown error';
    }
  }

  return {
    firms: allFirms,
    errors,
    totalFirms: allFirms.length,
    statesWithErrors: Object.keys(errors).length,
    timestamp: new Date().toISOString()
  };
}
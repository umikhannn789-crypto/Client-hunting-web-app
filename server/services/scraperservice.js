const { chromium } = require('playwright');

class ScraperService {
  constructor() {
    this.browser = null;
  }

  async init() {
    if (!this.browser) {
      console.log('🚀 Launching browser...');
      try {
        this.browser = await chromium.launch({
          headless: true,
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--disable-gpu',
            '--window-size=1920,1080'
          ]
        });
        console.log('✅ Browser launched successfully');
      } catch (error) {
        console.error('❌ Browser launch error:', error);
        throw error;
      }
    }
    return this.browser;
  }

  async scrapeBusinesses({ city, country, businessType, maxResults = 10 }) {
    const browser = await this.init();
    const page = await browser.newPage();
    const results = [];

    try {
      const location = country ? `${city}, ${country}` : city;
      const query = `${businessType} in ${location}`;

      console.log(`🔍 Searching: ${query}`);

      // Direct Google Maps Search URL
      const searchUrl = `https://www.google.com/maps/search/${encodeURIComponent(query)}`;
      await page.goto(searchUrl, {
        waitUntil: 'domcontentloaded',
        timeout: 45000
      });

      await page.waitForTimeout(5000);

      // Scroll to load more results
      for (let i = 0; i < 5; i++) {
        await page.evaluate(() => {
          const container = document.querySelector('div[role="feed"]');
          if (container) {
            container.scrollTop = container.scrollHeight;
          } else {
            window.scrollBy(0, 1000);
          }
        });
        await page.waitForTimeout(2000);
      }

      await page.waitForTimeout(3000);

      // Find business cards
      let cards = [];
      const selectors = [
        'div[role="article"]',
        'div[class*="section-result"]',
        'a[class*="section-result"]',
        'div[data-item-id]'
      ];

      for (const selector of selectors) {
        const found = await page.$$(selector);
        if (found.length > 0) {
          cards = found;
          console.log(`✅ Found ${cards.length} cards with selector: ${selector}`);
          break;
        }
      }

      if (cards.length === 0) {
        console.log('⚠️ No results found. Trying alternative method...');
        await page.close();
        return results;
      }

      // Scrape each card
      for (let i = 0; i < Math.min(cards.length, maxResults); i++) {
        try {
          const card = cards[i];

          // Get business name
          let name = '';
          const nameSelectors = [
            'div.fontHeadlineSmall',
            'h3',
            'div[class*="title"]',
            'div[role="heading"]'
          ];
          for (const selector of nameSelectors) {
            const el = await card.$(selector);
            if (el) {
              name = await el.innerText();
              if (name && name.trim()) break;
            }
          }

          if (!name || !name.trim()) {
            const text = await card.innerText();
            const lines = text.split('\n').filter(line => line.trim());
            if (lines.length > 0) name = lines[0];
          }

          if (!name || !name.trim()) continue;

          // Get address
          let address = '';
          const addressSelectors = [
            'div.fontBodySmall',
            'div[class*="address"]',
            'div[class*="location"]'
          ];
          for (const selector of addressSelectors) {
            const el = await card.$(selector);
            if (el) {
              address = await el.innerText();
              if (address && address.trim()) break;
            }
          }

          // Get phone
          let phone = '';
          const phoneSelectors = [
            'div[aria-label*="Phone"]',
            'button[data-item-id*="phone"]',
            'span[class*="phone"]'
          ];
          for (const selector of phoneSelectors) {
            const el = await card.$(selector);
            if (el) {
              phone = await el.innerText();
              if (phone && phone.trim()) break;
            }
          }

          // Get website
          let website = '';
          const websiteSelectors = [
            'a[aria-label*="Website"]',
            'a[data-item-id*="website"]',
            'a[href*="http"]'
          ];
          for (const selector of websiteSelectors) {
            const el = await card.$(selector);
            if (el) {
              website = await el.getAttribute('href') || '';
              if (website && website.trim()) break;
            }
          }

          results.push({
            companyName: name.trim(),
            address: address ? address.trim() : '',
            phone: phone ? phone.trim() : '',
            website: website ? website.trim() : '',
            email: '',
            industry: businessType,
            city: city,
            country: country || '',
            status: 'new',
            source: 'google_maps'
          });

          console.log(`✅ Scraped: ${name.trim()}`);
        } catch (err) {
          console.warn('⚠️ Error scraping card:', err.message);
        }
      }

      await page.close();
      console.log(`✅ Total scraped: ${results.length} leads`);
      return results;
    } catch (error) {
      console.error('❌ Scraper Error:', error.message);
      await page.close();
      throw error;
    }
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      console.log('🔄 Browser closed');
    }
  }
}

module.exports = new ScraperService();
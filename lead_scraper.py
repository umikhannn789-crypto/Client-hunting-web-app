from playwright.sync_api import sync_playwright
import pandas as pd
import re
import time

def scrape_businesses(query, max_results=50):
    results = []
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.goto("https://www.google.com/maps")

        # Enter search query
        page.fill("input[aria-label='Search Google Maps']", query)
        page.keyboard.press("Enter")
        time.sleep(5)  # wait for results to load

        # Scroll to load more results
        for _ in range(5):
            page.mouse.wheel(0, 1000)
            time.sleep(2)

        # Scrape business cards
        cards = page.query_selector_all("div[role='article']")
        for card in cards[:max_results]:
            name = card.query_selector("div.fontHeadlineSmall").inner_text() if card.query_selector("div.fontHeadlineSmall") else ""
            address = card.query_selector("div.fontBodySmall").inner_text() if card.query_selector("div.fontBodySmall") else ""
            results.append({
                "Business Name": name,
                "Address": address,
                "Query": query
            })

        browser.close()
    return results

def main():
    city = input("Enter city name: ")
    country = input("Enter country name (optional, press Enter to skip): ")
    business_type = input("Enter business type (e.g., IT company, restaurant): ")

    # Build query string
    location = f"{city}, {country}" if country else city
    query = f"{business_type} in {location}"

    print(f"Searching: {query}")
    leads = scrape_businesses(query)

    # Save to Excel
    df = pd.DataFrame(leads)
    df.to_excel("leads.xlsx", index=False)
    print(f"\nDone. Saved {len(df)} leads to leads.xlsx")

if __name__ == "__main__":
    main()

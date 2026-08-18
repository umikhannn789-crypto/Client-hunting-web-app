const scraperService = require('../services/scraperService');
const Lead = require('../models/Leads');
const SearchLog = require('../models/SearchLogs');

exports.runScraper = async (req, res) => {
  try {
    const { city, country, businessType, maxResults = 10 } = req.body;

    if (!city || !businessType) {
      return res.status(400).json({
        success: false,
        message: 'City and Business Type are required'
      });
    }

    console.log(`🚀 Starting scraper for: ${businessType} in ${city}, ${country || 'Any'}`);

    const leadsData = await scraperService.scrapeBusinesses({
      city,
      country,
      businessType,
      maxResults: parseInt(maxResults)
    });

    if (!leadsData || leadsData.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No leads found. Try different keywords or location.'
      });
    }

    const savedLeads = [];
    for (const lead of leadsData) {
      const existing = await Lead.findOne({
        companyName: lead.companyName,
        city: lead.city
      });

      if (!existing) {
        const newLead = await Lead.create({
          companyName: lead.companyName,
          email: lead.email || '',
          phone: lead.phone || '',
          website: lead.website || '',
          industry: businessType,
          status: 'new',
          notes: lead.address || '',
          city: lead.city,
          country: lead.country || '',
          rating: lead.rating || '',
          source: 'google_maps',
          createdBy: req.user.id,
          isSaved: false,
          savedBy: []
        });
        savedLeads.push(newLead);
      } else {
        if (lead.phone && !existing.phone) existing.phone = lead.phone;
        if (lead.website && !existing.website) existing.website = lead.website;
        await existing.save();
        savedLeads.push(existing);
      }
    }

    await SearchLog.create({
      user: req.user.id,
      query: `${businessType} in ${city}`,
      filters: { city, country, businessType },
      results: savedLeads.length,
      ipAddress: req.ip
    });

    res.json({
      success: true,
      message: `✅ Successfully scraped ${savedLeads.length} leads`,
      count: savedLeads.length,
      leads: savedLeads
    });
  } catch (error) {
    console.error('❌ Scraper Error:', error);
    await scraperService.close();

    res.status(500).json({
      success: false,
      message: 'Failed to scrape leads. Please try again.',
      error: error.message
    });
  }
};
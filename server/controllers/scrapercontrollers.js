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
    console.log(`📊 Max Results: ${maxResults}`);

    const leadsData = await scraperService.scrapeBusinesses({
      city,
      country,
      businessType,
      maxResults: parseInt(maxResults) || 10
    });

    console.log(`📊 Scraper returned ${leadsData?.length || 0} leads`);

    if (!leadsData || leadsData.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No leads found. Try different keywords or location.'
      });
    }

    const savedLeads = [];
    const skippedLeads = [];

    for (const lead of leadsData) {
      try {
        const existing = await Lead.findOne({
          companyName: lead.companyName,
          city: lead.city
        });

        if (!existing) {
          // ===== SAVE WITH EMAIL AND PHONE =====
          const newLead = await Lead.create({
            companyName: lead.companyName || 'Unknown',
            email: lead.email || '',           // <-- Email save ho raha hai
            phone: lead.phone || '',           // <-- Phone save ho raha hai
            website: lead.website || '',
            industry: businessType,
            status: 'new',
            notes: lead.address || '',
            city: lead.city || city,
            country: lead.country || country || '',
            rating: lead.rating || '',
            source: 'google_maps',
            sourceUrl: lead.sourceUrl || '',
            createdBy: req.user.id,
            isSaved: false,
            savedBy: []
          });
          savedLeads.push(newLead);
          console.log(`💾 Saved: ${lead.companyName} | Email: ${lead.email || 'N/A'} | Phone: ${lead.phone || 'N/A'}`);
        } else {
          // Update existing lead with new info
          if (lead.phone && !existing.phone) existing.phone = lead.phone;
          if (lead.website && !existing.website) existing.website = lead.website;
          if (lead.email && !existing.email) existing.email = lead.email;
          if (lead.rating && !existing.rating) existing.rating = lead.rating;
          await existing.save();
          savedLeads.push(existing);
          console.log(`🔄 Updated: ${lead.companyName}`);
        }
      } catch (error) {
        console.error(`❌ Error saving lead: ${lead.companyName}`, error.message);
        skippedLeads.push(lead.companyName);
      }
    }

    await SearchLog.create({
      user: req.user.id,
      query: `${businessType} in ${city}`,
      filters: { city, country, businessType },
      results: savedLeads.length,
      ipAddress: req.ip
    });

    console.log(`✅ Saved: ${savedLeads.length} leads, Skipped: ${skippedLeads.length}`);

    res.json({
      success: true,
      message: `✅ Successfully scraped ${savedLeads.length} leads`,
      count: savedLeads.length,
      saved: savedLeads.length,
      skipped: skippedLeads.length,
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
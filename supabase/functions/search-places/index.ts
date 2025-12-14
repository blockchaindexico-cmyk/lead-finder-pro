import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Quick email scraping using regex (fast, runs on initial search)
async function scrapeEmailFromWebsite(websiteUrl: string): Promise<string | null> {
  try {
    const response = await fetch(websiteUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    });

    if (!response.ok) return null;

    const html = await response.text();

    // Extract emails using regex
    const emailRegex = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/gi;
    const emails = html.match(emailRegex);

    if (emails && emails.length > 0) {
      // Filter out common invalid emails
      const validEmails = emails.filter(
        (email) =>
          !email.includes("example.com") &&
          !email.includes("sentry") &&
          !email.includes("wixpress") &&
          !email.includes(".png") &&
          !email.includes(".jpg") &&
          !email.includes(".svg") &&
          !email.includes(".gif") &&
          !email.includes(".webp")
      );

      return validEmails[0] || null;
    }

    return null;
  } catch (error) {
    console.error("Error scraping email:", error);
    return null;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { keyword, location, numberOfResults } = await req.json();
    
    console.log(`Searching for: ${keyword} in ${location}, limit: ${numberOfResults}`);

    const apiKey = Deno.env.get('GOOGLE_PLACES_API_KEY');
    if (!apiKey) {
      console.error('GOOGLE_PLACES_API_KEY not configured');
      return new Response(JSON.stringify({ error: 'API key not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Step 1: Text Search (New API) to find places
    const textSearchUrl = 'https://places.googleapis.com/v1/places:searchText';
    const searchQuery = `${keyword} in ${location}`;
    
    console.log('Calling Google Text Search API (v1)...');
    const searchResponse = await fetch(textSearchUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.types,places.rating',
      },
      body: JSON.stringify({
        textQuery: searchQuery,
        languageCode: 'en',
        maxResultCount: Math.min(numberOfResults, 20),
      }),
    });

    const searchData = await searchResponse.json();

    if (searchData.error) {
      console.error('Google API error:', searchData.error);
      return new Response(JSON.stringify({ 
        error: `Google API error: ${searchData.error.message}`,
        details: searchData.error 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!searchData.places?.length) {
      console.log('No results found');
      return new Response(JSON.stringify({ leads: [] }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const places = searchData.places.slice(0, numberOfResults);
    console.log(`Found ${searchData.places.length} results, returning ${places.length}`);

    // Step 2: Get details for each place and try quick email scraping
    const leads = await Promise.all(
      places.map(async (place: any) => {
        try {
          const detailsUrl = `https://places.googleapis.com/v1/places/${place.id}`;
          const detailsResponse = await fetch(detailsUrl, {
            method: 'GET',
            headers: {
              'X-Goog-Api-Key': apiKey,
              'X-Goog-FieldMask': 'id,displayName,formattedAddress,nationalPhoneNumber,internationalPhoneNumber,websiteUri,googleMapsUri,rating',
            },
          });

          const details = await detailsResponse.json();

          if (details.error) {
            console.error(`Error fetching details for ${place.id}:`, details.error);
            return createLeadFromBasicInfo(place, keyword);
          }

          const websiteUrl = details.websiteUri;
          let email: string | null = null;

          // Try quick email scraping if website is available
          if (websiteUrl && websiteUrl !== 'Not available') {
            console.log(`Quick scraping email from: ${websiteUrl}`);
            email = await scrapeEmailFromWebsite(websiteUrl);
            if (email) {
              console.log(`Found email: ${email}`);
            }
          }

          return {
            id: details.id || place.id,
            name: details.displayName?.text || place.displayName?.text || 'Unknown',
            email: email, // null if not found, user can use Firecrawl button
            phone: details.internationalPhoneNumber || details.nationalPhoneNumber || 'Not available',
            website: websiteUrl || 'Not available',
            address: details.formattedAddress || place.formattedAddress || 'Not available',
            category: keyword,
            rating: details.rating || place.rating,
            googleMapsUrl: details.googleMapsUri,
          };
        } catch (error) {
          console.error(`Error fetching details for ${place.id}:`, error);
          return createLeadFromBasicInfo(place, keyword);
        }
      })
    );

    console.log(`Returning ${leads.length} leads`);
    return new Response(JSON.stringify({ leads }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in search-places function:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function createLeadFromBasicInfo(place: any, keyword: string) {
  return {
    id: place.id,
    name: place.displayName?.text || 'Unknown',
    email: null,
    phone: 'Not available',
    website: 'Not available',
    address: place.formattedAddress || 'Not available',
    category: keyword,
    rating: place.rating,
  };
}

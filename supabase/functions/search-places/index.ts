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

// Fetch places with pagination to get exact number requested
async function fetchAllPlaces(searchQuery: string, numberOfResults: number, apiKey: string): Promise<any[]> {
  const allPlaces: any[] = [];
  let nextPageToken: string | null = null;
  const maxPerRequest = 20; // Google's limit per request

  while (allPlaces.length < numberOfResults) {
    const remaining = numberOfResults - allPlaces.length;
    const requestCount = Math.min(remaining, maxPerRequest);

    const textSearchUrl = 'https://places.googleapis.com/v1/places:searchText';
    
    const body: any = {
      textQuery: searchQuery,
      languageCode: 'en',
      maxResultCount: requestCount,
    };

    if (nextPageToken) {
      body.pageToken = nextPageToken;
    }

    console.log(`Fetching ${requestCount} places (total so far: ${allPlaces.length})...`);
    
    const searchResponse = await fetch(textSearchUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.types,places.rating,nextPageToken',
      },
      body: JSON.stringify(body),
    });

    const searchData = await searchResponse.json();

    if (searchData.error) {
      console.error('Google API error:', searchData.error);
      throw new Error(searchData.error.message);
    }

    if (!searchData.places?.length) {
      console.log('No more results available');
      break;
    }

    allPlaces.push(...searchData.places);
    nextPageToken = searchData.nextPageToken || null;

    console.log(`Fetched ${searchData.places.length} places, next token: ${nextPageToken ? 'yes' : 'no'}`);

    // If no next page token, we've reached the end
    if (!nextPageToken) {
      break;
    }

    // Small delay to avoid rate limiting
    if (allPlaces.length < numberOfResults && nextPageToken) {
      await new Promise(resolve => setTimeout(resolve, 200));
    }
  }

  return allPlaces.slice(0, numberOfResults);
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

    const searchQuery = `${keyword} in ${location}`;
    
    // Fetch all places with pagination
    let places: any[];
    try {
      places = await fetchAllPlaces(searchQuery, numberOfResults, apiKey);
    } catch (error) {
      return new Response(JSON.stringify({ 
        error: `Google API error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (places.length === 0) {
      console.log('No results found');
      return new Response(JSON.stringify({ leads: [] }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Found ${places.length} total places`);

    // Get details for each place and try quick email scraping
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
            email: email,
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

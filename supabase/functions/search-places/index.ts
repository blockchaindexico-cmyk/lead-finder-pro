import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

    // Step 2: Get details for each place using Place Details (New API)
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

          return {
            id: details.id || place.id,
            name: details.displayName?.text || place.displayName?.text || 'Unknown',
            email: generateContactEmail(details.displayName?.text || place.displayName?.text),
            phone: details.internationalPhoneNumber || details.nationalPhoneNumber || 'Not available',
            website: details.websiteUri || 'Not available',
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
    email: generateContactEmail(place.displayName?.text),
    phone: 'Not available',
    website: 'Not available',
    address: place.formattedAddress || 'Not available',
    category: keyword,
    rating: place.rating,
  };
}

function generateContactEmail(businessName: string): string {
  if (!businessName) return 'Not available';
  const cleanName = businessName.toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, '')
    .substring(0, 20);
  return `contact@${cleanName}.com`;
}

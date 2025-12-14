import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
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

    // Step 1: Text Search to find places
    const searchQuery = `${keyword} in ${location}`;
    const textSearchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(searchQuery)}&key=${apiKey}`;
    
    console.log('Calling Google Text Search API...');
    const searchResponse = await fetch(textSearchUrl);
    const searchData = await searchResponse.json();

    if (searchData.status !== 'OK' && searchData.status !== 'ZERO_RESULTS') {
      console.error('Google API error:', searchData.status, searchData.error_message);
      return new Response(JSON.stringify({ 
        error: `Google API error: ${searchData.status}`,
        details: searchData.error_message 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (searchData.status === 'ZERO_RESULTS' || !searchData.results?.length) {
      console.log('No results found');
      return new Response(JSON.stringify({ leads: [] }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Limit results
    const limitedResults = searchData.results.slice(0, numberOfResults);
    console.log(`Found ${searchData.results.length} results, returning ${limitedResults.length}`);

    // Step 2: Get details for each place to get contact info
    const leads = await Promise.all(
      limitedResults.map(async (place: any) => {
        try {
          const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place.place_id}&fields=name,formatted_address,formatted_phone_number,website,rating,url,types&key=${apiKey}`;
          const detailsResponse = await fetch(detailsUrl);
          const detailsData = await detailsResponse.json();

          if (detailsData.status === 'OK') {
            const details = detailsData.result;
            return {
              id: place.place_id,
              name: details.name || place.name,
              email: extractEmailFromWebsite(details.website) || generateContactEmail(details.name),
              phone: details.formatted_phone_number || 'Not available',
              website: details.website || 'Not available',
              address: details.formatted_address || place.formatted_address,
              category: keyword,
              rating: details.rating || place.rating,
              googleMapsUrl: details.url,
            };
          }
          
          // Fallback if details fail
          return {
            id: place.place_id,
            name: place.name,
            email: generateContactEmail(place.name),
            phone: 'Not available',
            website: 'Not available',
            address: place.formatted_address,
            category: keyword,
            rating: place.rating,
          };
        } catch (error) {
          console.error(`Error fetching details for ${place.name}:`, error);
          return {
            id: place.place_id,
            name: place.name,
            email: generateContactEmail(place.name),
            phone: 'Not available',
            website: 'Not available',
            address: place.formatted_address,
            category: keyword,
            rating: place.rating,
          };
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

// Helper to generate a contact email based on business name
function generateContactEmail(businessName: string): string {
  if (!businessName) return 'Not available';
  const cleanName = businessName.toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, '')
    .substring(0, 20);
  return `contact@${cleanName}.com`;
}

// Placeholder for email extraction - Google Places doesn't provide emails directly
function extractEmailFromWebsite(website: string | undefined): string | null {
  // Note: Actually scraping websites for emails would require additional implementation
  return null;
}

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
    const { websiteUrl } = await req.json();

    if (!websiteUrl || websiteUrl === 'Not available') {
      return new Response(JSON.stringify({ email: null }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const apiKey = Deno.env.get('FIRECRAWL_API_KEY');
    if (!apiKey) {
      console.error('FIRECRAWL_API_KEY not configured');
      return new Response(JSON.stringify({ email: null }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Scraping website for email:', websiteUrl);

    // Try main page first, then contact page
    const pagesToTry = [
      websiteUrl,
      `${websiteUrl.replace(/\/$/, '')}/contact`,
      `${websiteUrl.replace(/\/$/, '')}/about`,
      `${websiteUrl.replace(/\/$/, '')}/contact-us`,
    ];

    for (const pageUrl of pagesToTry) {
      try {
        const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            url: pageUrl,
            formats: ['markdown'],
            onlyMainContent: false,
            waitFor: 2000,
          }),
        });

        if (!response.ok) {
          console.log(`Failed to scrape ${pageUrl}: ${response.status}`);
          continue;
        }

        const data = await response.json();
        const content = data.data?.markdown || data.markdown || '';
        
        // Extract emails using regex
        const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
        const emails = content.match(emailRegex) || [];
        
        // Filter out common non-business emails
        const filteredEmails = emails.filter((email: string) => {
          const lowerEmail = email.toLowerCase();
          return !lowerEmail.includes('example.com') &&
                 !lowerEmail.includes('sentry.io') &&
                 !lowerEmail.includes('wixpress.com') &&
                 !lowerEmail.includes('placeholder') &&
                 !lowerEmail.endsWith('.png') &&
                 !lowerEmail.endsWith('.jpg') &&
                 !lowerEmail.endsWith('.gif');
        });

        if (filteredEmails.length > 0) {
          // Prefer info@, contact@, hello@, support@ emails
          const priorityEmails = filteredEmails.filter((email: string) => {
            const lowerEmail = email.toLowerCase();
            return lowerEmail.startsWith('info@') ||
                   lowerEmail.startsWith('contact@') ||
                   lowerEmail.startsWith('hello@') ||
                   lowerEmail.startsWith('support@') ||
                   lowerEmail.startsWith('enquiry@') ||
                   lowerEmail.startsWith('enquiries@') ||
                   lowerEmail.startsWith('admin@');
          });

          const bestEmail = priorityEmails.length > 0 ? priorityEmails[0] : filteredEmails[0];
          console.log(`Found email: ${bestEmail} from ${pageUrl}`);
          
          return new Response(JSON.stringify({ email: bestEmail }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      } catch (error) {
        console.log(`Error scraping ${pageUrl}:`, error);
        continue;
      }
    }

    console.log('No email found for:', websiteUrl);
    return new Response(JSON.stringify({ email: null }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in extract-email function:', error);
    return new Response(JSON.stringify({ email: null, error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

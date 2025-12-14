import { Lead, SearchParams } from "@/types/lead";

const businessNames = [
  "Sunrise Cafe",
  "Metro Dental Care",
  "Elite Law Firm",
  "Pacific Plumbing Services",
  "Golden Gate Realty",
  "Urban Fitness Studio",
  "Coastal Medical Center",
  "Premier Auto Repair",
  "Valley Tech Solutions",
  "Harbor Insurance Agency",
  "Summit Accounting Group",
  "Beacon Marketing Co",
  "Crystal Clear Cleaning",
  "Evergreen Landscaping",
  "Northstar Construction",
  "Riverside Pet Clinic",
  "Downtown Deli & Grill",
  "Blue Sky Photography",
  "Harmony Wellness Spa",
  "Stellar Web Design"
];

const domains = ["gmail.com", "yahoo.com", "outlook.com", "hotmail.com"];

function generatePhoneNumber(): string {
  const areaCode = Math.floor(Math.random() * 900) + 100;
  const prefix = Math.floor(Math.random() * 900) + 100;
  const lineNumber = Math.floor(Math.random() * 9000) + 1000;
  return `(${areaCode}) ${prefix}-${lineNumber}`;
}

function generateEmail(businessName: string): string {
  const cleanName = businessName.toLowerCase().replace(/[^a-z]/g, "");
  const domain = domains[Math.floor(Math.random() * domains.length)];
  return `contact@${cleanName}.com`;
}

function generateWebsite(businessName: string): string {
  const cleanName = businessName.toLowerCase().replace(/[^a-z]/g, "");
  return `www.${cleanName}.com`;
}

function generateAddress(location: string): string {
  const streetNumber = Math.floor(Math.random() * 9000) + 100;
  const streets = ["Main St", "Oak Ave", "Park Blvd", "Market St", "Broadway", "First Ave", "Center St"];
  const street = streets[Math.floor(Math.random() * streets.length)];
  return `${streetNumber} ${street}, ${location}`;
}

export function generateMockLeads(params: SearchParams): Promise<Lead[]> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const leads: Lead[] = [];
      const shuffledNames = [...businessNames].sort(() => Math.random() - 0.5);

      for (let i = 0; i < Math.min(params.numberOfResults, businessNames.length); i++) {
        const name = `${shuffledNames[i]} - ${params.keyword}`;
        leads.push({
          id: `lead-${i + 1}-${Date.now()}`,
          name,
          email: generateEmail(shuffledNames[i]),
          phone: generatePhoneNumber(),
          website: generateWebsite(shuffledNames[i]),
          address: generateAddress(params.location),
          category: params.keyword,
          rating: Math.round((Math.random() * 2 + 3) * 10) / 10,
        });
      }

      resolve(leads);
    }, 1500);
  });
}

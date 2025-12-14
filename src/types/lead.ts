export interface Lead {
  id: string;
  name: string;
  email: string | null;
  phone: string;
  website: string;
  address: string;
  category: string;
  rating?: number;
  googleMapsUrl?: string;
  emailLoading?: boolean;
}

export interface SearchParams {
  keyword: string;
  location: string;
  numberOfResults: number;
}

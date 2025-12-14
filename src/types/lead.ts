export interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  website: string;
  address: string;
  category: string;
  rating?: number;
}

export interface SearchParams {
  keyword: string;
  location: string;
  numberOfResults: number;
}

import { useState } from "react";
import { Search, MapPin, Hash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SearchParams } from "@/types/lead";

interface SearchFormProps {
  onSearch: (params: SearchParams) => void;
  isLoading: boolean;
}

export function SearchForm({ onSearch, isLoading }: SearchFormProps) {
  const [keyword, setKeyword] = useState("");
  const [location, setLocation] = useState("");
  const [numberOfResults, setNumberOfResults] = useState(10);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch({ keyword, location, numberOfResults });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-6 md:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="keyword" className="text-sm font-medium text-foreground">
            Search Keyword
          </Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="keyword"
              placeholder="e.g., restaurants, lawyers, dentists"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              className="pl-10 h-12 bg-background border-border focus:border-accent focus:ring-accent"
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="location" className="text-sm font-medium text-foreground">
            Location
          </Label>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="location"
              placeholder="e.g., New York, NY"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="pl-10 h-12 bg-background border-border focus:border-accent focus:ring-accent"
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="results" className="text-sm font-medium text-foreground">
            Number of Results
          </Label>
          <div className="relative">
            <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="results"
              type="number"
              min={1}
              max={100}
              value={numberOfResults}
              onChange={(e) => setNumberOfResults(parseInt(e.target.value) || 10)}
              className="pl-10 h-12 bg-background border-border focus:border-accent focus:ring-accent"
              required
            />
          </div>
        </div>
      </div>

      <Button
        type="submit"
        variant="gradient"
        size="lg"
        className="w-full md:w-auto"
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <div className="h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
            Extracting Leads...
          </>
        ) : (
          <>
            <Search className="h-4 w-4" />
            Extract Leads
          </>
        )}
      </Button>
    </form>
  );
}

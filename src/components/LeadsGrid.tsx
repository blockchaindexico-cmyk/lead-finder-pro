import { Lead } from "@/types/lead";
import { LeadCard } from "./LeadCard";
import { FileSearch, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

interface LeadsGridProps {
  leads: Lead[];
  isLoading: boolean;
  hasSearched: boolean;
}

export function LeadsGrid({ leads, isLoading, hasSearched }: LeadsGridProps) {
  const exportToCSV = () => {
    const headers = ["Name", "Email", "Phone", "Website", "Address", "Category", "Rating"];
    const csvContent = [
      headers.join(","),
      ...leads.map(lead => 
        [
          `"${lead.name}"`,
          lead.email,
          lead.phone,
          lead.website,
          `"${lead.address}"`,
          lead.category,
          lead.rating || ""
        ].join(",")
      )
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "leads.csv";
    a.click();
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="relative">
          <div className="h-16 w-16 border-4 border-accent/30 border-t-accent rounded-full animate-spin" />
        </div>
        <p className="mt-4 text-muted-foreground">Extracting leads...</p>
      </div>
    );
  }

  if (!hasSearched) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="h-20 w-20 rounded-full bg-secondary flex items-center justify-center mb-4">
          <FileSearch className="h-10 w-10 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-2">
          Start Your Search
        </h3>
        <p className="text-muted-foreground max-w-md">
          Enter a keyword and location above to extract business leads with contact information.
        </p>
      </div>
    );
  }

  if (leads.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="h-20 w-20 rounded-full bg-secondary flex items-center justify-center mb-4">
          <FileSearch className="h-10 w-10 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-2">
          No Leads Found
        </h3>
        <p className="text-muted-foreground max-w-md">
          Try adjusting your search keyword or location to find more results.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Found <span className="font-semibold text-foreground">{leads.length}</span> leads
        </p>
        <Button variant="outline" size="sm" onClick={exportToCSV}>
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>
      
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {leads.map((lead, index) => (
          <LeadCard key={lead.id} lead={lead} index={index} />
        ))}
      </div>
    </div>
  );
}

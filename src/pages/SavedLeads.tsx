import { Link } from "react-router-dom";
import { Zap, Bookmark, ArrowLeft, Download, Trash2 } from "lucide-react";
import { LeadCard } from "@/components/LeadCard";
import { Button } from "@/components/ui/button";
import { useSavedLeads } from "@/hooks/useSavedLeads";

const SavedLeads = () => {
  const { savedLeads, isLeadSaved, saveLead, removeLead, clearAll } = useSavedLeads();

  const exportToCSV = () => {
    const headers = ["Name", "Email", "Phone", "Website", "Address", "Category", "Rating"];
    const csv = [
      headers.join(","),
      ...savedLeads.map((l) =>
        [
          `"${l.name}"`,
          l.email || "",
          l.phone,
          l.website,
          `"${l.address}"`,
          l.category,
          l.rating || "",
        ].join(",")
      ),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "saved-leads.csv";
    a.click();
  };

  return (
    <div className="min-h-screen gradient-subtle">
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl gradient-primary flex items-center justify-center">
              <Zap className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">LeadExtract</h1>
              <p className="text-xs text-muted-foreground">Business Lead Generator</p>
            </div>
          </Link>
          <Button variant="outline" size="sm" asChild>
            <Link to="/">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Link>
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
          <div>
            <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Bookmark className="h-6 w-6 text-accent" />
              Saved Leads
            </h2>
            <p className="text-muted-foreground">
              {savedLeads.length} lead{savedLeads.length !== 1 ? "s" : ""} in your collection
            </p>
          </div>
          {savedLeads.length > 0 && (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={exportToCSV}>
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
              <Button variant="outline" size="sm" onClick={clearAll}>
                <Trash2 className="h-4 w-4 mr-2" />
                Clear All
              </Button>
            </div>
          )}
        </div>

        {savedLeads.length === 0 ? (
          <div className="bg-card rounded-2xl border border-border p-12 text-center">
            <Bookmark className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No saved leads yet</h3>
            <p className="text-muted-foreground mb-6">
              Search for leads and click the bookmark icon to save them here.
            </p>
            <Button asChild>
              <Link to="/">Search for Leads</Link>
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {savedLeads.map((lead, index) => (
              <LeadCard
                key={lead.id}
                lead={lead}
                index={index}
                isSaved={isLeadSaved(lead)}
                onSave={saveLead}
                onRemove={removeLead}
                showSaveButton={true}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default SavedLeads;

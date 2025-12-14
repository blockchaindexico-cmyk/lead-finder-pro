import { useState } from "react";
import { Zap, Database, Shield } from "lucide-react";
import { SearchForm } from "@/components/SearchForm";
import { LeadsGrid } from "@/components/LeadsGrid";
import { Lead, SearchParams } from "@/types/lead";
import { generateMockLeads } from "@/lib/mockLeads";
import { useToast } from "@/hooks/use-toast";

const Index = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const { toast } = useToast();

  const handleSearch = async (params: SearchParams) => {
    setIsLoading(true);
    setHasSearched(true);

    try {
      const results = await generateMockLeads(params);
      setLeads(results);
      toast({
        title: "Leads extracted successfully!",
        description: `Found ${results.length} leads for "${params.keyword}" in ${params.location}`,
      });
    } catch (error) {
      toast({
        title: "Error extracting leads",
        description: "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen gradient-subtle">
      {/* Header */}
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl gradient-primary flex items-center justify-center">
              <Zap className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">LeadExtract</h1>
              <p className="text-xs text-muted-foreground">Business Lead Generator</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <section className="text-center mb-12 animate-fade-in">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4">
            Extract Business Leads
            <span className="block text-accent">In Seconds</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
            Find contact information for businesses anywhere. Get emails, phone numbers, 
            websites, and addresses with a single search.
          </p>
        </section>

        {/* Features */}
        <section className="grid md:grid-cols-3 gap-4 mb-12">
          {[
            {
              icon: Zap,
              title: "Lightning Fast",
              description: "Extract leads in seconds"
            },
            {
              icon: Database,
              title: "Comprehensive Data",
              description: "Email, phone, website & more"
            },
            {
              icon: Shield,
              title: "Export Ready",
              description: "Download as CSV instantly"
            }
          ].map((feature, index) => (
            <div 
              key={feature.title}
              className="flex items-center gap-4 p-4 rounded-xl bg-card border border-border animate-slide-up"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="h-12 w-12 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                <feature.icon className="h-6 w-6 text-accent" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </div>
            </div>
          ))}
        </section>

        {/* Search Form */}
        <section className="bg-card rounded-2xl border border-border p-6 md:p-8 shadow-card mb-8 animate-slide-up" style={{ animationDelay: "200ms" }}>
          <h3 className="text-lg font-semibold text-foreground mb-6">Search for Leads</h3>
          <SearchForm onSearch={handleSearch} isLoading={isLoading} />
        </section>

        {/* Results */}
        <section className="bg-card rounded-2xl border border-border p-6 md:p-8 shadow-card animate-slide-up" style={{ animationDelay: "300ms" }}>
          <LeadsGrid leads={leads} isLoading={isLoading} hasSearched={hasSearched} />
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-card mt-16">
        <div className="container mx-auto px-4 py-6 text-center text-sm text-muted-foreground">
          <p>LeadExtract — Extract business leads with ease</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;

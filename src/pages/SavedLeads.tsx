import { Link } from "react-router-dom";
import { Zap, Bookmark, ArrowLeft, Loader2 } from "lucide-react";
import { LeadCard } from "@/components/LeadCard";
import { UserMenu } from "@/components/UserMenu";
import { Button } from "@/components/ui/button";
import { useSavedLeads } from "@/hooks/useSavedLeads";
import { useAuth } from "@/contexts/AuthContext";

const SavedLeads = () => {
  const { savedLeads, isLoading, removeLead, convertToLead } = useSavedLeads();
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="min-h-screen gradient-subtle flex flex-col items-center justify-center px-4">
        <Bookmark className="h-16 w-16 text-muted-foreground mb-4" />
        <h2 className="text-2xl font-bold text-foreground mb-2">Sign in to view saved leads</h2>
        <p className="text-muted-foreground mb-6 text-center">
          Create an account or sign in to save and manage your lead collection.
        </p>
        <Button asChild>
          <Link to="/auth">Sign In</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-subtle">
      {/* Header */}
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl gradient-primary flex items-center justify-center">
                <Zap className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">LeadExtract</h1>
                <p className="text-xs text-muted-foreground">Business Lead Generator</p>
              </div>
            </div>
            <UserMenu />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Back Button & Title */}
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Bookmark className="h-6 w-6 text-accent" />
              Saved Leads
            </h2>
            <p className="text-muted-foreground">
              {savedLeads.length} lead{savedLeads.length !== 1 ? 's' : ''} in your collection
            </p>
          </div>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : savedLeads.length === 0 ? (
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
            {savedLeads.map((saved, index) => (
              <LeadCard
                key={saved.id}
                lead={convertToLead(saved)}
                index={index}
                isSaved={true}
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

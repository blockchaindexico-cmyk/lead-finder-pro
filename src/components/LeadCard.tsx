import { useState } from "react";
import { Mail, Phone, Globe, MapPin, Star, Building, ExternalLink, Search, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Lead } from "@/types/lead";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface LeadCardProps {
  lead: Lead;
  index: number;
  onEmailFound?: (leadId: string, email: string) => void;
}

export function LeadCard({ lead, index, onEmailFound }: LeadCardProps) {
  const [isSearchingEmail, setIsSearchingEmail] = useState(false);
  const { toast } = useToast();

  const handleSearchEmail = async () => {
    if (!lead.website || lead.website === 'Not available') {
      toast({
        title: "No website available",
        description: "Cannot search for email without a website.",
        variant: "destructive",
      });
      return;
    }

    setIsSearchingEmail(true);
    try {
      const { data, error } = await supabase.functions.invoke('extract-email', {
        body: { websiteUrl: lead.website },
      });

      if (error) throw new Error(error.message);

      if (data.email) {
        onEmailFound?.(lead.id, data.email);
        toast({
          title: "Email found!",
          description: `Found: ${data.email}`,
        });
      } else {
        toast({
          title: "No email found",
          description: "Could not find an email on this website.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Email extraction error:', error);
      toast({
        title: "Error searching for email",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSearchingEmail(false);
    }
  };

  return (
    <Card 
      className="bg-card border-border shadow-card hover:shadow-elegant transition-all duration-300 animate-slide-up overflow-hidden"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-card-foreground truncate">
              {lead.name}
            </h3>
            <Badge variant="secondary" className="mt-1">
              <Building className="h-3 w-3 mr-1" />
              {lead.category}
            </Badge>
          </div>
          {lead.rating && (
            <div className="flex items-center gap-1 text-warning shrink-0">
              <Star className="h-4 w-4 fill-current" />
              <span className="text-sm font-medium">{lead.rating.toFixed(1)}</span>
            </div>
          )}
        </div>

        <div className="space-y-3">
          {/* Email Section */}
          {lead.email && lead.email !== 'Not available' ? (
            <a
              href={`mailto:${lead.email}`}
              className="flex items-center gap-3 text-sm text-muted-foreground hover:text-accent transition-colors group"
            >
              <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-accent/10 group-hover:bg-accent/20 transition-colors">
                <Mail className="h-4 w-4 text-accent" />
              </div>
              <span className="truncate">{lead.email}</span>
            </a>
          ) : (
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-secondary shrink-0">
                <Mail className="h-4 w-4 text-muted-foreground" />
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSearchEmail}
                disabled={isSearchingEmail || !lead.website || lead.website === 'Not available'}
                className="h-7 text-xs"
              >
                {isSearchingEmail ? (
                  <>
                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                    Searching...
                  </>
                ) : (
                  <>
                    <Search className="h-3 w-3 mr-1" />
                    Search Email
                  </>
                )}
              </Button>
            </div>
          )}

          <a
            href={`tel:${lead.phone}`}
            className="flex items-center gap-3 text-sm text-muted-foreground hover:text-accent transition-colors group"
          >
            <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-accent/10 group-hover:bg-accent/20 transition-colors">
              <Phone className="h-4 w-4 text-accent" />
            </div>
            <span>{lead.phone}</span>
          </a>

          <a
            href={lead.website.startsWith('http') ? lead.website : `https://${lead.website}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 text-sm text-muted-foreground hover:text-accent transition-colors group"
          >
            <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-accent/10 group-hover:bg-accent/20 transition-colors">
              <Globe className="h-4 w-4 text-accent" />
            </div>
            <span className="truncate">{lead.website}</span>
          </a>

          {lead.googleMapsUrl ? (
            <a
              href={lead.googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 text-sm text-muted-foreground hover:text-accent transition-colors group"
            >
              <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-accent/10 group-hover:bg-accent/20 transition-colors shrink-0">
                <MapPin className="h-4 w-4 text-accent" />
              </div>
              <span className="line-clamp-2 flex-1">{lead.address}</span>
              <ExternalLink className="h-3 w-3 shrink-0" />
            </a>
          ) : (
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-secondary shrink-0">
                <MapPin className="h-4 w-4 text-muted-foreground" />
              </div>
              <span className="line-clamp-2">{lead.address}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

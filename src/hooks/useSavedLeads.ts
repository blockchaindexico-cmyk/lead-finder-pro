import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Lead } from '@/types/lead';
import { useToast } from '@/hooks/use-toast';

export interface SavedLead {
  id: string;
  user_id: string;
  lead_name: string;
  lead_email: string | null;
  lead_phone: string | null;
  lead_website: string | null;
  lead_address: string | null;
  lead_category: string | null;
  lead_maps_url: string | null;
  created_at: string;
}

export const useSavedLeads = () => {
  const [savedLeads, setSavedLeads] = useState<SavedLead[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchSavedLeads = useCallback(async () => {
    if (!user) {
      setSavedLeads([]);
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('saved_leads')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSavedLeads(data || []);
    } catch (error) {
      console.error('Error fetching saved leads:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchSavedLeads();
  }, [fetchSavedLeads]);

  const isLeadSaved = useCallback((lead: Lead) => {
    return savedLeads.some(
      saved => saved.lead_name === lead.name && saved.lead_address === lead.address
    );
  }, [savedLeads]);

  const saveLead = async (lead: Lead) => {
    if (!user) {
      toast({
        title: 'Sign in required',
        description: 'Please sign in to save leads to your collection.',
        variant: 'destructive',
      });
      return false;
    }

    try {
      const { error } = await supabase.from('saved_leads').insert({
        user_id: user.id,
        lead_name: lead.name,
        lead_email: lead.email || null,
        lead_phone: lead.phone || null,
        lead_website: lead.website || null,
        lead_address: lead.address || null,
        lead_category: lead.category || null,
        lead_maps_url: lead.googleMapsUrl || null,
      });

      if (error) {
        if (error.code === '23505') {
          toast({
            title: 'Already saved',
            description: 'This lead is already in your collection.',
          });
          return false;
        }
        throw error;
      }

      toast({
        title: 'Lead saved!',
        description: `${lead.name} has been added to your collection.`,
      });
      
      await fetchSavedLeads();
      return true;
    } catch (error) {
      console.error('Error saving lead:', error);
      toast({
        title: 'Error saving lead',
        description: 'Please try again later.',
        variant: 'destructive',
      });
      return false;
    }
  };

  const removeLead = async (lead: Lead) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('saved_leads')
        .delete()
        .eq('user_id', user.id)
        .eq('lead_name', lead.name)
        .eq('lead_address', lead.address);

      if (error) throw error;

      toast({
        title: 'Lead removed',
        description: `${lead.name} has been removed from your collection.`,
      });
      
      await fetchSavedLeads();
      return true;
    } catch (error) {
      console.error('Error removing lead:', error);
      toast({
        title: 'Error removing lead',
        description: 'Please try again later.',
        variant: 'destructive',
      });
      return false;
    }
  };

  const convertToLead = (saved: SavedLead): Lead => ({
    id: saved.id,
    name: saved.lead_name,
    email: saved.lead_email || 'Not available',
    phone: saved.lead_phone || 'Not available',
    website: saved.lead_website || 'Not available',
    address: saved.lead_address || 'Not available',
    category: saved.lead_category || 'Business',
    googleMapsUrl: saved.lead_maps_url || undefined,
  });

  return {
    savedLeads,
    isLoading,
    isLeadSaved,
    saveLead,
    removeLead,
    convertToLead,
    refetch: fetchSavedLeads,
  };
};

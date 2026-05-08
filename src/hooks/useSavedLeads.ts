import { useState, useEffect, useCallback } from 'react';
import { Lead } from '@/types/lead';
import { useToast } from '@/hooks/use-toast';

const STORAGE_KEY = 'saved_leads_v1';

const leadKey = (lead: Lead) => `${lead.name}__${lead.address}`;

const readStorage = (): Lead[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const writeStorage = (leads: Lead[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(leads));
  window.dispatchEvent(new Event('saved-leads-changed'));
};

export const useSavedLeads = () => {
  const [savedLeads, setSavedLeads] = useState<Lead[]>(() => readStorage());
  const { toast } = useToast();

  useEffect(() => {
    const refresh = () => setSavedLeads(readStorage());
    window.addEventListener('saved-leads-changed', refresh);
    window.addEventListener('storage', refresh);
    return () => {
      window.removeEventListener('saved-leads-changed', refresh);
      window.removeEventListener('storage', refresh);
    };
  }, []);

  const isLeadSaved = useCallback(
    (lead: Lead) => savedLeads.some((s) => leadKey(s) === leadKey(lead)),
    [savedLeads]
  );

  const saveLead = async (lead: Lead) => {
    const current = readStorage();
    if (current.some((s) => leadKey(s) === leadKey(lead))) {
      toast({ title: 'Already saved', description: 'This lead is already in your collection.' });
      return false;
    }
    writeStorage([{ ...lead, emailLoading: false }, ...current]);
    toast({ title: 'Lead saved!', description: `${lead.name} added to your collection.` });
    return true;
  };

  const removeLead = async (lead: Lead) => {
    const current = readStorage();
    writeStorage(current.filter((s) => leadKey(s) !== leadKey(lead)));
    toast({ title: 'Lead removed', description: `${lead.name} removed from your collection.` });
    return true;
  };

  const clearAll = () => {
    writeStorage([]);
    toast({ title: 'Collection cleared' });
  };

  return { savedLeads, isLeadSaved, saveLead, removeLead, clearAll };
};

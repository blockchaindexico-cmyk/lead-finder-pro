-- Create saved_leads table
CREATE TABLE public.saved_leads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lead_name TEXT NOT NULL,
  lead_email TEXT,
  lead_phone TEXT,
  lead_website TEXT,
  lead_address TEXT,
  lead_category TEXT,
  lead_maps_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create unique constraint to prevent duplicate saves
CREATE UNIQUE INDEX idx_saved_leads_user_name ON public.saved_leads(user_id, lead_name, lead_address);

-- Enable RLS
ALTER TABLE public.saved_leads ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own saved leads" 
ON public.saved_leads 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can save leads" 
ON public.saved_leads 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their saved leads" 
ON public.saved_leads 
FOR DELETE 
USING (auth.uid() = user_id);
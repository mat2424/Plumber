
-- Customers table
CREATE TABLE public.customers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  address TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for now (no auth)" ON public.customers FOR ALL USING (true) WITH CHECK (true);

-- Jobs table
CREATE TYPE public.job_status AS ENUM ('draft','quoted','confirmed','in_progress','complete','invoiced','archived');

CREATE TABLE public.jobs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE RESTRICT,
  status public.job_status NOT NULL DEFAULT 'draft',
  job_address TEXT NOT NULL,
  description TEXT NOT NULL,
  scheduled_date DATE NOT NULL,
  scheduled_time TIME,
  time_in TIMESTAMPTZ,
  time_out TIMESTAMPTZ,
  total_hours NUMERIC(6,2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for now (no auth)" ON public.jobs FOR ALL USING (true) WITH CHECK (true);

-- Documents (quotes & invoices)
CREATE TYPE public.document_type AS ENUM ('quote','invoice');

CREATE TABLE public.documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  document_type public.document_type NOT NULL,
  charge_to TEXT NOT NULL,
  job_address TEXT NOT NULL,
  description_of_work TEXT,
  labour_charge NUMERIC(10,2) NOT NULL DEFAULT 0,
  total NUMERIC(10,2) NOT NULL DEFAULT 0,
  disclaimer_text TEXT NOT NULL DEFAULT 'This work was performed by a 4th-year plumbing apprentice, not a licensed plumber. The client was made aware of this prior to the commencement of work and agreed to proceed. Pricing reflects apprentice-level rates.',
  pdf_file_path TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for now (no auth)" ON public.documents FOR ALL USING (true) WITH CHECK (true);

-- Line items
CREATE TABLE public.line_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1,
  item_name TEXT NOT NULL,
  unit_price NUMERIC(10,2) NOT NULL DEFAULT 0,
  line_total NUMERIC(10,2) NOT NULL DEFAULT 0
);

ALTER TABLE public.line_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for now (no auth)" ON public.line_items FOR ALL USING (true) WITH CHECK (true);

-- Payments
CREATE TYPE public.payment_method AS ENUM ('cash','e_transfer');

CREATE TABLE public.payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  client_name TEXT NOT NULL,
  amount NUMERIC(10,2) NOT NULL,
  method public.payment_method NOT NULL,
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for now (no auth)" ON public.payments FOR ALL USING (true) WITH CHECK (true);

-- Updated_at triggers
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON public.customers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_jobs_updated_at BEFORE UPDATE ON public.jobs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

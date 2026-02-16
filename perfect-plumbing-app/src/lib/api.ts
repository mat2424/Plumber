import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export type Customer = {
  id: string;
  full_name: string;
  phone: string;
  email: string | null;
  address: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type Job = {
  id: string;
  customer_id: string;
  status: "draft" | "quoted" | "confirmed" | "in_progress" | "complete" | "invoiced" | "archived";
  job_address: string;
  description: string;
  scheduled_date: string;
  scheduled_time: string | null;
  time_in: string | null;
  time_out: string | null;
  total_hours: number | null;
  created_at: string;
  updated_at: string;
  customers?: Customer;
};

export type Document = {
  id: string;
  job_id: string;
  document_type: "quote" | "invoice";
  charge_to: string;
  job_address: string;
  description_of_work: string | null;
  labour_charge: number;
  total: number;
  disclaimer_text: string;
  pdf_file_path: string | null;
  created_at: string;
};

export type LineItem = {
  id: string;
  document_id: string;
  quantity: number;
  item_name: string;
  unit_price: number;
  line_total: number;
};

export type Payment = {
  id: string;
  job_id: string;
  client_name: string;
  amount: number;
  method: "cash" | "e_transfer";
  payment_date: string;
  created_at: string;
};

// Customers
export const useCustomers = () =>
  useQuery({
    queryKey: ["customers"],
    queryFn: async () => {
      const { data, error } = await supabase.from("customers").select("*").order("full_name");
      if (error) throw error;
      return data as Customer[];
    },
  });

export const useCreateCustomer = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (c: Omit<Customer, "id" | "created_at" | "updated_at">) => {
      const { data, error } = await supabase.from("customers").insert(c).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["customers"] }),
  });
};

export const useUpdateCustomer = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...c }: Partial<Customer> & { id: string }) => {
      const { data, error } = await supabase.from("customers").update(c).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["customers"] }),
  });
};

export const useDeleteCustomer = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("customers").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["customers"] }),
  });
};

// Jobs
export const useJobs = (statusFilter?: string) =>
  useQuery({
    queryKey: ["jobs", statusFilter],
    queryFn: async () => {
      let q = supabase.from("jobs").select("*, customers(full_name, phone)").order("scheduled_date", { ascending: false });
      if (statusFilter && statusFilter !== "all") {
        q = q.eq("status", statusFilter as any);
      }
      const { data, error } = await q;
      if (error) throw error;
      return data as (Job & { customers: { full_name: string; phone: string } })[];
    },
  });

export const useJob = (id: string) =>
  useQuery({
    queryKey: ["job", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("jobs").select("*, customers(*)").eq("id", id).single();
      if (error) throw error;
      return data as Job & { customers: Customer };
    },
    enabled: !!id,
  });

export const useCreateJob = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (j: { customer_id: string; job_address: string; description: string; scheduled_date: string; scheduled_time?: string }) => {
      const { data, error } = await supabase.from("jobs").insert(j).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["jobs"] }),
  });
};

export const useUpdateJob = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...j }: Partial<Job> & { id: string }) => {
      const { data, error } = await supabase.from("jobs").update(j).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["jobs"] });
      qc.invalidateQueries({ queryKey: ["job", vars.id] });
    },
  });
};

// Documents
export const useDocuments = (jobId: string, type?: "quote" | "invoice") =>
  useQuery({
    queryKey: ["documents", jobId, type],
    queryFn: async () => {
      let q = supabase.from("documents").select("*").eq("job_id", jobId);
      if (type) q = q.eq("document_type", type);
      const { data, error } = await q.order("created_at", { ascending: false });
      if (error) throw error;
      return data as Document[];
    },
    enabled: !!jobId,
  });

export const useCreateDocument = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (d: Omit<Document, "id" | "created_at">) => {
      const { data, error } = await supabase.from("documents").insert(d).select().single();
      if (error) throw error;
      return data as Document;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["documents"] }),
  });
};

// Line Items
export const useLineItems = (documentId: string) =>
  useQuery({
    queryKey: ["line_items", documentId],
    queryFn: async () => {
      const { data, error } = await supabase.from("line_items").select("*").eq("document_id", documentId);
      if (error) throw error;
      return data as LineItem[];
    },
    enabled: !!documentId,
  });

export const useCreateLineItems = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (items: Omit<LineItem, "id">[]) => {
      const { data, error } = await supabase.from("line_items").insert(items).select();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["line_items"] }),
  });
};

// Payments
export const usePayments = (jobId?: string) =>
  useQuery({
    queryKey: ["payments", jobId],
    queryFn: async () => {
      let q = supabase.from("payments").select("*");
      if (jobId) q = q.eq("job_id", jobId);
      const { data, error } = await q.order("payment_date", { ascending: false });
      if (error) throw error;
      return data as Payment[];
    },
  });

export const useCreatePayment = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (p: Omit<Payment, "id" | "created_at">) => {
      const { data, error } = await supabase.from("payments").insert(p).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["payments"] });
      qc.invalidateQueries({ queryKey: ["jobs"] });
    },
  });
};

// Dashboard stats
export const useDashboardStats = () =>
  useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const today = new Date().toISOString().split("T")[0];
      const weekEnd = new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0];

      const [todayJobs, weekJobs, unpaidRes, pendingQuotes] = await Promise.all([
        supabase.from("jobs").select("*, customers(full_name, phone)").eq("scheduled_date", today).not("status", "in", '("archived","invoiced")').order("scheduled_time"),
        supabase.from("jobs").select("id", { count: "exact" }).gte("scheduled_date", today).lte("scheduled_date", weekEnd).not("status", "in", '("archived","invoiced")'),
        supabase.from("jobs").select("id", { count: "exact" }).eq("status", "complete"),
        supabase.from("jobs").select("id", { count: "exact" }).eq("status", "quoted"),
      ]);

      return {
        todayJobs: (todayJobs.data ?? []) as (Job & { customers: { full_name: string; phone: string } })[],
        weekCount: weekJobs.count ?? 0,
        unpaidCount: unpaidRes.count ?? 0,
        pendingQuotes: pendingQuotes.count ?? 0,
      };
    },
  });

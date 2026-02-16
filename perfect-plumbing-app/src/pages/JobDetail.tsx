import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useJob, useUpdateJob, useDocuments, useCreateDocument, useCreateLineItems, usePayments, useCreatePayment, useLineItems } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ArrowLeft, Play, CheckCircle, Clock, MapPin, Plus, Trash2, Download } from "lucide-react";
import JobStatusBadge from "@/components/JobStatusBadge";
import { format } from "date-fns";
import { toast } from "sonner";
import type { Job } from "@/lib/api";

type JobStatus = Job["status"];

const validTransitions: Record<JobStatus, JobStatus[]> = {
  draft: ["quoted"],
  quoted: ["confirmed"],
  confirmed: ["in_progress"],
  in_progress: ["complete"],
  complete: ["invoiced"],
  invoiced: ["archived"],
  archived: [],
};

const JobDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: job, isLoading } = useJob(id!);
  const updateJob = useUpdateJob();
  const { data: quotes } = useDocuments(id!, "quote");
  const { data: invoices } = useDocuments(id!, "invoice");
  const { data: payments } = usePayments(id!);
  const [jobDoneOpen, setJobDoneOpen] = useState(false);

  if (isLoading) return <div className="animate-pulse space-y-4"><div className="h-8 bg-card rounded w-48" /><div className="h-32 bg-card rounded" /></div>;
  if (!job) return <div className="text-center py-12 text-muted-foreground">Job not found</div>;

  const handleStatusChange = async (newStatus: JobStatus) => {
    const updates: Partial<Job> & { id: string } = { id: job.id, status: newStatus };
    if (newStatus === "in_progress") updates.time_in = new Date().toISOString();
    if (newStatus === "complete") {
      updates.time_out = new Date().toISOString();
      if (job.time_in) {
        const hours = (Date.now() - new Date(job.time_in).getTime()) / 3600000;
        updates.total_hours = Math.round(hours * 100) / 100;
      }
    }
    try {
      await updateJob.mutateAsync(updates);
      if (newStatus === "complete") setJobDoneOpen(true);
      toast.success(`Job ${newStatus.replace("_", " ")}`);
    } catch { toast.error("Failed to update job"); }
  };

  const nextStatus = validTransitions[job.status]?.[0];
  const actionButton: Record<string, { label: string; icon: any }> = {
    quoted: { label: "Confirm Quote", icon: CheckCircle },
    confirmed: { label: "Start Job", icon: Play },
    in_progress: { label: "Job Done", icon: CheckCircle },
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-muted-foreground hover:text-foreground text-sm">
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      <div className="bg-card rounded-lg p-4 card-glow">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-xl font-bold">{job.customers?.full_name}</h1>
          <JobStatusBadge status={job.status} />
        </div>
        <div className="space-y-1 text-sm text-muted-foreground">
          <p className="flex items-center gap-2"><MapPin className="w-4 h-4" /> {job.job_address}</p>
          <p className="flex items-center gap-2"><Clock className="w-4 h-4" /> {format(new Date(job.scheduled_date), "MMM d, yyyy")} {job.scheduled_time && `at ${job.scheduled_time}`}</p>
        </div>
        {job.time_in && <p className="text-xs text-primary mt-2">Started: {format(new Date(job.time_in), "h:mm a")}</p>}
        {job.time_out && <p className="text-xs text-success mt-1">Finished: {format(new Date(job.time_out), "h:mm a")} ({job.total_hours}h)</p>}
      </div>

      {/* Action buttons */}
      {nextStatus && actionButton[job.status] && (
        <Button onClick={() => handleStatusChange(nextStatus)} className="w-full gold-gradient text-primary-foreground font-semibold h-12" disabled={updateJob.isPending}>
          {(() => { const cfg = actionButton[job.status]; if (!cfg) return null; const Icon = cfg.icon; return <Icon className="w-5 h-5 mr-2" />; })()}
          {actionButton[job.status]?.label}
        </Button>
      )}

      <Tabs defaultValue="details" className="w-full">
        <TabsList className="w-full bg-secondary">
          <TabsTrigger value="details" className="flex-1">Details</TabsTrigger>
          <TabsTrigger value="quote" className="flex-1">Quote</TabsTrigger>
          <TabsTrigger value="invoice" className="flex-1">Invoice</TabsTrigger>
          <TabsTrigger value="payments" className="flex-1">Payments</TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="mt-4">
          <div className="bg-card rounded-lg p-4 card-glow">
            <h3 className="font-semibold mb-2">Description</h3>
            <p className="text-sm text-muted-foreground">{job.description}</p>
          </div>
        </TabsContent>

        <TabsContent value="quote" className="mt-4">
          <QuoteTab jobId={job.id} job={job} quotes={quotes ?? []} />
        </TabsContent>

        <TabsContent value="invoice" className="mt-4">
          <InvoiceTab jobId={job.id} job={job} invoices={invoices ?? []} />
        </TabsContent>

        <TabsContent value="payments" className="mt-4">
          <PaymentsTab payments={payments ?? []} />
        </TabsContent>
      </Tabs>

      <JobDoneModal open={jobDoneOpen} onClose={() => setJobDoneOpen(false)} job={job} />
    </div>
  );
};

// Quote Tab
const QuoteTab = ({ jobId, job, quotes }: { jobId: string; job: any; quotes: any[] }) => {
  const createDoc = useCreateDocument();
  const createItems = useCreateLineItems();
  const updateJob = useUpdateJob();
  const [materials, setMaterials] = useState([{ item_name: "", quantity: 1, unit_price: 0 }]);
  const [labour, setLabour] = useState(0);
  const [description, setDescription] = useState(job.description || "");
  const latestQuote = quotes[0];

  const materialsTotal = materials.reduce((sum, m) => sum + m.quantity * m.unit_price, 0);
  const total = materialsTotal + labour;

  const handleGenerate = async () => {
    try {
      const doc = await createDoc.mutateAsync({
        job_id: jobId,
        document_type: "quote",
        charge_to: job.customers?.full_name ?? "",
        job_address: job.job_address,
        description_of_work: description,
        labour_charge: labour,
        total,
        disclaimer_text: "This work was performed by a 4th-year plumbing apprentice, not a licensed plumber. The client was made aware of this prior to the commencement of work and agreed to proceed. Pricing reflects apprentice-level rates.",
        pdf_file_path: null,
      });
      if (materials.some((m) => m.item_name)) {
        await createItems.mutateAsync(
          materials.filter((m) => m.item_name).map((m) => ({
            document_id: doc.id,
            quantity: m.quantity,
            item_name: m.item_name,
            unit_price: m.unit_price,
            line_total: m.quantity * m.unit_price,
          }))
        );
      }
      if (job.status === "draft") {
        await updateJob.mutateAsync({ id: jobId, status: "quoted" });
      }
      toast.success("Quote generated!");
    } catch { toast.error("Failed to generate quote"); }
  };

  if (latestQuote) return <QuoteView doc={latestQuote} />;

  return (
    <div className="space-y-4">
      <div className="bg-card rounded-lg p-4 card-glow space-y-3">
        <Textarea placeholder="Description of Work" value={description} onChange={(e) => setDescription(e.target.value)} className="bg-secondary border-border" />
        <h3 className="font-semibold text-sm">Materials</h3>
        {materials.map((m, i) => (
          <div key={i} className="flex gap-2 items-center">
            <Input placeholder="Item" value={m.item_name} onChange={(e) => { const n = [...materials]; n[i].item_name = e.target.value; setMaterials(n); }} className="bg-secondary border-border flex-1 text-sm" />
            <Input type="number" min={1} value={m.quantity} onChange={(e) => { const n = [...materials]; n[i].quantity = parseInt(e.target.value) || 1; setMaterials(n); }} className="bg-secondary border-border w-16 text-sm" />
            <Input type="number" step="0.01" min={0} placeholder="$" value={m.unit_price || ""} onChange={(e) => { const n = [...materials]; n[i].unit_price = parseFloat(e.target.value) || 0; setMaterials(n); }} className="bg-secondary border-border w-24 text-sm" />
            <span className="text-sm text-muted-foreground w-16 text-right">${(m.quantity * m.unit_price).toFixed(2)}</span>
            {materials.length > 1 && (
              <button onClick={() => setMaterials(materials.filter((_, j) => j !== i))}><Trash2 className="w-4 h-4 text-destructive" /></button>
            )}
          </div>
        ))}
        <Button variant="outline" size="sm" onClick={() => setMaterials([...materials, { item_name: "", quantity: 1, unit_price: 0 }])}>
          <Plus className="w-3 h-3 mr-1" /> Add Item
        </Button>
        <div className="flex items-center justify-between pt-2 border-t border-border">
          <span className="text-sm font-medium">Labour / Flat Rate</span>
          <Input type="number" step="0.01" value={labour || ""} onChange={(e) => setLabour(parseFloat(e.target.value) || 0)} className="bg-secondary border-border w-32 text-right" />
        </div>
        <div className="flex items-center justify-between pt-2 border-t border-border">
          <span className="font-bold">Total</span>
          <span className="font-bold text-primary text-lg">${total.toFixed(2)}</span>
        </div>
      </div>
      <Button onClick={handleGenerate} className="w-full gold-gradient text-primary-foreground font-semibold h-12" disabled={createDoc.isPending}>
        {createDoc.isPending ? "Generating..." : "Generate Quote"}
      </Button>
    </div>
  );
};

const QuoteView = ({ doc }: { doc: any }) => {
  const { data: items } = useLineItems(doc.id);
  return (
    <div className="bg-card rounded-lg p-4 card-glow space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Quote</h3>
        <span className="text-xs text-muted-foreground">{format(new Date(doc.created_at), "MMM d, yyyy")}</span>
      </div>
      <p className="text-sm"><span className="text-muted-foreground">Charge To:</span> {doc.charge_to}</p>
      <p className="text-sm"><span className="text-muted-foreground">Address:</span> {doc.job_address}</p>
      {doc.description_of_work && <p className="text-sm"><span className="text-muted-foreground">Work:</span> {doc.description_of_work}</p>}
      {items && items.length > 0 && (
        <div className="space-y-1">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase">Materials</h4>
          {items.map((item) => (
            <div key={item.id} className="flex justify-between text-sm">
              <span>{item.quantity}x {item.item_name}</span>
              <span>${item.line_total.toFixed(2)}</span>
            </div>
          ))}
        </div>
      )}
      <div className="flex justify-between text-sm"><span className="text-muted-foreground">Labour</span><span>${Number(doc.labour_charge).toFixed(2)}</span></div>
      <div className="flex justify-between font-bold border-t border-border pt-2"><span>Total</span><span className="text-primary">${Number(doc.total).toFixed(2)}</span></div>
      <p className="text-xs text-muted-foreground italic">{doc.disclaimer_text}</p>
    </div>
  );
};

// Invoice Tab
const InvoiceTab = ({ jobId, job, invoices }: { jobId: string; job: any; invoices: any[] }) => {
  const latestInvoice = invoices[0];
  if (!latestInvoice && !["complete", "invoiced", "archived"].includes(job.status)) {
    return <div className="bg-card rounded-lg p-8 text-center card-glow"><p className="text-muted-foreground">Complete the job to generate an invoice</p></div>;
  }
  if (latestInvoice) return <QuoteView doc={latestInvoice} />;
  return <div className="bg-card rounded-lg p-8 text-center card-glow"><p className="text-muted-foreground">Use "Job Done" to generate invoice</p></div>;
};

// Payments Tab
const PaymentsTab = ({ payments }: { payments: any[] }) => {
  if (payments.length === 0) return <div className="bg-card rounded-lg p-8 text-center card-glow"><p className="text-muted-foreground">No payments recorded</p></div>;
  return (
    <div className="space-y-2">
      {payments.map((p) => (
        <div key={p.id} className="bg-card rounded-lg p-4 card-glow flex justify-between items-center">
          <div>
            <p className="font-medium">${Number(p.amount).toFixed(2)}</p>
            <p className="text-xs text-muted-foreground">{p.method === "cash" ? "Cash" : "E-Transfer"} • {format(new Date(p.payment_date), "MMM d, yyyy")}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

// Job Done Modal
const JobDoneModal = ({ open, onClose, job }: { open: boolean; onClose: () => void; job: any }) => {
  const createPayment = useCreatePayment();
  const createDoc = useCreateDocument();
  const updateJob = useUpdateJob();
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<"cash" | "e_transfer">("cash");

  const handleSave = async () => {
    if (!amount || parseFloat(amount) <= 0) { toast.error("Enter a valid amount"); return; }
    try {
      await createPayment.mutateAsync({
        job_id: job.id,
        client_name: job.customers?.full_name ?? "",
        amount: parseFloat(amount),
        method,
        payment_date: new Date().toISOString().split("T")[0],
      });
      await createDoc.mutateAsync({
        job_id: job.id,
        document_type: "invoice",
        charge_to: job.customers?.full_name ?? "",
        job_address: job.job_address,
        description_of_work: job.description,
        labour_charge: parseFloat(amount),
        total: parseFloat(amount),
        disclaimer_text: "This work was performed by a 4th-year plumbing apprentice, not a licensed plumber. The client was made aware of this prior to the commencement of work and agreed to proceed. Pricing reflects apprentice-level rates.",
        pdf_file_path: null,
      });
      await updateJob.mutateAsync({ id: job.id, status: "invoiced" });
      toast.success("Payment recorded & invoice generated!");
      onClose();
    } catch { toast.error("Failed to save"); }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="bg-card border-border">
        <DialogHeader><DialogTitle>Job Done 🎉</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-sm text-muted-foreground">Client</label>
            <Input value={job.customers?.full_name ?? ""} disabled className="bg-secondary border-border mt-1" />
          </div>
          <div>
            <label className="text-sm text-muted-foreground">Job Address</label>
            <Input value={job.job_address} disabled className="bg-secondary border-border mt-1" />
          </div>
          <div>
            <label className="text-sm text-muted-foreground">Amount Paid *</label>
            <Input type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="$0.00" className="bg-secondary border-border mt-1" />
          </div>
          <div>
            <label className="text-sm text-muted-foreground mb-2 block">Payment Method</label>
            <div className="flex gap-2">
              <button onClick={() => setMethod("cash")} className={`flex-1 py-3 rounded-lg font-medium text-sm transition-colors ${method === "cash" ? "gold-gradient text-primary-foreground" : "bg-secondary text-muted-foreground"}`}>Cash</button>
              <button onClick={() => setMethod("e_transfer")} className={`flex-1 py-3 rounded-lg font-medium text-sm transition-colors ${method === "e_transfer" ? "gold-gradient text-primary-foreground" : "bg-secondary text-muted-foreground"}`}>E-Transfer</button>
            </div>
          </div>
          <Button onClick={handleSave} className="w-full gold-gradient text-primary-foreground font-semibold h-12" disabled={createPayment.isPending}>
            {createPayment.isPending ? "Saving..." : "Save & Generate Invoice"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default JobDetail;

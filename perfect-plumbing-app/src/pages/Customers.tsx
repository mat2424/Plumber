import { useState } from "react";
import { useCustomers, useCreateCustomer, useUpdateCustomer, useDeleteCustomer, type Customer } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Plus, Search, Phone, Mail, MapPin, ChevronDown, ChevronUp, Trash2 } from "lucide-react";
import { toast } from "sonner";

const Customers = () => {
  const { data: customers, isLoading } = useCustomers();
  const createCustomer = useCreateCustomer();
  const updateCustomer = useUpdateCustomer();
  const deleteCustomer = useDeleteCustomer();
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ full_name: "", phone: "", email: "", address: "", notes: "" });

  const filtered = customers?.filter((c) =>
    [c.full_name, c.phone, c.address].some((v) => v?.toLowerCase().includes(search.toLowerCase()))
  );

  const handleCreate = async () => {
    if (!form.full_name || !form.phone) { toast.error("Name and phone are required"); return; }
    try {
      await createCustomer.mutateAsync({ ...form, email: form.email || null, address: form.address || null, notes: form.notes || null });
      setForm({ full_name: "", phone: "", email: "", address: "", notes: "" });
      setDialogOpen(false);
      toast.success("Customer created");
    } catch { toast.error("Failed to create customer"); }
  };

  const handleUpdate = async (id: string, field: string, value: string) => {
    try {
      await updateCustomer.mutateAsync({ id, [field]: value || null });
    } catch { toast.error("Failed to update"); }
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Customers</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gold-gradient text-primary-foreground font-semibold" size="sm">
              <Plus className="w-4 h-4 mr-1" /> New
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border">
            <DialogHeader><DialogTitle>New Customer</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <Input placeholder="Full Name *" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} className="bg-secondary border-border" />
              <Input placeholder="Phone *" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="bg-secondary border-border" />
              <Input placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="bg-secondary border-border" />
              <Input placeholder="Address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="bg-secondary border-border" />
              <Textarea placeholder="Notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="bg-secondary border-border" />
              <Button onClick={handleCreate} className="w-full gold-gradient text-primary-foreground font-semibold" disabled={createCustomer.isPending}>
                {createCustomer.isPending ? "Creating..." : "Create Customer"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Search customers..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10 bg-card border-border" />
      </div>

      {isLoading ? (
        <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="bg-card rounded-lg h-16 animate-pulse" />)}</div>
      ) : filtered?.length === 0 ? (
        <div className="bg-card rounded-lg p-8 text-center card-glow">
          <p className="text-muted-foreground">No customers found</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered?.map((c) => (
            <CustomerRow
              key={c.id}
              customer={c}
              expanded={expandedId === c.id}
              onToggle={() => setExpandedId(expandedId === c.id ? null : c.id)}
              onUpdate={handleUpdate}
              onDelete={async () => {
                try { await deleteCustomer.mutateAsync(c.id); toast.success("Deleted"); }
                catch { toast.error("Cannot delete — customer has linked jobs"); }
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const CustomerRow = ({ customer: c, expanded, onToggle, onUpdate, onDelete }: {
  customer: Customer; expanded: boolean; onToggle: () => void;
  onUpdate: (id: string, field: string, value: string) => void;
  onDelete: () => void;
}) => (
  <div className="bg-card rounded-lg card-glow overflow-hidden">
    <button onClick={onToggle} className="w-full flex items-center justify-between p-4 text-left">
      <div>
        <p className="font-medium">{c.full_name}</p>
        <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
          <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {c.phone}</span>
        </div>
      </div>
      {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
    </button>
    {expanded && (
      <div className="px-4 pb-4 space-y-3 border-t border-border pt-3">
        <EditField icon={Phone} label="Phone" value={c.phone} onSave={(v) => onUpdate(c.id, "phone", v)} />
        <EditField icon={Mail} label="Email" value={c.email ?? ""} onSave={(v) => onUpdate(c.id, "email", v)} />
        <EditField icon={MapPin} label="Address" value={c.address ?? ""} onSave={(v) => onUpdate(c.id, "address", v)} />
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="sm" className="text-destructive w-full"><Trash2 className="w-4 h-4 mr-1" /> Delete Customer</Button>
          </AlertDialogTrigger>
          <AlertDialogContent className="bg-card border-border">
            <AlertDialogHeader><AlertDialogTitle>Delete customer?</AlertDialogTitle><AlertDialogDescription>This cannot be undone.</AlertDialogDescription></AlertDialogHeader>
            <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={onDelete} className="bg-destructive">Delete</AlertDialogAction></AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    )}
  </div>
);

const EditField = ({ icon: Icon, label, value, onSave }: { icon: any; label: string; value: string; onSave: (v: string) => void }) => {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(value);
  return (
    <div className="flex items-center gap-2">
      <Icon className="w-4 h-4 text-muted-foreground shrink-0" />
      {editing ? (
        <Input value={val} onChange={(e) => setVal(e.target.value)} onBlur={() => { onSave(val); setEditing(false); }} onKeyDown={(e) => { if (e.key === "Enter") { onSave(val); setEditing(false); } }} autoFocus className="h-8 bg-secondary border-border text-sm" />
      ) : (
        <button onClick={() => setEditing(true)} className="text-sm text-left flex-1 hover:text-primary transition-colors">
          {value || <span className="text-muted-foreground italic">Add {label.toLowerCase()}</span>}
        </button>
      )}
    </div>
  );
};

export default Customers;

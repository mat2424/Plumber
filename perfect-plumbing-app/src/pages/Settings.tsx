import logo from "@/assets/logo.jpg";

const Settings = () => {
  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-2xl font-bold">Settings</h1>

      <div className="bg-card rounded-lg p-6 card-glow space-y-4">
        <div className="flex items-center gap-4">
          <img src={logo} alt="Perfect Plumbing" className="w-16 h-16 rounded-lg object-cover" />
          <div>
            <h2 className="font-bold text-lg">Perfect Plumbing</h2>
            <p className="text-sm text-muted-foreground">We Seal • You Smile</p>
          </div>
        </div>
      </div>

      <div className="bg-card rounded-lg p-4 card-glow space-y-3">
        <h3 className="font-semibold">Business Info</h3>
        <div className="text-sm space-y-2">
          <p><span className="text-muted-foreground">Business:</span> Perfect Plumbing</p>
          <p><span className="text-muted-foreground">Operator:</span> 4th-Year Plumbing Apprentice</p>
        </div>
      </div>

      <div className="bg-card rounded-lg p-4 card-glow">
        <h3 className="font-semibold mb-2">Disclaimer</h3>
        <p className="text-xs text-muted-foreground italic">
          This work was performed by a 4th-year plumbing apprentice, not a licensed plumber. The client was made aware of this prior to the commencement of work and agreed to proceed. Pricing reflects apprentice-level rates.
        </p>
      </div>

      <p className="text-xs text-center text-muted-foreground">Perfect Plumbing v1.0 • Built with ❤️</p>
    </div>
  );
};

export default Settings;

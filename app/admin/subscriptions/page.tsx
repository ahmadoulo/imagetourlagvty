import { CreditCard, Check, Zap } from "lucide-react";

export default function AdminSubscriptionsPage() {
  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Subscriptions</h1>
        <p className="text-muted-foreground mt-1">Manage user plans and billing.</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-background border rounded-xl p-6 shadow-sm flex flex-col">
          <h3 className="text-xl font-bold">Free Plan</h3>
          <p className="text-muted-foreground text-sm mt-2">Standard limit per user.</p>
          <div className="mt-4 space-y-2 flex-1">
            <div className="flex items-center gap-2 text-sm"><Check className="w-4 h-4 text-green-500" /> 10GB Storage limit</div>
            <div className="flex items-center gap-2 text-sm"><Check className="w-4 h-4 text-green-500" /> 50MB File limit</div>
          </div>
          <button className="mt-6 w-full py-2 bg-muted text-muted-foreground font-medium rounded-md hover:bg-muted/80 transition-colors" disabled>Active</button>
        </div>

        <div className="bg-primary/5 border border-primary/20 rounded-xl p-6 shadow-sm flex flex-col relative">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
            <Zap className="w-3 h-3" /> Most Popular
          </div>
          <h3 className="text-xl font-bold text-primary">Pro Plan</h3>
          <p className="text-muted-foreground text-sm mt-2">$15 / month</p>
          <div className="mt-4 space-y-2 flex-1">
            <div className="flex items-center gap-2 text-sm"><Check className="w-4 h-4 text-primary" /> 100GB Storage limit</div>
            <div className="flex items-center gap-2 text-sm"><Check className="w-4 h-4 text-primary" /> 500MB File limit</div>
            <div className="flex items-center gap-2 text-sm"><Check className="w-4 h-4 text-primary" /> Priority support</div>
          </div>
          <button className="mt-6 w-full py-2 bg-primary text-primary-foreground font-medium rounded-md hover:bg-primary/90 transition-colors">Edit Plan</button>
        </div>

        <div className="bg-background border rounded-xl p-6 shadow-sm flex flex-col">
          <h3 className="text-xl font-bold">Business Plan</h3>
          <p className="text-muted-foreground text-sm mt-2">$49 / month</p>
          <div className="mt-4 space-y-2 flex-1">
            <div className="flex items-center gap-2 text-sm"><Check className="w-4 h-4 text-green-500" /> Unlimited Storage</div>
            <div className="flex items-center gap-2 text-sm"><Check className="w-4 h-4 text-green-500" /> Unlimited File limit</div>
            <div className="flex items-center gap-2 text-sm"><Check className="w-4 h-4 text-green-500" /> 24/7 Phone support</div>
          </div>
          <button className="mt-6 w-full py-2 border bg-background text-foreground font-medium rounded-md hover:bg-muted transition-colors">Edit Plan</button>
        </div>
      </div>

      <div className="bg-background border rounded-xl p-12 text-center text-muted-foreground flex flex-col items-center justify-center mt-8 shadow-sm">
        <CreditCard className="w-12 h-12 mb-4 opacity-50" />
        <h2 className="text-lg font-medium text-foreground mb-2">Billing Integration Missing</h2>
        <p className="max-w-md mx-auto">
          To manage real subscriptions, you need to connect a payment provider like Stripe or LemonSqueezy. Update your environment variables to enable billing features.
        </p>
      </div>
    </div>
  );
}

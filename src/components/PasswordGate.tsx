import { useState, useEffect } from "react";
import { Zap, Lock, Loader2, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

// Change this password to set your own access password
const ACCESS_PASSWORD = import.meta.env.VITE_APP_ACCESS_PASSWORD || "admin";

const STORAGE_KEY = "site_access_granted";

interface PasswordGateProps {
  children: React.ReactNode;
}

export const PasswordGate = ({ children }: PasswordGateProps) => {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (sessionStorage.getItem(STORAGE_KEY) === "true") {
      setIsUnlocked(true);
    }
    setIsChecking(false);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    setTimeout(() => {
      if (password === ACCESS_PASSWORD) {
        sessionStorage.setItem(STORAGE_KEY, "true");
        setIsUnlocked(true);
        toast({ title: "Access granted", description: "Welcome to LeadExtract." });
      } else {
        toast({
          title: "Incorrect password",
          description: "Please try again.",
          variant: "destructive",
        });
        setPassword("");
      }
      setIsSubmitting(false);
    }, 200);
  };

  if (isChecking) {
    return (
      <div className="min-h-screen gradient-subtle flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isUnlocked) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen gradient-subtle flex flex-col">
      <header className="border-b border-border bg-card/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl gradient-primary flex items-center justify-center">
              <Zap className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">LeadExtract</h1>
              <p className="text-xs text-muted-foreground">Business Lead Generator</p>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="bg-card rounded-2xl border border-border p-8 shadow-card animate-slide-up">
            <div className="text-center mb-8">
              <div className="h-12 w-12 rounded-xl bg-accent/10 flex items-center justify-center mx-auto mb-4">
                <Lock className="h-6 w-6 text-accent" />
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-2">Protected Site</h2>
              <p className="text-muted-foreground">Enter the access password to continue</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="password" className="text-foreground">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10"
                    autoFocus
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full gradient-primary hover:opacity-90 transition-opacity"
                disabled={isSubmitting || !password}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Unlocking...
                  </>
                ) : (
                  "Unlock"
                )}
              </Button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
};

export const lockSite = () => {
  sessionStorage.removeItem(STORAGE_KEY);
  window.location.reload();
};

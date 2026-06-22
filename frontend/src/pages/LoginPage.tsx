import { useState } from "react";
import { useNavigate } from "react-router";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth, AGENCY_CREDS } from "@/context/AuthContext";

// ── Types ──────────────────────────────────────────────────────────────────────

type LoginTab = "staff" | "agency";

// ── Component ──────────────────────────────────────────────────────────────────

export default function LoginPage() {
  const [tab, setTab] = useState<LoginTab>("staff");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  function switchTab(next: LoginTab) {
    setTab(next);
    setEmail("");
    setPassword("");
    setError("");
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const result = login(email.trim(), password);
    setLoading(false);
    if (result.ok) {
      if (tab === "staff") {
        navigate("/marketing");
      } else {
        const cred = AGENCY_CREDS.find(a => a.email.toLowerCase() === email.trim().toLowerCase());
        const slug = cred?.agencyName ? cred.agencyName.toLowerCase().replace(/\s+/g, '-') : 'portal';
        navigate(`/agency/${slug}`);
      }
    } else {
      setError(result.error ?? "Login failed");
    }
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* ── Left branding panel ─────────────────────────────────────────────── */}
      <div className="hidden lg:flex w-[44%] bg-deep-green flex-col justify-between p-12 relative overflow-hidden select-none">
        {/* Decorative blobs */}
        <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-forest-green/60 blur-sm" />
        <div className="absolute top-1/2 -left-32  w-72 h-72 rounded-full bg-forest-green/40 blur-sm" />
        <div className="absolute -bottom-28 right-10 w-64 h-64 rounded-full bg-teal/10 blur-sm" />

        {/* Logo */}
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-white flex items-center justify-center ring-1 ring-white/20 overflow-hidden">
              <img src="/scalystic_logo_only.png" alt="Scalystic logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <p className="text-white font-bold text-xl leading-tight">
                Scalystic AIOS
              </p>
              <p className="text-mint-green text-[10px] font-semibold tracking-wider">
                Ved Sanjeevani
              </p>
            </div>
          </div>
        </div>

        {/* Headline */}
        <div className="relative z-10 space-y-4">
          <h2 className="text-[2.6rem] font-bold text-white leading-[1.15]">
            Marketing
            <br />
            Management
            <br />
            <span className="text-mint-green">Platform</span>.
          </h2>
          <p className="text-sage-green text-sm leading-relaxed max-w-xs">
            Unified AI Operations System for Ayurvedic marketing, content, and
            campaign management across every channel.
          </p>

          {/* Metric pills */}
          <div className="flex gap-3 pt-2">
            {[
              { label: "Content Pieces", value: "23+" },
              { label: "Active Campaigns", value: "8" },
              { label: "ROAS", value: "4.1x" },
            ].map((m) => (
              <div
                key={m.label}
                className="bg-forest-green/60 rounded-lg px-3 py-2 ring-1 ring-forest-green"
              >
                <p className="text-mint-green font-bold text-base">{m.value}</p>
                <p className="text-sage-green text-[10px]">{m.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom row */}
        <div className="relative z-10 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-mint-green" />
          <div className="w-2 h-2 rounded-full bg-teal/60" />
          <div className="w-2 h-2 rounded-full bg-forest-green" />
          <span className="text-sage-green text-xs ml-2">Scalystic · 2026</span>
        </div>
      </div>

      {/* ── Right form panel ────────────────────────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center px-6 py-10 overflow-y-auto">
        <div className="w-full max-w-sm space-y-8">
          {/* Mobile logo */}
          <div className="flex lg:hidden items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center overflow-hidden border border-border">
              <img src="/scalystic_logo_only.png" alt="Scalystic logo" className="w-full h-full object-contain" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-foreground leading-tight text-sm">
                Scalystic AIOS
              </span>
              <span className="text-[9px] text-muted-foreground font-semibold">
                Ved Sanjeevani
              </span>
            </div>
          </div>

          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold text-foreground tracking-tight">
              Welcome back
            </h1>
            <p className="text-muted-foreground text-sm mt-1.5">
              Sign in to continue to your dashboard
            </p>
          </div>

          {/* Tab switcher */}
          <div className="flex gap-1 p-1 bg-muted rounded-xl">
            {(["staff", "agency"] as const).map((t) => (
              <button
                key={t}
                onClick={() => switchTab(t)}
                className={cn(
                  "flex-1 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 cursor-pointer",
                  tab === t
                    ? "bg-card text-foreground shadow-sm ring-1 ring-border"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {t === "staff" ? "Staff Login" : "Agency Login"}
              </button>
            ))}
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email address</Label>
              <Input
                id="email"
                type="email"
                placeholder={
                  tab === "staff"
                    ? "admin@vedsanjeevani.com"
                    : "amit@digireach.com"
                }
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPwd ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  className="pr-10"
                  required
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPwd((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray hover:text-foreground transition-colors cursor-pointer"
                  aria-label={showPwd ? "Hide password" : "Show password"}
                >
                  {showPwd ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {error && <p className="text-sm text-error font-medium">{error}</p>}

            <Button
              type="submit"
              className="w-full h-11 text-sm font-semibold"
              disabled={loading}
            >
              {loading ? "Signing in…" : "Sign In"}
            </Button>
          </form>

          {/* Quick-fill buttons */}
          <div className="rounded-xl border border-border bg-card p-4 space-y-3">
            <p className="text-xs font-semibold text-foreground">Quick fill</p>
            {tab === "staff" ? (
              <button
                type="button"
                onClick={() => {
                  setEmail("admin@vedsanjeevani.com");
                  setPassword("admin@123");
                  setError("");
                }}
                className="w-full flex items-center justify-between px-3 py-2 rounded-lg border border-border hover:bg-muted hover:border-primary/30 transition-colors cursor-pointer text-left group"
              >
                <div>
                  <p className="text-xs font-medium text-foreground">Admin</p>
                  <p className="text-[11px] text-muted-foreground font-mono">
                    admin@vedsanjeevani.com
                  </p>
                </div>
                <span className="text-[10px] text-muted-foreground group-hover:text-primary transition-colors">
                  Click to fill →
                </span>
              </button>
            ) : (
              <div className="space-y-1.5">
                {AGENCY_CREDS.map((a) => (
                  <button
                    key={a.agencyId}
                    type="button"
                    onClick={() => {
                      setEmail(a.email);
                      setPassword("agency@123");
                      setError("");
                    }}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-lg border border-border hover:bg-muted hover:border-primary/30 transition-colors cursor-pointer text-left group"
                  >
                    <div>
                      <p className="text-xs font-medium text-foreground">
                        {a.agencyName}
                      </p>
                      <p className="text-[11px] text-muted-foreground font-mono">
                        {a.email}
                      </p>
                    </div>
                    <span className="text-[10px] text-muted-foreground group-hover:text-primary transition-colors">
                      Click to fill →
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

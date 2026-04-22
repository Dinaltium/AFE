"use client";

import { useState, useTransition } from "react";
import { getUserProfile } from "@/lib/actions";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { updateUserProfile, deleteAccount } from "@/lib/actions";
import {
  CODING_VIBE_THEME,
  LIGHT_DEFAULT_THEME,
  AMBER_MINIMAL_THEME,
  LAVENDER_DARK_THEME,
} from "@/lib/theme";
import { useTheme } from "@/components/providers/ThemeProvider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  Users, RefreshCw, Loader2, Mail, Inbox, Building2, CheckCircle2, AlertCircle, Palette, Banknote, Plus, Trash2, Bell, MoreVertical, Pencil, TriangleAlert, CircleAlert, CircleCheck, Trash
} from "lucide-react";
import { ConnectorsClient } from "@/components/connectors/ConnectorsClient";

interface SessionData {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  userType?: string;
  isAdmin?: boolean;
}

interface ProfileData {
  annualIncomeEstimate: string;
  taxRate: string;
  collaboratorName: string;
  collaboratorRate: string;
  themeConfig: Record<string, unknown> | null;
  collaborators: any[] | null;
  gstEnabled: boolean | null;
}

interface SettingsClientProps {
  session: SessionData;
  profile: ProfileData | null;
  connectors: any[];
  activeTab?: string;
}

// --------------- Profile Tab ---------------
function ProfileTab({
  session,
  profile,
}: {
  session: SessionData;
  profile: ProfileData | null;
}) {
  const [isPending, startTransition] = useTransition();

  function handleSave() {
    startTransition(async () => {
      try {
        await updateUserProfile({
          // Identity updates can be added here
        });
        toast.success("Profile saved successfully");
      } catch {
        toast.error("Failed to save profile");
      }
    });
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="text-base font-medium text-foreground">
          Profile Information
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Read-only fields from auth */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 w-full">
          <div className="space-y-2">
            <Label className="text-muted-foreground text-xs">
              Display Name
            </Label>
            <Input
              value={session.name ?? ""}
              disabled
              className="bg-muted/50 text-muted-foreground h-10"
            />
            <p className="text-[10px] text-muted-foreground">
              Managed by auth provider
            </p>
          </div>
          <div className="space-y-2">
            <Label className="text-muted-foreground text-xs">User Type</Label>
            <Select disabled value={session.userType ?? "freelancer"}>
              <SelectTrigger className="bg-muted/50 text-muted-foreground h-10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="creator">Creator</SelectItem>
                <SelectItem value="freelancer">Freelancer</SelectItem>
                <SelectItem value="consultant">Consultant</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-[10px] text-muted-foreground">
              Set during onboarding
            </p>
          </div>
          <div className="space-y-2 md:col-span-1 lg:col-span-1">
            <Label className="text-muted-foreground text-xs">Email Address</Label>
            <Input
              value={session.email ?? ""}
              disabled
              className="bg-muted/50 text-muted-foreground h-10"
            />
            <p className="text-[10px] text-muted-foreground">
              Primary contact email
            </p>
          </div>
        </div>

        <Button
          className="bg-primary text-primary-foreground hover:bg-primary/90"
          onClick={handleSave}
          disabled={isPending}
        >
          {isPending ? "Saving..." : "Save Profile"}
        </Button>
      </CardContent>
    </Card>
  );
}

// --------------- Finance Management Tab ---------------

function FinanceTab({ profile }: { profile: any }) {
  const [annualIncome, setAnnualIncome] = useState(profile?.annualIncomeEstimate ?? "");
  const [taxRate, setTaxRate] = useState(profile?.taxRate ?? "0.20");
  const [collaborators, setCollaborators] = useState<any[]>(profile?.collaborators ?? []);
  const [gstEnabled, setGstEnabled] = useState<boolean>(profile?.gstEnabled ?? false);
  const [isPending, startTransition] = useTransition();

  // Helper to refresh state from latest profile
  async function refreshProfile() {
    const latest = await getUserProfile();
    if (latest) {
      setAnnualIncome(latest.annualIncomeEstimate ?? "");
      setTaxRate(latest.taxRate ?? "0.20");
      setCollaborators(Array.isArray(latest.collaborators) ? latest.collaborators : []);
      setGstEnabled(latest.gstEnabled ?? false);
    }
  }

  const addCollaborator = () => {
    setCollaborators([...collaborators, { name: "", rate: "0.10" }]);
  };

  const removeCollaborator = (index: number) => {
    setCollaborators(collaborators.filter((_, i) => i !== index));
  };

  const updateCollaborator = (index: number, field: string, value: string) => {
    const updated = [...collaborators];
    updated[index] = { ...updated[index], [field]: value };
    setCollaborators(updated);
  };

  const handleSave = () => {
    startTransition(async () => {
      try {
        await updateUserProfile({
          annualIncomeEstimate: annualIncome,
          taxRate,
          collaborators,
          gstEnabled,
        });
        await refreshProfile();
        toast.success("Financial strategy applied successfully");
      } catch {
        toast.error("Failed to update finance settings");
      }
    });
  };

  return (
    <div className="space-y-6">
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-base font-medium text-foreground flex items-center gap-2">
            <Banknote className="w-4 h-4 text-primary" />
            Income & Tax Settings
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            Configure your tax bracket and base income parameters for automatic splits.
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <Label htmlFor="annualIncome" className="text-sm text-foreground font-medium flex items-center gap-2">
                Annual Income (INR)
              </Label>
              <Input
                id="annualIncome"
                type="number"
                placeholder="e.g. 1200000"
                value={annualIncome}
                onChange={(e) => setAnnualIncome(e.target.value)}
                className="h-11 bg-muted/20 border-border focus:ring-primary"
              />
              <p className="text-[10px] text-muted-foreground">Excluding taxes and deductions</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="taxRate" className="text-sm text-foreground font-medium">
                Tax Rate (decimal)
              </Label>
              <Input
                id="taxRate"
                type="number"
                step="0.01"
                placeholder="e.g. 0.20"
                value={taxRate}
                onChange={(e) => setTaxRate(e.target.value)}
                className="h-11 bg-muted/20 border-border focus:ring-primary"
              />
              <p className="text-[10px] text-muted-foreground">0.20 = 20% tax slab</p>
            </div>
          </div>

          <Separator className="bg-border/50" />

          <div className="flex items-center justify-between p-4 rounded-lg border border-primary/20 bg-primary/5">
            <div className="space-y-0.5">
              <Label className="text-sm font-medium text-foreground">Enable Global GST (18%)</Label>
              <p className="text-[10px] text-muted-foreground">
                Automatically calculate and reconcile GST for every payment received.
              </p>
            </div>
            <Switch 
              checked={gstEnabled} 
              onCheckedChange={setGstEnabled}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card border-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="text-base font-medium text-foreground flex items-center gap-2">
                <Users className="w-4 h-4 text-sky-400" />
                Collaborators & Stakeholders
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                Define who else gets a cut from your income (editors, developers, etc.)
              </p>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={addCollaborator} 
              className="border-primary/20 hover:bg-primary/5 text-primary text-xs h-8"
            >
              <Plus className="w-3.5 h-3.5 mr-1" />
              Add Member
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {collaborators.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 rounded-xl border border-dashed border-border bg-muted/5">
              <Users className="w-8 h-8 text-muted-foreground/30 mb-2" />
              <p className="text-xs text-muted-foreground text-center">
                No collaborators configured. All income will be yours (after tax).
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {collaborators.map((c, i) => (
                <div key={i} className="flex flex-wrap md:flex-nowrap items-end gap-3 p-3 rounded-lg border border-border bg-muted/10 group relative transition-all hover:border-primary/30">
                  <div className="flex-1 space-y-1.5">
                    <Label className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Name</Label>
                    <Input 
                      placeholder="e.g. Editor John" 
                      value={c.name} 
                      onChange={(e) => updateCollaborator(i, "name", e.target.value)}
                      className="h-9 bg-background border-border"
                    />
                  </div>
                  <div className="w-28 space-y-1.5">
                    <Label className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Cut (%)</Label>
                    <div className="relative">
                      <Input 
                        placeholder="0.10" 
                        value={c.rate} 
                        onChange={(e) => updateCollaborator(i, "rate", e.target.value)}
                        className="h-9 bg-background border-border pr-8"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">%</span>
                    </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => removeCollaborator(i)} 
                    className="text-muted-foreground hover:text-destructive hover:bg-destructive/5 h-9 w-9"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button 
          onClick={handleSave} 
          disabled={isPending}
          className="bg-primary text-primary-foreground font-medium shadow-lg shadow-primary/20 px-8"
        >
          {isPending ? "Saving..." : "Apply Financial Strategy"}
        </Button>
      </div>
    </div>
  );
}


// --------------- Appearance Tab ---------------
// Blend two hex colours: t=0 → a, t=1 → b
function mixHex(a: string, b: string, t: number): string {
  const p = (h: string) => [
    parseInt(h.slice(1, 3), 16),
    parseInt(h.slice(3, 5), 16),
    parseInt(h.slice(5, 7), 16),
  ];
  const x = (n: number) => Math.round(n).toString(16).padStart(2, "0");
  const [ar, ag, ab] = p(a);
  const [br, bg, bb] = p(b);
  return `#${x(ar + (br - ar) * t)}${x(ag + (bg - ag) * t)}${x(ab + (bb - ab) * t)}`;
}

function luminance(hex: string): number {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  return 0.299 * r + 0.587 * g + 0.114 * b;
}

// Derives a complete 20-token theme from three base colours so every element
// on the page responds to the colour pickers.
function deriveThemeFromPickers(
  primary: string,
  background: string,
  foreground: string,
): Record<string, string> {
  const bg = background;
  const fg = foreground;
  const primaryFg = luminance(primary) > 0.45 ? mixHex(bg, "#000000", 0.8) : mixHex(bg, "#ffffff", 0.9);
  const sidebarBg = luminance(bg) < 0.15
    ? mixHex(bg, "#ffffff", 0.04)   // dark theme: sidebar slightly lighter
    : mixHex(bg, "#000000", 0.04);  // light theme: sidebar slightly darker
  
  const border = mixHex(bg, fg, 0.15);
  const accent = mixHex(bg, primary, 0.12);

  return {
    primary,
    "primary-foreground": primaryFg,
    background: bg,
    foreground: fg,
    card: mixHex(bg, fg, 0.04),
    "card-foreground": fg,
    popover: mixHex(bg, fg, 0.04),
    "popover-foreground": fg,
    secondary: mixHex(bg, fg, 0.08),
    "secondary-foreground": fg,
    muted: mixHex(bg, fg, 0.08),
    "muted-foreground": mixHex(fg, bg, 0.45),
    accent: accent,
    "accent-foreground": fg,
    destructive: "#FF4C4C",
    "destructive-foreground": "#FFFFFF",
    border: border,
    input: border,
    ring: primary,
    "ring-3": primary,
    "sidebar-background": sidebarBg,
    "sidebar-foreground": fg,
    "sidebar-primary": primary,
    "sidebar-primary-foreground": primaryFg,
    "sidebar-accent": mixHex(sidebarBg, primary, 0.15),
    "sidebar-accent-foreground": fg,
    "sidebar-border": mixHex(bg, fg, 0.12),
    "sidebar-ring": primary,
    "header-background": bg,
    "header-foreground": mixHex(fg, bg, 0.1),
    "header-border": border,
    "header-primary": primary,
    "header-primary-foreground": primaryFg,
    "header-accent": accent,
    "header-accent-foreground": fg,
    "header-ring": primary,
  };
}

type CustomTheme = { id: string; name: string; colors: Record<string, string> };

const BASE_PRESETS = [
  { id: "amber-minimal", name: "Amber Minimal", colors: AMBER_MINIMAL_THEME.colors as Record<string, string> },
  { id: "lavender-dark", name: "Lavender Dark", colors: LAVENDER_DARK_THEME.colors as Record<string, string> },
  { id: "coding-vibe", name: "Coding Vibe", colors: CODING_VIBE_THEME.colors as Record<string, string> },
  { id: "light", name: "Light Default", colors: LIGHT_DEFAULT_THEME.colors as Record<string, string> },
];

function AppearanceTab({ profile }: { profile: ProfileData | null }) {
  const { setTheme } = useTheme();

  const themeConfig = profile?.themeConfig as {
    themes?: CustomTheme[];
    active?: Record<string, string>;
    colors?: Record<string, string>; // legacy format
  } | null;

  const savedActive = themeConfig?.active ?? themeConfig?.colors ?? null;
  const initialColors = savedActive ?? (CODING_VIBE_THEME.colors as Record<string, string>);

  const [customThemes, setCustomThemes] = useState<CustomTheme[]>(themeConfig?.themes ?? []);
  const [activePresetId, setActivePresetId] = useState<string>(() => {
    if (!savedActive) return "coding-vibe";
    
    // Check built-in presets
    const builtInMatch = BASE_PRESETS.find(
      (p) => p.colors.primary === savedActive.primary && p.colors.background === savedActive.background
    );
    if (builtInMatch) return builtInMatch.id;

    // Check custom themes
    const match = themeConfig?.themes?.find(
      (t) => t.colors.primary === savedActive.primary && t.colors.background === savedActive.background
    );
    return match?.id ?? "custom";
  });
  const [activeColors, setActiveColors] = useState<Record<string, string>>(initialColors);

  // Color pickers
  const [primaryColor, setPrimaryColor] = useState(initialColors.primary ?? "#00FF9C");
  const [backgroundColor, setBackgroundColor] = useState(initialColors.background ?? "#0D0D0D");
  const [foregroundColor, setForegroundColor] = useState(initialColors.foreground ?? "#EDEDED");

  // New theme name
  const [newThemeName, setNewThemeName] = useState("");

  // Edit modal
  const [editingTheme, setEditingTheme] = useState<CustomTheme | null>(null);
  const [editName, setEditName] = useState("");
  const [editPrimary, setEditPrimary] = useState("#00FF9C");
  const [editBackground, setEditBackground] = useState("#0D0D0D");
  const [editForeground, setEditForeground] = useState("#EDEDED");

  const [isPending, startTransition] = useTransition();

  function applyBuiltInPreset(id: string, colors: Record<string, string>) {
    setActivePresetId(id);
    setActiveColors(colors);
    setPrimaryColor(colors.primary ?? primaryColor);
    setBackgroundColor(colors.background ?? backgroundColor);
    setForegroundColor(colors.foreground ?? foregroundColor);
    setTheme(colors);

    startTransition(async () => {
      try {
        await updateUserProfile({
          themeConfig: { themes: customThemes, active: colors },
        });
        toast.success(`Theme switched to ${id}`);
      } catch {
        toast.error("Failed to save theme selection");
      }
    });
  }

  function applyCustomTheme(theme: CustomTheme) {
    setActivePresetId(theme.id);
    setActiveColors(theme.colors);
    setPrimaryColor(theme.colors.primary ?? primaryColor);
    setBackgroundColor(theme.colors.background ?? backgroundColor);
    setForegroundColor(theme.colors.foreground ?? foregroundColor);
    setTheme(theme.colors);

    startTransition(async () => {
      try {
        await updateUserProfile({
          themeConfig: { themes: customThemes, active: theme.colors },
        });
        toast.success(`Switched to "${theme.name}"`);
      } catch {
        toast.error("Failed to save theme selection");
      }
    });
  }

  function previewColors() {
    const derived = deriveThemeFromPickers(primaryColor, backgroundColor, foregroundColor);
    setActiveColors(derived);
    setActivePresetId("custom");
    setTheme(derived);
  }

  function applyDerivedAsActive() {
    const derived = deriveThemeFromPickers(primaryColor, backgroundColor, foregroundColor);
    startTransition(async () => {
      try {
        await updateUserProfile({
          themeConfig: { themes: customThemes, active: derived },
        });
        setActiveColors(derived);
        setActivePresetId("custom");
        setTheme(derived);
        toast.success("Applied custom colors as active theme");
      } catch {
        toast.error("Failed to save theme selection");
      }
    });
  }

  function saveNewTheme() {
    if (!newThemeName.trim()) {
      toast.error("Enter a name for the theme");
      return;
    }
    const derived = deriveThemeFromPickers(primaryColor, backgroundColor, foregroundColor);
    const newTheme: CustomTheme = {
      id: `custom-${Date.now()}`,
      name: newThemeName.trim(),
      colors: derived,
    };
    const updated = [...customThemes, newTheme];
    startTransition(async () => {
      try {
        await updateUserProfile({ themeConfig: { themes: updated, active: derived } });
        setCustomThemes(updated);
        setActiveColors(derived);
        setActivePresetId(newTheme.id);
        setTheme(derived);
        setNewThemeName("");
        toast.success(`"${newTheme.name}" saved`);
      } catch {
        toast.error("Failed to save theme");
      }
    });
  }

  function openEditModal(theme: CustomTheme) {
    setEditingTheme(theme);
    setEditName(theme.name);
    setEditPrimary(theme.colors.primary ?? "#00FF9C");
    setEditBackground(theme.colors.background ?? "#0D0D0D");
    setEditForeground(theme.colors.foreground ?? "#EDEDED");
  }

  function saveEditTheme() {
    if (!editingTheme) return;
    const derived = deriveThemeFromPickers(editPrimary, editBackground, editForeground);
    const updated = customThemes.map((t) =>
      t.id === editingTheme.id ? { ...t, name: editName.trim() || t.name, colors: derived } : t
    );
    const isActive = activePresetId === editingTheme.id;
    startTransition(async () => {
      try {
        await updateUserProfile({
          themeConfig: { themes: updated, active: isActive ? derived : activeColors },
        });
        setCustomThemes(updated);
        if (isActive) {
          setActiveColors(derived);
          setTheme(derived);
        }
        setEditingTheme(null);
        toast.success("Theme updated");
      } catch {
        toast.error("Failed to update theme");
      }
    });
  }

  function deleteTheme(themeId: string) {
    const updated = customThemes.filter((t) => t.id !== themeId);
    const wasActive = activePresetId === themeId;
    const fallback = CODING_VIBE_THEME.colors as Record<string, string>;
    startTransition(async () => {
      try {
        await updateUserProfile({
          themeConfig: { themes: updated, active: wasActive ? fallback : activeColors },
        });
        setCustomThemes(updated);
        if (wasActive) {
          setActivePresetId("coding-vibe");
          setActiveColors(fallback);
          setTheme(fallback);
        }
        toast.success("Theme deleted");
      } catch {
        toast.error("Failed to delete theme");
      }
    });
  }

  return (
    <div className="space-y-8 w-full">
      {/* Built-in presets */}
      <Card className="w-full bg-card border-border shadow-none">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-medium text-foreground flex items-center gap-2">
            <Palette className="w-4 h-4 text-primary" />
            Theme Presets
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 w-full">
            {BASE_PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => applyBuiltInPreset(preset.id, preset.colors)}
                className={`relative rounded-lg border p-4 text-left transition-all hover:border-primary ${
                  activePresetId === preset.id
                    ? "border-primary bg-primary/5"
                    : "border-border bg-background hover:bg-accent/5"
                }`}
              >
                {activePresetId === preset.id && (
                  <CheckCircle2 className="absolute top-2 right-2 w-4 h-4 text-primary" />
                )}
                <div className="flex gap-1 mb-2">
                  {["background", "card", "primary"].map((key) => (
                    <div
                      key={key}
                      className="w-4 h-4 rounded-full border border-border/50"
                      style={{ background: preset.colors[key] }}
                    />
                  ))}
                </div>
                <p className="text-xs font-medium text-foreground">{preset.name}</p>
                {preset.id === "coding-vibe" && (
                  <p className="text-[10px] text-muted-foreground mt-0.5">Default</p>
                )}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* My Themes */}
      {customThemes.length > 0 && (
        <Card className="w-full bg-card border-border shadow-none">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium text-foreground">
              My Themes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {customThemes.map((theme) => (
                <div
                  key={theme.id}
                  className={`relative rounded-lg border p-4 transition-all ${
                    activePresetId === theme.id
                      ? "border-primary bg-primary/5"
                      : "border-border bg-background"
                  }`}
                >
                  {activePresetId === theme.id && (
                    <CheckCircle2 className="absolute top-2 right-8 w-4 h-4 text-primary" />
                  )}
                  {/* 3-dot menu */}
                  <div className="absolute top-1.5 right-1.5">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          type="button"
                          className="p-1 rounded hover:bg-muted transition-colors"
                        >
                          <MoreVertical className="w-3.5 h-3.5 text-muted-foreground" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-32">
                        <DropdownMenuItem onClick={() => openEditModal(theme)}>
                          <Pencil className="w-3.5 h-3.5 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => deleteTheme(theme.id)}
                        >
                          <Trash2 className="w-3.5 h-3.5 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  {/* Clickable swatch area */}
                  <button
                    type="button"
                    className="w-full text-left"
                    onClick={() => applyCustomTheme(theme)}
                  >
                    <div className="flex gap-1 mb-2">
                      {["background", "card", "primary"].map((key) => (
                        <div
                          key={key}
                          className="w-4 h-4 rounded-full border border-border/50"
                          style={{ background: theme.colors[key] }}
                        />
                      ))}
                    </div>
                    <p className="text-xs font-medium text-foreground">{theme.name}</p>
                    <p className="text-[10px] text-primary mt-0.5">Custom</p>
                  </button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Action: Apply current colors */}
      <div className="flex justify-end py-2">
        <Button
          size="sm"
          onClick={applyDerivedAsActive}
          disabled={isPending}
          className="bg-primary text-primary-foreground hover:bg-primary/90 px-10"
        >
          {isPending ? "Applying..." : "Save as Active Theme"}
        </Button>
      </div>

      {/* Custom Colors */}
      <Card className="w-full bg-card border-border shadow-none">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-medium text-foreground">
            Custom Colors
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full">
            {[
              { label: "Primary / Accent", value: primaryColor, setter: setPrimaryColor },
              { label: "Background", value: backgroundColor, setter: setBackgroundColor },
              { label: "Foreground / Text", value: foregroundColor, setter: setForegroundColor },
            ].map(({ label, value, setter }) => (
              <div key={label} className="space-y-2">
                <Label className="text-xs text-muted-foreground">{label}</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={value}
                    onChange={(e) => setter(e.target.value)}
                    className="w-9 h-9 rounded-md border border-border cursor-pointer bg-transparent"
                  />
                  <Input
                    value={value}
                    onChange={(e) => setter(e.target.value)}
                    className="font-mono text-xs"
                    maxLength={7}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={previewColors}
              className="border-border text-foreground hover:bg-accent/10"
            >
              Preview Colors
            </Button>
          </div>

          {/* Preview strip */}
          <div
            className="rounded-lg border border-border p-8 space-y-4 w-full h-40 flex flex-col justify-center"
            style={{ background: backgroundColor }}
          >
            <p className="text-xs font-medium" style={{ color: foregroundColor }}>
              Preview — AFE Dashboard
            </p>
            <div className="flex gap-2">
              <div
                className="px-3 py-1 rounded-md text-xs font-medium"
                style={{ background: primaryColor, color: backgroundColor }}
              >
                Primary Button
              </div>
              <div
                className="px-3 py-1 rounded-md text-xs border"
                style={{ color: foregroundColor, borderColor: `${foregroundColor}30` }}
              >
                Outline
              </div>
            </div>
          </div>

          <Separator className="bg-border" />

          {/* Save as named theme */}
          <div className="space-y-2">
            <Label className="text-sm text-foreground">Save as Theme</Label>
            <div className="flex gap-2">
              <Input
                placeholder='Name (e.g. "Ocean Blue")'
                value={newThemeName}
                onChange={(e) => setNewThemeName(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") saveNewTheme(); }}
                className="flex-1"
              />
              <Button
                size="sm"
                className="bg-primary text-primary-foreground hover:bg-primary/90 shrink-0"
                onClick={saveNewTheme}
                disabled={isPending}
              >
                {isPending ? "Saving..." : "Save Theme"}
              </Button>
            </div>
            <p className="text-[10px] text-muted-foreground">
              Saves current colors as a named theme shown in My Themes above
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Edit theme dialog */}
      <Dialog open={!!editingTheme} onOpenChange={(open) => { if (!open) setEditingTheme(null); }}>
        <DialogContent className="bg-card border-border sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-foreground">Edit Theme</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Update the theme name and colors.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label className="text-sm text-foreground">Theme Name</Label>
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Theme name"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { label: "Primary", value: editPrimary, setter: setEditPrimary },
                { label: "Background", value: editBackground, setter: setEditBackground },
                { label: "Foreground", value: editForeground, setter: setEditForeground },
              ].map(({ label, value, setter }) => (
                <div key={label} className="space-y-2">
                  <Label className="text-xs text-muted-foreground">{label}</Label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={value}
                      onChange={(e) => setter(e.target.value)}
                      className="w-9 h-9 rounded-md border border-border cursor-pointer bg-transparent"
                    />
                    <Input
                      value={value}
                      onChange={(e) => setter(e.target.value)}
                      className="font-mono text-xs"
                      maxLength={7}
                    />
                  </div>
                </div>
              ))}
            </div>
            {/* Live preview */}
            <div
              className="rounded-lg border border-border p-3 space-y-2"
              style={{ background: editBackground }}
            >
              <p className="text-xs font-medium" style={{ color: editForeground }}>
                Preview
              </p>
              <div className="flex gap-2">
                <div
                  className="px-2 py-0.5 rounded text-xs font-medium"
                  style={{ background: editPrimary, color: editBackground }}
                >
                  Button
                </div>
                <div
                  className="px-2 py-0.5 rounded text-xs border"
                  style={{ color: editForeground, borderColor: `${editForeground}30` }}
                >
                  Text
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              className="border-border"
              onClick={() => setEditingTheme(null)}
            >
              Cancel
            </Button>
            <Button
              className="bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={saveEditTheme}
              disabled={isPending}
            >
              {isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
   );
}

// --------------- Account Tab ---------------
function AccountTab({
  session,
  connectors,
}: {
  session: SessionData;
  connectors: any[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleDeleteAccount() {
    startTransition(async () => {
      try {
        await deleteAccount();
        router.push("/");
      } catch {
        toast.error("Failed to delete account");
      }
    });
  }

  return (
    <div className="space-y-10">
      {/* Connectors Section */}
      <div className="space-y-4">
        <div className="flex flex-col">
          <h3 className="text-base font-medium text-foreground">External Connectors</h3>
          <p className="text-sm text-muted-foreground">Manage your links to external data sources and simulations</p>
        </div>
        <ConnectorsClient connectors={connectors} userId={session.id} />
      </div>

      <Separator className="bg-border/50" />

      <div className="space-y-6">
        {/* Change password */}
        <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-base font-medium text-foreground">
            Change Password
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="currentPw" className="text-sm text-foreground">
              Current Password
            </Label>
            <Input id="currentPw" type="password" disabled placeholder="••••••••" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="newPw" className="text-sm text-foreground">
              New Password
            </Label>
            <Input id="newPw" type="password" disabled placeholder="••••••••" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPw" className="text-sm text-foreground">
              Confirm New Password
            </Label>
            <Input id="confirmPw" type="password" disabled placeholder="••••••••" />
          </div>
          <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 border border-border">
            <TriangleAlert className="w-4 h-4 text-amber-400 flex-shrink-0" />
            <p className="text-xs text-muted-foreground">
              Password change is in development. Social login users manage
              passwords through their provider.
            </p>
          </div>
          <Button disabled size="sm" variant="outline" className="border-border">
            Update Password
          </Button>
        </CardContent>
      </Card>

      {/* Danger zone */}
      <Card className="bg-card border-destructive/30">
        <CardHeader>
          <CardTitle className="text-base font-medium text-destructive flex items-center gap-2">
            <TriangleAlert className="w-4 h-4" />
            Danger Zone
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-foreground">
                Delete Account
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Permanently delete your account and all associated data. This
                action cannot be undone.
              </p>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="destructive"
                  size="sm"
                  className="flex-shrink-0"
                >
                  Delete Account
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="bg-card border-border">
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-foreground">
                    Delete your account?
                  </AlertDialogTitle>
                  <AlertDialogDescription className="text-muted-foreground">
                    This will permanently delete your account, payment history,
                    audit log, and all profile data. This action cannot be
                    reversed.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="border-border text-foreground">
                    Cancel
                  </AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    onClick={handleDeleteAccount}
                    disabled={isPending}
                  >
                    {isPending ? "Deleting..." : "Yes, delete my account"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
  );
}

// --------------- Notifications Tab ---------------
interface NotificationSetting {
  id: string;
  label: string;
  description: string;
  defaultOn: boolean;
}

const NOTIFICATION_SETTINGS: NotificationSetting[] = [
  {
    id: "payment_received",
    label: "Payment Received",
    description: "Get notified when a new payment is processed",
    defaultOn: true,
  },
  {
    id: "payment_flagged",
    label: "Payment Flagged",
    description: "Alert when a payment is flagged for review",
    defaultOn: true,
  },
  {
    id: "low_confidence",
    label: "Low Confidence Decisions",
    description: "Notify when the architect routes with low confidence",
    defaultOn: false,
  },
  {
    id: "weekly_summary",
    label: "Weekly Summary",
    description: "Receive a weekly income and split summary",
    defaultOn: false,
  },
];

function NotificationsTab() {
  const [settings, setSettings] = useState<Record<string, boolean>>(
    Object.fromEntries(NOTIFICATION_SETTINGS.map((s) => [s.id, s.defaultOn]))
  );

  return (
    <Card className="w-full bg-card border-border shadow-none">
      <CardHeader>
        <CardTitle className="text-base font-medium text-foreground flex items-center gap-2">
          <Bell className="w-4 h-4 text-primary" />
          Email Notifications
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-1">
        {NOTIFICATION_SETTINGS.map((setting, i) => (
          <div key={setting.id}>
            <div className="flex items-center justify-between py-5">
              <div className="space-y-1">
                <p className="text-sm font-semibold text-foreground">
                  {setting.label}
                </p>
                <p className="text-[11px] text-muted-foreground w-full">
                  {setting.description}
                </p>
              </div>
              <Switch
                checked={settings[setting.id]}
                onCheckedChange={(checked) =>
                  setSettings((prev) => ({ ...prev, [setting.id]: checked }))
                }
              />
            </div>
            {i < NOTIFICATION_SETTINGS.length - 1 && (
              <Separator className="bg-border" />
            )}
          </div>
        ))}
        <div className="pt-4">
          <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 border border-border">
            <TriangleAlert className="w-4 h-4 text-amber-400 flex-shrink-0" />
            <p className="text-xs text-muted-foreground">
              Email notifications are in development. Settings are saved locally
              for now.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// --------------- Main Settings Component ---------------
export function SettingsClient({ session, profile, connectors, activeTab = "profile" }: SettingsClientProps) {
  return (
    <Tabs defaultValue={activeTab} className="space-y-6 w-full">
      <TabsList className="bg-muted border border-border grid grid-cols-5 w-full">
        <TabsTrigger value="profile" className="text-xs flex items-center gap-2">
          Profile
        </TabsTrigger>
        <TabsTrigger value="finance" className="text-xs flex items-center gap-2">
          Finance
        </TabsTrigger>
        <TabsTrigger value="appearance" className="text-xs flex items-center gap-2">
          Appearance
        </TabsTrigger>
        <TabsTrigger value="account" className="text-xs flex items-center gap-2">
          Account
        </TabsTrigger>
        <TabsTrigger value="notifications" className="text-xs flex items-center gap-2">
          Notifications
        </TabsTrigger>
      </TabsList>

      <TabsContent value="profile">
        <ProfileTab session={session} profile={profile} />
      </TabsContent>

      <TabsContent value="finance">
        <FinanceTab profile={profile} />
      </TabsContent>

      <TabsContent value="appearance">
        <AppearanceTab profile={profile} />
      </TabsContent>

      <TabsContent value="account">
        <AccountTab session={session} connectors={connectors} />
      </TabsContent>

      <TabsContent value="notifications">
        <NotificationsTab />
      </TabsContent>
    </Tabs>
  );
}

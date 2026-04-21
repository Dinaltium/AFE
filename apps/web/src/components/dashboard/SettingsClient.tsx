"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { updateUserProfile, deleteAccount, upsertSimulationSettings, addApprovedClient as addApprovedClientAction, removeApprovedClient as removeApprovedClientAction } from "@/lib/actions";
import { CODING_VIBE_THEME } from "@/lib/theme";
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
import { CheckCircle2, Palette, AlertTriangle, Bell, MoreVertical, Pencil, Trash2, Cpu } from "lucide-react";

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
}

interface SimulationSettingsData {
  simulationEnabled: boolean;
  minIntervalSeconds: number;
  maxIntervalSeconds: number;
}

interface ApprovedClientData {
  id: string;
  name: string;
  autoApprove: boolean;
}

interface SettingsClientProps {
  session: SessionData;
  profile: ProfileData | null;
  simulationSettings?: SimulationSettingsData | null;
  approvedClients?: ApprovedClientData[];
}

// --------------- Profile Tab ---------------
function ProfileTab({
  session,
  profile,
}: {
  session: SessionData;
  profile: ProfileData | null;
}) {
  const [annualIncome, setAnnualIncome] = useState(
    profile?.annualIncomeEstimate ?? ""
  );
  const [taxRate, setTaxRate] = useState(profile?.taxRate ?? "0.20");
  const [collabName, setCollabName] = useState(
    profile?.collaboratorName ?? "Collaborator"
  );
  const [collabRate, setCollabRate] = useState(
    profile?.collaboratorRate ?? "0.10"
  );
  const [isPending, startTransition] = useTransition();

  function handleSave() {
    startTransition(async () => {
      try {
        await updateUserProfile({
          annualIncomeEstimate: annualIncome,
          taxRate,
          collaboratorName: collabName,
          collaboratorRate: collabRate,
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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

        <Separator className="bg-border" />

        {/* Editable finance fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="space-y-2">
            <Label htmlFor="annualIncome" className="text-sm text-foreground font-medium">
              Annual Income (INR)
            </Label>
            <Input
              id="annualIncome"
              type="number"
              min="0"
              placeholder="e.g. 1200000"
              value={annualIncome}
              onChange={(e) => setAnnualIncome(e.target.value)}
              className="h-10"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="taxRate" className="text-sm text-foreground font-medium">
              Tax Rate (decimal)
            </Label>
            <Input
              id="taxRate"
              type="number"
              step="0.01"
              min="0"
              max="1"
              placeholder="e.g. 0.20"
              value={taxRate}
              onChange={(e) => setTaxRate(e.target.value)}
              className="h-10"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="collabName" className="text-sm text-foreground font-medium">
              Collaborator Name
            </Label>
            <Input
              id="collabName"
              placeholder="e.g. Editor, Manager"
              value={collabName}
              onChange={(e) => setCollabName(e.target.value)}
              className="h-10"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="collabRate" className="text-sm text-foreground font-medium">
              Collaborator Rate
            </Label>
            <Input
              id="collabRate"
              type="number"
              step="0.01"
              min="0"
              max="1"
              placeholder="e.g. 0.10"
              value={collabRate}
              onChange={(e) => setCollabRate(e.target.value)}
              className="h-10"
            />
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

// --------------- Appearance Tab ---------------
const LIGHT_PRESET = {
  name: "light",
  colors: {
    background: "#FFFFFF",
    foreground: "#111111",
    card: "#F5F5F5",
    "card-foreground": "#111111",
    popover: "#FFFFFF",
    "popover-foreground": "#111111",
    primary: "#00CC7A",
    "primary-foreground": "#FFFFFF",
    secondary: "#F0F0F0",
    "secondary-foreground": "#111111",
    muted: "#F0F0F0",
    "muted-foreground": "#737373",
    accent: "#E8FFF5",
    "accent-foreground": "#111111",
    destructive: "#EF4444",
    "destructive-foreground": "#FFFFFF",
    border: "#E5E5E5",
    input: "#E5E5E5",
    ring: "#00CC7A",
    "sidebar-background": "#F8F8F8",
    "sidebar-foreground": "#111111",
    "sidebar-primary": "#00CC7A",
    "sidebar-primary-foreground": "#FFFFFF",
    "sidebar-accent": "#E8FFF5",
    "sidebar-accent-foreground": "#111111",
    "sidebar-border": "#E5E5E5",
    "sidebar-ring": "#00CC7A",
  },
};

const DARK_PRESET = {
  name: "dark",
  colors: {
    background: "#0A0A0A",
    foreground: "#FAFAFA",
    card: "#141414",
    "card-foreground": "#FAFAFA",
    popover: "#141414",
    "popover-foreground": "#FAFAFA",
    primary: "#00FF9C",
    "primary-foreground": "#0A0A0A",
    secondary: "#1C1C1C",
    "secondary-foreground": "#FAFAFA",
    muted: "#1C1C1C",
    "muted-foreground": "#737373",
    accent: "#1C1C1C",
    "accent-foreground": "#FAFAFA",
    destructive: "#FF4C4C",
    "destructive-foreground": "#FFFFFF",
    border: "#262626",
    input: "#262626",
    ring: "#00FF9C",
    "sidebar-background": "#0B0B0B",
    "sidebar-foreground": "#EDEDED",
    "sidebar-primary": "#00FF9C",
    "sidebar-primary-foreground": "#0A0A0A",
    "sidebar-accent": "#00FF9C",
    "sidebar-accent-foreground": "#0A0A0A",
    "sidebar-border": "#262626",
    "sidebar-ring": "#38BDF8",
  },
};

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
    accent: mixHex(bg, primary, 0.12),
    "accent-foreground": fg,
    destructive: "#FF4C4C",
    "destructive-foreground": "#FFFFFF",
    border: mixHex(bg, fg, 0.15),
    input: mixHex(bg, fg, 0.15),
    ring: primary,
    "sidebar-background": sidebarBg,
    "sidebar-foreground": fg,
    "sidebar-primary": primary,
    "sidebar-primary-foreground": primaryFg,
    "sidebar-accent": mixHex(sidebarBg, primary, 0.15),
    "sidebar-accent-foreground": fg,
    "sidebar-border": mixHex(bg, fg, 0.12),
    "sidebar-ring": primary,
  };
}

type CustomTheme = { id: string; name: string; colors: Record<string, string> };

function AppearanceTab({ profile }: { profile: ProfileData | null }) {
  const { setTheme } = useTheme();

  const themeConfig = profile?.themeConfig as {
    themes?: CustomTheme[];
    active?: Record<string, string>;
    colors?: Record<string, string>; // legacy format
  } | null;

  const savedActive = themeConfig?.active ?? themeConfig?.colors ?? null;
  const initialColors = savedActive ?? (CODING_VIBE_THEME.colors as Record<string, string>);

  const BASE_PRESETS = [
    { id: "coding-vibe", name: "Coding Vibe", colors: CODING_VIBE_THEME.colors as Record<string, string> },
    { id: "dark", name: "Dark", colors: DARK_PRESET.colors as Record<string, string> },
    { id: "light", name: "Light", colors: LIGHT_PRESET.colors as Record<string, string> },
  ];

  const [customThemes, setCustomThemes] = useState<CustomTheme[]>(themeConfig?.themes ?? []);
  const [activePresetId, setActivePresetId] = useState<string>(() => {
    if (!savedActive) return "coding-vibe";
    const match = themeConfig?.themes?.find((t) => t.colors.primary === savedActive.primary && t.colors.background === savedActive.background);
    return match?.id ?? "coding-vibe";
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
  }

  function applyCustomTheme(theme: CustomTheme) {
    setActivePresetId(theme.id);
    setActiveColors(theme.colors);
    setPrimaryColor(theme.colors.primary ?? primaryColor);
    setBackgroundColor(theme.colors.background ?? backgroundColor);
    setForegroundColor(theme.colors.foreground ?? foregroundColor);
    setTheme(theme.colors);
  }

  function previewColors() {
    const derived = deriveThemeFromPickers(primaryColor, backgroundColor, foregroundColor);
    setActiveColors(derived);
    setActivePresetId("custom");
    setTheme(derived);
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
    <div className="space-y-6">
      {/* Built-in presets */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-medium text-foreground flex items-center gap-2">
            <Palette className="w-4 h-4 text-primary" />
            Theme Presets
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
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
        <Card className="bg-card border-border">
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

      {/* Color pickers + save as theme */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-medium text-foreground">
            Custom Colors
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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

          <Button
            variant="outline"
            size="sm"
            onClick={previewColors}
            className="border-border text-foreground hover:bg-accent/10"
          >
            Preview Colors
          </Button>

          {/* Preview strip */}
          <div
            className="rounded-lg border border-border p-4 space-y-2"
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
        <DialogContent className="bg-card border-border sm:max-w-md">
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

// --------------- Simulation Tab ---------------
function SimulationTab({
  initialSettings,
  initialClients,
}: {
  initialSettings: SimulationSettingsData | null;
  initialClients: ApprovedClientData[];
}) {
  const [enabled, setEnabled] = useState(initialSettings?.simulationEnabled ?? false);
  const [minInterval, setMinInterval] = useState(initialSettings?.minIntervalSeconds ?? 5);
  const [maxInterval, setMaxInterval] = useState(initialSettings?.maxIntervalSeconds ?? 180);
  const [clients, setClients] = useState<ApprovedClientData[]>(initialClients);
  const [newClientName, setNewClientName] = useState("");
  const [newClientAutoApprove, setNewClientAutoApprove] = useState(true);
  const [isAddingClient, setIsAddingClient] = useState(false);
  const [isPending, startTransition] = useTransition();

  function saveSettings() {
    startTransition(async () => {
      try {
        await upsertSimulationSettings({
          simulationEnabled: enabled,
          minIntervalSeconds: minInterval,
          maxIntervalSeconds: maxInterval,
        });
        toast.success("Simulation settings saved");
      } catch {
        toast.error("Failed to save settings");
      }
    });
  }

  function addClient() {
    if (!newClientName.trim()) {
      toast.error("Enter a client name");
      return;
    }
    startTransition(async () => {
      try {
        const row = await addApprovedClientAction(newClientName.trim(), newClientAutoApprove);
        setClients((prev) => [...prev, { id: row.id, name: row.name, autoApprove: row.autoApprove }]);
        setNewClientName("");
        setNewClientAutoApprove(true);
        setIsAddingClient(false);
        toast.success(`"${row.name}" added`);
      } catch {
        toast.error("Failed to add client");
      }
    });
  }

  function removeClient(clientId: string) {
    startTransition(async () => {
      try {
        await removeApprovedClientAction(clientId);
        setClients((prev) => prev.filter((c) => c.id !== clientId));
      } catch {
        toast.error("Failed to remove client");
      }
    });
  }

  return (
    <div className="space-y-6">
      {/* Master toggle */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-medium text-foreground flex items-center gap-2">
            <Cpu className="w-4 h-4 text-primary" />
            Payment Simulation
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">
                Enable payment simulation
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Autonomously generates incoming payments to demonstrate the AFE flow
              </p>
            </div>
            <Switch checked={enabled} onCheckedChange={setEnabled} />
          </div>
          {!enabled && (
            <div className="rounded-lg bg-muted/50 border border-border p-3">
              <p className="text-xs text-muted-foreground">
                Simulation mode is disabled. Enable to test the autonomous payment flow.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {enabled && (
        <>
          {/* Interval settings */}
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-medium text-foreground">
                Payment Interval
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-xs text-muted-foreground">Payment arrives every</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Min Interval (seconds)</Label>
                  <Input
                    type="number"
                    min={1}
                    max={maxInterval - 1}
                    value={minInterval}
                    onChange={(e) => setMinInterval(Math.max(1, Number(e.target.value)))}
                    className="w-full h-10"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Max Interval (seconds)</Label>
                  <Input
                    type="number"
                    min={minInterval + 1}
                    value={maxInterval}
                    onChange={(e) => setMaxInterval(Math.max(minInterval + 1, Number(e.target.value)))}
                    className="w-full h-10"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Approved clients */}
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-medium text-foreground">
                  Approved Clients
                </CardTitle>
                <Button
                  size="sm"
                  variant="outline"
                  className="border-border text-xs h-7"
                  onClick={() => setIsAddingClient(true)}
                >
                  Add client
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {/* Inline add form */}
              {isAddingClient && (
                <div className="rounded-lg border border-border p-3 space-y-3 bg-muted/20">
                  <Input
                    placeholder='Name (e.g. "YouTube AdSense")'
                    value={newClientName}
                    onChange={(e) => setNewClientName(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") addClient(); }}
                    autoFocus
                  />
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={newClientAutoApprove}
                        onCheckedChange={setNewClientAutoApprove}
                        id="auto-approve-new"
                      />
                      <Label htmlFor="auto-approve-new" className="text-xs text-muted-foreground cursor-pointer">
                        Auto-approve
                      </Label>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 text-xs"
                        onClick={() => { setIsAddingClient(false); setNewClientName(""); }}
                      >
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        className="h-7 text-xs bg-primary text-primary-foreground hover:bg-primary/90"
                        onClick={addClient}
                        disabled={isPending}
                      >
                        Add
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {clients.length === 0 && !isAddingClient && (
                <p className="text-xs text-muted-foreground py-2">
                  No approved clients yet. Unknown senders will require manual approval.
                </p>
              )}

              {clients.map((client, i) => (
                <div key={client.id}>
                  <div className="flex items-center justify-between py-4">
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-foreground">{client.name}</p>
                      <div className="flex items-center gap-2">
                        <span className={`w-1.5 h-1.5 rounded-full ${client.autoApprove ? "bg-primary" : "bg-muted-foreground"}`} />
                        <p className="text-[11px] text-muted-foreground">
                          {client.autoApprove ? "Auto-approve active" : "Manual approval required"}
                        </p>
                      </div>
                    </div>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                          disabled={isPending}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="bg-card border-border">
                        <AlertDialogHeader>
                          <AlertDialogTitle className="text-foreground">
                            Remove client?
                          </AlertDialogTitle>
                          <AlertDialogDescription className="text-muted-foreground">
                            &ldquo;{client.name}&rdquo; will no longer be auto-approved.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel className="border-border text-foreground">
                            Cancel
                          </AlertDialogCancel>
                          <AlertDialogAction
                            className="bg-destructive text-destructive-foreground"
                            onClick={() => removeClient(client.id)}
                          >
                            Remove
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                  {i < clients.length - 1 && <Separator className="bg-border" />}
                </div>
              ))}
            </CardContent>
          </Card>
        </>
      )}

      <Button
        className="bg-primary text-primary-foreground hover:bg-primary/90"
        onClick={saveSettings}
        disabled={isPending}
      >
        {isPending ? "Saving..." : "Save Settings"}
      </Button>
    </div>
  );
}

// --------------- Account Tab ---------------
function AccountTab() {
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
            <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
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
            <AlertTriangle className="w-4 h-4" />
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
    <Card className="bg-card border-border">
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
                <p className="text-[11px] text-muted-foreground max-w-xl">
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
            <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
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
export function SettingsClient({ session, profile, simulationSettings, approvedClients }: SettingsClientProps) {
  return (
    <Tabs defaultValue="profile" className="space-y-6 w-full">
      <TabsList className="bg-muted border border-border grid grid-cols-5 w-full">
        <TabsTrigger value="profile" className="text-xs">
          Profile
        </TabsTrigger>
        <TabsTrigger value="appearance" className="text-xs">
          Appearance
        </TabsTrigger>
        <TabsTrigger value="simulation" className="text-xs">
          Simulation
        </TabsTrigger>
        <TabsTrigger value="account" className="text-xs">
          Account
        </TabsTrigger>
        <TabsTrigger value="notifications" className="text-xs">
          Notifications
        </TabsTrigger>
      </TabsList>

      <TabsContent value="profile">
        <ProfileTab session={session} profile={profile} />
      </TabsContent>

      <TabsContent value="appearance">
        <AppearanceTab profile={profile} />
      </TabsContent>

      <TabsContent value="simulation">
        <SimulationTab
          initialSettings={simulationSettings ?? null}
          initialClients={approvedClients ?? []}
        />
      </TabsContent>

      <TabsContent value="account">
        <AccountTab />
      </TabsContent>

      <TabsContent value="notifications">
        <NotificationsTab />
      </TabsContent>
    </Tabs>
  );
}

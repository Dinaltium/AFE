"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { updateUserProfile } from "@/lib/actions";

const onboardingSchema = z.object({
  annualIncomeEstimate: z
    .number()
    .min(1, "Enter your estimated annual income"),
  taxRate: z
    .number()
    .min(0)
    .max(1, "Tax rate must be between 0 and 1"),
  collaboratorName: z.string().min(1, "Enter a collaborator name"),
  collaboratorRate: z
    .number()
    .min(0)
    .max(1, "Rate must be between 0 and 1"),
});

type OnboardingValues = z.infer<typeof onboardingSchema>;

function suggestTaxRate(income: number): number {
  if (income < 500000) return 0.05;
  if (income < 1000000) return 0.1;
  if (income < 2500000) return 0.2;
  return 0.3;
}

export default function OnboardingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const form = useForm<OnboardingValues>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      annualIncomeEstimate: 0,
      taxRate: 0.2,
      collaboratorName: "Collaborator",
      collaboratorRate: 0.1,
    },
  });

  const income = form.watch("annualIncomeEstimate");

  async function onSubmit(values: OnboardingValues) {
    setLoading(true);
    try {
      await updateUserProfile({
        annualIncomeEstimate: String(values.annualIncomeEstimate),
        taxRate: String(values.taxRate),
        collaboratorName: values.collaboratorName,
        collaboratorRate: String(values.collaboratorRate),
      });
      toast.success("Profile saved.");
      router.push("/dashboard");
    } catch {
      toast.error("Could not save profile. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background text-foreground">
      <Card
        className="w-full max-w-lg border bg-card text-card-foreground"
      >
        <CardHeader>
          <div className="text-2xl font-bold mb-2 text-primary">AFE</div>
          <CardTitle className="text-xl">
            Set up your profile
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            This helps AFE calculate your splits accurately. You can change these anytime in Settings.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="annualIncomeEstimate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Annual income estimate (INR)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="1200000"
                        {...field}
                        onChange={(e) => {
                          field.onChange(e);
                          const val = Number(e.target.value);
                          if (val > 0) {
                            form.setValue("taxRate", suggestTaxRate(val));
                          }
                        }}
                      />
                    </FormControl>
                    <FormDescription className="text-muted-foreground">
                      Used to pre-fill your tax rate suggestion
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="taxRate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Tax rate{" "}
                      {income > 0 && (
                        <span className="text-primary">
                          (suggested: {Math.round(suggestTaxRate(income) * 100)}%)
                        </span>
                      )}
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        max="1"
                        placeholder="0.20"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription className="text-muted-foreground">
                      Decimal format (e.g. 0.20 = 20%)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="collaboratorName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Collaborator name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Editor, Developer, Sub-consultant..."
                        {...field}
                      />
                    </FormControl>
                    <FormDescription className="text-muted-foreground">
                      The person or role you share revenue with
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="collaboratorRate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Collaborator rate</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        max="1"
                        placeholder="0.10"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription className="text-muted-foreground">
                      Decimal format (e.g. 0.10 = 10%)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full font-semibold bg-primary text-primary-foreground hover:bg-primary/90"
                disabled={loading}
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save and continue
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}

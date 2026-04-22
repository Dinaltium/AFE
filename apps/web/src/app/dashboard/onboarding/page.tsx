"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2, Plus, Trash2, Users, Banknote } from "lucide-react";
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
import { Label } from "@/components/ui/label";

const onboardingSchema = z.object({
  annualIncomeEstimate: z.coerce
    .number()
    .min(1, "Enter your estimated annual income"),
  taxRate: z.coerce
    .number()
    .min(0)
    .max(1, "Tax rate must be between 0 and 1"),
  collaborators: z.array(z.object({
    name: z.string().min(1, "Name required"),
    rate: z.coerce.number().min(0).max(1, "Rate must be between 0 and 1"),
  })),
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
    resolver: zodResolver(onboardingSchema) as unknown as Resolver<OnboardingValues>,
    defaultValues: {
      annualIncomeEstimate: 0,
      taxRate: 0.2,
      collaborators: [{ name: "Editor", rate: 0.1 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "collaborators",
  });

  const income = form.watch("annualIncomeEstimate");

  async function onSubmit(values: OnboardingValues) {
    setLoading(true);
    try {
      await updateUserProfile({
        annualIncomeEstimate: String(values.annualIncomeEstimate),
        taxRate: String(values.taxRate),
        collaborators: values.collaborators.map(c => ({
          name: c.name,
          rate: String(c.rate)
        })),
      });
      toast.success("Profile saved.");
      router.push("/dashboard");
    } catch (err) {
      console.error(err);
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

              <div className="space-y-4 pt-4 border-t border-border">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium">Collaborators</h3>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => append({ name: "", rate: 0.1 })}
                  >
                    + Add Collaborator
                  </Button>
                </div>

                {fields.map((field, index) => (
                  <div key={field.id} className="flex gap-4 items-end">
                    <FormField
                      control={form.control}
                      name={`collaborators.${index}.name`}
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormLabel>Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Editor, Manager..." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`collaborators.${index}.rate`}
                      render={({ field }) => (
                        <FormItem className="w-24">
                          <FormLabel>Rate</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.01" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => remove(index)}
                      className="text-destructive"
                    >
                      Remove
                    </Button>
                  </div>
                ))}
              </div>

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

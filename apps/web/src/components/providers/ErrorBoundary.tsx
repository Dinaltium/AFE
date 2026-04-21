"use client";
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6">
          <Card className="bg-card border-destructive/30">
            <CardContent className="p-8 flex flex-col items-center text-center gap-4">
              <AlertTriangle className="w-8 h-8 text-destructive" />
              <div>
                <p className="font-semibold text-foreground mb-1">
                  Something went wrong
                </p>
                <p className="text-sm text-muted-foreground">
                  {this.state.error?.message ?? "An unexpected error occurred."}
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => this.setState({ hasError: false })}
              >
                Try again
              </Button>
            </CardContent>
          </Card>
        </div>
      );
    }
    return this.props.children;
  }
}

import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function DashboardSkeleton() {
  return (
    <div className="p-6 space-y-6">
      <Skeleton className="h-7 w-32" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="bg-card border-border">
            <CardContent className="p-5">
              <Skeleton className="h-3 w-20 mb-3" />
              <Skeleton className="h-7 w-28" />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card className="bg-card border-border">
            <CardContent className="p-6">
              <Skeleton className="h-[220px] w-full" />
            </CardContent>
          </Card>
        </div>
        <Card className="bg-card border-border min-h-[480px]">
          <CardContent className="p-4">
            <Skeleton className="h-full w-full min-h-[440px]" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-[80vh] w-full flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md mx-4 border-border bg-card shadow-lg">
        <CardContent className="pt-6">
          <div className="flex mb-4 gap-2">
            <AlertCircle className="h-8 w-8 text-destructive" />
            <h1 className="text-2xl font-serif text-foreground">404 Page Not Found</h1>
          </div>

          <p className="mt-4 text-sm text-muted-foreground">
            The page you are looking for does not exist or has been moved.
          </p>
          <div className="mt-8">
            <a 
              href="/"
              className="inline-flex items-center justify-center px-6 py-3 border border-border bg-background text-foreground font-medium uppercase tracking-widest text-xs rounded-sm hover:bg-card hover:border-primary/50 transition-all"
            >
              Return Home
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

import { Card, CardContent } from "@/components/ui/card";
import { Activity } from "lucide-react";

export default function MostActivePage() {
  return (
    <Card>
      <CardContent className="p-12 text-center">
        {/* TODO(api): needs GET /accounts/top?sort=tx_count — placeholder */}
        <Activity className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">Most active accounts is coming soon</p>
        <p className="text-xs text-muted-foreground/80 mt-1">
          Endpoint <span className="font-mono">/accounts/top?sort=tx_count</span> pending on the Sentrix Chain API.
        </p>
      </CardContent>
    </Card>
  );
}

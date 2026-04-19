import { Card, CardContent } from "@/components/ui/card";
import { FileCode } from "lucide-react";

// TODO(api): needs GET /contracts/stats?sort=calls — placeholder empty state until indexer ships.
export default function ContractByCalls() {
  return (
    <Card>
      <CardContent className="p-12 text-center">
        <FileCode className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">Top contracts by calls is coming soon</p>
        <p className="text-xs text-muted-foreground/80 mt-1">
          Endpoint <span className="font-mono">/contracts/stats?sort=calls</span> pending on the Sentrix Chain API.
        </p>
      </CardContent>
    </Card>
  );
}

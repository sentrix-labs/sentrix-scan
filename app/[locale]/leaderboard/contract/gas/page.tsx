import { Card, CardContent } from "@/components/ui/card";
import { Flame } from "lucide-react";

// TODO(api): needs GET /contracts/stats?sort=gas_used — placeholder empty state.
export default function ContractByGas() {
  return (
    <Card>
      <CardContent className="p-12 text-center">
        <Flame className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">Top contracts by gas used is coming soon</p>
        <p className="text-xs text-muted-foreground/80 mt-1">
          Endpoint <span className="font-mono">/contracts/stats?sort=gas_used</span> pending on the Sentrix Chain API.
        </p>
      </CardContent>
    </Card>
  );
}

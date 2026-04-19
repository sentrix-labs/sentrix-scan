import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Search } from "lucide-react";

export default function NotFound() {
  const t = useTranslations();
  return (
    <div className="max-w-2xl mx-auto px-4 py-16">
      <Card>
        <CardContent className="p-8 text-center space-y-4">
          <div className="mx-auto h-12 w-12 rounded-full bg-blue-500/10 flex items-center justify-center">
            <Search className="h-6 w-6 text-blue-500" />
          </div>
          <h1 className="text-2xl font-bold">{t("not_found_page.title")}</h1>
          <p className="text-sm text-muted-foreground">{t("not_found_page.description")}</p>
          <div className="flex items-center justify-center gap-2 pt-2">
            <Link
              href="/"
              className="inline-flex items-center justify-center h-7 px-2.5 text-[0.8rem] font-medium rounded-[min(var(--radius-md),12px)] bg-primary text-primary-foreground hover:bg-primary/80 transition-colors"
            >
              {t("common.go_home")}
            </Link>
            <Link
              href="/blocks"
              className="inline-flex items-center justify-center h-7 px-2.5 text-[0.8rem] font-medium rounded-[min(var(--radius-md),12px)] border border-border hover:bg-muted transition-colors"
            >
              {t("not_found_page.browse_blocks")}
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

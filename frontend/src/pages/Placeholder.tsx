import { Construction } from "lucide-react";
import { PageHeader, Card } from "../components/ui";

export default function Placeholder({ title }: { title: string }) {
  return (
    <div className="animate-fade-in">
      <PageHeader title={title} />
      <Card className="flex flex-col items-center justify-center gap-3 py-20 text-center">
        <Construction className="h-10 w-10 text-brand-2" />
        <p className="text-muted">The {title} section is coming soon.</p>
      </Card>
    </div>
  );
}

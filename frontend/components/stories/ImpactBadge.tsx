import { Badge } from "@/components/ui/badge";
import { getImpactColorHex } from "@/helpers/stories/impact";

export { getImpactColorHex };

interface ImpactBadgeProps {
  impact?: string | null;
  className?: string;
}

export function ImpactBadge({ impact, className = "" }: ImpactBadgeProps) {
  if (impact) {
    const hex = getImpactColorHex(impact);

    return (
      <Badge
        variant="outline"
        className={`text-[10px] font-bold uppercase tracking-widest ${className}`}
        style={{
          color: hex,
          backgroundColor: `${hex}1A`, // 10% opacity
          borderColor: `${hex}33`, // 20% opacity
        }}
      >
        {impact}
      </Badge>
    );
  }

  return (
    <Badge
      variant="outline"
      className="text-[10px] font-bold uppercase tracking-widest text-primary border-primary/20 bg-primary/10"
    >
      Story
    </Badge>
  );
}

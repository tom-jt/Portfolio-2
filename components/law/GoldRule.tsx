import { cn } from "@/lib/utils";

interface GoldRuleProps {
  /**
   * Which end the rule fades toward. `center` fades both ends and is the
   * right choice under a centred heading.
   */
  fade?: "right" | "left" | "center" | "none";
  /**
   * `hair` is a true 1px line — reserve it for dense areas. `rule` is the
   * default: 1px is close to invisible on a 1080p panel at this opacity.
   */
  weight?: "hair" | "rule" | "bold";
  className?: string;
}

const fades: Record<NonNullable<GoldRuleProps["fade"]>, string> = {
  right: "bg-linear-to-r from-gold-hair to-transparent",
  left: "bg-linear-to-l from-gold-hair to-transparent",
  center: "bg-linear-to-r from-transparent via-gold-hair to-transparent",
  none: "bg-gold-hair",
};

const weights: Record<NonNullable<GoldRuleProps["weight"]>, string> = {
  hair: "h-px",
  rule: "h-0.5",
  bold: "h-1",
};

/**
 * A gold divider. Depth on the law site comes from rules and whitespace
 * rather than shadows or filled panels.
 */
const GoldRule = ({
  fade = "center",
  weight = "rule",
  className,
}: GoldRuleProps) => {
  return (
    <div className={cn("w-full", weights[weight], fades[fade], className)} />
  );
};

export default GoldRule;

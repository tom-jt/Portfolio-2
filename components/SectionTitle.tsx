import { cn } from "@/lib/utils";

interface SectionTitleProps {
  eyebrow?: string;
  title: string;
  className?: string;
  as?: "h1" | "h2";
  align?: "center" | "start";
}

const SectionTitle = ({
  eyebrow,
  title,
  className,
  as: Tag = "h1",
  align = "center",
}: SectionTitleProps) => {
  return (
    <div
      className={cn(
        "flex flex-col",
        align === "center" ? "items-center" : "items-start",
        className,
      )}
    >
      {eyebrow ? (
        <p
          className={cn(
            "c-eyebrow",
            align === "start" && "text-left",
          )}
        >
          {eyebrow}
        </p>
      ) : null}
      <Tag
        className={cn(
          "c-h1",
          align === "start" && "text-left",
        )}
      >
        {title}
      </Tag>
    </div>
  );
};

export default SectionTitle;

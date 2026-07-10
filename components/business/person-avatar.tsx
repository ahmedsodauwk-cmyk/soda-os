import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface PersonAvatarProps {
  nameAr?: string;
  nameEn: string;
  initials: string;
  avatarUrl?: string;
  size?: "sm" | "default" | "lg";
  className?: string;
  showNames?: boolean;
}

export function PersonAvatar({
  nameAr,
  nameEn,
  initials,
  avatarUrl,
  size = "default",
  className,
  showNames = false,
}: PersonAvatarProps) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <Avatar size={size === "lg" ? "lg" : size === "sm" ? "sm" : "default"}>
        {avatarUrl ? <AvatarImage src={avatarUrl} alt={nameEn} /> : null}
        <AvatarFallback className="bg-[linear-gradient(135deg,var(--soda-purple),var(--soda-pink))] text-xs font-medium text-white">
          {initials}
        </AvatarFallback>
      </Avatar>
      {showNames ? (
        <div className="min-w-0">
          {nameAr ? (
            <p className="font-ar truncate text-sm font-medium" dir="rtl">
              {nameAr}
            </p>
          ) : null}
          <p className="truncate text-xs text-muted-foreground">{nameEn}</p>
        </div>
      ) : null}
    </div>
  );
}

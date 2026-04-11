import Image from "next/image"
import { cn } from "@/lib/utils"

type BrandSize = "xs" | "sm" | "md" | "lg"

const sizeMap: Record<BrandSize, { frame: string; image: string; text: string; gap: string }> = {
  xs: { frame: "h-5 w-5 rounded-[6px]", image: "h-4 w-4 rounded-[4px]", text: "text-xs", gap: "gap-1.5" },
  sm: { frame: "h-6 w-6 rounded-[7px]", image: "h-5 w-5 rounded-[5px]", text: "text-sm", gap: "gap-2" },
  md: { frame: "h-7 w-7 rounded-[8px]", image: "h-6 w-6 rounded-[6px]", text: "text-base", gap: "gap-2.5" },
  lg: { frame: "h-8 w-8 rounded-[10px]", image: "h-7 w-7 rounded-[8px]", text: "text-lg", gap: "gap-3" },
}

type BrandMarkProps = {
  size?: BrandSize
  showName?: boolean
  nameClassName?: string
  className?: string
  name?: string
}

export function BrandMark({
  size = "sm",
  showName = false,
  nameClassName,
  className,
  name = "Karigar",
}: BrandMarkProps) {
  const styles = sizeMap[size]

  return (
    <span className={cn("inline-flex items-center", styles.gap, className)}>
      <span className={cn("inline-flex items-center justify-center border border-white/15 bg-white/10 p-0.5", styles.frame)}>
        <Image
          src="/images/karigar-logo.svg"
          alt="Karigar Logo"
          width={20}
          height={20}
          className={styles.image}
        />
      </span>
      {showName ? <span className={cn("font-semibold tracking-wide", styles.text, nameClassName)}>{name}</span> : null}
    </span>
  )
}

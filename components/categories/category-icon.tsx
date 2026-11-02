import { Building2, Car, Globe, Landmark, MapPin, Route, Trees, Truck, Tv, Users, type LucideProps } from "lucide-react"
import type { CategoryIconName } from "@/lib/domain/types"

const ICONS = {
  building: Building2,
  truck: Truck,
  "map-pin": MapPin,
  users: Users,
  tv: Tv,
  globe: Globe,
  landmark: Landmark,
  route: Route,
  car: Car,
  trees: Trees,
} satisfies Record<CategoryIconName, React.ComponentType<LucideProps>>

export function CategoryIcon({ name, ...props }: { name: CategoryIconName } & LucideProps) {
  const Icon = ICONS[name]
  return <Icon aria-hidden {...props} />
}

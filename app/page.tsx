import { DataGate } from "@/components/common/states"
import { CategoriesView } from "@/components/categories/categories-view"

export default function HomePage() {
  return (
    <DataGate>
      <CategoriesView />
    </DataGate>
  )
}

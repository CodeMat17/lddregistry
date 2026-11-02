import type { Metadata } from "next"
import { Suspense } from "react"
import { notFound } from "next/navigation"
import { DataGate, PageSkeleton } from "@/components/common/states"
import { CategoryRegisterView } from "@/components/categories/category-register-view"
import { CATEGORIES, getCategory } from "@/lib/domain/categories"

export function generateStaticParams() {
  return CATEGORIES.map((c) => ({ categoryId: c.id }))
}

export async function generateMetadata({ params }: PageProps<"/categories/[categoryId]">): Promise<Metadata> {
  const { categoryId } = await params
  return { title: getCategory(categoryId)?.label ?? "Category" }
}

export default async function CategoryPage({ params }: PageProps<"/categories/[categoryId]">) {
  const { categoryId } = await params
  if (!getCategory(categoryId)) notFound()
  return (
    <Suspense fallback={<PageSkeleton />}>
      <DataGate>
        <CategoryRegisterView categoryId={categoryId} />
      </DataGate>
    </Suspense>
  )
}

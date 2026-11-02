import Link from "next/link"
import { Compass } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function NotFound() {
  return (
    <div className="flex flex-col items-center py-16 text-center">
      <span className="mb-4 grid size-14 place-items-center rounded-full bg-muted text-muted-foreground">
        <Compass className="size-7" aria-hidden />
      </span>
      <h1 className="text-display font-semibold">Page not found</h1>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">The page you were looking for doesn’t exist in the LDD Registry.</p>
      <div className="mt-6 flex gap-2">
        <Button className="h-10" render={<Link href="/" />} nativeButton={false}>
          Go to dashboard
        </Button>
      </div>
    </div>
  )
}

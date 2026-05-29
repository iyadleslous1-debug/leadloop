import { Plus } from "lucide-react";
import Link from "next/link";
import { getProperties } from "@/services/properties";
import { PropertyTable } from "@/components/properties/PropertyTable";
import { Button } from "@/components/ui/button";

export default async function PropertiesPage() {
  const properties = await getProperties();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-zinc-100">Properties</h2>
          <p className="text-sm text-zinc-500">
            {properties.length} propert{properties.length !== 1 ? "ies" : "y"} total
          </p>
        </div>
        <Link href="/dashboard/properties/new">
          <Button>
            <Plus className="h-4 w-4" />
            Add Property
          </Button>
        </Link>
      </div>

      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
        {properties.length > 0 ? (
          <PropertyTable properties={properties} />
        ) : (
          <p className="py-12 text-center text-sm text-zinc-500">
            No properties yet. Click "Add Property" to create one.
          </p>
        )}
      </div>
    </div>
  );
}

import { Plus, Building2, Download, Search } from "lucide-react";
import Link from "next/link";
import { getProperties } from "@/services/properties";
import { PropertyTable } from "@/components/properties/PropertyTable";
import { PaginationBar } from "@/components/ui/PaginationBar";
import { Button } from "@/components/ui/button";

interface PropertiesPageProps {
  searchParams: Promise<{ page?: string; q?: string; type?: string; status?: string }>;
}

export default async function PropertiesPage({ searchParams }: PropertiesPageProps) {
  const { page: pageStr, q, type, status } = await searchParams;
  const page = parseInt(pageStr || "1", 10) || 1;
  const result = await getProperties(page, { q, type, status }).catch(() => ({ properties: [], total: 0, page: 1, totalPages: 0 }));
  const { properties, total, totalPages } = result;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-zinc-100">Properties</h2>
          <p className="text-sm text-zinc-500">
            {total} propert{total !== 1 ? "ies" : "y"} total
          </p>
        </div>
        <div className="flex items-center gap-2">
          <a
            href="/api/export/properties"
            className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm font-medium text-zinc-300 transition-colors hover:bg-zinc-700"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </a>
          <Link href="/dashboard/properties/new">
            <Button>
              <Plus className="h-4 w-4" />
              Add Property
            </Button>
          </Link>
        </div>
      </div>

      <form className="flex flex-wrap gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
          <input
            name="q"
            defaultValue={q || ""}
            placeholder="Search by title, city, or location..."
            className="w-full rounded-lg border border-zinc-800 bg-zinc-900 py-2 pl-9 pr-3 text-sm text-zinc-100 placeholder-zinc-500 focus:border-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-600"
          />
        </div>
        <select name="type" defaultValue={type || ""} className="rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-300">
          <option value="">All types</option>
          <option value="villa">Villa</option>
          <option value="apartment">Apartment</option>
          <option value="house">House</option>
          <option value="land">Land</option>
          <option value="commercial">Commercial</option>
        </select>
        <select name="status" defaultValue={status || ""} className="rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-300">
          <option value="">All statuses</option>
          <option value="for_sale">For Sale</option>
          <option value="for_rent">For Rent</option>
          <option value="sold">Sold</option>
          <option value="rented">Rented</option>
        </select>
        <button type="submit" className="rounded-lg bg-zinc-800 px-4 py-2 text-sm text-zinc-300 transition-colors hover:bg-zinc-700">
          Filter
        </button>
        {(q || type || status) && (
          <a
            href="/dashboard/properties"
            className="inline-flex items-center rounded-lg border border-zinc-700 px-4 py-2 text-sm text-zinc-400 transition-colors hover:bg-zinc-800"
          >
            Clear
          </a>
        )}
      </form>

      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
        {properties.length > 0 ? (
          <>
            <PropertyTable properties={properties} />
            <PaginationBar currentPage={page} totalPages={totalPages} totalItems={total} />
          </>
        ) : (
          <div className="py-12 text-center">
            <Building2 className="mx-auto mb-3 h-8 w-8 text-zinc-600" />
            <p className="text-sm text-zinc-500">
              No properties yet. Add your first listing to get started.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

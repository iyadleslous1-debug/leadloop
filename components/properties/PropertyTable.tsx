"use client";

import { useRouter } from "next/navigation";
import { Pencil, Trash2 } from "lucide-react";
import type { Property } from "@/types/property";
import { PropertyBadge } from "./PropertyBadge";
import { Button } from "@/components/ui/button";

interface PropertyTableProps {
  properties: Property[];
}

export function PropertyTable({ properties }: PropertyTableProps) {
  const router = useRouter();

  async function handleDelete(id: string, title: string) {
    if (!confirm(`Delete "${title}"? This will also unlink associated leads.`)) return;
    try {
      const res = await fetch(`/api/properties/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      router.refresh();
    } catch (err) {
      console.error("Delete error:", err);
    }
  }

  function formatPrice(price: number) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-zinc-800 text-left text-zinc-400">
            <th className="pb-3 pr-4 font-medium">Photo</th>
            <th className="pb-3 pr-4 font-medium">Title</th>
            <th className="hidden md:table-cell pb-3 pr-4 font-medium">Type</th>
            <th className="pb-3 pr-4 font-medium">Status</th>
            <th className="pb-3 pr-4 font-medium">Price</th>
            <th className="hidden md:table-cell pb-3 pr-4 font-medium">Location</th>
            <th className="hidden lg:table-cell pb-3 pr-4 font-medium">Tags</th>
            <th className="pb-3 font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {properties.map((property) => (
            <tr key={property.id} className="border-b border-zinc-800/50">
              <td className="py-3 pr-4">
                <a href={`/dashboard/properties/${property.id}`}>
                  {property.images?.[0] ? (
                    <img
                      src={property.images[0]}
                      alt=""
                      className="h-14 w-20 rounded-lg object-cover transition-opacity hover:opacity-80"
                    />
                  ) : (
                    <div className="flex h-14 w-20 items-center justify-center rounded-lg bg-zinc-800 text-[10px] text-zinc-600">
                      No img
                    </div>
                  )}
                </a>
              </td>
              <td className="py-3 pr-4">
                <a href={`/dashboard/properties/${property.id}`} className="font-medium text-zinc-100 transition-colors hover:text-zinc-300">
                  {property.title}
                </a>
              </td>
              <td className="hidden md:table-cell py-3 pr-4">
                <PropertyBadge type={property.type} />
              </td>
              <td className="py-3 pr-4">
                <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                  property.status === "for_sale" ? "bg-emerald-500/10 text-emerald-400" :
                  property.status === "for_rent" ? "bg-blue-500/10 text-blue-400" :
                  property.status === "sold" ? "bg-red-500/10 text-red-400" :
                  "bg-zinc-500/10 text-zinc-400"
                }`}>
                  {property.status.replace("_", " ")}
                </span>
              </td>
              <td className="py-3 pr-4 text-zinc-200 font-medium">
                {formatPrice(property.price)}
              </td>
              <td className="hidden md:table-cell py-3 pr-4 text-zinc-400">
                <div>{property.city}</div>
                <div className="text-xs">{property.location}</div>
              </td>
              <td className="hidden lg:table-cell py-3 pr-4">
                <div className="flex flex-wrap gap-1">
                  {(property.tags || []).slice(0, 3).map((t) => (
                    <span key={t} className="rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] text-zinc-400">{t}</span>
                  ))}
                  {(property.tags || []).length > 3 && (
                    <span className="text-[10px] text-zinc-600">+{property.tags.length - 3}</span>
                  )}
                </div>
              </td>
              <td className="py-3">
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => router.push(`/dashboard/properties/${property.id}/edit`)}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => handleDelete(property.id, property.title)}
                  >
                    <Trash2 className="h-3.5 w-3.5 text-red-400" />
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

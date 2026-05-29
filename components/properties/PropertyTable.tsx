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

    const res = await fetch(`/api/properties/${id}`, { method: "DELETE" });
    if (res.ok) {
      router.refresh();
    } else {
      const data = await res.json();
      alert(data.error || "Failed to delete property");
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
            <th className="pb-3 pr-4 font-medium">Title</th>
            <th className="pb-3 pr-4 font-medium">Type</th>
            <th className="pb-3 pr-4 font-medium">Price</th>
            <th className="pb-3 pr-4 font-medium">Location</th>
            <th className="pb-3 font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {properties.map((property) => (
            <tr key={property.id} className="border-b border-zinc-800/50">
              <td className="py-3 pr-4 text-zinc-100">{property.title}</td>
              <td className="py-3 pr-4">
                <PropertyBadge type={property.type} />
              </td>
              <td className="py-3 pr-4 text-zinc-200 font-medium">
                {formatPrice(property.price)}
              </td>
              <td className="py-3 pr-4 text-zinc-400">
                <div>{property.city}</div>
                <div className="text-xs">{property.location}</div>
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

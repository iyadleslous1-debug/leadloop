import { notFound } from "next/navigation";
import { getProperty } from "@/services/properties";
import { PropertyForm } from "@/components/properties/PropertyForm";

export default async function EditPropertyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  let property;
  try {
    property = await getProperty(id);
  } catch {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-zinc-100">Edit Property</h2>
        <p className="text-sm text-zinc-500">Update property details</p>
      </div>

      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
        <PropertyForm property={property} />
      </div>
    </div>
  );
}

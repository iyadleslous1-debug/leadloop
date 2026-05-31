import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Pencil, MapPin, Building2, DollarSign, Calendar } from "lucide-react";
import { getProperty } from "@/services/properties";
import { PhotoGallery } from "@/components/properties/PhotoGallery";
import { PropertyBadge } from "@/components/properties/PropertyBadge";
import { Button } from "@/components/ui/button";

export default async function PropertyDetailPage({
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

  const statusStyles: Record<string, string> = {
    for_sale: "bg-emerald-500/10 text-emerald-400",
    for_rent: "bg-blue-500/10 text-blue-400",
    sold: "bg-red-500/10 text-red-400",
    rented: "bg-zinc-500/10 text-zinc-400",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link
          href="/dashboard/properties"
          className="inline-flex items-center gap-1.5 text-sm text-zinc-400 transition-colors hover:text-zinc-200"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to properties
        </Link>
        <Link href={`/dashboard/properties/${property.id}/edit`}>
          <Button variant="outline">
            <Pencil className="h-4 w-4" />
            Edit
          </Button>
        </Link>
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-semibold text-zinc-100">{property.title}</h2>
          <PropertyBadge type={property.type} />
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-zinc-400">
          <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${statusStyles[property.status] || statusStyles.for_sale}`}>
            {property.status.replace("_", " ")}
          </span>
          <span className="inline-flex items-center gap-1">
            <DollarSign className="h-3.5 w-3.5" />
            {new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0 }).format(property.price)}
          </span>
          <span className="inline-flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5" />
            {property.city}, {property.location}
          </span>
          <span className="inline-flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5" />
            Listed {new Date(property.created_at).toLocaleDateString()}
          </span>
        </div>
      </div>

      <PhotoGallery images={property.images || []} title={property.title} />

      {property.description && (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
          <h3 className="mb-3 text-sm font-medium text-zinc-300">Description</h3>
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-zinc-400">{property.description}</p>
        </div>
      )}

      {property.video_url && (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
          <h3 className="mb-3 text-sm font-medium text-zinc-300">Video Tour</h3>
          <div className="aspect-video overflow-hidden rounded-lg">
            <iframe
              src={property.video_url.replace("watch?v=", "embed/").replace("youtu.be/", "youtube.com/embed/")}
              className="h-full w-full"
              allowFullScreen
              title="Property video tour"
            />
          </div>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
          <h3 className="mb-3 text-sm font-medium text-zinc-300">Details</h3>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-zinc-500">Type</dt>
              <dd className="text-zinc-200 capitalize">{property.type}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-zinc-500">Status</dt>
              <dd className="text-zinc-200 capitalize">{property.status.replace("_", " ")}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-zinc-500">Price</dt>
              <dd className="text-zinc-200 font-medium">
                {new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0 }).format(property.price)}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-zinc-500">City</dt>
              <dd className="text-zinc-200">{property.city}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-zinc-500">Location</dt>
              <dd className="text-zinc-200">{property.location}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-zinc-500">Listed</dt>
              <dd className="text-zinc-200">{new Date(property.created_at).toLocaleDateString()}</dd>
            </div>
          </dl>
        </div>
        {(property.tags || []).length > 0 && (
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
            <h3 className="mb-3 text-sm font-medium text-zinc-300">Tags</h3>
            <div className="flex flex-wrap gap-2">
              {property.tags.map((t) => (
                <span key={t} className="rounded-full bg-zinc-800 px-3 py-1 text-xs text-zinc-300">{t}</span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

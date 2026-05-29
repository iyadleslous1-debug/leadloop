import { PropertyForm } from "@/components/properties/PropertyForm";

export default function NewPropertyPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-zinc-100">Add Property</h2>
        <p className="text-sm text-zinc-500">List a new property on your portfolio</p>
      </div>

      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
        <PropertyForm />
      </div>
    </div>
  );
}

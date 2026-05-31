"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import type { Property, PropertyFormData, PropertyType, PropertyStatus } from "@/types/property";
import { TagInput } from "@/components/ui/TagInput";

const PROPERTY_TYPES: PropertyType[] = ["villa", "apartment", "house", "land", "commercial", "other"];
const PROPERTY_STATUSES: PropertyStatus[] = ["for_sale", "for_rent", "sold", "rented"];

interface PropertyFormProps {
  property?: Property;
}

export function PropertyForm({ property }: PropertyFormProps) {
  const router = useRouter();
  const [title, setTitle] = useState(property?.title || "");
  const [price, setPrice] = useState(property?.price?.toString() || "");
  const [location, setLocation] = useState(property?.location || "");
  const [city, setCity] = useState(property?.city || "");
  const [type, setType] = useState<PropertyType>(property?.type || "apartment");
  const [status, setStatus] = useState<PropertyStatus>(property?.status || "for_sale");
  const [tags, setTags] = useState<string[]>(property?.tags || []);
  const [description, setDescription] = useState(property?.description || "");
  const [imagesInput, setImagesInput] = useState(property?.images?.join("\n") || "");
  const [videoUrl, setVideoUrl] = useState(property?.video_url || "");
  const [loading, setLoading] = useState(false);

  const isEditing = !!property;

  async function handleSubmit() {
    setLoading(true);

    try {
      const images = imagesInput
        .split("\n")
        .map((s) => s.trim())
        .filter((s) => s.startsWith("http"));

      const body: PropertyFormData = {
        title: title.trim(),
        price: parseFloat(price),
        location: location.trim(),
        city: city.trim(),
        type,
        status,
        tags: tags.length > 0 ? tags : undefined,
        description: description.trim() || undefined,
        images: images.length > 0 ? images : undefined,
        video_url: videoUrl.trim() || undefined,
      };

      if (!body.title || !body.location || !body.city || isNaN(body.price)) {
        toast.error("Please fill in all required fields");
        setLoading(false);
        return;
      }

      const url = isEditing
        ? `/api/properties/${property.id}`
        : "/api/properties";
      const method = isEditing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Something went wrong");
      }

      toast.success(isEditing ? "Property updated" : "Property created");
      router.push("/dashboard/properties");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "An unexpected error occurred");
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-zinc-300">
          Title <span className="text-zinc-500">*</span>
        </label>
        <input
          id="title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          className="mt-1 block w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 focus:border-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-600"
          placeholder="Modern Beachfront Villa"
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label htmlFor="price" className="block text-sm font-medium text-zinc-300">
            Price (USD) <span className="text-zinc-500">*</span>
          </label>
          <input
            id="price"
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            required
            min={0}
            className="mt-1 block w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 focus:border-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-600"
            placeholder="500000"
          />
        </div>
        <div>
          <label htmlFor="type" className="block text-sm font-medium text-zinc-300">
            Type <span className="text-zinc-500">*</span>
          </label>
          <select
            id="type"
            value={type}
            onChange={(e) => setType(e.target.value as PropertyType)}
            className="mt-1 block w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2.5 text-sm text-zinc-100 focus:border-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-600"
          >
            {PROPERTY_TYPES.map((t) => (
              <option key={t} value={t}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="status" className="block text-sm font-medium text-zinc-300">
            Status
          </label>
          <select
            id="status"
            value={status}
            onChange={(e) => setStatus(e.target.value as PropertyStatus)}
            className="mt-1 block w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2.5 text-sm text-zinc-100 focus:border-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-600"
          >
            {PROPERTY_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase())}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="city" className="block text-sm font-medium text-zinc-300">
            City <span className="text-zinc-500">*</span>
          </label>
          <input
            id="city"
            type="text"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            required
            className="mt-1 block w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 focus:border-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-600"
            placeholder="Dubai"
          />
        </div>
        <div>
          <label htmlFor="location" className="block text-sm font-medium text-zinc-300">
            Location <span className="text-zinc-500">*</span>
          </label>
          <input
            id="location"
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            required
            className="mt-1 block w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 focus:border-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-600"
            placeholder="Palm Jumeirah"
          />
        </div>
      </div>
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-zinc-300">
          Description
        </label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          className="mt-1 block w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 focus:border-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-600"
          placeholder="Beautiful villa with ocean view..."
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-zinc-300">Tags</label>
        <TagInput tags={tags} onChange={setTags} placeholder="e.g. luxury, beachfront, new-listing" />
      </div>
      <div>
        <label htmlFor="images" className="block text-sm font-medium text-zinc-300">
          Image URLs (one per line)
        </label>
        <textarea
          id="images"
          value={imagesInput}
          onChange={(e) => setImagesInput(e.target.value)}
          rows={3}
          className="mt-1 block w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 focus:border-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-600"
          placeholder="https://example.com/photo1.jpg&#10;https://example.com/photo2.jpg"
        />
        {property?.images && property.images.length > 0 && (
          <div className="mt-2 flex gap-2">
            {property.images.map((url, i) => (
              <img key={i} src={url} alt="" className="h-16 w-24 rounded-lg object-cover" />
            ))}
          </div>
        )}
      </div>
      <div>
        <label htmlFor="video_url" className="block text-sm font-medium text-zinc-300">
          Video URL (YouTube, etc.)
        </label>
        <input
          id="video_url"
          type="url"
          value={videoUrl}
          onChange={(e) => setVideoUrl(e.target.value)}
          className="mt-1 block w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 focus:border-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-600"
          placeholder="https://youtube.com/watch?v=..."
        />
      </div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={loading}
          style={{ cursor: loading ? "not-allowed" : "pointer" }}
          className="inline-flex items-center justify-center rounded-lg bg-zinc-100 px-4 py-2.5 text-sm font-medium text-zinc-900 transition-colors hover:bg-zinc-200 disabled:opacity-50"
        >
          {loading ? "Saving..." : isEditing ? "Update Property" : "Add Property"}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="inline-flex items-center justify-center rounded-lg border border-zinc-800 px-4 py-2.5 text-sm font-medium text-zinc-400 transition-colors hover:bg-zinc-900 hover:text-zinc-200"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

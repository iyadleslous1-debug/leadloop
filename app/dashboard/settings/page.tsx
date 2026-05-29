import { Settings } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <Settings className="h-12 w-12 text-zinc-600" />
      <h2 className="mt-4 text-lg font-semibold text-zinc-100">
        Settings Coming Soon
      </h2>
      <p className="mt-2 text-sm text-zinc-500">
        Configure your profile, notifications, and integrations.
      </p>
    </div>
  );
}

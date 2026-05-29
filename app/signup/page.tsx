import { SignUpForm } from "./signup-form";

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-zinc-100">LeadLoop</h1>
          <p className="mt-1 text-sm text-zinc-400">
            Create your account
          </p>
        </div>
        <SignUpForm />
      </div>
    </div>
  );
}

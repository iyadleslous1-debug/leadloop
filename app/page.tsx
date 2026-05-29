import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-zinc-950 px-6">
      <div className="max-w-lg text-center">
        <h1 className="text-4xl font-bold tracking-tight text-zinc-100">
          Never lose a lead again
        </h1>
        <p className="mt-4 text-lg text-zinc-400">
          LeadLoop automatically follows up with your real estate leads via
          WhatsApp and AI so you can close more deals.
        </p>
        <div className="mt-8 flex items-center justify-center gap-4">
          <Link href="/signup">
            <Button size="lg">Get started</Button>
          </Link>
          <Link href="/login">
            <Button variant="outline" size="lg">
              Sign in
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

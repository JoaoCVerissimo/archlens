"use client";

import Link from "next/link";
import { useRepositories } from "@/hooks/use-repository";
import { RepoCard } from "@/components/repository/repo-card";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

export default function DashboardPage() {
  const { data: repos, isLoading } = useRepositories();

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">ArchLens</h1>
          <p className="mt-1 text-gray-500">
            AI-powered software architecture review platform
          </p>
        </div>
        <Link href="/repositories/new">
          <Button>Add Repository</Button>
        </Link>
      </div>

      <section>
        <h2 className="mb-4 text-xl font-semibold text-gray-900">Recent Repositories</h2>
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Spinner className="h-8 w-8" />
          </div>
        ) : repos && repos.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {repos.slice(0, 6).map((repo) => (
              <RepoCard key={repo.id} repo={repo} />
            ))}
          </div>
        ) : (
          <div className="rounded-lg border-2 border-dashed border-gray-300 py-12 text-center">
            <p className="text-gray-500">No repositories yet.</p>
            <Link href="/repositories/new" className="mt-2 inline-block text-sm text-brand-600 hover:underline">
              Add your first repository
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}

"use client";

import Link from "next/link";
import { useRepositories } from "@/hooks/use-repository";
import { RepoCard } from "@/components/repository/repo-card";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

export default function RepositoriesPage() {
  const { data: repos, isLoading } = useRepositories();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Repositories</h1>
        <Link href="/repositories/new">
          <Button>Add Repository</Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Spinner className="h-8 w-8" />
        </div>
      ) : repos && repos.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {repos.map((repo) => (
            <RepoCard key={repo.id} repo={repo} />
          ))}
        </div>
      ) : (
        <p className="text-gray-500">No repositories found.</p>
      )}
    </div>
  );
}

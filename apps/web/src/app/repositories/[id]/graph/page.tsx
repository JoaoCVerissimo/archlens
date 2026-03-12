"use client";

import { use } from "react";
import useSWR from "swr";
import { fetcher } from "@/lib/api-client";
import { DependencyGraphView } from "@/components/graph/dependency-graph";
import { Spinner } from "@/components/ui/spinner";
import type { DependencyGraph } from "@archlens/shared";

export default function GraphPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data, isLoading } = useSWR<DependencyGraph>(
    `/repositories/${id}/graph`,
    fetcher,
  );

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  if (!data || data.nodes.length === 0) {
    return <p className="text-gray-500">No dependency data available. Index the repository first.</p>;
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-900">Dependency Graph</h1>
      <p className="text-sm text-gray-500">
        {data.nodes.length} files, {data.edges.length} dependencies
      </p>
      <DependencyGraphView nodes={data.nodes} edges={data.edges} />
    </div>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api-client";

export function RepoForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [sourceType, setSourceType] = useState<"github" | "zip" | "local">("github");
  const [sourceUrl, setSourceUrl] = useState("");
  const [branch, setBranch] = useState("main");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const repo = await api.post<{ id: string }>("/repositories", {
        name,
        sourceType,
        sourceUrl: sourceType === "github" ? sourceUrl : undefined,
        branch,
      });
      router.push(`/repositories/${repo.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create repository");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-lg space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="my-project"
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Source Type</label>
        <select
          value={sourceType}
          onChange={(e) => setSourceType(e.target.value as any)}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        >
          <option value="github">GitHub Repository</option>
          <option value="zip">ZIP Upload</option>
          <option value="local">Local Path</option>
        </select>
      </div>

      {sourceType === "github" && (
        <div>
          <label className="block text-sm font-medium text-gray-700">GitHub URL</label>
          <input
            type="url"
            value={sourceUrl}
            onChange={(e) => setSourceUrl(e.target.value)}
            placeholder="https://github.com/owner/repo"
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            required
          />
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700">Branch</label>
        <input
          type="text"
          value={branch}
          onChange={(e) => setBranch(e.target.value)}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <Button type="submit" disabled={loading}>
        {loading ? "Creating..." : "Add Repository"}
      </Button>
    </form>
  );
}

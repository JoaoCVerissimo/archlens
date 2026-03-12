import { RepoForm } from "@/components/repository/repo-form";

export default function NewRepositoryPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Add Repository</h1>
      <RepoForm />
    </div>
  );
}

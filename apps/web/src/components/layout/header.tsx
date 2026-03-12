import Link from "next/link";

export function Header() {
  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="text-xl font-bold text-brand-700">
          ArchLens
        </Link>
        <nav className="flex items-center gap-6">
          <Link href="/repositories" className="text-sm text-gray-600 hover:text-gray-900">
            Repositories
          </Link>
        </nav>
      </div>
    </header>
  );
}

import { Link } from "wouter";

export default function NotFound() {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center max-w-[320px]">
        <h1 className="text-5xl font-bold text-gray-200 mb-3">404</h1>
        <p className="text-sm text-gray-500 mb-4">Page not found</p>
        <Link href="/" className="text-sm text-primary hover:underline">
          Back to Messages
        </Link>
      </div>
    </div>
  );
}

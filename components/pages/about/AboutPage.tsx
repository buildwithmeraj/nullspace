export default function AboutPage() {
  return (
    <div className="mx-auto w-full max-w-3xl space-y-4">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">About NullSpace</h1>
        <p className="text-sm opacity-70">
          NullSpace is a developer-first space to share posts, code, and ideas.
        </p>
      </header>

      <section className="card bg-base-100 border border-base-200 shadow-sm">
        <div className="card-body space-y-2">
          <h2 className="card-title text-base">What you can do</h2>
          <ul className="list-disc pl-5 text-sm opacity-80 space-y-1">
            <li>Write posts with Markdown and code blocks</li>
            <li>Connect with other developers through alliances</li>
            <li>React and comment to keep discussions going</li>
          </ul>
        </div>
      </section>
    </div>
  );
}

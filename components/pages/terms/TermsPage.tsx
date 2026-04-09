export default function TermsPage() {
  return (
    <div className="mx-auto w-full max-w-3xl space-y-4">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">Terms of Service</h1>
        <p className="text-sm opacity-70">
          This is a simple placeholder. Replace with your formal terms.
        </p>
      </header>

      <section className="card bg-base-100 border border-base-200 shadow-sm">
        <div className="card-body space-y-2 text-sm">
          <p className="opacity-80">
            Be respectful, don&apos;t post illegal content, and keep discussions
            constructive.
          </p>
          <p className="opacity-80">
            You are responsible for the content you publish.
          </p>
        </div>
      </section>
    </div>
  );
}

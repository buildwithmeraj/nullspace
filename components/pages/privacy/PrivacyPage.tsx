export default function PrivacyPage() {
  return (
    <div className="mx-auto w-full max-w-3xl space-y-4">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">Privacy Policy</h1>
        <p className="text-sm opacity-70">
          This is a simple placeholder. Replace with your formal policy.
        </p>
      </header>

      <section className="card bg-base-100 border border-base-200 shadow-sm">
        <div className="card-body space-y-2 text-sm">
          <p className="opacity-80">
            We store the minimum data needed to run the app (account details,
            posts, comments, reactions, and notifications).
          </p>
          <p className="opacity-80">
            Authentication is handled by the backend and sessions may use
            cookies.
          </p>
        </div>
      </section>
    </div>
  );
}

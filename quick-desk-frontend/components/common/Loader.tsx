export function Loader() {
  return <div className="loader" />;
}

export function FullPageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950">
      <Loader />
    </div>
  );
}

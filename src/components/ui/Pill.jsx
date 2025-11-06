export default function Pill({ children }) {
  return (
    <span className="px-2 py-1 rounded-full bg-slate-100 text-slate-700 text-xs">
      {children}
    </span>
  );
}

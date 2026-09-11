export default function Loader({ fullScreen = false, inline = false }) {
  return (
    <div
      className={`flex items-center justify-center ${
        fullScreen ? "min-h-screen" : inline ? "" : "min-h-48"
      }`}
    >
      <span
        className={`animate-spin rounded-full border-2 ${
          inline
            ? "h-4 w-4 border-white/40 border-t-white"
            : "h-8 w-8 border-slate-200 border-t-blue-600"
        }`}
      />
    </div>
  );
}

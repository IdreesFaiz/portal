export default function Header() {
    return (
      <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
        <h2 className="text-xl font-semibold text-gray-800">
          Admin Dashboard
        </h2>
  
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-slate-300" />
        </div>
      </header>
    );
  }
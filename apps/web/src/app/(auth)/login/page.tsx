export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="max-w-sm w-full p-8 rounded-xl bg-gray-800 border border-gray-700">
        <h1 className="text-2xl font-bold mb-6 text-center">Sign In</h1>
        <div className="flex flex-col gap-3">
          <button className="px-4 py-3 bg-white text-gray-900 font-semibold rounded-lg hover:bg-gray-100 transition-colors">
            Continue with Google
          </button>
          <button className="px-4 py-3 bg-[#5865F2] text-white font-semibold rounded-lg hover:bg-[#4752C4] transition-colors">
            Continue with Discord
          </button>
          <div className="my-2 border-t border-gray-600" />
          <button className="px-4 py-3 border border-gray-600 text-gray-300 font-semibold rounded-lg hover:border-gray-400 transition-colors">
            Play as Guest
          </button>
        </div>
      </div>
    </div>
  );
}

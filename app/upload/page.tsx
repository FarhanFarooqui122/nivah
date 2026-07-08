export default function UploadPage() {
  return (
    <div className="min-h-screen bg-black text-white p-10">
      <div className="max-w-xl mx-auto border border-zinc-800 rounded-xl p-8">
        <h1 className="text-3xl font-bold mb-6">
          Upload Document 📄
        </h1>

        <label className="flex flex-col items-center justify-center h-56 border-2 border-dashed border-zinc-700 rounded-xl cursor-pointer hover:border-green-500 transition">
          <span className="text-lg">
            Click to choose a file
          </span>

          <span className="text-zinc-400 mt-2">
            PDF, DOCX, TXT
          </span>

          <input
            type="file"
            className="hidden"
          />
        </label>
      </div>
    </div>
  );
}
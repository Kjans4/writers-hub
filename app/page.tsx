"use client"; // Required to see logs in the browser console

import Image from "next/image";

export default function Home() {
  // This will print in your browser F12 console
  console.log("Supabase URL:", process.env.NEXT_PUBLIC_SUPABASE_URL);
  console.log("Supabase Key Loaded:", !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex flex-1 w-full max-w-3xl flex-col items-center justify-between py-32 px-16 bg-white dark:bg-black sm:items-start">
        <Image
          className="dark:invert"
          src="/next.svg"
          alt="Next.js logo"
          width={100}
          height={20}
          priority
        />
        <div className="flex flex-col items-center gap-6 text-center sm:items-start sm:text-left">
          <h1 className="max-w-xs text-3xl font-semibold leading-10 tracking-tight text-black dark:text-zinc-50">
            Writers Hub is connecting...
          </h1>
          <p className="max-w-md text-lg leading-8 text-zinc-600 dark:text-zinc-400">
            Check your <strong>Browser Console (F12)</strong>. If you see your Supabase URL, the connection is ready for Step 4!
          </p>
        </div>
        
        {/* Connection Status Badge */}
        <div className="mt-4 p-2 bg-green-100 text-green-800 text-xs rounded border border-green-200">
          Environment Check: {process.env.NEXT_PUBLIC_SUPABASE_URL ? "✅ URL Found" : "❌ URL Missing"}
        </div>
      </main>
    </div>
  );
}
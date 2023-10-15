"use client";
import Player from "@/components/Player";
import { Music } from "@/data.js";

export default function Home() {
  return (
    <div className="flex items-center justify-center h-[100vh]">
      <Player tracks={Music} />
      {/* start with the first track */}
    </div>
  );
}

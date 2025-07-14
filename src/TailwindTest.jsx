import React, { useEffect } from "react";

export default function TailwindTest() {
  useEffect(() => {
    // Check if Tailwind utility class is present in computed styles
    const el = document.getElementById("tw-test-box");
    if (el) {
      const style = window.getComputedStyle(el);
      console.log(
        "[TailwindTest] bg-blue-500 background-color:",
        style.backgroundColor
      );
      console.log("[TailwindTest] text-white color:", style.color);
      if (style.backgroundColor === "rgb(59, 130, 246)") {
        console.log("[TailwindTest] Tailwind bg-blue-500 is working!");
      } else {
        console.warn("[TailwindTest] Tailwind bg-blue-500 is NOT applied!");
      }
    }
  }, []);

  return (
    <div className="p-4">
      <div
        id="tw-test-box"
        className="bg-blue-500 text-white p-4 rounded shadow-lg"
      >
        Tailwind Test Box
      </div>
      <div className="mt-2 text-xs text-gray-500">
        Check the console for Tailwind CSS test results.
      </div>
    </div>
  );
}

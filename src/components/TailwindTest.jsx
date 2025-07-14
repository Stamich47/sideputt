import React, { useEffect } from "react";

export default function TailwindTest() {
  useEffect(() => {
    const el = document.getElementById("tailwind-test-box");
    if (el) {
      const style = window.getComputedStyle(el);
      console.log("[TailwindTest] classList:", el.classList.value);
      console.log(
        "[TailwindTest] bg-blue-500 background-color:",
        style.backgroundColor
      );
      console.log("[TailwindTest] text-white color:", style.color);
      console.log("[TailwindTest] font-size:", style.fontSize);
      console.log("[TailwindTest] border-radius:", style.borderRadius);
      console.log("[TailwindTest] box-shadow:", style.boxShadow);
      if (style.backgroundColor === "rgb(59, 130, 246)") {
        console.log("[TailwindTest] Tailwind bg-blue-500 is working!");
      } else {
        console.warn("[TailwindTest] Tailwind bg-blue-500 is NOT applied!");
      }
      if (style.color === "rgb(255, 255, 255)") {
        console.log("[TailwindTest] Tailwind text-white is working!");
      } else {
        console.warn("[TailwindTest] Tailwind text-white is NOT applied!");
      }
      if (parseFloat(style.fontSize) >= 16) {
        console.log(
          "[TailwindTest] Tailwind base font size is likely working!"
        );
      }
      if (parseFloat(style.borderRadius) > 0) {
        console.log("[TailwindTest] Tailwind rounded is working!");
      }
      if (style.boxShadow && style.boxShadow !== "none") {
        console.log("[TailwindTest] Tailwind shadow-lg is working!");
      }
    } else {
      console.warn("[TailwindTest] Test element not found!");
    }
  }, []);

  return (
    <div
      id="tailwind-test-box"
      className="bg-blue-500 text-white p-8 rounded-xl shadow-lg text-center mt-8"
    >
      <h2 className="text-4xl font-bold mb-4">Tailwind Test</h2>
      <p className="text-lg">
        If you see a blue box with white text, Tailwind is working!
      </p>
      <div className="mt-2 text-xs text-gray-500">
        Check the console for Tailwind CSS test results.
      </div>
    </div>
  );
}

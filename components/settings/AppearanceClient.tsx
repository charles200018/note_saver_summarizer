"use client";

import { useEffect, useState } from "react";

const accentColors = [
  { name: "Reserve Gold", value: "#c9a46c" },
  { name: "Light Gold", value: "#e7cfa1" },
  { name: "Bronze", value: "#b78952" },
  { name: "Copper", value: "#9a633d" },
  { name: "Espresso", value: "#7a4d2a" },
];

const themes = [
  { name: "Reserve Noir", value: "reserve" },
  { name: "Espresso Luxe", value: "espresso" },
  { name: "Bronze Velvet", value: "bronze" },
];

export function AppearanceClient() {
  const [accent, setAccent] = useState(accentColors[0].value);
  const [theme, setTheme] = useState(themes[0].value);

  useEffect(() => {
    // Load from localStorage only if value differs
    const storedAccent = localStorage.getItem("accentColor");
    const storedTheme = localStorage.getItem("theme");
    if (storedAccent && storedAccent !== accent) setAccent(storedAccent);
    if (storedTheme && storedTheme !== theme) setTheme(storedTheme);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // Save to localStorage
    localStorage.setItem("accentColor", accent);
    localStorage.setItem("theme", theme);
    // Set CSS variable
    document.documentElement.style.setProperty("--color-accent", accent);
  }, [accent, theme]);

  return (
    <div className="grid gap-4">
      <div className="flex items-center justify-between rounded-xl border border-[#3a2617] bg-[#120b08]/75 p-4">
        <div>
          <p className="font-medium text-[#f5e6d3]">Theme</p>
          <p className="text-sm text-[#b69b79]">Choose your preferred luxury mood</p>
        </div>
        <select
          className="rounded-lg border border-[#3a2617] bg-[#17100c] px-4 py-2 text-[#f5e6d3] focus:border-[#c9a46c]/50 focus:outline-none"
          value={theme}
          onChange={e => setTheme(e.target.value)}
        >
          {themes.map(t => (
            <option key={t.value} value={t.value}>{t.name}</option>
          ))}
        </select>
      </div>

      <div className="flex items-center justify-between rounded-xl border border-[#3a2617] bg-[#120b08]/75 p-4">
        <div>
          <p className="font-medium text-[#f5e6d3]">Accent Color</p>
          <p className="text-sm text-[#b69b79]">Customize the metallic finish</p>
        </div>
        <div className="flex gap-2">
          {accentColors.map(c => (
            <button
              key={c.value}
              className={`h-8 w-8 rounded-full border-2 ${accent === c.value ? "ring-2 ring-offset-2 ring-[var(--color-accent)] ring-offset-[#120b08] border-[var(--color-accent)]" : "border-[#4a3220]"}`}
              style={{ background: c.value }}
              onClick={() => setAccent(c.value)}
              aria-label={c.name}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default AppearanceClient;

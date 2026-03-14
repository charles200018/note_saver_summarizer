"use client";

import { useEffect, useState } from "react";

const accentColors = [
  { name: "Cobalt", value: "#2563eb" },
  { name: "Royal Blue", value: "#1d4ed8" },
  { name: "Pink", value: "#ec4899" },
  { name: "Blue", value: "#3b82f6" },
  { name: "Orange", value: "#f59e42" },
  { name: "Red", value: "#ef4444" },
  { name: "Green", value: "#10b981" },
  { name: "Teal", value: "#14b8a6" },
  { name: "Gold", value: "#eab308" },
];

const themes = [
  { name: "Enterprise Dark", value: "dark" },
  { name: "Midnight Cobalt", value: "midnight" },
  { name: "Graphite Blue", value: "royal" },
  { name: "Light", value: "light" },
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
      <div className="flex items-center justify-between p-4 rounded-xl bg-[#0a0a0f]/50 border border-[#2a2a38]">
        <div>
          <p className="text-[#e4e4e7] font-medium">Theme</p>
          <p className="text-sm text-[#6b6560]">Choose your preferred color scheme</p>
        </div>
        <select
          className="px-4 py-2 rounded-lg bg-[#111118] border border-[#2a2a38] text-[#e4e4e7] focus:border-[#2563eb]/50 focus:outline-none"
          value={theme}
          onChange={e => setTheme(e.target.value)}
        >
          {themes.map(t => (
            <option key={t.value} value={t.value}>{t.name}</option>
          ))}
        </select>
      </div>

      <div className="flex items-center justify-between p-4 rounded-xl bg-[#0a0a0f]/50 border border-[#2a2a38]">
        <div>
          <p className="text-[#e4e4e7] font-medium">Accent Color</p>
          <p className="text-sm text-[#6b6560]">Customize the accent color</p>
        </div>
        <div className="flex gap-2">
          {accentColors.map(c => (
            <button
              key={c.value}
              className={`w-8 h-8 rounded-full border-2 ${accent === c.value ? "ring-2 ring-offset-2 ring-[var(--color-accent)] border-[var(--color-accent)]" : "border-[#2a2a38]"}`}
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

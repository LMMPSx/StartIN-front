import React from "react";

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <div className="relative flex h-9 w-9 shrink-0 items-center justify-center">
        <img
          src="/icons/rocket-icon.png"
          alt="StartIn"
          className="h-full w-full object-contain"
        />
      </div>
      <div>
        <div className="text-[20px] font-black tracking-[-.04em] text-[#111827] leading-none flex items-center">
          <span>Start</span>
          <span className="text-[#FEC908]">In</span>
        </div>
        {!compact && (
          <div className="mt-0.5 max-w-[140px] text-[9.5px] leading-3 text-[#64748b] font-medium">
            Oportunidades que combinam com sua startup.
          </div>
        )}
      </div>
    </div>
  );
}

export function OrbitMark() {
  return (
    <div className="relative flex items-center justify-start max-w-[160px]">
      <img
        src="/icons/startin-logo-transparent.png"
        alt="StartIn Marca Oficial"
        className="w-full h-auto object-contain"
      />
    </div>
  );
}

export function StartInBrandHero() {
  return (
    <div className="flex flex-col items-start gap-4">
      <div className="max-w-[180px]">
        <img
          src="/icons/startin-logo-transparent.png"
          alt="StartIn"
          className="w-full h-auto object-contain"
        />
      </div>
    </div>
  );
}

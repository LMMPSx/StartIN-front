import { Rocket } from "./AppIcons";

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-start gap-2">
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#ffd43b] text-[#052e5f]">
        <Rocket size={18} fill="currentColor" />
      </div>
      <div>
        <div className="text-[19px] font-extrabold tracking-[-.06em] text-[#062f61]">STARTIN</div>
        {!compact && (
          <div className="mt-0.5 max-w-[135px] text-[10px] leading-3 text-[#68717d]">
            Oportunidades que combinam com sua startup.
          </div>
        )}
      </div>
    </div>
  );
}

export function OrbitMark() {
  return (
    <div className="relative flex h-24 w-24 items-center justify-center">
      <div className="absolute inset-1 rounded-full border border-[#ffd43b]/70 rotate-[-24deg]" />
      <div className="absolute inset-4 rounded-full border border-[#ffd43b]/40 rotate-[30deg]" />
      <div className="relative flex h-11 w-11 items-center justify-center rounded-2xl bg-[#ffd43b] text-[#062f61] rotate-[-18deg]">
        <Rocket size={22} fill="currentColor" />
      </div>
    </div>
  );
}

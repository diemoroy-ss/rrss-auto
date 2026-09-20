"use client";

import { format } from "date-fns";
import { es } from "date-fns/locale";
import { isSameDay } from "date-fns";
import NetworkIcon from "./NetworkIcon";
import { SocialPost } from "../../types/dashboard";

interface PostFiltersProps {
  networkFilter: string;
  setNetworkFilter: (net: string) => void;
  selectedDateFilter: Date | null;
  setSelectedDateFilter: (d: Date | null) => void;
  isCalendarOpen: boolean;
  setIsCalendarOpen: (open: boolean) => void;
  currentMonth: Date;
  nextMonth: () => void;
  prevMonth: () => void;
  daysInMonth: Date[];
  startDayIndex: number;
  getDotsForDate: (date: Date) => { color: string; title: string }[];
}

/**
 * PostFilters
 * Barra de filtros de red social + calendario desplegable.
 */
export default function PostFilters({
  networkFilter,
  setNetworkFilter,
  selectedDateFilter,
  setSelectedDateFilter,
  isCalendarOpen,
  setIsCalendarOpen,
  currentMonth,
  nextMonth,
  prevMonth,
  daysInMonth,
  startDayIndex,
  getDotsForDate,
}: PostFiltersProps) {
  const networks = ["all", "instagram", "facebook", "linkedin", "tiktok", "youtube", "x", "googleBusiness", "blog"];

  return (
    <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-8 bg-white p-5 rounded-[24px] border border-slate-200 shadow-sm">
      {/* Network filter pills */}
      <div className="flex flex-col gap-4">
        <div>
          <div className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">
            Seleccionar RRSS filtro
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {networks.map((net) => (
              <button
                key={net}
                onClick={() => setNetworkFilter(net)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 border shadow-sm ${
                  networkFilter === net
                    ? "bg-slate-900 text-white border-slate-900"
                    : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:border-slate-300"
                }`}
              >
                {net === "all" ? (
                  <span>🌐 Todos</span>
                ) : (
                  <NetworkIcon network={net} postId={`filter-${net}`} />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Calendar dropdown */}
      <div className="relative w-full lg:w-auto">
        <button
          onClick={() => setIsCalendarOpen(!isCalendarOpen)}
          className="flex items-center justify-between gap-3 bg-white border border-slate-200 px-5 py-3 rounded-xl font-bold text-sm text-slate-700 shadow-sm hover:bg-slate-50 transition-all w-full lg:w-48"
        >
          <span>
            {selectedDateFilter
              ? format(selectedDateFilter, "d 'de' MMMM", { locale: es })
              : "CALENDARIO"}
          </span>
          <span className="text-slate-400">📅</span>
        </button>

        {isCalendarOpen && (
          <div className="absolute right-0 top-full mt-2 w-full lg:w-[320px] bg-white rounded-[24px] p-5 shadow-2xl border border-slate-100 z-50 animate-in fade-in zoom-in-95 duration-200">
            {/* Month nav */}
            <div className="flex justify-between items-center mb-4 px-1">
              <h3 className="text-sm font-black text-slate-900 capitalize tracking-tight flex items-center gap-2">
                <span className="w-6 h-6 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center text-[10px] shadow-sm">
                  🗓️
                </span>
                {format(currentMonth, "MMM yyyy", { locale: es })}
              </h3>
              <div className="flex gap-1">
                <button
                  onClick={prevMonth}
                  className="w-6 h-6 rounded flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 font-bold transition-all text-sm"
                >
                  &lt;
                </button>
                <button
                  onClick={nextMonth}
                  className="w-6 h-6 rounded flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 font-bold transition-all text-sm"
                >
                  &gt;
                </button>
              </div>
            </div>

            {/* Day grid */}
            <div className="grid grid-cols-7 gap-1">
              {["Do", "Lu", "Ma", "Mi", "Ju", "Vi", "Sá"].map((d) => (
                <div
                  key={d}
                  className="text-center text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1"
                >
                  {d}
                </div>
              ))}
              {Array.from({ length: startDayIndex }).map((_, i) => (
                <div key={`empty-${i}`} aria-hidden="true" className="h-8" />
              ))}
              {daysInMonth.map((day, i) => {
                const dots = getDotsForDate(day);
                const isToday = isSameDay(day, new Date());
                const hasPosts = dots.length > 0;
                const isSelected = selectedDateFilter && isSameDay(day, selectedDateFilter);

                return (
                  <div
                    key={i}
                    onClick={() => {
                      setSelectedDateFilter(isSelected ? null : day);
                      setIsCalendarOpen(false);
                    }}
                    className={`h-9 rounded-lg border flex flex-col items-center justify-center p-0.5 transition-all cursor-pointer ${
                      isSelected
                        ? "bg-indigo-600 border-indigo-600 shadow-md transform scale-105"
                        : isToday
                        ? "bg-indigo-50 border-indigo-200 shadow-inner hover:bg-indigo-100 text-indigo-600"
                        : hasPosts
                        ? "bg-white border-slate-200 hover:border-indigo-300 hover:shadow-sm"
                        : "bg-slate-50/50 border-transparent hover:bg-slate-100"
                    }`}
                  >
                    <span
                      className={`text-[11px] font-bold ${
                        isSelected
                          ? "text-white"
                          : isToday
                          ? "text-indigo-600"
                          : hasPosts
                          ? "text-slate-900"
                          : "text-slate-400"
                      }`}
                    >
                      {format(day, "d")}
                    </span>
                    <div className="flex flex-wrap justify-center gap-[2px] mt-0.5 w-full">
                      {dots.slice(0, 3).map((dot, idx) => (
                        <div
                          key={idx}
                          aria-hidden="true"
                          className={`w-1.5 h-1.5 rounded-full ${isSelected ? "bg-white" : dot.color} shadow-sm`}
                          title={dot.title}
                        />
                      ))}
                      {dots.length > 3 && (
                        <span
                          aria-hidden="true"
                          className={`text-[6px] font-black leading-none ${isSelected ? "text-indigo-200" : "text-slate-400"}`}
                        >
                          +
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Legend */}
            <div className="mt-4 flex flex-wrap items-center justify-center gap-3 border-t border-slate-100 pt-3">
              {[
                { color: "bg-pink-500", label: "Reel" },
                { color: "bg-purple-500", label: "Carrusel" },
                { color: "bg-blue-500", label: "Post" },
                { color: "bg-amber-500", label: "Story" },
              ].map(({ color, label }) => (
                <div key={label} className="flex items-center gap-1.5 text-[8px] font-black uppercase tracking-widest text-slate-500">
                  <div aria-hidden="true" className={`w-1.5 h-1.5 rounded-full ${color}`} />
                  {label}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

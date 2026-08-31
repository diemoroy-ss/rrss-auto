"use client";

import React from "react";
import { FaTiktok, FaLock, FaGlobeAmericas, FaUserFriends, FaUsers, FaComments, FaUserPlus, FaCut, FaCheckCircle, FaRobot, FaBriefcase, FaHandshake } from "react-icons/fa";

export interface TikTokSettingsState {
  privacyLevel: "PUBLIC_TO_EVERYONE" | "MUTUAL_FOLLOW_FRIENDS" | "FOLLOWER_OF_CREATOR" | "SELF_ONLY";
  allowComment: boolean;
  allowDuet: boolean;
  allowStitch: boolean;
  contentDisclosure: boolean;
  yourBrand: boolean;
  brandedContent: boolean;
  isAigc: boolean;
}

export const DEFAULT_TIKTOK_SETTINGS: TikTokSettingsState = {
  privacyLevel: "PUBLIC_TO_EVERYONE",
  allowComment: true,
  allowDuet: true,
  allowStitch: true,
  contentDisclosure: false,
  yourBrand: false,
  brandedContent: false,
  isAigc: false,
};

interface TikTokPostSettingsProps {
  settings: TikTokSettingsState;
  onChange: (newSettings: TikTokSettingsState) => void;
  isDefaultConfig?: boolean;
}

export default function TikTokPostSettings({
  settings,
  onChange,
  isDefaultConfig = false,
}: TikTokPostSettingsProps) {
  const updateSetting = <K extends keyof TikTokSettingsState>(
    key: K,
    value: TikTokSettingsState[K]
  ) => {
    onChange({
      ...settings,
      [key]: value,
    });
  };

  const privacyOptions = [
    {
      id: "PUBLIC_TO_EVERYONE",
      label: "Público (Todos)",
      desc: "Cualquier persona en TikTok puede ver tu video.",
      icon: <FaGlobeAmericas className="text-emerald-500" />,
    },
    {
      id: "MUTUAL_FOLLOW_FRIENDS",
      label: "Amigos",
      desc: "Seguidores que también sigues mutuamente.",
      icon: <FaUserFriends className="text-blue-500" />,
    },
    {
      id: "FOLLOWER_OF_CREATOR",
      label: "Solo Seguidores",
      desc: "Únicamente las personas que te siguen.",
      icon: <FaUsers className="text-violet-500" />,
    },
    {
      id: "SELF_ONLY",
      label: "Solo Yo (Privado)",
      desc: "Solo tú puedes ver el video en tu perfil.",
      icon: <FaLock className="text-rose-500" />,
    },
  ];

  return (
    <div className="bg-white text-slate-800 rounded-2xl p-5 border border-slate-200 shadow-sm space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-slate-900 flex items-center justify-center text-white shadow-sm">
            <FaTiktok className="text-base text-cyan-300" />
          </div>
          <div>
            <h4 className="text-sm font-black tracking-wide text-slate-900 flex items-center gap-2">
              Configuración de TikTok
              <span className="text-[10px] bg-cyan-50 text-cyan-700 font-bold px-2 py-0.5 rounded-md border border-cyan-200">
                Direct Post API
              </span>
            </h4>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              {isDefaultConfig
                ? "Valores predeterminados aplicados a todas tus publicaciones en TikTok"
                : "Ajustes de privacidad, interacción y divulgación para esta publicación"}
            </p>
          </div>
        </div>
      </div>

      {/* 1. Privacy Settings */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-[11px] font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
            <span>👁️</span> ¿Quién puede ver este video?
          </label>
          <span className="text-[11px] font-bold text-slate-500">
            {privacyOptions.find((o) => o.id === settings.privacyLevel)?.label}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {privacyOptions.map((opt) => {
            const isSelected = settings.privacyLevel === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => updateSetting("privacyLevel", opt.id as any)}
                className={`p-3.5 rounded-xl border text-left transition-all flex items-start gap-3 ${
                  isSelected
                    ? "bg-cyan-50/70 border-cyan-500 text-slate-900 shadow-sm ring-1 ring-cyan-500/20"
                    : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                <span className="text-base mt-0.5">{opt.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold text-slate-900 flex items-center justify-between">
                    <span>{opt.label}</span>
                    {isSelected && <FaCheckCircle className="text-cyan-600 text-xs shrink-0" />}
                  </div>
                  <p className="text-[11px] text-slate-500 leading-tight mt-0.5">
                    {opt.desc}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Interaction Settings */}
      <div className="space-y-3 pt-3 border-t border-slate-100">
        <label className="text-[11px] font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
          <span>💬</span> Permisos de Interacción
        </label>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {/* Allow Comments */}
          <button
            type="button"
            onClick={() => updateSetting("allowComment", !settings.allowComment)}
            className={`p-3 rounded-xl border flex items-center justify-between transition-all ${
              settings.allowComment
                ? "bg-white border-slate-300 text-slate-900 shadow-sm"
                : "bg-slate-50 border-slate-200 text-slate-400"
            }`}
          >
            <div className="flex items-center gap-2 text-xs font-bold">
              <FaComments className={settings.allowComment ? "text-cyan-600" : "text-slate-400"} />
              <span>Comentarios</span>
            </div>
            <div
              className={`w-9 h-5 rounded-full p-0.5 transition-colors ${
                settings.allowComment ? "bg-cyan-500" : "bg-slate-300"
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${
                  settings.allowComment ? "translate-x-4" : "translate-x-0"
                }`}
              />
            </div>
          </button>

          {/* Allow Duet */}
          <button
            type="button"
            onClick={() => updateSetting("allowDuet", !settings.allowDuet)}
            className={`p-3 rounded-xl border flex items-center justify-between transition-all ${
              settings.allowDuet
                ? "bg-white border-slate-300 text-slate-900 shadow-sm"
                : "bg-slate-50 border-slate-200 text-slate-400"
            }`}
          >
            <div className="flex items-center gap-2 text-xs font-bold">
              <FaUserPlus className={settings.allowDuet ? "text-cyan-600" : "text-slate-400"} />
              <span>Dúos</span>
            </div>
            <div
              className={`w-9 h-5 rounded-full p-0.5 transition-colors ${
                settings.allowDuet ? "bg-cyan-500" : "bg-slate-300"
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${
                  settings.allowDuet ? "translate-x-4" : "translate-x-0"
                }`}
              />
            </div>
          </button>

          {/* Allow Stitch */}
          <button
            type="button"
            onClick={() => updateSetting("allowStitch", !settings.allowStitch)}
            className={`p-3 rounded-xl border flex items-center justify-between transition-all ${
              settings.allowStitch
                ? "bg-white border-slate-300 text-slate-900 shadow-sm"
                : "bg-slate-50 border-slate-200 text-slate-400"
            }`}
          >
            <div className="flex items-center gap-2 text-xs font-bold">
              <FaCut className={settings.allowStitch ? "text-cyan-600" : "text-slate-400"} />
              <span>Pegar (Stitch)</span>
            </div>
            <div
              className={`w-9 h-5 rounded-full p-0.5 transition-colors ${
                settings.allowStitch ? "bg-cyan-500" : "bg-slate-300"
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${
                  settings.allowStitch ? "translate-x-4" : "translate-x-0"
                }`}
              />
            </div>
          </button>
        </div>
      </div>

      {/* 3. Content Disclosure Setting */}
      <div className="space-y-3 pt-3 border-t border-slate-100">
        <div className="flex items-center justify-between">
          <div>
            <label className="text-[11px] font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <span>📢</span> Divulgación de Contenido (Content Disclosure)
            </label>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Declara si este video incluye contenido comercial o fue generado con agentes / IA.
            </p>
          </div>
          <button
            type="button"
            onClick={() => updateSetting("contentDisclosure", !settings.contentDisclosure)}
            className={`w-10 h-6 rounded-full p-0.5 transition-colors shrink-0 ${
              settings.contentDisclosure ? "bg-cyan-500" : "bg-slate-300"
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
                settings.contentDisclosure ? "translate-x-4" : "translate-x-0"
              }`}
            />
          </button>
        </div>

        {settings.contentDisclosure && (
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
            <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block mb-1">
              Selecciona las opciones que aplican a este video:
            </span>

            {/* Your brand */}
            <label className="flex items-start gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={settings.yourBrand}
                onChange={(e) => updateSetting("yourBrand", e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded text-cyan-600 bg-white border-slate-300 focus:ring-cyan-500"
              />
              <div className="text-xs">
                <span className="font-bold text-slate-900 flex items-center gap-1.5">
                  <FaBriefcase className="text-amber-500 text-[11px]" />
                  Tu propia marca o negocio
                </span>
                <p className="text-[11px] text-slate-500 leading-tight">
                  Estás promocionando tu propio producto, negocio o servicio.
                </p>
              </div>
            </label>

            {/* Branded content */}
            <label className="flex items-start gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={settings.brandedContent}
                onChange={(e) => updateSetting("brandedContent", e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded text-cyan-600 bg-white border-slate-300 focus:ring-cyan-500"
              />
              <div className="text-xs">
                <span className="font-bold text-slate-900 flex items-center gap-1.5">
                  <FaHandshake className="text-emerald-600 text-[11px]" />
                  Contenido patrocinado / Branded Content
                </span>
                <p className="text-[11px] text-slate-500 leading-tight">
                  Estás promocionando un tercero a cambio de pago u otra compensación.
                </p>
              </div>
            </label>

            {/* AI-Generated Content */}
            <label className="flex items-start gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={settings.isAigc}
                onChange={(e) => updateSetting("isAigc", e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded text-cyan-600 bg-white border-slate-300 focus:ring-cyan-500"
              />
              <div className="text-xs">
                <span className="font-bold text-slate-900 flex items-center gap-1.5">
                  <FaRobot className="text-indigo-600 text-[11px]" />
                  Contenido generado por IA / Agentes
                </span>
                <p className="text-[11px] text-slate-500 leading-tight">
                  Añade una etiqueta de divulgación indicando que el contenido fue creado con asistencia de agentes de IA.
                </p>
              </div>
            </label>
          </div>
        )}
      </div>
    </div>
  );
}

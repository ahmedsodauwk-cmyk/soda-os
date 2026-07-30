import {
  REDUCED_MOTION_COOKIE,
  REDUCED_MOTION_STORAGE_KEY,
  effectiveReducedMotion,
  parseReducedMotion,
  type ReducedMotionPreference,
} from "@/lib/preferences/config";

/** Inline script — apply reduced-motion preference before paint. */
export function reducedMotionBootScript(
  cookieName = REDUCED_MOTION_COOKIE
): string {
  return `(function(){try{var c="${cookieName}=";var m=document.cookie.split(";").map(function(s){return s.trim()}).find(function(s){return s.indexOf(c)===0});var p=m?decodeURIComponent(m.slice(c.length)):null;if(p!=="reduce"&&p!=="no-preference"&&p!=="system"){try{p=localStorage.getItem("${REDUCED_MOTION_STORAGE_KEY}")}catch(e){p=null}}if(p!=="reduce"&&p!=="no-preference"&&p!=="system")p="system";var sys=window.matchMedia("(prefers-reduced-motion: reduce)").matches;var reduce=p==="reduce"||(p==="system"&&sys);document.documentElement.dataset.sodaReducedMotion=p;document.documentElement.classList.toggle("soda-reduce-motion",reduce);document.documentElement.classList.toggle("soda-full-motion",p==="no-preference");}catch(e){}})();`;
}

export function resolveReducedMotionClasses(
  preference: ReducedMotionPreference,
  systemReduced: boolean
): { dataValue: ReducedMotionPreference; reduceClass: boolean; fullClass: boolean } {
  const reduce = effectiveReducedMotion(preference, systemReduced);
  return {
    dataValue: preference,
    reduceClass: reduce,
    fullClass: preference === "no-preference",
  };
}

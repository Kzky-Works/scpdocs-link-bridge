(() => {
  "use strict";

  const ROUTER_ORIGIN = "https://scpdocs.link";
  const ROUTE_ID = /^[0-9a-f]{24}$/;
  const LANGUAGE_MAP = {
    en: "EN", es: "ES", fr: "FR", ja: "JP", ko: "KO",
    pl: "PL", ru: "RU", zh: "CN", th: "TH", de: "DE",
    it: "IT", pt: "PT/BR", vi: "VN", cs: "CS"
  };
  const LANGUAGE_ORDER = [
    "EN", "ES", "FR", "JP", "KO", "PL", "RU", "CN", "TH", "DE",
    "IT", "PT/BR", "VN", "CS", "ZH-TR"
  ];
  const ALLOWED_HOSTS = new Set([
    "scp-wiki.wikidot.com", "scp-int.wikidot.com", "lafundacionscp.wikidot.com",
    "fondationscp.wikidot.com", "scp-jp.wikidot.com", "scpko.wikidot.com",
    "scp-pl.wikidot.com", "scpfoundation.net", "scp-ru.wikidot.com",
    "scp-wiki-cn.wikidot.com", "scp-th.wikidot.com", "scp-wiki-de.wikidot.com",
    "fondazionescp.wikidot.com", "scp-pt-br.wikidot.com", "scp-vn.wikidot.com",
    "scp-cs.wikidot.com", "scp-zh-tr.wikidot.com"
  ]);

  const status = document.querySelector("#status");
  const detail = document.querySelector("#detail");
  const appLink = document.querySelector("#open-app");
  const webLink = document.querySelector("#open-web");
  const languages = document.querySelector("#languages");
  const languageLinks = document.querySelector("#language-links");

  function decodeSource(value) {
    if (!value) return null;
    try {
      const base64 = value.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(value.length / 4) * 4, "=");
      return decodeURIComponent(Array.from(atob(base64), character => (
        `%${character.charCodeAt(0).toString(16).padStart(2, "0")}`
      )).join(""));
    } catch (_) {
      return null;
    }
  }

  function safeURL(raw) {
    try {
      const url = new URL(raw);
      const host = url.hostname.toLowerCase().replace(/^www\./, "");
      if (!["http:", "https:"].includes(url.protocol) || !ALLOWED_HOSTS.has(host)) return null;
      return url.href;
    } catch (_) {
      return null;
    }
  }

  async function routeIDForURL(raw) {
    const normalized = safeURL(raw);
    if (!normalized) return null;
    const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(normalized));
    return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, "0")).join("").slice(0, 24);
  }

  function browserLanguageCode() {
    const primaryTag = navigator.language || navigator.languages?.[0] || "";
    const normalized = String(primaryTag).toLowerCase().replace(/_/g, "-");
    if (normalized.startsWith("zh-hant") || /^zh-(tw|hk|mo)(-|$)/.test(normalized)) {
      return "ZH-TR";
    }
    return LANGUAGE_MAP[normalized.split("-")[0]] || null;
  }

  function renderLanguages(versions) {
    languageLinks.replaceChildren();
    for (const language of LANGUAGE_ORDER) {
      const target = safeURL(versions[language]);
      if (!target) continue;
      const link = document.createElement("a");
      link.href = target;
      link.textContent = language;
      link.hreflang = language.toLowerCase();
      languageLinks.append(link);
    }
    languages.hidden = languageLinks.childElementCount === 0;
  }

  function universalLink(identifier, encodedSource) {
    const target = new URL("/open/", ROUTER_ORIGIN);
    target.searchParams.set("id", identifier);
    if (encodedSource) target.searchParams.set("source", encodedSource);
    return target.href;
  }

  async function run() {
    const params = new URLSearchParams(window.location.search);
    const identifier = String(params.get("id") || "").toLowerCase();
    if (!ROUTE_ID.test(identifier)) throw new Error("The shared article link is invalid.");

    const encodedSource = params.get("source");
    const decodedSource = safeURL(decodeSource(encodedSource));
    const fallback = decodedSource && await routeIDForURL(decodedSource) === identifier ? decodedSource : null;

    appLink.href = universalLink(identifier, fallback ? encodedSource : null);
    appLink.hidden = false;
    detail.textContent = "Tap the button to open the installed app, or continue on the official wiki.";

    let route = null;
    try {
      const response = await fetch(`${ROUTER_ORIGIN}/routes/${identifier.slice(0, 2)}.json`, { cache: "no-cache" });
      if (response.ok) route = (await response.json()).routes?.[identifier] || null;
      if (route && await routeIDForURL(route.sourceURL) !== identifier) route = null;
    } catch (_) {
      route = null;
    }

    const versions = route?.versions || {};
    const selected = browserLanguageCode();
    const destination = safeURL(selected && versions[selected])
      || safeURL(versions.EN)
      || safeURL(route?.original?.url)
      || fallback;

    renderLanguages(versions);
    if (destination) {
      webLink.href = destination;
      webLink.hidden = false;
    }
  }

  run().catch(error => {
    status.textContent = "Unable to open this link";
    detail.textContent = error.message;
  });
})();

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
  const UI_LANGUAGE_TAGS = {
    EN: "en", ES: "es", FR: "fr", JP: "ja", KO: "ko",
    PL: "pl", RU: "ru", CN: "zh-Hans", TH: "th", DE: "de",
    IT: "it", "PT/BR": "pt-BR", VN: "vi", CS: "cs", "ZH-TR": "zh-Hant"
  };
  const UI_COPY = {
    EN: {
      pageTitle: "Open in SCP docs",
      eyebrow: "SCP docs · ARTICLE LINK",
      heading: "Open this SCP article",
      preparing: "Preparing the article link.",
      instruction: "Tap the button to open the installed app, or continue on the official wiki.",
      openApp: "Open in SCP docs",
      openWeb: "Continue on the official wiki",
      openStore: "Get SCP docs on the App Store",
      availableLanguages: "Available languages",
      unable: "Unable to open this link",
      invalid: "The shared article link is invalid."
    },
    ES: {
      pageTitle: "Abrir en SCP docs",
      eyebrow: "SCP docs · ENLACE DEL ARTÍCULO",
      heading: "Abrir este artículo de SCP",
      preparing: "Preparando el enlace del artículo.",
      instruction: "Toca el botón para abrir la aplicación instalada o continúa en la wiki oficial.",
      openApp: "Abrir en SCP docs",
      openWeb: "Continuar en la wiki oficial",
      openStore: "Descargar SCP docs en App Store",
      availableLanguages: "Idiomas disponibles",
      unable: "No se puede abrir este enlace",
      invalid: "El enlace compartido del artículo no es válido."
    },
    FR: {
      pageTitle: "Ouvrir dans SCP docs",
      eyebrow: "SCP docs · LIEN DE L’ARTICLE",
      heading: "Ouvrir cet article SCP",
      preparing: "Préparation du lien de l’article.",
      instruction: "Touchez le bouton pour ouvrir l’application installée ou continuez sur le wiki officiel.",
      openApp: "Ouvrir dans SCP docs",
      openWeb: "Continuer sur le wiki officiel",
      openStore: "Télécharger SCP docs sur l’App Store",
      availableLanguages: "Langues disponibles",
      unable: "Impossible d’ouvrir ce lien",
      invalid: "Le lien d’article partagé n’est pas valide."
    },
    JP: {
      pageTitle: "SCP docsで開く",
      eyebrow: "SCP docs · 記事リンク",
      heading: "この記事を開く",
      preparing: "記事リンクを準備しています。",
      instruction: "ボタンをタップしてインストール済みのアプリで開くか、公式Wikiで続きを読むことができます。",
      openApp: "SCP docsで開く",
      openWeb: "公式Wikiで続きを読む",
      openStore: "App StoreでSCP docsを入手",
      availableLanguages: "対応している言語",
      unable: "このリンクを開けません",
      invalid: "共有された記事リンクが無効です。"
    },
    KO: {
      pageTitle: "SCP docs에서 열기",
      eyebrow: "SCP docs · 문서 링크",
      heading: "이 SCP 문서 열기",
      preparing: "문서 링크를 준비하고 있습니다.",
      instruction: "버튼을 눌러 설치된 앱에서 열거나 공식 위키에서 계속 읽으세요.",
      openApp: "SCP docs에서 열기",
      openWeb: "공식 위키에서 계속 읽기",
      openStore: "App Store에서 SCP docs 받기",
      availableLanguages: "사용 가능한 언어",
      unable: "이 링크를 열 수 없습니다",
      invalid: "공유된 문서 링크가 올바르지 않습니다."
    },
    PL: {
      pageTitle: "Otwórz w SCP docs",
      eyebrow: "SCP docs · LINK DO ARTYKUŁU",
      heading: "Otwórz ten artykuł SCP",
      preparing: "Przygotowywanie linku do artykułu.",
      instruction: "Naciśnij przycisk, aby otworzyć zainstalowaną aplikację, albo przejdź do oficjalnej wiki.",
      openApp: "Otwórz w SCP docs",
      openWeb: "Przejdź do oficjalnej wiki",
      openStore: "Pobierz SCP docs z App Store",
      availableLanguages: "Dostępne języki",
      unable: "Nie można otworzyć tego linku",
      invalid: "Udostępniony link do artykułu jest nieprawidłowy."
    },
    RU: {
      pageTitle: "Открыть в SCP docs",
      eyebrow: "SCP docs · ССЫЛКА НА СТАТЬЮ",
      heading: "Открыть эту статью SCP",
      preparing: "Подготавливаем ссылку на статью.",
      instruction: "Нажмите кнопку, чтобы открыть установленное приложение, или продолжите чтение на официальной вики.",
      openApp: "Открыть в SCP docs",
      openWeb: "Продолжить на официальной вики",
      openStore: "Загрузить SCP docs в App Store",
      availableLanguages: "Доступные языки",
      unable: "Не удалось открыть эту ссылку",
      invalid: "Ссылка на статью недействительна."
    },
    CN: {
      pageTitle: "在 SCP docs 中打开",
      eyebrow: "SCP docs · 文章链接",
      heading: "打开这篇 SCP 文章",
      preparing: "正在准备文章链接。",
      instruction: "轻触按钮以在已安装的应用中打开，或前往官方维基继续阅读。",
      openApp: "在 SCP docs 中打开",
      openWeb: "前往官方维基继续阅读",
      openStore: "在 App Store 获取 SCP docs",
      availableLanguages: "可用语言",
      unable: "无法打开此链接",
      invalid: "分享的文章链接无效。"
    },
    TH: {
      pageTitle: "เปิดใน SCP docs",
      eyebrow: "SCP docs · ลิงก์บทความ",
      heading: "เปิดบทความ SCP นี้",
      preparing: "กำลังเตรียมลิงก์บทความ",
      instruction: "แตะปุ่มเพื่อเปิดในแอปที่ติดตั้งไว้ หรืออ่านต่อในวิกิอย่างเป็นทางการ",
      openApp: "เปิดใน SCP docs",
      openWeb: "อ่านต่อในวิกิอย่างเป็นทางการ",
      openStore: "ดาวน์โหลด SCP docs จาก App Store",
      availableLanguages: "ภาษาที่มี",
      unable: "ไม่สามารถเปิดลิงก์นี้ได้",
      invalid: "ลิงก์บทความที่แชร์ไม่ถูกต้อง"
    },
    DE: {
      pageTitle: "In SCP docs öffnen",
      eyebrow: "SCP docs · ARTIKELLINK",
      heading: "Diesen SCP-Artikel öffnen",
      preparing: "Artikellink wird vorbereitet.",
      instruction: "Tippe auf die Schaltfläche, um die installierte App zu öffnen, oder lies im offiziellen Wiki weiter.",
      openApp: "In SCP docs öffnen",
      openWeb: "Im offiziellen Wiki weiterlesen",
      openStore: "SCP docs im App Store laden",
      availableLanguages: "Verfügbare Sprachen",
      unable: "Dieser Link kann nicht geöffnet werden",
      invalid: "Der geteilte Artikellink ist ungültig."
    },
    IT: {
      pageTitle: "Apri in SCP docs",
      eyebrow: "SCP docs · LINK ALL’ARTICOLO",
      heading: "Apri questo articolo SCP",
      preparing: "Preparazione del link all’articolo.",
      instruction: "Tocca il pulsante per aprire l’app installata oppure continua sul wiki ufficiale.",
      openApp: "Apri in SCP docs",
      openWeb: "Continua sul wiki ufficiale",
      openStore: "Scarica SCP docs dall’App Store",
      availableLanguages: "Lingue disponibili",
      unable: "Impossibile aprire questo link",
      invalid: "Il link condiviso all’articolo non è valido."
    },
    "PT/BR": {
      pageTitle: "Abrir no SCP docs",
      eyebrow: "SCP docs · LINK DO ARTIGO",
      heading: "Abrir este artigo SCP",
      preparing: "Preparando o link do artigo.",
      instruction: "Toque no botão para abrir o aplicativo instalado ou continue na wiki oficial.",
      openApp: "Abrir no SCP docs",
      openWeb: "Continuar na wiki oficial",
      openStore: "Baixar o SCP docs na App Store",
      availableLanguages: "Idiomas disponíveis",
      unable: "Não foi possível abrir este link",
      invalid: "O link compartilhado do artigo é inválido."
    },
    VN: {
      pageTitle: "Mở trong SCP docs",
      eyebrow: "SCP docs · LIÊN KẾT BÀI VIẾT",
      heading: "Mở bài viết SCP này",
      preparing: "Đang chuẩn bị liên kết bài viết.",
      instruction: "Nhấn nút để mở ứng dụng đã cài đặt hoặc tiếp tục đọc trên wiki chính thức.",
      openApp: "Mở trong SCP docs",
      openWeb: "Tiếp tục trên wiki chính thức",
      openStore: "Tải SCP docs trên App Store",
      availableLanguages: "Ngôn ngữ có sẵn",
      unable: "Không thể mở liên kết này",
      invalid: "Liên kết bài viết được chia sẻ không hợp lệ."
    },
    CS: {
      pageTitle: "Otevřít v SCP docs",
      eyebrow: "SCP docs · ODKAZ NA ČLÁNEK",
      heading: "Otevřít tento článek SCP",
      preparing: "Připravuje se odkaz na článek.",
      instruction: "Klepnutím na tlačítko otevřete nainstalovanou aplikaci nebo pokračujte na oficiální wiki.",
      openApp: "Otevřít v SCP docs",
      openWeb: "Pokračovat na oficiální wiki",
      openStore: "Stáhnout SCP docs z App Store",
      availableLanguages: "Dostupné jazyky",
      unable: "Tento odkaz nelze otevřít",
      invalid: "Sdílený odkaz na článek není platný."
    },
    "ZH-TR": {
      pageTitle: "在 SCP docs 中開啟",
      eyebrow: "SCP docs · 文章連結",
      heading: "開啟這篇 SCP 文章",
      preparing: "正在準備文章連結。",
      instruction: "點按按鈕以在已安裝的應用程式中開啟，或前往官方維基繼續閱讀。",
      openApp: "在 SCP docs 中開啟",
      openWeb: "前往官方維基繼續閱讀",
      openStore: "在 App Store 下載 SCP docs",
      availableLanguages: "可用語言",
      unable: "無法開啟此連結",
      invalid: "分享的文章連結無效。"
    }
  };
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
  const eyebrow = document.querySelector("#eyebrow");
  const appLink = document.querySelector("#open-app");
  const webLink = document.querySelector("#open-web");
  const storeLink = document.querySelector("#open-store");
  const languages = document.querySelector("#languages");
  const languagesTitle = document.querySelector("#languages-title");
  const languageLinks = document.querySelector("#language-links");
  let copy = UI_COPY.EN;

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

  function applyLocalization() {
    const language = browserLanguageCode() || "EN";
    copy = UI_COPY[language] || UI_COPY.EN;
    document.documentElement.lang = UI_LANGUAGE_TAGS[language] || "en";
    document.title = copy.pageTitle;
    eyebrow.textContent = copy.eyebrow;
    status.textContent = copy.heading;
    detail.textContent = copy.preparing;
    appLink.textContent = copy.openApp;
    webLink.textContent = copy.openWeb;
    storeLink.textContent = copy.openStore;
    languagesTitle.textContent = copy.availableLanguages;
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
    if (!ROUTE_ID.test(identifier)) throw new Error(copy.invalid);

    const encodedSource = params.get("source");
    const decodedSource = safeURL(decodeSource(encodedSource));
    const fallback = decodedSource && await routeIDForURL(decodedSource) === identifier ? decodedSource : null;

    appLink.href = universalLink(identifier, fallback ? encodedSource : null);
    appLink.hidden = false;
    detail.textContent = copy.instruction;

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

  applyLocalization();
  run().catch(error => {
    status.textContent = copy.unable;
    detail.textContent = error.message;
  });
})();

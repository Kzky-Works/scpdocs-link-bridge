const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const bridgeSource = fs.readFileSync(path.join(__dirname, "..", "bridge.js"), "utf8");

function encodedSource(value) {
  return Buffer.from(value, "utf8").toString("base64url");
}

async function runBridge({ search, browserLanguages = ["en-US"], route = null }) {
  const elements = new Map();
  for (const id of [
    "status", "detail", "eyebrow", "open-app", "open-web", "open-store",
    "languages", "languages-title", "language-links"
  ]) {
    elements.set(`#${id}`, {
      hidden: true,
      childElementCount: 0,
      children: [],
      replaceChildren() { this.childElementCount = 0; this.children = []; },
      append(child) { this.childElementCount += 1; this.children.push(child); }
    });
  }

  const identifier = new URLSearchParams(search).get("id");
  const document = {
    title: "",
    documentElement: { lang: "en" },
    querySelector(selector) { return elements.get(selector); },
    createElement() { return {}; }
  };
  const sandbox = {
    Array,
    crypto,
    Error,
    Set,
    TextEncoder,
    Uint8Array,
    URL,
    URLSearchParams,
    atob,
    btoa,
    decodeURIComponent,
    document,
    fetch: async () => ({
      ok: true,
      json: async () => ({ routes: route ? { [identifier]: route } : {} })
    }),
    navigator: {
      language: browserLanguages[0],
      languages: browserLanguages
    },
    window: {
      location: {
        href: `https://go.scpdocs.link/${search}`,
        search
      }
    }
  };

  vm.runInNewContext(bridgeSource, sandbox, { filename: "bridge.js" });
  for (let index = 0; index < 100; index += 1) {
    const ready = !elements.get("#open-app").hidden
      && (route === null || !elements.get("#open-web").hidden);
    const failed = !/^[0-9a-f]{24}$/.test(identifier)
      && Boolean(elements.get("#detail").textContent);
    if (ready || failed) break;
    await new Promise(resolve => setTimeout(resolve, 5));
  }
  return { document, elements };
}

test("preserves the signed fallback from an existing long post URL", async () => {
  const id = "a3ecd8849da128f3d092c004";
  const source = encodedSource("https://scp-wiki.wikidot.com/scp-173");
  const { elements } = await runBridge({ search: `?id=${id}&source=${source}` });

  assert.equal(elements.get("#open-app").hidden, false);
  assert.equal(
    elements.get("#open-app").href,
    `https://scpdocs.link/open/?id=${id}&source=${source}`
  );
  assert.equal(elements.get("#open-web").href, "https://scp-wiki.wikidot.com/scp-173");
});

test("reconstructs the app fallback from a verified route for a short post URL", async () => {
  const id = "a3ecd8849da128f3d092c004";
  const sourceURL = "https://scp-wiki.wikidot.com/scp-173";
  const source = encodedSource(sourceURL);
  const { elements } = await runBridge({
    search: `?id=${id}`,
    route: {
      sourceURL,
      original: { language: "EN", url: sourceURL },
      versions: { EN: sourceURL }
    }
  });

  assert.equal(
    elements.get("#open-app").href,
    `https://scpdocs.link/open/?id=${id}&source=${source}`
  );
  assert.equal(elements.get("#open-web").href, sourceURL);
});

test("selects an available official article matching the browser language", async () => {
  const id = "a3ecd8849da128f3d092c004";
  const source = encodedSource("https://scp-wiki.wikidot.com/scp-173");
  const { document, elements } = await runBridge({
    search: `?id=${id}&source=${source}`,
    browserLanguages: ["ja-JP", "en-US"],
    route: {
      sourceURL: "https://scp-wiki.wikidot.com/scp-173",
      original: { language: "EN", url: "https://scp-wiki.wikidot.com/scp-173" },
      versions: {
        EN: "https://scp-wiki.wikidot.com/scp-173",
        JP: "https://scp-jp.wikidot.com/scp-173"
      }
    }
  });

  assert.equal(elements.get("#open-web").href, "https://scp-jp.wikidot.com/scp-173");
  assert.equal(elements.get("#language-links").childElementCount, 2);
  assert.equal(document.documentElement.lang, "ja");
  assert.equal(document.title, "SCP docsで開く");
  assert.equal(elements.get("#open-app").textContent, "SCP docsで開く");
  assert.equal(elements.get("#open-web").textContent, "公式Wikiで続きを読む");
});

test("uses English when the primary browser language is unsupported", async () => {
  const id = "a3ecd8849da128f3d092c004";
  const source = encodedSource("https://scp-wiki.wikidot.com/scp-173");
  const { document, elements } = await runBridge({
    search: `?id=${id}&source=${source}`,
    browserLanguages: ["nl-NL", "ja-JP"],
    route: {
      sourceURL: "https://scp-wiki.wikidot.com/scp-173",
      original: { language: "JP", url: "https://scp-jp.wikidot.com/scp-173" },
      versions: {
        EN: "https://scp-wiki.wikidot.com/scp-173",
        JP: "https://scp-jp.wikidot.com/scp-173"
      }
    }
  });

  assert.equal(elements.get("#open-web").href, "https://scp-wiki.wikidot.com/scp-173");
  assert.equal(document.documentElement.lang, "en");
  assert.equal(elements.get("#status").textContent, "Open this SCP article");
});

test("uses English when the primary language version is unavailable", async () => {
  const id = "a3ecd8849da128f3d092c004";
  const source = encodedSource("https://scp-wiki.wikidot.com/scp-173");
  const { elements } = await runBridge({
    search: `?id=${id}&source=${source}`,
    browserLanguages: ["ja-JP", "fr-FR"],
    route: {
      sourceURL: "https://scp-wiki.wikidot.com/scp-173",
      original: { language: "FR", url: "https://fondationscp.wikidot.com/scp-173" },
      versions: {
        EN: "https://scp-wiki.wikidot.com/scp-173",
        FR: "https://fondationscp.wikidot.com/scp-173"
      }
    }
  });

  assert.equal(elements.get("#open-web").href, "https://scp-wiki.wikidot.com/scp-173");
});

test("uses the original version only when English is unavailable", async () => {
  const id = "a3ecd8849da128f3d092c004";
  const source = encodedSource("https://scp-wiki.wikidot.com/scp-173");
  const { elements } = await runBridge({
    search: `?id=${id}&source=${source}`,
    browserLanguages: ["ja-JP"],
    route: {
      sourceURL: "https://scp-wiki.wikidot.com/scp-173",
      original: { language: "FR", url: "https://fondationscp.wikidot.com/scp-173" },
      versions: {
        FR: "https://fondationscp.wikidot.com/scp-173"
      }
    }
  });

  assert.equal(elements.get("#open-web").href, "https://fondationscp.wikidot.com/scp-173");
});

test("removes a mismatched source fallback before opening the app", async () => {
  const id = "a3ecd8849da128f3d092c004";
  const source = encodedSource("https://scp-wiki.wikidot.com/scp-096");
  const { elements } = await runBridge({ search: `?id=${id}&source=${source}` });

  assert.equal(elements.get("#open-app").href, `https://scpdocs.link/open/?id=${id}`);
  assert.equal(elements.get("#open-web").hidden, true);
});

test("rejects malformed route IDs", async () => {
  const { elements } = await runBridge({ search: "?id=not-a-route" });

  assert.equal(elements.get("#open-app").hidden, true);
  assert.equal(elements.get("#status").textContent, "Unable to open this link");
});

test("uses Traditional Chinese copy for a Traditional Chinese primary locale", async () => {
  const { document, elements } = await runBridge({
    search: "?id=not-a-route",
    browserLanguages: ["zh-TW", "en-US"]
  });

  assert.equal(document.documentElement.lang, "zh-Hant");
  assert.equal(document.title, "在 SCP docs 中開啟");
  assert.equal(elements.get("#status").textContent, "無法開啟此連結");
  assert.equal(elements.get("#detail").textContent, "分享的文章連結無效。");
});

test("localizes the page for every supported primary locale", async () => {
  const cases = [
    ["en-US", "en", "Open in SCP docs"],
    ["es-ES", "es", "Abrir en SCP docs"],
    ["fr-FR", "fr", "Ouvrir dans SCP docs"],
    ["ja-JP", "ja", "SCP docsで開く"],
    ["ko-KR", "ko", "SCP docs에서 열기"],
    ["pl-PL", "pl", "Otwórz w SCP docs"],
    ["ru-RU", "ru", "Открыть в SCP docs"],
    ["zh-CN", "zh-Hans", "在 SCP docs 中打开"],
    ["th-TH", "th", "เปิดใน SCP docs"],
    ["de-DE", "de", "In SCP docs öffnen"],
    ["it-IT", "it", "Apri in SCP docs"],
    ["pt-BR", "pt-BR", "Abrir no SCP docs"],
    ["vi-VN", "vi", "Mở trong SCP docs"],
    ["cs-CZ", "cs", "Otevřít v SCP docs"],
    ["zh-HK", "zh-Hant", "在 SCP docs 中開啟"]
  ];

  for (const [locale, languageTag, title] of cases) {
    const result = await runBridge({
      search: "?id=not-a-route",
      browserLanguages: [locale]
    });
    assert.equal(result.document.documentElement.lang, languageTag);
    assert.equal(result.document.title, title);
  }
});

const additionalVersions = {
  EN: "https://scp-wiki.wikidot.com/scp-173",
  JP: "https://scp-jp.wikidot.com/scp-173",
  IT: "https://fondazionescp.wikidot.com/scp-173",
  PT: "https://scp-pt-br.wikidot.com/scp-173",
  VN: "https://scp-vn.wikidot.com/scp-173",
  CS: "https://scp-cs.wikidot.com/scp-173",
  CN: "https://scp-wiki-cn.wikidot.com/scp-173",
  "ZH-TR": "https://scp-zh-tr.wikidot.com/scp-173",
  TR: "https://scpvakfi.wikidot.com/scp-173",
  ID: "https://scp-id.wikidot.com/scp-173"
};
test("keeps all supplied official versions and selects each added locale without crossing Chinese identities", async () => {
  for (const [locale, code] of [["en-US", "EN"], ["ja-JP", "JP"], ["it-IT", "IT"],
    ["pt-BR", "PT"], ["vi-VN", "VN"], ["cs-CZ", "CS"], ["zh-CN", "CN"],
    ["zh-Hant", "ZH-TR"], ["zh-TW", "ZH-TR"], ["tr-TR", "TR"], ["id-ID", "ID"]]) {
    const result = await runBridge({search: "?id=a3ecd8849da128f3d092c004", browserLanguages: [locale],
      route: {sourceURL: additionalVersions.EN, original: {language: "EN", url: additionalVersions.EN},
        versions: additionalVersions}});
    assert.equal(result.elements.get("#open-web").href, additionalVersions[code], locale);
    const links = result.elements.get("#language-links").children;
    assert.equal(links.length, Object.keys(additionalVersions).length);
    assert.equal(links.find(link => link.textContent === "PT/BR").href, additionalVersions.PT);
    assert.equal(links.find(link => link.textContent === "CN").href, additionalVersions.CN);
    assert.equal(links.find(link => link.textContent === "ZH-TR").href, additionalVersions["ZH-TR"]);
  }
});
test("retains compatibility with legacy PT/BR route keys", async () => {
  const result = await runBridge({search: "?id=a3ecd8849da128f3d092c004", browserLanguages: ["pt-BR"],
    route: {sourceURL: additionalVersions.EN, versions: {"PT/BR": additionalVersions.PT}}});
  assert.equal(result.elements.get("#open-web").href, additionalVersions.PT);
});
test("renders the five supplied SCP-020-IT versions and selects the Italian original", async () => {
  const sourceURL = "https://scp-int.wikidot.com/scp-020-it";
  const originalURL = "https://fondazionescp.wikidot.com/scp-020-it";
  const versions = {EN: sourceURL, IT: originalURL,
    ES: "https://lafundacionscp.wikidot.com/scp-020-it",
    FR: "https://fondationscp.wikidot.com/scp-020-it",
    CN: "https://scp-wiki-cn.wikidot.com/scp-020-it"};
  const result = await runBridge({search: "?id=036e1e5b862dad3c8600d9f4", browserLanguages: ["it-IT"],
    route: {sourceURL, original: {language: "IT", url: originalURL}, versions}});
  assert.equal(result.elements.get("#open-web").href, originalURL);
  const links = result.elements.get("#language-links").children;
  assert.equal(links.length, 5);
  assert.equal(links.find(link => link.textContent === "IT").href, originalURL);
});

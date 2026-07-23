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
  for (const id of ["status", "detail", "open-app", "open-web", "languages", "language-links"]) {
    elements.set(`#${id}`, {
      hidden: true,
      childElementCount: 0,
      replaceChildren() { this.childElementCount = 0; },
      append() { this.childElementCount += 1; }
    });
  }

  const identifier = new URLSearchParams(search).get("id");
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
    decodeURIComponent,
    document: {
      querySelector(selector) { return elements.get(selector); },
      createElement() { return {}; }
    },
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
    const failed = elements.get("#status").textContent === "Unable to open this link";
    if (ready || failed) break;
    await new Promise(resolve => setTimeout(resolve, 5));
  }
  return elements;
}

test("creates a cross-domain HTTPS Universal Link from a valid post URL", async () => {
  const id = "a3ecd8849da128f3d092c004";
  const source = encodedSource("https://scp-wiki.wikidot.com/scp-173");
  const elements = await runBridge({ search: `?id=${id}&source=${source}` });

  assert.equal(elements.get("#open-app").hidden, false);
  assert.equal(
    elements.get("#open-app").href,
    `https://scpdocs.link/open/?id=${id}&source=${source}`
  );
  assert.equal(elements.get("#open-web").href, "https://scp-wiki.wikidot.com/scp-173");
});

test("selects an available official article matching the browser language", async () => {
  const id = "a3ecd8849da128f3d092c004";
  const source = encodedSource("https://scp-wiki.wikidot.com/scp-173");
  const elements = await runBridge({
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
});

test("uses English when the primary browser language is unsupported", async () => {
  const id = "a3ecd8849da128f3d092c004";
  const source = encodedSource("https://scp-wiki.wikidot.com/scp-173");
  const elements = await runBridge({
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
});

test("uses English when the primary language version is unavailable", async () => {
  const id = "a3ecd8849da128f3d092c004";
  const source = encodedSource("https://scp-wiki.wikidot.com/scp-173");
  const elements = await runBridge({
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
  const elements = await runBridge({
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
  const elements = await runBridge({ search: `?id=${id}&source=${source}` });

  assert.equal(elements.get("#open-app").href, `https://scpdocs.link/open/?id=${id}`);
  assert.equal(elements.get("#open-web").hidden, true);
});

test("rejects malformed route IDs", async () => {
  const elements = await runBridge({ search: "?id=not-a-route" });

  assert.equal(elements.get("#open-app").hidden, true);
  assert.equal(elements.get("#status").textContent, "Unable to open this link");
});

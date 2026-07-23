# SCP docs link bridge

Static bridge used by SCP docs article links posted to X.

The post URL is:

```text
https://go.scpdocs.link/?id=<route-id>&source=<base64url-source>
```

The user-initiated `Open in SCP docs` link points to the associated Universal
Link on the separate host:

```text
https://scpdocs.link/open/?id=<route-id>&source=<base64url-source>
```

If the app is installed, iOS can open the requested article in SCP docs. If it
is not installed, the existing web router on `scpdocs.link` preserves the
official Wiki and App Store choices. The bridge does not automatically launch
the app, redirect to the App Store, set cookies, or collect analytics.

## Verification

```sh
node --check bridge.js
node --test tests/bridge_smoke_test.cjs
```

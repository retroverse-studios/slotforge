# RetroVerse Studios integration

**Status: live at https://slotforge.retroverse.studio · repo under retroverse-studios**

SlotForge is a RetroVerse Studios project. The code stays in its own repo, the
same way Virtual Lanes, Karaoke Stage, NUMERON and ASTRON do. Do not fold it into
the `retroverse.studio` site repo: that repo is one HTML document with four CSS
modes, while SlotForge is a TypeScript monorepo with two apps, a 3D view and CI.

## Domain

Do **not** buy a new domain. Use the existing studio domain:

```text
https://slotforge.retroverse.studio
```

This matches every other product subdomain and costs nothing extra. Buy a
standalone domain only if SlotForge later becomes its own brand with its own
support and billing.

### DNS

All product subdomains point at the org Pages host:

```text
virtuallanes.retroverse.studio  CNAME  retroverse-studios.github.io
```

SlotForge follows the same pattern:

```text
slotforge.retroverse.studio  CNAME  retroverse-studios.github.io
```

The record is in Cloudflare, DNS-only. Keep it DNS-only until GitHub has issued
or renewed the certificate. If you enable the orange cloud later, set SSL/TLS to
Full (strict).

### Current settings

- Repo: https://github.com/retroverse-studios/slotforge
- Actions variable: `CUSTOM_DOMAIN=slotforge.retroverse.studio`
- Pages custom domain: `slotforge.retroverse.studio`
- HTTPS: enforced, certificate approved
- Deploy: writes `_site/CNAME` on every run

If the domain changes, update the canonical, OG and Twitter URLs in
`apps/site/index.html`, and the `CUSTOM_DOMAIN` variable.

## Repo transfer

Done. The repo moved from `michael-borck/slotforge` to
`retroverse-studios/slotforge` on 25 November 2026. The old GitHub URLs redirect.

What changed:

- local remote: `git@github.com:retroverse-studios/slotforge.git`
- DNS target: `michael-borck.github.io` to `retroverse-studios.github.io`
- Actions variable and Pages custom domain carried over
- GitHub links in `apps/site/index.html` updated to the org

The custom domain kept the public URL stable. If you ever move it again, add the
new DNS target first, then transfer, then re-check Pages.

## Add it to the studio site

In `retroverse.studio/index.html`, add this card after Virtual Lanes in the
**Tools & Apps** grid. It needs no image and works in all four modes.

```html
<article class="card" data-tool="slotforge">
    <div class="card-body">
        <h3>SlotForge</h3>
        <p>Design AFX-compatible HO slot car tracks with real piece geometry, closure checks, lane lengths, 3D preview and 1:1 build sheets. Then run race night with balanced heats and standings.</p>
        <div class="tags">
            <span class="tag">HO Scale</span>
            <span class="tag">AFX</span>
            <span class="tag">3D</span>
            <span class="tag">PWA</span>
        </div>
        <a href="https://slotforge.retroverse.studio" class="cta" target="_blank" rel="noopener">Visit Site</a>
    </div>
</article>
```

The subdomain is live, so the card can be added now. It is the last optional
step to list SlotForge on the studio site.

## Brand rules

- Say "A RetroVerse Studios project", not "RetroVerse Studios presents".
- Keep the AFX and TOMY disclaimer in the footer.
- The palette is the studio palette: `#0c0c14` background, `#00ff99` accent,
  `#8a2be2` secondary, Press Start 2P for short labels only.
- Long body copy stays in a readable sans. Press Start 2P is a display face, not
  a paragraph face.

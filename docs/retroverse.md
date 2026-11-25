# RetroVerse Studios integration

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

The other product subdomains point at the org Pages host:

```text
virtuallanes.retroverse.studio  CNAME  retroverse-studios.github.io
```

For the current repo (before any transfer):

```text
slotforge  CNAME  michael-borck.github.io
```

If the repo moves to the `retroverse-studios` org, change the target to:

```text
slotforge  CNAME  retroverse-studios.github.io
```

Do not add the CNAME file or the Pages custom domain until the DNS record
resolves. A CNAME in the artifact makes Pages serve only the custom domain, so
the site would be unreachable until DNS is ready.

### Turn it on

1. Add the DNS CNAME at the registrar or DNS host.
2. In the GitHub repo, set an Actions variable:
   `CUSTOM_DOMAIN=slotforge.retroverse.studio`.
3. Re-run the **Deploy Pages** workflow. It writes `_site/CNAME`.
4. In **Settings → Pages**, confirm the custom domain and enable HTTPS.
5. Update the canonical, OG and Twitter URLs in `apps/site/index.html` from
   `https://michael-borck.github.io/slotforge/` to
   `https://slotforge.retroverse.studio/`.

## Move the repo under the org (optional)

All product repos live under `retroverse-studios`. To match:

```bash
gh repo transfer michael-borck/slotforge retroverse-studios
git remote set-url origin git@github.com:retroverse-studios/slotforge.git
```

Then:

- change the DNS CNAME target to `retroverse-studios.github.io`;
- update the GitHub links in `apps/site/index.html`, `README.md` and `docs/`;
- re-run the deploy and re-check Pages.

The custom domain keeps the public URL stable through the transfer. Do the DNS
work first if you want zero downtime.

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

Do this after the subdomain resolves, otherwise the link is broken on the live
studio site.

## Brand rules

- Say "A RetroVerse Studios project", not "RetroVerse Studios presents".
- Keep the AFX and TOMY disclaimer in the footer.
- The palette is the studio palette: `#0c0c14` background, `#00ff99` accent,
  `#8a2be2` secondary, Press Start 2P for short labels only.
- Long body copy stays in a readable sans. Press Start 2P is a display face, not
  a paragraph face.

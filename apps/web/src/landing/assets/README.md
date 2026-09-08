# Static PRISM hero

[prism-hero.svg](prism-hero.svg) is a manually constructed vector interpretation of
the generated prism approved as the direction on 6 September 2026. It preserves
the black triangular silhouette, white incident beam, and refracted spectrum while
simplifying reflections and removing raster noise. It is an illustrative brand
asset, not a quantitative optics diagram.

The SVG has a transparent background and a 1600 by 850 viewBox. It contains paths,
gradients, a clip, and an alpha mask, with no embedded bitmap, scripts, animation,
external resources, or filter effects. The white beam is most visible against a
dark surface.

## React integration

From a component in the landing directory:

```tsx
import prismHeroUrl from './assets/prism-hero.svg'

<img
  src={prismHeroUrl}
  width={1600}
  height={850}
  alt=""
  className="prism-hero-image"
/>
```

```css
.prism-hero-image {
  display: block;
  width: 100%;
  height: auto;
}
```

Use empty alt text when the graphic is decorative and nearby text explains the
product. If it conveys otherwise absent information, supply a concise description,
such as "White light enters a black prism and emerges as a spectrum."

Importing the asset gives Vite ownership of its production URL and content hashing.
Keep it as an image for the static landing hero; inline SVG is only useful if the
page needs access to individual shapes. If later inlining more than one instance,
give each instance unique gradient, mask, clip, and accessibility IDs.

Explicit dimensions reserve the aspect ratio. Keep an above-the-fold hero
discoverable without lazy loading. Add high fetch priority only if production
measurement identifies this as a critical image.

## Landing replacement scope

The landing imports this asset through PrismIllustration. The previous renderer,
canvas lifecycle, camera/pause controls, optical simulation, raster fallback, and
renderer-only dependencies have been removed. Source links and shared theme
selection remain available. The illustration is oversized and unframed, with its
transparent background revealing the page's shared light or dark ground. The white
incident beam is intentionally subtler on a light ground. The figure is noninteractive
and is absolutely positioned behind the hero headline and actions at 28% opacity
(20% on narrow screens), contributing no separate image row. The original SVG
artwork is unchanged.

Rendered previews were inspected at 1200px on dark and light surfaces and at 390px
on a light surface. These are offline SVG renders, not browser acceptance or a
measured page speed improvement.

References:
- [Vite asset imports](https://vite.dev/guide/assets.html)
- [MDN: SVG as an image](https://developer.mozilla.org/en-US/docs/Web/SVG/Guides/SVG_as_an_image)

# PRISM: an optical studio
**Design research and implementation brief · 7 September 2026**  
Prepared for PRISM's owner. Scope: the landing below the hero, shared accent colors, and the quality of its interactions.

**Subsequent owner refinement, 7 September:** the standalone optical study described
below has since become an explicit source-to-explanation spread: an attributed
textbook-style passage beside a live wavelength example, with idea selection and
source-sentence highlighting. The research remains the basis for the visual direction;
the [current design direction](../product/DESIGN_DIRECTION.md) records the implementation.

The chosen direction is an open, editorial optical study: expressive serif typography, a large wavelength illustration, and familiar controls. Black-and-white interface elements give the spectrum room to carry the identity. This follows the owner's two explicit preferences; research informs the execution, rather than establishing which aesthetic the owner must like.

## What the evidence changes
**Make the subject the composition.** Stripe Press uses books themselves as a strong visual organizing element. Its current opening view suggests a useful principle for PRISM: use light, lenses, and a spectrum to structure the page. This is a visual interpretation of a first-party precedent, not evidence that its treatment improves conversion. [Stripe Press, website observed 7 September 2026](https://press.stripe.com/).

**Give the interaction a question to answer.** Bret Victor's explorable explanations connect manipulation to authored explanation. Hohman and colleagues describe affordances of interactive articles, including multiple representations and details on demand, while recognizing design and accessibility challenges. For PRISM, the question is small and legible: what changes as a wavelength gets longer? The slider changes spacing, color, and a numerical readout together. Prose remains readable without manipulating it. These sources motivate the design; they do not establish learning gains for this landing. [Victor, *Explorable Explanations*, 2011, postscript 2024](https://worrydream.com/ExplorableExplanations/); [Hohman, Conlen, Heer and Chau, *Communicating with Interactive Articles*, Distill, 2020](https://distill.pub/2020/communicating-with-interactive-articles/).

**Borrow interaction restraint, not another site's appearance.** Ciechanowski's optics essay pairs large explanatory graphics with simple sliders and nearby prose. The Ink & Switch designer's case study describes an article system with supporting material in the margins. These precedents informed a single substantial illustration and an expandable source note. No reference site's artwork or code was copied. [Ciechanowski, *Lights and Shadows*, 1 July 2020](https://ciechanow.ski/lights-and-shadows/); [SEAOFCLOUDS, *Ink & Switch*, undated](https://www.seaofclouds.com/inkandswitch).

## Distinctive does not mean unfamiliar everywhere
Tuch and colleagues found that visual complexity and prototypicality influenced rapid aesthetic judgments of website screenshots. Their 2012 work supports controlling visual load; it does not establish that every page should use the same familiar layout. A newer study of 108 participants rating 12 landing pages reported associations between aesthetic appeal, novelty, and typicality, with the novelty association stronger. Different stimuli and exposure conditions limit direct comparison. The newer paper's full publisher page was inaccessible during this research; its indexed primary text supported the limited finding reported here. [Tuch et al., *The role of visual complexity and prototypicality regarding first impression of websites*, 2012](https://research.google/pubs/the-role-of-visual-complexity-and-prototypicality-regarding-first-impression-of-websites-working-towards-understanding-aesthetic-judgments/); [Silvennoinen, Kotkajuuri and Kujala, *The Effect of Novelty and Typicality on Aesthetic Appeal of Websites*, published online 14 November 2025](https://www.tandfonline.com/doi/full/10.1080/10447318.2025.2576633).

The practical inference is to put originality in the composition and artwork while preserving ordinary links, a native range control, clear labels, and predictable focus. Avoid adding decorative gestures to every element.

## The implemented direction
- Replace the three equal explanation links, passage card, and feature list with “Look again.” and one large optical study.
- Keep the approved wordmark and flowing hero prism. Use neutral shared action, hover, selection, and focus colors.
- Show a circular magnified wave beside a continuous spectrum fan. A 380–700 nm slider changes its spacing and approximate color; reset returns to 550 nm.
- Keep the source note available in place, followed by a direct invitation to bring a PDF.
- Reflow controls and prose on phones. Crop only the decorative extension of the fan, preserving the meaningful lens and all interactions.

NASA supplies the approximate visible-light range used by the study. Screen colors and enlarged distances are illustrative; the diagram does not simulate a prism's physical behavior. [NASA Science, *Visible Light*, accessed 7 September 2026](https://science.nasa.gov/ems/09_visiblelight/).

## Quality boundaries
Color is accompanied by numbers, text, and wave geometry. Keyboard users can change and reset the wavelength and open the source note. Motion preferences preserve a static hero alternative. Controls and prose must work at 320 CSS pixels without horizontal page scrolling. These decisions follow accessibility requirements, not a claim of complete conformance from a small local inspection. [W3C, *WCAG 2.2*, Recommendation 12 December 2024](https://www.w3.org/TR/WCAG22/); [W3C, *Understanding Reflow*](https://www.w3.org/WAI/WCAG22/Understanding/reflow.html).

This research combines original studies, design essays, standards, and first-party precedents. Visual reference inspection sampled the opening views of Stripe Press, Ciechanowski, and the Ink & Switch case study; it was not a full usability evaluation of those sites. Further searches stopped once the design decision had support, contradictory findings were bounded, and more references were unlikely to change the implementation. Owner acceptance, testing with readers, and behavior on a deployed site remain unestablished.

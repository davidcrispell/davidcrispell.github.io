# David Crispell Website

A tiny static personal site inspired by the typography and spacing of Dario Amodei's homepage, rewritten as a clean skeleton rather than copied Webflow output.

## Edit

- Update the homepage text and links in `index.html`.
- Use `essay.html` as a long-form writing template.
- Tune colors, spacing, and type scale in `site.css`.
- The light/dark toggle and footnote behavior live in `site.js`.

## Footnotes

In `essay.html`, add a numbered superscript in the body:

```html
Sentence with a note<sup>1</sup>.
```

Then add the matching item in the footnotes list:

```html
<li>Footnote text goes here.</li>
```

The script turns it into a jump link, hover tooltip on desktop, and return link in the footnote list.

## Preview

Open `index.html` in a browser, or run a local server:

```sh
python3 -m http.server 8000
```

Then visit `http://localhost:8000`.

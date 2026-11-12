"use strict";

function escapeHtml(value) {
  return value.replace(/[&<>]/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;"
  })[character]).replace(/{(?=[{%])/g, "&#123;");
}

function readTab(document, tabId) {
  const tabs = [...(document.tabs ?? [])];
  if (!tabId) {
    return tabs[0]?.documentTab ?? document;
  }

  while (tabs.length) {
    const tab = tabs.shift();
    if (tab.tabProperties?.tabId === tabId) {
      return tab.documentTab;
    }
    tabs.push(...(tab.childTabs ?? []));
  }
  throw new Error("The configured Google Doc tab could not be found.");
}

function plainText(paragraph) {
  return (paragraph?.elements ?? []).map((element) => element.textRun?.content ?? "").join("").trim();
}

function renderLink(text, link) {
  let href;
  try {
    href = new URL(link.url);
  } catch {
    throw new Error("The Google Doc contains a link this site cannot import.");
  }
  if (!["https:", "http:", "mailto:"].includes(href.protocol)) {
    throw new Error("The Google Doc contains a link this site cannot import.");
  }
  const escapedHref = escapeHtml(href.href).replace(/"/g, "&quot;");
  return `<a href="${escapedHref}">${text}</a>`;
}

function renderInline(paragraph, sync) {
  const elements = paragraph.elements ?? [];
  const lastContent = elements.findLastIndex((element) => !element.textRun || element.textRun.content.trim());
  return elements.map((element, index) => {
    if (index > lastContent) return "";
    if (element.equation) {
      const before = elements[index - 1]?.textRun?.content ?? "";
      const matching = Object.entries(sync.equation_overrides ?? {}).filter(([suffix]) => before.endsWith(suffix));
      if (matching.length !== 1) {
        throw new Error("The Google Doc contains an equation that needs a website mapping.");
      }
      return `<var>${escapeHtml(matching[0][1])}</var>`;
    }

    if (!element.textRun) {
      throw new Error("The Google Doc contains an inline object this site cannot import.");
    }
    const { content, textStyle = {} } = element.textRun;
    const value = index === lastContent ? content.trimEnd() : content;
    if (!value) return "";

    let html = escapeHtml(value).replace(/\n/g, "<br>");
    if (textStyle.bold) html = `<strong>${html}</strong>`;
    if (textStyle.italic) html = `<em>${html}</em>`;
    if (textStyle.underline && !textStyle.link) html = `<u>${html}</u>`;
    if (textStyle.strikethrough) html = `<s>${html}</s>`;
    if (textStyle.baselineOffset === "SUPERSCRIPT") html = `<sup>${html}</sup>`;
    if (textStyle.baselineOffset === "SUBSCRIPT") html = `<sub>${html}</sub>`;
    if (textStyle.link) html = renderLink(html, textStyle.link);
    return html;
  }).join("");
}

function headingLevel(paragraph, sync) {
  const style = paragraph.paragraphStyle?.namedStyleType;
  if ((sync.heading_overrides ?? []).includes(plainText(paragraph)) || style === "TITLE") return 2;
  const match = /^HEADING_([1-6])$/.exec(style);
  return match ? Math.min(Number(match[1]) + 1, 6) : 0;
}

function renderFigure(paragraphs, index, object, sync, existingBody, usedFigures) {
  const name = sync.local_figures?.[object.inlineObjectId];
  if (!name || !/^[a-z0-9-]+$/.test(name) || usedFigures.has(name)) {
    throw new Error("The Google Doc contains an image that needs a website mapping.");
  }
  const start = `<!-- google-doc:figure:${name}:start -->`;
  const end = `<!-- google-doc:figure:${name}:end -->`;
  const startIndex = existingBody.indexOf(start);
  const endIndex = existingBody.indexOf(end, startIndex);
  if (startIndex < 0 || endIndex < 0 || existingBody.indexOf(start, startIndex + 1) >= 0 ||
      existingBody.indexOf(end, endIndex + 1) >= 0) {
    throw new Error("A website figure mapping is missing or ambiguous.");
  }

  const label = paragraphs[index + 1];
  const caption = paragraphs[index + 2];
  const captionRuns = (caption?.elements ?? []).filter((element) => element.textRun?.content.trim());
  if (!/^Figure\s+\d+$/i.test(plainText(label)) || !captionRuns.length ||
      !captionRuns.every((element) => element.textRun.textStyle?.italic)) {
    throw new Error("A mapped Google Doc image needs its Figure label and italic caption below it.");
  }

  const existing = existingBody.slice(startIndex, endIndex + end.length).trim();
  const captionPattern = /<figcaption\b[^>]*>[\s\S]*?<\/figcaption>/g;
  if ([...existing.matchAll(captionPattern)].length !== 1) {
    throw new Error("A mapped website figure needs exactly one caption.");
  }

  usedFigures.add(name);
  const captionHtml = `${renderInline(label, sync)}<br>${renderInline(caption, sync)}`;
  // The first line has already lost its indentation; strip the same prefix from the rest.
  const indent = existingBody.slice(existingBody.lastIndexOf("\n", startIndex) + 1, startIndex);
  return existing.split("\n").map((line) => line.startsWith(indent) ? line.slice(indent.length) : line).join("\n")
    .replace(captionPattern, () => `<figcaption>${captionHtml}</figcaption>`);
}

function renderBullets(items) {
  const lines = [];
  const lists = [];
  for (const item of items) {
    if (item.depth > lists.length) {
      throw new Error("The Google Doc contains a list with a missing parent item.");
    }
    while (lists.length > item.depth + 1) {
      lines.push(`</li></${lists.pop()}>`);
    }
    if (lists.length > item.depth) {
      const currentTag = lists.pop();
      lines.push("</li>");
      if (currentTag !== item.tag) {
        lines.push(`</${currentTag}><${item.tag}>`);
      }
    } else {
      lines.push(`<${item.tag}>`);
    }
    lists.push(item.tag);
    lines.push(`<li>${item.html}`);
  }
  while (lists.length) {
    lines.push(`</li></${lists.pop()}>`);
  }
  return lines.join("\n");
}

function renderBody(document, source, sync, existingBody) {
  const tab = readTab(document, source.tab_id);
  const content = tab?.body?.content;
  if (!Array.isArray(content)) {
    throw new Error("Google Docs returned an empty or unreadable tab.");
  }

  const paragraphs = content.filter((entry) => !entry.sectionBreak).map((entry) => {
    if (!entry.paragraph || entry.paragraph.positionedObjectIds?.length) {
      throw new Error("The Google Doc contains a table or other block this site cannot import.");
    }
    return entry.paragraph;
  });
  const hasContent = (paragraph) => plainText(paragraph) || paragraph.elements?.some((element) => !element.textRun);
  if (sync.skip_first_paragraph_as_title) {
    const titleIndex = paragraphs.findIndex(hasContent);
    if (titleIndex < 0 || !paragraphs[titleIndex].elements.every((element) => element.textRun)) {
      throw new Error("The Google Doc title could not be identified.");
    }
    paragraphs.splice(titleIndex, 1);
  }

  const blocks = [];
  const pendingItems = [];
  const usedFigures = new Set();
  let inListSection = false;
  const flushList = () => {
    if (pendingItems.length) {
      blocks.push(renderBullets(pendingItems));
      pendingItems.length = 0;
    }
  };

  for (const [index, paragraph] of paragraphs.entries()) {
    if (!paragraph || !hasContent(paragraph)) continue;
    const objects = paragraph.elements.filter((element) => element.inlineObjectElement);
    if (objects.length) {
      const mixedContent = paragraph.elements.some((element) => !element.inlineObjectElement &&
        (!element.textRun || element.textRun.content.trim()));
      if (objects.length !== 1 || mixedContent) {
        throw new Error("The Google Doc contains an image mixed with other content in the same paragraph.");
      }
      flushList();
      blocks.push(renderFigure(paragraphs, index, objects[0].inlineObjectElement, sync, existingBody, usedFigures));
      // The label and caption have been consumed by the figure.
      paragraphs[index + 1] = null;
      paragraphs[index + 2] = null;
      continue;
    }

    const html = renderInline(paragraph, sync);
    const bullet = paragraph.bullet ?? paragraph.paragraphStyle?.bullet;
    const level = sync.content === "homepage-bio" ? 0 : headingLevel(paragraph, sync);
    if (level) {
      flushList();
      blocks.push(`<h${level}>${html}</h${level}>`);
      inListSection = (sync.list_sections ?? []).includes(plainText(paragraph));
    } else if (bullet || inListSection) {
      const depth = bullet?.nestingLevel ?? 0;
      const style = tab.lists?.[bullet?.listId]?.listProperties?.nestingLevels?.[depth];
      if (bullet && !style) {
        throw new Error("The Google Doc contains a list style this site cannot import.");
      }
      const tag = style?.glyphType && style.glyphType !== "GLYPH_TYPE_UNSPECIFIED" ? "ol" : "ul";
      pendingItems.push({ depth, html, tag });
    } else {
      flushList();
      blocks.push(`<p>${html}</p>`);
    }
  }

  flushList();
  if (!blocks.length) {
    throw new Error("The Google Doc body is empty. The current page was kept.");
  }
  if (Object.values(sync.local_figures ?? {}).some((name) => !usedFigures.has(name))) {
    throw new Error("The Google Doc is missing an image mapped to an existing website figure.");
  }
  return blocks.join("\n\n");
}

function updatePage(pageHtml, document, source, sync) {
  const markerPattern = /^([ \t]*)<!-- google-doc:start -->\r?\n([\s\S]*?)^[ \t]*<!-- google-doc:end -->[ \t]*$/gm;
  const markers = [...pageHtml.matchAll(markerPattern)];
  if (markers.length !== 1 || pageHtml.split("<!-- google-doc:start -->").length !== 2 ||
      pageHtml.split("<!-- google-doc:end -->").length !== 2) {
    throw new Error("The page needs one pair of Google Doc content markers.");
  }

  const [match] = markers;
  const [previous, indent, body] = match;
  const rendered = renderBody(document, source, sync, body)
    .split("\n").map((line) => line ? `${indent}${line}` : "").join("\n");
  const replacement = `${indent}<!-- google-doc:start -->\n${rendered}\n${indent}<!-- google-doc:end -->`;
  return pageHtml.slice(0, match.index) + replacement + pageHtml.slice(match.index + previous.length);
}

module.exports = { updatePage };

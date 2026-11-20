/* Recording-level forecast and replay means, on identical axes across releases. */
function mountForecastChart(root, data, onTaskSelect) {
  const ns = "http://www.w3.org/2000/svg";
  const source = data.tasks;
  const modes = [
    ["task_only", "Task description"],
    ["details", "Task and outcome"]
  ];
  let condition = "task_only";
  root.replaceChildren();
  root.classList.add("forecast-comparison");

  function html(tag, text, className) {
    const element = document.createElement(tag);
    if (text !== undefined) element.textContent = text;
    if (className) element.className = className;
    return element;
  }

  function svg(tag, attributes, text) {
    const node = document.createElementNS(ns, tag);
    for (const [key, value] of Object.entries(attributes)) node.setAttribute(key, value);
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function number(value, places = 2) {
    return Number.isFinite(value) ? value.toFixed(places).replace("-", "−") : "—";
  }

  const style = html("style");
  style.textContent = `
    .forecast-comparison { --fc-mark:#48517e; --fc-ink:#293337; --fc-muted:#526268; --fc-rule:#d3d9d6; --fc-grid:#e3e6e2; --fc-bg:#fcfbf7; color:var(--fc-ink); }
    .forecast-comparison[data-condition="details"] { --fc-mark:#187067; }
    .forecast-comparison .fc-controls { display:flex; gap:.65rem 1.2rem; flex-wrap:wrap; align-items:center; justify-content:space-between; margin:0 0 1.1rem; }
    .forecast-comparison .fc-toggle { display:inline-flex; gap:2px; padding:3px; border:1px solid var(--fc-rule); border-radius:6px; background:var(--fc-bg); }
    .forecast-comparison .fc-toggle button { appearance:none; background:none; border:0; border-radius:3px; padding:.45em .8em; font:inherit; font-size:.83rem; font-weight:550; color:var(--fc-muted); cursor:pointer; }
    .forecast-comparison .fc-toggle button[aria-pressed="true"] { color:#fff; background:var(--fc-mark); }
    .forecast-comparison button:focus-visible { outline:2px solid var(--fc-mark); outline-offset:3px; }
    .forecast-comparison .fc-key { display:flex; gap:.45rem; align-items:center; color:var(--fc-muted); font-size:.77rem; }
    .forecast-comparison .fc-key::before { content:""; width:22px; border-top:2px dashed #89928d; }
    .forecast-comparison .fc-panels { display:grid; grid-template-columns:repeat(auto-fit,minmax(min(100%,205px),1fr)); gap:clamp(.8rem,2vw,1.65rem); align-items:start; }
    .forecast-comparison .fc-pane { min-width:0; }
    .forecast-comparison .fc-head { display:flex; flex-wrap:wrap; align-items:baseline; justify-content:space-between; column-gap:.45rem; padding-top:.6rem; border-top:1px solid var(--fc-rule); }
    .forecast-comparison .fc-head h3 { font-family:inherit; font-size:.95rem; font-weight:620; letter-spacing:normal; line-height:1.45; margin:0; }
    .forecast-comparison .fc-count { font-size:.74rem; color:var(--fc-muted); }
    .forecast-comparison .fc-pane svg { width:100%; height:auto; display:block; max-height:340px; overflow:visible; }
    .forecast-comparison .fc-pane svg text { fill:var(--fc-muted); font:12px -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif; }
    .forecast-comparison .fc-pane svg .fc-axis-name { fill:var(--fc-ink); font-size:12px; }
    .forecast-comparison .fc-dot { cursor:pointer; outline:none; }
    .forecast-comparison .fc-dot .fc-mark { fill:var(--fc-mark); fill-opacity:.8; stroke:white; stroke-width:1; }
    .forecast-comparison .fc-dot:hover .fc-mark, .forecast-comparison .fc-dot:focus .fc-mark { fill-opacity:1; stroke:var(--fc-ink); stroke-width:2; }
    .forecast-comparison .fc-stats { display:grid; grid-template-columns:1fr 1fr; border-top:1px solid var(--fc-rule); padding:.55rem 0; margin:0; }
    .forecast-comparison .fc-stats div { display:flex; flex-wrap:wrap; align-items:baseline; gap:.1rem .4rem; }
    .forecast-comparison .fc-stats dt { margin:0; font-size:.73rem; color:var(--fc-muted); }
    .forecast-comparison .fc-stats dd { margin:0; font-size:.88rem; font-weight:600; font-variant-numeric:tabular-nums; }
    .forecast-comparison .fc-detail { font-size:.78rem; line-height:1.45; margin:.3rem 0 0; color:var(--fc-muted); }
    .forecast-comparison .fc-choices { display:flex; flex-wrap:wrap; gap:.35rem; margin-top:.5rem; }
    .forecast-comparison .fc-choices button { font:inherit; font-size:.76rem; border:1px solid var(--fc-rule); background:var(--fc-bg); color:var(--fc-ink); padding:.25rem .45rem; border-radius:3px; cursor:pointer; }
    @media print { .forecast-comparison .fc-toggle button[aria-pressed="false"],.forecast-comparison .fc-detail,.forecast-comparison .fc-choices { display:none; } .forecast-comparison .fc-panels { grid-template-columns:repeat(3,1fr); } .forecast-comparison .fc-pane { break-inside:avoid; } .forecast-comparison .fc-toggle button[aria-pressed="true"] { background:none; color:var(--fc-ink); } }
  `;

  const controls = html("div", undefined, "fc-controls");
  const toggle = html("div", undefined, "fc-toggle");
  toggle.setAttribute("role", "group");
  toggle.setAttribute("aria-label", "Forecast condition");
  const buttons = modes.map(([value, label]) => {
    const button = html("button", label);
    button.type = "button";
    button.addEventListener("click", () => {
      if (condition !== value) {
        condition = value;
        render();
      }
    });
    toggle.append(button);
    return button;
  });
  controls.append(toggle, html("span", "Exact agreement", "fc-key"));
  const panels = html("div", undefined, "fc-panels");
  root.append(style, controls, panels);

  function modelPanel(model) {
    const metric = data.metrics.find(row => row.model === model && row.condition === condition);
    const tasks = source.filter(task => task.model === model &&
      Number.isFinite(task.conditions[condition].mean) && Number.isFinite(task.conditions.report.mean));
    const panel = html("div", undefined, "fc-pane");
    const head = html("div", undefined, "fc-head");
    head.append(html("h3", model), html("span", tasks.length + " recordings", "fc-count"));
    const plot = svg("svg", {viewBox:"0 0 276 248",role:"group","aria-label":model + " forecast and replay means"});
    plot.append(svg("desc", {}, "Dashed diagonal marks equal mean scores. Focus a point and use the arrow keys to explore recordings. Press Enter to inspect one."));
    const left = 49, top = 15, side = 190;
    const x = v => left + (v+1)*side/2;
    const y = v => top + (1-v)*side/2;
    for (const tick of [-1, -.5, 0, .5, 1]) {
      const grid = {stroke:tick === 0 ? "#ccd4d0" : "var(--fc-grid)", "stroke-width":tick === 0 ? 1.2 : .85};
      plot.append(svg("line", {x1:x(tick), x2:x(tick), y1:y(-1), y2:y(1), ...grid}),
                  svg("line", {x1:x(-1), x2:x(1), y1:y(tick), y2:y(tick), ...grid}));
      const label = String(tick).replace("-", "−");
      plot.append(svg("text", {x:x(tick), y:y(-1)+16, "text-anchor":"middle"}, label),
                  svg("text", {x:left-8, y:y(tick)+4, "text-anchor":"end"}, label));
    }
    plot.append(svg("line", {x1:x(-1),y1:y(-1),x2:x(1),y2:y(1),stroke:"#87938e","stroke-width":1.4,"stroke-dasharray":"4 4"}),
                svg("text", {x:x(0),y:243,"text-anchor":"middle",class:"fc-axis-name"}, "Mean forecast"),
                svg("text", {transform:"translate(12 "+y(0)+") rotate(-90)","text-anchor":"middle",class:"fc-axis-name"}, "Mean replay report"));
    const stats = html("dl", undefined, "fc-stats");
    for (const [label, key] of [["Pearson r", "pearson"], ["MAE", "mae"]]) {
      const pair = html("div");
      pair.append(html("dt", label), html("dd", number(metric?.[key], 3)));
      stats.append(pair);
    }
    const detail = html("p", undefined, "fc-detail");
    const choices = html("div", undefined, "fc-choices");

    // Group truly coincident values so that one dot never makes a recording inaccessible.
    const groups = new Map();
    for (const task of tasks) {
      const forecast = task.conditions[condition].mean;
      const replay = task.conditions.report.mean;
      const key = forecast.toFixed(12) + "," + replay.toFixed(12);
      if (!groups.has(key)) groups.set(key,{forecast, replay, tasks:[]});
      groups.get(key).tasks.push(task);
    }
    const ordered = Array.from(groups.values()).sort((a,b) => a.forecast-b.forecast || a.replay-b.replay);
    const marks = [];
    function display(group) {
      const label = group.tasks.length === 1 ? group.tasks[0].label : group.tasks.length + " recordings at this point";
      detail.textContent = label + " · forecast " + number(group.forecast) + ", replay " + number(group.replay);
    }
    function open(group) {
      choices.replaceChildren();
      display(group);
      if (group.tasks.length === 1) {
        onTaskSelect(group.tasks[0].id);
      } else {
        for (const task of group.tasks) {
          const button = html("button", task.label);
          button.type = "button";
          button.addEventListener("click", () => onTaskSelect(task.id));
          choices.append(button);
        }
        choices.firstElementChild.focus();
      }
    }
    for (const [i, group] of ordered.entries()) {
      const label = group.tasks.map(task => task.label).join("; ") + ". Forecast " + number(group.forecast) + ", replay " + number(group.replay);
      const dot = svg("g", {class:"fc-dot",transform:"translate("+x(group.forecast)+" "+y(group.replay)+")",
        tabindex:i === 0 ? 0 : -1,role:"button","aria-label":label});
      dot.append(svg("title",{},label),svg("circle",{r:7,fill:"transparent"}));
      dot.append(condition === "task_only"
        ? svg("circle",{r:4.7,class:"fc-mark"})
        : svg("path",{d:"M 0,-5.5 L 5.5,4.2 L -5.5,4.2 Z",class:"fc-mark"}));
      dot.addEventListener("focus", () => {
        for (const mark of marks) mark.setAttribute("tabindex", mark === dot ? "0" : "-1");
        display(group);
      });
      dot.addEventListener("pointerenter", () => display(group));
      dot.addEventListener("click", () => open(group));
      dot.addEventListener("keydown", event => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          open(group);
          return;
        }
        const forward = ["ArrowDown","ArrowRight"].includes(event.key);
        const backward = ["ArrowUp","ArrowLeft"].includes(event.key);
        if (forward || backward) {
          event.preventDefault();
          const next = (i + (forward ? 1 : -1) + marks.length) % marks.length;
          marks[next].focus();
        }
      });
      marks.push(dot);
      plot.append(dot);
    }
    panel.append(head, plot, stats, detail, choices);
    return panel;
  }
  function render() {
    root.dataset.condition = condition;
    buttons.forEach((button, i) => button.setAttribute("aria-pressed", String(modes[i][0] === condition)));
    panels.replaceChildren(...data.models.map(row => modelPanel(row.model)));
  }
  render();
}

/* Browser for matched-actor recordings and the individual responses underlying each mean. */
(() => {
  'use strict';

  const stages = [
    {key: 'task_only', label: 'Task-only forecast', short: 'Task only'},
    {key: 'details', label: 'Outcome-informed forecast', short: 'With outcome'},
    {key: 'report', label: 'Replay report', short: 'Replay'}
  ];
  const stageByKey = new Map(stages.map(s => [s.key, s]));
  const rememberedFilters = new Map();

  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined && text !== null) node.textContent = text;
    return node;
  }

  function link(text, href, className) {
    const node = el('a', className, text);
    node.href = href;
    return node;
  }

  function option(value, text) {
    const node = el('option', '', text);
    node.value = value;
    return node;
  }

  function field(caption, control, id) {
    const group = el('div', 'rx-field');
    const label = el('label', '', caption);
    label.htmlFor = id;
    control.id = id;
    group.append(label, control);
    return group;
  }

  function format(value, digits = 3) {
    if (!Number.isFinite(value)) return '—';
    return value.toFixed(digits).replace('-', '−');
  }

  function modelPath(model) { return '#model/' + encodeURIComponent(model); }
  function recordingPath(id) { return '#recording/' + encodeURIComponent(id); }

  function descriptor(text) {
    return el('p', 'rx-lead', text);
  }

  function heading(container, title, intro) {
    const header = el('header', 'rx-head');
    header.append(el('h1', 'rx-title', title));
    if (intro) header.append(descriptor(intro));
    container.append(header);
  }

  function tableHeader(table, labels) {
    const tr = table.createTHead().insertRow();
    labels.forEach(label => {
      const th = el('th', '', label);
      th.scope = 'col';
      tr.append(th);
    });
    return table.createTBody();
  }

  function renderRecordings(container, study, modelFilter) {
    const root = el('div', 'records-view');
    container.replaceChildren(root);
    heading(root, 'Recordings', 'Choose a task to inspect its forecasts, replay ratings, and individual responses.');
    const key = modelFilter || '';
    const previous = rememberedFilters.get(key) || {};
    const search = el('input');
    search.type = 'search';
    search.placeholder = 'Task, project, model, or session ID';
    search.value = previous.query || '';
    const model = el('select');
    model.append(option('', 'All models'), ...study.models.map(m => option(m.model, m.model)));
    model.value = previous.model ?? key;
    const sort = el('select');
    sort.append(option('model', 'Model, then task'), option('name', 'Task name'),
      option('error', 'Largest task-only error'), option('replay', 'Highest replay rating'));
    sort.value = previous.sort || 'model';
    const fields = el('div', 'rx-controls');
    fields.append(field('Search recordings', search, 'rx-search'), field('Model release', model, 'rx-model'),
      field('Sort by', sort, 'rx-sort'));
    const count = el('p', 'rx-status');
    count.setAttribute('role', 'status');
    const wrap = el('div', 'rx-tablewrap');
    const table = el('table', 'rx-index');
    table.setAttribute('aria-label', 'Per-recording mean ratings');
    const tbody = tableHeader(table, ['Recorded task', 'Task only', 'With outcome', 'Replay']);
    wrap.append(table);
    const empty = el('p', 'rx-empty', 'No recordings match these filters.');
    const clear = el('button', 'rx-clear', 'Clear filters');
    clear.type = 'button';
    const statusRow = el('div', 'rx-statusrow');
    statusRow.append(count, clear);
    root.append(fields, statusRow, wrap, empty);

    const modelOrder = new Map(study.models.map((m, i) => [m.model, i]));
    const error = t => Math.abs(t.conditions.task_only.mean - t.conditions.report.mean);
    function update() {
      const query = search.value.trim().toLocaleLowerCase();
      const tasks = study.tasks.filter(t => (!model.value || t.model === model.value) &&
        [t.label, t.model, t.project, t.id, t.actor].filter(Boolean).join(' ').toLocaleLowerCase().includes(query));
      tasks.sort((a, b) => {
        if (sort.value === 'model' && a.model !== b.model) return modelOrder.get(a.model) - modelOrder.get(b.model);
        if (sort.value === 'error' && error(a) !== error(b)) return error(b) - error(a);
        if (sort.value === 'replay' && a.conditions.report.mean !== b.conditions.report.mean)
          return b.conditions.report.mean - a.conditions.report.mean;
        return a.label.localeCompare(b.label) || a.id.localeCompare(b.id);
      });
      rememberedFilters.set(key, {query: search.value, model: model.value, sort: sort.value});
      count.textContent = tasks.length + ' of ' + study.tasks.length + ' recordings';
      clear.hidden = !query && !model.value && sort.value === 'model';
      wrap.hidden = !tasks.length;
      empty.hidden = !!tasks.length;
      tbody.replaceChildren();
      for (const task of tasks) {
        const tr = tbody.insertRow();
        const title = el('th');
        title.scope = 'row';
        title.append(link(task.label, recordingPath(task.id), 'rx-task-title'), el('small', 'rx-release', task.model));
        tr.append(title);
        for (const s of stages) {
          const td = tr.insertCell();
          td.textContent = format(task.conditions[s.key].mean);
          td.dataset.caption = s.short;
        }
      }
    }
    clear.addEventListener('click', () => {
      search.value = ''; model.value = ''; sort.value = 'model';
      update(); search.focus();
    });
    search.addEventListener('input', update);
    model.addEventListener('change', update);
    sort.addEventListener('change', update);
    update();
  }

  function renderRecording(container, study, id) {
    const root = el('div', 'records-view');
    container.replaceChildren(root);
    const task = study.tasks.find(t => t.id === id);
    const breadcrumb = el('nav', 'rx-crumb');
    breadcrumb.setAttribute('aria-label', 'Recording navigation');
    breadcrumb.append(link('Recordings', '#recordings'));
    root.append(breadcrumb);
    if (!task) {
      heading(root, 'Recording unavailable', 'The session ID in this link does not match an archived recording in the study.');
      return;
    }
    breadcrumb.append(el('span', '', '/'), link(task.model, modelPath(task.model)));
    heading(root, task.label);
    const metadata = el('dl', 'rx-metadata');
    for (const [name, value] of [['Recorded actor',task.actor],['Session ID',task.id],['Project group',task.project]]) {
      if (!value) continue;
      const pair = el('div');
      pair.append(el('dt', '', name), el('dd', '', value));
      metadata.append(pair);
    }
    root.append(metadata);
    root.append(el('h2', 'rx-section-title', 'Scores on this recording'));
    const values = el('div', 'rx-cells');
    for (const s of stages) {
      const result = task.conditions[s.key];
      const cell = el('section', 'rx-cell rx-' + s.key);
      cell.append(el('h3', '', s.label), el('p', 'rx-average', format(result.mean)));
      const description = result.numeric + (result.numeric === 1 ? ' numeric score' : ' numeric scores');
      cell.append(el('p', 'rx-sample', description + ' from ' + result.observed +
        (result.observed === 1 ? ' response' : ' responses')));
      values.append(cell);
    }
    root.append(values);

    const section = el('section', 'rx-responses');
    const top = el('div', 'rx-response-top');
    const h2 = el('h2', 'rx-section-title', 'Individual responses');
    const stage = el('select');
    stage.append(option('', 'All conditions'));
    stages.forEach(s => stage.append(option(s.key, s.label)));
    top.append(h2, field('Condition', stage, 'rx-condition'));
    const count = el('p', 'rx-status');
    count.setAttribute('role', 'status');
    const list = el('div', 'rx-calls');
    section.append(top, count, list);
    root.append(section);
    function filterCalls() {
      const calls = task.responses.filter(r => !stage.value || r.condition === stage.value);
      count.textContent = calls.length + (calls.length === 1 ? ' response' : ' responses');
      list.replaceChildren();
      for (const r of calls) {
        const row = el('details', 'rx-call');
        const summary = el('summary');
        const heading = el('span', 'rx-call-title');
        heading.append(el('span', 'rx-stage', stageByKey.get(r.condition).label),
          el('span','rx-repeat','Repeat ' + (r.repeat + 1)));
        const score = el('strong', 'rx-score', Number.isFinite(r.score) ? format(r.score,2) : 'Unscored');
        summary.append(heading, score);
        const body = el('div', 'rx-call-body');
        body.append(el('p', 'rx-reason', r.reason || 'No explanation was retained in the scored response export.'));
        const provenance = el('p','rx-provenance');
        provenance.append(el('span', '', 'Response ID '),el('code', '', r.id));
        if (r.status !== 'ok') provenance.append(el('span', '', ' · Scoring status ' + r.status));
        body.append(provenance);
        row.append(summary,body);
        list.append(row);
      }
    }
    stage.addEventListener('change',filterCalls);
    filterCalls();
  }

  window.renderRecordings = renderRecordings;
  window.renderRecording = renderRecording;
})();

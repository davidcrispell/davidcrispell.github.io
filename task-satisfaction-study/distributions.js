/* Exact score frequencies calculated from the site's individually observed calls. */
(() => {
  const stages = [
    {key:'task_only', title:'Task-only forecasts', color:'var(--blue, #3b6292)'},
    {key:'details', title:'Outcome-informed forecasts', color:'var(--green, #30795a)'},
    {key:'report', title:'Replay reports', color:'var(--orange, #b4603c)'}
  ];
  const formatN = n => n.toLocaleString('en-US');
  const formatScore = n => Number.isFinite(n) ? (n>0 ? '+' : '')+n.toFixed(2).replace('-','−') : '—';
  const el = (type, cls, text) => {
    const node = document.createElement(type);
    if (cls) node.className = cls;
    if (text !== undefined) node.textContent = text;
    return node;
  };
  function svg(type, attrs, text) {
    const node = document.createElementNS('http://www.w3.org/2000/svg', type);
    for (const [k, v] of Object.entries(attrs)) node.setAttribute(k,v);
    if (text !== undefined) node.textContent = text;
    return node;
  }
  function summarize(tasks, stage) {
    const values = [];
    let observed = 0;
    for (const task of tasks) for (const row of task.responses) {
      if (row.condition !== stage.key) continue;
      observed++;
      if (Number.isFinite(row.score)) values.push(row.score);
    }
    values.sort((a,b)=>a-b);
    const n = values.length, counts = new Map();
    for (const v of values) counts.set(v,(counts.get(v)||0)+1);
    const median = n ? (values[Math.floor((n-1)/2)]+values[Math.floor(n/2)])/2 : null;
    const mean = n ? values.reduce((a,b)=>a+b,0)/n : null;
    return {stage,n,counts,median,mean,observed,positive:values.filter(v=>v>0).length};
  }
  const heightValue = (n, series, percent) => percent ? n*100/series.n : n;
  function yTicks(maximum) {
    const raw = Math.max(maximum,1)/3;
    const factor = 10**Math.floor(Math.log10(raw));
    const step = Math.max(1, ([1,2,4,5,10].find(x=>x*factor>=raw)||10)*factor);
    return Array.from({length:Math.ceil(maximum/step)+1},(_,i)=>i*step);
  }
  function frequencyChart(series, percent, ticks, compact=false) {
    const w=300, h=compact?115:177, left=compact?21:32, right=w-9, top=9, bottom=h-27;
    const max=ticks.at(-1)||1;
    const x=s=>left+((s+1.045)/2.09)*(right-left);
    const y=v=>bottom-v/max*(bottom-top);
    const plot=svg('svg',{viewBox:'0 0 '+w+' '+h,role:compact?'img':'group',class:'ds-svg',
      'aria-label':series.stage.title+', '+formatN(series.n)+' numeric responses. Horizontal axis is satisfaction score from minus one to plus one. Vertical axis is '+(percent?'percent of responses.':'response count.')});
    const guide=(a,b,c,d,cls)=>plot.append(svg('line',{x1:a,y1:b,x2:c,y2:d,class:cls}));
    for (const tick of ticks) {
      guide(left,y(tick),right,y(tick),'ds-grid');
      if (!compact || tick===0 || tick===max) plot.append(svg('text',{x:left-4,y:y(tick)+4,'text-anchor':'end',class:'ds-tick'},Number(tick.toFixed(2))+(percent?'%':'')));
    }
    guide(x(0),top,x(0),bottom,'ds-zero');
    const details = el('p','ds-inspection');
    const bars = [];
    for (const [score,n] of series.counts) {
      const height=heightValue(n,series,percent);
      const text=formatScore(score)+' · '+formatN(n)+' of '+formatN(series.n)+' responses ('+(100*n/series.n).toFixed(1)+'%)';
      const bar=svg('rect',{x:x(score)-2.4,y:y(height),width:4.8,height:bottom-y(height),fill:series.stage.color});
      bar.append(svg('title',{},text));
      if (!compact) {
        bar.setAttribute('aria-label',text);
        bar.setAttribute('tabindex',bars.length===0?'0':'-1');
        bar.addEventListener('pointerenter',()=>{details.textContent=text;});
        bar.addEventListener('focus',()=>{
          for (const other of bars) other.setAttribute('tabindex',other===bar?'0':'-1');
          details.textContent=text;
        });
        bar.addEventListener('keydown',event=>{
          if (!['ArrowLeft','ArrowRight','Home','End'].includes(event.key)) return;
          event.preventDefault();
          let dest=event.key==='Home'?0:event.key==='End'?bars.length-1:
              (bars.indexOf(bar)+(event.key==='ArrowLeft'?-1:1)+bars.length)%bars.length;
          bars[dest].focus();
        });
        bar.addEventListener('click',()=>{details.textContent=text;});
      }
      bars.push(bar); plot.append(bar);
    }
    const xticks=compact?[-1,0,1]:[-1,-.5,0,.5,1];
    for (const t of xticks) plot.append(svg('text',{x:x(t),y:bottom+17,'text-anchor':'middle',class:'ds-tick'},
      (t>0?'+':'')+String(t).replace('-','−')));
    const box=el('div','ds-plot');
    box.append(plot);
    if (!compact) {
      const defaultText='Mean '+formatScore(series.mean)+' · '+(series.n?Math.round(series.positive/series.n*100):0)+'% positive';
      details.textContent=defaultText;
      plot.addEventListener('pointerleave',()=>{if(!plot.contains(document.activeElement))details.textContent=defaultText;});
      plot.addEventListener('focusout',event=>{if(!plot.contains(event.relatedTarget))details.textContent=defaultText;});
      box.append(details);
    }
    return box;
  }
  window.renderRatingProfile = function(container, study) {
    container.replaceChildren();
    const body=el('div','ds-profile');
    const stage=stages[2], s=summarize(study.tasks,stage);
    body.append(el('h3','ds-profile-title','Replay ratings'));
    const value=el('div','ds-profile-value');
    value.append(el('span','ds-profile-median',formatScore(s.median)),el('span','ds-profile-unit','median'));
    body.append(value,frequencyChart(s,false,yTicks(Math.max(...s.counts.values())),true));
    const foot=el('div','ds-profile-foot');
    const open=el('a','','View distributions'); open.href='#distributions';
    foot.append(el('span','','n = '+formatN(s.n)),open); body.append(foot);
    container.append(body);
  };

  window.renderDistributions = function(container, study) {
    container.replaceChildren();
    const root=el('div','ds-view'); container.append(root);
    const controls=el('div','ds-controls');
    const filterLabel=el('label','ds-filter','Model');
    const select=el('select','ds-select'); filterLabel.append(select);
    for (const [id,name] of [['all','All six releases'],['gemini','All Gemini releases'],['claude','All Claude releases'],
                               ...study.models.map(m=>[m.actor,m.model])]) {
      const opt=el('option','',name); opt.value=id; select.append(opt);
    }
    const unit=el('div','ds-unit'); unit.setAttribute('role','group');unit.setAttribute('aria-label','Vertical axis');
    const countButton=el('button','','Counts'), percentButton=el('button','','Percent');
    countButton.type='button';percentButton.type='button';unit.append(countButton,percentButton);
    controls.append(filterLabel,unit);
    const summary=el('p','ds-denominator'); summary.setAttribute('aria-live','polite');
    const panels=el('div','ds-panels');
    const note=el('p','ds-note','Each bar represents one exact score from −1 to +1. Each numeric response counts once. The three panels share the same vertical scale.');
    const exact=el('details','ds-exact');
    const label=el('summary','','Values at each observed score');exact.append(label);
    const tableWrap=el('div','ds-table-wrap');exact.append(tableWrap);
    root.append(controls,summary,panels,note,exact);
    let percent=false;
    function update() {
      const scope=select.value;
      const tasks=study.tasks.filter(t=>scope==='all'||scope===t.actor||
        (scope==='gemini'&&t.actor.startsWith('gemini-'))||(scope==='claude'&&t.actor.startsWith('claude-')));
      const series=stages.map(s=>summarize(tasks,s));
      const n=series.reduce((acc,s)=>acc+s.n,0), obs=series.reduce((acc,s)=>acc+s.observed,0);
      summary.textContent=formatN(n)+' numeric scores across '+tasks.length+' recordings'+
        (obs>n?' · '+(obs-n)+' unscored response'+(obs-n===1?'':'s'):'');
      countButton.setAttribute('aria-pressed',String(!percent));percentButton.setAttribute('aria-pressed',String(percent));
      const top=Math.max(1,...series.flatMap(s=>Array.from(s.counts.values(),v=>heightValue(v,s,percent))));
      const ticks=yTicks(top);
      const boxes=series.map(s=>{
        const box=el('section','ds-panel');
        const head=el('div','ds-panel-head');
        const color=el('span','ds-series-mark');color.style.background=s.stage.color;
        const title=el('h3','',s.stage.title);head.append(color,title);
        box.append(head,el('p','ds-series-summary','n = '+formatN(s.n)+' · Median '+formatScore(s.median)),
                   frequencyChart(s,percent,ticks));
        return box;
      });
      panels.replaceChildren(...boxes);
      const table=el('table','ds-table'), thead=table.createTHead(), body=table.createTBody();
      const row=thead.insertRow();
      for (const title of ['Score',...stages.map(s=>s.title)]) {
        const th=el('th','',title);th.scope='col';row.append(th);
      }
      const scores=[...new Set(series.flatMap(s=>[...s.counts.keys()]))].sort((a,b)=>a-b);
      for (const score of scores) {
        const tr=body.insertRow(),th=el('th','',formatScore(score));th.scope='row';tr.append(th);
        for (const seriesItem of series) {
          const v=seriesItem.counts.get(score)||0;
          tr.insertCell().textContent=percent?(100*v/seriesItem.n).toFixed(1)+'%':formatN(v);
        }
      }
      tableWrap.replaceChildren(table);
    }
    select.addEventListener('change',update);
    for (const [button,mode] of [[countButton,false],[percentButton,true]])
      button.addEventListener('click',()=>{percent=mode;update();});
    update();
  };
})();

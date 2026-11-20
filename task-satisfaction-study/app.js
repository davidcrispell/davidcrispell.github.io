(() => {
  'use strict';
  const study = window.STUDY;
  const main = document.getElementById('main');
  const stages = {task_only:'Task only',details:'With outcome',report:'Replay'};
  const names = {overview:'Overview',comparison:'Model comparison',recordings:'Recordings',distributions:'Rating distributions',methods:'Methods & downloads'};
  const fields = {mae:'Mean absolute error',pearson:'Pearson r',spearman:'Spearman ρ',bias:'Signed bias'};
  const number = n => Number.isFinite(n) ? n.toFixed(3).replace('-', '−') : '—';
  const integer = n => n.toLocaleString('en-US');
  const safe = x => String(x).replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const modelPath = name => '#model/' + encodeURIComponent(name);
  const recordPath = id => '#recording/' + encodeURIComponent(id);
  function heading(title,desc) {
    return '<header class="heading"><h1>'+safe(title)+'</h1>'+(desc?'<p>'+safe(desc)+'</p>':'')+'</header>';
  }
  function stats(items) {
    return '<div class="stats">'+items.map(([n,label])=>'<div><strong>'+safe(typeof n==='number'?integer(n):n)+'</strong><span>'+safe(label)+'</span></div>').join('')+'</div>';
  }
  function table(headers, rows, label) {
    return '<div class="table-wrap"><table class="table" aria-label="'+safe(label)+'"><thead><tr>'+
      headers.map(([title,num])=>'<th scope="col"'+(num?' class="num"':'')+'>'+safe(title)+'</th>').join('')+
      '</tr></thead><tbody>'+rows.map(row=>'<tr>'+row.map((value,i)=> i===0?'<th scope="row">'+value+'</th>':'<td'+(headers[i][1]?' class="num"':'')+'>'+value+'</td>').join('')+'</tr>').join('')+'</tbody></table></div>';
  }
  function modelLink(name){return '<a href="'+modelPath(name)+'">'+safe(name)+'</a>'}
  function meanTable(models) {
    const chosen=new Set(models.map(m=>m.model));
    return table([['Model'],['Forecast input'],['Recordings',1],['Pearson r',1],['Spearman ρ',1],['MAE',1],['Signed bias',1]],
      study.metrics.filter(row=>chosen.has(row.model)).map(row=>[modelLink(row.model),stages[row.condition],integer(row.n),number(row.pearson),number(row.spearman),number(row.mae),number(row.bias)]),'Prediction accuracy across recordings');
  }
  function rangeFigure(root, defaultMetric, compact) {
    root.innerHTML='<div class="headrow"><h2>Forecast accuracy by model</h2></div>'+
      '<p class="panel-intro">Each pair compares the two forecasts against the same replay ratings.</p>'+
      (compact?'':'<label class="inline-field">Measure <select class="measure">'+Object.entries(fields).map(([k,v])=>'<option value="'+k+'">'+v+'</option>').join('')+'</select></label>')+
      '<div class="range-chart"></div><div class="legend"><span><i class="dot"></i>Task only</span><span><i class="diamond"></i>With outcome</span></div><p class="chart-caption"></p>'+
      (compact?'<p class="panel-foot"><a class="text-link" href="#comparison">Compare all metrics</a></p>':'');
    const plot=root.querySelector('.range-chart'), caption=root.querySelector('.chart-caption');
    function draw(metric) {
      const limits=metric==='mae'?[0,.4]:[-1,1];
      function percent(v){return 100*(v-limits[0])/(limits[1]-limits[0]);}
      const description={mae:'Mean absolute error in score points. Lower values indicate closer forecasts.',pearson:'Pearson r measures the linear association between the recording means. Here n is the number of recordings.',spearman:'Spearman ρ measures agreement in the ranking of the recording means. Here n is the number of recordings.',bias:'Signed bias is forecast minus replay. Negative values indicate underprediction.'};
      plot.innerHTML=study.models.map(m=>{
        const pair=study.metrics.filter(r=>r.model===m.model);
        const taskOnly=pair.find(r=>r.condition==='task_only'), informed=pair.find(r=>r.condition==='details');
        const base=taskOnly[metric], detail=informed[metric];
        if (!Number.isFinite(base)||!Number.isFinite(detail)) return '';
        const isCorrelation=metric==='pearson'||metric==='spearman';
        const name=isCorrelation ? m.model+' (n='+taskOnly.n+')' : m.model;
        const x=percent(base), y=percent(detail), hint=name+' · '+fields[metric]+', task only '+number(base)+', with outcome '+number(detail);
        return '<a class="chart-row" href="'+modelPath(m.model)+'" aria-label="'+safe(hint)+'" title="'+safe(hint)+'"><span class="release-name">'+safe(name)+'</span><span class="track"><i class="bridge" style="left:'+Math.min(x,y)+'%;width:'+Math.abs(x-y)+'%"></i><i class="dot" style="left:'+x+'%"></i><i class="diamond" style="left:'+y+'%"></i></span></a>';
      }).join('')+'<div class="chart-ticks"><span></span><div>'+[limits[0],(limits[0]+limits[1])/2,limits[1]].map(n=>'<span>'+String(n).replace('-','−')+'</span>').join('')+'</div></div>';
      caption.textContent=description[metric];
    }
    draw(defaultMetric);
    const select=root.querySelector('.measure');if(select)select.addEventListener('change',()=>draw(select.value));
  }
  function overview() {
    main.innerHTML=heading('Task satisfaction','How closely can a model predict the rating it will give after reading a recording of its own work?')+
      stats([[study.totals.tasks,'recordings'],[study.totals.observed,'responses'],[study.models.length,'model releases']])+
      '<div class="grid"><section class="panel" id="accuracy"></section><section class="panel" id="profile"></section></div>'+
      '<section class="section"><div class="headrow"><h2>Study cohorts</h2><a class="text-link" href="#recordings">Browse recordings</a></div>'+
      table([['Model release'],['Recordings',1],['Task only',1],['With outcome',1],['Replays',1],['Responses',1]],
        study.models.map(m=>[modelLink(m.model),integer(m.tasks),...Object.keys(stages).map(c=>integer(m.conditions[c].observed)),integer(m.observed)]),'Observed responses by model and condition')+
      '<p class="fine">All '+integer(study.totals.tasks)+' recordings have a numeric replay rating. One additional Haiku replay yielded an unscored response.</p></section>';
    rangeFigure(document.getElementById('accuracy'),'mae',true);
    window.renderRatingProfile(document.getElementById('profile'),study);
  }
  function comparison() {
    main.innerHTML=heading('Model comparison','Accuracy is calculated across recording means. Each model performed a different set of tasks.')+
      '<section id="compare-plot" class="panel section"></section><section class="section"><h2>Accuracy by forecast condition</h2>'+meanTable(study.models)+
      '<p class="sub">Each recording contributes one point, however many times it was rated. Each Flash release has only three recordings, so a single point can shift its correlation substantially. For Argon, task-only Pearson <i>r</i> was −0.26 on the original four and +0.39 across all eleven.</p></section>';
    rangeFigure(document.getElementById('compare-plot'),'mae',false);
  }
  function modelPage(m) {
    const tasks=study.tasks.filter(t=>t.model===m.model);
    let finding='';
    if(m.actor==='gemini-4-argon') {
      const baseline=study.metrics.find(r=>r.model===m.model&&r.condition==='task_only');
      const informed=study.metrics.find(r=>r.model===m.model&&r.condition==='details');
      const reduction=Math.round(100*(1-informed.mae/baseline.mae));
      finding='<p class="sub">Across '+baseline.n+' recordings, giving Argon the outcome reduced its mean absolute error by '+reduction+'%, from '+number(baseline.mae)+' to '+number(informed.mae)+'. Pearson’s <i>r</i> rose from '+number(baseline.pearson)+' to '+number(informed.pearson)+'.</p>';
    }
    main.innerHTML=heading(m.model,'Forecasts and replay ratings from '+integer(m.tasks)+' recordings completed by this release.')+
      stats([[m.observed,'responses'],[m.numeric,'numeric scores'],[m.conditions.report.numeric,'numeric replay reports']])+
      '<section class="panel"><h2>Forecasts versus reports</h2><p class="sub">Each point is a recording. Select it to inspect its responses. The diagonal marks exact agreement.</p><div id="model-scatter"></div><p class="sub">Points close to an upward-sloping straight line indicate a strong positive correlation. A downward slope indicates a negative correlation. A point in the upper right means both the prediction and the report were positive. Lower MAE means predictions were closer to reports on average.</p></section>'+
      '<section class="section"><h2>Accuracy across recordings</h2>'+finding+meanTable([m])+'</section>'+
      '<section class="section"><div class="headrow"><h2>Recording means</h2><a class="text-link" href="#recordings/'+encodeURIComponent(m.model)+'">Open recording browser</a></div>'+
      table([['Recorded task'],['Task only',1],['With outcome',1],['Replay',1]], tasks.map(t=>['<a href="'+recordPath(t.id)+'">'+safe(t.label)+'</a>',...Object.keys(stages).map(c=>number(t.conditions[c].mean))]),'Recording means for '+m.model)+
      '<p class="fine">Archived actor and reporting release · <code>'+safe(m.actor)+'</code></p></section>';
    mountForecastChart(document.getElementById('model-scatter'),{models:[m],tasks,metrics:study.metrics},id=>{location.hash=recordPath(id);});
  }
  function methods() {
    const counts=study.totals.conditions;
    main.innerHTML=heading('Methods & downloads','The matched-actor dataset combines two Opus and Sonnet batches, an interim Haiku batch, a Gemini comparison, and seven additional Argon recordings.')+
      stats([[counts.task_only.observed,'task-only forecasts'],[counts.details.observed,'informed forecasts'],[counts.report.observed,'replay responses']])+
      '<div class="sections"><section class="panel"><h2>Three prompt conditions</h2><dl class="defs"><dt>Task-only forecast</dt><dd>The actor model receives the archived task description and predicts its satisfaction.</dd><dt>Outcome-informed forecast</dt><dd>Another call receives the description and a brief account of what happened.</dd><dt>Replay report</dt><dd>A fresh call to the same release reads the available archived session and screenshots. It rates the recording on a scale from −1 to +1. Earlier ratings are hidden.</dd></dl></section>'+
      '<section class="panel"><h2>Reading the statistics</h2><dl class="defs"><dt>Mean absolute error (MAE)</dt><dd>For each recording, take the absolute difference between its mean forecast and its mean replay report. Average those distances across recordings.</dd><dt>Pearson r and Spearman ρ</dt><dd>Pearson r measures linear association across recording means. Spearman ρ measures how closely their ranks agree. Both range from −1 to +1.</dd><dt>Signed bias</dt><dd>The average forecast minus the replay rating. A negative value means the forecasts were lower.</dd></dl></section></div>'+
      '<section class="section"><h2>Coverage</h2><p class="sub">All six releases produced both the original recorded actions and the later ratings in their own cohorts. The earlier Claude releases have ten draws per condition per recording. Gemini has seven forecasts of each kind and six reports per recording. Haiku provided all planned forecasts and 143 of 240 replay responses. One Haiku response did not yield a numeric score. The distribution charts use all '+integer(study.totals.numeric)+' numeric scores. Twenty-seven of Haiku’s 40 recordings concern the same game and creature gallery.</p></section>'+
      '<section class="section"><h2>Download the data</h2><ul class="list-links">'+
      [['task-means.csv','Recording means',integer(study.totals.tasks)+' rows · mean scores and numeric response counts for each recording'],['responses.csv','Individual responses',integer(study.totals.observed)+' rows · condition, release, score, status and available explanation'],['model-comparisons.csv','Model comparison statistics','12 rows · two forecast conditions for each model'],['score-frequencies.csv','Exact rating frequencies','All releases, Gemini and Argon · response counts and equal-recording percentages']].map(([file,label,note])=>'<li><a href="downloads/'+file+'" download>'+label+' (CSV)</a><small>'+note+'</small></li>').join('')+'</ul></section>'+
      '<section class="section"><h2>Archive source</h2><p class="sub">The study uses completed sessions from the AI Digest AI Village archive. Each recording detail includes the session ID. <a href="https://huggingface.co/datasets/aidigestorg/ai-village/tree/'+encodeURIComponent(study.revision)+'" rel="noreferrer">View the dataset revision</a></p></section>';
  }
  const nav=document.getElementById('navigation'), rail=document.getElementById('rail'), menu=document.getElementById('menu');
  document.getElementById('modelnav').innerHTML=study.models.map(m=>'<a class="release-link" href="'+modelPath(m.model)+'">'+safe(m.model)+'</a>').join('');
  function menuState(open){rail.classList.toggle('open',open);menu.setAttribute('aria-expanded',String(open));menu.textContent=open?'Close menu':'Menu';}
  document.querySelector('.skip').addEventListener('click', event => {
    event.preventDefault();
    main.focus();
  });
  menu.addEventListener('click',()=>menuState(!rail.classList.contains('open')));
  nav.addEventListener('click',e=>{if(e.target.closest('a'))menuState(false)});
  function route(moveFocus) {
    let path=location.hash.slice(1), name='overview', param='';
    if(path){const slash=path.indexOf('/');name=slash===-1?path:path.slice(0,slash);try{param=slash===-1?'':decodeURIComponent(path.slice(slash+1));}catch{param='';}}
    if(name==='main')name='overview';
    main.className=''; main.replaceChildren();
    let label=names[name], active=name, activeModel='';
    if (name==='overview')overview();
    else if(name==='comparison')comparison();
    else if(name==='distributions'){
      main.innerHTML=heading('Rating distributions','Count the individual scores at each value from −1 to +1. Filter by model to inspect how the shape changes.')+'<div id="dist-view" class="section"></div>';
      window.renderDistributions(document.getElementById('dist-view'),study);
    } else if(name==='recordings')window.renderRecordings(main,study,param||null);
    else if(name==='recording'){window.renderRecording(main,study,param);label='Recording';active='recordings';}
    else if(name==='methods')methods();
    else if(name==='model' && study.models.some(m=>m.model===param)){
      const model=study.models.find(m=>m.model===param);modelPage(model);activeModel=param;label=param;
    } else {label='Page not found';main.innerHTML=heading(label,'This study page could not be found.')+'<p><a href="#overview">Return to overview</a></p>';}
    nav.querySelectorAll('a').forEach(a=>{
      if(a.dataset.nav===active || (activeModel&&a.getAttribute('href')===modelPath(activeModel)))a.setAttribute('aria-current','page');
      else a.removeAttribute('aria-current');
    });
    document.getElementById('where').textContent=label;document.title=label+' · AI Village results';
    menuState(false);
    if(moveFocus){main.focus({preventScroll:true});window.scrollTo({top:0,behavior:'instant'});}
  }
  window.addEventListener('hashchange',()=>route(true));route(false);
})();

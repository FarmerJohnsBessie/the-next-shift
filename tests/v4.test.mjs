import test from 'node:test';
import assert from 'node:assert/strict';
import {scenes,sceneById,endingCatalog} from '../dist/v4-game.mjs';
import {signals,moodLabel} from '../dist/v4-world.mjs';
import {freshRun,simulate,commit,continueRun,advanceChapter,rewind,restoreApp,validAnswer,applyAnswer,endingStory,exportJournal} from '../dist/v4-engine.mjs';
import {createServer} from '../server.mjs';

const good={
 't-plan':{coverage:1,routing:1,mentoring:1},'t-board':'workflow','t-queue':'reroute','t-break':'cover','t-help':'shared','t-bonus':'context','t-export':'test','t-reid':'broader','t-voice':'listen','t-contract':'enforce','t-close':'carry',
 'p-stop':'isolate','p-plan':{alternate:1,reviewer:1,validation:1},'p-records':['robot','signal','account'],'p-question':'specific','p-access':'redacted','p-review':'conditional','p-trace':'trace','p-share':['status','finding'],'p-meeting':'worker','p-retest':'validate','p-retain':'bounded',
 'm-appeal':'pause','m-plan':{cover:1,review:1,training:1},'m-records':['account','context','basis'],'m-hear':'hear','m-retain':'seal','m-notice':'boundary','m-assess':'contextual','m-authority':'separate','m-remedy':'remedy','m-close':'verify',
 't-overflow':'space','t-break-conflict':'repair','t-cover-gap':'rota','t-mentor-refusal':'assign','t-team-target':'limit','t-profile-found':'contain','t-trust-repair':'demonstrate','t-workaround':'usable',
 'p-disruption':'alternate','p-confidence':'protected','p-disclosure':'remedy','p-followup':'time','p-validation-wait':'arrange',
 'm-channel':'private','m-more-monitoring':'stop','m-witness':'context','m-missing-file':'recover','m-signature':'revise','m-authority-gap':'empower','m-return':'concrete'
};
function fallback(s){
 if(s.type==='records'){let a=good[s.id].filter(id=>s.records.some(r=>r.id===id&&!r.locked));for(const r of s.records)if(a.length<s.min&&!r.locked&&!a.includes(r.id))a.push(r.id);return a;}
 const a=good[s.id];return s.type||s.choices.some(c=>c.id===a&&!c.locked)?a:s.choices.find(c=>!c.locked).id;
}
function route(mode,overrides={},stop){let r=freshRun(mode);for(let i=0;i<100;i++){const e=simulate(r);if(stop?.(e))return r;if(e.stage==='ending')return r;if(e.stage==='chapterEnd'){r=advanceChapter(r);continue;}const a=Object.hasOwn(overrides,e.scene.id)?overrides[e.scene.id]:fallback(e.scene);r=continueRun(commit(r,a));}throw new Error('Non-terminating route');}
const fixtures={
 't-glass':['tim',{'t-close':'reopen'}],'t-shadow':['tim',{'t-export':'approve','t-profile-found':'rename'}],'t-stranded':['tim',{'t-queue':'wait'}],'t-rhythm':['tim',{}],
 'p-drift':['priya',{'p-trace':'pace'}],'p-silence':['priya',{'p-trace':'close','p-retest':'software'}],'p-paper':['priya',{'p-meeting':'safety'}],'p-signal':['priya',{}],
 'm-last':['tom',{'m-remedy':'apology'}],'m-file':['tom',{'m-close':'restore'}],'m-empty':['tom',{'m-retain':'delete','m-missing-file':'absence'}],'m-hearing':['tom',{}],
 'w-glass':['campaign',{'t-close':'reopen'}],'w-signal':['campaign',{'p-trace':'close','p-retest':'software'}],'w-visible':['campaign',{'t-export':'approve','t-profile-found':'rename'}],'w-paper':['campaign',{'t-contract':'memo','t-workaround':'blind'}],'w-stranded':['campaign',{'t-queue':'wait'}],'w-late':['campaign',{'t-board':'public'}],'w-unfinished':['campaign',{'t-voice':'reassure','t-trust-repair':'promise'}],'w-next':['campaign',{}]
};
test('all 20 endings remain reachable through the reactive graph',()=>{
 assert.deepEqual(Object.keys(fixtures).sort(),Object.values(endingCatalog).flat().map(e=>e[0]).sort());
 for(const [id,args] of Object.entries(fixtures)){const r=route(...args),e=simulate(r);assert.equal(e.ending,id,id);assert.ok(e.log.length>=10);assert.ok(e.log.length<60);assert.ok(endingStory(r).paragraphs.every(p=>p.length>80));}
});
test('denied break changes mood immediately and opens a different next decision',()=>{
 const denied=simulate(route('tim',{'t-break':'later'},e=>e.scene?.id==='t-break-conflict'));
 assert.equal(denied.world.people.tim.mood,'angry');assert.ok(denied.log.at(-1).changes.some(c=>c.label==='Tim’s mood'&&c.after==='Angry'));assert.ok(denied.world.pending.some(p=>p.key==='break-word'));
 const covered=simulate(route('tim',{},e=>e.scene?.id==='t-help'));assert.equal(covered.world.people.tim.mood,'relieved');assert.notEqual(covered.scene.id,denied.scene.id);
 const follow=simulate(route('tim',{'t-break':'later','t-break-conflict':'private'},e=>e.scene?.id==='t-mentor-refusal'));
 assert.equal(follow.world.tBreak,false);assert.ok(follow.world.fired.includes('break-word'));assert.ok(follow.world.teamTrust<covered.world.teamTrust);
});
test('one changed allocation shifts the operational problem and later choices',()=>{
 const noCover=simulate(route('tim',{'t-plan':{coverage:0,routing:2,mentoring:1}},e=>e.scene?.id==='t-cover-gap'));
 assert.equal(noCover.world.tBreak,true);assert.ok(noCover.world.queue>=2);
 const noRouting=simulate(route('tim',{'t-plan':{coverage:1,routing:0,mentoring:2},'t-queue':'wait'},e=>e.scene?.id==='t-overflow'));assert.equal(noRouting.scene.id,'t-overflow');assert.ok(noRouting.world.queue>=3);
 const unpreparedTest=simulate(route('priya',{'p-plan':{alternate:1,reviewer:2,validation:0}},e=>e.scene?.id==='p-validation-wait'));assert.equal(unpreparedTest.world.pValidated,false);assert.equal(unpreparedTest.world.pCheckScheduled,true);
});
test('earlier shifts affect willingness to supply records and the locked evidence is enforced',()=>{
 const r=route('campaign',{'t-board':'public','t-break':'later','t-break-conflict':'warn','t-help':'own','t-bonus':'rank','t-export':'approve','t-profile-found':'ignore','t-voice':'flag','t-trust-repair':'drop','t-contract':'memo','t-workaround':'memo','t-close':'reopen','p-confidence':'records'},e=>e.scene?.id==='p-records');
 const e=simulate(r);assert.ok(e.log.some(x=>x.id==='p-confidence'));assert.ok(e.world.teamTrust<=1);
 assert.equal(e.scene.records.find(x=>x.id==='account').locked,true);assert.equal(validAnswer(e.scene,['robot','account']),false);assert.throws(()=>commit(r,['robot','account']));
 const open=route('campaign',{},e=>e.scene?.id==='p-records');assert.equal(simulate(open).scene.records.find(x=>x.id==='account').locked,false);
});
test('preserving the decision basis opens a recovery choice that cannot be selected without it',()=>{
 const withCopy=simulate(route('tom',{'m-retain':'delete'},e=>e.scene?.id==='m-missing-file'));
 assert.equal(withCopy.scene.choices.find(c=>c.id==='recover').locked,false);
 const without=route('tom',{'m-records':['account','context'],'m-retain':'delete'},e=>e.scene?.id==='m-missing-file');
 assert.equal(simulate(without).scene.choices.find(c=>c.id==='recover').locked,true);assert.throws(()=>commit(without,'recover'));
 const recovered=simulate(route('tom',{'m-retain':'delete'}));assert.equal(recovered.world.mLost,false);assert.equal(recovered.world.mRecovered,true);
});
test('a later packet cannot contain records that the investigation never acquired',()=>{
 const narrow=route('priya',{},e=>e.scene?.id==='p-share'),ev=simulate(narrow);
 assert.equal(ev.scene.records.find(r=>r.id==='identity').locked,true);assert.equal(ev.scene.records.find(r=>r.id==='pace').locked,true);assert.throws(()=>commit(narrow,['pace']));
 const authorized=route('priya',{'p-access':'request'},e=>e.scene?.id==='p-share');assert.equal(simulate(authorized).scene.records.find(r=>r.id==='identity').locked,false);
 const forwarded=commit(authorized,['identity']);assert.equal(simulate(forwarded).log.at(-1).policy,'violation');assert.equal(simulate(forwarded).scene.id,'p-disclosure');
 const weak=route('tom',{'m-assess':'intuition'},e=>e.scene?.id==='m-return');assert.equal(simulate(weak).scene.choices.find(c=>c.id==='concrete').locked,true);assert.throws(()=>commit(weak,'concrete'));
});
test('an ineffective reviewer creates another problem and a remedy requires implementation',()=>{
 const powerless=simulate(route('tom',{'m-authority':'advisory'},e=>e.scene?.id==='m-authority-gap'));assert.equal(powerless.world.mAuthority,false);
 const repaired=simulate(route('tom',{'m-authority':'advisory'}));assert.equal(repaired.world.mAuthorityRepaired,true);assert.equal(repaired.world.mReturn,true);
 const announcement=simulate(route('tom',{'m-return':'announce'}));assert.equal(announcement.world.mReturn,false);assert.equal(announcement.world.mRemedy,false);assert.equal(announcement.ending,'m-last');
});
test('endings tell the resulting story without echoing choices or planning numbers',()=>{
 for(const args of Object.values(fixtures)){const text=endingStory(route(...args)).paragraphs.join('\n');assert.doesNotMatch(text,/you chose|your choice|planning slot|decisions brought you/i);assert.doesNotMatch(text,/undefined|NaN/);}
 const a=endingStory(route('tim')).paragraphs.join(),b=endingStory(route('tim',{'t-break':'later'})).paragraphs.join();assert.notEqual(a,b);assert.match(b,/bottle|conversation|argument/);
 const returned=endingStory(route('tom')).paragraphs.join();assert.match(returned,/first morning back/);
});
test('rewind and restore recompute emotions, delayed ripples, and later chapters',()=>{
 const r=route('campaign',{'t-break':'later'}),e=simulate(r),point=e.log.find(x=>x.id==='t-break'),back=rewind(r,point.eventIndex),ev=simulate(back);
 assert.equal(ev.scene.id,'t-break');assert.equal(ev.world.pending.length,0);assert.ok(!ev.world.fired.includes('break-word'));assert.notEqual(ev.world.people.tim.mood,'angry');assert.equal(ev.chapter,'tim');
 const state={version:4,run:r,archive:[r],discoveries:['w-next','invented']};const restored=restoreApp(JSON.stringify(state));assert.deepEqual(simulate(restored.run).world,e.world);
 assert.deepEqual(restored.discoveries,['w-next']);state.run={...back,events:[...back.events,{id:'made-up',answer:'public'}]};assert.equal(restoreApp(state).run.events.length,back.events.length);assert.equal(restoreApp('{broken').run,null);
});
function possible(s){
 if(s.type==='allocation'){const out=[];for(let a=0;a<=3;a++)for(let b=0;b<=3-a;b++)for(let c=0;c<=3-a-b;c++)out.push(Object.fromEntries(s.items.map((x,i)=>[x.id,[a,b,c][i]])));return out;}
 if(s.type==='records')return Array.from({length:2**s.records.length},(_,mask)=>s.records.filter((_,i)=>mask&(1<<i)).map(x=>x.id)).filter(a=>validAnswer(s,a));
 return s.choices.filter(x=>!x.locked).map(x=>x.id);
}
test('reachable worlds exercise all 52 scenes and every available alternative remains defined',()=>{
 let seed=27631;const random=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);const contexts=new Map();
 const capture=r=>{const e=simulate(r);if(e.scene)contexts.set(e.scene.id,e.world);};
 for(const args of Object.values(fixtures)){const r=route(...args);for(const entry of simulate(r).log)capture(rewind(r,entry.eventIndex));}
 for(let trial=0;trial<150;trial++){
  let r=freshRun(['tim','priya','tom'][trial%3]);
  for(let beat=0;beat<60;beat++){const ev=simulate(r);if(ev.stage==='ending')break;capture(r);const options=possible(ev.scene);assert.ok(options.length);r=continueRun(commit(r,options[Math.floor(random()*options.length)]));if(beat===59)assert.fail('Route looped');}
 }
 assert.equal(contexts.size,52,[...scenes.filter(s=>!contexts.has(s.id)).map(s=>s.id)].join(','));let count=0;
 for(const [id,w] of contexts){const s=sceneById(id,w);for(const a of possible(s)){
   const result=applyAnswer(s,a,w);count++;assert.ok(result.next===null||sceneById(result.next),id);assert.ok(result.result.event.length>20);assert.ok(result.result.why.length>20);assert.ok(moodLabel[result.world.people[s.chapter].mood]);assert.ok(result.result.changes.length||result.result.reaction.quote!==w.people[s.chapter].quote,id);assert.ok(result.world.queue>=0&&result.world.queue<=4);assert.ok(result.world.teamTrust>=0&&result.world.teamTrust<=4);assert.equal(signals(result.world,s.chapter).length,5);
 }}assert.ok(count>180);
});
test('the journal retains decisions and effects outside the ending story',()=>{const text=exportJournal(route('tim',{'t-break':'later'}));assert.match(text,/Ask him to wait/);assert.match(text,/Worker reaction/);assert.match(text,/Tim’s mood/);assert.match(text,/V4/);assert.doesNotMatch(text,/undefined/);});
test('the portable local server supplies the complete V4 and excludes project files',async()=>{const server=createServer();await new Promise(r=>server.listen(0,'127.0.0.1',r));try{const u=`http://127.0.0.1:${server.address().port}`;assert.match(await(await fetch(u+'/story.html')).text(),/v4-app.mjs/);for(const name of ['v4.css','v4-app.mjs','v4-game.mjs','v4-engine.mjs','v4-world.mjs','v4-ui.mjs','game.mjs'])assert.equal((await fetch(u+'/'+name)).status,200,name);for(const name of ['package.json','server.mjs','Start-Next-Shift.ps1'])assert.equal((await fetch(u+'/'+name)).status,404);}finally{server.closeAllConnections();await new Promise(r=>server.close(r));}});

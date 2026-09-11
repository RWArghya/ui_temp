/* Other people's accounts — the sponsors, mentors, mappings and tickets that make the
   Enabler's queues read as a portfolio rather than a demo of one.

   Everything here was previously hardcoded in enabler.html, with the sponsor list
   duplicated a second time in participants.html — two copies that could silently
   disagree. One definition now, consumed by both.

   Dates are relative. Absolute ones ("2026-08-21") read correctly the week they're
   written and are obviously stale a month later.

   Load order: after data.js (needs INITIATIVES) and programs.js (needs PARTICIPANT_MID). */

const daysAgo = n => new Date(Date.now() - n * 86400000).toISOString().slice(0,10);

/* ---------- sponsors ---------- */
const SEED_SPONSORS = [
  { org:'NTPC Limited', contact:'Vivek Ranjan', hq:'India — North',
    programs:[{ pid:'innovation',  stage:'live',     target:'5,000–50,000' }] },
  { org:'Snap Inc.',    contact:'Lea Fournier', hq:'APAC',
    programs:[{ pid:'evangelism',  stage:'outreach', target:'500–5,000' }] },
  { org:'Samsung R&D',  contact:'Hyun Park',    hq:'India — South',
    programs:[{ pid:'recruitment', stage:'closed',   target:'5,000–50,000' }] },
  { org:'Godrej',       contact:'Anita Shah',   hq:'India — West',
    programs:[{ pid:'recruitment', stage:'scoped',   target:'500–5,000' }] }
];

const seedKey = (org, pid) => org + '::' + pid;

/* every seeded program, flattened, with the Enabler's own stage/link overrides applied */
function seedPrograms(){
  const stages = (typeof S !== 'undefined' ? S.read().enablerStages : {}) || {};
  const specs  = (typeof S !== 'undefined' ? S.read().enablerSpecs  : {}) || {};
  return SEED_SPONSORS.flatMap(sp => sp.programs.map(pr => {
    const key = seedKey(sp.org, pr.pid);
    return {
      key, org:sp.org, contact:sp.contact, hq:sp.hq, pid:pr.pid,
      spec: Object.assign(
        { scoped:true, approved:true, outreachApproved:true, participants:pr.target, org:sp.org },
        { stage: stages[key] || pr.stage },
        specs[key] || {})
    };
  }));
}
/* the one lookup participants.html needs — no second copy of the sponsor list */
const seedSpec = key => (seedPrograms().find(p => p.key === key) || {}).spec || {};
const seedOrg  = key => (seedPrograms().find(p => p.key === key) || {}).org || key.split('::')[0];

/* ---------- mentor applications ---------- */
const SEED_MENTORS = [
  { id:'s1', name:'Rhea Kulkarni', email:'rhea@google.com', title:'Staff ML Engineer', org:'Google',
    years:'9–14', roles:['mentor','evaluator'], areas:['AI / GenAI','Agentic AI','Cloud'],
    hours:'5–10 hrs / month', days:4, source:'partner', status:'pending',
    bio:'Judged 4 GenAI hackathons. Built the eval harness for our internal model bake-offs.' },
  { id:'s2', name:'Dev Anand', email:'dev.anand@gmail.com', title:'Freelance developer', org:'Independent',
    years:'2–4', roles:['evaluator'], areas:['Web3','Blockchain'],
    hours:'2–4 hrs / month', days:3, source:'organic', status:'pending',
    bio:'Active in three DAO communities, shipped two mainnet contracts.' },
  { id:'s3', name:'Meera Iyer', email:'meera@npci.org.in', title:'Principal Architect', org:'NPCI',
    years:'15+', roles:['mentor','evaluator'], areas:['FinTech','Cybersecurity','Data Science'],
    hours:'2–4 hrs / month', days:3, source:'partner', status:'pending',
    bio:'Designed fraud-scoring pipelines at national scale.' },
  { id:'s4', name:'Tanmay Bose', email:'tanmay@iitkgp.ac.in', title:'PhD candidate', org:'IIT Kharagpur',
    years:'2–4', roles:['mentor'], areas:['Robotics','IoT'],
    hours:'10+ hrs / month', days:2, source:'invited', status:'pending',
    bio:'Runs the campus robotics club, mentored 40+ student teams.' },
  { id:'s5', name:'Arjun Rao', email:'arjun.rao@outlook.com', title:'Product Manager', org:'—',
    years:'5–8', roles:['evaluator'], areas:['Product','UI/UX'],
    hours:'2–4 hrs / month', days:2, source:'organic', status:'pending', bio:'' },
  { id:'s6', name:'Fatima Sheikh', email:'fatima@samsung.com', title:'Engineering Manager', org:'Samsung R&D',
    years:'9–14', roles:['mentor','evaluator'], areas:['AI / GenAI','Data Science'],
    hours:'5–10 hrs / month', days:7, source:'partner', status:'approved',
    bio:'Runs PRISM evaluations internally.' }
].map(m => Object.assign(m, { submitted: daysAgo(m.days) }));

const seedMentor = id => SEED_MENTORS.find(m => m.id === id) || {};

/* ---------- challenge mappings ----------
   Point at real initiatives chosen from the dataset rather than hardcoded ids that
   go stale the moment the dataset changes, and derive the overlap instead of
   restating it (a hand-typed overlap can contradict the mentor's actual expertise). */
function seedMappings(){
  if (typeof INITIATIVES === 'undefined') return [];
  const targets = INITIATIVES
    .filter(o => o.status !== 'past' && !o.sponsored && ['competing','learncompete'].includes(o.purpose))
    .slice(0, 2);
  if (!targets.length) return [];
  const pairs = [
    { id:'m1', mentor:'s6', at:0, status:'requested' },
    { id:'m2', mentor:'s6', at:1, status:'approved'  },
    { id:'m3', mentor:'s3', at:1, status:'requested' }
  ];
  return pairs.filter(p => targets[p.at]).map(p => {
    const m = seedMentor(p.mentor), o = targets[p.at];
    return { id:p.id, mentor:m.name, initiative:o.id, status:p.status,
             areas:(m.areas || []).filter(a => o.areas.includes(a)) };
  });
}

/* ---------- support tickets ---------- */
function seedTickets(){
  const t = seedPrograms();
  const godrej = t.find(x => x.org === 'Godrej');
  const first = (typeof INITIATIVES !== 'undefined'
    ? INITIATIVES.filter(o => o.status === 'live' && o.purpose === 'competing')[0] : null);
  return [
    { id:'#H2S-24118', type:'support', status:'in-progress', persona:'innovator', from:'Nikhil Verma',
      org:'VIT Vellore', subject:"Can't submit — deadline passed but I have an extension",
      created:daysAgo(2), page:first ? 'workspace · ' + first.name + ' · Submit' : 'workspace',
      transcript:[{from:'me',text:'my submit button is gone'},
                  {from:'bot',text:'Submissions close at the deadline shown on the event page.'},
                  {from:'me',text:'but the organiser gave our team an extension'}] },
    { id:'#H2S-24090', type:'demo', status:'resolved', persona:'sponsor',
      from:godrej ? godrej.contact : 'Anita Shah', org:godrej ? godrej.org : 'Godrej',
      subject:'Demo request — ' + (godrej ? godrej.org : 'Godrej'), created:daysAgo(6) },
    { id:'#H2S-24076', type:'support', status:'open', persona:'mentor', from:seedMentor('s3').name,
      org:seedMentor('s3').org, subject:'Approved as evaluator but my queue is empty',
      created:daysAgo(1), page:'app.html?view=mentor',
      transcript:[{from:'me',text:'I was approved last week but I have nothing to score'},
                  {from:'bot',text:"Submissions are only routed for challenges you're approved on."},
                  {from:'me',text:'I requested one three days ago'}] }
  ];
}

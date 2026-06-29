import { useState, useEffect, useRef } from "react";

// ── Constants ─────────────────────────────────────────────────────────────────
const LANGS  = { EN:"en", JA:"ja" };
const MODES  = { W2M:"w2m", M2W:"m2w" };
const VIEWS  = { HOME:"home", DAILY:"daily", HISTORY:"history", SRS:"srs", STATS:"stats", FAVS:"favs", INFINITE:"infinite", MISTAKES:"mistakes" };
const DAILY_COUNT  = 10;
const TODAY        = new Date().toISOString().slice(0,10);
// SRS intervals: level 0=1d, 1=3d, 2=7d, 3=14d, 4=30d, 5=60d, 6=90d (all ≥1 day)
const SRS_INTERVALS= [1440,4320,10080,20160,43200,86400,129600]; // minutes

const TOEIC_BANDS = [
  {min:100,max:200,label:"100–200",color:"#94a3b8"},
  {min:200,max:300,label:"200–300",color:"#6ee7b7"},
  {min:300,max:400,label:"300–400",color:"#4ade80"},
  {min:400,max:500,label:"400–500",color:"#a3e635"},
  {min:500,max:600,label:"500–600",color:"#facc15"},
  {min:600,max:700,label:"600–700",color:"#fb923c"},
  {min:700,max:800,label:"700–800",color:"#f87171"},
  {min:800,max:900,label:"800–900",color:"#e879f9"},
  {min:900,max:991,label:"900–990",color:"#a78bfa"},
];
function toeicBand(s){return TOEIC_BANDS.find(b=>s>=b.min&&s<b.max)||TOEIC_BANDS[0];}

// ── Fallback bank (with romaji) ───────────────────────────────────────────────
const FALLBACK_BANK=[
  {en:"river",   ja:"かわ",        romaji:"kawa",       enMeaning:"河流",  jaMeaning:"河流",  toeic:200},
  {en:"bridge",  ja:"はし",        romaji:"hashi",      enMeaning:"橋",    jaMeaning:"橋",    toeic:300},
  {en:"mountain",ja:"やま",        romaji:"yama",       enMeaning:"山",    jaMeaning:"山",    toeic:200},
  {en:"rain",    ja:"あめ",        romaji:"ame",        enMeaning:"雨",    jaMeaning:"雨",    toeic:100},
  {en:"wind",    ja:"かぜ",        romaji:"kaze",       enMeaning:"風",    jaMeaning:"風",    toeic:200},
  {en:"ocean",   ja:"うみ",        romaji:"umi",        enMeaning:"海洋",  jaMeaning:"海洋",  toeic:300},
  {en:"forest",  ja:"もり",        romaji:"mori",       enMeaning:"森林",  jaMeaning:"森林",  toeic:300},
  {en:"door",    ja:"ドア",        romaji:"doa",        enMeaning:"門",    jaMeaning:"門",    toeic:100},
  {en:"window",  ja:"まど",        romaji:"mado",       enMeaning:"窗戶",  jaMeaning:"窗戶",  toeic:100},
  {en:"clock",   ja:"とけい",      romaji:"tokei",      enMeaning:"時鐘",  jaMeaning:"時鐘",  toeic:200},
  {en:"bag",     ja:"かばん",      romaji:"kaban",      enMeaning:"袋子",  jaMeaning:"袋子",  toeic:100},
  {en:"key",     ja:"かぎ",        romaji:"kagi",       enMeaning:"鑰匙",  jaMeaning:"鑰匙",  toeic:200},
  {en:"money",   ja:"おかね",      romaji:"okane",      enMeaning:"金錢",  jaMeaning:"金錢",  toeic:100},
  {en:"train",   ja:"でんしゃ",    romaji:"densha",     enMeaning:"電車",  jaMeaning:"電車",  toeic:200},
  {en:"airport", ja:"くうこう",    romaji:"kuukou",     enMeaning:"機場",  jaMeaning:"機場",  toeic:400},
  {en:"schedule",ja:"スケジュール",romaji:"sukejuuru",  enMeaning:"時程表",jaMeaning:"時程表",toeic:500},
  {en:"budget",  ja:"よさん",      romaji:"yosan",      enMeaning:"預算",  jaMeaning:"預算",  toeic:500},
  {en:"contract",ja:"けいやく",    romaji:"keiyaku",    enMeaning:"合約",  jaMeaning:"合約",  toeic:600},
  {en:"strategy",ja:"せんりゃく",  romaji:"senryaku",   enMeaning:"策略",  jaMeaning:"策略",  toeic:700},
  {en:"revenue", ja:"しゅうにゅう",romaji:"shuunyuu",   enMeaning:"收益",  jaMeaning:"收益",  toeic:700},
  {en:"acquire", ja:"しゅとく",    romaji:"shutoku",    enMeaning:"取得",  jaMeaning:"取得",  toeic:800},
  {en:"efficient",ja:"こうりつてき",romaji:"kouritsuteki",enMeaning:"有效率",jaMeaning:"有效率",toeic:600},
  {en:"proposal",ja:"ていあん",    romaji:"teian",      enMeaning:"提案",  jaMeaning:"提案",  toeic:600},
  {en:"negotiate",ja:"こうしょう", romaji:"koushou",    enMeaning:"談判",  jaMeaning:"談判",  toeic:700},
  {en:"conference",ja:"かいぎ",   romaji:"kaigi",      enMeaning:"會議",  jaMeaning:"會議",  toeic:500},
  {en:"deadline",ja:"しめきり",    romaji:"shimekiri",  enMeaning:"截止日",jaMeaning:"截止日",toeic:500},
  {en:"implement",ja:"じっし",     romaji:"jisshi",     enMeaning:"實施",  jaMeaning:"實施",  toeic:700},
  {en:"initiative",ja:"しゅどうけん",romaji:"shudouken",enMeaning:"主動權",jaMeaning:"主動權",toeic:800},
  {en:"proficient",ja:"じゅくれん",romaji:"jukuren",    enMeaning:"熟練",  jaMeaning:"熟練",  toeic:800},
  {en:"hotel",   ja:"ホテル",      romaji:"hoteru",     enMeaning:"飯店",  jaMeaning:"飯店",  toeic:200},
];

// ── Helpers ───────────────────────────────────────────────────────────────────
function shuffle(arr){const a=[...arr];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
const LS={
  get:(k,d)=>{try{const v=localStorage.getItem(k);return v?JSON.parse(v):d;}catch{return d;}},
  set:(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v));}catch{}},
};
function speak(text,lang){
  if(!window.speechSynthesis)return;
  window.speechSynthesis.cancel();
  const u=new SpeechSynthesisUtterance(text);
  u.lang=lang===LANGS.EN?"en-US":"ja-JP";
  u.rate=0.85;
  window.speechSynthesis.speak(u);
}
function msNow(){return Date.now();}
function minutesFromNow(m){return msNow()+m*60000;}

// ── All used words (never repeat) ────────────────────────────────────────────
function getAllUsed(){
  // union of manually tracked + SRS keys
  const manual=LS.get("all_used_words",[]);
  const srsKeys=Object.keys(LS.get("srs_cards",{}));
  return [...new Set([...manual,...srsKeys])];
}
function markUsed(words){
  const prev=LS.get("all_used_words",[]);
  const next=[...new Set([...prev,...words.map(w=>w.en)])].slice(-500);
  LS.set("all_used_words",next);
}

// ── SRS ───────────────────────────────────────────────────────────────────────
function getSRSCards(){return LS.get("srs_cards",{});}
function saveSRSCards(c){LS.set("srs_cards",c);}
function addWordsToSRS(words){
  const cards=getSRSCards();let ch=false;
  words.forEach(w=>{if(!cards[w.en]){cards[w.en]={...w,level:0,nextReview:msNow(),seen:0,correct:0};ch=true;}});
  if(ch)saveSRSCards(cards);
}
// rating: "forgot"(不知道) | "unsure"(不確定) | "knew"(認識)
function updateSRSCard(en, rating){
  const cards=getSRSCards();const c=cards[en];if(!c)return;
  c.seen=(c.seen||0)+1;
  if(rating==="knew"){
    c.correct=(c.correct||0)+1;
    c.level=Math.min(6,(c.level||0)+2); // jump 2 levels
  } else if(rating==="unsure"){
    c.correct=(c.correct||0)+1;
    c.level=Math.min(6,(c.level||0)+1); // jump 1 level
  } else {
    c.level=Math.max(0,(c.level||0)-1); // drop 1 level, still ≥1 day
  }
  c.nextReview=minutesFromNow(SRS_INTERVALS[c.level]||129600);
  cards[en]=c;saveSRSCards(cards);
}
function getDueCards(){const cards=getSRSCards();const now=msNow();return Object.values(cards).filter(c=>c.nextReview<=now);}
function getSRSStats(){
  const cards=Object.values(getSRSCards());
  const byLevel={0:0,1:0,2:0,3:0,4:0,5:0,6:0};
  cards.forEach(c=>{byLevel[c.level||0]++;});
  return{total:cards.length,byLevel,mastered:cards.filter(c=>c.level>=5).length,due:getDueCards().length};
}

// ── Mistake book ──────────────────────────────────────────────────────────────
// mistakes: { [en]: {word, count, lastWrong} }
function getMistakes(){return LS.get("mistake_book",{});}
function addMistake(word){
  const m=getMistakes();
  const key=word.en;
  m[key]={word,count:(m[key]?.count||0)+1,lastWrong:TODAY};
  LS.set("mistake_book",m);
}
function clearMistake(en){
  const m=getMistakes();delete m[en];LS.set("mistake_book",m);
}
function getMistakeList(){return Object.values(getMistakes()).sort((a,b)=>b.count-a.count);}

// ── Heatmap helpers ───────────────────────────────────────────────────────────
function getHeatmapData(){
  // returns Map: date -> {done, count}
  const map={};
  for(let i=0;i<localStorage.length;i++){
    const k=localStorage.key(i);
    if(k&&k.startsWith("daily_")){
      const v=LS.get(k,null);
      if(v?.words){
        const date=k.replace("daily_","");
        map[date]={done:(v.cursor||0)>=DAILY_COUNT,count:v.words.length};
      }
    }
  }
  return map;
}

// ── TOEIC score prediction ────────────────────────────────────────────────────
function predictTOEIC(){
  const cards=Object.values(getSRSCards());
  if(cards.length<5)return null;
  // weighted score: each card contributes its toeic * (level/6) weight
  let weightedSum=0,totalWeight=0;
  cards.forEach(c=>{
    const w=(c.level||0)/6;
    weightedSum+=(c.toeic||300)*w;
    totalWeight+=w;
  });
  if(totalWeight===0)return null;
  const base=weightedSum/totalWeight;
  // also factor in total vocab coverage
  const coverage=Math.min(1,cards.length/300);
  const predicted=Math.round((base*0.7+base*coverage*0.3)/10)*10;
  return Math.min(990,Math.max(100,predicted));
}

// ── AI fetch (Gemini) ─────────────────────────────────────────────────────────
async function fetchWords({usedEnWords=[],count=15,toeicMin=null,toeicMax=null,retries=3}={}){
  const usedStr=usedEnWords.slice(-100).join(", ");
  const toeicRule=toeicMin!=null
    ?`IMPORTANT: ALL words must have toeic value between ${toeicMin} and ${toeicMax-1} (${toeicMin}–${toeicMax} band ONLY).`
    :"Mix difficulty levels across all TOEIC bands.";
  const prompt=`Generate exactly ${count} vocabulary word pairs for bilingual English-Japanese study.
Return ONLY a valid JSON array. No markdown, no backticks, no explanation whatsoever.
Each object must have these EXACT keys:
- "en": single English word (noun/verb/adjective)
- "ja": Japanese in hiragana or katakana
- "romaji": romanized pronunciation of the Japanese (e.g. "sakura", "shigoto")
- "enMeaning": Traditional Chinese (繁體中文), 2–5 characters
- "jaMeaning": same as enMeaning
- "toeic": integer — START of 100-point TOEIC band (100/200/300/400/500/600/700/800/900)
- "exampleEn": a short natural English example sentence using the word (max 12 words)
- "exampleJa": the same sentence translated into natural Japanese

${toeicRule}
Do NOT use any of these words: ${usedStr||"none"}

Return ONLY the JSON array:`;

  const apiKey=import.meta.env.VITE_GEMINI_API_KEY||"";
  const url=`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

  for(let i=0;i<retries;i++){
    try{
      if(!apiKey)throw new Error("no api key");
      const res=await fetch(url,{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({
          contents:[{parts:[{text:prompt}]}],
          generationConfig:{temperature:0.9,maxOutputTokens:2000},
        }),
      });
      if(!res.ok)throw new Error(`HTTP ${res.status}`);
      const data=await res.json();
      if(data.error)throw new Error(data.error.message);
      const raw=data.candidates?.[0]?.content?.parts?.[0]?.text||"";
      const s=raw.indexOf("["),e=raw.lastIndexOf("]");
      if(s===-1||e===-1)throw new Error("no array");
      const words=JSON.parse(raw.slice(s,e+1));
      if(!Array.isArray(words)||words.length<5)throw new Error("too few");
      return words.map(w=>({...w,toeic:Number(w.toeic)||300,romaji:w.romaji||"",exampleEn:w.exampleEn||"",exampleJa:w.exampleJa||""}));
    }catch(err){
      if(i===retries-1)throw err;
      await new Promise(r=>setTimeout(r,900*(i+1)));
    }
  }
}

function buildOptions(pool,correct,lang,mode){
  const others=shuffle(pool.filter(w=>w.en!==correct.en)).slice(0,3);
  return shuffle([correct,...others]).map(w=>
    mode===MODES.W2M
      ?(lang===LANGS.EN?w.enMeaning:w.jaMeaning)
      :(lang===LANGS.EN?w.en:w.ja)
  );
}

// ════════════════════════════════════════════════════════════════════════════
// UI Atoms
// ════════════════════════════════════════════════════════════════════════════
function BackBtn({onClick,label="← 返回"}){return <button onClick={onClick} style={S.backBtn}>{label}</button>;}
function ProgBar({value,max,color}){return(
  <div style={{width:"100%",maxWidth:460,height:4,background:"#1a1a2e",borderRadius:99}}>
    <div style={{height:"100%",borderRadius:99,background:color,transition:"width .35s",width:`${Math.min(100,(value/Math.max(1,max))*100)}%`}}/>
  </div>
);}
function StarBtn({active,onClick}){return(
  <button onClick={onClick} style={{background:"transparent",border:"none",cursor:"pointer",fontSize:"1.4rem",lineHeight:1,padding:"2px 4px",color:active?"#facc15":"#2a2a42",transition:"color .2s,transform .15s",transform:active?"scale(1.25)":"scale(1)"}}>★</button>
);}
function ToeicTag({score}){
  if(!score)return null;
  const b=toeicBand(score);
  return <span style={{fontSize:"0.58rem",fontWeight:600,color:b.color,background:b.color+"18",border:`1px solid ${b.color}44`,borderRadius:99,padding:"2px 7px",letterSpacing:"0.04em",whiteSpace:"nowrap"}}>TOEIC {b.label}</span>;
}

// ── Word display: shows en or ja+romaji depending on lang ──────────────────
function WordDisplay({word,lang,fontSize,accent}){
  const isEN=lang===LANGS.EN;
  if(isEN){
    return <span style={{fontSize:fontSize||"2.4rem",fontWeight:800,color:"#f0f0ff",lineHeight:1.1}}>{word.en}</span>;
  }
  return(
    <div>
      <div style={{fontSize:fontSize||"2.2rem",fontWeight:800,color:"#f0f0ff",lineHeight:1.1}}>{word.ja}</div>
      {word.romaji&&<div style={{fontSize:"0.85rem",color:accent||"#60a5fa",marginTop:3,letterSpacing:"0.05em"}}>{word.romaji}</div>}
    </div>
  );
}

// ── Meaning display ─────────────────────────────────────────────────────────
function MeaningDisplay({word,lang}){
  return <span>{lang===LANGS.EN?word.enMeaning:word.jaMeaning}</span>;
}

// ════════════════════════════════════════════════════════════════════════════
// SpellingPractice — appears after selecting wrong answer
// ════════════════════════════════════════════════════════════════════════════
function SpellingPractice({word,lang,accent,onDone}){
  const isEN=lang===LANGS.EN;
  const [input,setInput]=useState("");
  const [result,setResult]=useState(null); // null | "correct" | "wrong"
  const target=isEN?word.en:word.romaji; // EN: spell the word; JA: type romaji
  const placeholder=isEN?"輸入英文單字…":"輸入羅馬拼音…";

  const check=()=>{
    const correct=input.trim().toLowerCase()===target.toLowerCase();
    setResult(correct?"correct":"wrong");
  };

  return(
    <div style={{background:"#0d0d1a",border:`1px solid ${accent}44`,borderRadius:12,padding:"12px 14px",display:"flex",flexDirection:"column",gap:8}}>
      <div style={{fontSize:"0.65rem",color:accent,textTransform:"uppercase",letterSpacing:"0.08em"}}>
        ✏️ {isEN?"拼寫練習":"羅馬拼音練習"}
      </div>
      <div style={{fontSize:"0.8rem",color:"#888"}}>
        {isEN?`請拼出「${word.enMeaning}」的英文`:`請輸入「${word.ja}」的羅馬拼音`}
      </div>
      {result===null&&(
        <div style={{display:"flex",gap:8}}>
          <input
            value={input} onChange={e=>setInput(e.target.value)}
            onKeyDown={e=>e.key==="Enter"&&check()}
            placeholder={placeholder}
            style={{flex:1,background:"#17172a",border:`1px solid ${accent}44`,borderRadius:8,padding:"8px 12px",color:"#f0f0ff",fontSize:"0.9rem",outline:"none",fontFamily:"'Inter',sans-serif"}}
            autoFocus
          />
          <button onClick={check} style={{background:accent,border:"none",borderRadius:8,padding:"0 14px",color:"#0d0d14",fontWeight:700,fontSize:"0.82rem",cursor:"pointer"}}>確認</button>
        </div>
      )}
      {result==="correct"&&(
        <div style={{color:"#4ade80",fontSize:"0.85rem",fontWeight:600}}>✓ 正確！「{target}」</div>
      )}
      {result==="wrong"&&(
        <div>
          <div style={{color:"#f87171",fontSize:"0.85rem"}}>✗ 答案是「<span style={{fontWeight:700,color:"#f0f0ff"}}>{target}</span>」</div>
          <div style={{fontSize:"0.75rem",color:"#555",marginTop:3}}>你輸入了：{input}</div>
        </div>
      )}
      {result!==null&&(
        <button onClick={onDone} style={{background:"transparent",border:`1px solid ${accent}44`,borderRadius:8,padding:"7px",color:accent,fontSize:"0.78rem",cursor:"pointer",marginTop:2}}>繼續 →</button>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// LearnCard
// ════════════════════════════════════════════════════════════════════════════
function LearnCard({word,pool,lang,onLangToggle,mode,onNext,onToggleFav,isFav,accent,onAnswer}){
  const [options,setOptions]=useState([]);
  const [selected,setSelected]=useState(null);
  const [revealed,setRevealed]=useState(false);
  const [speaking,setSpeaking]=useState(false);
  const [showSpelling,setShowSpelling]=useState(false);
  const [spellingDone,setSpellingDone]=useState(false);
  const isEN=lang===LANGS.EN;

  useEffect(()=>{
    if(pool.length>=4)setOptions(buildOptions(pool,word,lang,mode));
    setSelected(null);setRevealed(false);setShowSpelling(false);setSpellingDone(false);
  },[word?.en,lang,mode]);

  const renderQuestion=()=>{
    if(mode===MODES.W2M){
      return(
        <div style={{flex:1}}>
          <WordDisplay word={word} lang={lang} accent={accent}/>
          <div style={{marginTop:6,display:"flex",gap:6,alignItems:"center",flexWrap:"wrap"}}>
            <ToeicTag score={word.toeic}/>
            <span style={{fontSize:"0.72rem",color:"#2a2a45"}}>
              {isEN?`日：${word.ja} (${word.romaji||""})`:  `EN：${word.en}`}
            </span>
          </div>
          {(isEN?word.exampleEn:word.exampleJa)&&(
            <div style={{marginTop:8,padding:"7px 10px",background:"#0d0d1a",borderRadius:8,border:"1px solid #1e1e2e"}}>
              <div style={{fontSize:"0.66rem",color:"#444",textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:3}}>例句</div>
              <div style={{fontSize:"0.78rem",color:"#9090bb",lineHeight:1.5}}>{isEN?word.exampleEn:word.exampleJa}</div>
              {(isEN?word.exampleJa:word.exampleEn)&&(
                <div style={{fontSize:"0.7rem",color:"#444",marginTop:3,lineHeight:1.4}}>{isEN?word.exampleJa:word.exampleEn}</div>
              )}
            </div>
          )}
        </div>
      );
    } else {
      return(
        <div style={{flex:1}}>
          <div style={{fontSize:"1.8rem",fontWeight:800,color:"#f0f0ff"}}>
            <MeaningDisplay word={word} lang={lang}/>
          </div>
        </div>
      );
    }
  };

  const getA=()=>mode===MODES.W2M
    ?(isEN?word.enMeaning:word.jaMeaning)
    :(isEN?word.en:word.ja);

  const handleSelect=(opt)=>{
    if(selected!==null)return;
    const correct=opt===getA();
    setSelected(opt);
    if(!correct){
      addMistake(word);
      setShowSpelling(true); // trigger spelling after wrong answer
    }
    if(onAnswer)onAnswer(correct?"knew":"forgot");
  };

  const speakWord=()=>{setSpeaking(true);speak(isEN?word.en:word.ja,lang);setTimeout(()=>setSpeaking(false),1200);};
  const canNext=(selected||revealed)&&(!showSpelling||spellingDone);

  return(
    <div style={{...S.card,borderColor:accent+"33"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div style={S.cardHint}>{mode===MODES.W2M?"這個單字的意思是？":"怎麼說這個意思？"}</div>
        <div style={{display:"flex",alignItems:"center",gap:6}}>
          {onLangToggle&&(
            <button onClick={onLangToggle} style={{...S.langToggle,borderColor:accent+"66",color:accent}}>
              {isEN?"EN→JA":"JA→EN"}
            </button>
          )}
          {onToggleFav&&<StarBtn active={isFav} onClick={onToggleFav}/>}
        </div>
      </div>

      <div style={S.questionRow}>
        {renderQuestion()}
        <button style={{...S.speakBtn,background:speaking?accent+"33":"#1a1a2e",borderColor:accent+"55"}} onClick={speakWord}>🔊</button>
      </div>

      <div style={{display:"flex",flexDirection:"column",gap:7}}>
        {options.map((opt,i)=>{
          const correct=opt===getA(),picked=selected===opt;
          let ex={};
          if(selected!==null){if(correct)ex=S.optCorrect;else if(picked)ex=S.optWrong;else ex=S.optDim;}
          return(
            <button key={i} style={{...S.optBtn,...ex}} onClick={()=>handleSelect(opt)}>
              <span>{opt}</span>
              {selected!==null&&correct&&(
                <span style={{marginLeft:"auto"}} onClick={e=>{e.stopPropagation();
                  const t=mode===MODES.W2M?(isEN?word.enMeaning:word.jaMeaning):(isEN?word.en:word.ja);
                  speak(t,lang);}}>🔊✓</span>
              )}
              {selected!==null&&picked&&!correct&&<span style={{marginLeft:"auto"}}>✗</span>}
            </button>
          );
        })}
      </div>

      {!selected&&!revealed&&<button style={S.revealBtn} onClick={()=>setRevealed(true)}>顯示答案</button>}
      {revealed&&!selected&&(
        <div style={{...S.answerBox,borderColor:accent+"66"}}>
          <div>
            {mode===MODES.W2M
              ?<MeaningDisplay word={word} lang={lang}/>
              :<WordDisplay word={word} lang={lang} fontSize="1.2rem" accent={accent}/>
            }
          </div>
          <button style={S.speakInline} onClick={()=>{
            const t=mode===MODES.W2M?(isEN?word.enMeaning:word.jaMeaning):(isEN?word.en:word.ja);
            speak(t,lang);
          }}>🔊</button>
        </div>
      )}

      {/* spelling practice after wrong answer */}
      {showSpelling&&!spellingDone&&(
        <SpellingPractice word={word} lang={lang} accent={accent} onDone={()=>setSpellingDone(true)}/>
      )}

      {canNext&&onNext&&(
        <button style={{...S.nextBtnSm,background:accent,color:"#0d0d14"}} onClick={onNext}>下一個 →</button>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// Mistakes View
// ════════════════════════════════════════════════════════════════════════════
function MistakesView({lang:initLang,onBack}){
  const [lang,setLang]=useState(initLang);
  const isEN=lang===LANGS.EN,accent="#f87171";
  const [mistakes,setMistakes]=useState(()=>getMistakeList());
  const [reviewing,setReviewing]=useState(null);
  const [cursor,setCursor]=useState(0);
  const [mode,setMode]=useState(MODES.W2M);
  const [anim,setAnim]=useState(false);
  const pool=mistakes.map(m=>m.word);

  const refresh=()=>setMistakes(getMistakeList());

  const isFav=(w)=>LS.get("vocab_favs",[]).some(f=>f.en===w.en);
  const toggleFav=(w)=>{
    const prev=LS.get("vocab_favs",[]);
    const next=prev.some(f=>f.en===w.en)?prev.filter(f=>f.en!==w.en):[...prev,w];
    LS.set("vocab_favs",next);
  };

  if(reviewing){
    const cur=reviewing[cursor];
    return(
      <div style={S.root}>
        <div style={{width:"100%",maxWidth:460,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <BackBtn onClick={()=>{setReviewing(null);setCursor(0);refresh();}} label="← 返回錯題本"/>
          <span style={{fontSize:"0.75rem",color:"#555"}}>{cursor+1}/{reviewing.length}</span>
          <button style={{...S.pill,fontSize:"0.72rem"}} onClick={()=>setMode(m=>m===MODES.W2M?MODES.M2W:MODES.W2M)}>
            {mode===MODES.W2M?"單字→意思":"意思→單字"}
          </button>
        </div>
        <ProgBar value={cursor+1} max={reviewing.length} color={accent}/>
        <div style={{opacity:anim?0:1,transform:anim?"translateY(12px) scale(0.97)":"translateY(0) scale(1)",transition:"opacity .22s,transform .22s",width:"100%",maxWidth:460}}>
          <LearnCard word={cur} pool={pool} lang={lang} mode={mode}
            onLangToggle={()=>setLang(l=>l===LANGS.EN?LANGS.JA:LANGS.EN)}
            isFav={isFav(cur)} onToggleFav={()=>toggleFav(cur)} accent={accent}
            onAnswer={(r)=>{
              if(r==="knew")clearMistake(cur.en);
              updateSRSCard(cur.en,r);
            }}
            onNext={()=>{
              if(cursor+1>=reviewing.length){setReviewing(null);setCursor(0);refresh();return;}
              setAnim(true);setTimeout(()=>{setCursor(c=>c+1);setAnim(false);},240);
            }}/>
        </div>
      </div>
    );
  }

  if(mistakes.length===0)return(
    <div style={{...S.root,justifyContent:"center",alignItems:"center",gap:12}}>
      <div style={{width:"100%",maxWidth:460}}><BackBtn onClick={onBack}/></div>
      <div style={{fontSize:"2.5rem",marginTop:24}}>🎯</div>
      <div style={{color:"#555"}}>目前沒有錯題記錄</div>
      <div style={{color:"#333",fontSize:"0.78rem"}}>答錯選擇題時會自動收集</div>
    </div>
  );

  return(
    <div style={S.root}>
      <div style={{width:"100%",maxWidth:460,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <BackBtn onClick={onBack}/>
        <span style={{fontSize:"0.85rem",fontWeight:700,color:"#e8e8f0"}}>錯題本</span>
        <button style={{...S.bigBtn,background:accent,color:"#0d0d14",fontSize:"0.78rem",padding:"7px 16px"}}
          onClick={()=>setReviewing(pool)}>全部重練</button>
      </div>
      <div style={{width:"100%",maxWidth:460,fontSize:"0.72rem",color:"#555"}}>
        共 {mistakes.length} 個弱點單字，答對後自動移除
      </div>
      <div style={{width:"100%",maxWidth:460,display:"flex",flexDirection:"column",gap:7}}>
        {mistakes.map(({word:w,count})=>(
          <div key={w.en} style={{background:"#11111d",border:"1px solid #f8717122",borderRadius:12,padding:"11px 14px",display:"flex",alignItems:"center",gap:10}}>
            <div style={{flex:1}}>
              <div style={{display:"flex",gap:10,alignItems:"baseline",flexWrap:"wrap"}}>
                <span style={{fontWeight:700,color:"#f0f0ff",fontSize:"1rem"}}>{isEN?w.en:w.ja}</span>
                {!isEN&&w.romaji&&<span style={{fontSize:"0.72rem",color:accent}}>{w.romaji}</span>}
                <span style={{fontSize:"0.78rem",color:"#f87171"}}>{isEN?w.enMeaning:w.jaMeaning}</span>
              </div>
              <div style={{display:"flex",gap:6,alignItems:"center",marginTop:4,flexWrap:"wrap"}}>
                <ToeicTag score={w.toeic}/>
                <span style={{fontSize:"0.65rem",color:"#555"}}>答錯 {count} 次</span>
                <span style={{fontSize:"0.65rem",color:"#2a2a3a"}}>{isEN?w.ja:w.en}</span>
              </div>
            </div>
            <button style={{...S.speakBtn,borderColor:"#f8717133",background:"#1a1a2e",flexShrink:0}}
              onClick={()=>speak(isEN?w.en:w.ja,lang)}>🔊</button>
          </div>
        ))}
      </div>
      <button style={{...S.bigBtn,background:"#1a1a2e",color:"#aaa",border:"1px solid #2e2e45",width:"100%",maxWidth:460}}
        onClick={()=>{mistakes.forEach(m=>clearMistake(m.word.en));refresh();}}>
        清空所有錯題
      </button>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// SRS View
// ════════════════════════════════════════════════════════════════════════════
function SRSView({lang:initLang,onBack}){
  const [lang,setLang]=useState(initLang);
  const isEN=lang===LANGS.EN,accent=isEN?"#60a5fa":"#f472b6";
  const [deck,setDeck]=useState(null);
  const [idx,setIdx]=useState(0);
  const [flipped,setFlipped]=useState(false);
  const [anim,setAnim]=useState(null);
  const [sess,setSess]=useState({knew:0,unsure:0,forgot:0});
  const [done,setDone]=useState(false);
  const [speaking,setSpeaking]=useState(false);

  useEffect(()=>{setDeck(shuffle(getDueCards()));},[]);
  if(!deck)return null;

  if(deck.length===0)return(
    <div style={{...S.root,justifyContent:"center",textAlign:"center",gap:16}}>
      <div style={{fontSize:"2.5rem"}}>🎯</div>
      <div style={{fontSize:"1.1rem",fontWeight:700,color:"#f0f0ff"}}>目前沒有待複習單字</div>
      <div style={{fontSize:"0.82rem",color:"#555",marginTop:4,maxWidth:320}}>SRS 系統會自動安排，最短間隔 1 天</div>
      <button style={{...S.bigBtn,background:accent,color:"#0d0d14",marginTop:8}} onClick={onBack}>返回主頁</button>
    </div>
  );

  if(done)return(
    <div style={{...S.root,justifyContent:"center",textAlign:"center",gap:14}}>
      <div style={{fontSize:"3rem"}}>🎉</div>
      <div style={{fontSize:"1.2rem",fontWeight:700,color:"#f0f0ff"}}>複習完成！</div>
      <div style={{display:"flex",gap:16,justifyContent:"center",marginTop:4}}>
        <div style={{textAlign:"center"}}>
          <div style={{fontSize:"1.4rem",fontWeight:800,color:"#4ade80"}}>{sess.knew}</div>
          <div style={{fontSize:"0.65rem",color:"#555"}}>認識</div>
        </div>
        <div style={{textAlign:"center"}}>
          <div style={{fontSize:"1.4rem",fontWeight:800,color:"#facc15"}}>{sess.unsure}</div>
          <div style={{fontSize:"0.65rem",color:"#555"}}>不確定</div>
        </div>
        <div style={{textAlign:"center"}}>
          <div style={{fontSize:"1.4rem",fontWeight:800,color:"#f87171"}}>{sess.forgot}</div>
          <div style={{fontSize:"0.65rem",color:"#555"}}>不知道</div>
        </div>
      </div>
      <div style={{fontSize:"0.72rem",color:"#444",marginTop:4}}>下次複習已依熟悉度自動安排（最短 1 天）</div>
      <button style={{...S.bigBtn,background:accent,color:"#0d0d14",marginTop:12}} onClick={onBack}>返回主頁</button>
    </div>
  );

  const cur=deck[idx];
  const advance=(rating)=>{
    updateSRSCard(cur.en,rating);
    setSess(s=>({...s,knew:s.knew+(rating==="knew"?1:0),unsure:s.unsure+(rating==="unsure"?1:0),forgot:s.forgot+(rating==="forgot"?1:0)}));
    setAnim(rating==="knew"?"right":rating==="forgot"?"left":"up");
    setTimeout(()=>{setAnim(null);setFlipped(false);if(idx+1>=deck.length)setDone(true);else setIdx(i=>i+1);},260);
  };

  const levelLabel=["新","初學","認識","熟悉","良好","精通","掌握"];
  const nextDays=(lvl)=>{const m=SRS_INTERVALS[Math.min(lvl,6)]||129600;return`${Math.round(m/1440)}天後`;};

  return(
    <div style={S.root}>
      <div style={{width:"100%",maxWidth:460,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <BackBtn onClick={onBack}/>
        <span style={{fontSize:"0.75rem",color:"#555"}}>{idx+1}/{deck.length} 待複習</span>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div style={{display:"flex",gap:8}}>
            <span style={{color:"#4ade80",fontSize:"0.72rem"}}>✓{sess.knew}</span>
            <span style={{color:"#facc15",fontSize:"0.72rem"}}>~{sess.unsure}</span>
            <span style={{color:"#f87171",fontSize:"0.72rem"}}>✗{sess.forgot}</span>
          </div>
          <button onClick={()=>setLang(l=>l===LANGS.EN?LANGS.JA:LANGS.EN)}
            style={{...S.langToggle,borderColor:accent+"66",color:accent}}>
            {isEN?"EN→JA":"JA→EN"}
          </button>
        </div>
      </div>
      <ProgBar value={idx} max={deck.length} color={accent}/>

      {/* level dots */}
      <div style={{width:"100%",maxWidth:460,display:"flex",alignItems:"center",gap:8}}>
        <div style={{display:"flex",gap:3}}>
          {[0,1,2,3,4,5,6].map(l=>(
            <div key={l} style={{width:20,height:4,borderRadius:99,background:l<=(cur.level||0)?accent:"#1a1a2e",transition:"background .3s"}}/>
          ))}
        </div>
        <span style={{fontSize:"0.64rem",color:"#555"}}>{levelLabel[cur.level||0]}</span>
      </div>

      {/* flashcard */}
      <div onClick={()=>setFlipped(f=>!f)} style={{
        ...S.fcCard,borderColor:accent+"44",
        opacity:anim?0:1,
        transform:anim==="right"?"translateX(70px) scale(0.94)":anim==="left"?"translateX(-70px) scale(0.94)":anim==="up"?"translateY(-40px) scale(0.94)":"translateX(0) scale(1)",
      }}>
        <button style={{...S.speakBtn,position:"absolute",top:14,right:14,borderColor:accent+"44",background:"#1a1a2e"}}
          onClick={e=>{e.stopPropagation();setSpeaking(true);speak(isEN?cur.en:cur.ja,lang);setTimeout(()=>setSpeaking(false),1200);}}>🔊</button>

        {!flipped?(
          <div style={{textAlign:"center",width:"100%"}}>
            <div style={{fontSize:"0.6rem",color:"#444",textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:14}}>
              {isEN?"英文":"日文"}
            </div>
            {isEN
              ?<div style={{fontSize:"2.8rem",fontWeight:800,color:"#f0f0ff"}}>{cur.en}</div>
              :<div>
                <div style={{fontSize:"2.4rem",fontWeight:800,color:"#f0f0ff"}}>{cur.ja}</div>
                {cur.romaji&&<div style={{fontSize:"1rem",color:accent,marginTop:4,letterSpacing:"0.06em"}}>{cur.romaji}</div>}
              </div>
            }
            {isEN&&<div style={{marginTop:8}}><ToeicTag score={cur.toeic}/></div>}
            {/* example on front */}
            {(isEN?cur.exampleEn:cur.exampleJa)&&(
              <div style={{marginTop:12,padding:"7px 10px",background:"#0d0d1a",borderRadius:8,border:"1px solid #1e1e2e",textAlign:"left"}}>
                <div style={{fontSize:"0.62rem",color:"#333",textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:2}}>例句</div>
                <div style={{fontSize:"0.75rem",color:"#6060a0",lineHeight:1.5}}>{isEN?cur.exampleEn:cur.exampleJa}</div>
              </div>
            )}
            <div style={{fontSize:"0.64rem",color:"#2a2a3a",marginTop:12}}>點卡片翻面</div>
          </div>
        ):(
          <div style={{textAlign:"center",width:"100%"}}>
            <div style={{fontSize:"0.6rem",color:"#444",textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:14}}>意思</div>
            <div style={{fontSize:"2rem",fontWeight:700,color:accent}}>{isEN?cur.enMeaning:cur.jaMeaning}</div>
            <div style={{fontSize:"0.8rem",color:"#3a3a5a",marginTop:10}}>{isEN?`日：${cur.ja} (${cur.romaji||""})`:`EN：${cur.en}`}</div>
            {/* example on back */}
            {cur.exampleEn&&(
              <div style={{marginTop:12,padding:"7px 10px",background:"#0d0d1a",borderRadius:8,border:"1px solid #1e1e2e",textAlign:"left"}}>
                <div style={{fontSize:"0.75rem",color:"#6060a0",lineHeight:1.5}}>{isEN?cur.exampleEn:cur.exampleJa}</div>
                <div style={{fontSize:"0.68rem",color:"#333",marginTop:3,lineHeight:1.4}}>{isEN?cur.exampleJa:cur.exampleEn}</div>
              </div>
            )}
            {/* next interval hints */}
            <div style={{display:"flex",justifyContent:"space-around",marginTop:14,fontSize:"0.6rem",color:"#333"}}>
              <span>不知道→{nextDays(Math.max(0,(cur.level||0)-1))}</span>
              <span>不確定→{nextDays(Math.min(6,(cur.level||0)+1))}</span>
              <span>認識→{nextDays(Math.min(6,(cur.level||0)+2))}</span>
            </div>
          </div>
        )}
      </div>

      {flipped?(
        <div style={{display:"flex",gap:8,width:"100%",maxWidth:460}}>
          <button style={{...S.fcJudge,background:"#220d0d",border:"1px solid #ef4444",color:"#f87171",flex:1,fontSize:"0.82rem"}}
            onClick={()=>advance("forgot")}>✗<br/>不知道</button>
          <button style={{...S.fcJudge,background:"#1a1a0a",border:"1px solid #facc15",color:"#facc15",flex:1,fontSize:"0.82rem"}}
            onClick={()=>advance("unsure")}>~<br/>不確定</button>
          <button style={{...S.fcJudge,background:"#0b2218",border:"1px solid #22c55e",color:"#4ade80",flex:1,fontSize:"0.82rem"}}
            onClick={()=>advance("knew")}>✓<br/>認識</button>
        </div>
      ):<div style={{fontSize:"0.66rem",color:"#2a2a3a"}}>翻面後選擇</div>}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// Stats View
// ════════════════════════════════════════════════════════════════════════════
function StatsView({onBack}){
  const stats=getSRSStats();
  const levelLabels=["新單字","初學","認識","熟悉","良好","精通","掌握"];
  const levelColors=["#64748b","#60a5fa","#34d399","#4ade80","#a3e635","#facc15","#a78bfa"];
  const maxLevel=Math.max(...Object.values(stats.byLevel),1);
  const masteredPct=stats.total>0?Math.round((stats.mastered/stats.total)*100):0;
  const predicted=predictTOEIC();
  const predictedBand=predicted?toeicBand(predicted):null;
  const mistakeCount=getMistakeList().length;

  // heatmap: last 84 days (12 weeks × 7)
  const heatData=getHeatmapData();
  const heatDays=[];
  for(let i=83;i>=0;i--){
    const d=new Date();d.setDate(d.getDate()-i);
    const key=d.toISOString().slice(0,10);
    heatDays.push({key,done:heatData[key]?.done||false,studied:!!heatData[key]});
  }
  // pad to full weeks
  const firstDow=new Date(heatDays[0].key).getDay();
  const padded=[...Array(firstDow).fill(null),...heatDays];
  const weeks=[];
  for(let i=0;i<padded.length;i+=7)weeks.push(padded.slice(i,i+7));

  const cards=Object.values(getSRSCards());
  const toeicDist={};
  cards.forEach(c=>{const b=toeicBand(c.toeic||300);toeicDist[b.label]=(toeicDist[b.label]||0)+1;});
  const toeicEntries=TOEIC_BANDS.map(b=>({label:b.label,color:b.color,count:toeicDist[b.label]||0})).filter(e=>e.count>0);

  return(
    <div style={S.root}>
      <div style={{width:"100%",maxWidth:460,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <BackBtn onClick={onBack}/>
        <span style={{fontSize:"0.9rem",fontWeight:700,color:"#e8e8f0"}}>學習統計</span>
        <div style={{width:60}}/>
      </div>

      {/* summary */}
      <div style={{width:"100%",maxWidth:460,display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:7}}>
        {[
          {label:"總單字",value:stats.total,color:"#a78bfa"},
          {label:"已掌握",value:stats.mastered,color:"#4ade80"},
          {label:"待複習",value:stats.due,color:"#facc15"},
          {label:"弱點",value:mistakeCount,color:"#f87171"},
        ].map(item=>(
          <div key={item.label} style={{background:"#11111d",border:`1px solid ${item.color}33`,borderRadius:14,padding:"12px 8px",textAlign:"center"}}>
            <div style={{fontSize:"1.6rem",fontWeight:800,color:item.color}}>{item.value}</div>
            <div style={{fontSize:"0.6rem",color:"#555",marginTop:2}}>{item.label}</div>
          </div>
        ))}
      </div>

      {/* TOEIC prediction */}
      {predicted&&(
        <div style={{width:"100%",maxWidth:460,background:"#11111d",border:`1px solid ${predictedBand.color}44`,borderRadius:16,padding:"15px 18px"}}>
          <div style={{fontSize:"0.73rem",color:"#666",marginBottom:6}}>📊 TOEIC 預估分數</div>
          <div style={{display:"flex",alignItems:"flex-end",gap:10}}>
            <div style={{fontSize:"2.4rem",fontWeight:800,color:predictedBand.color,lineHeight:1}}>{predicted}</div>
            <div style={{paddingBottom:4}}>
              <div style={{fontSize:"0.7rem",color:predictedBand.color}}>≈ {predictedBand.label} 分段</div>
              <div style={{fontSize:"0.62rem",color:"#444",marginTop:2}}>依據 {stats.total} 個單字的熟悉度推算</div>
            </div>
          </div>
          <div style={{marginTop:10,height:6,background:"#1a1a2e",borderRadius:99,overflow:"hidden"}}>
            <div style={{height:"100%",width:`${((predicted-100)/890)*100}%`,background:`linear-gradient(90deg,#6ee7b7,${predictedBand.color})`,borderRadius:99,transition:"width .5s"}}/>
          </div>
          <div style={{display:"flex",justifyContent:"space-between",marginTop:3}}>
            <span style={{fontSize:"0.55rem",color:"#333"}}>100</span>
            <span style={{fontSize:"0.55rem",color:"#333"}}>990</span>
          </div>
        </div>
      )}

      {/* mastery */}
      {stats.total>0&&(
        <div style={{width:"100%",maxWidth:460,background:"#11111d",border:"1px solid #1e1e2e",borderRadius:16,padding:"15px 18px"}}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
            <span style={{fontSize:"0.76rem",color:"#888"}}>掌握率</span>
            <span style={{fontSize:"0.96rem",fontWeight:700,color:"#a78bfa"}}>{masteredPct}%</span>
          </div>
          <div style={{height:8,background:"#1a1a2e",borderRadius:99,overflow:"hidden"}}>
            <div style={{height:"100%",width:`${masteredPct}%`,background:"linear-gradient(90deg,#60a5fa,#a78bfa)",borderRadius:99,transition:"width .5s"}}/>
          </div>
        </div>
      )}

      {/* heatmap */}
      <div style={{width:"100%",maxWidth:460,background:"#11111d",border:"1px solid #1e1e2e",borderRadius:16,padding:"15px 18px"}}>
        <div style={{fontSize:"0.73rem",color:"#666",marginBottom:12}}>學習熱力圖（近 12 週）</div>
        <div style={{display:"flex",gap:3}}>
          {weeks.map((week,wi)=>(
            <div key={wi} style={{display:"flex",flexDirection:"column",gap:3,flex:1}}>
              {week.map((day,di)=>(
                <div key={di} style={{
                  aspectRatio:"1",
                  borderRadius:2,
                  background: !day?"transparent":day.done?"#60a5fa":day.studied?"#1e3a5f":"#1a1a2e",
                  minWidth:0,
                  title:day?.key||"",
                }}/>
              ))}
            </div>
          ))}
        </div>
        <div style={{display:"flex",gap:8,alignItems:"center",marginTop:10,justifyContent:"flex-end"}}>
          {[{c:"#1a1a2e",l:"未學"},{c:"#1e3a5f",l:"學習中"},{c:"#60a5fa",l:"完成"}].map(item=>(
            <div key={item.l} style={{display:"flex",alignItems:"center",gap:4}}>
              <div style={{width:9,height:9,borderRadius:2,background:item.c}}/>
              <span style={{fontSize:"0.6rem",color:"#555"}}>{item.l}</span>
            </div>
          ))}
        </div>
      </div>

      {/* SRS level distribution */}
      {stats.total>0&&(
        <div style={{width:"100%",maxWidth:460,background:"#11111d",border:"1px solid #1e1e2e",borderRadius:16,padding:"15px 18px"}}>
          <div style={{fontSize:"0.73rem",color:"#666",marginBottom:11}}>熟悉度分布</div>
          {levelLabels.map((label,l)=>{
            const count=stats.byLevel[l]||0;
            return(
              <div key={l} style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
                <div style={{width:38,fontSize:"0.65rem",color:levelColors[l],flexShrink:0}}>{label}</div>
                <div style={{flex:1,height:9,background:"#1a1a2e",borderRadius:99,overflow:"hidden"}}>
                  <div style={{height:"100%",width:`${(count/Math.max(maxLevel,1))*100}%`,background:levelColors[l],borderRadius:99}}/>
                </div>
                <div style={{width:26,fontSize:"0.66rem",color:"#555",textAlign:"right"}}>{count}</div>
              </div>
            );
          })}
        </div>
      )}

      {/* TOEIC dist */}
      {toeicEntries.length>0&&(
        <div style={{width:"100%",maxWidth:460,background:"#11111d",border:"1px solid #1e1e2e",borderRadius:16,padding:"15px 18px"}}>
          <div style={{fontSize:"0.73rem",color:"#666",marginBottom:11}}>TOEIC 分數分布</div>
          {toeicEntries.map(e=>{
            const pct=Math.round((e.count/Math.max(stats.total,1))*100);
            return(
              <div key={e.label} style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
                <div style={{width:56,fontSize:"0.6rem",color:e.color,flexShrink:0}}>{e.label}</div>
                <div style={{flex:1,height:8,background:"#1a1a2e",borderRadius:99,overflow:"hidden"}}>
                  <div style={{height:"100%",width:`${pct}%`,background:e.color,borderRadius:99}}/>
                </div>
                <div style={{width:24,fontSize:"0.65rem",color:"#555",textAlign:"right"}}>{e.count}</div>
              </div>
            );
          })}
        </div>
      )}

      {stats.total===0&&<div style={{color:"#555",textAlign:"center",marginTop:32,fontSize:"0.9rem"}}>還沒有學習資料，先去學幾個單字吧！</div>}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// Daily View — with TOEIC band picker
// ════════════════════════════════════════════════════════════════════════════
function DailyView({lang:initLang,favorites,setFavorites,onBack}){
  const [lang,setLang]=useState(initLang);
  const isEN=lang===LANGS.EN,accent=isEN?"#60a5fa":"#f472b6";
  const [mode,setMode]=useState(MODES.W2M);
  const [words,setWords]=useState(null);
  const [cursor,setCursor]=useState(0);
  const [loadState,setLoad]=useState("idle");
  const [anim,setAnim]=useState(false);
  const [finished,setFinished]=useState(false);
  // TOEIC picker state
  const [picking,setPicking]=useState(false);
  const [selectedBand,setSelectedBand]=useState(null); // null = any

  const todayKey="daily_"+TODAY;

  useEffect(()=>{
    const saved=LS.get(todayKey,null);
    if(saved){
      setWords(saved.words);setCursor(saved.cursor??0);setFinished((saved.cursor??0)>=DAILY_COUNT);
      setSelectedBand(saved.band??null);setLoad("ready");
    } else {
      setPicking(true); // show band picker before loading
    }
  },[]);

  const startLoad=(band)=>{
    setSelectedBand(band);setPicking(false);setLoad("loading");
    const used=getAllUsed();
    const params={usedEnWords:used,count:DAILY_COUNT};
    if(band!=null){params.toeicMin=band;params.toeicMax=band+100;}
    fetchWords(params)
      .then(w=>{
        const batch=w.slice(0,DAILY_COUNT);
        LS.set(todayKey,{words:batch,cursor:0,date:TODAY,band});
        markUsed(batch);addWordsToSRS(batch);
        setWords(batch);setCursor(0);setLoad("ready");
      })
      .catch(()=>{
        const used=getAllUsed();const usedSet=new Set(used);
        let pool=shuffle(FALLBACK_BANK.filter(w=>!usedSet.has(w.en)));
        if(band!=null)pool=pool.filter(w=>w.toeic>=band&&w.toeic<band+100);
        const batch=(pool.length>=DAILY_COUNT?pool:shuffle(FALLBACK_BANK)).slice(0,DAILY_COUNT);
        LS.set(todayKey,{words:batch,cursor:0,date:TODAY,band});
        markUsed(batch);addWordsToSRS(batch);
        setWords(batch);setCursor(0);setLoad("ready");
      });
  };

  const saveCursor=(c)=>{const s=LS.get(todayKey,{});LS.set(todayKey,{...s,cursor:c});};
  const isFav=(w)=>favorites.some(f=>f.en===w.en);
  const toggleFav=(w)=>setFavorites(prev=>{const n=prev.some(f=>f.en===w.en)?prev.filter(f=>f.en!==w.en):[...prev,w];LS.set("vocab_favs",n);return n;});
  const handleNext=()=>{const next=cursor+1;if(next>=DAILY_COUNT){setFinished(true);saveCursor(next);return;}setAnim(true);setTimeout(()=>{setCursor(next);saveCursor(next);setAnim(false);},240);};

  // ── Band picker ──
  if(picking)return(
    <div style={S.root}>
      <div style={{width:"100%",maxWidth:460,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <BackBtn onClick={onBack}/>
        <span style={{fontSize:"0.88rem",fontWeight:700,color:"#e8e8f0"}}>選擇今日 TOEIC 級距</span>
        <div style={{width:60}}/>
      </div>
      <div style={{fontSize:"0.78rem",color:"#555",width:"100%",maxWidth:460}}>選擇你想加強的分數範圍，或選「隨機混合」學習各種難度</div>
      <div style={{width:"100%",maxWidth:460,display:"flex",flexDirection:"column",gap:8}}>
        <button style={{...S.bandBtn,borderColor:"#a78bfa44",color:"#a78bfa"}} onClick={()=>startLoad(null)}>
          <span style={{fontSize:"1.1rem"}}>🎲</span>
          <div>
            <div style={{fontWeight:700}}>隨機混合</div>
            <div style={{fontSize:"0.7rem",opacity:0.7}}>各種難度隨機組合</div>
          </div>
        </button>
        {TOEIC_BANDS.map(b=>(
          <button key={b.min} style={{...S.bandBtn,borderColor:b.color+"44",color:b.color}} onClick={()=>startLoad(b.min)}>
            <span style={{fontSize:"1rem",color:b.color}}>●</span>
            <div>
              <div style={{fontWeight:700}}>TOEIC {b.label}</div>
              <div style={{fontSize:"0.7rem",opacity:0.7}}>
                {b.min<300?"基礎詞彙":b.min<500?"日常詞彙":b.min<700?"商務詞彙":b.min<900?"進階詞彙":"高難度詞彙"}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );

  if(loadState==="loading")return(
    <div style={{...S.root,justifyContent:"center",alignItems:"center",gap:16}}>
      <BackBtn onClick={onBack}/>
      <div style={{fontSize:"2rem",animation:"spin 1.2s linear infinite"}}>⟳</div>
      <div style={{color:"#555",fontSize:"0.9rem"}}>
        生成 {selectedBand!=null?`TOEIC ${selectedBand}–${selectedBand+100} `:""}單字中…
      </div>
    </div>
  );

  if(finished&&words)return(
    <div style={{...S.root,gap:11}}>
      <div style={{width:"100%",maxWidth:460,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <BackBtn onClick={onBack}/>
        <span style={{fontSize:"0.85rem",fontWeight:700,color:"#f0f0ff"}}>今日完成 🎊</span>
        <div style={{width:60}}/>
      </div>
      <div style={{width:"100%",maxWidth:460,display:"flex",flexDirection:"column",gap:7}}>
        {words.map((w,i)=>(
          <div key={w.en} style={{background:"#11111d",border:`1px solid ${accent}22`,borderRadius:12,padding:"10px 13px",display:"flex",alignItems:"flex-start",gap:9}}>
            <span style={{color:"#555",fontSize:"0.68rem",minWidth:18,marginTop:3}}>{i+1}</span>
            <div style={{flex:1}}>
              <div style={{display:"flex",gap:8,alignItems:"baseline",flexWrap:"wrap"}}>
                {isEN
                  ?<span style={{fontWeight:700,color:"#f0f0ff"}}>{w.en}</span>
                  :<span style={{fontWeight:700,color:"#f0f0ff"}}>{w.ja} <span style={{fontSize:"0.75rem",color:accent,fontWeight:400}}>{w.romaji}</span></span>
                }
                <span style={{fontSize:"0.78rem",color:accent}}>{isEN?w.enMeaning:w.jaMeaning}</span>
              </div>
              <div style={{marginTop:4,display:"flex",gap:6,alignItems:"center"}}>
                <ToeicTag score={w.toeic}/>
                <span style={{fontSize:"0.68rem",color:"#2a2a3a"}}>{isEN?`日：${w.ja}`:  `EN：${w.en}`}</span>
              </div>
            </div>
            <button style={{...S.speakBtn,borderColor:"#2a2a3a",background:"#1a1a2e",width:34,height:34,fontSize:"0.9rem",flexShrink:0}}
              onClick={()=>speak(isEN?w.en:w.ja,lang)}>🔊</button>
            <StarBtn active={isFav(w)} onClick={()=>toggleFav(w)}/>
          </div>
        ))}
      </div>
      <div style={{display:"flex",gap:10,marginTop:4,flexWrap:"wrap",justifyContent:"center"}}>
        <button style={{...S.bigBtn,background:"#1a1a2e",color:"#aaa",border:"1px solid #2e2e45"}}
          onClick={()=>{setCursor(0);saveCursor(0);setFinished(false);}}>重新練習</button>
        <button style={{...S.bigBtn,background:accent,color:"#0d0d14"}} onClick={onBack}>返回主頁</button>
      </div>
    </div>
  );

  if(!words||loadState!=="ready")return null;
  return(
    <div style={S.root}>
      <div style={{width:"100%",maxWidth:460,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <BackBtn onClick={onBack}/>
        <span style={{fontSize:"0.76rem",color:"#555"}}>{cursor+1}/{DAILY_COUNT}{selectedBand!=null&&<span style={{marginLeft:6,color:toeicBand(selectedBand).color}}>TOEIC {selectedBand}–{selectedBand+100}</span>}</span>
        <button style={{...S.pill,fontSize:"0.72rem"}} onClick={()=>setMode(m=>m===MODES.W2M?MODES.M2W:MODES.W2M)}>
          {mode===MODES.W2M?"單字→意思":"意思→單字"}
        </button>
      </div>
      <ProgBar value={cursor+1} max={DAILY_COUNT} color={accent}/>
      <div style={{opacity:anim?0:1,transform:anim?"translateY(12px) scale(0.97)":"translateY(0) scale(1)",transition:"opacity .22s,transform .22s",width:"100%",maxWidth:460}}>
        <LearnCard word={words[cursor]} pool={words} lang={lang} mode={mode}
          onLangToggle={()=>setLang(l=>l===LANGS.EN?LANGS.JA:LANGS.EN)}
          isFav={isFav(words[cursor])} onToggleFav={()=>toggleFav(words[cursor])}
          accent={accent} onNext={handleNext} onAnswer={(r)=>updateSRSCard(words[cursor]?.en,r)}/>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// History View
// ════════════════════════════════════════════════════════════════════════════
function HistoryView({lang:initLang,favorites,setFavorites,onBack}){
  const [lang,setLang]=useState(initLang);
  const isEN=lang===LANGS.EN,accent=isEN?"#60a5fa":"#f472b6";
  const [reviewing,setReviewing]=useState(null);
  const [cursor,setCursor]=useState(0);
  const [mode,setMode]=useState(MODES.W2M);
  const [anim,setAnim]=useState(false);

  const history=[];
  for(let i=0;i<localStorage.length;i++){
    const k=localStorage.key(i);
    if(k&&k.startsWith("daily_")){const v=LS.get(k,null);if(v?.words)history.push({date:k.replace("daily_",""),words:v.words,cursor:v.cursor??0,band:v.band??null});}
  }
  history.sort((a,b)=>b.date.localeCompare(a.date));

  const isFav=(w)=>favorites.some(f=>f.en===w.en);
  const toggleFav=(w)=>setFavorites(prev=>{const n=prev.some(f=>f.en===w.en)?prev.filter(f=>f.en!==w.en):[...prev,w];LS.set("vocab_favs",n);return n;});

  if(reviewing){
    const cur=reviewing.words[cursor];
    return(
      <div style={S.root}>
        <div style={{width:"100%",maxWidth:460,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <BackBtn onClick={()=>{setReviewing(null);setCursor(0);}} label="← 返回紀錄"/>
          <span style={{fontSize:"0.72rem",color:"#555"}}>{reviewing.date} · {cursor+1}/{reviewing.words.length}</span>
          <button style={{...S.pill,fontSize:"0.72rem"}} onClick={()=>setMode(m=>m===MODES.W2M?MODES.M2W:MODES.W2M)}>
            {mode===MODES.W2M?"單字→意思":"意思→單字"}
          </button>
        </div>
        <ProgBar value={cursor+1} max={reviewing.words.length} color={accent}/>
        <div style={{opacity:anim?0:1,transform:anim?"translateY(12px) scale(0.97)":"translateY(0) scale(1)",transition:"opacity .22s,transform .22s",width:"100%",maxWidth:460}}>
          <LearnCard word={cur} pool={reviewing.words} lang={lang} mode={mode}
            onLangToggle={()=>setLang(l=>l===LANGS.EN?LANGS.JA:LANGS.EN)}
            isFav={isFav(cur)} onToggleFav={()=>toggleFav(cur)} accent={accent}
            onAnswer={(r)=>updateSRSCard(cur.en,r)}
            onNext={()=>{if(cursor+1>=reviewing.words.length){setReviewing(null);setCursor(0);return;}setAnim(true);setTimeout(()=>{setCursor(c=>c+1);setAnim(false);},240);}}/>
        </div>
      </div>
    );
  }

  return(
    <div style={S.root}>
      <div style={{width:"100%",maxWidth:460,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <BackBtn onClick={onBack}/>
        <span style={{fontSize:"0.85rem",fontWeight:600,color:"#e8e8f0"}}>學習紀錄</span>
        <div style={{width:60}}/>
      </div>
      {history.length===0
        ?<div style={{color:"#555",marginTop:40,fontSize:"0.9rem"}}>還沒有學習紀錄</div>
        :<div style={{width:"100%",maxWidth:460,display:"flex",flexDirection:"column",gap:8}}>
          {history.map(h=>(
            <button key={h.date} onClick={()=>{setReviewing(h);setCursor(0);}}
              style={{background:"#11111d",border:`1px solid ${accent}22`,borderRadius:14,padding:"13px 17px",display:"flex",alignItems:"center",justifyContent:"space-between",cursor:"pointer",textAlign:"left"}}>
              <div>
                <div style={{display:"flex",gap:8,alignItems:"center"}}>
                  <span style={{fontSize:"0.9rem",fontWeight:600,color:"#f0f0ff"}}>{h.date}</span>
                  {h.date===TODAY&&<span style={{fontSize:"0.65rem",color:accent}}>今天</span>}
                </div>
                <div style={{fontSize:"0.72rem",color:"#555",marginTop:3,display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
                  <span>{h.words.length} 個單字</span>
                  {h.band!=null&&<ToeicTag score={h.band}/>}
                  {h.cursor>=DAILY_COUNT?<span style={{color:"#4ade80"}}>✓ 完成</span>:<span style={{color:"#facc15"}}>進行中 {h.cursor}/{DAILY_COUNT}</span>}
                </div>
              </div>
              <span style={{color:accent,fontSize:"0.82rem"}}>複習 →</span>
            </button>
          ))}
        </div>
      }
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// Favorites View
// ════════════════════════════════════════════════════════════════════════════
function FavsView({favs,lang:initLang,onRemove,onBack}){
  const [lang,setLang]=useState(initLang);
  const isEN=lang===LANGS.EN,accent=isEN?"#60a5fa":"#f472b6";
  if(favs.length===0)return(
    <div style={{...S.root,justifyContent:"center",alignItems:"center",gap:12}}>
      <div style={{width:"100%",maxWidth:460}}><BackBtn onClick={onBack}/></div>
      <div style={{fontSize:"2.5rem",marginTop:24}}>⭐</div>
      <div style={{color:"#555"}}>還沒有收藏的單字</div>
      <div style={{color:"#333",fontSize:"0.78rem"}}>學習時按 ★ 加入</div>
    </div>
  );
  return(
    <div style={S.root}>
      <div style={{width:"100%",maxWidth:460,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <BackBtn onClick={onBack}/>
        <span style={{fontSize:"0.82rem",color:"#666"}}>收藏 {favs.length} 個</span>
        <button onClick={()=>setLang(l=>l===LANGS.EN?LANGS.JA:LANGS.EN)}
          style={{...S.langToggle,borderColor:accent+"66",color:accent}}>
          {isEN?"EN→JA":"JA→EN"}
        </button>
      </div>
      <div style={{width:"100%",maxWidth:460,display:"flex",flexDirection:"column",gap:8}}>
        {favs.map(w=>(
          <div key={w.en} style={{background:"#11111d",border:`1px solid ${accent}22`,borderRadius:14,padding:"12px 14px",display:"flex",alignItems:"flex-start",gap:10}}>
            <div style={{flex:1}}>
              <div style={{display:"flex",gap:10,alignItems:"baseline",flexWrap:"wrap"}}>
                {isEN
                  ?<span style={{fontSize:"1.05rem",fontWeight:700,color:"#f0f0ff"}}>{w.en}</span>
                  :<span style={{fontSize:"1.05rem",fontWeight:700,color:"#f0f0ff"}}>{w.ja} <span style={{fontSize:"0.8rem",color:accent,fontWeight:400}}>{w.romaji}</span></span>
                }
                <span style={{fontSize:"0.72rem",color:"#444"}}>{isEN?w.ja:w.en}</span>
              </div>
              <div style={{fontSize:"0.82rem",color:accent,marginTop:2}}>{isEN?w.enMeaning:w.jaMeaning}</div>
              <div style={{marginTop:5,display:"flex",gap:6,alignItems:"center"}}>
                <ToeicTag score={w.toeic}/>
                {!isEN&&<span style={{fontSize:"0.65rem",color:"#2a2a3a"}}>{w.en}</span>}
              </div>
            </div>
            <button style={{...S.speakBtn,borderColor:"#2a2a3a",background:"#1a1a2e"}}
              onClick={()=>speak(isEN?w.en:w.ja,lang)}>🔊</button>
            <button style={{background:"transparent",border:"none",cursor:"pointer",color:"#facc15",fontSize:"1.3rem",padding:"2px 4px"}}
              onClick={()=>onRemove(w.en)}>★</button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// Infinite View
// ════════════════════════════════════════════════════════════════════════════
function InfiniteView({lang:initLang,favorites,setFavorites,onBack}){
  const [lang,setLang]=useState(initLang);
  const isEN=lang===LANGS.EN,accent=isEN?"#60a5fa":"#f472b6";
  const [mode,setMode]=useState(MODES.W2M);
  const [queue,setQueue]=useState([]);
  const [cursor,setCursor]=useState(0);
  const [anim,setAnim]=useState(false);
  const [loadState,setLoad]=useState("loading");
  const allRef=useRef([]);const lockRef=useRef(false);

  useEffect(()=>{
    const used=getAllUsed();
    fetchWords({usedEnWords:used,count:15})
      .then(w=>{allRef.current=w;setQueue(shuffle(w));markUsed(w);addWordsToSRS(w);setLoad("ready");})
      .catch(()=>{
        const usedSet=new Set(getAllUsed());
        const w=shuffle(FALLBACK_BANK.filter(x=>!usedSet.has(x.en))).slice(0,15);
        const final=w.length>=8?w:shuffle(FALLBACK_BANK).slice(0,15);
        allRef.current=final;setQueue(final);markUsed(final);addWordsToSRS(final);setLoad("ready");
      });
  },[]);

  useEffect(()=>{
    if(loadState!=="ready")return;
    if(queue.length-1-cursor<=5&&!lockRef.current){
      lockRef.current=true;
      const used=getAllUsed();
      fetchWords({usedEnWords:used,count:15})
        .then(w=>{allRef.current=[...allRef.current,...w];setQueue(p=>[...p,...shuffle(w)]);markUsed(w);addWordsToSRS(w);})
        .catch(()=>{
          const usedSet=new Set(allRef.current.map(w=>w.en));
          const extra=shuffle(FALLBACK_BANK.filter(w=>!usedSet.has(w.en)));
          if(extra.length>0){allRef.current=[...allRef.current,...extra];setQueue(p=>[...p,...extra]);}
        })
        .finally(()=>{lockRef.current=false;});
    }
  },[cursor,queue.length,loadState]);

  const isFav=(w)=>favorites.some(f=>f.en===w.en);
  const toggleFav=(w)=>setFavorites(prev=>{const n=prev.some(f=>f.en===w.en)?prev.filter(f=>f.en!==w.en):[...prev,w];LS.set("vocab_favs",n);return n;});

  if(loadState==="loading")return(
    <div style={{...S.root,justifyContent:"center",alignItems:"center",gap:16}}>
      <BackBtn onClick={onBack}/>
      <div style={{fontSize:"2rem",animation:"spin 1.2s linear infinite"}}>⟳</div>
      <div style={{color:"#555",fontSize:"0.9rem"}}>生成單字中…</div>
    </div>
  );

  const current=queue[cursor];if(!current)return null;
  return(
    <div style={S.root}>
      <div style={{width:"100%",maxWidth:460,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <BackBtn onClick={onBack}/>
        <span style={{fontSize:"0.76rem",color:"#555"}}>已學 {cursor} 個</span>
        <button style={{...S.pill,fontSize:"0.72rem"}} onClick={()=>setMode(m=>m===MODES.W2M?MODES.M2W:MODES.W2M)}>
          {mode===MODES.W2M?"單字→意思":"意思→單字"}
        </button>
      </div>
      <div style={{opacity:anim?0:1,transform:anim?"translateY(12px) scale(0.97)":"translateY(0) scale(1)",transition:"opacity .22s,transform .22s",width:"100%",maxWidth:460}}>
        <LearnCard word={current} pool={allRef.current.length>=4?allRef.current:queue}
          lang={lang} mode={mode} onLangToggle={()=>setLang(l=>l===LANGS.EN?LANGS.JA:LANGS.EN)}
          isFav={isFav(current)} onToggleFav={()=>toggleFav(current)}
          accent={accent} onAnswer={(r)=>updateSRSCard(current.en,r)}
          onNext={()=>{setAnim(true);setTimeout(()=>{setCursor(c=>c+1);setAnim(false);},240);}}/>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// Home
// ════════════════════════════════════════════════════════════════════════════
function HomeView({lang,setLang,favorites,onNav}){
  const isEN=lang===LANGS.EN,accent=isEN?"#60a5fa":"#f472b6";
  const todayData=LS.get("daily_"+TODAY,null);
  const todayCursor=todayData?.cursor??0;
  const todayDone=todayCursor>=DAILY_COUNT;
  const srsStats=getSRSStats();

  function calcStreak(){
    let s=0;const d=new Date();
    while(s<365){const key="daily_"+d.toISOString().slice(0,10);const v=LS.get(key,null);if(!v||(v.cursor??0)<DAILY_COUNT)break;s++;d.setDate(d.getDate()-1);}
    return s;
  }
  const streak=calcStreak();

  return(
    <div style={S.root}>
      <div style={{width:"100%",maxWidth:460,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div>
          <div style={{fontSize:"1.5rem",fontWeight:800,color:"#a78bfa",letterSpacing:"-0.03em"}}>26秒<span style={{color:accent}}>+</span></div>
          <div style={{fontSize:"0.66rem",color:"#3a3a5a",marginTop:1}}>EN × JA 雙語學習</div>
        </div>
        <button style={{...S.pill,borderColor:accent+"88",color:accent}} onClick={()=>setLang(l=>l===LANGS.EN?LANGS.JA:LANGS.EN)}>
          {isEN?"🇺🇸 EN ⇄ 🇯🇵":"🇯🇵 JA ⇄ 🇺🇸"}
        </button>
      </div>

      {streak>0&&(
        <div style={{width:"100%",maxWidth:460,background:"linear-gradient(135deg,#1a1020,#0d0d14)",border:"1px solid #facc1533",borderRadius:16,padding:"12px 18px",display:"flex",alignItems:"center",gap:12}}>
          <span style={{fontSize:"1.8rem"}}>🔥</span>
          <div>
            <div style={{fontSize:"1rem",fontWeight:700,color:"#facc15"}}>{streak} 天連續學習</div>
            <div style={{fontSize:"0.68rem",color:"#666",marginTop:1}}>繼續保持！</div>
          </div>
        </div>
      )}

      {/* daily card */}
      <div style={{width:"100%",maxWidth:460,background:"#11111d",border:`1.5px solid ${accent}33`,borderRadius:20,padding:"18px 20px",cursor:"pointer"}} onClick={()=>onNav(VIEWS.DAILY)}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
          <div>
            <div style={{fontSize:"0.6rem",color:accent,textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:5}}>今日學習</div>
            <div style={{fontSize:"1.05rem",fontWeight:700,color:"#f0f0ff"}}>{todayDone?"今日已完成 🎊":"每日 10 個單字"}</div>
            <div style={{fontSize:"0.73rem",color:"#555",marginTop:3}}>進度 {Math.min(todayCursor,DAILY_COUNT)}/{DAILY_COUNT}
              {todayData?.band!=null&&<span style={{marginLeft:6}}><ToeicTag score={todayData.band}/></span>}
            </div>
          </div>
          <div style={{fontSize:"1.8rem"}}>{todayDone?"✅":"📚"}</div>
        </div>
        <div style={{marginTop:12,height:5,background:"#1a1a2e",borderRadius:99,overflow:"hidden"}}>
          <div style={{height:"100%",background:accent,borderRadius:99,width:`${(Math.min(todayCursor,DAILY_COUNT)/DAILY_COUNT)*100}%`}}/>
        </div>
        <div style={{display:"flex",justifyContent:"flex-end",marginTop:5}}>
          <span style={{fontSize:"0.68rem",color:accent}}>{todayDone?"再次練習":"繼續 →"}</span>
        </div>
      </div>

      {/* grid */}
      <div style={{width:"100%",maxWidth:460,display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
        {[
          {view:VIEWS.SRS,    icon:"🗂",  label:"間隔複習", sub:`${srsStats.due} 個待複習`,  color:"#60a5fa", dim:srsStats.total===0},
          {view:VIEWS.STATS,  icon:"📊",  label:"學習統計", sub:`共 ${srsStats.total} 個單字`,color:"#a78bfa"},
          {view:VIEWS.MISTAKES,icon:"📕", label:"錯題本",   sub:`${getMistakeList().length} 個弱點`,color:"#f87171"},
          {view:VIEWS.INFINITE,icon:"♾️", label:"無限學習", sub:"AI 隨機不重複",              color:"#4ade80"},
          {view:VIEWS.HISTORY,icon:"📅",  label:"學習紀錄", sub:"回顧過去單字",               color:"#f472b6"},
          {view:VIEWS.FAVS,   icon:"⭐",  label:"收藏夾",   sub:`${favorites.length} 個單字`, color:"#facc15"},
        ].map(item=>(
          <div key={item.view} style={{...S.gridCard,borderColor:item.color+"33",opacity:item.dim?0.4:1,
            gridColumn:item.view===VIEWS.FAVS?"1 / -1":undefined}}
            onClick={()=>!item.dim&&onNav(item.view)}>
            <span style={{fontSize:"1.5rem"}}>{item.icon}</span>
            <div style={{fontWeight:700,color:"#f0f0ff",marginTop:7,fontSize:"0.9rem"}}>{item.label}</div>
            <div style={{fontSize:"0.66rem",color:item.dim?"#333":item.color,marginTop:2}}>{item.dim?"先學一些單字再來":item.sub}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// Root
// ════════════════════════════════════════════════════════════════════════════
export default function App(){
  const [view,setView]=useState(VIEWS.HOME);
  const [lang,setLang]=useState(LANGS.EN);
  const [favorites,setFavorites]=useState(()=>LS.get("vocab_favs",[]));
  const goHome=()=>setView(VIEWS.HOME);
  const shared={lang,favorites,setFavorites,onBack:goHome};

  return(
    <>
      {view===VIEWS.HOME    &&<HomeView lang={lang} setLang={setLang} favorites={favorites} onNav={setView}/>}
      {view===VIEWS.DAILY   &&<DailyView {...shared}/>}
      {view===VIEWS.HISTORY &&<HistoryView {...shared}/>}
      {view===VIEWS.SRS     &&<SRSView lang={lang} onBack={goHome}/>}
      {view===VIEWS.STATS   &&<StatsView onBack={goHome}/>}
      {view===VIEWS.MISTAKES&&<MistakesView lang={lang} onBack={goHome}/>}
      {view===VIEWS.INFINITE&&<InfiniteView {...shared}/>}
      {view===VIEWS.FAVS    &&<FavsView favs={favorites} lang={lang}
        onRemove={en=>setFavorites(p=>{const n=p.filter(f=>f.en!==en);LS.set("vocab_favs",n);return n;})}
        onBack={goHome}/>}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}body{background:#0d0d14;}
        button{transition:all .15s;font-family:inherit;cursor:pointer;}
        button:hover{filter:brightness(1.12);}button:active{transform:scale(0.96)!important;}
        @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
      `}</style>
    </>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────
const S={
  root:{fontFamily:"'Inter',sans-serif",background:"#0d0d14",minHeight:"100vh",color:"#e8e8f0",display:"flex",flexDirection:"column",alignItems:"center",padding:"20px 16px 50px",gap:"12px"},
  card:{background:"#11111d",border:"1.5px solid",borderRadius:22,padding:"20px 20px 22px",display:"flex",flexDirection:"column",gap:13,width:"100%"},
  cardHint:{fontSize:"0.63rem",color:"#3a3a55",textTransform:"uppercase",letterSpacing:"0.08em"},
  questionRow:{display:"flex",alignItems:"flex-start",gap:10},
  question:{fontWeight:800,color:"#f0f0ff",lineHeight:1.15,flex:1,display:"flex",alignItems:"center"},
  speakBtn:{width:42,height:42,borderRadius:10,border:"1px solid",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,fontSize:"1.1rem"},
  companion:{fontSize:"0.74rem",color:"#2a2a45",borderTop:"1px solid #181828",paddingTop:11},
  optBtn:{background:"#17172a",border:"1px solid #252540",color:"#ccd",borderRadius:11,padding:"11px 14px",fontSize:"0.87rem",cursor:"pointer",textAlign:"left",display:"flex",alignItems:"center"},
  optCorrect:{background:"#0b2218",border:"1px solid #22c55e",color:"#4ade80"},
  optWrong:{background:"#220d0d",border:"1px solid #ef4444",color:"#f87171"},
  optDim:{opacity:0.25},
  revealBtn:{background:"transparent",border:"1px dashed #252540",color:"#444",borderRadius:9,padding:"9px",fontSize:"0.76rem",cursor:"pointer"},
  answerBox:{background:"#0c1220",border:"1px solid",borderRadius:9,padding:"11px 16px",fontSize:"0.95rem",fontWeight:600,display:"flex",alignItems:"center",justifyContent:"space-between",gap:8},
  speakInline:{background:"transparent",border:"none",cursor:"pointer",fontSize:"1rem",padding:4,flexShrink:0},
  nextBtnSm:{border:"none",borderRadius:12,padding:"11px 0",fontSize:"0.9rem",fontWeight:700,width:"100%",marginTop:2},
  pill:{background:"#16162a",border:"1px solid #2e2e45",color:"#888",borderRadius:999,padding:"5px 14px",fontSize:"0.76rem",cursor:"pointer"},
  backBtn:{background:"transparent",border:"none",color:"#555",fontSize:"0.82rem",cursor:"pointer",padding:"4px 0"},
  bigBtn:{borderRadius:999,padding:"11px 22px",fontSize:"0.88rem",fontWeight:700,cursor:"pointer",border:"none"},
  gridCard:{background:"#11111d",border:"1px solid",borderRadius:18,padding:"16px 15px",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"flex-start"},
  fcCard:{width:"100%",maxWidth:460,minHeight:220,background:"#11111d",border:"1.5px solid",borderRadius:22,padding:"32px 24px",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",cursor:"pointer",position:"relative",transition:"opacity .22s,transform .22s,border-color .3s"},
  fcJudge:{borderRadius:12,padding:"12px 0",fontSize:"0.9rem",fontWeight:700,cursor:"pointer"},
  langToggle:{background:"transparent",border:"1px solid",borderRadius:999,padding:"3px 9px",fontSize:"0.66rem",cursor:"pointer",fontWeight:600},
  bandBtn:{background:"#11111d",border:"1px solid",borderRadius:14,padding:"14px 16px",cursor:"pointer",textAlign:"left",display:"flex",alignItems:"center",gap:14,width:"100%"},
};

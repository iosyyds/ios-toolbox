/* ============================================================
   果机工具箱 — 交互逻辑（纯前端，无后台）
   ============================================================ */
(function(){
"use strict";

/* ---------- 主题切换 ---------- */
(function theme(){
  const KEY="ios-toolbox-theme";
  const btn=document.getElementById("themeBtn");
  const sun="☀️", moon="🌙";
  const apply=t=>{document.documentElement.setAttribute("data-theme",t);if(btn)btn.textContent=t==="dark"?sun:moon;};
  let t=localStorage.getItem(KEY)||(window.matchMedia&&matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light");
  apply(t);
  if(btn)btn.addEventListener("click",()=>{t=t==="dark"?"light":"dark";apply(t);localStorage.setItem(KEY,t);});
})();

/* ---------- 工具：结果区显示辅助 ---------- */
function showResult(id,html){const el=document.getElementById(id);if(!el)return;el.innerHTML=html;el.classList.add("show");el.scrollIntoView({behavior:"smooth",block:"nearest"});}

/* ---------- 工具 1：机型识别（A 代码） ---------- */
const modelForm=document.getElementById("modelForm");
if(modelForm){
  // 反向索引 A代码 -> 机型
  const idx={};
  Object.keys(APPLE_MODELS).forEach(m=>{APPLE_MODELS[m].forEach(([code,region])=>{idx[code]=idx[code]||[];idx[code].push([m,region]);});});
  // 自动补全
  const input=document.getElementById("modelInput");
  const datalist=document.getElementById("modelList");
  Object.keys(idx).forEach(c=>{const o=document.createElement("option");o.value=c;datalist.appendChild(o);});
  input.addEventListener("input",()=>{
    const v=input.value.trim().toUpperCase();
    if(/^A\d{4}$/.test(v)&&idx[v]){input.dataset.hit="1";}else{input.dataset.hit="0";}
  });
  modelForm.addEventListener("submit",e=>{
    e.preventDefault();
    const raw=input.value.trim().toUpperCase();
    const m=raw.match(/A\d{4}/i);
    const code=m?m[0]:"";
    const hit=idx[code];
    if(!hit){
      showResult("modelResult",
        `<div class="r-title">查询结果</div><div class="r-big" style="color:var(--err);-webkit-text-fill-color:var(--err)">未匹配到机型</div>
        <div class="r-info">未找到 A 代码「${code||raw}」。请检查是否为 5 位（A+4 位数字），或改用序列号/型号号码。</div>
        <div class="r-note">提示：可在「设置 → 通用 → 关于本机 → 型号号码」轻点切换到 A 代码。</div>`);
      return;
    }
    const regions=hit.map(([n,r])=>`<span class="badge info">${r}</span>`).join("");
    showResult("modelResult",
      `<div class="r-title">A 代码 A${code.replace("A","")} 对应机型</div>
       <div class="r-big">${hit[0][0]}</div>
       <div class="r-info">${regions}</div>
       <div class="r-note">A 代码对照数据整理自 Apple 官方与 MobileModels 型号库；同一机型不同地区 A 代码不同，中国大陆版通常以「中国大陆」标注。</div>`);
  });
}

/* ---------- 工具 2：IMEI 校验（Luhn） ---------- */
const imeiForm=document.getElementById("imeiForm");
if(imeiForm){
  imeiForm.addEventListener("submit",e=>{
    e.preventDefault();
    const v=document.getElementById("imeiInput").value.replace(/\s/g,"");
    const digits=v.replace(/\D/g,"");
    const validLen=digits.length===15||digits.length===17;
    if(!/^\d+$/.test(v)||!validLen){
      showResult("imeiResult",
        `<div class="r-big" style="color:var(--err);-webkit-text-fill-color:var(--err)">格式不正确</div>
        <div class="r-info">IMEI 为 15 位数字；eSIM/双卡 iPhone 还可能有 17 位（末位为软件版本号）。</div>`);
      return;
    }
    // Luhn（15 位 IMEI：末位为校验位，从右往左隔位翻倍 → 奇数索引翻倍）
    const base=digits.slice(0,15);
    let sum=0;
    for(let i=0;i<15;i++){
      let d=+base[i];
      if(i%2===1){d*=2;if(d>9)d-=9;}
      sum+=d;
    }
    const luhnOk=(sum%10===0);
    const knownBands=+base.slice(0,2)===35||+base.slice(0,2)===86||+base.slice(0,2)===91;
    let badge=luhnOk?`<span class="badge ok">校验位通过</span>`:`<span class="badge err">校验位不通过</span>`;
    badge+=knownBands?`<span class="badge info">TAC 属常见 Apple 号段</span>`:"";
    showResult("imeiResult",
      `<div class="r-title">IMEI 校验结果</div>
       <div class="r-big" style="font-size:20px">${digits.length===17?"15 位 IMEI："+digits.slice(0,15)+"<br>软件版本号："+digits.slice(15):digits}</div>
       <div class="r-info">${badge}</div>
       <div class="r-note">Luhn 校验只能判断 IMEI 是否符合算法规则，不代表该序列真实存在或未锁网；要查询官方激活/保修状态请使用 Apple 官网「检查保障服务与支持期限」。</div>`);
  });
}

/* ---------- 工具 3：电池健康估算 ---------- */
const batForm=document.getElementById("batForm");
if(batForm){
  const select=document.getElementById("batGen");
  batForm.addEventListener("submit",e=>{
    e.preventDefault();
    const cycles=parseInt(document.getElementById("batCycles").value,10);
    const gen=select.value; // old: 500次, new: 1000次
    if(isNaN(cycles)||cycles<0||cycles>3000){
      showResult("batResult",`<div class="r-big" style="color:var(--err);-webkit-text-fill-color:var(--err)">请输入有效循环次数</div><div class="r-info">范围 0–3000 次。</div>`);
      return;
    }
    const target=gen==="new"?1000:500;
    // 线性估算：目标循环数时保留 80%，从 100% 起
    let health=Math.max(80,Math.round((100-(100-80)/target*cycles)*10)/10);
    health=Math.min(100,health);
    const level=health<80?'<span class="badge err">低于 80% · 建议更换</span>'
      :health<88?'<span class="badge warn">一般 · 注意续航</span>'
      :health<95?'<span class="badge info">良好</span>'
      :'<span class="badge ok">优秀</span>';
    showResult("batResult",
      `<div class="r-title">估算电池最大容量</div>
       <div class="r-big">${health.toFixed(1)}%</div>
       <div class="gauge-wrap"><div class="gauge"><i style="width:${health}%"></i></div><div class="gauge-txt"><span>0%</span><span>${cycles} 次循环</span><span>100%</span></div></div>
       <div class="r-info">${level}</div>
       <div class="r-note">按苹果官方标准线性估算：${gen==="new"?"iPhone 15 及更新机型（1000 次循环后保留约 80%）":"iPhone 14 及更早机型（500 次循环后保留约 80%）"}。实际健康度受温度、快充习惯等影响，请以「设置→电池→电池健康」显示为准。</div>`);
  });
}

/* ---------- 工具 4：保修到期计算 ---------- */
const wf=document.getElementById("warrantyForm");
if(wf){
  wf.addEventListener("submit",e=>{
    e.preventDefault();
    const val=document.getElementById("buyDate").value;
    const hasCare=document.getElementById("applecare").checked;
    if(!val){showResult("warrantyResult",`<div class="r-big" style="color:var(--err);-webkit-text-fill-color:var(--err)">请选择购机日期</div>`);return;}
    const d=new Date(val+"T00:00:00");
    const months=hasCare?24:12;
    const end=new Date(d);end.setMonth(end.getMonth()+months);end.setDate(end.getDate()-1);
    const today=new Date();
    const fmt=x=>`${x.getFullYear()}-${String(x.getMonth()+1).padStart(2,"0")}-${String(x.getDate()).padStart(2,"0")}`;
    const diff=end-today;
    const days=Math.ceil(diff/86400000);
    const badge=days<0?'<span class="badge err">已过期</span>':days<=30?'<span class="badge warn">即将到期</span>':'<span class="badge ok">保障有效</span>';
    showResult("warrantyResult",
      `<div class="r-title">${hasCare?"AppleCare+":"标准保修"}推算</div>
       <div class="r-big" style="font-size:22px">${fmt(end)}</div>
       <div class="r-info">${badge} ${days<0?"已过保 "+(-days)+" 天":days===0?"今天到期":"剩余约 "+days+" 天"}</div>
       <div class="r-note">按${hasCare?"AppleCare+（2 年）":"1 年有限保修"}推算，实际以 Apple 官网序列号查询结果为准（大陆 iPhone 保修按购买凭证日期起算）。</div>`);
  });
}

/* ---------- 工具 5：存储容量换算 ---------- */
const sf=document.getElementById("storeForm");
if(sf){
  const map={B:1,KB:1024,MB:1024*1024,GB:1024*1024*1024,TB:1024*1024*1024*1024};
  sf.addEventListener("submit",e=>{
    e.preventDefault();
    const v=parseFloat(document.getElementById("storeNum").value);
    const from=document.getElementById("storeFrom").value;
    const to=document.getElementById("storeTo").value;
    if(isNaN(v)||v<0){showResult("storeResult",`<div class="r-big" style="color:var(--err);-webkit-text-fill-color:var(--err)">请输入有效数值</div>`);return;}
    const bytes=v*map[from];
    const out=bytes/map[to];
    const outGiB=bytes/(1024*1024*1024);
    const outGB=bytes/1e9;
    showResult("storeResult",
      `<div class="r-title">换算结果</div>
       <div class="r-big">${out>=1000?out.toExponential(4):Number(out.toPrecision(6))} ${to}</div>
       <div class="r-info">≈ ${outGiB.toFixed(2)} GiB（二进制） · ${outGB.toFixed(2)} GB（十进制，硬盘/容量标注口径）</div>
       <div class="r-note">系统与 App 显示的「容量」为十进制（1GB=1,000,000,000 字节），所以 256GB 实际可用约 238GiB，属正常现象。</div>`);
  });
}

/* ---------- 工具 6：序列号/型号号码 格式校验 ---------- */
const snf=document.getElementById("snForm");
if(snf){
  snf.addEventListener("submit",e=>{
    e.preventDefault();
    const v=document.getElementById("snInput").value.trim().toUpperCase().replace(/\s/g,"");
    if(!v){showResult("snResult",`<div class="r-big" style="color:var(--err);-webkit-text-fill-color:var(--err)">请输入序列号或型号号码</div>`);return;}
    const isSN=/^[A-Z0-9]{10,12}$/.test(v)&&/[A-Z]/.test(v);
    const isModelNum=/^[A-Z0-9]{4,6}[A-Z]{1,2}\/[A-Z]$/i.test(v)||/^M[A-Z0-9]{3,5}[A-Z]{2}\/[A-Z]$/.test(v);
    if(isModelNum){
      showResult("snResult",
        `<div class="r-big" style="font-size:22px">有效型号号码（Part Number）</div>
        <div class="r-info"><span class="badge ok">格式通过</span><span class="badge info">尾缀 ${v.slice(-2)} 通常表示销售地区</span></div>
        <div class="r-note">例：MYD82CH/A 中「CH」代表中国大陆国行。型号号码格式不能完全证明真伪，请结合保修查询核实。</div>`);
    }else if(isSN){
      showResult("snResult",
        `<div class="r-big" style="font-size:22px">序列号格式有效</div>
        <div class="r-info"><span class="badge ok">${v.length} 位字母数字</span></div>
        <div class="r-note">序列号通常为 10–12 位字母数字混合。格式合规不等于真机，请到 Apple 官网用序列号查询保修/激活日期做最终核验。</div>`);
    }else{
      showResult("snResult",
        `<div class="r-big" style="color:var(--err);-webkit-text-fill-color:var(--err)">格式无法识别</div>
        <div class="r-info">序列号应为 10–12 位字母数字；型号号码形如 MYD82CH/A。</div>`);
    }
  });
}

/* ---------- 渲染：iOS 版本时间线 ---------- */
const tl=document.getElementById("timeline");
if(tl){
  tl.innerHTML=IOS_VERSIONS.map(x=>{
    const [yy]=x.d.split("-");
    return `<div class="tl-item"><div class="tl-year">${yy}</div><div class="tl-body"><b>${x.v}</b><span class="v">${x.d}</span><p>${x.t}</p></div></div>`;
  }).join("");
}

/* ---------- 渲染：型号规格表 ---------- */
const specTable=document.getElementById("specTable");
if(specTable){
  const trs=IPHONE_SPECS.map(x=>
    `<tr><td><b>${x.m}</b></td><td>${x.y}</td><td>${x.s}</td><td class="mono">${x.r}</td><td>${x.p}</td><td>${x.c}</td><td>${x.h||"—"}</td></tr>`
  ).join("");
  specTable.innerHTML=`<tr><th>机型</th><th>年份</th><th>屏幕</th><th>分辨率</th><th>PPI</th><th>芯片</th><th>刷新率</th></tr>${trs}`;
}

/* ---------- 渲染：FAQ ---------- */
const faqBox=document.getElementById("faqBox");
if(faqBox){
  faqBox.innerHTML=FAQS.map(x=>`<details><summary>${x.q}</summary><p>${x.a}</p></details>`).join("");
}

/* ---------- 年份版权 ---------- */
const yr=document.getElementById("year");
if(yr)yr.textContent=new Date().getFullYear();

})();

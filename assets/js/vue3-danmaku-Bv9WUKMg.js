import{d as I,r as c,c as o,y as M,o as P,a as R,a2 as V,h as _,n as j,j as q,k as U,l as Z,m as F,Z as G}from"./@vue-Gr9oIQRV.js";var X=I({name:"vue3-danmaku",components:{},props:{danmus:{type:Array,required:!0,default:()=>[]},channels:{type:Number,default:0},autoplay:{type:Boolean,default:!0},loop:{type:Boolean,default:!1},useSlot:{type:Boolean,default:!1},debounce:{type:Number,default:100},speeds:{type:Number,default:200},randomChannel:{type:Boolean,default:!1},fontSize:{type:Number,default:18},top:{type:Number,default:4},right:{type:Number,default:0},isSuspend:{type:Boolean,default:!1},extraStyle:{type:String,default:""}},emits:["list-end","play-end","dm-over","dm-out","update:danmus"],setup(a,{emit:d,slots:x}){let f=c(document.createElement("div")),l=c(document.createElement("div"));const v=c(0),B=c(0);let C=0;const $=c(0),E=c(0),p=c(0),L=c(!1),y=c(!1),g=c({}),u=function(n,s,e="modelValue"){return o({get:()=>n[e],set:t=>{s(`update:${e}`,t)}})}(a,d,"danmus"),i=M({channels:o(()=>a.channels||$.value),autoplay:o(()=>a.autoplay),loop:o(()=>a.loop),useSlot:o(()=>a.useSlot),debounce:o(()=>a.debounce),randomChannel:o(()=>a.randomChannel)}),r=M({height:o(()=>E.value),fontSize:o(()=>a.fontSize),speeds:o(()=>a.speeds),top:o(()=>a.top),right:o(()=>a.right)});function z(){T(),a.isSuspend&&function(){let n=[];l.value.addEventListener("mouseover",s=>{let e=s.target;e.className.includes("dm")||(e=e.closest(".dm")||e),e.className.includes("dm")&&(n.includes(e)||(d("dm-over",{el:e}),e.classList.add("pause"),n.push(e)))}),l.value.addEventListener("mouseout",s=>{let e=s.target;e.className.includes("dm")||(e=e.closest(".dm")||e),e.className.includes("dm")&&(d("dm-out",{el:e}),e.classList.remove("pause"),n.forEach(t=>{t.classList.remove("pause")}),n=[])})}(),i.autoplay&&W()}function T(){if(v.value=f.value.offsetWidth,B.value=f.value.offsetHeight,v.value===0||B.value===0)throw new Error("获取不到容器宽高")}function W(){y.value=!1,C||(C=window.setInterval(()=>function(){if(!y.value&&u.value.length)if(p.value>u.value.length-1){const n=l.value.children.length;i.loop&&(n<p.value&&(d("list-end"),p.value=0),N())}else N()}(),i.debounce))}function N(n){const s=i.loop?p.value%u.value.length:p.value,e=n||u.value[s];let t=document.createElement("div");i.useSlot?t=function(b,m){return V({render:()=>_("div",{},[x.dm&&x.dm({danmu:b,index:m})])}).mount(document.createElement("div"))}(e,s).$el:(t.innerHTML=e,t.setAttribute("style",a.extraStyle),t.style.fontSize=`${r.fontSize}px`,t.style.lineHeight=`${r.fontSize}px`),t.classList.add("dm"),l.value.appendChild(t),t.style.opacity="0",j(()=>{r.height||(E.value=t.offsetHeight),i.channels||($.value=Math.floor(B.value/(r.height+r.top)));let b=function(m){let k=[...Array(i.channels).keys()];i.randomChannel&&(k=k.sort(()=>.5-Math.random()));for(let h of k){const w=g.value[h];if(!w||!w.length)return g.value[h]=[m],m.addEventListener("animationend",()=>g.value[h].splice(0,1)),h%i.channels;for(let S=0;S<w.length;S++){const H=D(w[S])-10;if(H<=.88*(m.offsetWidth-w[S].offsetWidth)||H<=0)break;if(S===w.length-1)return g.value[h].push(m),m.addEventListener("animationend",()=>g.value[h].splice(0,1)),h%i.channels}}return-1}(t);if(b>=0){const m=t.offsetWidth,k=r.height;t.classList.add("move"),t.dataset.index=`${s}`,t.dataset.channel=b.toString(),t.style.opacity="1",t.style.top=b*(k+r.top)+"px",t.style.width=m+r.right+"px",t.style.setProperty("--dm-scroll-width",`-${v.value+m}px`),t.style.left=`${v.value}px`,t.style.animationDuration=v.value/r.speeds+"s",t.addEventListener("animationend",()=>{Number(t.dataset.index)!==u.value.length-1||i.loop||d("play-end",t.dataset.index),l.value&&l.value.removeChild(t)}),p.value++}else l.value.removeChild(t)})}function D(n){const s=n.offsetWidth||parseInt(n.style.width),e=n.getBoundingClientRect().right||l.value.getBoundingClientRect().right+s;return l.value.getBoundingClientRect().right-e}function A(){clearInterval(C),C=0,p.value=0}return P(()=>{z()}),R(()=>{A()}),{container:f,dmContainer:l,hidden:L,paused:y,danmuList:u,getPlayState:function(){return!y.value},resize:function(){T();const n=l.value.getElementsByClassName("dm");for(let s=0;s<n.length;s++){const e=n[s];e.style.setProperty("--dm-scroll-width",`-${v.value+e.offsetWidth}px`),e.style.left=`${v.value}px`,e.style.animationDuration=v.value/r.speeds+"s"}},play:W,pause:function(){y.value=!0},stop:function(){g.value={},l.value.innerHTML="",y.value=!0,L.value=!1,A()},show:function(){L.value=!1},hide:function(){L.value=!0},reset:function(){E.value=0,z()},add:function(n){if(p.value===u.value.length)return u.value.push(n),u.value.length-1;{const s=p.value%u.value.length;return u.value.splice(s,0,n),s+1}},push:function(n){return u.value.push(n),u.value.length-1},insert:N}}});const J={ref:"container",class:"vue-danmaku"};(function(a,d){d===void 0&&(d={});var x=d.insertAt;if(typeof document<"u"){var f=document.head||document.getElementsByTagName("head")[0],l=document.createElement("style");l.type="text/css",x==="top"&&f.firstChild?f.insertBefore(l,f.firstChild):f.appendChild(l),l.styleSheet?l.styleSheet.cssText=a:l.appendChild(document.createTextNode(a))}})(`.vue-danmaku {
  position: relative;
  overflow: hidden;
}
.vue-danmaku .danmus {
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  -webkit-transition: all 0.3s;
  transition: all 0.3s;
}
.vue-danmaku .danmus.show {
  opacity: 1;
}
.vue-danmaku .danmus.paused .dm.move {
  animation-play-state: paused;
}
.vue-danmaku .danmus .dm {
  position: absolute;
  font-size: 20px;
  color: #ddd;
  white-space: pre;
  transform: translateX(0);
  transform-style: preserve-3d;
}
.vue-danmaku .danmus .dm.move {
  will-change: transform;
  animation-name: moveLeft;
  animation-timing-function: linear;
  animation-play-state: running;
}
.vue-danmaku .danmus .dm.pause {
  animation-play-state: paused;
  z-index: 100;
}
@keyframes moveLeft {
  from {
    transform: translateX(0);
  }
  to {
    transform: translateX(var(--dm-scroll-width));
  }
}
@-webkit-keyframes moveLeft {
  from {
    -webkit-transform: translateX(0);
  }
  to {
    -webkit-transform: translateX(var(--dm-scroll-width));
  }
}`),X.render=function(a,d,x,f,l,v){return U(),q("div",J,[Z("div",{ref:"dmContainer",class:G(["danmus",{show:!a.hidden},{paused:a.paused}])},null,2),F(a.$slots,"default")],512)},X.__file="src/lib/Danmaku.vue";export{X as f};

var l="pulse-toasts";var m=new Set(["success","error","warning","info"]),p=`
#pulse-toasts {
  position: fixed;
  top: 1rem;
  right: 1rem;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: .5rem;
  pointer-events: none;
  max-width: min(24rem, calc(100vw - 2rem));
}
.pulse-toast {
  display: flex;
  align-items: flex-start;
  gap: .75rem;
  padding: .75rem 1rem;
  border-radius: .5rem;
  box-shadow: 0 4px 16px rgba(0,0,0,.2);
  font-size: .875rem;
  line-height: 1.4;
  pointer-events: all;
  opacity: 0;
  transform: translateX(calc(100% + 1.5rem));
  transition: opacity .2s ease, transform .2s ease;
  background: #1e293b;
  color: #f8fafc;
}
.pulse-toast--visible {
  opacity: 1;
  transform: translateX(0);
}
.pulse-toast--success { background: #166534; }
.pulse-toast--error   { background: #991b1b; }
.pulse-toast--warning { background: #92400e; }
.pulse-toast-message  { flex: 1; }
.pulse-toast-close {
  background: none;
  border: none;
  color: inherit;
  cursor: pointer;
  padding: 0 0 0 .25rem;
  font-size: 1.125rem;
  line-height: 1;
  opacity: .7;
  flex-shrink: 0;
}
.pulse-toast-close:hover { opacity: 1; }
`,c=!1;function f(){if(c)return;c=!0;let e=document.createElement("style");e.textContent=p,document.head.appendChild(e)}function g(){let e=document.getElementById(l);return e||(f(),e=document.createElement("div"),e.id=l,e.setAttribute("aria-live","polite"),e.setAttribute("aria-atomic","false"),document.body.appendChild(e)),e}function b(e){if(typeof document>"u")return;let{message:a,variant:i="info",duration:r=4e3}=typeof e=="string"?{message:e}:e;if(!a)return;let u=m.has(i)?i:"info",n=g();for(;n.children.length>=5;)n.firstElementChild?.remove();let t=document.createElement("div");t.className=`pulse-toast pulse-toast--${u}`,t.setAttribute("role","status");let o=document.createElement("span");o.className="pulse-toast-message",o.textContent=a;let s=document.createElement("button");s.className="pulse-toast-close",s.setAttribute("aria-label","Dismiss notification"),s.textContent="\xD7",s.addEventListener("click",()=>d(t)),t.appendChild(o),t.appendChild(s),n.appendChild(t),requestAnimationFrame(()=>t.classList.add("pulse-toast--visible")),r>0&&setTimeout(()=>d(t),r)}function d(e){e.classList.remove("pulse-toast--visible"),e.addEventListener("transitionend",()=>e.remove(),{once:!0})}export{b as showToast};

/* Hover preview — rest on a shiur card and it begins to play, silently, in place.
   Shared by the homepage and the shiurim wing; delegated on document, so it covers
   every row and grid, including cards inserted later.
   Deliberate limits: desktop pointers only (a phone cannot hover and must not spend
   a visitor's data), off under reduced-motion, one preview at a time, and a dwell
   delay so sweeping the mouse across a row doesn't spawn a dozen videos. */
(function () {
  "use strict";
  var CDN = "https://ravarush-media.nyc3.cdn.digitaloceanspaces.com";
  if (!matchMedia("(hover: hover) and (pointer: fine)").matches) return;
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  var DWELL = 380, timer = null, host = null, vid = null;

  function stop() {
    clearTimeout(timer); timer = null;
    if (vid) { try { vid.pause(); vid.removeAttribute("src"); vid.load(); } catch (e) {} vid.remove(); vid = null; }
    if (host) { host.classList.remove("previewing"); host = null; }
  }
  function start(el, id) {
    stop(); host = el;
    var top = el.querySelector(".sc-top") || el;
    var v = document.createElement("video");
    v.className = "sc-prev";
    v.muted = true; v.defaultMuted = true; v.playsInline = true; v.loop = true;
    v.preload = "auto"; v.setAttribute("aria-hidden", "true"); v.tabIndex = -1;
    v.src = CDN + "/video/" + id + ".mp4";
    vid = v;
    // a slow load must never paint over a preview that has already replaced it
    v.addEventListener("loadeddata", function () {
      if (vid === v && host === el) { v.classList.add("on"); el.classList.add("previewing"); }
    }, { once: true });
    v.addEventListener("error", function () { if (vid === v) stop(); }, { once: true });
    top.appendChild(v);
    var p = v.play(); if (p && p.catch) p.catch(function () { if (vid === v) stop(); });
  }

  document.addEventListener("pointerover", function (e) {
    if (e.pointerType && e.pointerType !== "mouse") return;
    var el = e.target.closest(".sc"); if (!el || el === host) return;
    if (el.dataset.v !== "1" || !el.dataset.id) return stop();
    stop(); timer = setTimeout(function () { start(el, el.dataset.id); }, DWELL);
  });
  document.addEventListener("pointerout", function (e) {
    if (!host) return;
    var to = e.relatedTarget; if (to && host.contains && host.contains(to)) return;
    stop();
  });
  addEventListener("scroll", function () { if (host && !host.isConnected) stop(); }, { passive: true });
  addEventListener("blur", stop);
})();

/* CineCal genre picker fix: max 4 genres, counter, visible Done button,
   search clears after each pick, themed colors. Loaded after the main script. */
(function () {
  "use strict";
  var MAX = 4;
  var POPULAR = ["Action", "Adventure", "Comedy", "Crime", "Horror", "Thriller"];
  var OTHERS = [
    "Animation", "Anime", "Biography", "Documentary", "Drama",
    "Family", "Fantasy", "Historical", "History", "Martial Arts",
    "Mystery", "Musical", "Music", "Romance", "Sci-Fi", "Sport",
    "Superhero", "Supernatural", "War", "Western", "Psychological",
    "Political", "Suspense", "Survival", "Disaster", "Detective",
    "Gangster", "Heist", "Spy", "Zombie", "Vampire", "Monster",
    "Coming-of-Age", "Teen", "Parody", "Satire", "Dark Comedy",
    "Romantic Comedy", "Romantic Drama", "Psychological Thriller",
    "Psychological Horror", "Crime Thriller", "Action Thriller",
    "Time Travel", "Post-Apocalyptic", "Dystopian", "Cyberpunk",
    "Mythology", "Religious", "Short Film", "Experimental"
  ];

  var oldField = document.getElementById("genreField");
  if (!oldField) return;

  var css = [
    ".gp-field{position:relative;width:100%}",
    ".gp-control{display:flex;flex-wrap:wrap;align-items:center;gap:6px;min-height:44px;padding:6px 8px;border:1px solid var(--line);border-radius:10px;background:var(--s2);cursor:text}",
    ".gp-control:focus-within{border-color:var(--a)}",
    ".gp-control input[type=text]{flex:1;min-width:120px;width:auto;border:0;background:transparent;padding:6px 4px;border-radius:0}",
    ".gp-control input[type=text]:focus{outline:0}",
    ".gp-tags{display:contents}",
    ".gp-tag{display:inline-flex;align-items:center;gap:2px;padding:3px 4px 3px 10px;border-radius:99px;background:var(--soft);color:var(--a);font-size:13px;font-weight:600}",
    ".gp-tag button{border:0;background:transparent;color:inherit;font-size:17px;line-height:1;padding:2px 6px;border-radius:50%}",
    ".gp-tag button:hover{background:var(--a);color:#fff}",
    ".gp-menu{margin-top:8px;padding:0 12px 4px;max-height:270px;overflow-y:auto;border:1px solid var(--line);border-radius:12px;background:var(--bg)}",
    ".gp-menu[hidden],.gp-head[hidden],.gp-none[hidden]{display:none}",
    ".gp-bar{position:sticky;top:0;z-index:2;display:flex;align-items:center;justify-content:space-between;gap:10px;margin:0 -12px 10px;padding:9px 12px;background:var(--bg);border-bottom:1px solid var(--line);font-size:13px;font-weight:600;color:var(--m)}",
    ".gp-bar.full span{color:var(--a)}",
    ".gp-head{color:var(--m);font-size:12px;font-weight:600;margin:4px 0 8px}",
    ".gp-opts{display:flex;flex-wrap:wrap;gap:7px;margin-bottom:10px}",
    ".gp-opt{padding:6px 12px;border:1px solid var(--line);border-radius:99px;background:var(--s2);font-size:13px}",
    ".gp-opt:hover{border-color:var(--a)}",
    ".gp-opt.selected{background:var(--a);border-color:var(--a);color:#fff}",
    ".gp-opt:disabled{opacity:.4;cursor:not-allowed}.gp-opt:disabled:hover{border-color:var(--line)}",
    ".gp-none{color:var(--m);font-size:13px}"
  ].join("\n");
  var style = document.createElement("style");
  style.textContent = css;
  document.head.appendChild(style);

  var box = document.createElement("div");
  box.className = "gp-field";
  box.id = "gpField";
  box.innerHTML =
    '<label for="gpInput">Genre</label>' +
    '<div class="gp-control" id="gpControl"><div class="gp-tags" id="gpTags"></div>' +
    '<input type="text" id="gpInput" placeholder="Search or pick genres" autocomplete="off" maxlength="30"></div>' +
    '<div class="gp-menu" id="gpMenu" hidden>' +
    '<div class="gp-bar" id="gpBar"><span id="gpCount"></span><button type="button" class="btn p sm" id="gpDone">Done</button></div>' +
    '<div class="gp-head">Popular</div><div class="gp-opts" id="gpPop"></div>' +
    '<div class="gp-head">Others</div><div class="gp-opts" id="gpOth"></div>' +
    '<div class="gp-none" id="gpNone" hidden>No match. Press Enter to add it as a new genre.</div>' +
    "</div>";
  oldField.replaceWith(box);

  var $ = function (id) { return document.getElementById(id); };
  var input = $("gpInput"), menu = $("gpMenu");
  var selected = [];
     // ফোনে কিবোর্ড বন্ধ: শুধু ট্যাপ করে জনরা বাছা যাবে
  var mq = window.matchMedia("(max-width:560px)");
  function applyPhoneMode() {
    var on = mq.matches;
    input.readOnly = on;
    input.setAttribute("inputmode", on ? "none" : "text");
    input.style.caretColor = on ? "transparent" : "";
    input.style.cursor = on ? "pointer" : "";
    if (on) input.value = "";
  }
  applyPhoneMode();
  if (mq.addEventListener) mq.addEventListener("change", applyPhoneMode);

  function say(t) { if (typeof toast === "function") toast(t); }

  function render(open) {
    var q = input.value.trim().toLowerCase();
    var full = selected.length >= MAX;

    function fill(list, boxEl) {
      boxEl.replaceChildren();
      var hits = list.filter(function (g) { return g.toLowerCase().indexOf(q) !== -1; });
      hits.forEach(function (g) {
        var on = selected.indexOf(g) !== -1;
        var b = document.createElement("button");
        b.type = "button";
        b.className = "gp-opt" + (on ? " selected" : "");
        b.disabled = full && !on;
        b.textContent = (on ? "\u2713 " : "") + g;
        b.onclick = function () { toggle(g); };
        boxEl.appendChild(b);
      });
      boxEl.previousElementSibling.hidden = !hits.length;
      return hits.length;
    }

    var n = fill(POPULAR, $("gpPop")) + fill(OTHERS, $("gpOth"));
    $("gpNone").hidden = n > 0 || !q;

    var tags = $("gpTags");
    tags.replaceChildren();
    selected.forEach(function (g) {
      var t = document.createElement("span");
      t.className = "gp-tag";
      t.appendChild(document.createTextNode(g));
      var x = document.createElement("button");
      x.type = "button";
      x.textContent = "\u00d7";
      x.setAttribute("aria-label", "Remove " + g);
      x.onclick = function () {
        selected = selected.filter(function (v) { return v !== g; });
        render(true);
        input.focus();
      };
      t.appendChild(x);
      tags.appendChild(t);
    });

    $("gpCount").textContent = full
      ? MAX + " of " + MAX + " picked. Remove one to change."
      : selected.length + " of " + MAX + " picked. Choose up to " + MAX + ".";
    $("gpBar").classList.toggle("full", full);
    input.placeholder = full ? "Limit reached" : (mq.matches ? "Tap to pick genres" : "Search or pick genres");
    if (open) menu.hidden = false;
  }

  function toggle(g) {
    if (selected.indexOf(g) === -1 && selected.length >= MAX) {
      say("You can pick up to " + MAX + " genres");
      return;
    }
    selected = selected.indexOf(g) !== -1
      ? selected.filter(function (v) { return v !== g; })
      : selected.concat(g);
    input.value = "";
    render(true);
    input.focus();
  }

  function commitTyped() {
    var raw = input.value.replace(/,/g, " ").replace(/\s+/g, " ").trim();
    if (!raw) return;
    var all = POPULAR.concat(OTHERS);
    var hit = all.filter(function (g) { return g.toLowerCase().indexOf(raw.toLowerCase()) !== -1; })[0];
    var g = hit || raw.replace(/\b\w/g, function (c) { return c.toUpperCase(); }).slice(0, 30);
    if (selected.length >= MAX) { say("You can pick up to " + MAX + " genres"); return; }
    var dup = selected.some(function (v) { return v.toLowerCase() === g.toLowerCase(); });
    if (!dup) selected.push(g);
    input.value = "";
    render(true);
  }

  input.addEventListener("focus", function () {
    render(true);
    setTimeout(function () { menu.scrollIntoView({ block: "nearest", behavior: "smooth" }); }, 60);
  });
  input.addEventListener("input", function () { render(true); });
  input.addEventListener("keydown", function (e) {
    if (e.key === "Enter") { e.preventDefault(); commitTyped(); }
    else if (e.key === "Backspace" && !input.value && selected.length) { selected.pop(); render(true); }
    else if (e.key === "Escape" && !menu.hidden) { e.stopPropagation(); menu.hidden = true; }
  });
  $("gpControl").addEventListener("click", function () { input.focus(); render(true); });
  $("gpDone").addEventListener("click", function () {
    input.value = "";
    input.blur();
    render(false);
    menu.hidden = true;
  });
  // pointerdown fires before any re-render, so the clicked button is still in the page
  document.addEventListener("pointerdown", function (e) {
    if (!e.target.closest("#gpField")) menu.hidden = true;
  });

  // Replace the old global helpers used by the form (openM and the save button)
  window.setSelectedGenres = function (value) {
    selected = String(value || "").split(",").map(function (g) { return g.trim(); })
      .filter(Boolean).slice(0, MAX);
    input.value = "";
    render(false);
    menu.hidden = true;
  };
  window.getSelectedGenres = function () { return selected.join(", "); };

  render(false);
})();

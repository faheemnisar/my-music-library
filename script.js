(() => {
  "use strict";
  const SONGS_KEY = "mysound-library-v1";
  const LISTS_KEY = "mysound-playlists-v1";
  const $ = id => document.getElementById(id);
  const state = { songs: read(SONGS_KEY), playlists: read(LISTS_KEY), currentId: null, view: "home", query: "", activePlaylist: null };
  let toastTimer;
  function read(key) { try { const v = JSON.parse(localStorage.getItem(key)); return Array.isArray(v) ? v : []; } catch { return []; } }
  function persist() { localStorage.setItem(SONGS_KEY, JSON.stringify(state.songs)); localStorage.setItem(LISTS_KEY, JSON.stringify(state.playlists)); render(); }
  function esc(v) { return String(v ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c])); }
  function toast(message) { const el = $("toast"); el.textContent = message; el.classList.add("show"); clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.remove("show"), 2400); }
  function getVideoId(raw) {
    try {
      const u = new URL(raw); const host = u.hostname.toLowerCase();
      if (host === "youtu.be" || host === "www.youtu.be") return u.pathname.split("/").filter(Boolean)[0] || null;
      if (!(host === "youtube.com" || host.endsWith(".youtube.com") || host === "youtube-nocookie.com" || host.endsWith(".youtube-nocookie.com"))) return null;
      if (u.pathname === "/watch") return u.searchParams.get("v");
      const match = u.pathname.match(/^\/(?:embed|shorts|live)\/([^/?]+)/);
      return match ? match[1] : null;
    } catch { return null; }
  }
  function currentSong() { return state.songs.find(s => s.id === state.currentId) || null; }
  function openDialog(id) { const d = $(id); if (typeof d.showModal === "function") d.showModal(); else d.setAttribute("open", ""); }
  function closeDialog(id) { const d = $(id); if (typeof d.close === "function") d.close(); else d.removeAttribute("open"); }
  function setView(view) {
    state.view = view; state.activePlaylist = null;
    document.querySelectorAll(".nav").forEach(b => b.classList.toggle("active", b.dataset.view === view));
    const config = view === "liked"
      ? ["Songs you <em>love.</em>", "All the tracks you've given a heart.", "Liked songs"]
      : view === "playlists"
        ? ["Your own <em>collections.</em>", "A playlist for every kind of day.", "Your library"]
        : ["Your music, <em>your mood.</em>", "Keep the songs you love close.", "Recently added"];
    $("page-title").innerHTML = config[0]; $("page-subtitle").textContent = config[1]; $("songs-heading").textContent = config[2];
    $("playlists-section").style.display = view === "liked" ? "none" : "";
    renderSongs();
  }
  function songsVisible() {
    let list = [...state.songs].reverse();
    if (state.view === "liked") list = list.filter(s => s.liked);
    if (state.activePlaylist) { const p = state.playlists.find(x => x.id === state.activePlaylist); list = p ? list.filter(s => p.songIds.includes(s.id)) : []; }
    if (state.query.trim()) { const q = state.query.toLowerCase(); list = list.filter(s => `${s.title} ${s.artist} ${s.url}`.toLowerCase().includes(q)); }
    return list;
  }
  function renderSongs() {
    const songs = songsVisible();
    $("songs-list").innerHTML = songs.map((s,i) => `<div class="song-row">
      <span class="song-number">${String(i+1).padStart(2,"0")}</span>
      <div class="song-cover">${s.videoId ? `<img loading="lazy" alt="" src="https://i.ytimg.com/vi/${encodeURIComponent(s.videoId)}/mqdefault.jpg" onerror="this.style.display='none'">` : ""}♫</div>
      <button class="song-info" data-action="play" data-id="${esc(s.id)}"><b>${esc(s.title)}</b><span>${esc(s.artist || "Unknown artist")}</span></button>
      <button class="row-btn" data-action="play" data-id="${esc(s.id)}" aria-label="Play song">▶</button>
      <button class="row-btn ${s.liked ? "liked" : ""}" data-action="like" data-id="${esc(s.id)}" aria-label="${s.liked ? "Unlike" : "Like"} song">${s.liked ? "♥" : "♡"}</button>
      <button class="row-btn" data-action="more" data-id="${esc(s.id)}" aria-label="Song options">⋯</button>
    </div>`).join("");
    $("songs-list").style.display = songs.length ? "" : "none";
    $("empty").classList.toggle("visible", songs.length === 0);
    $("empty").querySelector("h3").textContent = state.query ? "No matches found" : state.view === "liked" ? "No liked songs yet" : state.activePlaylist ? "This playlist is empty" : "Your library starts here";
    $("empty").querySelector("p").textContent = state.query ? "Try another title, artist, or link." : "Add a YouTube link to save a song in your personal collection.";
    $("empty-add").style.display = state.view === "liked" || state.query ? "none" : "";
    if (state.activePlaylist) $("songs-heading").textContent = state.playlists.find(p => p.id === state.activePlaylist)?.name || "Playlist";
    else if (state.view === "home") $("songs-heading").textContent = "Recently added";
    else if (state.view === "liked") $("songs-heading").textContent = "Liked songs";
  }
  function renderPlaylists() {
    const grid = $("playlist-grid");
    if (!state.playlists.length) { grid.innerHTML = `<button class="playlist-card" id="first-playlist"><div class="playlist-art">＋</div><b>Create a playlist</b><small>Collect songs by mood</small></button>`; return; }
    grid.innerHTML = state.playlists.map((p,i) => `<div class="playlist-card" data-playlist="${esc(p.id)}" role="button" tabindex="0" aria-label="Open ${esc(p.name)}"><button class="delete-playlist" data-delete-playlist="${esc(p.id)}" aria-label="Delete playlist">×</button><div class="playlist-art">${["♫","♪","♬","✦","☾","✧"][i%6]}</div><b>${esc(p.name)}</b><small>${p.songIds.length} ${p.songIds.length===1?"song":"songs"}</small></div>`).join("");
  }
  function updatePlayer() {
    const s = currentSong(); $("current-title").textContent = s ? s.title : "Nothing playing yet"; $("current-artist").textContent = s ? (s.artist || "Unknown artist") : "Add a song to get started";
    $("large-title").textContent = s ? s.title : "Nothing playing yet"; $("large-artist").textContent = s ? (s.artist || "Unknown artist") : "Your soundtrack awaits.";
    $("like-current").textContent = s?.liked ? "♥" : "♡"; $("like-current").classList.toggle("liked", !!s?.liked);
    $("play").textContent = s ? "Ⅱ" : "▶"; $("player-hint").textContent = s ? "Open the player to listen" : "Choose a song to start listening";
  }
  function render() {
    $("liked-count").textContent = state.songs.filter(s=>s.liked).length; $("stat-liked").textContent = state.songs.filter(s=>s.liked).length;
    $("stat-total").textContent = state.songs.length; $("stat-playlists").textContent = state.playlists.length;
    renderSongs(); renderPlaylists(); updatePlayer();
  }
  function openAdd() { $("song-error").textContent = ""; $("song-form").reset(); openDialog("song-dialog"); setTimeout(() => $("song-url").focus(), 40); }
  function openPlaylist() { $("playlist-error").textContent = ""; $("playlist-form").reset(); openDialog("playlist-dialog"); setTimeout(() => $("playlist-name").focus(), 40); }
  function mountEmbed(s) {
    const wrap = $("embed");
    if (!s.videoId) { wrap.innerHTML = `<div class="embed-placeholder"><span>♫</span><p>This URL can't be embedded as a video. Open it on YouTube instead.</p><a class="primary" href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">Open on YouTube ↗</a></div>`; return; }
    if (wrap.querySelector("iframe")?.dataset.videoId === s.videoId) return;
    wrap.innerHTML = `<iframe title="YouTube player for ${esc(s.title)}" data-video-id="${esc(s.videoId)}" src="https://www.youtube-nocookie.com/embed/${encodeURIComponent(s.videoId)}?autoplay=1&rel=0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>`;
  }
  function playSong(id) { const s = state.songs.find(x=>x.id===id); if(!s) return; state.currentId=id; mountEmbed(s); updatePlayer(); openDialog("player-dialog"); }
  $("add-song").addEventListener("click", openAdd); $("empty-add").addEventListener("click", openAdd); $("new-playlist").addEventListener("click", openPlaylist);
  document.querySelectorAll("[data-close]").forEach(b=>b.addEventListener("click",()=>closeDialog(b.dataset.close)));
  document.querySelectorAll(".nav").forEach(b=>b.addEventListener("click",()=>setView(b.dataset.view)));
  $("search").addEventListener("input",e=>{state.query=e.target.value;renderSongs();});
  document.addEventListener("keydown",e=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==="k"){e.preventDefault();$("search").focus();}});
  $("view-all").addEventListener("click",()=>{state.query="";$("search").value="";setView("home");$("songs-section").scrollIntoView({behavior:"smooth",block:"start"});});
  $("song-form").addEventListener("submit",e=>{
    e.preventDefault(); const url=$("song-url").value.trim(); let parsed;
    try { parsed = new URL(url); } catch { $("song-error").textContent="Please paste a valid YouTube or YouTube Music URL."; return; }
    const host=parsed.hostname.toLowerCase(); const allowed=host==="youtu.be"||host.endsWith(".youtu.be")||host==="youtube.com"||host.endsWith(".youtube.com")||host==="youtube-nocookie.com"||host.endsWith(".youtube-nocookie.com");
    if (!/^https?:$/.test(parsed.protocol)||!allowed) { $("song-error").textContent="Use a link from YouTube or YouTube Music."; return; }
    const vid=getVideoId(url); if(!vid && !host.includes("music.youtube.com")){ $("song-error").textContent="That link format isn't supported. Try a YouTube video/watch link."; return; }
    if(vid && state.songs.some(s=>s.videoId===vid)){ $("song-error").textContent="That video is already in your library."; return; }
    const song={id:(crypto.randomUUID?crypto.randomUUID():String(Date.now())),url:vid?`https://www.youtube.com/watch?v=${encodeURIComponent(vid)}`:url,videoId:vid,title:$("song-title").value.trim()||(vid?"YouTube track":"Saved YouTube link"),artist:$("song-artist").value.trim()||"Unknown artist",liked:false,addedAt:Date.now()};
    state.songs.push(song); state.query=""; $("search").value=""; closeDialog("song-dialog"); setView("home"); persist(); toast("Song added to your library"); playSong(song.id);
  });
  $("playlist-form").addEventListener("submit",e=>{e.preventDefault();const name=$("playlist-name").value.trim();if(!name){$("playlist-error").textContent="Choose a playlist name.";return;}if(state.playlists.some(p=>p.name.toLowerCase()===name.toLowerCase())){$("playlist-error").textContent="A playlist with that name already exists.";return;}state.playlists.push({id:crypto.randomUUID?crypto.randomUUID():String(Date.now()),name,songIds:[]});closeDialog("playlist-dialog");persist();toast("Playlist created");});
  $("songs-list").addEventListener("click",e=>{const b=e.target.closest("[data-action]");if(!b)return;const s=state.songs.find(x=>x.id===b.dataset.id);if(!s)return;
    if(b.dataset.action==="play")playSong(s.id);
    else if(b.dataset.action==="like"){s.liked=!s.liked;persist();toast(s.liked?"Added to Liked Songs":"Removed from Liked Songs");}
    else if(b.dataset.action==="more"){
      const action=prompt("Song options:\n1 — Add to a playlist\n2 — Edit title and artist\n3 — Remove song\n\nEnter 1, 2, or 3");
      if(action==="1"){if(!state.playlists.length){toast("Create a playlist first");openPlaylist();return;}const opts=state.playlists.map((p,i)=>`${i+1} — ${p.name}`).join("\n");const choice=Number(prompt("Choose a playlist number:\n"+opts));if(choice>=1&&choice<=state.playlists.length){const p=state.playlists[choice-1];if(!p.songIds.includes(s.id))p.songIds.push(s.id);persist();toast("Added to "+p.name);}}
      else if(action==="2"){const title=prompt("Song title:",s.title);if(title===null)return;const artist=prompt("Artist:",s.artist);if(artist===null)return;s.title=title.trim()||"Untitled";s.artist=artist.trim()||"Unknown artist";persist();toast("Song details updated");}
      else if(action==="3"&&confirm(`Remove “${s.title}” from your library?`)){state.songs=state.songs.filter(x=>x.id!==s.id);state.playlists.forEach(p=>p.songIds=p.songIds.filter(id=>id!==s.id));if(state.currentId===s.id){state.currentId=null;$("embed").innerHTML='<div class="embed-placeholder"><span>♫</span><p>Choose a song to play it here.</p></div>';}persist();toast("Song removed");}
    }
  });
  $("playlist-grid").addEventListener("click",e=>{const del=e.target.closest("[data-delete-playlist]");if(del){e.stopPropagation();const p=state.playlists.find(x=>x.id===del.dataset.deletePlaylist);if(p&&confirm(`Delete playlist “${p.name}”? Your songs will stay in the library.`)){state.playlists=state.playlists.filter(x=>x.id!==p.id);if(state.activePlaylist===p.id)state.activePlaylist=null;persist();toast("Playlist deleted");}return;}if(e.target.closest("#first-playlist")){openPlaylist();return;}const card=e.target.closest("[data-playlist]");if(card){state.activePlaylist=card.dataset.playlist;$("songs-section").scrollIntoView({behavior:"smooth",block:"start"});renderSongs();}});
  $("playlist-grid").addEventListener("keydown",e=>{if((e.key==="Enter"||e.key===" ")&&e.target.matches("[data-playlist],#first-playlist")){e.preventDefault();e.target.click();}});
  $("like-current").addEventListener("click",()=>{const s=currentSong();if(!s){toast("Choose a song first");return;}s.liked=!s.liked;persist();toast(s.liked?"Added to Liked Songs":"Removed from Liked Songs");});
  $("play").addEventListener("click",()=>{const s=currentSong();if(s)playSong(s.id);else if(state.songs.length)playSong(state.songs[0].id);else openAdd();});
  function step(dir){if(!state.songs.length){openAdd();return;}let i=state.songs.findIndex(s=>s.id===state.currentId);if(i<0)i=dir>0?-1:0;playSong(state.songs[(i+dir+state.songs.length)%state.songs.length].id);}
  $("prev").addEventListener("click",()=>step(-1));$("next").addEventListener("click",()=>step(1));$("open-player").addEventListener("click",()=>{const s=currentSong();if(s){mountEmbed(s);openDialog("player-dialog");}else openAdd();});$("show-songs").addEventListener("click",()=> $("songs-section").scrollIntoView({behavior:"smooth",block:"start"}));
  $("player-dialog").addEventListener("click",e=>{if(e.target===$("player-dialog"))closeDialog("player-dialog");});
  render();setView("home");
})();

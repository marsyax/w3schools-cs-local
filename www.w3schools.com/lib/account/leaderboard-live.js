(function () {
  if (window.LeaderboardLive) return;

  // Depends on DashboardLite (token, fetchLeagueXp, fetchCohort, _tierMap, _isLoggedIn).
  // Load /lib/account/dashboard-lite.js first.
  var LB = {};

  LB.USE_MOCK_ON_FAIL = true;
  LB.PROMOTE_TOP = 5;    // top N promoted (matches pathfinder "Top 5 advance")
  LB.DEMOTE_BOTTOM = 5;  // bottom N demoted

  LB._styleId = 'leaderboard-live-style';
  LB._state = { league: null, rows: [], meRank: null, totalUsers: null };
  LB._avatarImg = '/images/lynx.svg';
  LB._tierOrder = ['wd', 'br', 'si', 'go', 'pl', 'di', 'll', 'ss', 'bs', 'sc', 'mc'];

  // ── Data: GET /league-api/leaderboard/cohort ───────────────────────────────
  // -> { users:[{nickname, weeklyXp, rank, isBoosted, tier, avatar{layers}}], userRank, totalUsers }
  LB._normalizeUsers = function (users) {
    if (!Array.isArray(users)) return [];
    return users.map(function (e, i) {
      return {
        rank: typeof e.rank === 'number' ? e.rank : i + 1,
        name: e.nickname || e.name || 'Learner',
        weeklyXp: typeof e.weeklyXp === 'number' ? e.weeklyXp : 0,
        boosted: !!e.isBoosted,
        tier: e.tier || null
      };
    }).sort(function (a, b) { return a.rank - b.rank; });
  };

  LB._fetchCohort = function () {
    return DashboardLite.fetchCohort().then(function (c) {
      return { rows: LB._normalizeUsers(c.users), meRank: c.userRank, totalUsers: c.totalUsers };
    });
  };

  // Static demo cohort for the logged-out teaser / format previews. No session,
  // no network - mirrors the shape of a real condensed board (me at rank 4, Wood
  // league) so anon visitors and the preview page see a fully populated widget.
  LB._dummy = function () {
    var data = [
      { name: 'Zephyr', xp: 240 },
      { name: 'You', xp: 190 }, // the highlighted "You" row
      { name: 'Mochi', xp: 150 },
      { name: 'Pixel', xp: 120 },
      { name: 'Blaze', xp: 90 },
      { name: 'Quokka', xp: 90 },
      { name: 'Ziggy', xp: 70 },
      { name: 'Nova', xp: 50 },
      { name: 'Bolt', xp: 30 },
      { name: 'Waffle', xp: 10 }
    ];
    var rows = data.map(function (e, i) {
      return { rank: i + 1, name: e.name, weeklyXp: e.xp, tier: 'wd' };
    });
    return { league: { tier: 'wd', daysLeft: 5 }, rows: rows, meRank: 2, totalUsers: rows.length };
  };

  // Deterministic demo cohort, used only if the live endpoint errors.
  LB._mock = function () {
    var names = ['SwiftPointer8281', 'BinaryGecko6638', 'ImpressiveFalcon7563', 'CleverCommit1721',
      'CleverPanda75', 'DynamicCommit1537', 'CoolCat', 'BrilliantCache0714', 'LogicCoder', 'BoldCat',
      'SwiftDruid', 'SmartBear', 'CleverPanda', 'CoolEagle', 'CyberGecko6773', 'EpicRobot4711',
      'CleverRobot9547', 'SwiftRobot0698', 'BrightLion', 'SavvyStack5179'];
    var rows = names.map(function (n, i) {
      return { rank: i + 1, name: n, weeklyXp: Math.max(0, 1030 - i * 53), boosted: i < 2, tier: 'll' };
    });
    return { rows: rows, meRank: 1, totalUsers: rows.length };
  };

  // Days until the weekly league resets, derived from leagueId e.g. "day-2026-06-18".
  LB._daysLeft = function (league) {
    try {
      var m = /(\d{4})-(\d{2})-(\d{2})/.exec(league && league.leagueId || '');
      if (!m) return null;
      var start = new Date(+m[1], +m[2] - 1, +m[3]);
      var end = start.getTime() + 7 * 86400000;
      var days = Math.ceil((end - Date.now()) / 86400000);
      return (days >= 0 && days <= 7) ? days : null;
    } catch (e) { return null; }
  };

  // ── View ──────────────────────────────────────────────────────────────────
  LB._injectCss = function () {
    if (document.getElementById(LB._styleId)) return;
    var css = [
      '.lb-live{max-width:760px;margin:0 auto;font-family:"Source Sans Pro","Segoe UI",sans-serif;color:#282A35}',
      // header: tier ladder + league name + advance + countdown
      '.lb2-top{display:flex;justify-content:flex-end;padding:4px 2px}',
      '.lb2-top a{color:#04AA6D;font-size:14px;font-weight:700;text-decoration:none}',
      '.lb2-top a:hover{text-decoration:underline}',
      // tier items flex-shrink so the strip also fits narrow containers (not just narrow viewports)
      '.lb2-tiers{display:flex;align-items:flex-start;justify-content:center;gap:18px;margin:4px 0 0}',
      '.lb2-tier{display:flex;flex-direction:column;align-items:center;gap:8px;font-size:15px;font-weight:600;flex:0 1 96px;min-width:0}',
      '.lb2-tier span{max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
      '.lb2-tier img{width:62px;height:62px;max-width:100%;object-fit:contain}',
      '.lb2-tier.cur{flex:0 0 auto}',
      '.lb2-tier.cur img{width:102px;height:102px;filter:drop-shadow(0 8px 20px rgba(150,120,255,.45))}',
      '.lb2-tier.cur span{display:none}',
      '.lb2-tier.locked img{filter:grayscale(1);opacity:.3}',
      '.lb2-tier.locked{color:#999}',
      '.lb2-title{font-size:22px;font-weight:700;text-align:center;margin:-16px 0 12px}',
      '.lb2-advance{text-align:center;font-size:16px;font-weight:700;margin:0 0 8px}',
      '.lb2-days{display:flex;align-items:center;justify-content:center;gap:7px;color:#888;font-size:14px;margin:0 0 16px}',
      '.lb2-days svg{width:15px;height:15px}',
      '.lb2-bar{display:flex;justify-content:center;align-items:center;gap:10px;margin:0 0 16px}',
      '.lb2-bar button{background:#fff;border:1px solid #ddd;border-radius:20px;padding:6px 16px;font-family:"Source Sans Pro",sans-serif;font-size:14px;cursor:pointer;color:#282A35}',
      '.lb2-bar button:hover{border-color:#04AA6D;color:#04AA6D}',
      '.lb2-bar .lb-note{font-size:12px;color:#999}',
      // list cards + rows
      '.lb-list{background:#fff;border-radius:12px;box-shadow:0 3px 14px rgba(0,0,0,.07);border:1px solid #eee;overflow:hidden;margin-bottom:12px}',
      '.lb-row{display:flex;align-items:center;gap:14px;padding:9px 20px;border-top:1px solid #f4f4f4}',
      '.lb-row:first-child{border-top:none}',
      '.lb-row.me{background:#e8f5e9}',
      '.lb-rank{width:26px;text-align:center;font-weight:700;font-size:15px;color:#282A35;flex-shrink:0}',
      '.lb-av{width:46px;height:46px;border-radius:8px;background:#f6f6f8;display:flex;align-items:center;justify-content:center;flex-shrink:0;overflow:hidden}',
      '.lb-av img{width:38px;height:38px;object-fit:contain}',
      '.lb-name{font-weight:700;color:#282A35;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
      '.lb-pill{flex-shrink:0;font-size:11px;font-weight:700;padding:2px 9px;border-radius:5px}',
      '.lb-pill.you{background:#D9EEE1;color:#04AA6D}',
      '.lb-pill.boost{background:#efe6ff;color:#9763f6;font-style:italic}',
      '.lb-xp{margin-left:auto;font-weight:700;font-size:15px;color:#282A35;flex-shrink:0}',
      '.lb-xp small{color:#aaa;font-weight:400}',
      // zone bands between the cards
      '.lb-zone{display:flex;align-items:center;justify-content:center;gap:10px;padding:11px;border-radius:10px;font-size:14px;font-weight:700;margin:0 0 12px}',
      '.lb-zone.promote{background:#e8f5e9;color:#04AA6D}',
      '.lb-zone.demote{background:#fdecea;color:#d93025}',
      '.lb-more{text-align:center;color:#bbb;font-size:20px;line-height:1;padding:0 0 10px}',
      // states + skeleton
      '.lb-msg{padding:40px 24px;text-align:center;color:#666;font-size:15px}',
      '.lb-cta{display:inline-block;background:#04AA6D;color:#fff;padding:6px 18px;border-radius:5px;font-family:"Source Sans Pro",sans-serif;font-size:17px;font-weight:400;line-height:1.4;text-decoration:none;margin-top:14px}',
      '.lb-cta:hover,.lb-cta:active{background:#059862;color:#fff}',
      '.lb-skel{padding:16px 24px;border-top:1px solid #f1f1f1}',
      '.lb-skel:first-child{border-top:none}',
      '.lb-skel .bar{height:14px;background:linear-gradient(90deg,#eee 25%,#f5f5f5 50%,#eee 75%);background-size:200% 100%;border-radius:7px;animation:lbsk 1.2s infinite}',
      '@keyframes lbsk{0%{background-position:200% 0}100%{background-position:-200% 0}}',
      // narrow containers: drop the outermost tiers, shrink type
      '@media(max-width:600px){.lb2-tier.edge{display:none}.lb2-title{font-size:20px}.lb2-tiers{gap:16px}}',
      // ── Signed-out teaser: the full dummy league board, with the sign-in CTA
      // laid over the top of it (over the Wood shield) and the list fading out
      // below. Height matches a full board so signing in causes no reflow.
      '.lb-teaser{position:relative;height:836px;overflow:hidden}',
      // portrait only: soft fade on the top edge (mirrors the board fade below)
      '.lb-teaser:not(.wide){-webkit-mask-image:linear-gradient(to bottom,transparent 0,#000 24px);mask-image:linear-gradient(to bottom,transparent 0,#000 24px)}',
      // board fills the box, clips, and fades to transparent toward the bottom.
      // padding-top drops the Wood shield to start ~mid Sign-in button; the fade
      // is pulled up so more of the bottom disappears while the height stays 836.
      '.lb-teaser-board{position:absolute;top:0;left:0;right:0;bottom:0;box-sizing:border-box;padding-top:104px;overflow:hidden;pointer-events:none;' +
        '-webkit-mask-image:linear-gradient(to bottom,transparent 4%,#000 20%,#000 72%,transparent 96%);' +
        'mask-image:linear-gradient(to bottom,transparent 4%,#000 20%,#000 72%,transparent 96%)}',
      // CTA overlay: sits on top of the shield, on a soft radial wash that fades out
      // on every edge (no hard box) to lift the text off the board behind it
      '.lb-teaser-cta{position:absolute;top:0;left:0;right:0;z-index:2;text-align:center;padding:28px 20px 56px;' +
        'background:radial-gradient(72% 62% at 50% 24%,rgba(233,238,247,.95) 0%,rgba(233,238,247,.32) 40%,rgba(233,238,247,0) 72%)}',
      '.lb-teaser-cta b{display:block;font-size:20px;font-weight:700;color:#282A35;margin:0 0 3px}',
      '.lb-teaser-cta span{display:block;font-size:14px;color:#666;max-width:320px;margin:0 auto 4px;line-height:1.3}',
      '.lb-teaser-cta .lb-cta{margin-top:6px}',
      // portrait anon: whole teaser is one link to sign in (no separate button)
      '.lb-teaser-link{display:block;color:inherit;text-decoration:none;cursor:pointer}',
      '.lb-teaser-link:hover .lb-teaser-cta b{color:#04AA6D}',
      // ── Wide banner (full width, ~350 tall): CTA panel and board side by side ──
      '.lb-teaser.wide{display:flex;flex-direction:row;align-items:stretch;gap:40px;height:350px}',
      // CTA stops being an overlay - it is the left panel now
      '.lb-teaser.wide .lb-teaser-cta{position:static;flex:0 0 38%;max-width:400px;display:flex;flex-direction:column;justify-content:center;align-items:center;padding:20px 24px;background:none}',
      '.lb-teaser.wide .lb-teaser-badge{width:92px;height:92px;object-fit:contain;margin:0 0 14px;filter:drop-shadow(0 6px 16px rgba(150,120,255,.4))}',
      // board is the right panel, list fading out at the bottom
      '.lb-teaser.wide .lb-teaser-board{position:static;flex:1 1 auto;padding:2px 20px 0 4px;height:350px;' +
        '-webkit-mask-image:linear-gradient(to bottom,#000 60%,transparent 100%);' +
        'mask-image:linear-gradient(to bottom,#000 60%,transparent 100%)}',
      // stack the panels on very narrow viewports so the banner never crushes
      '@media(max-width:560px){.lb-teaser.wide{flex-direction:column;height:auto}.lb-teaser.wide .lb-teaser-cta{flex:none;max-width:none;padding:18px}.lb-teaser.wide .lb-teaser-board{height:240px;padding:0 12px}}'
    ].join('\n');
    var el = document.createElement('style');
    el.id = LB._styleId; el.textContent = css;
    document.head.appendChild(el);
  };

  LB._esc = function (s) {
    return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  };

  LB._clockSvg = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>';

  LB._skeleton = function () {
    var rows = '';
    for (var i = 0; i < 6; i++) {
      rows += '<div class="lb-skel"><div class="bar" style="width:' + (40 + (i % 3) * 20) + '%"></div></div>';
    }
    return '<div class="lb-list">' + rows + '</div>';
  };

  // Tier ladder: two below, the current (big), two above (locked).
  LB._tierStripHtml = function (tier) {
    var order = LB._tierOrder;
    var idx = order.indexOf(String(tier || 'wd').toLowerCase());
    if (idx < 0) idx = 0;
    var html = '';
    for (var i = idx - 2; i <= idx + 2; i++) {
      if (i < 0 || i >= order.length) { html += '<div class="lb2-tier edge" aria-hidden="true"></div>'; continue; }
      var code = order[i];
      var cls = 'lb2-tier' + (i === idx ? ' cur' : '') + (i > idx ? ' locked' : '') + (Math.abs(i - idx) === 2 ? ' edge' : '');
      html += '<div class="' + cls + '">' +
        '<img src="' + DashboardLite._tierIcon(code) + '" alt="" onerror="this.style.visibility=\'hidden\'">' +
        '<span>' + LB._esc(DashboardLite._tierName(code)) + '</span></div>';
    }
    return html;
  };

  LB._rowHtml = function (r) {
    var isMe = LB._state.meRank && r.rank === LB._state.meRank;
    return '<div class="lb-row' + (isMe ? ' me' : '') + '">' +
      '<div class="lb-rank">' + r.rank + '</div>' +
      '<div class="lb-av"><img src="' + LB._avatarImg + '" alt="" loading="lazy"></div>' +
      '<div class="lb-name">' + LB._esc(r.name) + '</div>' +
      (isMe && String(r.name).toLowerCase() !== 'you' ? '<span class="lb-pill you">You</span>' : '') +
      (r.boosted ? '<span class="lb-pill boost">&#9889; BOOSTED</span>' : '') +
      '<div class="lb-xp">' + r.weeklyXp.toLocaleString() + ' <small>XP</small></div>' +
      '</div>';
  };

  // Rows split into cards, with promotion/demotion bands between them.
  LB._segmentsHtml = function () {
    var rows = LB._state.rows, total = rows.length;
    var cutTop = Math.min(LB.PROMOTE_TOP, total);
    var cutBottom = (LB.DEMOTE_BOTTOM > 0 && total > LB.PROMOTE_TOP + LB.DEMOTE_BOTTOM) ? total - LB.DEMOTE_BOTTOM : total;
    var seg = function (list) {
      if (!list.length) return '';
      var h = '';
      for (var i = 0; i < list.length; i++) h += LB._rowHtml(list[i]);
      return '<div class="lb-list">' + h + '</div>';
    };
    var html = seg(rows.slice(0, cutTop));
    if (total > cutTop) html += '<div class="lb-zone promote">&#8593; Promotion Zone &#8593;</div>';
    html += seg(rows.slice(cutTop, cutBottom));
    if (cutBottom < total) {
      html += '<div class="lb-zone demote">&#8595; Demotion Zone &#8595;</div>' + seg(rows.slice(cutBottom));
    }
    return html;
  };

  // Condensed list: the user's row plus up to maxOthers neighbours, with "⋯"
  // markers for the hidden rest and zone bands kept when a boundary falls inside.
  LB._condensedHtml = function (maxOthers) {
    var rows = LB._state.rows, total = rows.length;
    var keep = maxOthers + 1;
    if (total <= keep) return LB._segmentsHtml();

    var meIdx = 0;
    for (var i = 0; i < total; i++) {
      if (LB._state.meRank && rows[i].rank === LB._state.meRank) { meIdx = i; break; }
    }
    var start = Math.max(0, Math.min(meIdx - 2, total - keep));
    var slice = rows.slice(start, start + keep);

    var html = start > 0 ? '<div class="lb-more">&#8943;</div>' : '';
    var cur = '';
    for (var j = 0; j < slice.length; j++) {
      if (j > 0) {
        var prevRank = slice[j - 1].rank, thisRank = slice[j].rank;
        var crossedPromote = prevRank <= LB.PROMOTE_TOP && thisRank > LB.PROMOTE_TOP;
        var demoteAt = total - LB.DEMOTE_BOTTOM;
        var crossedDemote = LB.DEMOTE_BOTTOM > 0 && total > LB.PROMOTE_TOP + LB.DEMOTE_BOTTOM &&
          prevRank <= demoteAt && thisRank > demoteAt;
        if (crossedPromote || crossedDemote) {
          html += '<div class="lb-list">' + cur + '</div>' +
            (crossedPromote ? '<div class="lb-zone promote">&#8593; Promotion Zone &#8593;</div>'
              : '<div class="lb-zone demote">&#8595; Demotion Zone &#8595;</div>');
          cur = '';
        }
      }
      cur += LB._rowHtml(slice[j]);
    }
    if (cur) html += '<div class="lb-list">' + cur + '</div>';
    if (start + keep < total) html += '<div class="lb-more">&#8943;</div>';
    return html;
  };

  // Left "league" panel for the signed-in wide/hero layout (mirrors the anon
  // hero's CTA panel: badge, headline, subline, action button).
  LB._wideLeaguePanel = function (tier, days) {
    var daysTxt = (days !== null) ? (days + ' day' + (days === 1 ? '' : 's') + ' left') : 'Resets weekly';
    return '<img class="lb-teaser-badge" src="' + DashboardLite._tierIcon(tier) + '" alt="" onerror="this.style.display=\'none\'">' +
      '<b>' + LB._esc(DashboardLite._tierName(tier)) + ' League</b>' +
      '<span>Top ' + LB.PROMOTE_TOP + ' advance &middot; ' + daysTxt + '</span>' +
      '<a class="lb-cta ga-featured ga-leaderboard-view" href="' + DashboardLite._leaderboardUrl + '">View leaderboard</a>';
  };

  LB._render = function (container) {
    var league = LB._state.league || {};
    var rows = LB._state.rows;
    var tier = league.tier || (rows[0] && rows[0].tier);
    var days = typeof league.daysLeft === 'number' ? league.daysLeft : LB._daysLeft(league);
    var maxOthers = container._lbOpts && typeof container._lbOpts.maxOthers === 'number'
      ? container._lbOpts.maxOthers : null;

    // Signed-in hero: league panel + placement standings side by side, same
    // fixed height and bottom fade as the anon wide teaser.
    if (container._lbOpts && (container._lbOpts.layout === 'wide' || container._lbOpts.anonLayout === 'wide')) {
      container.innerHTML =
        '<div class="lb-teaser wide">' +
          '<div class="lb-teaser-cta">' + LB._wideLeaguePanel(tier, days) + '</div>' +
          '<div class="lb-teaser-board">' +
            (maxOthers !== null ? LB._condensedHtml(maxOthers) : LB._segmentsHtml()) +
          '</div>' +
        '</div>';
      return;
    }

    container.innerHTML =
      '<div class="lb2-top"><a class="ga-featured ga-leaderboard-explained" href="/league/">League Explained</a></div>' +
      '<div class="lb2-tiers">' + LB._tierStripHtml(tier) + '</div>' +
      '<h2 class="lb2-title">' + LB._esc(DashboardLite._tierName(tier)) + '</h2>' +
      '<p class="lb2-advance">Top ' + LB.PROMOTE_TOP + ' advance to the next league</p>' +
      '<p class="lb2-days">' + LB._clockSvg + (days !== null ? days + ' day' + (days === 1 ? '' : 's') : 'Resets weekly') + '</p>' +
      '<div class="lb2-bar">' +
        (maxOthers === null ? '<button type="button" class="lb-find-me ga-featured ga-leaderboard-jump-to-rank">Jump to my rank</button>' : '') +
        '<button type="button" class="lb-refresh ga-featured ga-leaderboard-refresh">Refresh</button>' +
        '<span class="lb-note"></span>' +
      '</div>' +
      (maxOthers !== null ? LB._condensedHtml(maxOthers) : LB._segmentsHtml());

    var refreshBtn = container.querySelector('.lb-refresh');
    if (refreshBtn) refreshBtn.addEventListener('click', function () {
      if (container._lbOpts && container._lbOpts.dummy) LB._renderDummy(container);
      else LB._load(container);
    });
    var findBtn = container.querySelector('.lb-find-me');
    if (findBtn) findBtn.addEventListener('click', function () {
      var me = container.querySelector('.lb-row.me');
      if (me && me.scrollIntoView) me.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  };

  LB._setNote = function (container, txt) {
    var n = container.querySelector('.lb-note');
    if (n) n.textContent = txt;
  };

  // ── Flow ────────────────────────────────────────────────────────────────
  LB._load = function (container) {
    var btn = container.querySelector('.lb-refresh');
    if (btn) { btn.disabled = true; btn.textContent = 'Refreshing…'; }

    LB._fetchCohort().then(function (res) {
      if (!res.rows.length) throw new Error('empty standings');
      LB._state.rows = res.rows;
      LB._state.meRank = res.meRank;
      LB._state.totalUsers = res.totalUsers;
      LB._render(container);
      LB._setNote(container, 'Updated just now');
    })['catch'](function (err) {
      if (LB.USE_MOCK_ON_FAIL) {
        var m = LB._mock();
        LB._state.rows = m.rows; LB._state.meRank = m.meRank; LB._state.totalUsers = m.totalUsers;
        LB._render(container);
        LB._setNote(container, 'Showing demo data (live standings unavailable)');
        if (window.console) console.warn('[LeaderboardLive] cohort fetch failed, using mock:', err && err.message);
      } else {
        container.innerHTML = '<div class="lb-list"><div class="lb-msg">Could not load the leaderboard right now.</div></div>';
      }
    });
  };

  // render(containerId, opts?) - opts.maxOthers: show only the user's row plus
  // up to N neighbours (condensed widget mode).
  LB.render = function (containerId, opts) {
    LB._injectCss();
    var container = document.getElementById(containerId);
    if (!container) return;
    container._lbOpts = opts || {};
    container.classList.add('lb-live');

    if (typeof DashboardLite === 'undefined') {
      container.innerHTML = '<div class="lb-msg">Leaderboard failed to initialise (missing dashboard-lite.js).</div>';
      return;
    }

    container.innerHTML = LB._skeleton();
    // Wait for session verification before deciding logged-in/anon.
    DashboardLite.whenSessionReady(function () { LB._start(container); });
  };

  // Signed-out teaser: sign-in CTA up top, then a populated dummy board showing
  // through underneath and fading to invisible - a peek at "where you rank".
  LB._anonTeaser = function (container) {
    var ret = encodeURIComponent(window.location.href);
    var signIn = DashboardLite._profileBase + '/log-in?redirect_url=' + ret;
    var o = container._lbOpts || {};
    var wide = (o.layout === 'wide' || o.anonLayout === 'wide');
    var d = LB._dummy();
    LB._state.league = d.league;
    LB._state.rows = d.rows;
    LB._state.meRank = d.meRank;
    LB._state.totalUsers = d.totalUsers;
    var tier = d.league.tier;

    if (wide) {
      // Wide: league badge + sign-in CTA on the left, standings list on the right.
      var ctaInner =
        '<img class="lb-teaser-badge" src="' + DashboardLite._tierIcon(tier) + '" alt="" onerror="this.style.display=\'none\'">' +
        '<b>Sign in to see where you rank.</b>' +
        '<span>Compete with learners worldwide. Earn XP, climb the ranks.</span>' +
        '<a class="lb-cta ga-featured ga-leaderboard-signin" href="' + signIn + '">Sign In</a>';
      container.innerHTML =
        '<div class="lb-teaser wide">' +
          '<div class="lb-teaser-cta">' + ctaInner + '</div>' +
          '<div class="lb-teaser-board" aria-hidden="true">' + LB._segmentsHtml() + '</div>' +
        '</div>';
      return;
    }

    // Portrait (narrow): no separate button - the whole teaser is one link to
    // sign in. The board keeps pointer-events:none so clicks fall through to it.
    var boardHtml =
      '<div class="lb2-tiers">' + LB._tierStripHtml(tier) + '</div>' +
      '<h2 class="lb2-title">' + LB._esc(DashboardLite._tierName(tier)) + '</h2>' +
      '<p class="lb2-advance">Top ' + LB.PROMOTE_TOP + ' advance to the next league</p>' +
      '<p class="lb2-days">' + LB._clockSvg + d.league.daysLeft + ' days</p>' +
      LB._segmentsHtml();
    container.innerHTML =
      '<a class="lb-teaser lb-teaser-link ga-featured ga-leaderboard-signin" href="' + signIn + '">' +
        '<div class="lb-teaser-cta">' +
          '<b>Sign in to see where you rank.</b>' +
          '<span>Compete with learners worldwide. Earn XP, climb the ranks.</span>' +
        '</div>' +
        '<div class="lb-teaser-board" aria-hidden="true">' + boardHtml + '</div>' +
      '</a>';
  };

  LB._start = function (container) {
    if (!DashboardLite._isLoggedIn()) {
      LB._anonTeaser(container);
      return;
    }

    container.innerHTML = LB._skeleton();

    DashboardLite.fetchLeagueXp().then(function (league) {
      LB._state.league = league;
      if (!league.optedIn) {
        container.innerHTML =
          '<div class="lb-list"><div class="lb-msg"><b>You haven\'t joined the league yet.</b><br>' +
            'Opt in to compete for a top spot and climb the ranks.' +
            '<br><a class="lb-cta ga-featured ga-leaderboard-join" href="' + DashboardLite._profileBase + '/league">Join the League</a></div></div>';
        return;
      }
      LB._load(container);
    })['catch'](function () {
      // Couldn't read the user's league tier - cohort rows still carry tier; load anyway.
      LB._state.league = { tier: 'wd', weeklyXp: 0 };
      LB._load(container);
    });
  };

  // ── Dummy / teaser mode ─────────────────────────────────────────────────
  // Loads the static demo cohort into shared state and renders synchronously.
  LB._renderDummy = function (container) {
    var d = LB._dummy();
    LB._state.league = d.league;
    LB._state.rows = d.rows;
    LB._state.meRank = d.meRank;
    LB._state.totalUsers = d.totalUsers;
    LB._render(container);
    LB._setNote(container, 'Updated just now');
  };

  // renderDummy(containerId, opts?) - a fully populated static board with no
  // session or network, for logged-out teasers and the format-preview page.
  // opts.maxOthers behaves like render() (condensed to N neighbours of the "You" row).
  LB.renderDummy = function (containerId, opts) {
    LB._injectCss();
    var container = document.getElementById(containerId);
    if (!container) return;
    container._lbOpts = opts || {};
    container._lbOpts.dummy = true;
    container.classList.add('lb-live');

    if (typeof DashboardLite === 'undefined') {
      container.innerHTML = '<div class="lb-msg">Leaderboard failed to initialise (missing dashboard-lite.js).</div>';
      return;
    }
    LB._renderDummy(container);
  };

  window.LeaderboardLive = LB;
})();

(function () {
  if (window.DashboardLite) return;

  var DashboardLite = {};

  // ── Config ──────────────────────────────────────────────────────────────
  DashboardLite._apiBase = 'https://api.kai.w3sapi.com/pathfinder';
  DashboardLite._profilePicBase = 'https://www.w3profile.com';
  DashboardLite._leagueImgBase = 'https://pathfinder.w3schools.com/images/leagues';
  DashboardLite._profileBase = 'https://profile.w3schools.com';
  // Logged-in league links go to the pathfinder leaderboard; anon/frozen go to
  // the marketing page (_leagueInfoUrl) since the live board needs an account.
  DashboardLite._leaderboardUrl = 'https://pathfinder.w3schools.com/leaderboard';
  DashboardLite._leagueInfoUrl = '/league/';
  DashboardLite._styleId = 'dashboard-lite-style';
  DashboardLite._fallbackAvatar = '/images/lynx.svg';

  // Named formats (ad-unit style). Each maps to a fixed box + a layout mode.
  // No format -> 'stack' (the original 300px-wide auto-height card on default.asp).
  DashboardLite.FORMATS = {
    '960x300': { w: 960, h: 300, mode: 'row' },
    '720x250': { w: 720, h: 250, mode: 'row' },
    '300x300': { w: 300, h: 300, mode: 'grid' },
    '160x300': { w: 160, h: 300, mode: 'col' },
    '140x300': { w: 140, h: 300, mode: 'col' }
  };

  // Official league tier lookup (code -> display name + badge filename).
  DashboardLite._tierMap = {
    wd: { name: 'Wood', icon: 'wood.svg' },
    br: { name: 'Bronze', icon: 'bronze.svg' },
    si: { name: 'Silver', icon: 'silver.svg' },
    go: { name: 'Gold', icon: 'gold.svg' },
    pl: { name: 'Platinum', icon: 'platinum.svg' },
    di: { name: 'Diamond', icon: 'diamond.svg' },
    ll: { name: 'Logic Legend', icon: 'logic_legend.svg' },
    ss: { name: 'Script Samurai', icon: 'script_samurai.svg' },
    bs: { name: 'Bug Slayer', icon: 'bug_slayer.svg' },
    sc: { name: 'Supreme Coder', icon: 'supreme_coder.svg' },
    mc: { name: 'Master Coder', icon: 'master_coder.svg' }
  };
  DashboardLite._tier = function (code) {
    return DashboardLite._tierMap[String(code || '').toLowerCase()] || DashboardLite._tierMap.wd;
  };
  DashboardLite._tierName = function (code) { return DashboardLite._tier(code).name; };
  DashboardLite._tierIcon = function (code) {
    return DashboardLite._leagueImgBase + '/' + DashboardLite._tier(code).icon;
  };

  // Mood overlay badge (avatar.layers.mood -> companion svg).
  DashboardLite._moodBase = 'https://pathfinder.w3schools.com/images/companion/mood';
  DashboardLite._moodMap = {
    'mood-focused': 'direct_hit.svg', 'mood-zen': 'artist_palette.svg',
    'mood-cool': 'smiling_face_with_sunglasses.svg', 'mood-silly': 'pile_of_poo.svg',
    'mood-strong': 'flexed_biceps.svg', 'mood-horns': 'smiling_face_with_horns.svg',
    'mood-unicorn': 'unicorn.svg', 'mood-zany': 'zany_face.svg'
  };
  DashboardLite._moodIcon = function (mood) {
    var f = DashboardLite._moodMap[mood];
    return f ? DashboardLite._moodBase + '/' + f : null;
  };

  // ── Social sign-in (Cognito OAuth - mirrors lib/account/auth-bar.js) ───────
  DashboardLite._authUrl = 'https://auth.w3spaces.com';
  DashboardLite._cognitoClientId = 'd1grqml0emh7votkb0gtrrn0';
  DashboardLite._socialIcons = {
    google: '<svg width="20" height="20" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>',
    facebook: '<svg width="20" height="20" viewBox="0 0 24 24" fill="#0080ff"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>',
    github: '<svg width="20" height="20" viewBox="0 0 18 18"><path fill-rule="evenodd" clip-rule="evenodd" d="M9.00194 0C13.9726 0 18.0019 4.13093 18.0019 9.22763C18.0019 13.3037 15.4261 16.7615 11.8522 17.9828C11.3959 18.0737 11.2339 17.7856 11.2339 17.5399C11.2339 17.2357 11.2447 16.2421 11.2447 15.0073C11.2447 14.1469 10.9567 13.5854 10.6336 13.2992C12.6379 13.0706 14.7439 12.2902 14.7439 8.74599C14.7439 7.73799 14.3947 6.91543 13.8169 6.26923C13.9105 6.03613 14.2192 5.09755 13.7287 3.82675C13.7287 3.82675 12.9745 3.5795 11.2564 4.77289C10.5373 4.56859 9.76694 4.4658 9.00194 4.4622C8.23694 4.4658 7.46745 4.56859 6.74925 4.77289C5.02935 3.5795 4.27335 3.82675 4.27335 3.82675C3.78465 5.09755 4.09335 6.03613 4.18605 6.26923C3.61095 6.91543 3.25905 7.73799 3.25905 8.74599C3.25905 12.2812 5.36055 13.0735 7.35945 13.3066C7.10205 13.537 6.86895 13.9435 6.78795 14.5402C6.27495 14.776 4.97175 15.1841 4.16895 13.7738C4.16895 13.7738 3.69285 12.8871 2.78925 12.8223C2.78925 12.8223 1.91175 12.8107 2.72805 13.3831C2.72805 13.3831 3.31755 13.6666 3.72705 14.7331C3.72705 14.7331 4.25535 16.3801 6.75915 15.8221C6.76365 16.5934 6.77175 17.3203 6.77175 17.5399C6.77175 17.7838 6.60614 18.0692 6.15704 17.9837C2.58045 16.7642 0.00195312 13.3046 0.00195312 9.22763C0.00195312 4.13093 4.03215 0 9.00194 0Z" fill="#282A35"/></svg>'
  };
  DashboardLite._genState = function () {
    var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789', r = '';
    for (var i = 0; i < 32; i++) r += chars.charAt(Math.floor(Math.random() * chars.length));
    return r;
  };
  DashboardLite._socialUrl = function (provider, returnUrl) {
    var idp = { google: 'Google', facebook: 'Facebook', github: 'Github' }[provider] || provider;
    return DashboardLite._authUrl + '/oauth2/authorize' +
      '?redirect_uri=' + encodeURIComponent(DashboardLite._profileBase + '/social-login') +
      '&response_type=code&client_id=' + DashboardLite._cognitoClientId +
      '&identity_provider=' + idp +
      '&scope=openid%20aws.cognito.signin.user.admin' +
      '&state=' + DashboardLite._genState() +
      '&final_return=' + encodeURIComponent(returnUrl);
  };
  DashboardLite._openOAuthPopup = function (url, returnUrl) {
    try {
      document.cookie = 'socialLoginRedirectUrl=' + encodeURIComponent(returnUrl) +
        '; path=/; domain=.w3schools.com; secure; samesite=strict';
    } catch (e) {}
    var w = 450, h = 450, l = (window.innerWidth - w) / 2, t = (window.innerHeight - h) / 2;
    var popup = window.open(url, '_blank', 'width=' + w + ',height=' + h + ',left=' + l + ',top=' + t + ',popup=1');
    if (!popup || popup.closed || typeof popup.closed === 'undefined') window.location.href = url;
  };
  DashboardLite._socialBtn = function (provider, returnUrl) {
    var url = DashboardLite._socialUrl(provider, returnUrl);
    var safeRet = String(returnUrl).replace(/'/g, "\\'");
    var onclick = "event.preventDefault();event.stopPropagation();DashboardLite._openOAuthPopup('" +
      url.replace(/'/g, "\\'") + "','" + safeRet + "');";
    return '<a href="' + DashboardLite._esc(url) + '" onclick="' + onclick + '" ' +
      'class="dlw-social ga-fp ga-dlw-' + provider + '" ' +
      'title="Continue with ' + provider.charAt(0).toUpperCase() + provider.slice(1) + '">' +
      DashboardLite._socialIcons[provider] + '</a>';
  };

  // Brand logos for the continue-card topic icon (product marks, not design tokens).
  DashboardLite._langIcons = {
    python: '<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 32 32"><defs><linearGradient id="dlw-py-b" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#387EB8"/><stop offset="100%" stop-color="#366994"/></linearGradient><linearGradient id="dlw-py-y" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#FFE052"/><stop offset="100%" stop-color="#FFC331"/></linearGradient></defs><path d="M15.885 2.1c-7.1 0-6.651 3.07-6.651 3.07v3.19h6.752v1H6.304s-4.604.208-4.604 6.645c0 6.442 4.013 6.912 4.013 6.912H8.33v-3.361s-.13-4.013 3.9-4.013h6.762s3.772.06 3.772-3.652V5.8s.572-3.712-6.842-3.712zm-3.732 2.137a1.214 1.214 0 1 1-1.183 1.244v-.02a1.214 1.214 0 0 1 1.214-1.214z" fill="url(#dlw-py-b)"/><path d="M16.085 29.91c7.1 0 6.651-3.08 6.651-3.08v-3.18h-6.751v-1h9.47S30 23.158 30 15.995s-4.013-6.912-4.013-6.912H23.64v3.361s.13 4.013-3.9 4.013h-6.765S9.2 16.4 9.2 20.112v6.091s-.572 3.712 6.842 3.712zm3.732-2.147a1.214 1.214 0 1 1 1.214-1.214 1.214 1.214 0 0 1-1.214 1.214z" fill="url(#dlw-py-y)"/></svg>',
    html: '<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" fill="#E34F26" viewBox="0 0 24 24"><path d="M1.5 0h21l-1.91 21.563L11.977 24l-8.564-2.438L1.5 0zm7.031 9.75l-.232-2.718 10.059.003.23-2.622L5.412 4.41l.698 8.01h9.126l-.326 3.426-2.91.804-2.955-.81-.188-2.11H6.248l.33 4.171L12 19.351l5.379-1.443.744-8.157H8.531z"/></svg>',
    css: '<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" fill="#1572B6" viewBox="0 0 24 24"><path d="M1.5 0h21l-1.91 21.563L11.977 24l-8.565-2.438L1.5 0zm17.09 4.413L5.41 4.41l.213 2.622 10.125.002-.255 2.716h-6.64l.24 2.573h6.182l-.366 3.523-2.91.804-2.956-.81-.188-2.11h-2.61l.29 3.855L12 19.288l5.373-1.53L18.59 4.414z"/></svg>',
    // J first, then S - the two glyphs used to be transposed and read "SJ".
    javascript: '<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24"><rect width="24" height="24" fill="#F7DF1E"/><path fill="#000" d="M6.3 18.4c.3.6.7 1 1.4 1 .6 0 1-.2 1-1.2v-6.3h2v6.3c0 2-1.2 2.9-2.9 2.9-1.5 0-2.5-.8-3-1.8zM13.7 18.2c.4.7.9 1.2 1.9 1.2.8 0 1.3-.4 1.3-1 0-.7-.5-.9-1.5-1.3l-.5-.2c-1.5-.6-2.4-1.4-2.4-3 0-1.5 1.1-2.6 2.9-2.6 1.3 0 2.2.4 2.8 1.6l-1.5 1c-.3-.6-.7-.8-1.3-.8-.5 0-.9.3-.9.8 0 .6.4.8 1.3 1.2l.5.2c1.7.7 2.6 1.5 2.6 3.1 0 1.8-1.4 2.7-3.3 2.7-1.8 0-3-.9-3.6-2z"/></svg>',
    sql: '<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" fill="#00758F" viewBox="0 0 24 24"><ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v6c0 1.7 3.6 3 8 3s8-1.3 8-3V5c0 1.7-3.6 3-8 3S4 6.7 4 5z" opacity=".7"/><path d="M4 11v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6c0 1.7-3.6 3-8 3s-8-1.3-8-3z" opacity=".5"/></svg>',
    php: '<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" fill="#777BB4" viewBox="0 0 24 24"><path d="M7.01 10.207h-.944l-.515 2.648h.838c.556 0 .97-.105 1.242-.314.272-.21.455-.559.55-1.049.092-.47.05-.802-.124-.995-.175-.193-.523-.29-1.047-.29zM12 5.688C5.373 5.688 0 8.514 0 12s5.373 6.313 12 6.313S24 15.486 24 12c0-3.486-5.373-6.312-12-6.312zm-3.26 7.451c-.261.25-.575.438-.917.551-.336.108-.765.164-1.285.164H5.357l-.327 1.681H3.652l1.23-6.326h2.65c.797 0 1.378.209 1.744.628.366.418.476 1.002.33 1.752a2.836 2.836 0 0 1-.305.847c-.143.255-.33.49-.561.703zm4.024.715l.543-2.799c.063-.318.039-.536-.068-.651-.107-.116-.336-.174-.687-.174H11.46l-.704 3.625H9.388l1.23-6.327h1.367l-.327 1.682h1.218c.767 0 1.295.134 1.586.401s.378.7.263 1.299l-.572 2.944h-1.389zm7.597-2.265a2.782 2.782 0 0 1-.305.847c-.143.255-.33.49-.561.703a2.44 2.44 0 0 1-.917.551c-.336.108-.765.164-1.286.164h-1.18l-.327 1.682h-1.378l1.23-6.326h2.649c.797 0 1.378.209 1.744.628.366.417.477 1.001.331 1.751zM17.766 10.207h-.943l-.516 2.648h.838c.557 0 .971-.105 1.242-.314.272-.21.455-.559.551-1.049.092-.47.049-.802-.125-.995s-.524-.29-1.047-.29z"/></svg>',
    java: '<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 32 32"><path fill="#5382A1" d="M11.622 24.74s-1.264.748.9.998c2.626.308 3.968.264 6.854-.308 0 0 .76.484 1.82.9-6.49 2.802-14.674-.16-9.574-1.59zm-.826-3.924s-1.43 1.056.748 1.278c2.782.308 4.97.33 8.76-.44 0 0 .528.54 1.353.836-7.81 2.296-16.5.176-10.86-1.672z"/><path fill="#E76F00" d="M18.996 1s3.014 3.036-2.858 7.7c-4.708 3.748-1.076 5.894 0 8.338-2.744-2.478-4.774-4.664-3.414-6.692 1.996-2.97 7.53-4.422 6.272-9.346zm-1.576 14.026c1.464 1.68-.374 3.19-.374 3.19s3.702-1.92 2-4.312c-1.584-2.222-2.804-3.326 3.79-7.106 0 0-10.374 2.596-5.412 8.228z"/></svg>',
    react: '<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" fill="#61DAFB" viewBox="0 0 24 24"><circle cx="12" cy="12" r="2"/><g fill="none" stroke="#61DAFB" stroke-width="1"><ellipse cx="12" cy="12" rx="11" ry="4.2"/><ellipse cx="12" cy="12" rx="11" ry="4.2" transform="rotate(60 12 12)"/><ellipse cx="12" cy="12" rx="11" ry="4.2" transform="rotate(120 12 12)"/></g></svg>'
  };
  DashboardLite._topicKey = function (name) {
    var k = String(name == null ? '' : name).toLowerCase();
    if (k.indexOf('javascript') > -1) return 'javascript';
    if (k.indexOf('python') > -1) return 'python';
    if (k.indexOf('html') > -1) return 'html';
    if (k.indexOf('css') > -1) return 'css';
    if (k.indexOf('sql') > -1) return 'sql';
    if (k.indexOf('php') > -1) return 'php';
    if (k.indexOf('react') > -1) return 'react';
    if (k.indexOf('java') > -1) return 'java';
    return '';
  };
  DashboardLite._topicIconHtml = function (name) {
    var key = DashboardLite._topicKey(name);
    if (key && DashboardLite._langIcons[key]) return DashboardLite._langIcons[key];
    var letter = String(name || '?').trim().charAt(0).toUpperCase() || '?';
    return '<span style="font-family:\'Source Sans Pro\',sans-serif;font-weight:700;font-size:18px;color:#04AA6D">' +
      DashboardLite._esc(letter) + '</span>';
  };

  // ── Auth / fetch ────────────────────────────────────────────────────────
  DashboardLite._getToken = function () {
    if (typeof SharedAPI !== 'undefined' && typeof SharedAPI.getAccessToken === 'function') {
      var t = SharedAPI.getAccessToken();
      if (t) return t;
    }
    try {
      var cookies = document.cookie.split(';');
      for (var i = 0; i < cookies.length; i++) {
        var c = cookies[i].trim();
        if (c.indexOf('accessToken=') === 0) return c.substring('accessToken='.length);
      }
    } catch (e) {}
    return null;
  };

  DashboardLite._get = function (path) {
    var token = DashboardLite._getToken();
    if (!token) return Promise.reject(new Error('No access token'));
    return fetch(DashboardLite._apiBase + path, {
      method: 'GET',
      headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' }
    }).then(function (res) {
      if (!res.ok) throw new Error('API ' + res.status + ' for ' + path);
      return res.json();
    });
  };

  DashboardLite.fetchProfile = function () {
    return DashboardLite._get('/profile-api/profile/basic-lite?fields=personal').then(function (data) {
      var p = (data && data.personal) || {};
      var avatar = p.profilePicture
        ? DashboardLite._profilePicBase + '/' + p.profilePicture : DashboardLite._fallbackAvatar;
      return {
        firstName: p.firstName || '', lastName: p.lastName || '',
        fullName: ((p.firstName || '') + ' ' + (p.lastName || '')).trim(),
        avatar: avatar
      };
    });
  };

  DashboardLite.fetchStreaks = function () {
    return DashboardLite._get('/competency-api/streaks').then(function (data) {
      data = data || {};
      return {
        streaks: typeof data.streaks === 'number' ? data.streaks : 0,
        freezeUsed: data.freezeUsedThisMonth,
        freezeRemaining: data.freezeRemainingThisMonth
      };
    });
  };

  DashboardLite.fetchLeagueXp = function () {
    return DashboardLite._get('/league-api/user/xp').then(function (data) {
      data = data || {};
      var league = data.league || {};
      return {
        xp: typeof data.xp === 'number' ? data.xp : 0,
        weeklyXp: typeof data.weeklyXp === 'number' ? data.weeklyXp : 0,
        optedIn: !!league.optedIn, tier: league.tier || null,
        leagueId: league.leagueId || null, cohortId: league.cohortId || null
      };
    });
  };

  // GET /league-api/user/profile -> rendered avatar URL + current mood.
  DashboardLite.fetchAvatar = function () {
    return DashboardLite._get('/league-api/user/profile').then(function (data) {
      data = data || {};
      var layers = (data.avatar && data.avatar.layers) || {};
      return {
        avatar: data.profilePictureUrl
          ? DashboardLite._profilePicBase + '/' + data.profilePictureUrl : null,
        mood: layers.mood || null
      };
    });
  };

  // GET /league-api/leaderboard/cohort -> standings for the user's own cohort.
  DashboardLite.fetchCohort = function () {
    return DashboardLite._get('/league-api/leaderboard/cohort').then(function (data) {
      data = data || {};
      return {
        users: Array.isArray(data.users) ? data.users : [],
        userRank: typeof data.userRank === 'number' ? data.userRank : null,
        totalUsers: typeof data.totalUsers === 'number' ? data.totalUsers : null
      };
    });
  };

  // GET /competency-api/xp -> {"xp": N}. The canonical total XP - the league
  // endpoint reports xp:0 for users who have not opted into the league.
  DashboardLite.fetchXpTotal = function () {
    return DashboardLite._get('/competency-api/xp').then(function (data) {
      return (data && typeof data.xp === 'number') ? data.xp : null;
    });
  };

  // Per-page promise memo so multiple widget instances share one request each.
  DashboardLite._memo = {};
  DashboardLite._once = function (key, fn) {
    if (!DashboardLite._memo[key]) DashboardLite._memo[key] = fn();
    return DashboardLite._memo[key];
  };

  DashboardLite.loadAll = function () {
    var ff = function (r) { return r.status === 'fulfilled' ? r.value : null; };
    return Promise.allSettled([
      DashboardLite._once('profile', DashboardLite.fetchProfile),
      DashboardLite._once('streaks', DashboardLite.fetchStreaks),
      DashboardLite._once('league', DashboardLite.fetchLeagueXp),
      DashboardLite._once('avatar', DashboardLite.fetchAvatar),
      DashboardLite._once('cohort', DashboardLite.fetchCohort),
      DashboardLite._once('xptotal', DashboardLite.fetchXpTotal)
    ]).then(function (r) {
      return {
        profile: ff(r[0]), streaks: ff(r[1]), league: ff(r[2]),
        avatarP: ff(r[3]), cohort: ff(r[4]), xpTotal: ff(r[5])
      };
    });
  };

  // Languages that have a weekly-practice page at /practice/practice_<slug>.php
  DashboardLite._practiceMap = {
    python: 'python', javascript: 'javascript', java: 'java', 'c++': 'cpp', 'c#': 'csharp',
    c: 'c', php: 'php', kotlin: 'kotlin', r: 'r', rust: 'rust', swift: 'swift', typescript: 'typescript'
  };
  DashboardLite._practiceUrl = function (topicName) {
    var slug = DashboardLite._practiceMap[String(topicName || '').toLowerCase()];
    return slug ? '/practice/practice_' + slug + '.php' : null;
  };
  // A topic where the user only hit the landing page (not a real lesson).
  DashboardLite._isLanding = function (t) {
    return t.lessonName === 'Home' || /(?:default\.asp|index\.php)$/i.test(t.lessonRelPath || '');
  };

  // Last successful continue result, cached so frozen accounts (whose state API may
  // refuse them) and transient failures still get their Continue row.
  DashboardLite._contCacheKey = 'DashboardLite.lastContinue';
  DashboardLite._readContCache = function () {
    try {
      var o = JSON.parse(localStorage.getItem(DashboardLite._contCacheKey));
      return (o && o.title && o.url) ? o : null;
    } catch (e) { return null; }
  };
  DashboardLite._writeContCache = function (c) {
    try { localStorage.setItem(DashboardLite._contCacheKey, JSON.stringify(c)); } catch (e) {}
  };

  // The user's current learning language + lesson.
  // Returns {title, topic, next, progress, url, practice} or null.
  DashboardLite.fetchContinue = function () {
    if (typeof MyLearning === 'undefined' || typeof MyLearning.asyncFetchUserState !== 'function') {
      return Promise.resolve(DashboardLite._readContCache());
    }
    return MyLearning.asyncFetchUserState().then(function (reqRes) {
      var d = (reqRes && reqRes.data) ? reqRes.data : {};
      var topics = (d.activity && d.activity.topics) || d.topics || {};
      // TODO: swap for the real "selected language" source once provided. Until then,
      // prefer the most-recent topic where the user is actually mid-lesson (not just a
      // landing-page visit) so e.g. Python ("Output Variables") wins over an HTML "Home" hit.
      var best = null, bestReal = null;
      Object.keys(topics).forEach(function (id) {
        var t = topics[id];
        if (!t || !t.topicName) return;
        var uts = t.lessonInteractionUts || 0;
        if (!best || uts > (best.lessonInteractionUts || 0)) best = t;
        if (!DashboardLite._isLanding(t) && (!bestReal || uts > (bestReal.lessonInteractionUts || 0))) bestReal = t;
      });
      var chosen = bestReal || best;
      if (!chosen) return DashboardLite._readContCache();
      var total = Number(chosen.lessonsTotal) || 0, score = Number(chosen.lessonsScore) || 0;
      var pct = total > 0 ? Math.max(0, Math.min(100, Math.round(score / total * 100))) : 0;
      var rel = chosen.lessonRelPath ? String(chosen.lessonRelPath).replace(/^\//, '') : null;
      var result = {
        title: chosen.topicName + ' Tutorial',
        topic: chosen.topicName,
        next: chosen.lessonName ? 'Next up: ' + chosen.lessonName : 'Continue learning',
        progress: pct, url: rel ? '/' + rel : '#',
        practice: DashboardLite._practiceUrl(chosen.topicName)
      };
      DashboardLite._writeContCache(result);
      return result;
    })['catch'](function () { return DashboardLite._readContCache(); });
  };

  // ── View ────────────────────────────────────────────────────────────────
  DashboardLite._flameSvg =
    '<svg width="40" height="45" viewBox="0 0 43 48" fill="none" xmlns="http://www.w3.org/2000/svg">' +
    '<path fill-rule="evenodd" clip-rule="evenodd" d="M0 28.3147C0 39.1866 8.62988 48 20.648 48C32.6662 48 42.4089 39.1866 42.4089 28.3147C42.4089 16.4391 34.0874 7.3021 26.6681 0.526583C26.3281 0.216026 25.8182 0.179203 25.4495 0.455052C23.0134 2.27727 21.0501 4.77236 19.5597 7.94034C18.0644 11.1186 17.0726 14.8936 16.5843 19.2653C16.5189 19.8511 15.971 20.2697 15.4048 20.1058C13.7124 19.6161 12.2029 18.7388 10.8762 17.4737C9.5416 16.2011 8.22419 14.4474 6.92394 12.2125C6.55348 11.5758 5.64722 11.513 5.23907 12.1263C1.82501 17.2561 0 22.9643 0 28.3147Z" fill="#FF9600"></path>' +
    '<path d="M33.894 28.9292C33.2264 33.1276 29.8718 36.4211 25.5957 37.0766" stroke="#FF5D39" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"></path></svg>';

  DashboardLite._puzzleSvg =
    '<svg width="26" height="26" viewBox="0 0 24 24" fill="#04AA6D"><path d="M20.5 11H19V7a2 2 0 0 0-2-2h-4V3.5a2.5 2.5 0 0 0-5 0V5H4a2 2 0 0 0-2 2v3.8h1.5a2.1 2.1 0 0 1 0 4.2H2V19a2 2 0 0 0 2 2h3.8v-1.5a2.1 2.1 0 0 1 4.2 0V21H17a2 2 0 0 0 2-2v-4h1.5a2.5 2.5 0 0 0 0-5z"/></svg>';

  DashboardLite._esc = function (s) {
    return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  };

  // Shrink a single-line title to fit its tile: drop trailing words until it fits,
  // down to the first word (full text kept as the tooltip). e.g.
  // "Logic Legend League" -> "Logic Legend" -> "Logic".
  DashboardLite._fitTitle = function (el) {
    if (!el) return;
    var full = el.getAttribute('data-full');
    if (full === null) { full = el.textContent; el.setAttribute('data-full', full); }
    el.title = full;
    el.textContent = full;
    if (!el.clientWidth) return; // hidden / not laid out yet
    var words = full.split(/\s+/);
    while (words.length > 1 && el.scrollWidth > el.clientWidth) {
      words.pop();
      el.textContent = words.join(' ');
    }
  };
  DashboardLite._fitContainer = function (container) {
    var els = container.querySelectorAll('.dlw-title');
    for (var i = 0; i < els.length; i++) DashboardLite._fitTitle(els[i]);
  };

  DashboardLite._injectCss = function () {
    if (document.getElementById(DashboardLite._styleId)) return;
    var css = [
      // Base
      '.dlw{position:relative;box-sizing:border-box;font-family:"Source Sans Pro","Segoe UI",sans-serif;color:#282A35;overflow:hidden;max-width:100%}',
      '.dlw *,.dlw *::before,.dlw *::after{box-sizing:border-box}',
      '.dlw-stage{display:flex;gap:10px;width:100%;height:100%}',
      '.dlw-tile{position:relative;background:#fff;border-radius:12px;box-shadow:0 4px 16px rgba(0,0,0,.15);border:1px solid rgba(0,0,0,.06);padding:14px;display:flex;align-items:center;gap:10px;text-decoration:none;color:inherit;overflow:hidden}',
      '.dlw-tile-ico{flex-shrink:0;display:flex;align-items:center;justify-content:center}',
      '.dlw-tile-body{min-width:0}',
      '.dlw-title{font-size:15px;font-weight:700;color:#282A35;line-height:1.2;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
      '.dlw-sub{font-size:12px;color:#888;line-height:1.3;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
      '.dlw-sub b{color:#04AA6D}',
      '.dlw-sub:empty{display:none}',
      '.dlw-league-rank,.dlw-league-xp{white-space:normal}',
      '.dlw-league-rank b{white-space:nowrap}',
      '.dlw-avatar{border-radius:50%;object-fit:cover;background:#f1f1f1;width:48px;height:48px}',
      '.dlw-av-wrap{position:relative;display:inline-block;line-height:0}',
      '.dlw-mood{position:absolute;top:-3px;right:-3px;width:22px;height:22px;border-radius:50%;background:#fff;box-shadow:0 1px 4px rgba(0,0,0,.25);padding:2px}',
      '.dlw-col-mode .dlw-mood{width:16px;height:16px;top:-2px;right:-2px}',
      '.dlw-streak-num{font-size:26px;font-weight:700;color:#FF6B35;line-height:1}',
      '.dlw-lang-ico{width:40px;height:40px;border-radius:8px;background:#f1f1f1}',
      '.dlw-badge{width:48px;height:48px;object-fit:contain;flex-shrink:0}',
      '.dlw-row-mode .dlw-badge{width:76px;height:76px}',
      '.dlw-grid-mode .dlw-badge{width:40px;height:40px}',
      '.dlw-col-mode .dlw-badge{width:32px;height:32px}',
      '.dlw-ring{position:relative;width:40px;height:40px;flex-shrink:0}',
      '.dlw-ring-pct{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);font-size:9px;font-weight:700;color:#282A35}',
      '.dlw-pickup{position:absolute;top:6px;left:50%;transform:translateX(-50%);background:#e8f5e9;color:#04AA6D;font-size:9px;font-weight:700;padding:3px 10px;border-radius:4px;text-transform:uppercase;letter-spacing:.02em;white-space:nowrap}',
      '.dlw-action{flex-shrink:0}',
      '.dlw-btn{display:inline-block;background:#04AA6D;color:#fff;padding:6px 18px;border-radius:5px;font-family:"Source Sans Pro",sans-serif;font-size:17px;font-weight:400;line-height:1.4;text-decoration:none;border:none;cursor:pointer;white-space:nowrap}',
      // color repeated on :hover so page-level a:hover rules cannot turn the label green-on-green
      'a.dlw-tile:hover .dlw-btn,.dlw-btn:hover{background:#059862;color:#fff}',
      '.dlw-blur{filter:blur(3px);opacity:.5}',

      // ── stack mode (default, ~300px) - avatar+streak top row, league & continue full rows
      '.dlw-stack-mode{width:300px}',
      '.dlw-stack-mode .dlw-stage{flex-direction:row;flex-wrap:wrap;gap:12px}',
      '.dlw-stack-mode .dlw-t-avatar,.dlw-stack-mode .dlw-t-streak{flex:1 1 calc(50% - 6px);min-width:0;flex-direction:column;justify-content:center;text-align:center;gap:6px;padding:16px}',
      '.dlw-stack-mode .dlw-t-league,.dlw-stack-mode .dlw-t-continue,.dlw-stack-mode .dlw-t-practice{flex:1 1 100%}',
      '.dlw-stack-mode .dlw-t-league .dlw-tile-body,.dlw-stack-mode .dlw-t-continue .dlw-tile-body,.dlw-stack-mode .dlw-t-practice .dlw-tile-body{flex:1}',
      '.dlw-grid-mode .dlw-t-practice,.dlw-col-mode .dlw-t-practice{display:none!important}',
      '.dlw-stack-mode .dlw-t-continue{padding-top:24px}',
      '.dlw-stack-mode .dlw-avatar{width:64px;height:64px}',
      '.dlw-stack-mode .dlw-tile-ico svg{width:40px;height:auto}',

      // ── row mode (960x300, 720x250) - tiles across, elements scaled up
      // grid: avatar (row 1) + streak (row 2) stacked in a narrow first column; the
      // text-heavy tiles (league/continue/practice) span both rows in the wide columns.
      '.dlw-row-mode .dlw-stage{display:grid;grid-auto-flow:column;grid-template-columns:152px;grid-auto-columns:1fr;grid-template-rows:1fr 1fr;gap:10px}',
      '.dlw-row-mode .dlw-tile{flex-direction:column;justify-content:center;text-align:center;gap:8px;padding:14px}',
      '.dlw-row-mode .dlw-tile-body{display:flex;flex-direction:column;gap:5px}',
      '.dlw-row-mode .dlw-t-avatar{grid-column:1;grid-row:1}',
      '.dlw-row-mode .dlw-t-streak{grid-column:1;grid-row:2}',
      '.dlw-row-mode .dlw-t-league,.dlw-row-mode .dlw-t-continue,.dlw-row-mode .dlw-t-practice{grid-row:1 / span 2}',
      // the stacked cells are half-height - keep avatar + streak compact
      '.dlw-row-mode .dlw-t-avatar,.dlw-row-mode .dlw-t-streak{padding:8px;gap:2px}',
      '.dlw-row-mode .dlw-t-avatar .dlw-avatar{width:48px;height:48px}',
      '.dlw-row-mode .dlw-t-avatar .dlw-mood{width:18px;height:18px}',
      '.dlw-row-mode .dlw-t-avatar .dlw-title{font-size:13px}',
      '.dlw-row-mode .dlw-t-streak .dlw-tile-ico svg{width:34px}',
      '.dlw-row-mode .dlw-t-streak .dlw-streak-num{font-size:28px}',
      '.dlw-row-mode .dlw-t-avatar .dlw-sub,.dlw-row-mode .dlw-t-streak .dlw-sub{font-size:11px}',
      // full-height tiles keep the larger sizing
      '.dlw-row-mode .dlw-tile-ico svg{width:52px;height:auto}',
      '.dlw-row-mode .dlw-lang-ico{width:56px;height:56px}',
      '.dlw-row-mode .dlw-title{font-size:19px}',
      '.dlw-row-mode .dlw-sub{font-size:14px}',
      '.dlw-row-mode .dlw-ring{width:44px;height:44px}',
      '.dlw-row-mode .dlw-ring svg{width:44px;height:44px}',
      '.dlw-row-mode .dlw-ring-pct{font-size:11px}',

      // ── grid mode (300x300) - 2x2 vertical tiles
      '.dlw-grid-mode .dlw-stage{flex-direction:row;flex-wrap:wrap;align-content:stretch}',
      '.dlw-grid-mode .dlw-tile{flex:1 1 calc(50% - 5px);min-width:calc(50% - 5px);flex-direction:column;justify-content:center;text-align:center;gap:4px;padding:10px}',
      '.dlw-grid-mode .dlw-avatar{width:44px;height:44px}',
      '.dlw-grid-mode .dlw-tile-ico svg{width:34px;height:auto}',
      '.dlw-grid-mode .dlw-ring{display:none}',
      '.dlw-grid-mode .dlw-pickup{display:none}',

      // ── col mode (160x300, 140x300) - 4 compact horizontal rows
      '.dlw-col-mode .dlw-stage{flex-direction:column}',
      '.dlw-col-mode .dlw-tile{flex:1;flex-direction:row;align-items:center;gap:10px;padding:10px}',
      '.dlw-col-mode .dlw-tile-body{flex:1}',
      '.dlw-col-mode .dlw-avatar{width:34px;height:34px}',
      '.dlw-col-mode .dlw-lang-ico{width:34px;height:34px}',
      '.dlw-col-mode .dlw-tile-ico svg{width:26px;height:auto}',
      '.dlw-col-mode .dlw-streak-num{font-size:20px}',
      '.dlw-col-mode .dlw-title{font-size:13px}',
      '.dlw-col-mode .dlw-sub{font-size:11px}',
      '.dlw-col-mode .dlw-action,.dlw-col-mode .dlw-ring,.dlw-col-mode .dlw-pickup{display:none}',
      '.dlw-col-mode a.dlw-tile::after{content:"\\203A";color:#04AA6D;font-size:22px;font-weight:700;line-height:1;flex-shrink:0}',

      // ── Anon: aspiration carousel (padlocked) + persistent sign-up bar ──
      '.dlw-anon2{display:flex;flex-direction:column;width:100%;height:100%;background:#fff;border-radius:12px;box-shadow:0 4px 16px rgba(0,0,0,.15);border:1px solid rgba(0,0,0,.06);overflow:hidden}',
      '.dlw-caro{position:relative;flex:1;min-height:150px;overflow:hidden;background:linear-gradient(180deg,#30323f,#23242f)}',
      '.dlw-caro-lock{position:absolute;top:8px;right:8px;z-index:2;width:26px;height:26px;border-radius:50%;background:rgba(255,255,255,.16);display:flex;align-items:center;justify-content:center}',
      '.dlw-caro-lock svg{width:14px;height:14px;fill:#fff}',
      // slow, gentle glide - a fast snap between slides reads as motion sickness
      '.dlw-caro-track{display:flex;height:100%;transition:transform 1.2s cubic-bezier(.45,.05,.2,1)}',
      '.dlw-slide{flex:0 0 100%;height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;padding:16px 14px 26px;text-align:center;color:#fff}',
      // combined XP + streak slide (compact - shares the box with the pinned CTA on anon/frozen)
      '.dlw-combo{gap:9px}',
      '.dlw-combo-head{display:flex;align-items:center;justify-content:center;gap:9px}',
      '.dlw-combo .dlw-vis-num{font-size:34px}',
      '.dlw-combo-head .dlw-vis-bolt svg{width:26px;height:30px}',
      '.dlw-combo .dlw-slide-cap b{font-size:16px}',
      '.dlw-combo .dlw-slide-cap span{font-size:12px;margin-top:2px}',
      '.dlw-combo-stats{display:flex;align-items:stretch;justify-content:center;gap:30px;border-top:1px solid rgba(255,255,255,.14);padding-top:10px;width:78%}',
      '.dlw-combo-stat{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1px;font-weight:700;color:#fff;font-size:17px}',
      '.dlw-combo-label{font-size:12px;color:#c9cdd6;font-weight:600}',
      '.dlw-combo-flame svg{width:18px;height:21px}',
      '.dlw-combo-div{width:1px;background:rgba(255,255,255,.15)}',
      // button slides share the combo's compact typography
      // course progress bar above the Continue learning link
      '.dlw-progressbar{display:block;width:190px;height:8px;border-radius:4px;background:rgba(255,255,255,.16);overflow:hidden}',
      '.dlw-progressbar-fill{display:block;height:100%;background:#04AA6D;border-radius:4px}',
      '.dlw-vis-link{text-decoration:none;color:inherit;display:block}',
      '.dlw-cap-link{color:#fff;text-decoration:none}',
      '.dlw-cap-link:hover{color:#fff;text-decoration:underline}',
      '.dlw-vis-link:hover~.dlw-slide-cap .dlw-cap-link{text-decoration:underline}',
      '.dlw-slide-vis{display:flex;align-items:center;justify-content:center;gap:10px;min-height:78px}',
      '.dlw-slide-cap b{display:block;font-size:19px;font-weight:700;color:#fff}',
      '.dlw-slide-cap span{display:block;font-size:13px;color:#c9cdd6;margin-top:4px}',
      '.dlw-vis-num{font-size:46px;font-weight:700;color:#FF9600}',
      '.dlw-vis-green{color:#04AA6D}',
      '.dlw-vis-flame svg{width:64px;height:auto}',
      '.dlw-vis-league img{width:58px;height:58px}',
      '.dlw-vis-league .dlw-vis-hi{width:80px;height:80px;filter:drop-shadow(0 0 10px rgba(150,120,255,.7))}',
      '.dlw-vis-arrow{color:#6b6f7d;font-size:24px;font-weight:700}',
      '.dlw-vis-bolt svg{width:52px;height:58px}',
      '.dlw-vis-noads-ico svg{width:66px;height:66px}',
      '.dlw-vis-av{width:92px;height:92px;border-radius:50%;background:#fff}',
      '.dlw-vis-chip{width:52px;height:52px;border-radius:50%;background:#fff;display:flex;align-items:center;justify-content:center;margin-left:-16px;box-shadow:0 2px 6px rgba(0,0,0,.35)}',
      '.dlw-vis-chip img{width:38px;height:38px;object-fit:contain}',
      // Spaces preview - bare image with alpha-aware shadow, like the practice mockup
      '.dlw-vis-spaces-img{width:250px;height:auto;filter:drop-shadow(0 10px 22px rgba(0,0,0,.5))}',
      '.dlw-col-mode .dlw-vis-spaces-img{width:124px}',
      // anon/frozen reels share the box with the pinned CTA - cap screenshot height
      // so the caption stays visible above the button
      '.dlh-anon .dlw-vis-practice-img,.dlh-frozen .dlw-vis-practice-img,' +
      '.dlh-anon .dlw-vis-spaces-img,.dlh-frozen .dlw-vis-spaces-img{width:auto;max-width:240px;max-height:140px}',
      // quiet per-slide action link
      // bare image (the mockup has its own device frame) - alpha-aware shadow, no box chrome
      '.dlw-vis-practice-img{width:250px;height:auto;filter:drop-shadow(0 10px 22px rgba(0,0,0,.5))}',
      '.dlw-col-mode .dlw-vis-practice-img{width:124px}',
      '.dlw-caro-dots{position:absolute;bottom:8px;left:0;right:0;display:flex;gap:6px;justify-content:center;z-index:2}',
      '.dlw-dot{width:7px;height:7px;border-radius:50%;background:rgba(255,255,255,.35);border:none;cursor:pointer;padding:0;transition:width .2s,background .2s}',
      '.dlw-dot.active{background:#04AA6D;width:18px;border-radius:4px}',
      '.dlw-anon-bar{display:flex;flex-direction:column;align-items:center;gap:8px;padding:14px 18px}',
      '.dlw-anon-signup{align-self:stretch;text-align:center;box-shadow:0 4px 14px rgba(4,170,109,.4);transition:transform .12s,background .15s}',
      '.dlw-anon-signup:hover{transform:translateY(-1px)}',
      '.dlw-anon-or{font-size:11px;color:#aaa}',
      '.dlw-anon-social-row{display:flex;gap:10px;justify-content:center}',
      '.dlw-social{display:inline-flex;align-items:center;justify-content:center;width:38px;height:38px;border-radius:50%;border:1px solid #ddd;background:#fff;cursor:pointer;transition:transform .15s,box-shadow .15s}',
      '.dlw-social:hover{transform:scale(1.12);box-shadow:0 4px 12px rgba(0,0,0,.18)}',
      '.dlw-anon-signin{font-size:12px;color:#888}',
      '.dlw-anon-signin a{color:#04AA6D;font-weight:700;text-decoration:none}',
      '.dlw-anon-signin a:hover{text-decoration:underline}',
      '.dlw-cta-s{display:none}',
      // row (960/720): carousel left, sign-up bar pinned right
      '.dlw-row-mode .dlw-anon2{flex-direction:row}',
      '.dlw-row-mode .dlw-anon-bar{flex:0 0 320px;justify-content:center;padding:20px 26px}',
      '.dlw-row-mode .dlw-slide-cap b{font-size:18px}',
      // grid (300): compact bar
      '.dlw-grid-mode .dlw-anon-bar{padding:12px;gap:6px}',
      '.dlw-grid-mode .dlw-anon-or{display:none}',
      // col (160/140): tight bar, short button, small socials, no divider/caption-sub
      '.dlw-col-mode .dlw-anon-bar{padding:10px;gap:7px}',
      '.dlw-col-mode .dlw-anon-or{display:none}',
      '.dlw-col-mode .dlw-cta-l{display:none}',
      '.dlw-col-mode .dlw-cta-s{display:inline}',
      '.dlw-col-mode .dlw-social{width:30px;height:30px}',
      '.dlw-col-mode .dlw-slide-cap b{font-size:13px}',
      '.dlw-col-mode .dlw-slide-cap span{display:none}',
      '.dlw-col-mode .dlw-vis-num{font-size:26px}',

      // ── Hero (full-width default.asp banner) ──
      '.dlh,.dlh *,.dlh *::before,.dlh *::after{box-sizing:border-box}',
      // Reserve a stable height up-front so the page does not jump when the hero
      // resolves (empty -> content) or swaps anon/logged-in layouts.
      '.dlh-host{display:flex;align-items:center;min-height:400px}',
      '.dlh{display:flex;align-items:center;gap:48px;width:100%;max-width:1100px;margin:0 auto;padding:10px 20px;text-align:left;font-family:"Source Sans Pro","Segoe UI",sans-serif}',
      '.dlh-left{flex:2;min-width:0}',
      '.dlh-right{flex:1.2;min-width:0;max-width:520px}',
      // one fixed size for the showcase in BOTH states so anon and logged-in heroes match
      '.dlh-right .dlw-caro{height:340px;border-radius:16px;box-shadow:0 16px 48px rgba(0,0,0,.4)}',
      // !important margin beats default.asp global `h1{margin:2px 0 -20px 0 !important}` which otherwise overlaps the paragraph.
      '.dlh-title{font-size:62px!important;font-weight:700;color:#fff;margin:0 0 16px!important;line-height:1.05;font-family:"Source Sans Pro",sans-serif}',
      '.dlh-free{font-size:21px;color:#fff;margin:0 0 20px;line-height:1.4}',
      '.dlh-free b{color:#FFF4A3}',
      '.dlh-support{color:#c9cdd6;font-size:16px;line-height:1.55;margin:0 0 8px;max-width:520px}',
      '.dlh-perks{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:6px 32px;list-style:none;margin:0 0 14px;padding:0;max-width:440px}',
      '.dlh-perks li{position:relative;padding-left:24px;color:#fff;font-size:15px;line-height:1.5;white-space:nowrap}',
      '.dlh-perks li::before{content:"\\2713";position:absolute;left:0;color:#04AA6D;font-weight:700}',
      // "Sign in" CTA pinned to the bottom inside the carousel (anon hero)
      '.dlw-caro-cta{position:absolute;left:14px;right:14px;bottom:24px;z-index:2;display:block;text-align:center;background:#04AA6D;color:#fff;font-family:"Source Sans Pro",sans-serif;font-size:16px;font-weight:600;padding:10px;border-radius:8px;text-decoration:none;box-shadow:0 4px 14px rgba(0,0,0,.35);transition:background .15s}',
      '.dlw-caro-cta:hover{background:#059862;color:#fff}',
      // slides nudge content up just enough to clear the pinned CTA (anon Sign in /
      // frozen Reactivate), keeping the carousel box identical across states
      '.dlh-anon .dlw-slide,.dlh-frozen .dlw-slide{padding-bottom:58px}',
      '.dlh-sub{font-size:14px;color:#aab;margin-top:14px}',
      '.dlh-dash{display:inline-flex;align-items:center;gap:7px;color:#aab;font-size:14px;font-weight:600;text-decoration:none}',
      '.dlh-dash:hover{color:#04AA6D}',
      '.dlh-dash svg{flex-shrink:0}',
      '.dlh-sub a{color:#04AA6D;font-weight:700;text-decoration:none}',
      '.dlh-sub a:hover{text-decoration:underline}',
      // badges variant: stats card on top + three badge cards below
      '.dlh-badges{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}',
      '.dlh-stats-card{grid-column:1/-1;display:flex;align-items:stretch;justify-content:space-between;gap:8px;padding:20px 16px;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.14);border-radius:12px}',
      '.dlh-stat{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:flex-start;gap:4px;text-decoration:none;min-width:0}',
      '.dlh-stat-top{height:38px;display:flex;align-items:center;justify-content:center}',
      '.dlh-stat b{font-size:20px;color:#fff;white-space:nowrap;max-width:100%;overflow:hidden;text-overflow:ellipsis}',
      '.dlh-stat b i{font-style:normal}',
      '.dlh-stat-unit{font-size:13px;color:#c9cdd6;font-weight:600}',
      '.dlh-stat-label{font-size:13px;color:#c9cdd6;font-weight:600;white-space:nowrap}',
      '.dlh-stat:hover .dlh-stat-label{color:#fff}',
      '.dlh-stat-ico svg{width:23px;height:26px}',
      '.dlh-stat-bolt svg{width:29px;height:32px}',
      '.dlh-stat img{width:36px;height:36px;object-fit:contain}',
      '.dlh-stat-locked{filter:grayscale(1);opacity:.45}',
      '.dlh-stat-div{width:1px;background:rgba(255,255,255,.15);flex:0 0 1px}',
      '.dlh-badge{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:5px;padding:14px 10px;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.14);border-radius:12px;text-decoration:none;text-align:center;transition:background .15s,transform .12s}',
      '.dlh-badge:hover{background:rgba(255,255,255,.13);transform:translateY(-2px)}',
      '.dlh-badge-ico{height:42px;display:flex;align-items:center;justify-content:center}',
      '.dlh-badge-ico svg{width:34px;height:38px}',
      '.dlh-badge-ico img{width:42px;height:42px;object-fit:contain}',
      '.dlh-badge b{font-size:17px;color:#fff;white-space:nowrap;max-width:100%;overflow:hidden;text-overflow:ellipsis}',
      '.dlh-badge b i{font-style:normal}',
      '.dlh-badge-green{color:#04AA6D}',
      '.dlh-badge>span:last-child{font-size:12px;color:#c9cdd6;white-space:nowrap;max-width:100%;overflow:hidden;text-overflow:ellipsis}',
      // fallback when there is no continue data: "Or continue reading for free [All Tutorials]"
      '.dlh-startrow{display:flex;align-items:center;gap:14px;margin-top:4px}',
      '.dlh-or{color:#c9cdd6;font-size:16px}',
      '.dlh-or-link{color:#04AA6D;font-size:16px;font-weight:700;text-decoration:none}',
      '.dlh-or-link:hover{color:#04AA6D;text-decoration:underline}',
      '.dlh-hname{white-space:nowrap}',
      '.dlh-hav-wrap{position:relative;display:inline-block;vertical-align:middle;margin-left:16px;margin-top:-8px;line-height:0}',
      '.dlh-havatar{width:56px;height:56px;border-radius:50%;background:#fff;object-fit:contain}',
      '.dlh-face{position:absolute;top:0;left:0;width:100%;height:100%;object-fit:contain;pointer-events:none}',
      // continue row: floating "pick up where you left off" tag + green-tinted border
      '.dlh-cont2{position:relative;display:flex;width:100%;max-width:400px;box-sizing:border-box;align-items:center;gap:16px;margin-top:22px;padding:16px 18px 14px;border-radius:12px;background:rgba(255,255,255,.07);border:1px solid rgba(4,170,109,.55);text-decoration:none;transition:background .15s}',
      '.dlh-cont2:hover{background:rgba(255,255,255,.12)}',
      '.dlh-cont2-tag{position:absolute;top:-10px;left:50%;transform:translateX(-50%);background:#D9EEE1;color:#04AA6D;font-size:9px;font-weight:700;padding:3px 12px;border-radius:4px;text-transform:uppercase;letter-spacing:.04em;white-space:nowrap}',
      '.dlh-cont2-ico{width:46px;height:46px;border-radius:9px;background:#fff;display:flex;align-items:center;justify-content:center;flex-shrink:0}',
      '.dlh-cont2-txt{font-size:18px;font-weight:700;color:#fff;white-space:nowrap}',
      '.dlh-cont2-mid{flex:1;display:flex;flex-direction:column;gap:4px;min-width:0}',
      '.dlh-cont2 .dlw-progressbar{width:100%;max-width:170px}',
      '@media(max-width:900px){.dlh-host{min-height:0;padding:24px 0}.dlh{flex-direction:column;text-align:center;gap:28px}.dlh-left{order:1}.dlh-right{order:2;flex:0 0 auto;width:100%;max-width:380px}.dlh-support{margin-left:auto;margin-right:auto}.dlh-perks{margin-left:auto;margin-right:auto;width:fit-content;text-align:left}.dlh-startrow{justify-content:center}.dlh-cont2{margin-left:auto;margin-right:auto}.dlh-title{font-size:48px!important}}',
      // small screens: tighter type; the showcase (carousel / badges) stays visible
      '@media(max-width:600px){.dlh-title{font-size:40px!important}.dlh-free{font-size:18px}}'
    ].join('\n');
    var el = document.createElement('style');
    el.id = DashboardLite._styleId;
    el.textContent = css;
    document.head.appendChild(el);

    // Re-fit titles on resize (e.g. the responsive homepage hero).
    if (!DashboardLite._fitBound) {
      DashboardLite._fitBound = true;
      var t;
      window.addEventListener('resize', function () {
        clearTimeout(t);
        t = setTimeout(function () {
          var els = document.querySelectorAll('.dlw-title[data-full]');
          for (var i = 0; i < els.length; i++) DashboardLite._fitTitle(els[i]);
        }, 150);
      });
    }
  };

  DashboardLite._ringHtml = function (pct) {
    var r = 16, circ = 2 * Math.PI * r;
    return '<div class="dlw-ring"><svg width="40" height="40" viewBox="0 0 40 40" style="transform:rotate(-90deg)">' +
      '<circle cx="20" cy="20" r="16" fill="none" stroke="#e8e8e8" stroke-width="4"></circle>' +
      '<circle cx="20" cy="20" r="16" fill="none" stroke="#04AA6D" stroke-width="4" stroke-linecap="round"' +
        ' stroke-dasharray="' + circ + '" stroke-dashoffset="' + (circ * (1 - pct / 100)) + '"></circle>' +
      '</svg><div class="dlw-ring-pct">' + pct + '%</div></div>';
  };

  // ── Individual tile builders (composed by the widget and the hero) ──
  DashboardLite._tileAvatar = function (xp) {
    var fb = DashboardLite._fallbackAvatar;
    return '<div class="dlw-tile dlw-t-avatar">' +
      '<div class="dlw-tile-ico"><span class="dlw-av-wrap">' +
        '<img class="dlw-avatar" src="' + fb + '" alt="Avatar" onerror="this.onerror=null;this.src=\'' + fb + '\'">' +
        '<img class="dlw-mood" alt="" style="display:none">' +
      '</span></div>' +
      '<div class="dlw-tile-body">' +
        '<div class="dlw-title dlw-name">&nbsp;</div>' +
        '<div class="dlw-sub">XP <b class="dlw-xp">' + xp + '</b></div>' +
      '</div>' +
    '</div>';
  };
  DashboardLite._tileStreak = function (streak) {
    return '<div class="dlw-tile dlw-t-streak">' +
      '<div class="dlw-tile-ico">' + DashboardLite._flameSvg + '</div>' +
      '<div class="dlw-tile-body">' +
        '<div class="dlw-streak-num dlw-streak">' + streak + '</div>' +
        '<div class="dlw-sub">day streak</div>' +
        '<div class="dlw-sub dlw-freeze"></div>' +
      '</div>' +
    '</div>';
  };
  DashboardLite._tileLeague = function () {
    var woodBadge = DashboardLite._leagueImgBase + '/wood.svg';
    return '<a class="dlw-tile dlw-t-league ga-fp ga-widget-league" href="' + DashboardLite._leaderboardUrl + '">' +
      '<div class="dlw-tile-ico"><img class="dlw-badge" src="' + woodBadge + '" alt="League" ' +
        'onerror="this.onerror=null;this.src=\'' + woodBadge + '\'"></div>' +
      '<div class="dlw-tile-body">' +
        '<div class="dlw-title dlw-tier">Wood</div>' +
        '<div class="dlw-sub dlw-league-rank"></div>' +
        '<div class="dlw-sub dlw-league-xp"><b class="dlw-weekly">0</b> XP</div>' +
      '</div>' +
      '<span class="dlw-action"><span class="dlw-btn">View</span></span>' +
    '</a>';
  };
  // Continue is filled once progress resolves; hidden until then.
  DashboardLite._tileContinue = function () {
    return '<a class="dlw-tile dlw-t-continue ga-fp ga-widget-continue" href="#" style="display:none"></a>';
  };
  // Weekly practice - shown only if the selected language has a practice page.
  DashboardLite._tilePractice = function () {
    return '<a class="dlw-tile dlw-t-practice ga-fp ga-widget-practice" href="#" style="display:none">' +
      '<div class="dlw-tile-ico dlw-lang-ico">' + DashboardLite._puzzleSvg + '</div>' +
      '<div class="dlw-tile-body"><div class="dlw-title dlw-practice-title">Weekly practice</div>' +
        '<div class="dlw-sub">Solve &amp; earn bonus XP</div></div>' +
      '<span class="dlw-action"><span class="dlw-btn">Solve</span></span>' +
    '</a>';
  };

  DashboardLite._loggedInHtml = function (seed) {
    seed = seed || {};
    var xp = typeof seed._initialXp === 'number' ? seed._initialXp : 0;
    var streak = typeof seed._initialStreak === 'number' ? seed._initialStreak : 0;
    return '<div class="dlw-stage">' +
      DashboardLite._tileAvatar(xp) + DashboardLite._tileStreak(streak) +
      DashboardLite._tileLeague() + DashboardLite._tileContinue() + DashboardLite._tilePractice() +
    '</div>';
  };

  DashboardLite._continueInner = function (c) {
    return '<div class="dlw-pickup">Pick up where you left off</div>' +
      '<div class="dlw-tile-ico dlw-lang-ico">' + DashboardLite._topicIconHtml(c.title) + '</div>' +
      '<div class="dlw-tile-body">' +
        '<div class="dlw-title">' + DashboardLite._esc(c.title) + '</div>' +
        '<div class="dlw-sub">' + DashboardLite._esc(c.next) + '</div>' +
      '</div>' +
      DashboardLite._ringHtml(typeof c.progress === 'number' ? c.progress : 0) +
      '<span class="dlw-action"><span class="dlw-btn">Continue</span></span>';
  };

  DashboardLite._lockSvg =
    '<svg viewBox="0 0 24 24" fill="#04AA6D"><path d="M12 1a5 5 0 0 0-5 5v3H6a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-9a2 2 0 0 0-2-2h-1V6a5 5 0 0 0-5-5zm3 8H9V6a3 3 0 0 1 6 0v3z"/></svg>';
  // Analytics classes for tracked buttons/links: "ga-fp ga-frontpage-<name>".
  DashboardLite._gaCls = function (name) { return 'ga-fp ga-frontpage-' + name; };

  // href links only the main visual and the title - not the whole slide box.
  DashboardLite._slide = function (visCls, vis, title, sub, href, ga) {
    var visHtml = '<div class="dlw-slide-vis ' + visCls + '">' + vis + '</div>';
    var titleHtml = title;
    if (href) {
      var h = DashboardLite._esc(href);
      var cls = ga ? ' ' + ga : '';
      visHtml = '<a class="dlw-vis-link' + cls + '" href="' + h + '">' + visHtml + '</a>';
      titleHtml = '<a class="dlw-cap-link' + cls + '" href="' + h + '">' + title + '</a>';
    }
    return '<div class="dlw-slide">' + visHtml +
      '<div class="dlw-slide-cap"><b>' + titleHtml + '</b><span>' + sub + '</span></div></div>';
  };
  DashboardLite._boltSvg = '<svg viewBox="0 0 24 24" fill="#FFD23F"><path d="M13 2L4.5 13.5H11l-1 8.5L19.5 10H12.5z"/></svg>';
  DashboardLite._noAdsSvg = '<svg viewBox="0 0 24 24" fill="none" stroke="#7ee0b8" stroke-width="2.2"><circle cx="12" cy="12" r="9"/><line x1="5.6" y1="5.6" x2="18.4" y2="18.4"/></svg>';

  // Combined XP + streak slide: big headline, caption, divided stats row, optional button.
  DashboardLite._comboSlide = function (head, leftLabel, leftVal, streak, btnHtml) {
    return '<div class="dlw-slide dlw-combo">' +
      '<div class="dlw-combo-head"><span class="dlw-vis-bolt">' + DashboardLite._boltSvg + '</span>' +
        '<span class="dlw-vis-num dlw-vis-green">' + head + '</span></div>' +
      '<div class="dlw-slide-cap"><b>Keep learning. Keep leveling up.</b>' +
        '<span>Track your progress and achieve more.</span></div>' +
      '<div class="dlw-combo-stats">' +
        '<div class="dlw-combo-stat"><span class="dlw-combo-label">' + leftLabel + '</span><span>' + leftVal + '</span></div>' +
        '<div class="dlw-combo-div"></div>' +
        '<div class="dlw-combo-stat"><span class="dlw-combo-flame">' + DashboardLite._flameSvg + '</span>' +
          '<span>' + streak + '</span><span class="dlw-combo-label">Day streak</span></div>' +
      '</div>' +
      (btnHtml || '') +
    '</div>';
  };
  // Spaces preview screenshot (own frame in the image, shown bare like the practice mockup).
  DashboardLite._editorMockHtml = function () {
    return '<picture><source srcset="/images/img_spaces_preview.webp" type="image/webp">' +
      '<img class="dlw-vis-spaces-img" src="/images/img_spaces_preview.png" alt="" loading="lazy"></picture>';
  };

  // Aspiration slides (anon) - sell the dream, padlocked.
  DashboardLite._carouselSlides = function () {
    var L = DashboardLite._leagueImgBase, S = DashboardLite._slide;
    var arrow = '<span class="dlw-vis-arrow">›</span>';
    // Same order as the logged-in reel (XP+streak combo, Spaces, practice, league),
    // then the anon-only extras (ad-free, avatar gear). The pinned carousel CTA
    // (Sign in / Reactivate) doubles as the combo slide's button on these reels.
    // dummy XP numbers (no level system) - same structure as the logged-in combo
    return DashboardLite._comboSlide('12,560', 'XP this week', '850', '7', '') +
      S('dlw-vis-build', DashboardLite._editorMockHtml(), 'Build &amp; host sites', 'Your own Spaces, live on the web') +
      S('dlw-vis-practice', '<picture><source srcset="/images/img_mockup.webp" type="image/webp"><img class="dlw-vis-practice-img" src="/images/img_mockup.png" alt="" loading="lazy"></picture>', 'Weekly practice', 'Fresh problems &amp; bonus XP') +
      S('dlw-vis-league', '<img src="' + L + '/wood.svg" alt="">' + arrow + '<img src="' + L + '/gold.svg" alt="">' + arrow +
        '<img class="dlw-vis-hi" src="' + L + '/diamond.svg" alt="">', 'Climb the leagues', 'From Wood to Master Coder',
        DashboardLite._leagueInfoUrl, DashboardLite._gaCls('league-info')) +
      S('dlw-vis-noads', '<span class="dlw-vis-noads-ico">' + DashboardLite._noAdsSvg + '</span>', 'Ad-free learning', 'Focus with zero distractions') +
      S('dlw-vis-avatar', '<img class="dlw-vis-av" src="' + DashboardLite._fallbackAvatar + '" alt="">' +
        '<span class="dlw-vis-chip"><img src="/lib/account/img/avatar_shirt.png" alt="" loading="lazy"></span>' +
        '<span class="dlw-vis-chip"><img src="/lib/account/img/avatar_shorts.png" alt="" loading="lazy"></span>',
        'Customize your avatar', 'Unlock gear, moods &amp; rare skins');
  };
  DashboardLite._caroSlideCount = 6;

  DashboardLite._spacesUrl = 'https://spaces.w3schools.com';
  DashboardLite._dashboardUrl = 'https://pathfinder.w3schools.com';

  // Per-topic activity pages (topicName lowercase). Fallback chain for the activity
  // badge: weekly practice -> challenges -> exercises -> quiz -> generic challenges.
  DashboardLite._activityMaps = {
    challenges: {
      html: '/html/html_challenges.asp', css: '/css/css_challenges.asp',
      python: '/python/python_challenges.asp', java: '/java/java_challenges.asp',
      'c++': '/cpp/cpp_challenges.asp'
    },
    exercises: {
      html: '/html/html_exercises.asp', css: '/css/css_exercises.asp',
      javascript: '/js/js_exercises.asp', python: '/python/python_exercises.asp',
      sql: '/sql/sql_exercises.asp', php: '/php/php_exercises.asp',
      java: '/java/java_exercises.asp', c: '/c/c_exercises.php',
      'c++': '/cpp/cpp_exercises.asp', 'c#': '/cs/cs_exercises.php',
      jquery: '/jquery/jquery_exercises.asp', mysql: '/mysql/mysql_exercises.asp',
      'node.js': '/nodejs/nodejs_exercises.asp', nodejs: '/nodejs/nodejs_exercises.asp',
      r: '/r/r_exercises.asp', react: '/react/react_exercises.asp',
      angular: '/angular/angular_exercises.asp', bootstrap: '/bootstrap5/bootstrap_exercises.php',
      git: '/git/git_exercises.asp', kotlin: '/kotlin/kotlin_exercises.php',
      go: '/go/go_exercises.php', swift: '/swift/swift_exercises.asp',
      typescript: '/typescript/typescript_exercises.php', vue: '/vue/vue_exercises.php',
      dsa: '/dsa/dsa_exercises.php', django: '/django/django_exercises.php',
      mongodb: '/mongodb/mongodb_exercises.php', postgresql: '/postgresql/postgresql_exercises.php',
      excel: '/excel/excel_exercises.php', aws: '/aws/aws_exercises.php',
      bash: '/bash/bash_exercises.php', 'cyber security': '/cybersecurity/cybersecurity_exercises.php'
    },
    quiz: {
      html: '/html/html_quiz.asp', css: '/css/css_quiz.asp', javascript: '/js/js_quiz.asp',
      python: '/python/python_quiz.asp', sql: '/sql/sql_quiz.asp', php: '/php/php_quiz.asp',
      java: '/java/java_quiz.asp', c: '/c/c_quiz.php', 'c++': '/cpp/cpp_quiz.asp',
      'c#': '/cs/cs_quiz.php', jquery: '/jquery/jquery_quiz.asp', mysql: '/mysql/mysql_quiz.asp',
      'node.js': '/nodejs/nodejs_quiz.asp', nodejs: '/nodejs/nodejs_quiz.asp',
      r: '/r/r_quiz.asp', react: '/react/react_quiz.asp', angular: '/angular/angular_quiz.asp',
      bootstrap: '/bootstrap5/bootstrap_quiz.php', git: '/git/git_quiz.asp',
      kotlin: '/kotlin/kotlin_quiz.php', swift: '/swift/swift_quiz.asp',
      typescript: '/typescript/typescript_quiz.php', vue: '/vue/vue_quiz.php',
      dsa: '/dsa/dsa_quiz.php', django: '/django/django_quiz.php',
      postgresql: '/postgresql/postgresql_quiz.php', bash: '/bash/bash_quiz.php',
      aws: '/aws/aws_quiz.php', 'cyber security': '/cybersecurity/cybersecurity_quiz.php',
      accessibility: '/accessibility/accessibility_quiz.php', xml: '/xml/xml_quiz.asp'
    }
  };
  DashboardLite._actIcons = {
    target: '<svg viewBox="0 0 24 24" fill="none" stroke="#04AA6D" stroke-width="2"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1" fill="#04AA6D"/></svg>',
    pencil: '<svg viewBox="0 0 24 24" fill="#04AA6D"><path d="M3 17.25V21h3.75L17.8 9.94l-3.75-3.75L3 17.25zM20.7 7.04a1 1 0 0 0 0-1.41l-2.33-2.33a1 1 0 0 0-1.41 0l-1.83 1.82 3.75 3.75 1.82-1.83z"/></svg>',
    question: '<svg viewBox="0 0 24 24" fill="none" stroke="#04AA6D" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M9.6 9.4a2.5 2.5 0 1 1 3.8 2.1c-.8.5-1.4 1-1.4 2"/><circle cx="12" cy="16.8" r=".5" fill="#04AA6D"/></svg>'
  };
  DashboardLite._activityFor = function (topic) {
    var k = String(topic || '').toLowerCase();
    var p = DashboardLite._practiceUrl(topic);
    if (p) return { label: 'Practice', sub: 'Weekly problem', url: p, ico: DashboardLite._puzzleSvg };
    var A = DashboardLite._activityMaps, I = DashboardLite._actIcons;
    if (A.challenges[k]) return { label: 'Challenges', sub: 'Test your skills', url: A.challenges[k], ico: I.target };
    if (A.exercises[k]) return { label: 'Exercises', sub: 'Train as you learn', url: A.exercises[k], ico: I.pencil };
    if (A.quiz[k]) return { label: 'Quiz', sub: 'Check your knowledge', url: A.quiz[k], ico: I.question };
    return { label: 'Challenges', sub: 'Test your skills', url: '/challenges/index.php', ico: I.target };
  };

  // Alternate logged-in showcase: stats card (total XP, weekly XP, streak, league)
  // + two badges (Spaces and the topic's activity).
  DashboardLite._badgesHtml = function (d, c) {
    var L = DashboardLite._leagueImgBase;
    d = d || {};
    var streak = d.streaks && typeof d.streaks.streaks === 'number' ? d.streaks.streaks : 0;
    // Total XP from competency (canonical); the league endpoint reports 0 for
    // users who have not opted into the league.
    var xp = typeof d.xpTotal === 'number' ? d.xpTotal
      : (d.league && typeof d.league.xp === 'number' ? d.league.xp : 0);
    var weekly = d.league && typeof d.league.weeklyXp === 'number' ? d.league.weeklyXp : 0;
    var optedIn = !!(d.league && d.league.optedIn);
    var tier = d.league && d.league.tier;
    var rank = d.cohort && d.cohort.userRank, total = d.cohort && d.cohort.totalUsers;
    var monitorSvg = '<svg viewBox="0 0 24 24" fill="none" stroke="#7ee0b8" stroke-width="2" stroke-linecap="round"><rect x="3" y="4" width="18" height="13" rx="2"/><path d="M8 21h8M12 17v4"/></svg>';
    var act = DashboardLite._activityFor(c && c.topic);

    // Every stat gets the same top icon zone (empty for the XP columns) so the
    // value and label rows line up across all four columns.
    var stat = function (href, top, val, label, ga) {
      return '<a class="dlh-stat ' + ga + '" href="' + DashboardLite._esc(href) + '">' +
        '<span class="dlh-stat-top">' + (top || '') + '</span>' +
        '<b>' + val + '</b><span class="dlh-stat-label">' + label + '</span></a>';
    };
    var b = function (href, ico, val, label, ga) {
      return '<a class="dlh-badge ' + ga + '" href="' + DashboardLite._esc(href) + '">' +
        '<span class="dlh-badge-ico">' + ico + '</span><b>' + val + '</b><span>' + label + '</span></a>';
    };

    // Three iconed columns; weekly XP lives with the league (it is the league score).
    var tierFirst = DashboardLite._esc(DashboardLite._tierName(tier).split(' ')[0]);
    return '<div class="dlh-badges">' +
      '<div class="dlh-stats-card">' +
        stat(DashboardLite._dashboardUrl, '<span class="dlh-stat-ico dlh-stat-bolt">' + DashboardLite._boltSvg + '</span>',
          '<i class="dlh-badge-green">' + xp.toLocaleString() + '</i>', 'Total XP', DashboardLite._gaCls('total-xp')) +
        '<span class="dlh-stat-div"></span>' +
        stat(DashboardLite._dashboardUrl, '<span class="dlh-stat-ico">' + DashboardLite._flameSvg + '</span>',
          String(streak), 'Day streak', DashboardLite._gaCls('streak')) +
        '<span class="dlh-stat-div"></span>' +
        (optedIn
          ? stat(DashboardLite._leaderboardUrl,
              '<img src="' + DashboardLite._tierIcon(tier) + '" alt="" onerror="this.onerror=null;this.src=\'' + L + '/wood.svg\'">',
              weekly.toLocaleString() + ' <i class="dlh-stat-unit">XP</i>',
              tierFirst + (rank ? ' &middot; #' + rank + (total ? ' of ' + total : '') : ' League'),
              DashboardLite._gaCls('league'))
          // Not opted into the league: the cell becomes the opt-in CTA.
          : stat(DashboardLite._profileBase + '/league',
              '<img class="dlh-stat-locked" src="' + L + '/wood.svg" alt="">',
              'Join', 'Weekly league', DashboardLite._gaCls('join-league'))) +
      '</div>' +
      b(DashboardLite._spacesUrl, monitorSvg, 'Spaces', 'Build &amp; host', DashboardLite._gaCls('spaces')) +
      b(act.url, act.ico, act.label, act.sub, DashboardLite._gaCls(act.label.toLowerCase())) +
      b('https://pathfinder.w3schools.com/exams',
        '<svg viewBox="0 0 24 24" fill="none" stroke="#7ee0b8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="9" r="5"/><path d="M8.7 13.4 7 22l5-3 5 3-1.7-8.6"/></svg>',
        'Certificates', 'Get certified', DashboardLite._gaCls('certificates')) +
    '</div>';
  };

  DashboardLite._anonHtml = function () {
    var ret = window.location.href;
    var retEnc = encodeURIComponent(ret);
    var signupHref = DashboardLite._profileBase + '/signup?redirect_url=' + retEnc;
    var signinHref = DashboardLite._profileBase + '/log-in?redirect_url=' + retEnc;
    var signupClick = "event.preventDefault();event.stopPropagation();" +
      "if(typeof TopNavBar!=='undefined'&&typeof TopNavBar.showSignupDropdown==='function'){TopNavBar.showSignupDropdown();}" +
      "else{window.open(this.href,'_blank');}";
    var signinClick = "event.preventDefault();event.stopPropagation();" +
      "if(typeof TopNavBar!=='undefined'&&typeof TopNavBar.showLoginDropdown==='function'){TopNavBar.showLoginDropdown();}" +
      "else{window.open(this.href,'_blank');}";

    var dots = '';
    for (var k = 0; k < DashboardLite._caroSlideCount; k++) {
      dots += '<button class="dlw-dot ga-fp ga-frontpage-carousel-dot' + (k === 0 ? ' active' : '') + '" aria-label="Slide ' + (k + 1) + '"></button>';
    }

    return '<div class="dlw-anon2">' +
      '<div class="dlw-caro">' +
        '<div class="dlw-caro-lock" aria-hidden="true">' + DashboardLite._lockSvg + '</div>' +
        '<div class="dlw-caro-track">' + DashboardLite._carouselSlides() + '</div>' +
        '<div class="dlw-caro-dots">' + dots + '</div>' +
      '</div>' +
      '<div class="dlw-anon-bar">' +
        '<a class="dlw-btn dlw-anon-signup ga-fp ga-dlw-signup" href="' + DashboardLite._esc(signupHref) + '" ' +
          'onclick="' + signupClick + '"><span class="dlw-cta-l">Start free trial</span>' +
          '<span class="dlw-cta-s">Free trial</span></a>' +
        '<div class="dlw-anon-or">or continue with</div>' +
        '<div class="dlw-anon-social-row">' +
          DashboardLite._socialBtn('google', ret) +
          DashboardLite._socialBtn('facebook', ret) +
          DashboardLite._socialBtn('github', ret) +
        '</div>' +
        '<div class="dlw-anon-signin">Cancel anytime · ' +
          '<a class="ga-fp ga-dlw-signin-link" href="' + DashboardLite._esc(signinHref) + '" onclick="' + signinClick + '">Sign in</a></div>' +
      '</div>' +
    '</div>';
  };

  // Auto-rotating carousel, scoped to one container (multiple instances run independently).
  DashboardLite._startCarousel = function (container) {
    if (container._dlwCaroTimer) { clearInterval(container._dlwCaroTimer); container._dlwCaroTimer = null; }
    var caro = container.querySelector('.dlw-caro');
    if (!caro) return;
    var track = caro.querySelector('.dlw-caro-track');
    var dots = caro.querySelectorAll('.dlw-dot');
    var count = track ? track.children.length : 0;
    if (!track || count < 2) return;

    var idx = 0, timer = null;
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var go = function (n) {
      idx = (n % count + count) % count;
      track.style.transform = 'translateX(' + (-idx * 100) + '%)';
      for (var d = 0; d < dots.length; d++) dots[d].className = 'dlw-dot ga-fp ga-frontpage-carousel-dot' + (d === idx ? ' active' : '');
    };
    var stop = function () { if (timer) { clearInterval(timer); timer = null; container._dlwCaroTimer = null; } };
    var start = function () { if (!reduce && !timer) { timer = setInterval(function () { go(idx + 1); }, 9000); container._dlwCaroTimer = timer; } };
    for (var d = 0; d < dots.length; d++) {
      (function (i) { dots[i].addEventListener('click', function () { go(i); stop(); start(); }); })(d);
    }
    caro.addEventListener('mouseenter', stop);
    caro.addEventListener('mouseleave', start);
    go(0);
    start();
  };

  // ── Live data (scoped per container; one watcher feeds all instances) ─────
  DashboardLite._instances = [];
  DashboardLite._watching = false;

  DashboardLite._readLiteState = function () {
    if (typeof TopNavBar !== 'undefined' && TopNavBar.mylUserLiteState) return TopNavBar.mylUserLiteState;
    return null;
  };

  DashboardLite._applyLiteStateTo = function (container, s) {
    if (!s) return;
    if (typeof s.xp === 'number') {
      var x = container.querySelector('.dlw-xp');
      if (x) x.textContent = s.xp;
    }
    if (typeof s.lightning === 'number') {
      var st = container.querySelector('.dlw-streak');
      if (st) st.textContent = s.lightning;
    }
  };

  DashboardLite._applyLiteStateAll = function () {
    var s = DashboardLite._readLiteState();
    if (!s) return;
    for (var i = 0; i < DashboardLite._instances.length; i++) {
      DashboardLite._applyLiteStateTo(DashboardLite._instances[i], s);
    }
  };

  DashboardLite._startLiveWatch = function () {
    if (DashboardLite._watching) return;
    DashboardLite._watching = true;
    DashboardLite._applyLiteStateAll();
    if (typeof Util !== 'undefined' && typeof Util.objFieldOnSetCallback === 'function'
        && typeof TopNavBar !== 'undefined') {
      try {
        Util.objFieldOnSetCallback(TopNavBar, 'mylUserLiteState', function () {
          DashboardLite._applyLiteStateAll();
        });
      } catch (e) {}
    }
    var tries = 0;
    var timer = setInterval(function () {
      tries++;
      var s = DashboardLite._readLiteState();
      if (s) {
        DashboardLite._applyLiteStateAll();
        if (typeof s.xp === 'number' || typeof s.lightning === 'number') { clearInterval(timer); return; }
      }
      if (tries >= 10) clearInterval(timer);
    }, 1000);
  };

  DashboardLite._applyData = function (container, d) {
    var qs = function (sel) { return container.querySelector(sel); };

    // Name from basic-lite; avatar prefers the rendered league/user/profile picture.
    if (d.profile) {
      var n = qs('.dlw-name'); if (n) { n.removeAttribute('data-full'); n.textContent = d.profile.fullName || ''; }
    }
    var avatarUrl = (d.avatarP && d.avatarP.avatar) || (d.profile && d.profile.avatar);
    if (avatarUrl) { var a = qs('.dlw-avatar'); if (a) a.src = avatarUrl; }

    // Mood badge overlay
    var m = qs('.dlw-mood');
    if (m) {
      var moodSrc = d.avatarP && d.avatarP.mood ? DashboardLite._moodIcon(d.avatarP.mood) : null;
      if (moodSrc) { m.src = moodSrc; m.style.display = ''; } else { m.style.display = 'none'; }
    }

    if (d.streaks) {
      if (d.streaks.streaks > 0) { var s = qs('.dlw-streak'); if (s) s.textContent = d.streaks.streaks; }
      if (typeof d.streaks.freezeRemaining === 'number') {
        var f = qs('.dlw-freeze'); if (f) f.textContent = d.streaks.freezeRemaining + ' freezes left';
      }
    }

    if (d.league) {
      if (d.league.xp > 0) { var x = qs('.dlw-xp'); if (x) x.textContent = d.league.xp; }
      var t = qs('.dlw-tier'); if (t) { t.removeAttribute('data-full'); t.textContent = DashboardLite._tierName(d.league.tier); }
      var b = qs('.dlw-badge'); if (b) b.src = DashboardLite._tierIcon(d.league.tier);
    }

    // League standing - two stacked lines so narrow tiles don't clip:
    //   Rank: 2 of 20
    //   1015 XP
    var weekly = d.league ? d.league.weeklyXp : 0;
    var rankEl = qs('.dlw-t-league .dlw-league-rank');
    if (rankEl) {
      rankEl.innerHTML = (d.cohort && d.cohort.userRank)
        ? 'Rank: <b>' + d.cohort.userRank + (d.cohort.totalUsers ? ' of ' + d.cohort.totalUsers : '') + '</b>'
        : '';
    }
    var lxpEl = qs('.dlw-t-league .dlw-league-xp');
    if (lxpEl) lxpEl.innerHTML = '<b class="dlw-weekly">' + weekly + '</b> XP';

    DashboardLite._fitContainer(container);
  };

  DashboardLite._fillContinue = function (container, c) {
    var tile = container.querySelector('.dlw-t-continue');
    if (!tile) return;
    if (!c) { tile.style.display = 'none'; return; }
    tile.setAttribute('href', c.url || '#');
    tile.innerHTML = DashboardLite._continueInner(c);
    tile.style.display = '';
    DashboardLite._fitTitle(tile.querySelector('.dlw-title'));
  };

  DashboardLite._fillPractice = function (container, c) {
    var tile = container.querySelector('.dlw-t-practice');
    if (!tile) return;
    if (!c || !c.practice) { tile.style.display = 'none'; return; }
    tile.setAttribute('href', c.practice);
    var ti = tile.querySelector('.dlw-practice-title');
    if (ti) { ti.removeAttribute('data-full'); ti.textContent = 'Practice ' + c.topic; }
    tile.style.display = '';
    DashboardLite._fitTitle(tile.querySelector('.dlw-title'));
  };

  DashboardLite._isLoggedIn = function () {
    // Any positive signal counts. UserSession.loggedIn starts as null and only
    // flips to true after server/API verification (which may not happen on every
    // page/host), so a readable accessToken cookie is the most reliable signal.
    if (typeof UserSession !== 'undefined' && UserSession.loggedIn === true) return true;
    if (DashboardLite._getToken()) return true;
    if (DashboardLite._readLiteState()) return true;
    return false;
  };

  // Logged in but the subscription/trial has ended (uic cookie plan 'closed').
  DashboardLite._plansUrl = 'https://order.w3schools.com/plans';
  DashboardLite._isFrozen = function () {
    try {
      if (typeof UserSession !== 'undefined' && typeof UserSession.getUserSubscriptionPlan === 'function') {
        return String(UserSession.getUserSubscriptionPlan('free')).toLowerCase() === 'closed';
      }
    } catch (e) {}
    return false;
  };

  // Render the logged-in dashboard tiles into widgetEl and wire live data.
  DashboardLite._hydrateLoggedIn = function (widgetEl) {
    var seed = {};
    var lite = DashboardLite._readLiteState();
    if (lite) {
      if (typeof lite.xp === 'number') seed._initialXp = lite.xp;
      if (typeof lite.lightning === 'number') seed._initialStreak = lite.lightning;
    }
    widgetEl.innerHTML = DashboardLite._loggedInHtml(seed);

    if (DashboardLite._instances.indexOf(widgetEl) === -1) DashboardLite._instances.push(widgetEl);
    DashboardLite._applyLiteStateTo(widgetEl, lite);
    DashboardLite._startLiveWatch();

    DashboardLite.loadAll().then(function (data) { DashboardLite._applyData(widgetEl, data); });
    DashboardLite.fetchContinue().then(function (c) {
      DashboardLite._fillContinue(widgetEl, c);
      DashboardLite._fillPractice(widgetEl, c);
      // Re-fit now that all tiles are visible - showing continue/practice shrinks
      // every tile, so titles fit earlier (e.g. league) must re-measure.
      DashboardLite._fitContainer(widgetEl);
    });
  };

  DashboardLite._paint = function (container) {
    if (!DashboardLite._isLoggedIn()) {
      container.innerHTML = DashboardLite._anonHtml();
      DashboardLite._startCarousel(container);
      return;
    }
    DashboardLite._hydrateLoggedIn(container);
  };

  // Gate: wait for the user session to be verified before deciding logged-in/anon.
  // Shared across all instances so the session is verified only once per page.
  DashboardLite._sessionReadyP = null;
  DashboardLite.whenSessionReady = function (cb) {
    if (!DashboardLite._sessionReadyP) {
      DashboardLite._sessionReadyP = new Promise(function (resolve) {
        var done = false;
        var run = function () { if (done) return; done = true; resolve(); };
        var attempts = 0;
        var wait = function () {
          if (typeof MyLearning !== 'undefined' && typeof MyLearning.loadUser === 'function') {
            MyLearning.loadUser('dlw', run);
          } else if (attempts++ < 30) {
            setTimeout(wait, 100);
          } else { run(); }
        };
        wait();
      });
    }
    DashboardLite._sessionReadyP.then(cb);
  };

  // render(containerId, format?) - format is a key of FORMATS, or omitted for the
  // default 300px stack layout.
  DashboardLite.render = function (containerId, format) {
    DashboardLite._injectCss();
    var container = document.getElementById(containerId);
    if (!container) return;

    var fmt = (format && DashboardLite.FORMATS[format]) || null;
    container.classList.add('dlw');
    if (fmt) {
      container.classList.add('dlw-' + fmt.mode + '-mode');
      container.style.width = fmt.w + 'px';
      container.style.height = fmt.h + 'px';
    } else {
      container.classList.add('dlw-stack-mode');
    }

    DashboardLite.whenSessionReady(function () { DashboardLite._paint(container); });
  };

  // Carousel showcase markup. Lock badge only for anon. Custom slides/count for the live
  // (logged-in) reel. ctaHtml pins a button to the bottom inside the carousel.
  DashboardLite._caroHtml = function (showLock, slidesHtml, count, ctaHtml) {
    if (slidesHtml == null) slidesHtml = DashboardLite._carouselSlides();
    if (count == null) count = DashboardLite._caroSlideCount;
    var dots = '';
    for (var k = 0; k < count; k++) {
      dots += '<button class="dlw-dot ga-fp ga-frontpage-carousel-dot' + (k === 0 ? ' active' : '') + '" aria-label="Slide ' + (k + 1) + '"></button>';
    }
    return '<div class="dlw-caro">' +
      (showLock ? '<div class="dlw-caro-lock" aria-hidden="true">' + DashboardLite._lockSvg + '</div>' : '') +
      '<div class="dlw-caro-track">' + slidesHtml + '</div>' +
      (ctaHtml || '') +
      '<div class="dlw-caro-dots">' + dots + '</div>' +
    '</div>';
  };

  // ── Hero (full-width default.asp banner) — clean, marketing-style for both states ──
  DashboardLite._paintHero = function (container) {
    var ret = window.location.href, retEnc = encodeURIComponent(ret);
    var signupHref = DashboardLite._profileBase + '/signup?redirect_url=' + retEnc;
    var signinHref = DashboardLite._profileBase + '/log-in?redirect_url=' + retEnc;
    var signupClick = "event.preventDefault();event.stopPropagation();" +
      "if(typeof TopNavBar!=='undefined'&&typeof TopNavBar.showSignupDropdown==='function'){TopNavBar.showSignupDropdown();}" +
      "else{window.open(this.href,'_blank');}";
    var signinClick = "event.preventDefault();event.stopPropagation();" +
      "if(typeof TopNavBar!=='undefined'&&typeof TopNavBar.showLoginDropdown==='function'){TopNavBar.showLoginDropdown();}" +
      "else{window.open(this.href,'_blank');}";

    if (DashboardLite._isLoggedIn()) {
      // Clean front-page look: personal welcome + integrated continue row + live showcase.
      // Frozen accounts (trial ended): learning stays free, but the live showcase becomes
      // the locked reel with a Reactivate CTA, and the copy reassures progress is saved.
      var frozen = DashboardLite._isFrozen();
      container.innerHTML =
        '<div class="dlh dlh-in' + (frozen ? ' dlh-frozen' : '') + '">' +
          '<div class="dlh-left">' +
            // Frozen accounts get the sad expression layered ON TOP of their real avatar.
            '<h1 class="dlh-title">Hi<span class="dlh-hname"></span>' +
              '<a class="dlh-hav-wrap ga-fp ga-frontpage-avatar" href="https://pathfinder.w3schools.com/profile" title="Your profile">' +
              '<img class="dlh-havatar" alt="" style="display:none">' +
              (frozen ? '<img class="dlh-face" alt="" title="Your account is paused" src="/lib/account/img/avatar_sad.svg" onerror="this.onerror=null;this.style.display=\'none\'">' : '') +
              '</a></h1>' +
            '<p class="dlh-free">' + (frozen
              ? 'Your trial has ended.<br><b>Reactivate to keep progress, XP and Spaces active.</b>'
              : 'Keep your streak alive and pick up right where you left off.') + '</p>' +
            (frozen ? '<p class="dlh-support">You can still read every tutorial for free. The moment you reactivate, your streaks, league spot and Spaces pick up right where they paused.</p>' : '') +
            '<div class="dlh-startrow dlh-continue-fallback" style="display:none">' +
              '<span class="dlh-or">Continue reading for free</span>' +
              '<a class="dlh-or-link ga-fp ga-frontpage-all-tutorials" href="/where_to_start.asp" ' +
                'onclick="if(typeof TopNavBar!==\'undefined\'&&typeof TopNavBar.openNavItem===\'function\'){event.preventDefault();TopNavBar.openNavItem(\'tutorials\');}">All Tutorials &rsaquo;</a>' +
            '</div>' +
            '<a class="dlh-cont2 ga-fp ga-frontpage-continue" href="#" style="display:none"></a>' +
            (frozen ? '' :
              '<div class="dlh-sub"><a class="dlh-dash ga-fp ga-frontpage-dashboard" href="https://pathfinder.w3schools.com">' +
                '<svg width="17" height="17" stroke="currentColor" fill="none" stroke-width="2" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round" focusable="false" aria-hidden="true" xmlns="http://www.w3.org/2000/svg"><rect width="7" height="18" x="3" y="3" rx="1"></rect><rect width="7" height="7" x="14" y="3" rx="1"></rect><rect width="7" height="7" x="14" y="14" rx="1"></rect></svg>' +
                'Go to your dashboard</a></div>') +
          '</div>' +
          '<div class="dlh-right" id="' + container.id + '-caro">' +
            (frozen ? DashboardLite._caroHtml(true, null, null,
              '<a class="dlw-caro-cta ga-fp ga-frontpage-reactivate" href="' + DashboardLite._plansUrl + '">Reactivate</a>') : '') +
          '</div>' +
        '</div>';
      if (frozen) DashboardLite._startCarousel(container);

      // Badges paint instantly from cached data (topnav lite state + the localStorage
      // continue cache) and re-render when the live fetches resolve - waiting for
      // every API to settle leaves the column empty for seconds.
      if (!frozen) {
        var caroEl0 = document.getElementById(container.id + '-caro');
        var lite0 = DashboardLite._readLiteState() || {};
        if (caroEl0) {
          // Seed assumes opted-in so members do not flash the "Join" cell; the
          // real opt-in state corrects it when loadAll resolves.
          caroEl0.innerHTML = DashboardLite._badgesHtml({
            streaks: { streaks: typeof lite0.lightning === 'number' ? lite0.lightning : 0 },
            league: { xp: typeof lite0.xp === 'number' ? lite0.xp : 0, optedIn: true }
          }, DashboardLite._readContCache());
        }
      }

      var contP = DashboardLite.fetchContinue();
      contP.then(function (c) {
        if (c) {
          var row = container.querySelector('.dlh-cont2');
          if (row) {
            var pct = typeof c.progress === 'number' ? c.progress : 0;
            row.setAttribute('href', c.url || '#');
            row.innerHTML =
              '<span class="dlh-cont2-tag">Pick up where you left off</span>' +
              '<span class="dlh-cont2-ico">' + DashboardLite._topicIconHtml(c.title) + '</span>' +
              '<span class="dlh-cont2-mid">' +
                '<span class="dlh-cont2-txt">' + DashboardLite._esc(c.title) + '</span>' +
                '<span class="dlw-progressbar" title="' + pct + '% complete">' +
                  '<span class="dlw-progressbar-fill" style="width:' + pct + '%"></span></span>' +
              '</span>' +
              '<span class="dlw-btn">Continue</span>';
            row.style.display = '';
          }
        } else {
          var fb = container.querySelector('.dlh-continue-fallback');
          if (fb) fb.style.display = '';
        }
      });
      // Personalize the headline + build the showcase once real data loads.
      DashboardLite.loadAll().then(function (data) {
        var nameEl = container.querySelector('.dlh-hname');
        if (nameEl && data.profile && data.profile.firstName) {
          nameEl.textContent = ', ' + data.profile.firstName;
        }
        var avEl = container.querySelector('.dlh-havatar');
        var avatarUrl = (data.avatarP && data.avatarP.avatar) || (data.profile && data.profile.avatar);
        if (avEl && avatarUrl) { avEl.src = avatarUrl; avEl.style.display = ''; }

        if (!frozen) {
          contP.then(function (c) {
            var caroEl = document.getElementById(container.id + '-caro');
            if (caroEl) caroEl.innerHTML = DashboardLite._badgesHtml(data, c);
          });
        }
      });
      return;
    }

    container.innerHTML =
      '<div class="dlh dlh-anon">' +
        '<div class="dlh-left">' +
          '<h1 class="dlh-title">Learn to Code</h1>' +
          '<p class="dlh-free">Free tutorials, examples and references.<br><b>No sign-up needed, just start learning.</b></p>' +
          '<p class="dlh-support">Or sign up to unlock premium features:</p>' +
          '<ul class="dlh-perks">' +
            '<li>Progress tracking</li><li>Build &amp; host websites</li>' +
            '<li>Ad-free learning</li><li>XP &amp; Streaks</li>' +
            '<li>Practice problems</li><li>Leagues</li>' +
            '<li>Challenges</li><li>Avatar</li>' +
          '</ul>' +
          '<div class="dlh-sub">Already a member? <a class="ga-fp ga-frontpage-signin-link" href="' + DashboardLite._esc(signinHref) + '" onclick="' + signinClick + '">Sign in</a></div>' +
        '</div>' +
        '<div class="dlh-right">' +
          DashboardLite._caroHtml(true, null, null,
            '<a class="dlw-caro-cta ga-fp ga-frontpage-signin" href="' + DashboardLite._esc(signinHref) + '" onclick="' + signinClick + '">Sign in</a>') +
        '</div>' +
      '</div>';
    DashboardLite._startCarousel(container);
  };

  // Logged-in showcase is the badge grid; anon/frozen get the aspiration carousel.
  DashboardLite.renderHero = function (containerId) {
    DashboardLite._injectCss();
    var container = document.getElementById(containerId);
    if (!container) return;
    container.classList.add('dlh-host'); // reserve height immediately to avoid layout jump
    DashboardLite.whenSessionReady(function () { DashboardLite._paintHero(container); });
  };

  window.DashboardLite = DashboardLite;
})();

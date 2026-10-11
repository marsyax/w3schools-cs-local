"use strict";

function _regenerator() { var e, t, r = "function" == typeof Symbol ? Symbol : {}, n = r.iterator || "@@iterator", o = r.toStringTag || "@@toStringTag"; function i(r, n, o, i) { var c = n && n.prototype instanceof Generator ? n : Generator, u = Object.create(c.prototype); return _regeneratorDefine2(u, "_invoke", function (r, n, o) { var i, c, u, f = 0, p = o || [], y = !1, G = { p: 0, n: 0, v: e, a: d, f: d.bind(e, 4), d: function d(t, r) { return i = t, c = 0, u = e, G.n = r, a; } }; function d(r, n) { for (c = r, u = n, t = 0; !y && f && !o && t < p.length; t++) { var o, i = p[t], d = G.p, l = i[2]; r > 3 ? (o = l === n) && (u = i[(c = i[4]) ? 5 : (c = 3, 3)], i[4] = i[5] = e) : i[0] <= d && ((o = r < 2 && d < i[1]) ? (c = 0, G.v = n, G.n = i[1]) : d < l && (o = r < 3 || i[0] > n || n > l) && (i[4] = r, i[5] = n, G.n = l, c = 0)); } if (o || r > 1) return a; throw y = !0, n; } return function (o, p, l) { if (f > 1) throw TypeError("Generator is already running"); for (y && 1 === p && d(p, l), c = p, u = l; (t = c < 2 ? e : u) || !y;) { i || (c ? c < 3 ? (c > 1 && (G.n = -1), d(c, u)) : G.n = u : G.v = u); try { if (f = 2, i) { if (c || (o = "next"), t = i[o]) { if (!(t = t.call(i, u))) throw TypeError("iterator result is not an object"); if (!t.done) return t; u = t.value, c < 2 && (c = 0); } else 1 === c && (t = i["return"]) && t.call(i), c < 2 && (u = TypeError("The iterator does not provide a '" + o + "' method"), c = 1); i = e; } else if ((t = (y = G.n < 0) ? u : r.call(n, G)) !== a) break; } catch (t) { i = e, c = 1, u = t; } finally { f = 1; } } return { value: t, done: y }; }; }(r, o, i), !0), u; } var a = {}; function Generator() {} function GeneratorFunction() {} function GeneratorFunctionPrototype() {} t = Object.getPrototypeOf; var c = [][n] ? t(t([][n]())) : (_regeneratorDefine2(t = {}, n, function () { return this; }), t), u = GeneratorFunctionPrototype.prototype = Generator.prototype = Object.create(c); function f(e) { return Object.setPrototypeOf ? Object.setPrototypeOf(e, GeneratorFunctionPrototype) : (e.__proto__ = GeneratorFunctionPrototype, _regeneratorDefine2(e, o, "GeneratorFunction")), e.prototype = Object.create(u), e; } return GeneratorFunction.prototype = GeneratorFunctionPrototype, _regeneratorDefine2(u, "constructor", GeneratorFunctionPrototype), _regeneratorDefine2(GeneratorFunctionPrototype, "constructor", GeneratorFunction), GeneratorFunction.displayName = "GeneratorFunction", _regeneratorDefine2(GeneratorFunctionPrototype, o, "GeneratorFunction"), _regeneratorDefine2(u), _regeneratorDefine2(u, o, "Generator"), _regeneratorDefine2(u, n, function () { return this; }), _regeneratorDefine2(u, "toString", function () { return "[object Generator]"; }), (_regenerator = function _regenerator() { return { w: i, m: f }; })(); }
function _regeneratorDefine2(e, r, n, t) { var i = Object.defineProperty; try { i({}, "", {}); } catch (e) { i = 0; } _regeneratorDefine2 = function _regeneratorDefine(e, r, n, t) { function o(r, n) { _regeneratorDefine2(e, r, function (e) { return this._invoke(r, n, e); }); } r ? i ? i(e, r, { value: n, enumerable: !t, configurable: !t, writable: !t }) : e[r] = n : (o("next", 0), o("throw", 1), o("return", 2)); }, _regeneratorDefine2(e, r, n, t); }
function asyncGeneratorStep(n, t, e, r, o, a, c) { try { var i = n[a](c), u = i.value; } catch (n) { return void e(n); } i.done ? t(u) : Promise.resolve(u).then(r, o); }
function _asyncToGenerator(n) { return function () { var t = this, e = arguments; return new Promise(function (r, o) { var a = n.apply(t, e); function _next(n) { asyncGeneratorStep(a, r, o, _next, _throw, "next", n); } function _throw(n) { asyncGeneratorStep(a, r, o, _next, _throw, "throw", n); } _next(void 0); }); }; }
(function () {
  function getBillingApiUrl() {
    return 'https://billing-stripe-api.w3sapi.com';
  }
  function fetchPlans() {
    return _fetchPlans.apply(this, arguments);
  }
  function _fetchPlans() {
    _fetchPlans = _asyncToGenerator(_regenerator().m(function _callee() {
      var baseUrl, url, res, data, _t;
      return _regenerator().w(function (_context) {
        while (1) switch (_context.p = _context.n) {
          case 0:
            baseUrl = getBillingApiUrl();
            url = baseUrl + '/api/v3/plans';
            _context.p = 1;
            _context.n = 2;
            return fetch(url);
          case 2:
            res = _context.v;
            if (res.ok) {
              _context.n = 3;
              break;
            }
            throw new Error('Failed to fetch plans');
          case 3:
            _context.n = 4;
            return res.json();
          case 4:
            data = _context.v;
            return _context.a(2, Array.isArray(data.plans) ? data.plans : []);
          case 5:
            _context.p = 5;
            _t = _context.v;
            console.error('Error fetching plans for classic plans page:', _t);
            return _context.a(2, []);
        }
      }, _callee, null, [[1, 5]]);
    }));
    return _fetchPlans.apply(this, arguments);
  }
  function toNumber(value) {
    if (value == null) return null;
    var n = parseFloat(String(value));
    return isNaN(n) ? null : n;
  }
  function filterPlansByFrequency(plans, frequency) {
    if (!Array.isArray(plans)) return [];
    return plans.filter(function (plan) {
      if (!plan || !plan.price) return false;
      if (plan.price.frequency !== frequency) return false;
      if (plan.price.is_active === false) return false;
      if (plan.price.is_visible === false) return false;
      var amount = toNumber(plan.price.amount);
      return amount !== null && amount > 0;
    });
  }
  function sortPlansByProductPosition(plans) {
    if (!Array.isArray(plans)) return [];
    return plans.slice().sort(function (a, b) {
      var posA = a && typeof a.productPosition === 'number' && a.productPosition || a && a.product && typeof a.product.position === 'number' && a.product.position || 0;
      var posB = b && typeof b.productPosition === 'number' && b.productPosition || b && b.product && typeof b.product.position === 'number' && b.product.position || 0;
      return posA - posB;
    });
  }
  function formatMoneyAmount(value) {
    var n = toNumber(value);
    return n === null ? '' : n.toFixed(2);
  }
  window.togglePricing = function () {
    var checkbox = document.getElementById('plans-toggle-pricing');
    if (!checkbox || !window.__classicPlansAll) return;
    var frequency = checkbox.checked ? 'yearly' : 'monthly';
    var plansForFrequency = sortPlansByProductPosition(filterPlansByFrequency(window.__classicPlansAll, frequency));
    renderPlanCards(plansForFrequency, frequency, window.__classicPlansAll);
  };
  function renderPlanCards(plans, frequency, allPlans) {
    var container = document.getElementById('plans-container');
    if (!container) return;
    if (!Array.isArray(plans) || !plans.length) {
      return;
    }
    function normalizeFeatureList(plan) {
      if (!plan || !Array.isArray(plan.uniqueSellingPropositions) || !plan.uniqueSellingPropositions.length) {
        return '';
      }
      return plan.uniqueSellingPropositions.map(function (item) {
        if (!item) return '';
        var text = String(item).replace(/\r/g, '');
        return '<li class="feature-item">' + text + '</li>';
      }).join('');
    }
    function getPlanName(plan) {
      return plan && plan.name || plan && plan.product && plan.product.name || '';
    }
    function getPlanDescription(plan) {
      return plan && plan.description || plan && plan.product && plan.product.description || '';
    }
    function getPlanPrice(plan) {
      if (plan && plan.price && typeof plan.price.amount !== 'undefined') {
        return String(plan.price.amount);
      }
      return '';
    }
    function getPlanSlug(plan) {
      return plan && plan.priceSlug || plan && plan.price && plan.price.slug || '';
    }
    function getPlanPairingKey(plan) {
      var pos = plan && typeof plan.productPosition === 'number' && plan.productPosition || plan && plan.product && typeof plan.product.position === 'number' && plan.product.position || null;
      if (pos !== null && pos !== undefined && !isNaN(pos)) {
        return 'p:' + pos;
      }
      var n = getPlanName(plan);
      return 'n:' + String(n).trim().toLowerCase();
    }
    function findSiblingPlanByFrequency(candidatePlans, plan, targetFrequency) {
      if (!Array.isArray(candidatePlans) || !plan || !plan.price) return null;
      var key = getPlanPairingKey(plan);
      for (var i = 0; i < candidatePlans.length; i++) {
        var p = candidatePlans[i];
        if (!p || !p.price) continue;
        if (p.price.frequency !== targetFrequency) continue;
        if (p.price.is_active === false) continue;
        if (p.price.is_visible === false) continue;
        if (getPlanPairingKey(p) !== key) continue;
        var amt = toNumber(p.price.amount);
        if (amt === null || amt <= 0) continue;
        return p;
      }
      return null;
    }
    function effectiveMonthlyDisplayAmount(plan) {
      if (!plan || !plan.price) return '';
      var raw = toNumber(plan.price.amount);
      if (raw === null) return '';
      if (plan.price.frequency === 'yearly') {
        return formatMoneyAmount(raw / 12);
      }
      return formatMoneyAmount(raw);
    }
    var catalog = Array.isArray(allPlans) ? allPlans : [];
    var cardsHtml = plans.map(function (plan, index) {
      var name = getPlanName(plan);
      var description = getPlanDescription(plan);
      var amount = getPlanPrice(plan);
      var featuresHtml = normalizeFeatureList(plan);
      var slug = getPlanSlug(plan);
      var isPopular = plan.isMostPopular || plan.product && plan.product.is_most_popular;
      var cardClasses = 'w3-col l6 w3-round-xxlarge ws-white plan-card' + (isPopular ? ' is-popular' : '');
      var priceHtml = '';
      if (amount) {
        var displayAmount = amount;
        if (frequency === 'yearly') {
          var yearlyTotal = toNumber(amount);
          if (yearlyTotal !== null) {
            displayAmount = formatMoneyAmount(yearlyTotal / 12);
          }
        } else {
          displayAmount = formatMoneyAmount(amount);
        }
        var billingNoteHtml = '';
        if (frequency === 'monthly') {
          var yearlySibling = findSiblingPlanByFrequency(catalog, plan, 'yearly');
          if (yearlySibling) {
            var ifYearly = effectiveMonthlyDisplayAmount(yearlySibling);
            if (ifYearly) {
              billingNoteHtml = '    <p class="card-billed-annually">Billed monthly ($' + ifYearly + ' if billed yearly)</p>';
            }
          }
        } else {
          var monthlySibling = findSiblingPlanByFrequency(catalog, plan, 'monthly');
          if (monthlySibling) {
            var ifMonthly = formatMoneyAmount(monthlySibling.price.amount);
            if (ifMonthly) {
              billingNoteHtml = '    <p class="card-billed-annually">Billed annually ($' + ifMonthly + ' if billed monthly)</p>';
            }
          } else {
            billingNoteHtml = '    <p class="card-billed-annually">Billed annually</p>';
          }
        }
        priceHtml = '    <p class="card-price"' + (isPopular && frequency === 'monthly' ? ' id="' + name + '_pricing"' : '') + '>' + '      $' + displayAmount + '      <span class="card-period">/Month</span>' + '    </p>' + billingNoteHtml;
      }
      var btnIdAttr = isPopular && frequency === 'monthly' ? '      id="' + name + '_pricing_btn"' : '';
      var btnDataSlug = slug ? '      data-plan-slug="' + slug + '"' : '';
      var btnDataAmount = amount ? '      data-plan-amount="' + amount + '"' : '';
      var btnLabel = "Get ".concat(name);
      var btnHref = 'https://order.w3schools.com/plans';
      if (plan.isFreeTrialTarget === true) {
        btnLabel = 'Start Free Trial';
        btnHref = 'https://profile.w3schools.com/signup?redirect_url=https%3A%2F%2Forder.w3schools.com%2Fplans%3Fsubscription%3Dmonthly';
      }
      return '<div class="' + cardClasses + '">' + '  <div class="card-header">' + '    <h5 class="card-title">' + name + '</h5>' + priceHtml + '    <hr />' + '  </div>' + '  <div class="w3-left-align">' + '    <p>' + description + '</p>' + '    <ul class="features-list">' + featuresHtml + '    </ul>' + '  </div>' + '  <div class="w3-center -plan-subscribe-btn-wrapper">' + '    <a' + '      class="-plan-subscribe-btn -v2"' + '      target="_blank"' + '      href="' + btnHref + '"' + btnIdAttr + btnDataSlug + btnDataAmount + '    >' + '      ' + btnLabel + '' + '    </a>' + '  </div>' + '</div>';
    }).join('');
    container.innerHTML = cardsHtml + '<div class="w3-col l6 w3-round-xxlarge ws-white plan-card">' + '  <div class="card-header">' + '    <h5 class="card-title">Full Access</h5>' + '    <p class="card-price">$499<span class="card-period"> / one time</span></p>' + '    <hr />' + '  </div>' + '  <div class="w3-left-align">' + '    <p>Get everything W3Schools has to offer with a single one-time payment.</p>' + '    <ul class="features-list">' + '      <li class="feature-item">All Plus features</li>' + '      <li class="feature-item">Unlimited courses</li>' + '      <li class="feature-item">All Certification exams</li>' + '      <li class="feature-item">All Career Paths</li>' + '      <li class="feature-item">Get exclusive Full Access skin</li>' + '      <li class="feature-item">Lifetime access: stays active for the lifetime of the platform</li>' + '    </ul>' + '  </div>' + '  <div class="w3-center -plan-subscribe-btn-wrapper">' + '    <a' + '      class="-plan-subscribe-btn -v2"' + '      target="_blank"' + '      href="https://campus.w3schools.com/cart/40321653669945:1?checkout"' + '    >' + '      Get Full Access' + '    </a>' + '  </div>' + '</div>';
  }
  document.addEventListener('DOMContentLoaded', function () {
    fetchPlans().then(function (plans) {
      if (!plans || !plans.length) {
        return;
      }
      window.__classicPlansAll = plans;
      var initialFrequency = 'yearly';
      var plansForFrequency = sortPlansByProductPosition(filterPlansByFrequency(plans, initialFrequency));
      renderPlanCards(plansForFrequency, initialFrequency, plans);
    });
  });
})();

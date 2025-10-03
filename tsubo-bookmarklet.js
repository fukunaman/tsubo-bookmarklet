(() => {
  const STYLE_ID = 'tsubo-shared-style';
  if (!document.getElementById(STYLE_ID)) {
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = '.tb{display:block;margin-top:4px;padding:2px 6px;border-radius:4px;font-weight:600;font-size:.82em;line-height:1.4;background:rgba(255,165,0,.16);color:#b45309}.tb-s{background:rgba(59,130,246,.18);color:#1d4ed8}';
    document.head.appendChild(style);
  }

  const TUBO = 3.305785;
  const norm = text => (text ? text.replace(/\s+/g, ' ').trim() : '');
  const parsePrice = text => {
    if (!text) return null;
    const cleaned = text.replace(/\s+/g, '');
    let total = 0;
    const oku = cleaned.match(/([\d.,]+)億/);
    if (oku) total += parseFloat(oku[1].replace(/,/g, '')) * 1e8;
    const man = cleaned.match(/([\d.,]+)万/);
    if (man) total += parseFloat(man[1].replace(/,/g, '')) * 1e4;
    if (!oku && !man) {
      const yen = cleaned.replace(/[^\d]/g, '');
      if (yen) total += parseInt(yen, 10);
    }
    return total || null;
  };
  const parseArea = text => {
    if (!text) return null;
    const normalized = text.replace(/㎡/g, 'm2').replace(/m²/g, 'm2');
    let sqm = null;
    const sqmMatch = normalized.match(/([\d.,]+)m2/i);
    if (sqmMatch) sqm = parseFloat(sqmMatch[1].replace(/,/g, ''));
    let tsubo = null;
    const tsuboMatch = normalized.match(/([\d.,]+)\s*坪/);
    if (tsuboMatch) tsubo = parseFloat(tsuboMatch[1].replace(/,/g, ''));
    if (!tsubo && sqm) tsubo = sqm / TUBO;
    if (tsubo && !sqm) sqm = tsubo * TUBO;
    return tsubo ? { sqm, tsubo } : null;
  };

  const matchLabel = (nodes, label, nextSelector) => {
    for (const node of nodes) {
      if (!norm(node.textContent).includes(label)) continue;
      let value = nextSelector(node);
      if (!value) continue;
      return { element: value, text: norm(value.textContent) };
    }
    return null;
  };

  const findValue = (root, labels) => {
    const candidates = Array.isArray(labels) ? labels : [labels];
    for (const label of candidates) {
      const result = matchLabel(root.querySelectorAll('td.category'), label, node => {
        let val = node.nextElementSibling;
        while (val && val.tagName === 'TD' && !val.classList.contains('value')) val = val.nextElementSibling;
        return val;
      });
      if (result) return result;
    }
    for (const label of candidates) {
      const result = matchLabel(root.querySelectorAll('dt'), label, node => {
        let dd = node.nextElementSibling;
        while (dd && dd.tagName !== 'DD') dd = dd.nextElementSibling;
        return dd;
      });
      if (result) return result;
    }
    for (const label of candidates) {
      const result = matchLabel(root.querySelectorAll('th'), label, node => {
        let td = node.nextElementSibling;
        while (td && td.tagName !== 'TD') td = td.nextElementSibling;
        return td;
      });
      if (result) return result;
    }
    for (const label of candidates) {
      for (const el of root.querySelectorAll('span,strong,div,p,dd,td,li')) {
        const text = norm(el.textContent);
        if (text && text.includes(label)) return { element: el, text };
      }
    }
    return null;
  };

  const appendBadge = (target, per, className, containerSelector) => {
    if (!target) return;
    let node = target;
    if (containerSelector && target.closest) {
      const container = target.closest(containerSelector);
      if (container) node = container;
    }
    if (node.querySelector && node.querySelector(':scope > .tb')) return;
    if (node.style) {
      node.style.whiteSpace = 'normal';
      const display = getComputedStyle(node).display;
      if (display === 'inline') node.style.display = 'inline-block';
    }
    const badge = document.createElement('div');
    badge.className = className;
    badge.textContent = (per >= 100 ? per.toFixed(0) : per.toFixed(1)) + '万円/坪';
    node.appendChild(badge);
  };

  const appendListBadges = ({ items, priceLabels, areaLabels, className, containerSelector }) => {
    if (!items.length) return false;
    let any = false;
    items.forEach(item => {
      if (item.querySelector('.tb')) return;
      let priceInfo = findValue(item, priceLabels);
      let areaInfo = findValue(item, areaLabels);
      const priceFallback = item.querySelector('.bukken-cassette__kakaku');
      const areaFallback = item.querySelector('.bukken-cassette__menseki');
      if (!priceInfo && priceFallback) priceInfo = { element: priceFallback, text: norm(priceFallback.textContent) };
      if (!areaInfo && areaFallback) areaInfo = { element: areaFallback, text: norm(areaFallback.textContent) };
      const price = parsePrice(priceInfo && priceInfo.text);
      const area = parseArea(areaInfo && areaInfo.text);
      if (!price || !area) return;
      const per = price / area.tsubo / 10000;
      const target = (priceInfo && priceInfo.element) || (areaInfo && areaInfo.element) || item;
      appendBadge(target, per, className, containerSelector);
      any = true;
    });
    return any;
  };

  const appendDetailBadges = ({ priceNodes, areaRoot, area, className }) => {
    if (!priceNodes.length) return false;
    let parsedArea = area;
    if (!parsedArea) {
      const info = findValue(areaRoot, ['専有面積', '面積']);
      parsedArea = parseArea(info && info.text);
    }
    if (!parsedArea) return false;
    let any = false;
    priceNodes.forEach(priceNode => {
      if (priceNode.querySelector('.tb')) return;
      const price = parsePrice(norm(priceNode.textContent));
      if (!price) return;
      const per = price / parsedArea.tsubo / 10000;
      if (priceNode.style) {
        priceNode.style.whiteSpace = 'normal';
        if (getComputedStyle(priceNode).display === 'inline') priceNode.style.display = 'inline-block';
      }
      appendBadge(priceNode, per, className, null);
      any = true;
    });
    return any;
  };

  appendListBadges({
    items: [...document.querySelectorAll('li.item.list-tpl, li.item.smartphone-tpl')],
    priceLabels: ['価格'],
    areaLabels: ['専有面積', '面積'],
    className: 'tb',
    containerSelector: 'td.value,dd'
  });

  appendListBadges({
    items: [...document.querySelectorAll('#js-bukkenList .property_unit, .bukken-cassette__body')],
    priceLabels: ['販売価格', '価格'],
    areaLabels: ['専有面積', '面積'],
    className: 'tb tb-s',
    containerSelector: 'dd,td.value,.dottable-value,.property_unit-info,.bukken-cassette__kakaku,.bukken-cassette__menseki'
  });

  appendDetailBadges({
    priceNodes: [...document.querySelectorAll('span.price-area')],
    areaRoot: document,
    className: 'tb'
  });

  const detailAreaCandidates = [
    document.querySelector('.futureInfo'),
    document.querySelector('.detail-sum-table'),
    document.querySelector('.bukken-detail__table'),
    document
  ];
  let detailAreaRoot = null;
  for (const root of detailAreaCandidates) {
    if (!root) continue;
    const info = findValue(root, ['専有面積', '面積']);
    if (info && parseArea(info.text)) {
      detailAreaRoot = root;
      break;
    }
  }

  let detailArea = null;
  const futureInfoAreaNode = document.querySelector('.futureInfo_menseki_disp');
  detailArea = parseArea(futureInfoAreaNode && futureInfoAreaNode.textContent);
  if (!detailArea && detailAreaRoot) {
    const info = findValue(detailAreaRoot, ['専有面積']);
    detailArea = parseArea(info && info.text);
  }
  if (!detailArea) {
    const info = findValue(document, ['専有面積']);
    detailArea = parseArea(info && info.text);
  }

  if (detailArea) {
    const priceNodes = [...new Set([
      ...document.querySelectorAll('p.mt7.b'),
      ...document.querySelectorAll('.bukken-detail__price'),
      ...document.querySelectorAll('.bukken-detail__price-value'),
      ...document.querySelectorAll('.futureInfo_list.futureInfo_kakaku')
    ])];
    appendDetailBadges({
      priceNodes,
      areaRoot: detailAreaRoot || document,
      area: detailArea,
      className: 'tb tb-s'
    });
  }
})();

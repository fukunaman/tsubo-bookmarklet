(() => {
  const STYLE_ID = 'tsubo-shared-style';
  if (!document.getElementById(STYLE_ID)) {
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = '.tb{display:block;margin-top:4px;padding:2px 6px;border-radius:4px;font-weight:600;font-size:.82em;line-height:1.4;background:rgba(255,165,0,.16);color:#b45309}.tb-s{background:rgba(59,130,246,.18);color:#1d4ed8}.tb-a{background:rgba(244,114,182,.2);color:#be185d}.tb-rehouse{font-size:1.1em;padding:4px 8px;font-weight:700;background:rgba(34,197,94,.2);color:#166534}';
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
    // Debug log for SUUMO library
    if (location.pathname.includes('/library/') && text.includes('万')) {
      console.log('[tsubo-debug] Price parsing:', text, '->', total);
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
    if (!root) return null;
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

  const isAthome = /(?:^|\.)athome\.co\.jp$/.test(location.hostname);
  const athomeDetailHost = isAthome ? document.querySelector('athome-csite-pc-property-detail-ryutsu-sell-living, athome-csite-sp-property-detail-ryutsu-sell-living') : null;
  const athomeListHost = isAthome ? document.querySelector('athome-csite-pc-property-list-sell-living, athome-csite-sp-property-list-sell-living') : null;
  const isAthomeList = !!athomeListHost && !athomeDetailHost;
  const isSekisui = location.hostname === 'sumusite.sekisuihouse.co.jp';
  const isSekisuiDetail = isSekisui && !!document.querySelector('.estateInfo_detail');
  const isRehouse = /(?:^|\.)rehouse\.co\.jp$/.test(location.hostname);
  const isRehouseDetail = isRehouse && /\/buy\/mansion\/bkdetail\//.test(location.pathname);
  const isSuumo = /(?:^|\.)suumo\.jp$/.test(location.hostname);
  const isSuumoLibrary = isSuumo && /\/library\//.test(location.pathname);

  const appendListBadges = ({ items, priceLabels, areaLabels, className, containerSelector, fallbackMap }) => {
    if (isAthomeList && className === 'tb') return false;
    if (!items.length) return false;
    let any = false;
    items.forEach(item => {
      if (item.dataset.tbBadgeInjected === '1') return;
      if (item.querySelector('.tb')) return;
      const host = item.querySelector('.tb-host') || item;
      let priceInfo = findValue(item, priceLabels);
      let areaInfo = findValue(item, areaLabels);
      const priceFallback = item.querySelector('.bukken-cassette__kakaku');
      const areaFallback = item.querySelector('.bukken-cassette__menseki');
      if (!priceInfo && priceFallback) priceInfo = { element: priceFallback, text: norm(priceFallback.textContent) };
      if (!areaInfo && areaFallback) areaInfo = { element: areaFallback, text: norm(areaFallback.textContent) };
      const price = parsePrice(priceInfo && priceInfo.text);
      const area = parseArea(areaInfo && areaInfo.text);
      let resolvedPrice = price;
      let resolvedArea = area;
      if ((!resolvedPrice || !resolvedArea) && fallbackMap) {
        const key = item.querySelector('input[id]')?.id || item.querySelector('[data-bukken-no]')?.getAttribute('data-bukken-no');
        if (key && fallbackMap.has(key)) {
          const extra = fallbackMap.get(key);
          if (!resolvedPrice && extra.price) resolvedPrice = extra.price;
          if (!resolvedArea && extra.area) resolvedArea = extra.area;
        }
      }
      if (!resolvedPrice || !resolvedArea) return;
      const per = resolvedPrice / resolvedArea.tsubo / 10000;
      const target = (priceInfo && priceInfo.element) || (areaInfo && areaInfo.element) || host;
      const badgeHost = target.closest('.property-price, .property-info__price, [class*="price"], .tb-host') || target;
      if (badgeHost && badgeHost.querySelector('.tb')) return;
      appendBadge(target, per, className, containerSelector);
      item.dataset.tbBadgeInjected = '1';
      any = true;
    });
    return any;
  };

  const collectNodes = selectors => {
    const nodes = [];
    selectors.forEach(sel => {
      if (!sel) return;
      document.querySelectorAll(sel).forEach(node => nodes.push(node));
    });
    return [...new Set(nodes)];
  };

  const appendDetailBadges = ({ priceNodes, areaRoot, area, className, fallbackPrice }) => {
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
      const resolvedPrice = price || fallbackPrice;
      if (!resolvedPrice) return;
      const per = resolvedPrice / parsedArea.tsubo / 10000;
      if (priceNode.style) {
        priceNode.style.whiteSpace = 'normal';
        if (getComputedStyle(priceNode).display === 'inline') priceNode.style.display = 'inline-block';
      }
      appendBadge(priceNode, per, className, null);
      any = true;
    });
    return any;
  };

  const athomeListFallback = new Map();
  let athomeDetailArea = null;
  let athomeDetailPrice = null;
  const stateScript = document.querySelector('#serverApp-state');
  if (stateScript) {
    try {
      const state = JSON.parse(stateScript.textContent || '{}');
      const listKey = Object.keys(state).find(k => k.includes('/bukken/list/'));
      if (listKey && state[listKey] && state[listKey].body) {
        const listData = JSON.parse(state[listKey].body).data?.bukkenData?.bukkenList;
        if (Array.isArray(listData)) {
          listData.forEach(item => {
            const id = item?.bukkenNo;
            if (!id) return;
            const price = parsePrice(item?.kakaku ? item.kakaku + '万円' : null);
            let area = null;
            if (item?.areaInfo) {
              area = parseArea(item.areaInfo.tsubo || item.areaInfo.area);
            }
            athomeListFallback.set(id, { price, area });
          });
        }
      }
      const detailKey = Object.keys(state).find(k => k.includes('property-detail-ryutsu'));
      if (detailKey && state[detailKey] && state[detailKey].body) {
        const data = JSON.parse(state[detailKey].body).data;
        const areaInfo = data?.propertyData?.areaInfo;
        const contractPrice = data?.propertyData?.contract?.price?.price;
        if (areaInfo) {
          if (areaInfo.tsubo) {
            const tsubo = parseFloat(areaInfo.tsubo.replace(/[^\d.]/g, ''));
            if (!Number.isNaN(tsubo)) athomeDetailArea = { tsubo, sqm: areaInfo.area ? parseFloat(areaInfo.area.replace(/[^\d.]/g, '')) || tsubo * TUBO : tsubo * TUBO };
          } else if (areaInfo.area) {
            const sqm = parseFloat(areaInfo.area.replace(/[^\d.]/g, ''));
            if (!Number.isNaN(sqm)) athomeDetailArea = { sqm, tsubo: sqm / TUBO };
          }
        }
        if (contractPrice) {
          const numericPrice = Number(contractPrice);
          if (!Number.isNaN(numericPrice)) athomeDetailPrice = numericPrice;
        }
      }
    } catch (err) {
      console.warn('athome state parse failed', err);
    }
  }

  appendListBadges({
    items: [...document.querySelectorAll('li.item.list-tpl, li.item.smartphone-tpl, [component-bukken-list-item], athome-csite-sp-part-bukken-card-ryutsu-sell-living')],
    priceLabels: ['価格'],
    areaLabels: ['専有面積', '面積'],
    className: 'tb',
    containerSelector: 'td.value,dd',
    fallbackMap: athomeListFallback
  });

  appendListBadges({
    items: [...document.querySelectorAll('#js-bukkenList .property_unit, .bukken-cassette__body')],
    priceLabels: ['販売価格', '価格'],
    areaLabels: ['専有面積', '面積'],
    className: 'tb tb-s',
    containerSelector: 'dd,td.value,.dottable-value,.property_unit-info,.bukken-cassette__kakaku,.bukken-cassette__menseki',
    fallbackMap: athomeListFallback
  });

  const athomeCards = [...document.querySelectorAll('.card-box')];
  if (athomeCards.length) {
    athomeCards.forEach(card => {
      if (card.dataset.tbBadgeInjected === '1') return;
      if (card.querySelector('.tb')) return;
      const priceEl = card.querySelector('.property-price');
      const areaBlock = [...card.querySelectorAll('.property-detail-table__block')].find(block => {
        const label = block.querySelector('strong');
        return label && norm(label.textContent).includes('専有面積');
      });
      const areaText = areaBlock && areaBlock.textContent;
      let price = parsePrice(priceEl && priceEl.textContent);
      let area = parseArea(areaText);
      if ((!price || !area) && athomeListFallback.size) {
        const cardId = card.querySelector('input[id]')?.id || card.querySelector('[data-bukken-no]')?.getAttribute('data-bukken-no');
        if (cardId && athomeListFallback.has(cardId)) {
          const extra = athomeListFallback.get(cardId);
          if (!price && extra.price) price = extra.price;
          if (!area && extra.area) area = extra.area;
        }
      }
      if (!price || !area || !priceEl) return;
      appendBadge(priceEl, price / area.tsubo / 10000, 'tb tb-a', null);
      card.dataset.tbBadgeInjected = '1';
    });
  }

  if (isSekisui) {
    const sekisuiListItems = [...document.querySelectorAll('.estateBlock_list > li')];
    sekisuiListItems.forEach(item => {
      if (item.dataset.tbBadgeInjected === '1') return;
      if (!item.querySelector('.estate')) return;
      if (item.querySelector('.tb')) {
        item.dataset.tbBadgeInjected = '1';
        return;
      }
      const priceContainer = item.querySelector('.estate dl dd');
      const price = parsePrice(priceContainer && priceContainer.textContent);
      const areaCandidate = [...item.querySelectorAll('.estate ul li')].find(li => /[㎡m²坪]/.test(li.textContent || ''));
      const area = parseArea(areaCandidate && areaCandidate.textContent);
      if (!price || !area) return;
      const target = priceContainer || areaCandidate || item;
      appendBadge(target, price / area.tsubo / 10000, 'tb tb-s', null);
      item.dataset.tbBadgeInjected = '1';
    });
  }

  if (isSuumoLibrary) {
    console.log('[tsubo-debug] Processing SUUMO library page');
    
    // More comprehensive row selection
    const allRows = [...document.querySelectorAll('table tr, .property-row, .listing-row')];
    console.log('[tsubo-debug] Found rows:', allRows.length);
    
    allRows.forEach((row, index) => {
      if (row.dataset.tbBadgeInjected === '1') return;
      if (row.querySelector('.tb')) return;
      
      const cells = [...row.querySelectorAll('td, .cell, .data-cell')];
      if (cells.length < 2) return;
      
      let priceCell = null;
      let areaCell = null;
      let priceText = '';
      let areaText = '';
      
      // Search for price and area in all cells
      for (const cell of cells) {
        const text = norm(cell.textContent);
        
        // More flexible price matching
        if (!priceCell && (/[0-9,]+万円/.test(text) || /[0-9,]+億/.test(text))) {
          // Skip rent prices for used property calculation
          if (!text.includes('賃料') && !text.includes('月') && !text.includes('円/月')) {
            priceCell = cell;
            priceText = text;
          }
        }
        
        // More flexible area matching
        if (!areaCell && (/[0-9.]+㎡|[0-9.]+平米|[0-9.]+m[2²]/.test(text))) {
          areaCell = cell;
          areaText = text;
        }
      }
      
      console.log(`[tsubo-debug] Row ${index}: price="${priceText}", area="${areaText}"`);
      
      if (priceCell && areaCell) {
        const price = parsePrice(priceText);
        const area = parseArea(areaText);
        
        console.log(`[tsubo-debug] Row ${index} parsed: price=${price}, area=${area?.tsubo}`);
        
        if (price && area && area.tsubo > 0) {
          const per = price / area.tsubo / 10000;
          console.log(`[tsubo-debug] Row ${index} tsubo price: ${per.toFixed(1)}万円/坪`);
          appendBadge(priceCell, per, 'tb', null);
          row.dataset.tbBadgeInjected = '1';
        }
      }
    });
  }

  if (isRehouse) {
    const allElements = [...document.querySelectorAll('*')];
    let priceText = null;
    let areaText = null;
    
    for (const el of allElements) {
      const text = norm(el.textContent);
      if (!priceText && /[0-9]+(,?[0-9]+)*万円/.test(text) && text.length < 50) {
        priceText = { element: el, text };
      }
      if (!areaText && /[0-9.]+㎡.*坪/.test(text) && text.length < 50) {
        areaText = { element: el, text };
      }
      if (priceText && areaText) break;
    }
    
    if (priceText && areaText) {
      const price = parsePrice(priceText.text);
      const area = parseArea(areaText.text);
      
      if (price && area) {
        const per = price / area.tsubo / 10000;
        const target = priceText.element;
        if (!target.querySelector('.tb')) {
          appendBadge(target, per, 'tb tb-rehouse', null);
        }
      }
    }
  }

  const isDetailPage = isAthome ? !!athomeDetailHost : (isSekisui ? isSekisuiDetail : (isRehouse ? isRehouseDetail : true));

  if (isDetailPage) {
    const basePriceSelectors = ['span.price-area'];
    if (isAthome) basePriceSelectors.push('p.price-main');
    if (isSekisui) basePriceSelectors.push('.estateInfo_detail .priceArea');
    if (isRehouse) basePriceSelectors.push('.text-price-regular', '.property-overview__price', '.price-main', '.price-section .price-value');
    appendDetailBadges({
      priceNodes: collectNodes(basePriceSelectors),
      areaRoot: document,
      className: isRehouse ? 'tb tb-rehouse' : 'tb'
    });

    const detailPriceNode = isAthome ? document.querySelector('.property-summary__list .rent') : null;
    if (!athomeDetailPrice && detailPriceNode) {
      const parsed = parsePrice(norm(detailPriceNode.textContent));
      if (parsed) athomeDetailPrice = parsed;
    }

    const detailAreaCandidates = [
      document.querySelector('.futureInfo'),
      document.querySelector('.detail-sum-table'),
      document.querySelector('.property-summary__list'),
      document.querySelector('.bukken-detail__table'),
      document.querySelector('[component-page__basic-info-table]'),
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
      const info = findValue(detailAreaRoot, ['専有面積', '面積']);
      detailArea = parseArea(info && info.text);
    }
    if (!detailArea) {
      const info = findValue(document, ['専有面積']);
      detailArea = parseArea(info && info.text);
    }

    if (athomeDetailArea) {
      detailArea = athomeDetailArea;
    }

    if (detailArea) {
      const priceSelectors = [
        'p.mt7.b',
        '.bukken-detail__price',
        '.bukken-detail__price-value',
        '.futureInfo_list.futureInfo_kakaku',
        '.futureInfo .card-price',
        '[component-property-info-header] .card-price'
      ];
      if (isAthome) priceSelectors.push('.property-summary__list .rent', 'p.price-main');
      if (isSekisui) priceSelectors.push('.estateInfo_detail .priceArea');
      if (isRehouse) priceSelectors.push('.text-price-regular', '.property-overview__price', '.price-main', '.price-section .price-value');
      const priceNodes = collectNodes(priceSelectors);

      appendDetailBadges({
        priceNodes,
        areaRoot: detailAreaRoot || document,
        area: detailArea,
        className: isRehouse ? 'tb tb-rehouse' : 'tb tb-s',
        fallbackPrice: athomeDetailPrice
      });

      if (isAthome && athomeDetailPrice && detailArea.tsubo) {
        const per = athomeDetailPrice / detailArea.tsubo / 10000;
        const extraSelectors = [
          '.property-detail-top-area .card-price',
          '.property-info__price',
          '.property-detail-top-area [class*="price"]',
          '.main-contents__box .card-price'
        ];
        extraSelectors.unshift('p.price-main');
        const extraTargets = collectNodes(extraSelectors);
        let appended = false;
        for (const target of extraTargets) {
          if (!target) continue;
          if (target.querySelector('.tb')) {
            appended = true;
            break;
          }
          appendBadge(target, per, 'tb tb-a', null);
          if (target.querySelector('.tb')) {
            appended = true;
            break;
          }
        }
        if (!appended) {
          const fallbackHost = document.querySelector('.property-detail-top-area') || document.body;
          const container = document.createElement('div');
          container.style.marginTop = '8px';
          fallbackHost.insertBefore(container, fallbackHost.firstChild);
          appendBadge(container, per, 'tb tb-a', null);
        }
      }
    }
  }
})();

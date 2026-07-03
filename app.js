(() => {
  'use strict';

  // ---------- DOM refs ----------
  const form = document.getElementById('receiptForm');
  const steps = Array.from(document.querySelectorAll('.step'));
  const progressBar = document.getElementById('progressBar');
  const nextBtn = document.getElementById('nextBtn');
  const backBtn = document.getElementById('backBtn');
  const downloadBtn = document.getElementById('downloadBtn');
  const previewStage = document.getElementById('previewStage');
  const receiptScaler = document.getElementById('receiptScaler');
  const receiptEl = document.getElementById('receipt');

  const inputs = {
    date: document.getElementById('inputDate'),
    product: document.getElementById('inputProduct'),
    customer: document.getElementById('inputCustomer'),
    customerAr: document.getElementById('inputCustomerAr'),
    price: document.getElementById('inputPrice'),
    qty: document.getElementById('inputQty'),
    currency: document.getElementById('inputCurrency'),
  };

  const outputs = {
    receiptNo: document.getElementById('outReceiptNo'),
    date: document.getElementById('outDate'),
    customer: document.getElementById('outCustomer'),
    product: document.getElementById('outProduct'),
    qty: document.getElementById('outQty'),
    price: document.getElementById('outPrice'),
    total: document.getElementById('outTotal'),
    receiptNoAr: document.getElementById('outReceiptNoAr'),
    dateAr: document.getElementById('outDateAr'),
    customerAr: document.getElementById('outCustomerAr'),
    productAr: document.getElementById('outProductAr'),
    qtyAr: document.getElementById('outQtyAr'),
    priceAr: document.getElementById('outPriceAr'),
    totalAr: document.getElementById('outTotalAr'),
  };

  const review = {
    receiptNo: document.getElementById('reviewReceiptNo'),
    date: document.getElementById('reviewDate'),
    product: document.getElementById('reviewProduct'),
    customer: document.getElementById('reviewCustomer'),
    price: document.getElementById('reviewPrice'),
    qty: document.getElementById('reviewQty'),
    total: document.getElementById('reviewTotal'),
  };

  let currentStep = 1;
  const totalSteps = steps.length;

  // ---------- Common name dictionary (fallback transliteration is rough) ----------
  const commonNames = {
    adam: 'آدم', ahmed: 'أحمد', alexander: 'ألكسندر', amir: 'أمير',
    andrew: 'أندرو', anthony: 'أنطوني', ava: 'آفا', benjamin: 'بنجامين',
    charles: 'تشارلز', chloe: 'كلوي', daniel: 'دانيال', david: 'داود',
    emily: 'إميلي', emma: 'إيما', ethan: 'إيثان', grace: 'غريس',
    hana: 'هنا', hassan: 'حسن', henry: 'هنري', ibrahim: 'إبراهيم',
    isabella: 'إيزابيلا', jack: 'جاك', james: 'جيمس', jane: 'جين',
    joseph: 'جوزيف', john: 'جون', joshua: 'جوشوا', karim: 'كريم',
    khaled: 'خالد', leo: 'ليو', liam: 'ليام', lily: 'ليلي', lina: 'لينا',
    lucas: 'لوكاس', mason: 'ماسون', mary: 'ماري', matthew: 'ماثيو',
    mia: 'ميا', michael: 'مايكل', mohamed: 'محمد', muhammad: 'محمد',
    nora: 'نورا', noah: 'نوح', oliver: 'أوليفر', olivia: 'أوليفيا',
    omar: 'عمر', rana: 'رنا', reem: 'ريم', richard: 'ريتشارد',
    robert: 'روبرت', ryan: 'ريان', samuel: 'صمويل', sara: 'سارة',
    sarah: 'سارة', sebastian: 'سيباستيان', sophia: 'صوفيا', thomas: 'توماس',
    william: 'ويليام', yusuf: 'يوسف'
  };

  function toArabicName(name) {
    if (!name) return '';
    // Already Arabic — keep as-is
    if (/[\u0600-\u06FF]/.test(name)) return name;

    const key = name.toLowerCase().trim();
    if (commonNames[key]) return commonNames[key];

    let s = key;
    const patterns = [
      ['ph', 'ف'], ['th', 'ث'], ['sh', 'ش'], ['ch', 'تش'], ['gh', 'غ'],
      ['kh', 'خ'], ['qu', 'كو'], ['oo', 'و'], ['ou', 'و'], ['ee', 'ي'],
      ['ea', 'يا'], ['ai', 'اي'], ['ay', 'اي'], ['ie', 'ي'], ['oa', 'وا'],
      ['au', 'أو'], ['ei', 'اي'], ['ue', 'و'], ['ya', 'يا'], ['yo', 'يو'],
      ['yu', 'يو'], ['el', 'ل'], ['an', 'ان'], ['en', 'ين'], ['on', 'ون'],
      ['in', 'ين'], ['un', 'ون'], ['ah', 'ة'], ['eh', 'ة'], ['oh', 'و'],
      ['is', 'يس'], ['us', 'وس'], ['as', 'اس']
    ];
    for (const [k, v] of patterns) {
      s = s.split(k).join(v);
    }

    const map = {
      a: 'ا', b: 'ب', c: 'ك', d: 'د', e: '', f: 'ف', g: 'ج', h: 'ه',
      i: 'ي', j: 'ج', k: 'ك', l: 'ل', m: 'م', n: 'ن', o: 'و', p: 'ب',
      q: 'ق', r: 'ر', s: 'س', t: 'ت', u: 'و', v: 'ف', w: 'و', x: 'كس',
      y: 'ي', z: 'ز', "'": 'ء', '-': ' ', ' ': ' '
    };
    let out = '';
    for (const ch of s) {
      out += map[ch] ?? ch;
    }
    out = out.replace(/وو/g, 'و').replace(/يي/g, 'ي').replace(/هه/g, 'ه');
    return out.trim() || name;
  }

  // ---------- Utilities ----------
  function formatMoney(num, currency) {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(num) + ' ' + currency;
  }

  function formatArDate(y, m, d) {
    const date = new Date(y, m - 1, d);
    return date.toLocaleDateString('ar', {
      calendar: 'gregory',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  function formatEnDate(y, m, d) {
    const date = new Date(y, m - 1, d);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  function getProductCode(text) {
    if (!text) return 'XX';
    const cleaned = text.replace(/[^a-zA-Z0-9]/g, '');
    let code = cleaned.slice(0, 2).toUpperCase();
    return code.padEnd(2, 'X');
  }

  function makeReceiptNo(dateStr, product) {
    if (!dateStr || !product) return '';
    const [y, m, d] = dateStr.split('-');
    const mmdd = `${m}${d}`;
    return `CN-${y}-${mmdd}-${getProductCode(product)}`;
  }

  // ---------- Core update ----------
  function updateReceipt() {
    const dateStr = inputs.date.value;
    const product = inputs.product.value.trim();
    const customer = inputs.customer.value.trim();
    const priceVal = parseFloat(inputs.price.value);
    const qtyVal = parseInt(inputs.qty.value, 10) || 1;
    const currency = inputs.currency.value || 'HKD';

    let totalVal = 0;
    if (!isNaN(priceVal) && !isNaN(qtyVal)) {
      totalVal = priceVal * qtyVal;
    }

    const receiptNo = makeReceiptNo(dateStr, product);

    // English side
    outputs.receiptNo.textContent = receiptNo;
    outputs.customer.textContent = customer;
    outputs.product.textContent = product;
    outputs.qty.textContent = qtyVal;
    outputs.price.textContent = isNaN(priceVal) ? '' : formatMoney(priceVal, currency);
    outputs.total.textContent = isNaN(priceVal) ? '' : formatMoney(totalVal, currency);

    // Arabic side
    outputs.receiptNoAr.textContent = receiptNo;
    outputs.productAr.textContent = product;
    outputs.qtyAr.textContent = qtyVal;

    if (dateStr) {
      const [y, m, d] = dateStr.split('-').map(Number);
      outputs.date.textContent = formatEnDate(y, m, d);
      outputs.dateAr.textContent = formatArDate(y, m, d);
    } else {
      outputs.date.textContent = '';
      outputs.dateAr.textContent = '';
    }

    outputs.customerAr.textContent = inputs.customerAr.value.trim();

    // Prices are kept in English (digits + currency) even in the Arabic half
    outputs.priceAr.textContent = isNaN(priceVal) ? '' : formatMoney(priceVal, currency);
    outputs.totalAr.textContent = isNaN(priceVal) ? '' : formatMoney(totalVal, currency);

    // Review screen
    const customerAr = inputs.customerAr.value.trim();
    review.receiptNo.textContent = receiptNo || '—';
    review.date.textContent = outputs.date.textContent || '—';
    review.product.textContent = product || '—';
    review.customer.textContent = customer ? `${customer} / ${customerAr || '—'}` : '—';
    review.price.textContent = isNaN(priceVal) ? '—' : formatMoney(priceVal, currency);
    review.qty.textContent = qtyVal;
    review.total.textContent = isNaN(priceVal) ? '—' : formatMoney(totalVal, currency);
  }

  // ---------- Customer Arabic auto-fill (editable) ----------
  let customerArEdited = false;

  inputs.customer.addEventListener('input', () => {
    const name = inputs.customer.value.trim();
    if (name) {
      inputs.customerAr.value = toArabicName(name);
      customerArEdited = false;
    } else {
      inputs.customerAr.value = '';
      customerArEdited = false;
    }
    updateReceipt();
  });

  inputs.customerAr.addEventListener('input', () => {
    customerArEdited = true;
    updateReceipt();
  });

  Object.values(inputs).forEach(input => {
    if (input !== inputs.customer && input !== inputs.customerAr) {
      input.addEventListener('input', updateReceipt);
    }
  });

  // ---------- Product textarea: desktop Enter advances, Shift+Enter / iOS Return inserts newline ----------
  inputs.product.addEventListener('keydown', (e) => {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    if (!isIOS && e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (validateStep(currentStep) && currentStep < totalSteps) {
        showStep(currentStep + 1);
      }
    }
  });

  // ---------- Step navigation ----------
  function validateStep(stepNum) {
    const step = steps[stepNum - 1];
    const required = step.querySelectorAll('input[required]');
    let ok = true;
    required.forEach(input => {
      if (!input.checkValidity()) {
        ok = false;
        input.reportValidity();
      }
    });
    return ok;
  }

  function showStep(n) {
    steps.forEach(s => s.classList.remove('active'));
    steps[n - 1].classList.add('active');
    currentStep = n;

    const pct = (n / totalSteps) * 100;
    progressBar.style.width = `${pct}%`;

    backBtn.classList.toggle('hidden', n === 1);
    nextBtn.classList.toggle('hidden', n === totalSteps);
    downloadBtn.classList.toggle('hidden', n !== totalSteps);
  }

  nextBtn.addEventListener('click', () => {
    if (!validateStep(currentStep)) return;
    if (currentStep < totalSteps) {
      showStep(currentStep + 1);
    }
  });

  backBtn.addEventListener('click', () => {
    if (currentStep > 1) {
      showStep(currentStep - 1);
    }
  });

  // ---------- Arabic text rasterization for PDF ----------
  function renderTextToDataURL(el, { align = 'right', scale = 4 } = {}) {
    const rect = el.getBoundingClientRect();
    const style = window.getComputedStyle(el);
    const padL = parseFloat(style.paddingLeft) || 0;
    const padR = parseFloat(style.paddingRight) || 0;
    const padT = parseFloat(style.paddingTop) || 0;
    const padB = parseFloat(style.paddingBottom) || 0;
    const w = Math.max(1, rect.width - padL - padR);
    const h = Math.max(1, rect.height - padT - padB);

    const canvas = document.createElement('canvas');
    canvas.width = Math.ceil(w * scale);
    canvas.height = Math.ceil(h * scale);
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const baseFontSize = parseFloat(style.fontSize) || 13;
    let fontSize = baseFontSize * scale;
    ctx.font = `${fontSize}px "Noto Sans Arabic", Arial, sans-serif`;
    ctx.textBaseline = 'middle';
    ctx.textAlign = align;
    ctx.fillStyle = '#000000';

    const text = el.textContent.trim();
    const innerPad = 8 * scale;
    const maxTextWidth = Math.max(1, canvas.width - innerPad * 2);

    while (fontSize > 8 * scale && ctx.measureText(text).width > maxTextWidth) {
      fontSize -= 1 * scale;
      ctx.font = `${fontSize}px "Noto Sans Arabic", Arial, sans-serif`;
    }

    const x = align === 'right'
      ? canvas.width - innerPad
      : align === 'center'
        ? canvas.width / 2
        : innerPad;
    const y = canvas.height / 2;

    ctx.fillText(text, x, y);
    return { dataUrl: canvas.toDataURL('image/png'), width: w, height: h };
  }

  function replaceArabicWithImages() {
    const restoreMap = new Map();
    const replace = (el, align) => {
      if (!el) return;
      const original = el.innerHTML;
      const { dataUrl, width, height } = renderTextToDataURL(el, { align });
      el.innerHTML = `<img src="${dataUrl}" alt="" style="display:block;width:${width}px;height:${height}px;">`;
      restoreMap.set(el, original);
    };

    document.querySelectorAll('.arabic-table .label').forEach(el => replace(el, 'right'));
    replace(document.getElementById('outDateAr'), 'center');
    replace(document.getElementById('outCustomerAr'), 'center');
    replace(document.querySelector('.supplier-ar'), 'center');
    replace(document.querySelector('.payment-ar'), 'center');

    return () => {
      restoreMap.forEach((html, el) => {
        el.innerHTML = html;
      });
    };
  }

  // ---------- PDF generation ----------
  async function generatePDF() {
    if (typeof html2pdf === 'undefined') {
      alert('PDF library is still loading. Please check your connection and try again.');
      return;
    }

    const receiptNo = outputs.receiptNo.textContent || 'Receipt';
    const opt = {
      margin: 0,
      filename: `Receipt-${receiptNo}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false
      },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    try {
      if (document.fonts) await document.fonts.ready;
      const restore = replaceArabicWithImages();
      try {
        await html2pdf().set(opt).from(receiptEl).save();
      } finally {
        restore();
      }
    } catch (err) {
      console.error(err);
      alert('Could not generate PDF. Please try again.');
    }
  }

  downloadBtn.addEventListener('click', generatePDF);

  // ---------- Init ----------
  updateReceipt();
  showStep(1);
})();

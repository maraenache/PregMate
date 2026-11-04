function question(id, lessonId, prompt, answer, distractors, explanation, sourcePage = 1) {
  const choices = [String(answer), ...distractors.map(String)];
  const shift = Number(id.match(/\d+$/)?.[0] || 0) % choices.length;
  const options = [...choices.slice(shift), ...choices.slice(0, shift)];
  return {
    id,
    lessonId,
    question: prompt,
    options,
    correctIndex: options.indexOf(String(answer)),
    explanation,
    sourcePage,
};
}

function numeric(id, lessonId, prompt, answer, unit, explanation, page = 1, wrong = [answer + 2, Math.max(0, answer - 2), answer * 2 + 1]) {
  const format = (value) => `${value}${unit}`;
  const choices = [...new Set(wrong)].filter((value) => value !== answer).slice(0, 3);
  for (let delta = 1; choices.length < 3; delta++) {
    const candidate = answer + delta;
    if (candidate !== answer && !choices.includes(candidate)) choices.push(candidate);
  }
  return question(id, lessonId, prompt, format(answer), choices.map(format), explanation, page);
}

function generated(lessonId) {
  const q = (n, prompt, answer, unit, explanation, page = 1, wrong) =>
    numeric(`${lessonId}-d${String(n).padStart(2, '0')}`, lessonId, prompt, answer, unit, explanation, page, wrong);
  const text = (n, prompt, answer, wrong, explanation, page = 1) =>
    question(`${lessonId}-d${String(n).padStart(2, '0')}`, lessonId, prompt, answer, wrong, explanation, page);

  switch (lessonId) {
    case 'unghiuri': {
      const result = [];
      [12, 18, 27, 34, 41, 48, 55, 63, 72, 84].forEach((a, i) => result.push(q(i + 1, `Care este complementul unghiului de ${a}°?`, 90 - a, '°', `Unghiurile complementare au suma 90°, deci 90° − ${a}° = ${90 - a}°.` , 1, [a, 180 - a, 90 + a])));
      [15, 24, 36, 47, 58, 69, 82, 95, 117, 143].forEach((a, i) => result.push(q(i + 11, `Care este suplementul unghiului de ${a}°?`, 180 - a, '°', `Unghiurile suplementare au suma 180°, deci 180° − ${a}° = ${180 - a}°.` , 1, [a, 90 - a, 180 + a])));
      [16, 22, 29, 33, 38, 44, 52, 61, 73, 81].forEach((a, i) => result.push(q(i + 21, `OP este bisectoarea lui ∠MON, iar m(∠MOP) = ${a}°. Cât măsoară ∠MON?`, 2 * a, '°', `Bisectoarea împarte unghiul în două unghiuri egale: 2 · ${a}° = ${2 * a}°.` , 2, [a, 90 - a, 180 - 2 * a])));
      return result;
    }
    case 'triunghiuri': {
      const result = [];
      [[42, 63], [51, 72], [38, 84], [67, 54], [29, 91], [75, 46], [33, 68], [58, 57], [24, 109], [81, 39]].forEach(([a, b], i) => result.push(q(i + 1, `Un triunghi are două unghiuri de ${a}° și ${b}°. Cât măsoară al treilea unghi?`, 180 - a - b, '°', `Suma unghiurilor unui triunghi este 180°: 180° − ${a}° − ${b}° = ${180 - a - b}°.` , 1, [a + b, 180 - a, 180 - b])));
      [24, 32, 41, 48, 57, 63, 72, 81, 94, 106].forEach((vertex, i) => result.push(q(i + 11, `Un triunghi isoscel are unghiul la vârf de ${vertex}°. Cât măsoară fiecare unghi de la bază?`, (180 - vertex) / 2, '°', `Unghiurile de la bază sunt egale: (180° − ${vertex}°) : 2 = ${(180 - vertex) / 2}°.` , 1, [vertex, 180 - vertex, (180 + vertex) / 2])));
      [[5, 7, 9], [6, 8, 11], [7, 9, 12], [8, 10, 13], [9, 12, 14], [10, 11, 16], [12, 13, 17], [13, 15, 18], [14, 16, 21], [15, 17, 22]].forEach(([a, b, c], i) => result.push(q(i + 21, `Laturile unui triunghi măsoară ${a} cm, ${b} cm și ${c} cm. Care este perimetrul?`, a + b + c, ' cm', `Perimetrul este suma laturilor: ${a} + ${b} + ${c} = ${a + b + c} cm.` , 2, [a + b, a + c, b + c])));
      return result;
    }
    case 'patrulatere': {
      const result = [];
      [[80, 90, 100], [75, 85, 110], [60, 120, 90], [45, 135, 95], [70, 100, 110], [55, 125, 90], [48, 132, 95], [66, 114, 105], [72, 108, 99], [40, 140, 125]].forEach(([a, b, c], i) => {
        const fourth = 360 - a - b - c;
        result.push(q(i + 1, `Trei unghiuri ale unui patrulater măsoară ${a}°, ${b}° și ${c}°. Cât măsoară al patrulea unghi?`, fourth, '°', `Suma unghiurilor unui patrulater este 360°: 360° − ${a}° − ${b}° − ${c}° = ${fourth}°.` , 1, [a, b, c]));
      });
      [[6, 10], [8, 14], [10, 16], [12, 18], [14, 22], [16, 24], [18, 26], [20, 30], [22, 34], [24, 36]].forEach(([baseBig, baseSmall], i) => {
        const midline = (baseBig + baseSmall) / 2;
        result.push(q(i + 11, `Bazele unui trapez măsoară ${baseBig} cm și ${baseSmall} cm. Cât măsoară linia mijlocie?`, midline, ' cm', `Linia mijlocie este media bazelor: (${baseBig} + ${baseSmall}) : 2 = ${midline} cm.` , 4, [baseBig + baseSmall, baseBig - baseSmall, (baseBig + baseSmall) * 2]));
      });
      [3, 4, 5, 6, 7].forEach((side, i) => result.push(q(i + 21, `Latura unui romb măsoară ${side} cm. Care este perimetrul rombului?`, 4 * side, ' cm', `Toate cele patru laturi ale rombului sunt egale: P = 4 · ${side} = ${4 * side} cm.` , 2, [side * 2, side * 3, side + 4])));
      [8, 10, 12, 14, 16].forEach((diagonal, i) => result.push(q(i + 26, `Diagonalele unui dreptunghi se intersectează în O. Dacă AC = ${diagonal} cm, cât măsoară AO?`, diagonal / 2, ' cm', `Diagonalele dreptunghiului se înjumătățesc: AO = AC : 2 = ${diagonal} : 2 = ${diagonal / 2} cm.` , 3, [diagonal, diagonal / 4, diagonal + 2])));
      return result;
    }
    case 'cercul': {
      const result = [];
      [2, 3, 4, 5, 6, 7, 8, 9, 11, 12].forEach((r, i) => result.push(q(i + 1, `Un cerc are raza de ${r} cm. Cât măsoară diametrul?`, 2 * r, ' cm', `Diametrul este de două ori raza: d = 2 · ${r} = ${2 * r} cm.` , 1, [r, 3 * r, r + 2])));
      [24, 32, 40, 48, 56, 64, 72, 84, 96, 110].forEach((angle, i) => {
        const inscribed = i % 2 === 1;
        const arc = inscribed ? 2 * angle : angle;
        result.push(q(i + 11, inscribed ? `Un unghi înscris măsoară ${angle}°. Cât măsoară arcul interceptat?` : `Un unghi la centru măsoară ${angle}°. Cât măsoară arcul corespunzător?`, arc, '°', inscribed ? `Arcul interceptat măsoară dublul unghiului înscris: 2 · ${angle}° = ${arc}°.` : `Măsura arcului este egală cu unghiul la centru: ${arc}°.` , 1, [angle / 2, 180 - angle, 360 - angle]));
      });
      [3, 4, 5, 6, 7, 8, 9, 10, 12, 14].forEach((length, i) => result.push(q(i + 21, `Din același punct exterior se duc două tangente la un cerc. Dacă una măsoară ${length} cm, cât măsoară cealaltă?`, length, ' cm', 'Tangentele duse din același punct exterior la cerc au lungimi egale.' , 2, [length + 1, length * 2, Math.max(1, length - 1)])));
      return result;
    }
    case 'triunghiuri-dreptunghice-1': {
      const result = [];
      [[3, 4, 5], [5, 12, 13], [8, 15, 17], [7, 24, 25], [9, 12, 15], [6, 8, 10], [10, 24, 26], [12, 16, 20], [20, 21, 29], [12, 35, 37]].forEach(([a, b, c], i) => result.push(q(i + 1, `Un triunghi dreptunghic are catetele de ${a} cm și ${b} cm. Cât măsoară ipotenuza?`, c, ' cm', `Teorema lui Pitagora: c² = ${a}² + ${b}², deci c = ${c} cm.` , 1, [a + b, c + 1, Math.abs(a - b)])));
      [6, 8, 10, 12, 14, 16, 18, 20, 24, 30].forEach((c, i) => result.push(q(i + 11, `Ipotenuza unui triunghi dreptunghic măsoară ${c} cm. Cât măsoară mediana dusă la ipotenuză?`, c / 2, ' cm', `Mediana dusă din unghiul drept este jumătate din ipotenuză: ${c} : 2 = ${c / 2} cm.` , 1, [c, c / 3, c / 4])));
      [8, 10, 12, 14, 16, 18, 20, 22, 24, 26].forEach((hyp, i) => result.push(q(i + 21, `Într-un triunghi dreptunghic cu un unghi de 30°, ipotenuza măsoară ${hyp} cm. Cât măsoară cateta opusă unghiului de 30°?`, hyp / 2, ' cm', `Cateta opusă unghiului de 30° este jumătate din ipotenuză: ${hyp} : 2 = ${hyp / 2} cm.` , 1, [hyp, hyp / 3, hyp / 4])));
      return result;
    }
    case 'triunghiuri-dreptunghice-2': {
      const result = [];
      [[4, 9], [4, 16], [9, 16], [9, 25], [16, 25], [16, 36], [25, 36], [25, 49], [36, 49], [49, 64]].forEach(([p, projection], i) => result.push(q(i + 1, `Proiecțiile catetelor pe ipotenuză sunt ${p} cm și ${projection} cm. Cât măsoară înălțimea pe ipotenuză?`, Math.sqrt(p * projection), ' cm', `Teorema înălțimii: h² = ${p} · ${projection}, deci h = ${Math.sqrt(p * projection)} cm.` , 1, [p + projection, Math.abs(projection - p), Math.sqrt(p + projection)])));
      [[25, 9], [25, 16], [36, 16], [36, 9], [49, 25], [49, 16], [64, 36], [64, 25], [100, 36], [100, 64]].forEach(([c, p], i) => result.push(q(i + 11, `Ipotenuza are ${c} cm, iar proiecția catetei pe ea este ${p} cm. Cât măsoară cateta?`, Math.sqrt(c * p), ' cm', `Teorema catetei: cateta² = ipotenuză · proiecție = ${c} · ${p}; cateta = ${Math.sqrt(c * p)} cm.` , 1, [c, p, c - p])));
      [[6, 8], [5, 12], [9, 12], [8, 15], [12, 16], [7, 24], [15, 20], [10, 24], [20, 21], [12, 35]].forEach(([a, b], i) => result.push(q(i + 21, `Catetele unui triunghi dreptunghic măsoară ${a} cm și ${b} cm. Care este aria?`, a * b / 2, ' cm²', `Aria este produsul catetelor împărțit la 2: ${a} · ${b} : 2 = ${a * b / 2} cm².` , 1, [a * b, a + b, (a + b) / 2])));
      return result;
    }
    case 'triunghiuri-dreptunghice-3': {
      const result = [];
      const special = [
        ['sin', 30, '1/2', ['√3/2', '1', '√3']], ['cos', 30, '√3/2', ['1/2', '√3', '1']],
        ['sin', 45, '√2/2', ['1/2', '√3/2', '1']], ['cos', 45, '√2/2', ['1/2', '√3/2', '1']],
        ['tg', 45, '1', ['0', '√3', '√3/3']], ['ctg', 45, '1', ['0', '√3', '√3/3']],
        ['sin', 60, '√3/2', ['1/2', '√2/2', '1']], ['cos', 60, '1/2', ['√3/2', '√2/2', '1']],
        ['tg', 30, '√3/3', ['1/2', '1', '√3']], ['tg', 60, '√3', ['√3/3', '1', '2']],
      ];
      special.forEach(([fn, angle, answer, wrong], i) => result.push(text(i + 1, `Cât este ${fn} ${angle}°?`, answer, wrong, `Valoarea remarcabilă este ${fn} ${angle}° = ${answer}.` , 1)));
      const triples = [[3, 4, 5], [5, 12, 13], [8, 15, 17], [7, 24, 25], [9, 12, 15], [6, 8, 10], [10, 24, 26], [12, 16, 20], [20, 21, 29], [12, 35, 37]];
      triples.forEach(([a, b, c], i) => {
        const [opp, adj, hyp] = [a, b, c];
        result.push(text(i + 11, `Într-un triunghi dreptunghic față de unghiul x, cateta opusă este ${opp}, iar ipotenuza este ${hyp}. Cât este sin x?`, `${opp}/${hyp}`, [`${adj}/${hyp}`, `${hyp}/${opp}`, `${opp}/${adj}`], 'Sinusul este raportul dintre cateta opusă și ipotenuză.' , 1));
      });
      const relations = [
        ['sin x / cos x', 'tg x', ['ctg x', '1', 'sin x · cos x']], ['cos x / sin x', 'ctg x', ['tg x', '1', 'sin x · cos x']],
        ['1 / tg x', 'ctg x', ['tg x', 'sin x', 'cos x']], ['1 / ctg x', 'tg x', ['ctg x', 'sin x', 'cos x']],
        ['sin² x + cos² x', '1', ['0', 'tg x', '2']], ['tg x · ctg x', '1', ['0', 'sin x', 'cos x']],
        ['sin x / tg x', 'cos x', ['ctg x', '1', 'sin x']], ['cos x · tg x', 'sin x', ['ctg x', '1', 'cos x']],
        ['cos x / ctg x', 'sin x', ['tg x', '1', 'cos x']], ['sin x · ctg x', 'cos x', ['tg x', '1', 'sin x']],
      ];
      relations.forEach(([expr, answer, wrong], i) => result.push(text(i + 21, `Simplifică expresia ${expr}.`, answer, wrong, 'Se folosesc relațiile dintre funcțiile trigonometrice ale aceluiași unghi.' , 1)));
      return result;
    }
    case 'centrul-de-greutate': {
      const result = [];
      [6, 9, 12, 15, 18, 21, 24, 27, 30, 36].forEach((m, i) => result.push(q(i + 1, `Mediana unui triunghi măsoară ${m} cm. Cât măsoară segmentul de la vârf la centrul de greutate?`, 2 * m / 3, ' cm', `Centrul de greutate împarte mediana în raport 2:1, deci AG = 2/3 · ${m} = ${2 * m / 3} cm.` , 1, [m / 3, m, 2 * m])));
      [6, 9, 12, 15, 18, 21, 24, 27, 30, 36].forEach((m, i) => result.push(q(i + 11, `Mediana unui triunghi măsoară ${m} cm. Cât măsoară segmentul de la centrul de greutate la mijlocul laturii?`, m / 3, ' cm', `Centrul de greutate împarte mediana în raport 2:1, deci GM = 1/3 · ${m} = ${m / 3} cm.` , 1, [2 * m / 3, m, m / 2])));
      [12, 18, 24, 30, 36, 42, 48, 54, 60, 72].forEach((area, i) => result.push(q(i + 21, `Aria unui triunghi este ${area} cm². Ce arie are unul dintre cele două triunghiuri formate de o mediană?`, area / 2, ' cm²', `O mediană împarte triunghiul în două triunghiuri de arii egale: ${area} : 2 = ${area / 2} cm².` , 1, [area, area / 3, area / 4])));
      return result;
    }
    case 'triunghiuri-asemenea': {
      const result = [];
      [[2, 3], [3, 4], [4, 5], [2, 7], [3, 6], [5, 4], [4, 3], [6, 2], [7, 3], [5, 6]].forEach(([k, side], i) => result.push(q(i + 1, `Două triunghiuri sunt asemenea cu raportul k = ${k}. O latură a triunghiului mai mic măsoară ${side} cm. Cât măsoară latura corespunzătoare din triunghiul mai mare?`, k * side, ' cm', `Laturile corespunzătoare sunt în raport k: ${k} · ${side} = ${k * side} cm.` , 1, [k + side, side, k * side + k])));
      [2, 3, 4, 5, 6, 7, 8, 9, 10, 12].forEach((k, i) => result.push(q(i + 11, `Raportul de asemănare este k = ${k}. Dacă perimetrul triunghiului mic este 9 cm, care este perimetrul celui mare?`, 9 * k, ' cm', `Perimetrele triunghiurilor asemenea sunt în raport k: 9 · ${k} = ${9 * k} cm.` , 1, [9 + k, 9 * k * k, 9 / k])));
      [2, 3, 4, 5, 6, 7, 8, 9, 10, 12].forEach((k, i) => result.push(q(i + 21, `Două triunghiuri sunt asemenea cu raportul k = ${k}. Dacă aria celui mic este 4 cm², care este aria celui mare?`, 4 * k * k, ' cm²', `Ariile figurilor asemenea sunt în raport k²: 4 · ${k}² = ${4 * k * k} cm².` , 2, [4 * k, 4 + k, 4 * k * k + 4])));
      return result;
    }
    case 'thales-asemanare': {
      const result = [];
      [[2, 3, 4], [3, 2, 6], [2, 5, 6], [4, 3, 8], [3, 5, 9], [5, 2, 10], [4, 5, 12], [6, 5, 18], [7, 3, 14], [5, 4, 15]].forEach(([ae, ec, ad], i) => {
        const db = ad * ec / ae;
        result.push(q(i + 1, `În △ABC, ED ∥ BC, iar AE = ${ae} cm, EC = ${ec} cm și AD = ${ad} cm. Cât măsoară DB?`, db, ' cm', `Teorema lui Thales: AE/EC = AD/DB, deci DB = ${ad} · ${ec} : ${ae} = ${db} cm.` , 1, [ad + ec, ad * ae / ec, ae + ec]));
      });
      [[2, 6, 9], [3, 9, 12], [4, 8, 10], [2, 10, 15], [5, 15, 18], [4, 12, 21], [6, 18, 20], [3, 12, 16], [5, 10, 24], [7, 14, 18]].forEach(([ad, ab, bc], i) => {
        const ed = ad * bc / ab;
        result.push(q(i + 11, `În △ABC, DE ∥ BC. Dacă AD = ${ad} cm, AB = ${ab} cm și BC = ${bc} cm, cât măsoară DE?`, ed, ' cm', `Din asemănarea triunghiurilor, DE/BC = AD/AB, deci DE = ${bc} · ${ad} : ${ab} = ${ed} cm.` , 1, [bc - ed, bc, ed + ad]));
      });
      [[2, 3, 4], [3, 4, 6], [4, 5, 8], [5, 2, 10], [2, 7, 6], [3, 5, 12], [4, 3, 12], [6, 5, 18], [7, 2, 14], [5, 4, 20]].forEach(([a, c, b], i) => {
        const d = b * c / a;
        result.push(q(i + 21, `Într-o configurație Thales, segmentele corespunzătoare verifică a/c = b/d. Dacă a = ${a}, c = ${c} și b = ${b}, cât este d?`, d, '', `Din proporția a/c = b/d rezultă d = b · c : a = ${b} · ${c} : ${a} = ${d}.` , 1, [a + c, b / c, d + 2]));
      });
      return result;
    }
    case 'linia-mijlocie': {
      const result = [];
      [8, 10, 12, 14, 16, 18, 20, 22, 24, 30].forEach((base, i) => result.push(q(i + 1, `Linia mijlocie a unui triunghi este paralelă cu o latură de ${base} cm. Cât măsoară linia mijlocie?`, base / 2, ' cm', `Linia mijlocie este jumătate din latura paralelă: ${base} : 2 = ${base / 2} cm.` , 1, [base, base / 4, base * 2])));
      [[4, 8], [5, 9], [6, 10], [7, 11], [8, 14], [9, 15], [10, 16], [12, 18], [13, 21], [15, 25]].forEach(([a, b], i) => result.push(q(i + 11, `Bazele unui trapez măsoară ${a} cm și ${b} cm. Cât măsoară linia mijlocie?`, (a + b) / 2, ' cm', `Linia mijlocie a trapezului este semisuma bazelor: (${a} + ${b}) : 2 = ${(a + b) / 2} cm.` , 1, [a + b, b - a, (a + b) * 2])));
      [12, 16, 20, 24, 28, 32, 36, 40, 48, 56].forEach((area, i) => result.push(q(i + 21, `Aria unui triunghi este ${area} cm². Ce arie are triunghiul format de liniile mijlocii?`, area / 4, ' cm²', `Triunghiul format de liniile mijlocii are aria de 1/4 din triunghiul inițial: ${area} : 4 = ${area / 4} cm².` , 1, [area / 2, area / 3, area])));
      return result;
    }
    case 'aria-triunghiului': {
      const result = [];
      [[6, 4], [8, 5], [10, 6], [12, 7], [14, 8], [16, 9], [18, 10], [20, 12], [22, 14], [24, 15]].forEach(([b, h], i) => result.push(q(i + 1, `Un triunghi are baza ${b} cm și înălțimea corespunzătoare ${h} cm. Care este aria?`, b * h / 2, ' cm²', `Aria este b · h : 2 = ${b} · ${h} : 2 = ${b * h / 2} cm².` , 1, [b * h, b + h, (b + h) / 2])));
      [[5, 12], [8, 15], [7, 24], [9, 12], [12, 16], [10, 24], [15, 20], [20, 21], [12, 35], [16, 30]].forEach(([a, b], i) => result.push(q(i + 11, `Catetele unui triunghi dreptunghic măsoară ${a} cm și ${b} cm. Care este aria?`, a * b / 2, ' cm²', `Catetele sunt perpendiculare, deci aria este ${a} · ${b} : 2 = ${a * b / 2} cm².` , 1, [a * b, a + b, a * b / 4])));
      [[6, 8], [8, 10], [10, 12], [12, 14], [14, 16], [16, 18], [18, 20], [20, 22], [22, 24], [24, 26]].forEach(([a, b], i) => result.push(q(i + 21, `Aria unui triunghi cu laturile ${a} cm și ${b} cm și unghiul cuprins de 90° este:`, a * b / 2, ' cm²', `A = a · b · sin 90° / 2 = ${a} · ${b} : 2 = ${a * b / 2} cm².` , 1, [a * b, a + b, (a + b) / 2])));
      return result;
    }
    case 'ariile-patrulaterelor': {
      const result = [];
      [3, 4, 5, 6, 7, 8, 9, 10, 11, 12].forEach((l, i) => result.push(q(i + 1, `Un pătrat are latura de ${l} cm. Care este aria?`, l * l, ' cm²', `Aria pătratului este l² = ${l}² = ${l * l} cm².` , 1, [4 * l, l * 2, l * l + l])));
      [[4, 6], [5, 8], [6, 9], [7, 10], [8, 12], [9, 13], [10, 15], [11, 16], [12, 18], [14, 20]].forEach(([a, b], i) => result.push(q(i + 11, `Un dreptunghi are lungimea ${a} cm și lățimea ${b} cm. Care este aria?`, a * b, ' cm²', `Aria dreptunghiului este lungime · lățime = ${a} · ${b} = ${a * b} cm².` , 1, [2 * (a + b), a + b, a * b + a])));
      [[4, 8], [5, 10], [6, 12], [7, 14], [8, 16], [9, 18], [10, 20], [11, 22], [12, 24], [13, 26]].forEach(([h, sum], i) => result.push(q(i + 21, `Un trapez are înălțimea ${h} cm și suma bazelor ${sum} cm. Care este aria?`, h * sum / 2, ' cm²', `Aria trapezului este (suma bazelor) · înălțimea : 2 = ${sum} · ${h} : 2 = ${h * sum / 2} cm².` , 1, [h * sum, h + sum, h * sum / 4])));
      return result;
    }
    case 'geometrie-analitica': {
      const result = [];
      [[3, 4], [5, 12], [8, 15], [7, 24], [9, 12], [6, 8], [10, 24], [12, 16], [20, 21], [12, 35]].forEach(([x, y], i) => result.push(q(i + 1, `Punctele A(0, 0) și B(${x}, ${y}) sunt în plan. Care este distanța AB?`, Math.hypot(x, y), '', `Aplicăm formula distanței: AB = √(${x}² + ${y}²) = ${Math.hypot(x, y)}.` , 1, [x + y, Math.abs(y - x), Math.hypot(x, y) + 1])));
      [[2, 4], [4, 8], [6, 10], [8, 12], [10, 14], [12, 16], [14, 18], [16, 20], [18, 22], [20, 24]].forEach(([a, b], i) => result.push(q(i + 11, `Punctele A(${a}, 0) și B(${b}, 0) sunt pe axa Ox. Care este abscisa mijlocului segmentului [AB]?`, (a + b) / 2, '', `Abscisa mijlocului este media absciselor capetelor: (${a} + ${b}) : 2 = ${(a + b) / 2}.` , 1, [b - a, a + b, b])));
      [[2, 4], [4, 8], [6, 10], [8, 12], [10, 14], [12, 16], [14, 18], [16, 20], [18, 22], [20, 24]].forEach(([a, b], i) => result.push(q(i + 21, `Punctele A(0, ${a}) și B(0, ${b}) sunt pe axa Oy. Care este ordonata mijlocului segmentului [AB]?`, (a + b) / 2, '', `Ordonata mijlocului este media ordonatelor capetelor: (${a} + ${b}) : 2 = ${(a + b) / 2}.` , 1, [b - a, a + b, b])));
      return result;
    }
    default:
      return [];
  }
}

export function getDetailedQuestions(lessonId, shortQuestions) {
  return [...shortQuestions, ...generated(lessonId)];
}


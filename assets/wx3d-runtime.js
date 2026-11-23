/* 纹现 · 真 3D 展示运行时（v14 克制质感精修版）
 * 设计意图：把平面 SVG 纹样提取为不透明贴图，贴到与所选载体一一对应的 WebGL 立体模型上。
 * v14（本版）克制质感精修：基于真实页面截图做"只变好、不乱改"的保守优化——
 *   · 降低曝光与补光强度，让纹样颜色更沉稳、不再一片惨白；保留 ACES + sRGB 管线。
 *   · 包边/织带/手机壳侧边按底色再压暗一档，避免浅色载体像半透明白塑料。
 *   · 托特包提手收细，卫衣袋鼠兜缩小并贴合衣身，方巾前后片增大间距防止闪面。
 *   · 落地阴影更轻、更扁、更柔，减少"灰色贴纸"感。
 * v13 影像级画面质感：开放互联网后参考产品级 3D 渲染规范 + 真实页面截图质检——
 *   · 打通真实浏览器截图（playwright + 本机 Edge + swiftshader），首次看到真实 WebGL 画面而非纯色质检图
 *   · 色彩管线：renderer.outputEncoding=sRGB + ACESFilmicToneMapping（修旧版"贴图sRGB解码却线性输出"的过曝发灰）
 *   · 环境反射：程序化中性影棚 equirect 贴图 → PMREM 卷积 → scene.environment，陶瓷/描金/塑料有真实反射
 *   · PBR 分档：布料 rough≈0.95、陶瓷≈0.72、光面塑料(手机壳)≈0.32、描金 metalness≈0.85
 *   · 柔和三点布光（主/补/轮廓）+ 径向渐变柔和落地阴影替代生硬灰饼
 *   · 全部 try/catch 兜底，任何设备不支持时静默降级，绝不白屏；环境贴图/阴影贴图在 dispose 中释放
 * v12 质感优先（用户反馈"越改越丑/审美要高"）：不再堆几何细节，聚焦贴图真实感——
 *   · 核心发现：此前一直用纯色质检图判断审美，看不到真实纹样，导致误判。改用带纹样贴图+真实光照的渲染台质检。
 *   · UV 等比平铺：新增 scaleUV/latheSideUV 工具，按物理尺寸重算 UV，修复多处置命贴图缺陷：
 *     - 渔夫帽帽冠/帽壁：原 XZ 平面投影 UV 把纹样拉成"拉丝竖条"→ 改柱面展开 UV，十字纹清晰且密度一致
 *     - 马克杯杯身：原 Cylinder 默认 UV 把十字横向压成"横条"→ 按周长/高度重算，比例正常
 *     - T恤/卫衣衣身与袖子、兜帽、袋鼠兜：统一 UV 密度，消除"两种布料拼接"感
 *   · 领口：T恤/卫衣罗纹领圈压低压细，消除浮在肩上的"灰色提手环"观感
 *   · 内衬：innerMat 加深（lerp black 0.28→0.44），帽腔/杯内壁呈真实阴影而非浅灰塑料感
 * v11：在 v10 立体曲面基础上逐件挑剔复检、修复真实感瑕疵——
 *   · 初始视角：默认俯角从 4.6° 提到 ~15°，第一眼即可看出立体体积（不再像平面）
 *   · 卫衣：兜帽尖顶改为圆润布兜（截面收成圆弧、帽顶隆起、封口球缩小），背面不再像巫师帽
 *   · T恤：改为真正的椭圆挖领（领圈罗纹 + 深色内衬凹陷碗），领口清晰可见
 *   · 托特包：提手由圆绳改为扁带；方巾：双频柔软褶皱；地毯：流苏长短不一自然摆动
 *   · 马克杯：修复"脱底黑环"（内壁锥形化藏入外壁内侧）+ 外底锥台封口；抱枕：四角圆钝、更饱满
 *   · 渔夫帽：删除重叠帽檐底面消除 z-fighting；材质质感：陶瓷(杯/盘)上釉光泽、描金金属反射增强
 * v10：13 类载体全部按"贴合现实"最高规格重做——核心是把原先的平板挤出改为参数化立体曲面：
 *   · T恤/卫衣：立体椭圆筒衣身 + 肩线塑形 + 挖低圆领 + 局部子组旋转的圆锥袖（袖口不再悬空）
 *   · 托特包：鼓起的布包体积 + 内凹袋口 + 扁带提手；抱枕：椭球芯 + 鼓起布面 + 缝线
 *   · 方巾：对称径向下垂的柔软曲面（双面印花）；地毯：成束微卷流苏 + 背面也铺印花
 *   · 马克杯：加厚口沿 + C 形把手 + 圈足；雨伞：8 瓣分段伞面 + 外露伞骨 + 弯钩柄
 *   · 手机壳：三镜头模组（镜圈/镜片/反光/闪光灯）；渔夫帽：放射缝线 + 透气孔 + 帽檐压线
 *   · 折扇：大骨小骨层次 + 扇钉流苏；瓷盘：描金 + 内壁金环 + 圈足
 *   · 所有载体的背面均有印花或合理深色内衬，无空白。
 * v9d 针对三件用户截图返工：
 *   A) 卫衣帽子：从"前倾半球壳/小圆顶"改为真实兜帽——正面椭圆帽口 + 向后脑收拢闭合的布兜，
 *      外层印花、内层深色形成可见帽腔，帽口包边 + 抽绳孔 + 抽绳，末端小布结收口。
 *   B) 笔记本：修复纸页厚 0.26 > 封面 0.22 且居中、把印花封面整个盖住导致"全白"的bug；
 *      纸页改为 0.15 厚并后移夹紧，封面整片印花露出；补圆润书脊 + 烫金压线 + 书签带。
 *   C) 渔夫帽：帽檐从纯色 fabricMat 改为全铺印花，帽冠/帽壁/帽檐上下统一 F 材质 + XZ 平面投影 UV
 *      保证纹样密度一致；内腔保留深色（用户允许内部不填纹样）。
 * v9 精修：按用户截图逐件返工，杜绝"乱拼"——
 *   1) T恤/卫衣：袖子并入衣身单一轮廓，不再叠加独立圆柱；领口改扁平椭圆罗纹；卫衣兜帽改为前倾碗壳+深色内衬+袋鼠兜
 *   2) 方巾：去掉盖住纹样的实心底板，改整片起伏曲面 + 细滚边
 *   3) 瓷盘：浅盘车削轮廓（盘面平、盘沿薄、小圈足），不再是大半球
 *   4) 马克杯：把手曲线从杯身侧面伸出、不进杯口；内壁/杯底用深色内衬材质
 *   5) 渔夫帽：帽冠圆台 + 平滑下倾帽檐 + 深色内腔，无飞碟漏斗
 *   6) 手机壳/笔记本/托特包：圆角实体 + 背面贴纹样，去掉穿出的怪棒与破碎侧褶
 *   7) 雨伞：伞面平滑抛物面、极小起伏，伞骨内藏
 *   8) 折扇：保持原方案（用户认可）
 * 依赖：本地 assets/three.min.js（r128 UMD，离线可用）。
 */
(function () {
  'use strict';
  var THREE = window.THREE;
  var NS = 'http://www.w3.org/2000/svg';
  var S = {
    host: null, renderer: null, scene: null, camera: null, group: null,
    frontMat: null, backMat: null, sideMat: null, innerMat: null,
    fabricMat: null, woodMat: null, accentMat: null, trimMat: null,
    umbrellaMetal: null, umbrellaShaft: null,
    paperMat: null, elasticMat: null, bookclothMat: null,
    target: { rx: -0.08, ry: -0.32 }, drag: false, lx: 0, ly: 0,
    zoom: 1, baseDist: 8.6,
    raf: null, tex: null, envRT: null, shadowTex: null, ro: null, opts: null, ready: false, productId: null
  };

  function hex(v) {
    if (typeof v === 'string' && /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(v)) {
      var h = v.slice(1);
      if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
      return parseInt(h, 16);
    }
    return 0xe8ddc8;
  }
  function cssHex(v) { return '#' + ('000000' + hex(v).toString(16)).slice(-6); }

  // ── 纹理：把 focus/center 的「大格 + 中心放大单枚」归一化为紧密平铺 ──────────
  function normalizePattern(defsC) {
    var pats = defsC.querySelectorAll('pattern');
    var pat = null;
    for (var i = 0; i < pats.length; i++) {
      if ((pats[i].getAttribute('id') || '').indexOf('studio-main') === 0) { pat = pats[i]; break; }
    }
    if (!pat) return;
    var cell = parseFloat(pat.getAttribute('width'));
    if (!(cell > 0)) return;
    var inner = pat.querySelector('g[transform]');
    if (!inner) return;
    var tr = inner.getAttribute('transform') || '';
    var sm = tr.match(/scale\(([-\d.]+)(?:[ ,]+([-\d.]+))?\)/);
    var tm = tr.match(/translate\(([-\d.]+)[ ,]+([-\d.]+)\)/);
    if (!sm || sm[2]) return;
    var k = parseFloat(sm[1]);
    if (!(k > 1.05)) return;
    var tx = tm ? parseFloat(tm[1]) : 0;
    var tile = (cell - 2 * tx) / k;
    if (!(tile > 4)) return;
    var pad = tile * 0.15;
    pat.setAttribute('width', tile + 2 * pad);
    pat.setAttribute('height', tile + 2 * pad);
    pat.setAttribute('x', '0');
    pat.setAttribute('y', '0');
    inner.setAttribute('transform', 'translate(' + pad + ' ' + pad + ')');
  }

  // 从隐藏平面 SVG 提取纹样，生成没有任何透明像素的贴图；固定底纹层永不进入。
  function buildArtDataUrl(svgEl, baseHex) {
    if (!svgEl) return null;
    try {
      var defs = svgEl.querySelector('defs');
      var art = svgEl.querySelector('rect[data-wx-art="1"]');
      if (!defs || !art) return null;
      var out = document.createElementNS(NS, 'svg');
      out.setAttribute('xmlns', NS);
      out.setAttribute('viewBox', '0 0 800 800');
      out.setAttribute('width', '1024');
      out.setAttribute('height', '1024');
      var defsC = defs.cloneNode(true);
      normalizePattern(defsC);
      out.appendChild(defsC);
      var bg = document.createElementNS(NS, 'rect');
      bg.setAttribute('x', '-400'); bg.setAttribute('y', '-400');
      bg.setAttribute('width', '1600'); bg.setAttribute('height', '1600');
      bg.setAttribute('fill', cssHex(baseHex));
      out.appendChild(bg);
      var fill = document.createElementNS(NS, 'rect');
      fill.setAttribute('x', '-400'); fill.setAttribute('y', '-400');
      fill.setAttribute('width', '1600'); fill.setAttribute('height', '1600');
      fill.setAttribute('fill', 'url(#studio-main)');
      var tf = art.getAttribute('transform');
      if (tf) fill.setAttribute('transform', tf);
      out.appendChild(fill);
      return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(new XMLSerializer().serializeToString(out));
    } catch (e) { return null; }
  }

  // ── 几何工具 ─────────────────────────────────────────────────────────────
  function mesh(geo, mat, x, y, z, rx, ry, rz) {
    var m = new THREE.Mesh(geo, mat);
    if (x !== undefined) m.position.set(x, y, z);
    if (rx !== undefined) m.rotation.set(rx, ry || 0, rz || 0);
    return m;
  }
  function pipe(points, mat, radius, segments) {
    var curve = new THREE.CatmullRomCurve3(points.map(function (p) {
      return new THREE.Vector3(p[0], p[1], p[2]);
    }));
    return new THREE.Mesh(new THREE.TubeGeometry(curve, segments || 36, radius || 0.05, 10, false), mat);
  }
  function roundRect(w, h, r) {
    var x = -w / 2, y = -h / 2, s = new THREE.Shape();
    s.moveTo(x + r, y);
    s.lineTo(x + w - r, y);
    s.quadraticCurveTo(x + w, y, x + w, y + r);
    s.lineTo(x + w, y + h - r);
    s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    s.lineTo(x + r, y + h);
    s.quadraticCurveTo(x, y + h, x, y + h - r);
    s.lineTo(x, y + r);
    s.quadraticCurveTo(x, y, x + r, y);
    return s;
  }
  // 顶部 UV 按 XY 包围盒；侧壁 UV 横向沿 X、纵向沿厚度，避免扭曲白带。
  function uvGen(minX, minY, w, h, depth) {
    function top(i, v) { return new THREE.Vector2((v[i * 3] - minX) / w, (v[i * 3 + 1] - minY) / h); }
    function side(i, v) {
      return new THREE.Vector2((v[i * 3] - minX) / w, (v[i * 3 + 2] + (depth || 0.3) / 2) / (depth || 0.3));
    }
    return {
      generateTopUV: function (g, v, a, b, c) { return [top(a, v), top(b, v), top(c, v)]; },
      generateSideWallUV: function (g, v, a, b, c, d) { return [side(a, v), side(b, v), side(c, v), side(d, v)]; }
    };
  }
  function extrude(shape, bounds, depth, bevel, front, side) {
    var g = new THREE.ExtrudeGeometry(shape, {
      depth: depth, bevelEnabled: bevel > 0, bevelThickness: bevel,
      bevelSize: bevel, bevelSegments: 3, curveSegments: 28,
      UVGenerator: uvGen(bounds[0], bounds[1], bounds[2], bounds[3], depth)
    });
    g.translate(0, 0, -depth / 2);
    return new THREE.Mesh(g, [front, side]);
  }
  // 自定义网格：顶点 + uv + 索引（伞面/折扇/帽檐/丝巾用）。
  function gridMesh(cols, rows, fn, mat) {
    var pos = [], uv = [], idx = [];
    for (var i = 0; i <= rows; i++) {
      for (var j = 0; j <= cols; j++) {
        var p = fn(i / rows, j / cols);
        pos.push(p[0], p[1], p[2]); uv.push(p[3], p[4]);
      }
    }
    for (var r = 0; r < rows; r++) {
      for (var c = 0; c < cols; c++) {
        var a = r * (cols + 1) + c, b = a + cols + 1;
        idx.push(a, b, a + 1, a + 1, b, b + 1);
      }
    }
    var g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    g.setIndex(idx);
    g.computeVertexNormals();
    return new THREE.Mesh(g, mat);
  }
  // 车削体；flatUV=true 时用 XZ 平面投影（盘面/帽冠顶面需要平面 UV）。
  function lathe(profile, mat, segs, flatUV, scale) {
    var g = new THREE.LatheGeometry(profile, segs || 56);
    if (flatUV) {
      var p = g.attributes.position, uv = g.attributes.uv, sc = scale || 3.4;
      for (var i = 0; i < p.count; i++) uv.setXY(i, p.getX(i) / sc + 0.5, p.getZ(i) / sc + 0.5);
    }
    return new THREE.Mesh(g, mat);
  }
  // 统一 UV 密度：把几何体 UV 按"物理尺寸"重算，保证不同大小的部件上纹样单元大小一致。
  // CylinderGeometry 默认 UV 是 u∈[0,1] 绕一圈、v∈[0,1] 沿高度；直接铺会让小部件纹样小、大部件纹样大。
  // 这里按周向长度和高度算重复次数（tilePhys=一个纹样单元对应的物理尺寸），做到等比平铺不拉伸。
  function scaleUV(geo, uRepeat, vRepeat, vFlip) {
    var uv = geo.attributes.uv;
    for (var i = 0; i < uv.count; i++) {
      var u = uv.getX(i) * uRepeat;
      var v = uv.getY(i) * vRepeat;
      uv.setXY(i, u, vFlip ? 1 - v : v);
    }
    uv.needsUpdate = true;
  }
  // 给 LatheGeometry 的侧壁算"柱面展开 UV"：u=绕周角度(按周长)，v=沿母线弧长(按高度)。
  // 替代会拉丝的 XZ 平面投影 flatUV，专用于帽冠这类垂直旋转体侧壁。
  function latheSideUV(geo, uRepeat, vRepeat) {
    var uv = geo.attributes.uv;
    for (var i = 0; i < uv.count; i++) {
      uv.setXY(i, uv.getX(i) * uRepeat, uv.getY(i) * vRepeat);
    }
    uv.needsUpdate = true;
  }
  // 扁平椭圆罗纹（领口/袖口）：Torus 压扁并落到 XY 平面。
  function ellipseRing(rx, ry, t, mat, x, y, z) {
    var m = mesh(new THREE.TorusGeometry(1, t, 8, 40), mat, x || 0, y || 0, z || 0);
    m.scale.set(rx, ry, 1);
    return m;
  }

  // ── 13 类载体专属几何 ──────────────────────────────────────────────────────
  function buildProduct(pid, M) {
    var g = new THREE.Group();
    var W = M.woodMat, A = M.accentMat, F = M.frontMat, B = M.backMat,
        D = M.sideMat, I = M.innerMat, C = M.fabricMat, T = M.trimMat;

    if (pid === 'roundFan') {
      var FR = 1.28;
      // 圆形绢面：正反双面印花，正面 F 背面 B，避免背面空白
      var face = new THREE.CircleGeometry(FR, 72);
      g.add(mesh(face, F, 0, 0.34, 0.03));
      var faceB = new THREE.CircleGeometry(FR, 72);
      var mb = mesh(faceB, B, 0, 0.34, -0.03);
      mb.rotation.y = Math.PI;
      g.add(mb);
      // 竹制外圈
      g.add(mesh(new THREE.TorusGeometry(FR, 0.035, 10, 80), C, 0, 0.34, 0));
      // 内描边细圈
      g.add(mesh(new THREE.TorusGeometry(FR * 0.955, 0.008, 8, 80), D, 0, 0.34, 0.04));
      // 扇柄（原木色圆柱），从扇面下缘向下
      g.add(mesh(new THREE.CylinderGeometry(0.065, 0.078, 1.15, 18), C, 0, -0.63, 0));
      // 柄头收尾
      g.add(mesh(new THREE.SphereGeometry(0.085, 16, 12), C, 0, -1.21, 0));
      // 柄与扇面连接箍
      g.add(mesh(new THREE.CylinderGeometry(0.095, 0.095, 0.12, 18), D, 0, -0.95, 0));
      // 扇穗：柄尾垂下一束丝线
      for (var fk = -4; fk <= 4; fk++) {
        var fx0 = fk * 0.018;
        g.add(pipe([[fx0, -1.26, 0], [fx0 * 1.4, -1.5, 0.01], [fx0 * 1.8 + Math.sin(fk) * 0.02, -1.72, 0]],
          fk % 2 === 0 ? T : C, 0.011, 10));
      }
      return { group: g, shadowY: -1.78, shadowR: 1.5 };
    } else if (pid === 'shawl') {
      var SW2 = 3.9, SH2 = 1.9;
      function shawlZ(u, v) {
        var px = (u - 0.5) * SW2, py = (v - 0.5) * SH2;
        var ex = Math.abs(u - 0.5) * 2;
        // 柔软垂坠大波浪 + 边缘微卷
        return 0.16 * Math.sin(px * 0.95 + 0.5) * Math.cos(py * 0.8)
             + 0.07 * Math.sin(py * 1.8 - px * 0.4)
             + 0.1 * Math.pow(ex, 4) * Math.sin(py * 2.2 + 0.3);
      }
      // 正面满印
      g.add(gridMesh(56, 30, function (v, u) {
        return [(u - 0.5) * SW2, (v - 0.5) * SH2, shawlZ(u, v), u, v];
      }, F));
      // 背面满印（反面 UV 水平翻转）
      g.add(gridMesh(56, 30, function (v, u) {
        return [(u - 0.5) * SW2, (v - 0.5) * SH2, shawlZ(u, v) - 0.035, 1 - u, v];
      }, B));
      // 两端流苏：短边外伸，成束细线
      for (var sk = -18; sk <= 18; sk++) {
        var sx = sk * (SW2 - 0.2) / 36;
        [-1, 1].forEach(function (sgn) {
          var edgeY = sgn * SH2 / 2;
          var sway = 0.03 * Math.sin(sk * 2.1 + sgn);
          g.add(pipe([
            [sx, edgeY, shawlZ((sx / SW2) + 0.5, sgn > 0 ? 1 : 0)],
            [sx + sway * 0.5, edgeY + sgn * 0.18, 0.08],
            [sx + sway, edgeY + sgn * 0.34, 0.04]
          ], C, 0.008, 10));
        });
      }
      return { group: g, shadowY: -0.42, shadowR: 2.0 };
    } else if (pid === 'vase') {
      // 陶瓷花瓶母线：底 -> 腹 -> 肩 -> 颈 -> 口沿
      var pts = [
        [0.0, -1.45], [0.42, -1.45], [0.62, -1.38], [0.78, -1.18],
        [0.95, -0.78], [1.05, -0.28], [1.02, 0.18], [0.86, 0.6],
        [0.62, 0.92], [0.5, 1.14], [0.48, 1.38], [0.56, 1.5],
        [0.56, 1.58], [0.46, 1.6]
      ];
      var profile = pts.map(function (q) { return new THREE.Vector2(q[0], q[1]); });
      var vaseGeo = new THREE.LatheGeometry(profile, 72);
      latheSideUV(vaseGeo, 2.2, 1.0);
      g.add(mesh(vaseGeo, F));
      // 内壁（深色）从口沿向下，保证口内不空白
      var innerPts = [[0.46, 1.6], [0.44, 1.4], [0.4, 1.0], [0.3, 0.5], [0.12, 0.0], [0.0, -0.2]];
      g.add(mesh(new THREE.LatheGeometry(innerPts.map(function(q){return new THREE.Vector2(q[0],q[1]);}), 48), I));
      // 口沿加厚圈
      g.add(mesh(new THREE.TorusGeometry(0.5, 0.035, 10, 56), D, 0, 1.59, 0, Math.PI / 2));
      // 圈足
      g.add(mesh(new THREE.CylinderGeometry(0.5, 0.46, 0.08, 48), D, 0, -1.47, 0));
      // 肩部装饰凸弦纹
      g.add(mesh(new THREE.TorusGeometry(0.88, 0.018, 8, 56), T, 0, 0.55, 0, Math.PI / 2));
      return { group: g, shadowY: -1.58, shadowR: 1.25 };
    } else if (pid === 'scarf' || pid === 'rug') {
      // 方巾（v22 对照 6 张参考重做）：约 1:1.85 长方形真丝巾，平滑连续大波浪褶皱，
      // 边缘自然微卷、双面印花、极薄无实心底板（参考为 beach_towel 式柔软丝绸布面）。
      if (pid === 'scarf') {
        var SW = 1.85, SH = 3.4;
        function silkZ(u, v) {
          var px = (u - 0.5) * SW, py = (v - 0.5) * SH;
          var ex = Math.abs(u - 0.5) * 2, ey = Math.abs(v - 0.5) * 2;
          // 主体：沿长边的平滑大波浪（约 3 个波峰）+ 横向缓坡交叉起伏
          var wave = 0.22 * Math.sin(py * 1.5 + 0.4) * Math.cos(px * 0.8)
                   + 0.12 * Math.sin(px * 2.1 - py * 0.5);
          // 边缘微卷：四边振幅逐渐增大，形成柔软丝绸的卷边
          var curl = 0.16 * Math.pow(ex, 5) * Math.sin(py * 1.9 + 0.8)
                   + 0.12 * Math.pow(ey, 5) * Math.sin(px * 2.3 - 0.3);
          return wave + curl;
        }
        g.add(gridMesh(56, 64, function (v, u) {
          return [(u - 0.5) * SW, (v - 0.5) * SH, silkZ(u, v), u, v];
        }, F));
        g.add(gridMesh(56, 64, function (v, u) {
          return [(u - 0.5) * SW, (v - 0.5) * SH, silkZ(u, v) - 0.03, 1 - u, v];
        }, B));
        // 极细窄卷边：贴着边缘起伏，不再是生硬粗滚边
        var edge = [];
        for (var e = 0; e <= 128; e++) {
          var t = e / 128, seg = Math.floor(t * 4), f = t * 4 - seg;
          var uu, vv;
          if (seg === 0) { uu = f; vv = 0; }
          else if (seg === 1) { uu = 1; vv = f; }
          else if (seg === 2) { uu = 1 - f; vv = 1; }
          else { uu = 0; vv = 1 - f; }
          edge.push([(uu - 0.5) * SW, (vv - 0.5) * SH, silkZ(uu, vv) - 0.008]);
        }
        g.add(pipe(edge, C, 0.012, 192));
        return { group: g, shadowY: -0.78, shadowR: 1.95 };
      }
      // 地毯（v22 对照 6 张参考重做）：约 3:1 宽幅薄毯、表面柔软起伏、短边微卷，
      // 两端各一排成束流苏（参考为细密浅色线穗，扁平略卷）。
      var rw = 4.4, rh = 1.62;
      // 毯面：极薄柔软，短边微卷，带低频自然褶皱
      g.add(gridMesh(48, 24, function (v, u) {
        var px = (u - 0.5) * rw, py = (v - 0.5) * rh;
        var edgeY = Math.abs(v - 0.5) * 2;
        var ripple = 0.035 * Math.sin(px * 1.4 + py * 0.9) * Math.cos(py * 1.7 - px * 0.5)
                   + 0.02 * Math.sin((px + py) * 2.4);
        var curl = 0.06 * Math.pow(edgeY, 4) * Math.sin(px * 2.2 + 0.6);
        return [px, py, 0.06 + ripple + curl, u, v];
      }, F));
      // 薄毯芯 + 底面印花（v26 修复俯视空白：毯芯整体下沉到起伏毯面之下，
      // 顶面 z=-0.02 低于毯面最低点≈0.005，杜绝纯色毯芯穿透印花面）
      g.add(mesh(new THREE.BoxGeometry(rw * 0.99, rh * 0.985, 0.03), D, 0, -0.035, 0));
      g.add(gridMesh(48, 24, function (v, u) {
        return [(u - 0.5) * rw, (v - 0.5) * rh, -0.062, 1 - u, v];
      }, B));
      // 流苏：两端短边各 25 束，每束 3 股细线，自然外伸微卷
      for (var k = -12; k <= 12; k++) {
        var fx = k * (rw - 0.3) / 24;
        [-1, 1].forEach(function (sgn) {
          var jit = Math.sin(k * 11.3 + sgn * 4.7);
          for (var strand = -1; strand <= 1; strand++) {
            var sx = fx + strand * 0.018;
            var len = 0.22 + 0.1 * Math.abs(jit);
            var sway = 0.045 * Math.sin(k * 3.1 + strand * 2.3 + sgn);
            g.add(pipe([
              [sx, sgn * (rh / 2 - 0.01), 0.06],
              [sx + sway * 0.5, sgn * (rh / 2 + len * 0.45), 0.07],
              [sx + sway, sgn * (rh / 2 + len), 0.055 + strand * 0.012]
            ], C, 0.009, 12));
          }
        });
      }
      return { group: g, shadowY: -0.28, shadowR: rw / 2 };
    } else if (pid === 'mug') {
      // 马克杯（v10）：杯身印花、加厚圆润口沿、内壁/杯底深色内衬、C 形把手从侧面伸出。
      var mugBody = new THREE.CylinderGeometry(0.95, 0.84, 2.1, 56, 1, true);
      scaleUV(mugBody, 2.4, 1.25);
      g.add(mesh(mugBody, F));
      // 内壁做锥形(上0.85/下0.72)，始终藏在外壁内侧；旧版等半径0.85 > 外壁底0.84 会穿出成黑环
      g.add(mesh(new THREE.CylinderGeometry(0.85, 0.72, 2.05, 56, 1, true), I));
      g.add(mesh(new THREE.CircleGeometry(0.72, 56), I, 0, -0.99, 0, Math.PI / 2));
      // 外底锥台：从外壁底缘(0.84,y=-1.05)收到圈足(0.72,y=-1.13)，封住环形缝隙，杜绝"脱底黑环"
      g.add(mesh(new THREE.CylinderGeometry(0.84, 0.72, 0.09, 56), C, 0, -1.095, 0));
      // 加厚口沿：一圈圆润的唇边（印花），覆盖内外壁接缝
      var lip = mesh(new THREE.TorusGeometry(0.9, 0.055, 10, 56), F, 0, 1.05, 0, Math.PI / 2);
      g.add(lip);
      // 圈足（贴合外底锥台底缘）
      g.add(mesh(new THREE.CylinderGeometry(0.72, 0.72, 0.06, 48), C, 0, -1.16, 0));
      // 把手：起点/终点在杯身右侧外壁，中段外扩成 C 形
      g.add(pipe([[0.9, 0.7, 0], [1.35, 0.8, 0], [1.68, 0.32, 0],
                  [1.66, -0.34, 0], [1.3, -0.74, 0], [0.88, -0.76, 0]], C, 0.14, 48));
      return { group: g, shadowY: -1.22, shadowR: 1.25 };
    } else if (pid === 'plate') {
      // 瓷盘：浅盘车削——宽平盘心 + 薄上翘盘沿 + 小圈足，绝不做成深碗/巨球。
      // 用单一材质的浅盘车削轮廓（r128 下 LatheGeometry 多材质数组会渲染异常）。
      var prof = [
        new THREE.Vector2(0, 0.0), new THREE.Vector2(0.7, 0.012),
        new THREE.Vector2(1.2, 0.05), new THREE.Vector2(1.48, 0.14),
        new THREE.Vector2(1.56, 0.16), new THREE.Vector2(1.56, 0.12),
        new THREE.Vector2(1.42, 0.03), new THREE.Vector2(0.9, -0.1),
        new THREE.Vector2(0.88, -0.2), new THREE.Vector2(0.72, -0.2)
      ];
      g.add(lathe(prof, F, 72, true, 3.3));
      // 盘沿描金 + 内壁一道细金环（层次感）
      g.add(mesh(new THREE.TorusGeometry(1.5, 0.022, 8, 72), A, 0, 0.15, 0, Math.PI / 2));
      g.add(mesh(new THREE.TorusGeometry(1.15, 0.01, 6, 72), A, 0, 0.05, 0, Math.PI / 2));
      // 圈足
      g.add(mesh(new THREE.CylinderGeometry(0.74, 0.76, 0.09, 48), C, 0, -0.24, 0));
      return { group: g, shadowY: -0.34, shadowR: 1.7 };

    } else if (pid === 'phone') {
      // 手机壳：圆角实体壳（背面印花、侧面底色），正面内凹屏幕 + 摄像头模组。
      g.add(extrude(roundRect(1.95, 3.55, 0.34), [-0.975, -1.775, 1.95, 3.55], 0.3, 0.06, F, D));
      // 背面片（印花贴背上，正对观察者）
      g.add(mesh(new THREE.PlaneGeometry(1.82, 3.42), F, 0, 0, 0.2));
      // 正面屏幕凹槽（深色，朝背面）
      g.add(mesh(new THREE.PlaneGeometry(1.6, 3.1), I, 0, 0, -0.2, 0, Math.PI, 0));
      // 摄像头模组（精修）：圆角镜片台 + 三颗镜头（黑镜+反光环）+ 闪光灯
      var camBase = extrude(roundRect(0.82, 0.82, 0.18), [-0.41, -0.41, 0.82, 0.82], 0.06, 0.025, C, D);
      camBase.position.set(-0.5, 1.28, 0.25);
      g.add(camBase);
      [[-0.72, 1.5], [-0.28, 1.5], [-0.72, 1.06]].forEach(function (p) {
        // 镜圈
        g.add(mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.04, 22), A, p[0], p[1], 0.3, Math.PI / 2));
        // 镜片（深色）
        g.add(mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.05, 22), I, p[0], p[1], 0.315, Math.PI / 2));
        // 反光点
        g.add(mesh(new THREE.CircleGeometry(0.035, 12), C, p[0] - 0.035, p[1] + 0.035, 0.342, 0, 0, Math.PI));
      });
      // 闪光灯
      g.add(mesh(new THREE.CircleGeometry(0.06, 16), C, -0.28, 1.06, 0.3, 0, 0, Math.PI));
      return { group: g, shadowY: -2.0, shadowR: 1.2 };

    } else if (pid === 'cushion') {
      // 抱枕（v22 对照 8 张参考重做）：宽矩形枕面、四角尖角外翘、上下边中段内凹、
      // 中间厚向尖角收薄（侧视纺锤形）、前后两片印花布沿轮廓中缝缝合。
      var CW = 1.72, CH = 1.06;   // 半宽 / 半高，宽高比 ≈1.62（参考为宽枕，不是方枕）
      // 轮廓变形：角外翘 + 边中内凹。整片曲面与缝线共用同一函数，保证边缘严丝合缝。
      function cushionXY(u, v) {
        var ex = Math.abs(u - 0.5) * 2, ey = Math.abs(v - 0.5) * 2;
        var corner = Math.pow(ex * ey, 2.2);
        var midY = Math.pow(1 - ey, 2) * ex;   // 上下边中段
        var midX = Math.pow(1 - ex, 2) * ey;   // 左右边中段
        var x = (u - 0.5) * 2 * CW * (1 + 0.1 * corner - 0.025 * midX);
        var y = (v - 0.5) * 2 * CH * (1 + 0.16 * corner - 0.06 * midY);
        return [x, y];
      }
      // 厚度：沿 x 向两端收尖、沿 y 向上下边收薄，中央最厚，带轻微布褶
      function cushionZ(u, v) {
        var p = cushionXY(u, v);
        var ax = Math.min(0.999, Math.abs(p[0]) / (CW * 1.08));
        var taperX = Math.pow(Math.max(0, 1 - Math.pow(ax, 3.1)), 0.62);
        var taperY = 0.5 + 0.5 * Math.sin(Math.PI * v);
        var wrinkle = 0.02 * Math.sin(u * Math.PI * 3.1) * Math.sin(v * Math.PI * 2.4)
                    + 0.012 * Math.cos((u + v) * Math.PI * 4.3);
        return 0.045 + 0.42 * taperX * taperY + wrinkle * taperX;
      }
      // 前后两片印花布面
      g.add(gridMesh(40, 32, function (v, u) {
        var p = cushionXY(u, v);
        return [p[0], p[1], cushionZ(u, v), u, v];
      }, F));
      g.add(gridMesh(40, 32, function (v, u) {
        var p = cushionXY(u, v);
        return [p[0], p[1], -cushionZ(u, v), 1 - u, v];
      }, B));
      // 侧围：沿四边采样连接前后片，形成完整纺锤形枕体（不再是露出的椭球芯）
      var loop = [];
      for (var e = 0; e <= 96; e++) {
        var t = e / 96;
        if (t <= 0.25) loop.push([t * 4, 0]);
        else if (t <= 0.5) loop.push([1, (t - 0.25) * 4]);
        else if (t <= 0.75) loop.push([1 - (t - 0.5) * 4, 1]);
        else loop.push([0, 1 - (t - 0.75) * 4]);
      }
      g.add(gridMesh(96, 6, function (w, t) {
        var uv = loop[Math.min(96, Math.round(t * 96))];
        var p = cushionXY(uv[0], uv[1]);
        return [p[0], p[1], cushionZ(uv[0], uv[1]) * (1 - 2 * w), t * 3.2, w * 0.26];
      }, F));
      // 水平中缝：参考侧视可见的一圈接缝
      var seam = loop.map(function (uv) {
        var p = cushionXY(uv[0], uv[1]);
        return [p[0], p[1], 0];
      });
      g.add(pipe(seam, C, 0.012, 192));
      return { group: g, shadowY: -1.18, shadowR: 1.95 };
    } else if (pid === 'notebook') {
      // 笔记本（v20 对照参考图重做）：黑色圆角硬壳双封面 + 层叠乳白纸页 + 灰色织带松紧环
      // + 深色布面书脊 + 从书口伸出的黑色书签丝带。封面/封底仍贴用户纹样（产品核心不碰）。
      var PM = M.paperMat, EM = M.elasticMat, BC = M.bookclothMat;
      var NW = 2.5, NH = 3.35, NR = 0.16;
      var FRONT_Z = 0.17;    // 前封面中心：表面 z≈0.27
      var BACK_Z = -0.25;    // 后封面中心：背面 z≈-0.35
      // ── 前封面：圆角硬壳，正面贴用户纹样 F，包边用深色布面 BC ──
      g.add(extrude(roundRect(NW, NH, NR), [-NW / 2, -NH / 2, NW, NH], 0.2, 0.035, F, BC));
      var front = g.children[g.children.length - 1];
      front.position.z = FRONT_Z - 0.1; // extrude 已居中 z=0，前表面 = pos.z+0.1
      // ── 后封面：背面贴纹样 B，包边布面 BC ──
      g.add(extrude(roundRect(NW, NH, NR), [-NW / 2, -NH / 2, NW, NH], 0.2, 0.035, B, BC));
      var back = g.children[g.children.length - 1];
      back.position.z = BACK_Z + 0.1; // 后表面 = pos.z-0.1
      // ── 层叠纸页：24 张极薄乳白片，四周内缩露出硬壳边；侧面自然形成分层纸纹 ──
      var PW = 2.3, PH = 3.15, SHEETS = 24;
      var pz0 = BACK_Z + 0.1, pz1 = FRONT_Z - 0.1; // 前后封面内表面之间
      for (var s = 0; s < SHEETS; s++) {
        var zz = pz0 + (pz1 - pz0) * (s + 0.5) / SHEETS;
        // 每隔 3 张夹一张略深的纸边，侧面呈清晰的分层细线（参考图纸张层叠感）
        var sm = (s % 3 === 0) ? C : PM;
        g.add(mesh(new THREE.BoxGeometry(PW, PH, (pz1 - pz0) / SHEETS * 0.82), sm, 0.06, 0, zz));
      }
      // ── 布面书脊：左侧沿 Y 的半圆柱，弧面朝左凸出，连接前后封面 ──
      g.add(mesh(new THREE.CylinderGeometry(0.19, 0.19, NH - 0.06, 28), BC, -NW / 2 + 0.02, 0, (FRONT_Z + BACK_Z) / 2 - 0.04));
      // ── 灰色织带松紧环：竖向偏右，从前封面绕过顶/底到下封面，环形闭合 ──
      var EX = 0.62, EW = 0.13;
      var zTop = FRONT_Z + 0.11, zBot = BACK_Z - 0.11;
      // 前段（贴在封面表面）
      g.add(mesh(new THREE.BoxGeometry(EW, NH - 0.12, 0.028), EM, EX, 0, zTop));
      // 后段（贴在封底背面）
      g.add(mesh(new THREE.BoxGeometry(EW, NH - 0.12, 0.028), EM, EX, 0, zBot));
      // 顶/底跨接段：绕过硬壳顶缘与底缘
      g.add(mesh(new THREE.BoxGeometry(EW, 0.028, zTop - zBot), EM, EX, NH / 2 - 0.03, (zTop + zBot) / 2));
      g.add(mesh(new THREE.BoxGeometry(EW, 0.028, zTop - zBot), EM, EX, -NH / 2 + 0.03, (zTop + zBot) / 2));
      // ── 书签丝带：从顶端夹缝伸出一小截、贴在封面上垂下 1/3，末端燕尾（贴合参考图）──
      var ribbonZ = zTop + 0.02, RX = -0.82;
      g.add(mesh(new THREE.BoxGeometry(0.1, 1.05, 0.016), BC, RX, NH / 2 - 0.52, ribbonZ));
      var rtail = new THREE.Shape();
      rtail.moveTo(-0.05, 0.08); rtail.lineTo(0.05, 0.08); rtail.lineTo(0, -0.09); rtail.closePath();
      g.add(mesh(new THREE.ShapeGeometry(rtail), BC, RX, NH / 2 - 1.1, ribbonZ + 0.001));
      // 顶部夹缝里露出的带头
      g.add(mesh(new THREE.BoxGeometry(0.1, 0.12, 0.02), BC, RX, NH / 2 + 0.02, ribbonZ - 0.01));
      return { group: g, shadowY: -2.0, shadowR: 1.5 };

    } else if (pid === 'umbrella') {
      // 晴雨伞（v19 对照参考图重做）：饱满圆弧伞面 + 扇贝波浪边 + 银灰金属主骨/副骨
      // + 黑色中棒 + 滑环开关 + 多层金属伞帽 + 粗壮 J 形弯钩柄。纹样仍由用户纹样 F 决定。
      var R = 1.95, cy = 1.62, PANELS = 8, DROP = 0.98;
      var UM = M.umbrellaMetal, US = M.umbrellaShaft;
      // 伞面高度曲线：平滑圆弧穹顶（参考实物为圆顶而非尖斗笠），中心高、边缘缓降。
      function canopyY(v) { return cy - DROP * Math.pow(v, 1.55); }
      // 每瓣轮廓半径：浅扇贝边——瓣中央略下垂、瓣缝处微凸，避免深波浪锯齿感。
      function scallop(u, v) { return 1 - 0.035 * Math.cos((u - 0.5) * Math.PI * 2) * Math.pow(v, 3); }
      // 伞面：按瓣生成，正反面都是纹样（F 双面材质），边缘扇贝清晰。
      for (var pn = 0; pn < PANELS; pn++) {
        (function (idx) {
          var a0 = idx / PANELS * Math.PI * 2, a1 = (idx + 1) / PANELS * Math.PI * 2;
          g.add(gridMesh(12, 12, function (v, u) {
            var ang = a0 + (a1 - a0) * u;
            var rr = R * v * scallop(u, v);
            var yy = canopyY(v);
            // 瓣中央略低、折痕(伞骨)处略高，撑出布料起伏（幅度小，避免锯齿）。
            yy -= 0.035 * Math.sin(u * Math.PI) * Math.pow(v, 1.1);
            return [rr * Math.cos(ang), yy, rr * Math.sin(ang),
              idx / PANELS + u / PANELS, v];
          }, F));
        })(pn);
      }
      // 伞骨骨架：沿每瓣的分缝（折痕线）走，位于伞布内侧（y 略低 0.02），银灰金属。
      var ribRadii = [0.0, 0.26, 0.52, 0.78, 1.0];
      for (var rb = 0; rb < PANELS; rb++) {
        var ang = rb / PANELS * Math.PI * 2;
        var pts = ribRadii.map(function (v) {
          // 折痕线在 u=0 处，scallop(0,v) 为尖角；下沉 0.075 藏进伞布内侧，俯视不穿透伞面。
          var rr = R * v * scallop(0, v) - 0.02;
          return [rr * Math.cos(ang), canopyY(v) - 0.075, rr * Math.sin(ang)];
        });
        g.add(pipe(pts, UM, 0.015, 26));
        // 副骨撑杆：从中部主骨斜撑向中棒上的滑环，仰视可见三角支撑（参考图细节）。
        var midV = 0.52, midR = R * midV * scallop(0, midV) - 0.02;
        var collarY = cy - DROP * 0.72;
        g.add(pipe([
          [midR * Math.cos(ang), canopyY(midV) - 0.075, midR * Math.sin(ang)],
          [midR * 0.52 * Math.cos(ang), (canopyY(midV) + collarY) * 0.5 - 0.075, midR * 0.52 * Math.sin(ang)],
          [0.075 * Math.cos(ang), collarY, 0.075 * Math.sin(ang)]
        ], UM, 0.01, 20));
      }
      // 中棒：缩短到与伞面协调的比例（顶部≈1.62，底部≈-1.62），避免手柄过长顶到画布底。
      g.add(mesh(new THREE.CylinderGeometry(0.042, 0.046, 3.24, 14), US, 0, 0, 0));
      // 滑环开关：中棒上的金属滑套 + 按钮。
      var collarY2 = cy - DROP * 0.72;
      g.add(mesh(new THREE.CylinderGeometry(0.085, 0.085, 0.14, 16), UM, 0, collarY2, 0));
      g.add(mesh(new THREE.BoxGeometry(0.06, 0.1, 0.05), UM, 0, collarY2 + 0.14, 0.07));
      // 多层金属伞帽：底座圆盘 + 塔身 + 尖顶。
      g.add(mesh(new THREE.CylinderGeometry(0.16, 0.18, 0.06, 18), UM, 0, cy + 0.005, 0));
      g.add(mesh(new THREE.CylinderGeometry(0.095, 0.12, 0.16, 16), UM, 0, cy + 0.11, 0));
      g.add(mesh(new THREE.ConeGeometry(0.055, 0.24, 14), UM, 0, cy + 0.31, 0));
      // J 形握把：参考实物为扁平宽带（正面宽、侧面薄），顶端有黑色圆柱连接套。
      g.add(mesh(new THREE.CylinderGeometry(0.072, 0.078, 0.2, 16), US, 0, -1.65, 0));
      var handle = pipe([
        [0, -1.69, 0], [0, -1.91, 0], [0.06, -2.13, 0],
        [0.2, -2.25, 0], [0.38, -2.24, 0], [0.5, -2.11, 0], [0.53, -1.93, 0]
      ], US, 0.095, 40);
      handle.scale.z = 0.42; // 压扁成带宽面朝前的扁带，而非圆管
      g.add(handle);
      return { group: g, shadowY: -2.4, shadowR: 1.85 };
    } else if (pid === 'fan') {
      // 折扇（用户认可，保持不变）：细分扇面折痕起伏，扇骨移到纸背后，正背都有纹样。
      var FR = 2.7, fcy = -1.55, a0 = Math.PI * 0.19, a1 = Math.PI * 0.81;
      g.add(gridMesh(48, 12, function (v, u) {
        var a = a0 + (a1 - a0) * u, rr = FR * v;
        var zz = 0.06 * Math.sin(u * Math.PI * 10);
        return [rr * Math.cos(a), fcy + rr * Math.sin(a), zz, u, v];
      }, F));
      // 扇骨：11 根竹骨，扇面背后放射排布；外侧两根大骨更粗更长
      for (var t = 0; t <= 10; t++) {
        var ang = a0 + (a1 - a0) * t / 10;
        var isEdge = (t === 0 || t === 10);
        var bl = FR * (isEdge ? 1.0 : 0.94);
        var bw = isEdge ? 0.055 : 0.032;
        g.add(mesh(new THREE.BoxGeometry(bl, bw, bw), W,
          bl * 0.5 * Math.cos(ang), fcy + bl * 0.5 * Math.sin(ang), -0.075,
          0, 0, ang));
      }
      // 扇钉 + 尾部流苏装饰
      g.add(mesh(new THREE.SphereGeometry(0.11, 14, 10), A, 0, fcy, -0.1));
      g.add(pipe([[0, fcy - 0.1, -0.1], [0.04, fcy - 0.35, -0.06], [0.02, fcy - 0.55, -0.02]], A, 0.02, 16));
      return { group: g, shadowY: -1.85, shadowR: 1.4 };

    } else if (pid === 'hat') {
      // 渔夫帽（精修）：帽冠 + 帽檐 + 帽壁所有外露面积全部铺满纹样；只有内腔用深色（用户允许内部不填充）。
      // 关键修复：旧版帽檐用纯色 fabricMat(C)，导致一大圈米白无纹样；这里帽冠/帽檐/帽壁统一用 F 印花，
      // 并用"平面投影 UV"保证帽檐上的纹样密度与帽冠一致、接缝处不错乱。
      var crown = [
        new THREE.Vector2(0, 0.88), new THREE.Vector2(0.52, 0.86),
        new THREE.Vector2(0.8, 0.72), new THREE.Vector2(0.94, 0.12),
        new THREE.Vector2(0.98, -0.40)
      ];
      var crownMesh = lathe(crown, F, 64, false);
      latheSideUV(crownMesh.geometry, 3.2, 1.15);
      g.add(crownMesh);
      // 帽壁下段（冠底到帽檐根部的短竖段），同样铺印花
      var band = new THREE.CylinderGeometry(0.98, 0.99, 0.22, 64, 1, true);
      scaleUV(band, 3.2, 0.13);
      g.add(mesh(band, F, 0, -0.5, 0));
      // 帽檐：从帽壁向外平滑下倾的环面。平面投影 UV（按 XZ 铺）→ 纹样不被拉成条。
      g.add(gridMesh(72, 12, function (v, u) {
        var a = u * Math.PI * 2, rr = 0.99 + v * 0.62;
        var yy = -0.6 - 0.24 * Math.pow(v, 1.5);
        return [rr * Math.cos(a), yy, rr * Math.sin(a),
          rr * Math.cos(a) / 2.2 + 0.5, rr * Math.sin(a) / 2.2 + 0.5];
      }, F));
      // 帽檐仅一片曲面（运行时材质 DoubleSide，正反都铺印花）；不再叠第二片，避免 z-fighting。
      // 帽檐包边（细滚边，收口不毛糙）
      g.add(mesh(new THREE.TorusGeometry(1.61, 0.028, 8, 72), C, 0, -0.84, 0, Math.PI / 2));
      // 内腔：唯一不填纹样的部分（深色），从下方看有厚度
      var inner = [
        new THREE.Vector2(0, 0.79), new THREE.Vector2(0.5, 0.77),
        new THREE.Vector2(0.76, 0.64), new THREE.Vector2(0.9, 0.08),
        new THREE.Vector2(0.94, -0.6)
      ];
      g.add(lathe(inner, I, 56, false));
      // 帽带：冠底一圈细带（纯色，作为结构收边）
      g.add(mesh(new THREE.TorusGeometry(0.975, 0.05, 8, 64), C, 0, -0.38, 0, Math.PI / 2));
      // 帽冠放射状缝线（从帽顶到帽带，8 条）+ 帽顶收口
      for (var hs = 0; hs < 8; hs++) {
        var ha = hs / 8 * Math.PI * 2;
        g.add(pipe([
          [0.06 * Math.cos(ha), 0.88, 0.06 * Math.sin(ha)],
          [0.5 * Math.cos(ha), 0.83, 0.5 * Math.sin(ha)],
          [0.82 * Math.cos(ha), 0.68, 0.82 * Math.sin(ha)],
          [0.96 * Math.cos(ha), 0.05, 0.96 * Math.sin(ha)],
          [0.98 * Math.cos(ha), -0.34, 0.98 * Math.sin(ha)]
        ], C, 0.012, 40));
      }
      g.add(mesh(new THREE.SphereGeometry(0.07, 14, 10), F, 0, 0.89, 0));
      // 帽冠两侧透气孔（金属环）
      [-1, 1].forEach(function (sgn) {
        g.add(mesh(new THREE.TorusGeometry(0.06, 0.014, 8, 18), A, sgn * 0.72, 0.4, 0.62, 0, sgn * 0.5, 0));
      });
      // 帽檐双压线（两圈同心）
      [1.32, 1.55].forEach(function (rr) {
        g.add(mesh(new THREE.TorusGeometry(rr, 0.012, 6, 72), C, 0, -0.66 - (rr - 0.99) * 0.34, 0, Math.PI / 2));
      });
      return { group: g, shadowY: -1.08, shadowR: 1.85 };
    }

    // 兜底：未知 ID 用带厚度的盒子，避免白屏。
    g.add(mesh(new THREE.BoxGeometry(2.5, 2.9, 0.7), [D, D, D, D, F, B]));
    return { group: g, shadowY: -1.62, shadowR: 1.45 };
  }

  // ── 场景 ─────────────────────────────────────────────────────────────────
  function buildScene(host, pid) {
    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
    camera.position.set(0, 0, 8.6);
    var renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, preserveDrawingBuffer: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setClearColor(0x000000, 0);
    host.appendChild(renderer.domElement);
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    renderer.domElement.style.display = 'block';
    renderer.domElement.style.touchAction = 'none';

    // ── v13 影像级色彩管线 ──────────────────────────────────────────────
    // 参考产品级 3D 渲染规范：sRGB 输出 + ACES 电影色调映射，解决旧版
    // 「贴图按 sRGB 解码、却用线性输出」导致的整体发灰/高光烧白问题。
    // 全部包 try/catch：任何设备不支持时静默降级到原渲染，绝不白屏。
    try {
      renderer.outputEncoding = THREE.sRGBEncoding;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 0.88;
    } catch (e) {}

    // 程序化「中性影棚」环境贴图（上亮下暗 + 两处柔光箱），经 PMREM 卷积后
    // 作为 scene.environment，让陶瓷/描金/塑料产生真实反射而非塑料感。
    // 这是网络调研确认的「决定产品真实感的关键」，且无需外部 HDR 文件（离线可用）。
    try {
      var envCanvas = document.createElement('canvas');
      envCanvas.width = 512; envCanvas.height = 256;
      var ec = envCanvas.getContext('2d');
      var eg = ec.createLinearGradient(0, 0, 0, 256);
      eg.addColorStop(0.0, '#ffffff');
      eg.addColorStop(0.42, '#eceae5');
      eg.addColorStop(0.52, '#cfcbc2');
      eg.addColorStop(1.0, '#7a746a');
      ec.fillStyle = eg; ec.fillRect(0, 0, 512, 256);
      // 两处柔光箱亮斑（主光 + 侧光），提供柔和的高光条
      function softbox(cx, cy, rx, ry, a) {
        ec.save(); ec.translate(cx, cy); ec.scale(1, ry / rx);
        var rg = ec.createRadialGradient(0, 0, 0, 0, 0, rx);
        rg.addColorStop(0, 'rgba(255,255,255,' + a + ')');
        rg.addColorStop(1, 'rgba(255,255,255,0)');
        ec.fillStyle = rg; ec.beginPath(); ec.arc(0, 0, rx, 0, Math.PI * 2); ec.fill(); ec.restore();
      }
      softbox(150, 62, 96, 58, 0.95);
      softbox(392, 80, 66, 44, 0.55);
      var envTex = new THREE.CanvasTexture(envCanvas);
      envTex.mapping = THREE.EquirectangularReflectionMapping;
      envTex.encoding = THREE.sRGBEncoding;
      var pmrem = new THREE.PMREMGenerator(renderer);
      S.envRT = pmrem.fromEquirectangular(envTex);
      scene.environment = S.envRT.texture;
      envTex.dispose();
      pmrem.dispose();
    } catch (e) { S.envRT = null; }

    // v14 柔和三点布光：再降环境/补光，让浅色载体不再被照成"白塑料"，同时保留体积。
    scene.add(new THREE.AmbientLight(0xffffff, 0.36));
    scene.add(new THREE.HemisphereLight(0xffffff, 0x777066, 0.32));
    var key = new THREE.DirectionalLight(0xfff6ea, 0.82);
    key.position.set(3.5, 5.5, 6);
    scene.add(key);
    var fill = new THREE.DirectionalLight(0xdfe8ff, 0.24);
    fill.position.set(-4, 1, -5);
    scene.add(fill);
    var rim = new THREE.DirectionalLight(0xffffff, 0.22);
    rim.position.set(-2, 3, -6);
    scene.add(rim);

    var ds = THREE.DoubleSide;
    // v13 PBR 分档（依据产品渲染规范的材质参数表）：
    // 布料/纸品 = 高粗糙度哑光、环境反射弱；陶瓷 = 上釉半光泽；塑料 = 低粗糙度；金属 = 高 metalness。
    var M = {
      sideMat: new THREE.MeshStandardMaterial({ color: 0xdbcfb8, roughness: 0.96, metalness: 0, side: ds, envMapIntensity: 0.28 }),
      frontMat: new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.96, metalness: 0, side: ds, envMapIntensity: 0.35 }),
      backMat: new THREE.MeshStandardMaterial({ color: 0xdbcfb8, roughness: 0.96, metalness: 0, side: ds, envMapIntensity: 0.28 }),
      innerMat: new THREE.MeshStandardMaterial({ color: 0xaa9e88, roughness: 0.94, metalness: 0, side: ds, envMapIntensity: 0.24 }),
      fabricMat: new THREE.MeshStandardMaterial({ color: 0xcfc2a8, roughness: 0.97, metalness: 0, side: ds, envMapIntensity: 0.28 }),
      woodMat: new THREE.MeshStandardMaterial({ color: 0x6a4b32, roughness: 0.8, metalness: 0, envMapIntensity: 0.4 }),
      accentMat: new THREE.MeshStandardMaterial({ color: 0xb79468, roughness: 0.28, metalness: 0.85, envMapIntensity: 1.1 }),
      // 托特包专用：黑色包边/织带（固定深色，不随配色变），帆布哑光。
      trimMat: new THREE.MeshStandardMaterial({ color: 0x12100f, roughness: 0.92, metalness: 0, side: ds, envMapIntensity: 0.18 }),
      // 晴雨伞专用：银灰金属伞骨/伞帽（参考图的金属骨架），黑色中棒/弯钩柄。
      umbrellaMetal: new THREE.MeshStandardMaterial({ color: 0x9b9a96, roughness: 0.38, metalness: 0.78, envMapIntensity: 0.95 }),
      umbrellaShaft: new THREE.MeshStandardMaterial({ color: 0x161615, roughness: 0.62, metalness: 0.25, envMapIntensity: 0.5 }),
      // 笔记本专用：乳白层叠纸页、灰色织带松紧带、深色布面书脊。
      paperMat: new THREE.MeshStandardMaterial({ color: 0xf4f1e8, roughness: 0.97, metalness: 0, side: ds, envMapIntensity: 0.22 }),
      elasticMat: new THREE.MeshStandardMaterial({ color: 0x56534f, roughness: 0.95, metalness: 0, envMapIntensity: 0.22 }),
      bookclothMat: new THREE.MeshStandardMaterial({ color: 0x35322f, roughness: 0.9, metalness: 0, envMapIntensity: 0.3 })
    };

    // 陶瓷（马克杯/瓷盘）：哑光釉面 roughness≈0.75（网络规范 0.7–0.9），非塑料高光。
    if (pid === 'mug' || pid === 'plate') {
      M.frontMat.roughness = 0.72; M.frontMat.metalness = 0.02; M.frontMat.envMapIntensity = 0.85;
      M.sideMat.roughness = 0.74; M.sideMat.envMapIntensity = 0.8;
      M.innerMat.roughness = 0.68; M.innerMat.envMapIntensity = 0.7;
    }
    // 手机壳：v14 改为更自然的细磨砂塑料，避免浅色边像半透明玩具。
    if (pid === 'phone') {
      M.frontMat.roughness = 0.44; M.frontMat.envMapIntensity = 0.5;
      M.sideMat.roughness = 0.52; M.sideMat.envMapIntensity = 0.45;
    }

    var built = buildProduct(pid, M);
    var group = built.group;
    scene.add(group);

    // v13 柔和接触阴影：径向渐变的 canvas 贴图替代生硬的纯色椭圆饼，
    // 中心深、边缘自然淡出，更接近产品级渲染的落地阴影。
    var shadow;
    try {
      var sc = document.createElement('canvas');
      sc.width = sc.height = 128;
      var sx = sc.getContext('2d');
      var sg = sx.createRadialGradient(64, 64, 3, 64, 64, 62);
      sg.addColorStop(0, 'rgba(28,26,22,0.30)');
      sg.addColorStop(0.45, 'rgba(28,26,22,0.13)');
      sg.addColorStop(1, 'rgba(28,26,22,0)');
      sx.fillStyle = sg; sx.fillRect(0, 0, 128, 128);
      var stex = new THREE.CanvasTexture(sc);
      shadow = new THREE.Mesh(
        new THREE.PlaneGeometry(built.shadowR * 2.3, built.shadowR * 2.3),
        new THREE.MeshBasicMaterial({ map: stex, transparent: true, opacity: 0.82, depthWrite: false })
      );
    } catch (e) {
      shadow = new THREE.Mesh(
        new THREE.CircleGeometry(built.shadowR, 40),
        new THREE.MeshBasicMaterial({ color: 0x1c1a16, transparent: true, opacity: 0.16, depthWrite: false })
      );
    }
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.set(0, built.shadowY, 0);
    shadow.scale.set(1, 0.34, 1);
    scene.add(shadow);
    S.shadowTex = shadow.material.map || null;

    // 初始视角：给足俯角与侧转，第一眼就能看出立体体积（而非一条平边）。
    // 平铺类（瓷盘/地毯/方巾）俯角更大；其余载体用中等俯角展现厚度与顶部细节。
    if (pid === 'plate' || pid === 'rug' || pid === 'scarf') {
      S.target.rx = -0.62; S.target.ry = -0.34;
    } else if (pid === 'umbrella' || pid === 'fan') {
      S.target.rx = -0.16; S.target.ry = -0.3;
    } else {
      S.target.rx = -0.26; S.target.ry = -0.34;
    }
    group.rotation.x = S.target.rx;
    group.rotation.y = S.target.ry;

    function resize() {
      var w = host.clientWidth || 600, h = host.clientHeight || 600;
      renderer.setSize(w, h, false);
      var aspect = w / h;
      camera.aspect = aspect;
      // v21 屏幕自适应：容器变窄（竖屏 / 分屏）时水平视野随之变窄，
      // 按宽高比补偿相机距离，保证任意屏幕比例下模型都完整入镜、不被裁切。
      var dist = 8.6;
      if (aspect < 1) dist = 8.6 / Math.max(0.55, aspect);
      else if (aspect > 1.6) dist = 8.6 * (1 - Math.min(0.16, (aspect - 1.6) * 0.1));
      S.baseDist = dist;
      camera.position.set(0, 0, dist * (S.zoom || 1));
      camera.updateProjectionMatrix();
    }
    resize();
    var ro = new ResizeObserver(resize);
    ro.observe(host);

    function loop() {
      S.raf = requestAnimationFrame(loop);
      group.rotation.x += (S.target.rx - group.rotation.x) * 0.14;
      group.rotation.y += (S.target.ry - group.rotation.y) * 0.14;
      renderer.render(scene, camera);
    }
    loop();

    S.host = host; S.renderer = renderer; S.scene = scene; S.camera = camera;
    S.group = group; S.frontMat = M.frontMat; S.backMat = M.backMat;
    S.sideMat = M.sideMat; S.innerMat = M.innerMat; S.fabricMat = M.fabricMat;
    S.woodMat = M.woodMat; S.accentMat = M.accentMat; S.trimMat = M.trimMat;
    S.umbrellaMetal = M.umbrellaMetal; S.umbrellaShaft = M.umbrellaShaft;
    S.paperMat = M.paperMat; S.elasticMat = M.elasticMat; S.bookclothMat = M.bookclothMat;
    S.ro = ro; S.ready = true;
  }

  function dispose() {
    if (S.raf) cancelAnimationFrame(S.raf);
    if (S.ro) S.ro.disconnect();
    if (S.group) {
      S.group.traverse(function (o) { if (o.geometry) o.geometry.dispose(); });
      [S.frontMat, S.backMat, S.sideMat, S.innerMat, S.fabricMat, S.woodMat, S.accentMat, S.trimMat, S.umbrellaMetal, S.umbrellaShaft, S.paperMat, S.elasticMat, S.bookclothMat].forEach(function (m) {
        if (m) { m.map = null; m.dispose(); }
      });
    }
    if (S.renderer) {
      S.renderer.dispose();
      if (S.renderer.domElement && S.renderer.domElement.parentNode) {
        S.renderer.domElement.parentNode.removeChild(S.renderer.domElement);
      }
    }
    if (S.envRT) { try { S.envRT.dispose(); } catch (e) {} S.envRT = null; }
    if (S.scene) { S.scene.environment = null; }
    if (S.shadowTex) { S.shadowTex.dispose(); S.shadowTex = null; }
    if (S.tex) { S.tex.dispose(); S.tex = null; }
    S.ready = false; S.host = null; S.group = null;
  }

  function bindDrag() {
    var canvas = S.renderer.domElement;
    canvas.style.cursor = 'grab';
    canvas.addEventListener('pointerdown', function (e) {
      S.drag = true; S.lx = e.clientX; S.ly = e.clientY;
      canvas.setPointerCapture(e.pointerId);
      canvas.style.cursor = 'grabbing';
    });
    canvas.addEventListener('pointermove', function (e) {
      if (!S.drag) return;
      S.target.ry += (e.clientX - S.lx) * 0.009;
      S.target.rx += (e.clientY - S.ly) * 0.008;
      S.target.rx = Math.max(-1.2, Math.min(1.2, S.target.rx));
      S.lx = e.clientX; S.ly = e.clientY;
    });
    var up = function () { S.drag = false; canvas.style.cursor = 'grab'; };
    canvas.addEventListener('pointerup', up);
    canvas.addEventListener('pointercancel', up);
    // v23 桌面：鼠标滚轮放大 / 缩小（向下滚缩小，向上滚放大）
    canvas.addEventListener('wheel', function (e) {
      e.preventDefault();
      var z = (S.zoom || 1) * (e.deltaY > 0 ? 1.1 : 0.9);
      S.zoom = Math.max(0.45, Math.min(2.4, z));
      if (S.camera) S.camera.position.z = S.baseDist * S.zoom;
    }, { passive: false });
    // v23 手机：双指捏合缩放（单指仍为拖拽旋转，互不冲突）
    var pinch = 0;
    function pinchDist(e) {
      var dx = e.touches[0].clientX - e.touches[1].clientX;
      var dy = e.touches[0].clientY - e.touches[1].clientY;
      return Math.sqrt(dx * dx + dy * dy);
    }
    canvas.addEventListener('touchstart', function (e) {
      if (e.touches.length === 2) { S.drag = false; pinch = pinchDist(e); }
    }, { passive: true });
    canvas.addEventListener('touchmove', function (e) {
      if (e.touches.length !== 2 || !pinch) return;
      e.preventDefault();
      var d = pinchDist(e);
      S.zoom = Math.max(0.45, Math.min(2.4, (S.zoom || 1) * (pinch / Math.max(1, d))));
      if (S.camera) S.camera.position.z = S.baseDist * S.zoom;
      pinch = d;
    }, { passive: false });
    canvas.addEventListener('touchend', function (e) { if (e.touches.length < 2) pinch = 0; }, { passive: true });
  }

  function update(opts) {
    if (!opts) return;
    var pid = opts.productId || 'roundFan';
    if (!S.ready) return;
    if (S.productId !== pid) {
      var host = S.host;
      S.productId = pid;
      init(host, opts);
      return;
    }
    S.opts = opts;
    var base = hex(opts.baseHex);
    // v14：包边/织带按底色压暗，避免浅色方案里侧边比印花面还亮、像透明塑料。
    var edgeBase = new THREE.Color(base).lerp(new THREE.Color(0x000000), 0.12);
    S.sideMat.color.copy(edgeBase);
    S.backMat.color.copy(new THREE.Color(base).lerp(new THREE.Color(0x000000), 0.06));
    var innerBase = new THREE.Color(base).lerp(new THREE.Color(0x000000), 0.5);
    // 托特包内里固定接近纯黑（原型是深色布里），避免浅色配色下袋口露出一条灰带。
    if (pid === 'tote') innerBase = new THREE.Color(0x141210);
    S.innerMat.color.copy(innerBase);
    var fabricBase = new THREE.Color(base).lerp(new THREE.Color(0x000000), 0.18);
    S.fabricMat.color.copy(fabricBase);

    var dataUrl = buildArtDataUrl(opts.svgRef && opts.svgRef.current, opts.baseHex);
    if (dataUrl) {
      new THREE.TextureLoader().load(dataUrl, function (tex) {
        if (!S.ready) { tex.dispose(); return; }
        tex.encoding = THREE.sRGBEncoding;
        tex.minFilter = THREE.LinearFilter;
        tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
        if (S.tex) S.tex.dispose();
        S.tex = tex;
        [S.frontMat, S.backMat].forEach(function (m) {
          m.map = tex; m.color.setHex(0xffffff); m.needsUpdate = true;
        });
      });
    } else {
      [S.frontMat, S.backMat].forEach(function (m) {
        m.map = null; m.color.setHex(base); m.needsUpdate = true;
      });
    }

    if (opts.target === 'product') {
      var sc = Number(opts.scale) || 1;
      S.group.scale.setScalar(sc);
      S.group.rotation.z = (Number(opts.rotate) || 0) * Math.PI / 180;
      S.group.position.set((Number(opts.dx) || 0) / 400 * 2.5, -(Number(opts.dy) || 0) / 400 * 2.9, 0);
    } else {
      S.group.scale.setScalar(1);
      S.group.rotation.z = 0;
      S.group.position.set(0, 0, 0);
    }
  }

  function init(host, opts) {
    if (!THREE || !host) return;
    var pid = (opts && opts.productId) || S.productId || 'roundFan';
    S.productId = pid;
    dispose();
    buildScene(host, pid);
    bindDrag();
    update(opts);
  }

  function view(name) {
    var flat = S.productId === 'plate' || S.productId === 'rug' || S.productId === 'scarf';
    if (name === 'front') { S.target.rx = flat ? -0.62 : 0; S.target.ry = 0; }
    else if (name === 'side') { S.target.rx = -0.05; S.target.ry = 1.05; }
    else if (name === 'back') { S.target.rx = flat ? -0.62 : 0; S.target.ry = Math.PI; }
    else if (name === 'top') { S.target.rx = -0.95; S.target.ry = 0.22; }
  }

  // v25 导出：按指定视角强制渲染并返回 PNG dataURL，渲染后恢复原视角。
  function captureView(name, size) {
    var r = S.renderer, sc = S.scene, cam = S.camera, g = S.group;
    if (!r || !sc || !cam || !g) return null;
    var N = Math.max(600, Math.min(1600, size || 1000));
    var flat = S.productId === 'plate' || S.productId === 'rug' || S.productId === 'scarf';
    var angles = {
      front: { rx: flat ? -0.62 : 0, ry: 0 },
      side:  { rx: -0.05, ry: 1.05 },
      back:  { rx: flat ? -0.62 : 0, ry: Math.PI },
      top:   { rx: -0.95, ry: 0.22 }
    };
    var a = angles[name] || angles.front;
    var ox = g.rotation.x, oy = g.rotation.y;
    var ow = r.domElement.width, oh = r.domElement.height;
    var oAspect = cam.aspect;
    try {
      g.rotation.x = a.rx; g.rotation.y = a.ry;
      r.setSize(N, N, false);
      cam.aspect = 1; cam.updateProjectionMatrix();
      r.render(sc, cam);
      var url = r.domElement.toDataURL('image/png');
      return url;
    } catch (e) { return null; }
    finally {
      g.rotation.x = ox; g.rotation.y = oy;
      r.setSize(ow, oh, false);
      cam.aspect = oAspect; cam.updateProjectionMatrix();
      r.render(sc, cam);
    }
  }

  // v25 导出：三视图（正面 / 侧面 / 背面）横向合成一张高清 PNG。
  function captureThreeViews(size) {
    var N = Math.max(600, Math.min(1400, size || 900));
    var views = ['front', 'side', 'back'];
    var urls = views.map(function (v) { return captureView(v, N); });
    if (urls.some(function (u) { return !u; })) return null;
    return new Promise(function (resolve) {
      var loaded = 0, imgs = [];
      urls.forEach(function (u, i) {
        var im = new Image();
        im.onload = function () { imgs[i] = im; loaded++; if (loaded === 3) compose(); };
        im.onerror = function () { resolve(null); };
        im.src = u;
      });
      function compose() {
        try {
          var labelH = 64, pad = 16;
          var c = document.createElement('canvas');
          c.width = N * 3 + pad * 4;
          c.height = N + labelH + pad * 2;
          var x = c.getContext('2d');
          x.fillStyle = '#f5f3ee'; x.fillRect(0, 0, c.width, c.height);
          var labels = ['正面 FRONT', '侧面 SIDE', '背面 BACK'];
          imgs.forEach(function (im, i) {
            var dx = pad + i * (N + pad);
            x.fillStyle = '#ffffff';
            x.fillRect(dx, pad, N, N);
            x.drawImage(im, dx, pad, N, N);
            x.fillStyle = '#292929';
            x.font = '600 28px "Noto Sans SC", sans-serif';
            x.textAlign = 'center';
            x.fillText(labels[i], dx + N / 2, pad + N + 44);
          });
          resolve(c.toDataURL('image/png'));
        } catch (e) { resolve(null); }
      }
    });
  }

  window.Wx3D = {
    init: init, update: update, dispose: dispose, view: view,
    buildArtDataUrl: buildArtDataUrl,
    captureView: captureView, captureThreeViews: captureThreeViews
  };
})();

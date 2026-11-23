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
    target: { rx: -0.08, ry: -0.32 }, drag: false, lx: 0, ly: 0,
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

    if (pid === 'tote') {
      // 托特包（v15 按真实黑色包边帆布托特包重做）：
      // 参照原型——黑色包边 + 黑色织带提手 + 印花帆布铺满正/侧/底 + 方正厚实软包 + 可见深色内里。
      // 最大改动：侧面/底面从纯色 D 改为印花 F，消除"白色纸袋"观感。
      var HW = 1.24, HH = 1.16, depth = 0.4;
      // 前片：中央轻微外鼓，四角收，UV 铺满
      g.add(gridMesh(28, 28, function (v, u) {
        var px = (u - 0.5) * 2 * HW, py = (v - 0.5) * 2 * HH;
        var bulge = depth * Math.sin(Math.PI * u) * Math.sin(Math.PI * v);
        return [px, py, bulge, u, v];
      }, F));
      // 后片：同样印花外鼓
      g.add(gridMesh(28, 28, function (v, u) {
        var px = (u - 0.5) * 2 * HW, py = (v - 0.5) * 2 * HH;
        var bulge = depth * Math.sin(Math.PI * u) * Math.sin(Math.PI * v);
        return [px, py, -bulge - 0.05, 1 - u, v];
      }, F));
      // 左右侧片：改印花 F（关键），横向 UV 压缩避免纹样被拉长
      [-1, 1].forEach(function (sgn) {
        g.add(gridMesh(8, 24, function (v, u) {
          var py = (v - 0.5) * 2 * HH;
          var zz = (u - 0.5) * (2 * depth + 0.05);
          var edge = Math.sin(Math.PI * v);
          return [sgn * (HW - 0.03 * edge), py, zz, u * 0.42, v];
        }, F));
      });
      // 底片：也铺印花，杜绝任何纯色白块
      g.add(gridMesh(20, 8, function (v, u) {
        var px = (u - 0.5) * 2 * HW;
        var zz = (v - 0.5) * (2 * depth + 0.05);
        return [px, -HH + 0.03, zz, u, v];
      }, F));
      // 袋口：顶部内凹深色内里（俯视能看到开口）
      g.add(gridMesh(28, 8, function (v, u) {
        var px = (u - 0.5) * 2 * (HW - 0.04);
        var zz = (v - 0.5) * (2 * depth - 0.04);
        var yy = HH - 0.07 - 0.11 * Math.sin(Math.PI * u);
        return [px, yy, zz, u, v];
      }, I));
      // ── 黑色包边（原型灵魂）：袋口一圈 + 四条竖棱 + 底边一圈，用黑色细管走线 ──
      var rim = 0.042;
      // 袋口前后沿（跟随前片鼓起的肩线）
      g.add(pipe([[-HW, HH - 0.02, depth + 0.01], [-HW * 0.5, HH - 0.04, depth + 0.17],
                  [0, HH - 0.07, depth + 0.21], [HW * 0.5, HH - 0.04, depth + 0.17],
                  [HW, HH - 0.02, depth + 0.01]], T, rim, 40));
      g.add(pipe([[-HW, HH - 0.02, -depth - 0.01], [-HW * 0.5, HH - 0.04, -depth - 0.17],
                  [0, HH - 0.07, -depth - 0.21], [HW * 0.5, HH - 0.04, -depth - 0.17],
                  [HW, HH - 0.02, -depth - 0.01]], T, rim, 40));
      // 左右袋口沿
      [-1, 1].forEach(function (sgn) {
        g.add(pipe([[sgn * HW, HH - 0.02, depth + 0.01], [sgn * HW, HH - 0.05, 0],
                    [sgn * HW, HH - 0.02, -depth - 0.01]], T, rim, 24));
      });
      // 四条竖棱
      [-1, 1].forEach(function (sx) {
        [-1, 1].forEach(function (sz) {
          g.add(pipe([[sx * HW, HH - 0.02, sz * (depth + 0.02)],
                      [sx * HW, 0, sz * (depth + 0.02)],
                      [sx * HW, -HH + 0.02, sz * (depth + 0.02)]], T, rim, 20));
        });
      });
      // 底边前后沿
      [1, -1].forEach(function (sz) {
        g.add(pipe([[-HW, -HH + 0.03, sz * (depth + 0.02)],
                    [0, -HH + 0.03, sz * (depth + 0.02)],
                    [HW, -HH + 0.03, sz * (depth + 0.02)]], T, rim, 24));
      });
      // ── 黑色织带提手：两条扁平带跨过包口，根部延伸到前片内侧（贴合原型） ──
      [-0.42, 0.42].forEach(function (x) {
        var hp = [[x - 0.3, HH - 0.28, 0.06], [x - 0.3, HH + 0.5, 0],
                  [x - 0.2, HH + 0.92, 0], [x, HH + 1.04, 0],
                  [x + 0.2, HH + 0.92, 0], [x + 0.3, HH + 0.5, 0],
                  [x + 0.3, HH - 0.28, 0.06]];
        var h = pipe(hp, T, 0.098, 48);
        h.scale.z = 0.32; // 压成扁带
        g.add(h);
      });
      return { group: g, shadowY: -1.36, shadowR: 1.45 };

    } else if (pid === 'tee') {
      // T恤（v10 高精度）：立体衣身 + 肩线塑形 + 挖低圆领 + 圆锥短袖 + 罗纹。
      // 衣身用参数化曲面：躯干为带厚度的筒体，上部收出水平肩线与领口挖弧。
      var bodyH = 2.9, shoulderY = 0.95;
      // 躯干筒体（下摆到肩）
      var bg = new THREE.CylinderGeometry(0.88, 0.82, bodyH, 56, 20, true);
      var bp = bg.attributes.position, bu = bg.attributes.uv;
      for (var bi = 0; bi < bp.count; bi++) {
        var bx = bp.getX(bi), by = bp.getY(bi), bz = bp.getZ(bi);
        var bt = (by + bodyH / 2) / bodyH;
        var taper = 1 - 0.06 * Math.sin(bt * Math.PI);
        // 腰部略收，胸部略放
        taper *= 1 - 0.05 * Math.exp(-Math.pow((bt - 0.42) / 0.18, 2)) + 0.04 * Math.exp(-Math.pow((bt - 0.72) / 0.16, 2));
        bp.setXYZ(bi, bx * taper, by, bz * 0.33);
        bu.setXY(bi, bu.getX(bi) * 2.4, bu.getY(bi) * 1.45);
      }
      bg.computeVertexNormals();
      g.add(new THREE.Mesh(bg, F));
      // 肩部：两块从躯干顶缘向外延伸到肩点的布面，形成水平肩线（而非圆筒收口）
      [-1, 1].forEach(function (sgn) {
        var sh = gridMesh(12, 10, function (v, u) {
          // u: 从颈部(x=0.38)到肩点(x=1.12)；v: 从前(z+)到后(z-)
          var x = 0.66 + u * 0.5;
          var z = (v - 0.5) * 0.5 * (1 - 0.3 * u);
          var y = 1.45 - 0.16 * u - 0.06 * Math.cos(v * Math.PI * 2);
          return [sgn * x, y, z, u, v];
        }, F);
        g.add(sh);
      });
      // 领口：椭圆罗纹领圈 + 向下凹陷的深色内衬碗（盖住空心筒体内部视线，形成可见挖领）
      // 领圈抬到肩线(1.45)之上一点，让浅俯视角度也能看到挖领
      var neck = mesh(new THREE.TorusGeometry(0.44, 0.038, 8, 48), C, 0, 1.47, 0, Math.PI / 2);
      neck.scale.z = 0.4;
      g.add(neck);
      g.add(gridMesh(40, 5, function (v, u) {
        var ang = u * Math.PI * 2;
        var front = Math.max(0, Math.sin(ang)); // z+ 前方挖得略低
        var rx = 0.46 * (1 - 0.78 * v), rz = 0.193 * (1 - 0.78 * v);
        var y = (1.47 - 0.1 * front) - 0.22 * v;
        return [rx * Math.cos(ang), y, rz * Math.sin(ang), u, v];
      }, I));
      // 短袖：局部子组整体旋转，袖口贴合末端
      [-1, 1].forEach(function (sgn) {
        var sgGroup = new THREE.Group();
        var sg = new THREE.CylinderGeometry(0.36, 0.31, 0.92, 28, 1, true);
        var sp = sg.attributes.position, su = sg.attributes.uv;
        for (var k = 0; k < sp.count; k++) {
          sp.setZ(k, sp.getZ(k) * 0.72);
          su.setXY(k, su.getX(k) * 1.1, su.getY(k) * 0.62);
        }
        sg.computeVertexNormals();
        sgGroup.add(new THREE.Mesh(sg, F));
        var cuff = mesh(new THREE.TorusGeometry(0.31, 0.045, 8, 28), C, 0, -0.46, 0, Math.PI / 2);
        cuff.scale.z = 0.72;
        sgGroup.add(cuff);
        sgGroup.add(mesh(new THREE.CircleGeometry(0.31, 28), I, 0, -0.47, 0, Math.PI / 2));
        sgGroup.position.set(sgn * 1.16, 0.82, 0);
        sgGroup.rotation.z = sgn * 0.82;
        g.add(sgGroup);
      });
      // 下摆罗纹
      var hem = mesh(new THREE.TorusGeometry(0.82, 0.06, 8, 56), C, 0, -1.42, 0, Math.PI / 2);
      hem.scale.z = 0.33;
      g.add(hem);
      return { group: g, shadowY: -1.68, shadowR: 1.7 };
    } else if (pid === 'hoodie') {
      // 卫衣（v10 高精度）：立体椭圆筒衣身 + 长袖 + 真实兜帽 + 袋鼠兜 + 全套罗纹。
      var BH = 3.0;
      var bg = new THREE.CylinderGeometry(0.98, 0.9, BH, 56, 22, true);
      var bp = bg.attributes.position, bu = bg.attributes.uv;
      for (var bi = 0; bi < bp.count; bi++) {
        var bx = bp.getX(bi), by = bp.getY(bi), bz = bp.getZ(bi);
        var bt = (by + BH / 2) / BH;
        var taper = 1 - 0.05 * Math.sin(bt * Math.PI);
        if (bt > 0.86) taper *= 1 - 0.55 * Math.pow((bt - 0.86) / 0.14, 1.3);
        bp.setXYZ(bi, bx * taper, by, bz * 0.36);
        bu.setXY(bi, bu.getX(bi) * 2.5, bu.getY(bi) * 1.5);
      }
      bg.computeVertexNormals();
      g.add(new THREE.Mesh(bg, F));
      // 领口罗纹
      var neck = mesh(new THREE.TorusGeometry(0.44, 0.038, 8, 44), C, 0, 1.42, 0, Math.PI / 2);
      neck.scale.z = 0.36;
      g.add(neck);
      // 长袖：局部子组整体旋转，袖身+袖口+封端一起动
      [-1, 1].forEach(function (sgn) {
        var sgGroup = new THREE.Group();
        var sg = new THREE.CylinderGeometry(0.38, 0.29, 1.5, 28, 2, true);
        var sp = sg.attributes.position, su = sg.attributes.uv;
        for (var k = 0; k < sp.count; k++) {
          sp.setZ(k, sp.getZ(k) * 0.74);
          su.setXY(k, su.getX(k) * 1.15, su.getY(k) * 0.78);
        }
        sg.computeVertexNormals();
        sgGroup.add(new THREE.Mesh(sg, F));
        var cuff = mesh(new THREE.TorusGeometry(0.29, 0.045, 8, 28), C, 0, -0.75, 0, Math.PI / 2);
        cuff.scale.z = 0.74;
        sgGroup.add(cuff);
        sgGroup.add(mesh(new THREE.CircleGeometry(0.29, 28), I, 0, -0.76, 0, Math.PI / 2));
        sgGroup.position.set(sgn * 1.3, 0.48, 0);
        sgGroup.rotation.z = sgn * 0.6;
        g.add(sgGroup);
      });
      // 下摆罗纹
      var hem = mesh(new THREE.TorusGeometry(0.9, 0.065, 8, 56), C, 0, -1.46, 0, Math.PI / 2);
      hem.scale.z = 0.36;
      g.add(hem);
      // 兜帽：参数化布兜，正面椭圆帽口、向后脑收拢闭合；外印花 + 内深色帽腔
      function hoodRing(v, u, inset) {
        var ang = u * Math.PI * 2;
        // 圆润布兜：帽口最大，向后饱满延伸，末端收成圆弧(非尖顶)
        var shrink = Math.pow(Math.cos(v * Math.PI / 2 * 0.96), 0.7);
        var rx = Math.max(0.05, 0.62 * shrink - inset);
        var ry = Math.max(0.05, 0.42 * shrink - inset);
        var cy = 1.72 + 0.44 * Math.sin(v * Math.PI * 0.82) - 0.05 * v;
        var cz = 0.1 - 1.02 * v;
        return [rx * Math.cos(ang), cy + ry * Math.sin(ang), cz, u * 2.4 - 0.7, v * 1.15 + 0.05];
      }
      g.add(gridMesh(56, 18, function (v, u) { return hoodRing(v, u, 0); }, F));
      g.add(gridMesh(56, 18, function (v, u) { return hoodRing(v, u, 0.055); }, I));
      var rim = [];
      for (var hh = 0; hh <= 56; hh++) {
        var ra = hh / 56 * Math.PI * 2;
        rim.push([0.62 * Math.cos(ra), 1.72 + 0.42 * Math.sin(ra), 0.1]);
      }
      g.add(pipe(rim, C, 0.05, 112));
      // 抽绳孔 + 抽绳
      [-0.4, 0.4].forEach(function (x) {
        g.add(mesh(new THREE.TorusGeometry(0.05, 0.015, 8, 18), A, x, 1.3, 0.11));
        g.add(pipe([[x, 1.28, 0.13], [x * 1.08, 0.98, 0.18], [x, 0.62, 0.2]], A, 0.022, 20));
      });
      g.add(mesh(new THREE.SphereGeometry(0.1, 14, 10), F, 0, 1.91, -0.92));
      // 袋鼠兜（v14）：缩小并压低，侧边用更暗的包边材质，避免旧版像贴在前襟的大号牌匾。
      var pk = extrude(roundRect(0.86, 0.44, 0.09), [-0.43, -0.22, 0.86, 0.44], 0.08, 0.025, F, D);
      scaleUV(pk.geometry, 0.38, 0.38);
      pk.position.set(0, -0.76, 0.37);
      g.add(pk);
      return { group: g, shadowY: -1.8, shadowR: 1.85 };

    } else if (pid === 'scarf' || pid === 'rug') {
      // 方巾（v10）：整片自然垂坠的柔软曲面（双面印花），四角下垂 + 细滚边，无实心底板。
      // 地毯（v10）：厚实平整的毯面 + 自然卷曲的成束流苏。
      if (pid === 'scarf') {
        var w = 3.3;
        // 对称径向下垂：距中心越远垂得越多（用切比雪夫距离的平滑版），四角最深；去除对角折痕。
        function clothZ(u, v) {
          var px = (u - 0.5) * w, py = (v - 0.5) * w;
          var ex = Math.abs(u - 0.5) * 2, ey = Math.abs(v - 0.5) * 2;
          var radial = Math.sqrt(ex * ex + ey * ey) / Math.SQRT2; // 0中心→1角
          var sag = 0.56 * Math.pow(radial, 3.0);
          var ripple = 0.13 * Math.sin(px * 1.5 + py * 0.8) * Math.cos(py * 1.4 - px * 0.6) * (1 - radial * 0.4)
                     + 0.05 * Math.sin((px + py) * 2.6) * (1 - radial * 0.6);
          return ripple - sag;
        }
        g.add(gridMesh(48, 48, function (v, u) {
          return [(u - 0.5) * w, (v - 0.5) * w, clothZ(u, v), u, v];
        }, F));
        g.add(gridMesh(48, 48, function (v, u) {
          return [(u - 0.5) * w, (v - 0.5) * w, clothZ(u, v) - 0.055, 1 - u, v];
        }, B));
        // 滚边：沿方形边缘采样，跟随下垂
        var edge = [];
        for (var e = 0; e <= 96; e++) {
          var t = e / 96, seg = Math.floor(t * 4), f = t * 4 - seg;
          var uu, vv;
          if (seg === 0) { uu = f; vv = 0; }
          else if (seg === 1) { uu = 1; vv = f; }
          else if (seg === 2) { uu = 1 - f; vv = 1; }
          else { uu = 0; vv = 1 - f; }
          edge.push([(uu - 0.5) * w, (vv - 0.5) * w, clothZ(uu, vv) - 0.015]);
        }
        g.add(pipe(edge, C, 0.024, 160));
        return { group: g, shadowY: -2.1, shadowR: 1.85 };
      }
      var rw = 3.7, rh = 2.5;
      // 毯面：略起伏的厚毯 + 包边
      g.add(gridMesh(40, 28, function (v, u) {
        var px = (u - 0.5) * rw, py = (v - 0.5) * rh;
        var zz = 0.05 * Math.sin(px * 1.3) * Math.cos(py * 1.1) + 0.14;
        return [px, py, zz, u, v];
      }, F));
      // 毯体：正面印花面在下已有；这里补底面印花（任意角度都见纹样）+ 纯色包边芯
      g.add(mesh(new THREE.BoxGeometry(rw, rh, 0.16), D, 0, 0, 0));
      g.add(gridMesh(40, 28, function (v, u) {
        var px = (u - 0.5) * rw, py = (v - 0.5) * rh;
        return [px, py, -0.09, 1 - u, v];
      }, B));
      // 流苏：两端各一排成束的细绳（每束 3 股，自然下垂微卷）
      for (var k = -11; k <= 11; k++) {
        var fx = k * (rw - 0.25) / 22;
        [-1, 1].forEach(function (sgn) {
          var jit = Math.sin(k * 12.9 + sgn * 7.3);
          for (var strand = -1; strand <= 1; strand++) {
            var sx = fx + strand * 0.02;
            var len = 0.28 + 0.14 * Math.abs(jit);
            var sway = 0.05 * Math.sin(k * 3.7 + strand * 2.1 + sgn);
            g.add(pipe([
              [sx, sgn * (rh / 2 - 0.02), 0.14],
              [sx + sway * 0.5, sgn * (rh / 2 + len * 0.5), 0.16],
              [sx + sway, sgn * (rh / 2 + len), 0.12 + strand * 0.02]
            ], C, 0.011, 12));
          }
        });
      }
      return { group: g, shadowY: -rh / 2 - 0.42, shadowR: rw / 2 };
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
      // 抱枕（v10 高精度）：饱满鼓起的布艺软垫。
      // 结构：一枚压扁的球作"枕芯"（纯色侧围），前后各贴一片鼓起的印花布面 + 缝线。
      // 不用手写侧围带（易因索引绕序产生自交破面）。
      var CW = 1.5, CH = 1.42;
      // 枕芯：压扁的椭球，提供厚度与圆润侧围（纯色）
      var core = mesh(new THREE.SphereGeometry(1, 40, 28), D, 0, 0, 0);
      core.scale.set(CW * 0.97, CH * 0.97, 0.4);
      g.add(core);
      // 前片：中央鼓起、四角收拢的印花布面
      g.add(gridMesh(36, 36, function (v, u) {
        var px = (u - 0.5) * 2 * CW, py = (v - 0.5) * 2 * CH;
        var edgeX = Math.abs(u - 0.5) * 2, edgeY = Math.abs(v - 0.5) * 2;
        var corner = Math.pow(edgeX * edgeY, 1.5);
        var puff = 0.4 * Math.sin(Math.PI * u) * Math.sin(Math.PI * v) * (1 - 0.5 * corner);
        return [px * (1 - 0.13 * corner), py * (1 - 0.13 * corner), 0.38 + puff, u, v];
      }, F));
      g.add(gridMesh(36, 36, function (v, u) {
        var px = (u - 0.5) * 2 * CW, py = (v - 0.5) * 2 * CH;
        var edgeX = Math.abs(u - 0.5) * 2, edgeY = Math.abs(v - 0.5) * 2;
        var corner = Math.pow(edgeX * edgeY, 1.5);
        var puff = 0.4 * Math.sin(Math.PI * u) * Math.sin(Math.PI * v) * (1 - 0.5 * corner);
        return [px * (1 - 0.13 * corner), py * (1 - 0.13 * corner), -0.38 - puff, 1 - u, v];
      }, B));
      // 缝线：沿边缘一圈（前后各一条）
      var seam = [];
      for (var q = 0; q <= 48; q++) {
        var ang = q / 48 * Math.PI * 2;
        seam.push([Math.cos(ang) * CW * 0.82, Math.sin(ang) * CH * 0.82]);
      }
      [0.42, -0.42].forEach(function (z) {
        g.add(pipe(seam.map(function (p) { return [p[0], p[1], z]; }), C, 0.014, 120));
      });
      return { group: g, shadowY: -1.5, shadowR: 1.6 };
    } else if (pid === 'notebook') {
      // 笔记本：合上的硬壳本——封面整片印花 + 内缩纸页（只从侧边露出）+ 圆润书脊 + 烫金压线 + 书签带。
      // 关键修复：旧版纸页厚 0.26 > 封面 0.22 且居中，把带纹样的封面整个盖住 → 只剩四边一点纹样。
      // 现在封面厚度 0.20（表面 z=+0.10）；纸页厚 0.15、中心后移到 z=-0.055（前脸 z=+0.02），永远在封面之后。
      // 封面：frontMat 贴印花，sideMat 作包边
      g.add(extrude(roundRect(2.5, 3.35, 0.12), [-1.25, -1.675, 2.5, 3.35], 0.2, 0.035, F, D));
      // 纸页：四周内缩（露出封面外沿一圈硬壳），夹紧在封面之后，只从右/上/下侧缘可见
      g.add(mesh(new THREE.BoxGeometry(2.28, 3.12, 0.15), C, 0.07, 0, -0.055));
      // 书脊：左侧沿 Y 轴的半圆柱（不旋转，默认就沿 Y），弧面朝左凸出形成圆润书背。
      // 注意：CylinderGeometry 默认沿 Y 轴；旧版误加 Z=90° 旋转使它横躺成一根细条 + 大三角。
      var spine = mesh(new THREE.CylinderGeometry(0.13, 0.13, 3.3, 24), D, -1.24, 0, 0);
      g.add(spine);
      // 封面烫金压线：内缩细边 + 书脊附近的竖线（在封面表面 z=+0.105 之上，不被遮）
      var frame = roundRect(2.14, 2.99, 0.08).getSpacedPoints(72);
      g.add(pipe(frame.map(function (p) { return [p.x, p.y, 0.15]; }), A, 0.009, 96));
      g.add(mesh(new THREE.BoxGeometry(0.018, 2.99, 0.008), A, -0.94, 0, 0.15));
      // 书签带：从顶端垂到本子下缘的一条细带（贴平封面，末端用一个朝下的扁平三角做燕尾）。
      g.add(mesh(new THREE.BoxGeometry(0.075, 0.9, 0.012), A, 0.82, -1.18, 0.152));
      // 燕尾用两个极薄的三角片贴在封面上（rotation.z 让尖端朝下），不再用会戳出大面的锥体。
      var tailShape = new THREE.Shape();
      tailShape.moveTo(-0.055, 0.09); tailShape.lineTo(0.055, 0.09); tailShape.lineTo(0, -0.09);
      tailShape.closePath();
      g.add(mesh(new THREE.ShapeGeometry(tailShape), A, 0.82, -1.72, 0.153));
      return { group: g, shadowY: -1.94, shadowR: 1.5 };

    } else if (pid === 'umbrella') {
      // 晴雨伞（v10）：8 瓣分段伞面（每瓣边缘有扇贝波浪）+ 8 根外露伞骨 + 直杆弯钩柄 + 伞尖。
      var R = 1.95, cy = 1.6, PANELS = 8;
      var seg = 10; // 每瓣径向细分
      // 伞面：按瓣生成，瓣间有轻微起伏，边缘扇贝
      for (var pn = 0; pn < PANELS; pn++) {
        (function (idx) {
          var a0 = idx / PANELS * Math.PI * 2, a1 = (idx + 1) / PANELS * Math.PI * 2;
          g.add(gridMesh(seg, 10, function (v, u) {
            var ang = a0 + (a1 - a0) * u;
            var rr = R * v;
            var scallop = 1 + 0.03 * Math.cos((u - 0.5) * Math.PI * 2) * Math.pow(v, 3);
            var yy = cy - 0.82 * Math.pow(v, 1.5);
            // 瓣中央略高、边缘略低，形成伞骨撑起的起伏
            yy += 0.05 * Math.sin(u * Math.PI) * Math.pow(v, 1.2);
            return [rr * scallop * Math.cos(ang), yy, rr * scallop * Math.sin(ang),
              idx / PANELS + u / PANELS, v];
          }, F));
        })(pn);
      }
      // 8 根伞骨：沿每瓣中线，从伞顶到伞缘
      for (var r = 0; r < PANELS; r++) {
        var mid = (r + 0.5) / PANELS * Math.PI * 2;
        g.add(pipe([
          [0, cy - 0.04, 0],
          [R * 0.5 * Math.cos(mid), cy - 0.32, R * 0.5 * Math.sin(mid)],
          [R * 0.98 * Math.cos(mid), cy - 0.84, R * 0.98 * Math.sin(mid)]
        ], W, 0.02, 26));
      }
      // 伞杆 + 弯钩柄 + 伞尖
      g.add(mesh(new THREE.CylinderGeometry(0.05, 0.05, 3.0, 12), W, 0, -0.62, 0));
      g.add(pipe([[0, -2.1, 0], [0.04, -2.34, 0], [0.22, -2.48, 0], [0.42, -2.34, 0]], W, 0.055, 28));
      g.add(mesh(new THREE.ConeGeometry(0.075, 0.3, 12), W, 0, cy + 0.14, 0));
      return { group: g, shadowY: -2.5, shadowR: 1.9 };
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
    var renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
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
      trimMat: new THREE.MeshStandardMaterial({ color: 0x12100f, roughness: 0.92, metalness: 0, side: ds, envMapIntensity: 0.18 })
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
      camera.aspect = w / h;
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
    S.ro = ro; S.ready = true;
  }

  function dispose() {
    if (S.raf) cancelAnimationFrame(S.raf);
    if (S.ro) S.ro.disconnect();
    if (S.group) {
      S.group.traverse(function (o) { if (o.geometry) o.geometry.dispose(); });
      [S.frontMat, S.backMat, S.sideMat, S.innerMat, S.fabricMat, S.woodMat, S.accentMat, S.trimMat].forEach(function (m) {
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
  }

  function update(opts) {
    if (!opts) return;
    var pid = opts.productId || 'tote';
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
    var pid = (opts && opts.productId) || S.productId || 'tote';
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

  window.Wx3D = {
    init: init, update: update, dispose: dispose, view: view,
    buildArtDataUrl: buildArtDataUrl
  };
})();

(function () {
    function extractWordsFromElement(el) {
        if (!el) return [];
        const raw = el.textContent || "";
        const matches = raw.match(/[a-z]+/gi) || [];
        return matches.map(w => w.toLowerCase());
    }

    function isValidCssColor(str) {
        if (!str) return false;
        const s = new Option().style;
        s.color = str;
        return s.color !== "";
    }

    function truncateWord(w) {
        if (!w) return "";
        if (w.length > 13) {
            return w.slice(0, 10) + "...";
        }
        return w;
    }

    function makeCanvas(sideCssPx) {
        const dpr = window.devicePixelRatio || 1;
        const canvas = document.createElement("canvas");
        canvas.style.width = sideCssPx + "px";
        canvas.style.height = sideCssPx + "px";
        canvas.width = Math.floor(sideCssPx * dpr);
        canvas.height = Math.floor(sideCssPx * dpr);
        canvas.dataset.dpr = dpr;
        return canvas;
    }

    function drawGridCanvas(canvas, words) {
        const dpr = parseFloat(canvas.dataset.dpr) || 1;
        const ctx = canvas.getContext("2d");
        const cssW = parseFloat(canvas.style.width);
        const cssH = parseFloat(canvas.style.height);
        const canvasSide = Math.min(cssW, cssH);
        const axisSpace = 50;
        const gridSize = Math.max(0, canvasSide - axisSpace);
        let n = words.length;
        const cell = gridSize / n;

        let colors = [];

        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        ctx.clearRect(0, 0, canvasSide, canvasSide);
        ctx.fillStyle = "#fff";
        ctx.fillRect(0, 0, canvasSide, canvasSide);
        // ctx.fillStyle = "#eee";
        // ctx.fillRect(axisSpace, axisSpace, canvasSide, canvasSide);

        const approxFontPx = Math.max(6, Math.floor(Math.min(14, cell)));
        const fontSpec = `${approxFontPx}px monospace`;
        ctx.font = fontSpec;
        ctx.textBaseline = "middle";
        ctx.fillStyle = "#000";
        const displayWords = words.map(w => truncateWord(w.toLowerCase()));

        // y axis
        for (let i = 0; i < n; i++) {
            ctx.textAlign = "right";
            const y = axisSpace + i * cell + cell / 2;
            const x = axisSpace / 2 + 20;
            if (isValidCssColor(displayWords[i])) {
                ctx.fillStyle = displayWords[i]
            } else {
                ctx.fillStyle = "#000"
            }
            ctx.fillText(displayWords[i], x, y);
        }

        // x axis
        for (let i = 0; i < n; i++) {
            ctx.textAlign = "left";
            const cx = axisSpace + i * cell + cell / 2;
            const cy = axisSpace / 2 + 20;
            ctx.save();
            ctx.translate(cx, cy);
            ctx.rotate(-Math.PI / 2);
            if (isValidCssColor(displayWords[i])) {
                ctx.fillStyle = displayWords[i]
            } else {
                ctx.fillStyle = "#000"
            }
            ctx.fillText(displayWords[i], 0, 0);
            ctx.restore();
        }

        const ox = axisSpace;
        const oy = axisSpace;

        for (let i = 0; i < n; i++) {
            const x = ox + i * cell;
            const y = oy + i * cell;
            const word = words[i].toLowerCase();
            if (isValidCssColor(word))
                ctx.fillStyle = word;
            else
                ctx.fillStyle = "#ddd";
            ctx.fillRect(x, y, cell, cell);
        }

        for (let row = 0; row < n; row++) {
            for (let col = 0; col < n; col++) {

                const x = ox + col * cell;
                const y = oy + row * cell;

                const match = words[col].toLowerCase() === words[row].toLowerCase();

                const word = words[col].toLowerCase();
                const pad = cell * (n / 8);

                if (match) {
                    if (isValidCssColor(word)) {
                        ctx.fillStyle = word;
                        ctx.fillRect(x, y, cell, cell);

                        ctx.beginPath();
                        ctx.arc(x + cell / 2, y + cell / 2, pad, 0, 2 * Math.PI);
                        ctx.fillStyle = `${ctx.fillStyle}55`;
                        ctx.fill();
                        ctx.lineWidth = 0.3;
                        ctx.strokeStyle = "black";
                        ctx.stroke();
                        if (!colors.includes(word)) colors.push(word);
                    } else {
                        if (row == col) continue;
                        ctx.fillStyle = "#000";
                        ctx.fillRect(x, y, cell, cell);
                    }
                }
            }
        }
        return colors;
    }

    function attachCanvasTooltip(canvas, words) {
        if (!canvas || !Array.isArray(words)) return;
        const AXIS = 50; 
        const old = document.getElementById("pc-tooltip");
        if (old) old.remove();

        const tt = document.createElement("div");
        tt.id = "pc-tooltip";
        Object.assign(tt.style, {
            position: "fixed",
            pointerEvents: "none",
            background: "rgba(0,0,0,0.7)",
            color: "#fff",
            padding: "4px 6px",
            fontSize: "13px",
            zIndex: 9999,
            display: "none",
            whiteSpace: "nowrap"
        });
        document.body.appendChild(tt);

        function hide() { tt.style.display = "none"; }

        canvas.addEventListener("mousemove", (ev) => {
            const rect = canvas.getBoundingClientRect();
            const mx = ev.clientX - rect.left;
            const my = ev.clientY - rect.top;

            if (mx < AXIS || my < AXIS) { hide(); return; }

            const cssSize = rect.width;
            const gridSize = Math.max(0, cssSize - AXIS);
            const n = Math.max(1, words.length);
            const cell = gridSize / n;

            const col = Math.floor((mx - AXIS) / cell);
            const row = Math.floor((my - AXIS) / cell);
            if (col < 0 || col >= n || row < 0 || row >= n) { hide(); return; }

            const xw = String(words[col] || "");
            const yw = String(words[row] || "");
            tt.textContent = `${xw}, ${yw}`;
            tt.style.display = "block";

            const pad = 10;
            const ttRect = tt.getBoundingClientRect();
            let left = ev.clientX + pad;
            let top = ev.clientY + pad;
            if (left + ttRect.width > window.innerWidth) left = ev.clientX - ttRect.width - pad;
            if (top + ttRect.height > window.innerHeight) top = ev.clientY - ttRect.height - pad;
            tt.style.left = Math.max(6, left) + "px";
            tt.style.top = Math.max(6, top) + "px";
        });

        canvas.addEventListener("mouseleave", hide);
    }

    function normRGB(col) {
        const cc = document.createElement("canvas").getContext("2d");
        cc.fillStyle = col;
        const norm = cc.fillStyle;
        if (!norm) return null;
        if (norm[0] === "#") {
            const h = norm.slice(1);
            const h3 = h.length === 3;
            const r = parseInt(h3 ? h[0] + h[0] : h.slice(0, 2), 16);
            const g = parseInt(h3 ? h[1] + h[1] : h.slice(h3 ? 1 : 2, h3 ? 2 : 4), 16);
            const b = parseInt(h3 ? h[2] + h[2] : h.slice(h3 ? 2 : 4, h3 ? 3 : 6), 16);
            return { norm, r, g, b };
        } return null
    }

    function mountPoemCanvas() {
        const wrapper = document.getElementById("poem-canvas-wrapper");
        if (!wrapper) return;

        const poemTextEl = document.querySelector(".poem-text");
        const sourceEl = poemTextEl || document.querySelector(".poem-body");
        const words = extractWordsFromElement(sourceEl);

        if (!words || words.length === 0) {
            wrapper.innerHTML = "";
            return;
        }

        const viewport90 = Math.floor(window.innerWidth * 0.9);
        const side = Math.min(700, viewport90);

        wrapper.innerHTML = "";
        const canvas = makeCanvas(side);
        canvas.setAttribute("id", "poem-grid-canvas");
        canvas.setAttribute("role", "img");
        canvas.setAttribute("aria-label", "Poem word-matching grid");
        wrapper.appendChild(canvas);

        const colorsDiv = document.getElementById("colors-text");
        const colors = drawGridCanvas(canvas, words);
        attachCanvasTooltip(canvas, words);

        colorsDiv.innerHTML = "[";
        const frag = document.createDocumentFragment();
        colors.forEach((c, i) => {
            const span = document.createElement("span");
            span.textContent = c;

            const info = normRGB(c);
            if (!info) {
                span.style.color = '#fff';
                span.style.background = "#aaa";
                span.style.padding = "0 2px";
            } else {
                span.style.color = info.norm;
                const bri = (info.r * 299 + info.g * 587 + info.b * 114) / 1000;
                if (bri > 240) {
                    span.style.background = "#aaa";
                    span.style.padding = "0 2px";
                }
            }

            frag.appendChild(span);
            if (i < colors.length - 1)
                frag.appendChild(document.createTextNode(", "));
        });

        frag.appendChild(document.createTextNode("]"));
        colorsDiv.appendChild(frag);
    }

    let resizeTimer = null;
    function onResize() {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            mountPoemCanvas();
        }, 150);
    }

    document.addEventListener("DOMContentLoaded", () => {
        mountPoemCanvas();
        window.addEventListener("resize", onResize);
    });
})();
(function () {
    'use strict';

    function extractWords(text) {
        if (!text) return [];
        const matches = text.match(/[a-z]+/gi) || [];
        return matches;
    }

    function isValidCssColor(str) {
        if (!str) return false;
        const s = new Option().style;
        s.color = str;
        return s.color !== "";
    }

    function generateThumbnail(text, canvas) {
        const words = extractWords(text);
        if (!words.length) {
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = '#f0f0f0';
            ctx.fillRect(0, 0, 150, 150);
            return;
        }

        const ctx = canvas.getContext('2d');
        const size = 150;
        const n = words.length;
        const gridSize = size;
        const cell = gridSize / n;

        ctx.clearRect(0, 0, size, size);
        ctx.fillStyle = '#fff';
        ctx.fillRect(0, 0, size, size);
        
        for (let i = 0; i < n; i++) {
            const x = i * cell;
            const y = i * cell;
            const word = words[i].toLowerCase();
            if (isValidCssColor(word))
                ctx.fillStyle = word;
            else
                ctx.fillStyle = "#ddd";
            ctx.fillRect(x, y, cell, cell);
        }

        for (let row = 0; row < n; row++) {
            for (let col = 0; col < n; col++) {
                const x = col * cell;
                const y = row * cell;
                const match = words[col].toLowerCase() === words[row].toLowerCase();
                const word = words[col].toLowerCase();
                const pad = cell * (n / 6);

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
                    }else {
                        if (row === col) continue;
                        ctx.fillStyle = "#000";
                        ctx.fillRect(x, y, cell, cell);
                    }
                }
            }
        }
    }

    function generateAllThumbnails() {
        const thumbnails = document.querySelectorAll('.poem-thumbnail[data-poem-text]');

        thumbnails.forEach(canvas => {
            const text = canvas.getAttribute('data-poem-text');
            if (text) generateThumbnail(text, canvas);
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', generateAllThumbnails);
    } else {
        generateAllThumbnails();
    }
})();
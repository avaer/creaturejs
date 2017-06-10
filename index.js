const CacheLru = require('cache-lru');
const Alea = require('alea');

const cache = new CacheLru({
  max: 128,
});

const SIZE = 12;
const _2_32 = Math.pow(2, 32);

function _cloneCanvas(canvas) {
  const result = document.createElement('canvas');
  result.width = canvas.width;
  result.height = canvas.height;

  const ctx = result.getContext('2d');
  ctx.drawImage(canvas, 0, 0);

  return result;
}
function _cloneEntry(entry) {
  if (typeof entry === 'string') {
    return entry;
  } else if (Array.isArray(entry)) {
    return entry.map(_cloneCanvas);
  } else if (entry.tagName === 'CANVAS') {
    return _cloneCanvas(entry);
  } else {
    return null;
  }
}

function makeCreature(seed, format, opts) {
  seed = seed || String(Math.random());

  const key = seed + ':' + format;
  const entry = cache.get(key);
  if (entry) {
    return _cloneEntry(entry);
  } else {
    const entry = (() => {
      const rng = new Alea(seed);

      function _setPixel(imageData, x, y, c) {
        const baseIndex = (x + (y * imageData.width)) * 4;
        imageData.data[baseIndex + 0] = (c >> (8 * 2)) & 0xFF;
        imageData.data[baseIndex + 1] = (c >> (8 * 1)) & 0xFF;
        imageData.data[baseIndex + 2] = (c >> (8 * 0)) & 0xFF;
        imageData.data[baseIndex + 3] = c ? 255 : 0;
      }

      function _getPixel(imageData, x, y) {
        const baseIndex = (x + (y * imageData.width)) * 4;
        const r = imageData.data[baseIndex + 0];
        const g = imageData.data[baseIndex + 1];
        const b = imageData.data[baseIndex + 2];
        const a = imageData.data[baseIndex + 3];
        return (r << (8 * 2)) | (g << (8 * 1)) | (b << (8 * 0)) | (a << (8 * 3));
      }

      function getColor32(r, g, b, a) {
        return r << 16 | g << 8 | b | a << 24;
      }

      class Color {
        constructor(r, g, b, a) {
          this.r = r;
          this.g = g;
          this.b = b;
          this.a = a;
        }
      }

      function getRGB(color) {
        return new Color(
          color >> 16 & 255,
          color >> 8 & 255,
          color & 255,
          color >>> 24
        );
      }

      function HSVtoRGB(h, s, v, a = 255) {
        let result = 0;
        if (s === 0) {
          result = getColor32(v * 255, v * 255, v * 255, a);
        } else {
          h = h / 60;

          const intH = Math.floor(h);
          let f = h - intH;
          let p = v * (1 - s);
          let q = v * (1 - s * f);
          let t = v * (1 - s * (1 - f));
          switch (intH) {
             case 0:
                result = getColor32(v * 255, t * 255, p * 255, a);
                break;
             case 1:
                result = getColor32(q * 255,v * 255,p * 255, a);
                break;
             case 2:
                result = getColor32(p * 255, v * 255, t * 255, a);
                break;
             case 3:
                result = getColor32(p * 255, q * 255, v * 255, a);
                break;
             case 4:
                result = getColor32(t * 255, p * 255, v * 255, a);
                break;
             case 5:
                result = getColor32(v * 255, p * 255, q * 255, a);
                break;
             default:
                throw new Error('FlxColor Error: HSVtoRGB : Unknown color');
          }
        }
        return result;
      }

      function RGBtoHSV(color) {
        let hue = NaN;
        let saturation = NaN;

        const rgb = getRGB(color);
        const r = rgb.r / 255;
        const g = rgb.g / 255;
        const b = rgb.b / 255;

        const min = Math.min(r, g, b);
        const max = Math.max(r, g, b);
        const delta = max - min;
        const lightness = (max + min) / 2;

        if (delta === 0) {
          hue = 0;
          saturation = 0;
        } else {
          if(lightness < 0.5) {
             saturation = delta / (max + min);
          } else {
             saturation = delta / (2 - max - min);
          }
          let delta_r = ((max - r) / 6 + delta / 2) / delta;
          let delta_g = ((max - g) / 6 + delta / 2) / delta;
          let delta_b = ((max - b) / 6 + delta / 2) / delta;
          if (r === max) {
             hue = delta_b - delta_g;
          } else if (g === max) {
             hue = 1 / 3 + delta_r - delta_b;
          } else if (b === max) {
             hue = 2 / 3 + delta_g - delta_r;
          }
          if (hue < 0) {
             hue = hue + 1;
          }
          if (hue > 1) {
             hue = hue - 1;
          }
        }
        hue = hue * 360;
        hue = Math.round(hue);

        return {
          hue,
          saturation,
          lightness,
          value: lightness,
        };
      }

      function mirror(imageData) {
        const w = SIZE;
        const h = SIZE;
        for(let iY = 0; iY < h; iY++) {
          for(let iX = w / 2; iX < w; iX++) {
            _setPixel(imageData, iX, iY, _getPixel(imageData, w - 1 - iX, iY));
          }
        }
      }

      function renderMainFrame(imageData) {
        const w = SIZE;
        const h = SIZE;
        const color = Math.floor(rng() * _2_32);

        let show = color;
        const halfw = (w - 1) / 2;
        const halfh = (h - 1) / 2;
        const radius = Math.min(Math.sqrt(Math.pow(halfw,2)),Math.sqrt(Math.pow(halfh,2)));
        const c = RGBtoHSV(show);

        for (let i = 0; i <= halfw; i++) {
          for (let j = 0; j < h; j++) {
             let dist = Math.min(1,Math.max(0,Math.sqrt(Math.pow(i - halfw,2) + Math.pow(j - halfh,2)) / radius));
             c.hue = Math.max(0,Math.min(359,c.hue + Math.round((rng() * 2 - 1) * 359 * 0.1)));
             c.saturation = Math.max(0,Math.min(1,c.saturation + (rng() * 2 - 1) * 0.1));
             c.value = 1 - dist;
             show = HSVtoRGB(c.hue,c.saturation,c.value);
             if (rng() >= dist) {
                _setPixel(imageData, i, j, show);
             }
          }
        }

        mirror(imageData);
      }

      function renderAltFrame(imageData) {
        let animChance = 1;

        const w = SIZE;
        const h = SIZE;
        const halfw = (w - 1) / 2;

        for (let i = 1; i < halfw; i++) {
          for (let j = 1; j < h - 1; j++) {
            if (rng() <= animChance && _getPixel(imageData, i, j) !== _getPixel(imageData, i - 1, j)) {
               const centerPixel = _getPixel(imageData, i, j);
               const leftPixel = _getPixel(imageData, i - 1, j);
              _setPixel(imageData, i - 1, j, centerPixel);
              _setPixel(imageData, i, j, leftPixel);
              i++;
              j++;
            } else if (rng() <= animChance && _getPixel(imageData, i, j) !== _getPixel(imageData, i, j - 1)) {
               const centerPixel = _getPixel(imageData, i, j);
               const topPixel = _getPixel(imageData, i, j - 1);
              _setPixel(imageData, i, j - 1, centerPixel);
              _setPixel(imageData, i, j, topPixel);
              i++;
              j++;
            }
          }
        }

        mirror(imageData);
      }

      class ColorPoint {
        constructor(x, y) {
          this.x = x;
          this.y = y;
        }
      }

      function imageDataToSvg(imageData) {
        const width = (opts && opts.width) ? opts.width : '';
        const height = (opts && opts.height) ? opts.height : '';
        const viewBox = (opts && opts.viewBox) ? opts.viewBox : '';
        const style = (opts && opts.style) ? opts.style : '';

        let result = `<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" ${width ? `width="${width}"` : ''} ${height ? `height="${height}"` : ''} ${viewBox ? `viewBox="${viewBox}"` : ''} ${style ? `style="${style}"` : ''} shape-rendering="crispEdges">`;

        const colorHistories = {};
        const {data: imageDataData} = imageData;
        for (let y = 0; y < imageData.height; y++) {
          for (let x = 0; x < imageData.width; x++) {
            const baseIndex = (x + (y * imageData.width)) * 4;
            const r = imageDataData[baseIndex + 0];
            const g = imageDataData[baseIndex + 1];
            const b = imageDataData[baseIndex + 2];
            const a = imageDataData[baseIndex + 3];
            const colorString = `rgba(${r},${g},${b},${a})`;

            let entry = colorHistories[colorString];
            if (!entry) {
              entry = [];
              colorHistories[colorString] = entry;
            }

            const colorPoint = new ColorPoint(x, y);
            entry.push(colorPoint);
          }
        }
        for (const colorString in colorHistories) {
          const colorPoints = colorHistories[colorString];

          result += `<path fill="${colorString}" d="`;

          for (let i = 0; i < colorPoints.length; i++) {
            const colorPoint = colorPoints[i];
            const {x, y} = colorPoint;
            if (i > 0) {
              result += ' ';
            }
            result += `M${x},${y} h1 v1 h-1 z`;
          }

          result += `"></path>`;
        }

        result += '</svg>';

        return result;
      }

      const canvas = document.createElement('canvas');
      canvas.width = SIZE;
      canvas.height = SIZE;
      canvas.style.width = 64;
      canvas.style.height = 64;
      canvas.style.imageRendering = 'pixelated';
      const ctx = canvas.getContext('2d');
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      renderMainFrame(imageData);

      if (format === 'animated') {
        ctx.putImageData(imageData, 0, 0);

        const mainFrame = _cloneCanvas(canvas);
        renderAltFrame(imageData)
        ctx.putImageData(imageData, 0, 0);
        const altFrame = canvas;

        return [mainFrame, altFrame];
      } else if (format === 'static') {
        ctx.putImageData(imageData, 0, 0);
        return canvas.toDataURL('image/png');
      } else if (format === 'canvas') {
        ctx.putImageData(imageData, 0, 0);
        return canvas;
      } else if (format === 'svg') {
        return imageDataToSvg(imageData);
      } else {
        return null;
      }
    })();

    cache.set(key, entry);

    return _cloneEntry(entry);
  }
}
const makeAnimatedCreature = (seed, opts) => makeCreature(seed, 'animated', opts);
const makeStaticCreature = (seed, opts) => makeCreature(seed, 'static', opts);
const makeCanvasCreature = (seed, opts) => makeCreature(seed, 'canvas', opts);
const makeSvgCreature = (seed, opts) => makeCreature(seed, 'svg', opts);

module.exports = {
  makeAnimatedCreature,
  makeStaticCreature,
  makeCanvasCreature,
  makeSvgCreature,
};

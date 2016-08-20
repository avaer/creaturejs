const SIZE = 12;
const FRAME_RATE = 200;
const _2_32 = Math.pow(2, 32);

function _setPixel(ctx, x, y, c) {
  let {pixelImageData} = ctx;
  if (!pixelImageData) {
    pixelImageData = ctx.createImageData(1,1);
    ctx.pixelImageData = pixelImageData;
  }
  const {data} = pixelImageData;
  data[0] = (c >> (8 * 2)) & 0xFF;
  data[1] = (c >> (8 * 1)) & 0xFF;
  data[2] = (c >> (8 * 0)) & 0xFF;
  data[3] = c ? 255 : 0;
  ctx.putImageData(pixelImageData, x, y);
}

function _getPixel(ctx, x, y) {
  const pixelImageData = ctx.getImageData(x, y, 1, 1);
  const {data} = pixelImageData;
  const r = data[0];
  const g = data[1];
  const b = data[2];
  const a = data[3];
  return (a << (8 * 3)) | (r << (8 * 2)) | (g << (8 * 1)) | (b << (8 * 0));
}

function getColor32(alpha, red, green, blue) {
  return alpha << 24 | red << 16 | green << 8 | blue;
}

function getRGB(color) {
  const alpha = color >>> 24;
  const red = color >> 16 & 255;
  const green = color >> 8 & 255;
  const blue = color & 255;
  return {
    "alpha":alpha,
    "red":red,
    "green":green,
    "blue":blue
  };
}

function HSVtoRGB(h, s, v, alpha = 255) {
  let result = 0;
  if(s == 0)
  {
    result = getColor32(alpha,v * 255,v * 255,v * 255);
  }
  else
  {
    h = h / 60;

    const intH = Math.floor(h);
    let f = h - intH;
    let p = v * (1 - s);
    let q = v * (1 - s * f);
    let t = v * (1 - s * (1 - f));
    switch(intH)
    {
       case 0:
          result = getColor32(alpha,v * 255,t * 255,p * 255);
          break;
       case 1:
          result = getColor32(alpha,q * 255,v * 255,p * 255);
          break;
       case 2:
          result = getColor32(alpha,p * 255,v * 255,t * 255);
          break;
       case 3:
          result = getColor32(alpha,p * 255,q * 255,v * 255);
          break;
       case 4:
          result = getColor32(alpha,t * 255,p * 255,v * 255);
          break;
       case 5:
          result = getColor32(alpha,v * 255,p * 255,q * 255);
          break;
       default:
          throw new Error("FlxColor Error: HSVtoRGB : Unknown color");
    }
  }
  return result;
}

function RGBtoHSV(color) {
  let hue = NaN;
  let saturation = NaN;

  const rgb = getRGB(color);
  const red = rgb.red / 255;
  const green = rgb.green / 255;
  const blue = rgb.blue / 255;

  const min = Math.min(red,green,blue);
  const max = Math.max(red,green,blue);
  const delta = max - min;
  const lightness = (max + min) / 2;

  if(delta == 0)
  {
    hue = 0;
    saturation = 0;
  }
  else
  {
    if(lightness < 0.5)
    {
       saturation = delta / (max + min);
    }
    else
    {
       saturation = delta / (2 - max - min);
    }
    let delta_r = ((max - red) / 6 + delta / 2) / delta;
    let delta_g = ((max - green) / 6 + delta / 2) / delta;
    let delta_b = ((max - blue) / 6 + delta / 2) / delta;
    if(red == max)
    {
       hue = delta_b - delta_g;
    }
    else if(green == max)
    {
       hue = 1 / 3 + delta_r - delta_b;
    }
    else if(blue == max)
    {
       hue = 2 / 3 + delta_g - delta_r;
    }
    if(hue < 0)
    {
       hue = hue + 1;
    }
    if(hue > 1)
    {
       hue = hue - 1;
    }
  }
  hue = hue * 360;
  hue = Math.round(hue);
  return {
    "hue":hue,
    "saturation":saturation,
    "lightness":lightness,
    "value":lightness
  };
}

function generate(ctx) {
  const w = SIZE;
  const h = SIZE;
  const color = Math.floor(Math.random() * _2_32);

  let show = color;
  const halfw = (w - 1) / 2;
  const halfh = (h - 1) / 2;
  // var maxDist:Number = Math.sqrt(Math.pow(halfw,2) + Math.pow(halfh,2));
  const radius = Math.min(Math.sqrt(Math.pow(halfw,2)),Math.sqrt(Math.pow(halfh,2)));
  const c = RGBtoHSV(show);

  for(let i = 0; i <= halfw; i++)
  {
    for(let j = 0; j < h; j++)
    {
       let dist = Math.min(1,Math.max(0,Math.sqrt(Math.pow(i - halfw,2) + Math.pow(j - halfh,2)) / radius));
       c.hue = Math.max(0,Math.min(359,c.hue + Math.round((Math.random() * 2 - 1) * 359 * 0.1)));
       c.saturation = Math.max(0,Math.min(1,c.saturation + (Math.random() * 2 - 1) * 0.1));
       c.value = 1 - dist;
       show = HSVtoRGB(c.hue,c.saturation,c.value);
       if(Math.random() >= dist)
       {
          _setPixel(ctx, i, j, show);
       }
    }
  }

  mirror(ctx);

  return ctx.getImageData(0, 0, w, h);
}

function mirror(ctx) {
  const w = SIZE;
  const h = SIZE;
  for(let iY = 0; iY < h; iY++) {
    for(let iX = w / 2; iX < w; iX++) {
      _setPixel(ctx, iX, iY, _getPixel(ctx, w - 1 - iX, iY));
    }
  }
}

function animate(ctx) {
  let animChance = 1;

  const w = SIZE;
  const h = SIZE;
  const halfw = (w - 1) / 2;

  for(let i = 1; i < halfw; i++)
  {
    for(let j = 1; j < h - 1; j++)
    {
       if(Math.random() <= animChance && _getPixel(ctx, i, j) != _getPixel(ctx, i - 1, j))
       {
          _setPixel(ctx, i - 1, j, _getPixel(ctx, i ,j));
          _setPixel(ctx, i, j, _getPixel(ctx, i - 1, j));
          i++;
          j++;
       }
       else if(Math.random() <= animChance && _getPixel(ctx, i, j) != _getPixel(ctx, i, j - 1))
       {
          _setPixel(ctx, i, j - 1, _getPixel(ctx, i, j));
          _setPixel(ctx, i, j, _getPixel(ctx, i, j - 1));
          i++;
          j++;
       }
    }
  }

  mirror(ctx);

  return ctx.getImageData(0, 0, w, h);
}

let _ctx = null;
let _timeout = null;
function newCreature() {
  if (_timeout) {
    clearTimeout(_timeout);
  }

  const ctx = _ctx;
  ctx.clearRect(0, 0, SIZE, SIZE);
  const frame1 = generate(ctx);
  const frame2 = animate(ctx);

  const _tick1 = () => {
    ctx.clearRect(0, 0, SIZE, SIZE);
    ctx.putImageData(frame1, 0, 0);

    _timeout = setTimeout(_tick2, FRAME_RATE);
  };
  const _tick2 = () => {
    ctx.putImageData(frame2, 0, 0);

    _timeout = setTimeout(_tick1, FRAME_RATE);
  };

  _tick1();
}

function bootstrap() {
  const canvas = document.createElement('canvas');
  canvas.id = 'canvas';
  canvas.width = SIZE;
  canvas.height = SIZE;
  canvas.style.width = 64;
  canvas.style.height = 64;
  canvas.style.imageRendering = 'pixelated';
  const ctx = canvas.getContext('2d');
  _ctx = ctx;

  document.body.innerHTML = '';
  document.body.appendChild(canvas);
  document.body.style.backgroundColor = '#000000';

  document.addEventListener('keypress', e => {
    if (e.keyCode === 32) { // space
      newCreature();
    }
  });

  newCreature();
}

bootstrap();

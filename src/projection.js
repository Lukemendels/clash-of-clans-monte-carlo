import { GRID_SIZE } from "./model.js";

export function projectionFromCanvas(canvas, calibration) {
  const w = canvas.width, h = canvas.height;
  const gridW = w * calibration.gridWidth;
  const gridH = h * calibration.gridHeight;
  return {
    centerX: w * calibration.centerX,
    topY: h * calibration.topY,
    tileW: gridW / GRID_SIZE,
    tileH: gridH / GRID_SIZE
  };
}

export function tileToScreen(x,y,p) {
  return {
    x:p.centerX + (x-y)*p.tileW/2,
    y:p.topY + (x+y)*p.tileH/2
  };
}

export function screenToTile(sx,sy,p) {
  const a=(sy-p.topY)/(p.tileH/2);
  const b=(sx-p.centerX)/(p.tileW/2);
  return { x:(a+b)/2, y:(a-b)/2 };
}

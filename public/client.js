const SOCKET_URL = window.location.host;
const socket = io.connect(SOCKET_URL);

let currentPosition = 0; // Starting position (GO)
let playerElement = null;
let myPlayerId = null;
let myColor = null;
let myName = null;
// Map of other players: playerId -> { el, position, color }
const playersMap = {};
// Perimeter mapping: logical positions (0..39) -> DOM indices (0..120)
let perimeterIndices = [];

// Connect to the server and set up event handlers
socket.on("playerMove", onPlayerMove);
socket.on("newPlayer", onNewPlayer);
socket.on("currentPlayers", onCurrentPlayers);
socket.on("playerLeft", onPlayerLeft);

function initializeBoard() {
  const main = document.querySelector("main");
  // If a board already exists, remove it so we can rebuild (useful on resize)
  const prev = document.querySelector(".board-container");
  if (prev && prev.parentElement) prev.parentElement.removeChild(prev);
  const boardContainer = document.createElement("div");
  boardContainer.className = "board-container";

  const board = document.createElement("div");
  board.className = "board";
  // Append container first so we can measure it
  boardContainer.appendChild(board);
  main.appendChild(boardContainer);

  // Calculate the number of squares we need per side to fit all board squares
  const totalSquares = BOARD_SQUARES.length;
  // For a standard monopoly board, we want 9 squares on each edge (including corners)
  // 11 on top/bottom, 9 on sides (to prevent overlap)
  const horizontalSquares = 11; // top and bottom rows
  const verticalSquares = 9; // left and right sides

  // build perimeter indices clockwise (0 to totalSquares-1)
  perimeterIndices = [];

  // top row (left to right, including corners)
  for (let i = 0; i < horizontalSquares; i++) {
    perimeterIndices.push(i);
  }

  // right side (top to bottom, excluding corners)
  for (
    let i = horizontalSquares;
    i < horizontalSquares + verticalSquares - 2;
    i++
  ) {
    perimeterIndices.push(i);
  }

  // bottom row (right to left, including corners)
  for (
    let i = horizontalSquares + verticalSquares - 2;
    i < horizontalSquares + verticalSquares + horizontalSquares - 3;
    i++
  ) {
    perimeterIndices.push(i);
  }

  // left side (bottom to top, excluding corners)
  for (
    let i = horizontalSquares + verticalSquares + horizontalSquares - 3;
    i <
    Math.min(
      totalSquares,
      horizontalSquares + 2 * verticalSquares + horizontalSquares - 4
    );
    i++
  ) {
    perimeterIndices.push(i);
  }

  // Only use up to the perimeter length of squares
  const squaresToUse = BOARD_SQUARES.slice(0, perimeterIndices.length);

  // Compute square size based on the horizontal squares (11)
  const GAP_PX = 8; // must match CSS .edge-row gap
  const computedSquarePx = Math.floor(
    (board.clientWidth - (horizontalSquares - 1) * GAP_PX) / horizontalSquares
  );
  document.documentElement.style.setProperty(
    "--square-size",
    `${computedSquarePx}px`
  );
  document.documentElement.style.setProperty(
    "--board-padding",
    `${Math.floor(computedSquarePx / 4)}px`
  );

  // Split indices into sides based on our fixed horizontal and vertical lengths
  const topIndices = perimeterIndices.slice(0, horizontalSquares);
  const rightIndices = perimeterIndices.slice(
    horizontalSquares,
    horizontalSquares + Math.max(0, verticalSquares - 2)
  );
  const bottomStart = horizontalSquares + Math.max(0, verticalSquares - 2);
  const bottomIndices = perimeterIndices.slice(
    bottomStart,
    bottomStart + horizontalSquares
  );
  const leftIndices = perimeterIndices.slice(bottomStart + horizontalSquares);

  // helper to create a tile element for a given logical posIndex
  function makeTileForPos(posIndex) {
    const square = squaresToUse[posIndex];
    const tile = document.createElement("div");
    tile.className = "square";
    tile.setAttribute("data-board-pos", String(posIndex));
    if (square) {
      tile.classList.add(square.type || "property");
      // Put the colored strip inside the .sq-content so it rotates with the content
      tile.innerHTML = `
        <div class="sq-content">
          ${
            square.color
              ? `<div class="color-strip" style="background: ${square.color}"></div>`
              : ""
          }
          <div class="name">${square.name}</div>
          ${square.price ? `<div class="price">$${square.price}</div>` : ""}
        </div>
      `;
    } else {
      tile.classList.add("hidden");
    }
    return tile;
  }

  // We'll detect corners by position within each side array (more reliable)

  // create row containers
  const topRow = document.createElement("div");
  topRow.className = "edge-row edge-top";
  topIndices.forEach((idx, i) => {
    const t = makeTileForPos(idx);
    const c = t.querySelector(".sq-content");
    // top-left (i===0) stays upright; top-right (last) should be rotated 180deg
    if (c) {
      if (i === topIndices.length - 1) c.style.transform = "rotate(180deg)";
      else c.style.transform = "none";
    }
    topRow.appendChild(t);
  });

  const rightRow = document.createElement("div");
  rightRow.className = "edge-row edge-right";
  rightIndices.forEach((idx, i) => {
    const t = makeTileForPos(idx);
    const c = t.querySelector(".sq-content");
    // rotate all right-side tiles so their content faces inward (90deg clockwise)
    if (c) c.style.transform = "rotate(90deg)";
    rightRow.appendChild(t);
  });

  const bottomRow = document.createElement("div");
  bottomRow.className = "edge-row edge-bottom";
  // bottomIndices are in logical order (right->left) — we render left->right visually, so reverse
  // bottomIndices we want to render left->right visually, so iterate reversed
  const bottomFirst = bottomIndices[0];
  const bottomLast = bottomIndices[bottomIndices.length - 1];
  bottomIndices
    .slice()
    .reverse()
    .forEach((idx) => {
      const t = makeTileForPos(idx);
      const c = t.querySelector(".sq-content");
      // rotate bottom tiles so content faces inward (180deg)
      if (c) c.style.transform = "rotate(180deg)";
      bottomRow.appendChild(t);
    });

  const leftRow = document.createElement("div");
  leftRow.className = "edge-row edge-left";
  // leftIndices were bottom->top; render top->bottom visually by reversing
  leftIndices
    .slice()
    .reverse()
    .forEach((idx, renderIdx) => {
      const t = makeTileForPos(idx);
      const c = t.querySelector(".sq-content");
      // rotate left-side tiles so content faces inward (90deg counter-clockwise)
      // additionally, ensure first two and the last follow the requested orientation
      if (c) c.style.transform = "rotate(-90deg)";
      leftRow.appendChild(t);
    });

  // append rows onto the board
  board.appendChild(topRow);
  board.appendChild(rightRow);
  board.appendChild(bottomRow);
  board.appendChild(leftRow);

  // Re-attach existing player tokens to the new grid
  for (const id of Object.keys(playersMap)) {
    const info = playersMap[id];
    if (info && info.el) {
      const sq = getSquareElementForPosition(info.position || 0);
      if (sq) sq.appendChild(info.el);
    }
  }
  // Create local player token (use temporary id until server assigns one)
  playerElement = createPlayerToken(socket.id || "local", "#ff0000", "You");
  const startSq = getSquareElementForPosition(currentPosition || 0);
  if (playerElement && startSq) startSq.appendChild(playerElement);
}

function getSquareElementForPosition(pos) {
  if (!perimeterIndices || perimeterIndices.length === 0) return null;
  const normalized = pos % perimeterIndices.length;
  // query tile by data-board-pos attribute
  return document.querySelector(`.square[data-board-pos="${normalized}"]`);
}

function onPlayerMove(data) {
  const { position, playerId } = data;
  // Update player position on the board. Move the correct player's token.
  const squareElement = getSquareElementForPosition(position);
  if (!squareElement) return;
  if (playerId === socket.id) {
    // local player
    if (playerElement) squareElement.appendChild(playerElement);
  } else {
    const info = playersMap[playerId];
    if (info && info.el) {
      squareElement.appendChild(info.el);
      info.position = position;
    } else {
      // token doesn't exist yet (race) - create it (use provided name if present)
      const token = createPlayerToken(
        playerId,
        data.color || "#f00",
        data.name || undefined
      );
      playersMap[playerId] = { el: token, position };
      squareElement.appendChild(token);
    }
  }
  // refresh nearby UI
  try {
    updateNearbyUI();
  } catch (e) {
    /* ignore */
  }
}

function onNewPlayer(data) {
  console.log("//////////////");
  console.log(socket.id);
  console.log("//////////////");
  const { playerId, color, name } = data;
  // If this notification is about me, store my id and color
  if (playerId === socket.id) {
    myPlayerId = playerId;

    myColor = color;
    if (playerElement) playerElement.style.background = myColor;
    // Initialize me at GO
    socket.emit("playerMove", { position: 0, playerId });
    // update local token attributes and tooltip
    if (playerElement) {
      playerElement.setAttribute("data-player-id", myPlayerId);
      const tt = playerElement.querySelector(".token-tooltip");
      if (tt) tt.textContent = myName || "You";
    }
  } else {
    // another player joined — create their token at position 0 (or known position later)
    if (!playersMap[playerId]) {
      const token = createPlayerToken(playerId, color, name);
      playersMap[playerId] = { el: token, position: 0, color, name };
      // append to GO (index 0)
      const squareElement = getSquareElementForPosition(0);
      if (squareElement) squareElement.appendChild(token);
    }
  }
  // refresh nearby UI
  try {
    updateNearbyUI();
  } catch (e) {
    /* ignore */
  }
}

function onCurrentPlayers(data) {
  // data is an object: { playerId: { position, money, color }, ... }
  for (const id of Object.keys(data)) {
    if (id === socket.id) continue; // we'll handle ourselves via newPlayer
    const pdata = data[id];
    if (!playersMap[id]) {
      const token = createPlayerToken(id, pdata.color || "#f55", pdata.name);
      playersMap[id] = {
        el: token,
        position: pdata.position || 0,
        color: pdata.color,
        name: pdata.name,
      };
      const squareElement = getSquareElementForPosition(pdata.position || 0);
      if (squareElement) squareElement.appendChild(token);
    }
  }
  // refresh nearby UI
  try {
    updateNearbyUI();
  } catch (e) {
    /* ignore */
  }
}

function onPlayerLeft(data) {
  const { playerId } = data;
  const info = playersMap[playerId];
  if (info) {
    if (info.el && info.el.parentElement)
      info.el.parentElement.removeChild(info.el);
    delete playersMap[playerId];
  }
  try {
    updateNearbyUI();
  } catch (e) {
    /* ignore */
  }
}

function createPlayerToken(playerId, color, name) {
  const el = document.createElement("div");
  el.className = "player";
  el.style.background = color || "#f00";
  el.setAttribute("data-player-id", playerId || "unknown");

  // tooltip element that faces the screen (created inside the token so it participates in 3D)
  const tooltip = document.createElement("div");
  tooltip.className = "token-tooltip";
  const displayName =
    name && name.length
      ? name
      : playerId
      ? String(playerId).slice(-4)
      : "player";
  tooltip.textContent = playerId === socket.id ? "You" : displayName;
  el.appendChild(tooltip);

  // show/hide handled by CSS :hover; for accessibility, also toggle on focus/blur
  el.tabIndex = 0;
  el.addEventListener("focus", () => (tooltip.style.display = "block"));
  el.addEventListener("blur", () => (tooltip.style.display = "none"));

  return el;
}

/* Nearby players UI: shows players in the same square as the local player */
function createNearbyUI() {
  let box = document.getElementById("nearbyUI");
  if (box) return box;
  box = document.createElement("div");
  box.id = "nearbyUI";
  box.style.position = "fixed";
  box.style.right = "12px";
  box.style.bottom = "12px";
  box.style.zIndex = "1600";
  box.style.background = "rgba(255,255,255,0.95)";
  box.style.padding = "8px 12px";
  box.style.borderRadius = "8px";
  box.style.boxShadow = "0 8px 24px rgba(0,0,0,0.15)";
  box.style.minWidth = "160px";
  box.style.fontSize = "13px";
  box.innerHTML = `<div style="font-weight:700;margin-bottom:6px;">Players here</div><div id="nearbyList">(loading)</div>`;
  document.body.appendChild(box);
  return box;
}

function updateNearbyUI() {
  createNearbyUI();
  const listEl = document.getElementById("nearbyList");
  if (!listEl) return;
  // gather players at currentPosition
  const occupants = [];
  // include self
  occupants.push({
    name: myName || "You",
    color:
      myColor || (playerElement && playerElement.style.background) || "#f00",
    id: myPlayerId || socket.id,
  });
  // others
  for (const id of Object.keys(playersMap)) {
    const p = playersMap[id];
    if (
      p &&
      typeof p.position !== "undefined" &&
      p.position === currentPosition
    ) {
      occupants.push({
        name:
          p.el && p.el.querySelector && p.el.querySelector(".token-tooltip")
            ? p.el.querySelector(".token-tooltip").textContent
            : p.name || id,
        color: p.color || "#f55",
        id,
      });
    }
  }
  // If only local user, show lone user text
  if (occupants.length <= 1) {
    listEl.innerHTML = `<div>${occupants[0].name} (you)</div>`;
    return;
  }
  // build list
  listEl.innerHTML = occupants
    .map(
      (o) =>
        `<div style="display:flex;gap:8px;align-items:center;"><span style="width:12px;height:12px;background:${
          o.color
        };border-radius:50%;display:inline-block;"></span><span>${o.name}${
          o.id === myPlayerId ? " (you)" : ""
        }</span></div>`
    )
    .join("");
}

// Initialize when the page loads
document.addEventListener("DOMContentLoaded", () => {
  initializeBoard();

  // Create UI controls (roll dice button + modal)
  createTopControls();

  // Ask for player's display name, then register with server
  createNameModal();
  try {
    updateNearbyUI();
  } catch (e) {}
});

// Rebuild board on resize (debounced) so grid and square sizing adapt to viewport
let _resizeTimer = null;
window.addEventListener("resize", () => {
  clearTimeout(_resizeTimer);
  _resizeTimer = setTimeout(() => {
    initializeBoard();
  }, 250);
});

/* UI + game controls */
function createTopControls() {
  const main = document.querySelector("main");

  const controls = document.createElement("div");
  controls.className = "top-controls";

  const rollBtn = document.createElement("button");
  rollBtn.id = "rollDiceBtn";
  rollBtn.textContent = "Roll Dice";
  rollBtn.disabled = true; // until server assigns id/color
  rollBtn.addEventListener("click", onRollDiceClicked);

  controls.appendChild(rollBtn);
  document.body.appendChild(controls);

  // Modal
  const modal = document.createElement("div");
  modal.className = "dice-modal";
  modal.id = "diceModal";
  modal.innerHTML = `
    <p id="diceMessage">Move X spaces</p>
    <div class="actions">
      <button id="diceCancel">Cancel</button>
      <button id="diceOk" class="ok">OK</button>
    </div>
  `;
  document.body.appendChild(modal);

  document
    .getElementById("diceCancel")
    .addEventListener("click", () => hideModal());
  document.getElementById("diceOk").addEventListener("click", () => {
    const val = Number(modal.getAttribute("data-dice")) || 0;
    hideModal();
    startMoveSequence(val);
  });

  // enable roll when we have player id
  const enableWhenReady = () => {
    const btn = document.getElementById("rollDiceBtn");
    if (myPlayerId) btn.disabled = false;
  };

  // observe myPlayerId being set by polling a few times (simple approach)
  const waiter = setInterval(() => {
    enableWhenReady();
    if (myPlayerId) clearInterval(waiter);
  }, 200);
}

function showModal(value) {
  const modal = document.getElementById("diceModal");
  const msg = document.getElementById("diceMessage");
  msg.textContent = `Move ${value} spaces`;
  modal.setAttribute("data-dice", String(value));
  modal.style.display = "block";
}

function hideModal() {
  const modal = document.getElementById("diceModal");
  if (modal) modal.style.display = "none";
}

function onRollDiceClicked() {
  // only the current player should be able to trigger movement for themselves
  if (!myPlayerId) return;
  const value = Math.floor(Math.random() * 6) + 1;
  showModal(value);
}

let _moveInterval = null;
function startMoveSequence(steps) {
  if (steps <= 0) return;
  const rollBtn = document.getElementById("rollDiceBtn");
  rollBtn.disabled = true;
  let remaining = steps;
  _moveInterval = setInterval(() => {
    if (remaining <= 0) {
      clearInterval(_moveInterval);
      _moveInterval = null;
      if (rollBtn) rollBtn.disabled = false;
      return;
    }
    remaining -= 1;
    // advance one step
    const total =
      typeof BOARD_SQUARES !== "undefined"
        ? BOARD_SQUARES.length
        : document.querySelectorAll(".square").length;
    currentPosition = (currentPosition + 1) % total;
    // visually move local token (map logical position to DOM cell)
    const squareElement = getSquareElementForPosition(currentPosition);
    if (squareElement && playerElement) {
      squareElement.appendChild(playerElement);
      try {
        updateNearbyUI();
      } catch (e) {}
    }
    // notify server of movement so others can be informed
    socket.emit("playerMove", {
      position: currentPosition,
      playerId: myPlayerId,
    });
  }, 420);
}

function createNameModal() {
  // If a name is stored in localStorage, reuse it and notify the server
  const stored = localStorage.getItem("monoplzzz_name");
  if (stored && stored.length) {
    myName = stored;
    // emit newPlayer so server registers us
    socket.emit("newPlayer", { name: myName });
    return;
  }

  // simple modal asking for the player's display name
  const modal = document.createElement("div");
  modal.className = "name-modal";
  modal.id = "nameModal";
  modal.innerHTML = `
    <div>
      <h3>Enter your name</h3>
      <input id="playerNameInput" type="text" placeholder="Your name" />
      <div style="display:flex;gap:8px;justify-content:center;">
        <button id="nameCancel">Cancel</button>
        <button id="nameOk" class="ok">Join</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  const inp = document.getElementById("playerNameInput");
  inp.focus();

  document.getElementById("nameCancel").addEventListener("click", () => {
    // fallback: use anonymous name
    myName = `Player-${Math.random().toString(36).slice(2, 6)}`;
    try {
      localStorage.setItem("monoplzzz_name", myName);
    } catch (e) {}
    closeNameModal();
    socket.emit("newPlayer", { name: myName });
  });

  document.getElementById("nameOk").addEventListener("click", () => {
    const v = String(
      document.getElementById("playerNameInput").value || ""
    ).trim();
    myName = v.length ? v : `Player-${Math.random().toString(36).slice(2, 6)}`;
    closeNameModal();
    try {
      localStorage.setItem("monoplzzz_name", myName);
    } catch (e) {}
    socket.emit("newPlayer", { name: myName });
  });

  function closeNameModal() {
    const m = document.getElementById("nameModal");
    if (m && m.parentElement) m.parentElement.removeChild(m);
  }
}
/* leave this here so that Glitch will not mark global p5.js and socket.io functions as errors */
/* globals io, ADD, ALT, ARROW, AUDIO, AUTO, AXES, BACKSPACE, BASELINE, BEVEL, BEZIER, BLEND, BLUR, BOLD, BOLDITALIC, BOTTOM, BURN, CENTER, CHORD, CLAMP, CLOSE, CONTROL, CORNER, CORNERS, CROSS, CURVE, DARKEST, DEGREES, DEG_TO_RAD, DELETE, DIFFERENCE, DILATE, DODGE, DOWN_ARROW, ENTER, ERODE, ESCAPE, EXCLUSION, FALLBACK, FILL, GRAY, GRID, HALF_PI, HAND, HARD_LIGHT, HSB, HSL, IMAGE, IMMEDIATE, INVERT, ITALIC, LABEL, LANDSCAPE, LEFT, LEFT_ARROW, LIGHTEST, LINEAR, LINES, LINE_LOOP, LINE_STRIP, MIRROR, MITER, MOVE, MULTIPLY, NEAREST, NORMAL, OPAQUE, OPEN, OPTION, OVERLAY, P2D, PI, PIE, POINTS, PORTRAIT, POSTERIZE, PROJECT, QUADRATIC, QUADS, QUAD_STRIP, QUARTER_PI, RADIANS, RADIUS, RAD_TO_DEG, REMOVE, REPEAT, REPLACE, RETURN, RGB, RIGHT, RIGHT_ARROW, ROUND, SCREEN, SHIFT, SOFT_LIGHT, SQUARE, STROKE, SUBTRACT, TAB, TAU, TESS, TEXT, TEXTURE, THRESHOLD, TOP, TRIANGLES, TRIANGLE_FAN, TRIANGLE_STRIP, TWO_PI, UP_ARROW, VIDEO, WAIT, WEBGL, accelerationX, accelerationY, accelerationZ, deltaTime, deviceOrientation, displayHeight, displayWidth, focused, frameCount, height, isKeyPressed, key, keyCode, keyIsPressed, mouseButton, mouseIsPressed, mouseX, mouseY, movedX, movedY, pAccelerationX, pAccelerationY, pAccelerationZ, pRotateDirectionX, pRotateDirectionY, pRotateDirectionZ, pRotationX, pRotationY, pRotationZ, pixels, pmouseX, pmouseY, pwinMouseX, pwinMouseY, rotationX, rotationY, rotationZ, touches, turnAxis, width, winMouseX, winMouseY, windowHeight, windowWidth, abs, acos, alpha, ambientLight, ambientMaterial, angleMode, append, applyMatrix, arc, arrayCopy, asin, atan, atan2, background, beginContour, beginShape, bezier, bezierDetail, bezierPoint, bezierTangent, bezierVertex, blend, blendMode, blue, boolean, box, brightness, byte, camera, ceil, char, circle, clear, clearStorage, color, colorMode, concat, cone, constrain, copy, cos, createA, createAudio, createButton, createCamera, createCanvas, createCapture, createCheckbox, createColorPicker, createDiv, createElement, createFileInput, createGraphics, createImage, createImg, createInput, createNumberDict, createP, createRadio, createSelect, createShader, createSlider, createSpan, createStringDict, createVector, createVideo, createWriter, cursor, curve, curveDetail, curvePoint, curveTangent, curveTightness, curveVertex, cylinder, day, debugMode, degrees, describe, describeElement, directionalLight, displayDensity, dist, downloadFile, ellipse, ellipseMode, ellipsoid, emissiveMaterial, endContour, endShape, erase, exitPointerLock, exp, fill, filter, float, floor, fract, frameRate, frustum, fullscreen, get, getFrameRate, getItem, getURL, getURLParams, getURLPath, green, gridOutput, hex, hour, httpDo, httpGet, httpPost, hue, image, imageMode, int, isLooping, join, keyIsDown, lerp, lerpColor, lightFalloff, lightness, lights, line, loadBytes, loadFont, loadImage, loadJSON, loadModel, loadPixels, loadShader, loadStrings, loadTable, loadXML, log, loop, mag, map, match, matchAll, max, millis, min, minute, model, month, nf, nfc, nfp, nfs, noCanvas, noCursor, noDebugMode, noErase, noFill, noLights, noLoop, noSmooth, noStroke, noTint, noise, noiseDetail, noiseSeed, norm, normalMaterial, orbitControl, ortho, perspective, pixelDensity, plane, point, pointLight, pop, popMatrix, popStyle, pow, print, push, pushMatrix, pushStyle, quad, quadraticVertex, radians, random, randomGaussian, randomSeed, rect, rectMode, red, redraw, registerPromisePreload, removeElements, removeItem, requestPointerLock, resetMatrix, resetShader, resizeCanvas, reverse, rotate, rotateX, rotateY, rotateZ, round, saturation, save, saveCanvas, saveFrames, saveGif, saveJSON, saveJSONArray, saveJSONObject, saveStrings, saveTable, scale, second, select, selectAll, set, setAttributes, setCamera, setFrameRate, setMoveThreshold, setShakeThreshold, shader, shearX, shearY, shininess, shorten, shuffle, sin, smooth, sort, specularColor, specularMaterial, sphere, splice, split, splitTokens, spotLight, sq, sqrt, square, storeItem, str, stroke, strokeCap, strokeJoin, strokeWeight, subset, tan, text, textAlign, textAscent, textDescent, textFont, textLeading, textOutput, textSize, textStyle, textWidth, texture, textureMode, textureWrap, tint, torus, translate, triangle, trim, unchar, unhex, updatePixels, vertex, writeFile, year */

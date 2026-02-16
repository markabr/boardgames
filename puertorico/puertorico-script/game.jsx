const { useState, useCallback, useRef, useEffect, useMemo } = React;

// ==================== GAME CONSTANTS ====================
const GOODS = ['corn','indigo','sugar','tobacco','coffee'];
const GOOD_LABELS = { corn:'Corn', indigo:'Indigo', sugar:'Sugar', tobacco:'Tobacco', coffee:'Coffee' };
const GOOD_TRADE_PRICES = { corn:0, indigo:1, sugar:2, tobacco:3, coffee:4 };
const GOOD_ICONS = { corn:'\u{1F33D}', indigo:'\u{1F4A7}', sugar:'\u{1F9C2}', tobacco:'\u{1F343}', coffee:'\u{2615}' };

const PRODUCTION_BUILDINGS = [
  { id:'small_indigo', name:'Sm. Indigo Plant', cost:1, vp:1, slots:1, type:'production', produces:'indigo', column:1, qty:4 },
  { id:'small_sugar', name:'Sm. Sugar Mill', cost:2, vp:1, slots:1, type:'production', produces:'sugar', column:1, qty:4 },
  { id:'large_indigo', name:'Lg. Indigo Plant', cost:3, vp:2, slots:3, type:'production', produces:'indigo', column:1, qty:3 },
  { id:'large_sugar', name:'Lg. Sugar Mill', cost:4, vp:2, slots:3, type:'production', produces:'sugar', column:2, qty:3 },
  { id:'tobacco_storage', name:'Tobacco Storage', cost:5, vp:3, slots:3, type:'production', produces:'tobacco', column:2, qty:3 },
  { id:'coffee_roaster', name:'Coffee Roaster', cost:6, vp:3, slots:2, type:'production', produces:'coffee', column:2, qty:3 },
];

const VIOLET_BUILDINGS = [
  { id:'small_market', name:'Small Market', cost:1, vp:1, slots:1, type:'violet', column:1, qty:2, desc:'+1 doubloon when trading' },
  { id:'hacienda', name:'Hacienda', cost:2, vp:1, slots:1, type:'violet', column:1, qty:2, desc:'Extra plantation when settling' },
  { id:'construction_hut', name:'Construction Hut', cost:2, vp:1, slots:1, type:'violet', column:1, qty:2, desc:'May take quarry when settling' },
  { id:'small_warehouse', name:'Small Warehouse', cost:3, vp:1, slots:1, type:'violet', column:1, qty:2, desc:'Store 1 good type after Captain' },
  { id:'hospice', name:'Hospice', cost:4, vp:2, slots:1, type:'violet', column:2, qty:2, desc:'Colonist on new plantation' },
  { id:'office', name:'Office', cost:5, vp:2, slots:1, type:'violet', column:2, qty:2, desc:'Trade duplicate good types' },
  { id:'large_market', name:'Large Market', cost:5, vp:2, slots:1, type:'violet', column:2, qty:2, desc:'+2 doubloons when trading' },
  { id:'large_warehouse', name:'Large Warehouse', cost:6, vp:2, slots:1, type:'violet', column:2, qty:2, desc:'Store 2 good types after Captain' },
  { id:'factory', name:'Factory', cost:7, vp:3, slots:1, type:'violet', column:3, qty:2, desc:'Doubloons for variety when producing' },
  { id:'university', name:'University', cost:8, vp:3, slots:1, type:'violet', column:3, qty:2, desc:'Colonist on new building' },
  { id:'harbor', name:'Harbor', cost:8, vp:3, slots:1, type:'violet', column:3, qty:2, desc:'+1 VP per shipment' },
  { id:'wharf', name:'Wharf', cost:9, vp:3, slots:1, type:'violet', column:3, qty:2, desc:'Use personal ship for goods' },
];

const LARGE_BUILDINGS = [
  { id:'guild_hall', name:'Guild Hall', cost:10, vp:4, slots:2, type:'large', column:4, qty:1, desc:'+1 VP/small prod, +2 VP/large prod' },
  { id:'residence', name:'Residence', cost:10, vp:4, slots:2, type:'large', column:4, qty:1, desc:'VP for filled island spaces' },
  { id:'fortress', name:'Fortress', cost:10, vp:4, slots:2, type:'large', column:4, qty:1, desc:'+1 VP per 3 colonists' },
  { id:'customs_house', name:'Customs House', cost:10, vp:4, slots:2, type:'large', column:4, qty:1, desc:'+1 VP per 4 VP chips' },
  { id:'city_hall', name:'City Hall', cost:10, vp:4, slots:2, type:'large', column:4, qty:1, desc:'+1 VP per violet building' },
];

const ALL_BUILDINGS = [...PRODUCTION_BUILDINGS, ...VIOLET_BUILDINGS, ...LARGE_BUILDINGS];
const BUILDING_MAP = {};
ALL_BUILDINGS.forEach(b => BUILDING_MAP[b.id] = b);

const ROLE_ICONS = { settler:'\u{1F33E}', mayor:'\u{1F451}', builder:'\u{1F3D7}', craftsman:'\u{2692}', trader:'\u{1F4B0}', captain:'\u{26F5}', prospector:'\u{26CF}', prospector2:'\u{26CF}' };
const BASE_ROLES = [
  { id:'settler', name:'Settler', desc:'Take a plantation tile' },
  { id:'mayor', name:'Mayor', desc:'Distribute colonists' },
  { id:'builder', name:'Builder', desc:'Build a building' },
  { id:'craftsman', name:'Craftsman', desc:'Produce goods' },
  { id:'trader', name:'Trader', desc:'Sell to trading house' },
  { id:'captain', name:'Captain', desc:'Ship goods for VP' },
];

function getRolesForPlayerCount(n) {
  const roles = [...BASE_ROLES];
  if (n >= 4) roles.push({ id:'prospector', name:'Prospector', desc:'Take 1 doubloon' });
  if (n >= 5) roles.push({ id:'prospector2', name:'Prospector', desc:'Take 1 doubloon' });
  return roles;
}

function getGameConfig(n) {
  return {
    numPlayers: n,
    vpPool:        { 3:75, 4:100, 5:122 }[n],
    colonistPool:  { 3:55, 4:75,  5:95  }[n],
    shipSizes:     { 3:[4,5,6], 4:[5,6,7], 5:[6,7,8] }[n],
    startDoubloons: n - 1,
    faceUpCount:   n + 1,
    roles:         getRolesForPlayerCount(n),
    // Starting plantations: first ceil(n/2) get indigo, rest get corn
    // 3p: Ind/Ind/Corn  4p: Ind/Ind/Corn/Corn  5p: Ind/Ind/Ind/Corn/Corn
    startingPlantation: (i) => i < Math.ceil(n / 2) ? 'indigo' : 'corn',
    // Remove from deck: number of indigo starters and corn starters
    removeIndigo: Math.ceil(n / 2),
    removeCorn:   Math.floor(n / 2),
  };
}

const PLANTATION_SUPPLY_COUNTS = { corn:10, indigo:12, sugar:11, tobacco:9, coffee:8 };
const QUARRY_COUNT = 8;
const TRADING_HOUSE_SIZE = 4;
const ISLAND_SPACES = 12;
const CITY_SPACES = 12;

// ==================== HELPER FUNCTIONS ====================
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i+1)); [a[i],a[j]] = [a[j],a[i]]; }
  return a;
}
function deepClone(obj) { return JSON.parse(JSON.stringify(obj)); }

const PLAYER_COLORS = ['#e05555','#4a9ade','#4abe70','#e6b422','#c87adb'];
function pc(i) { return PLAYER_COLORS[i] || '#888'; }
function tileClass(type) { return `t-${type}`; }
function barrelClass(type) { return `b-${type}`; }
function bldgClass(def) { return def.type === 'production' ? 'bldg-prod' : def.type === 'large' ? 'bldg-large' : 'bldg-violet'; }
const TILE_ICONS = { corn:'\u{1F33D}', indigo:'\u{1F4A7}', sugar:'\u{1F9C2}', tobacco:'\u{1F343}', coffee:'\u{2615}', quarry:'\u{26CF}' };
const TILE_SHORT = { corn:'Corn', indigo:'Ind', sugar:'Sug', tobacco:'Tab', coffee:'Cof', quarry:'Qry' };

function createInitialState(names) {
  const n = names.length;
  const cfg = getGameConfig(n);
  const plantationDeck = shuffle([
    ...Array(PLANTATION_SUPPLY_COUNTS.corn).fill('corn'),
    ...Array(PLANTATION_SUPPLY_COUNTS.indigo).fill('indigo'),
    ...Array(PLANTATION_SUPPLY_COUNTS.sugar).fill('sugar'),
    ...Array(PLANTATION_SUPPLY_COUNTS.tobacco).fill('tobacco'),
    ...Array(PLANTATION_SUPPLY_COUNTS.coffee).fill('coffee'),
  ]);
  let deck = [...plantationDeck];
  let removed = {indigo:0, corn:0};
  deck = deck.filter(p => {
    if (p === 'indigo' && removed.indigo < cfg.removeIndigo) { removed.indigo++; return false; }
    if (p === 'corn' && removed.corn < cfg.removeCorn) { removed.corn++; return false; }
    return true;
  });
  const faceUpPlantations = deck.splice(0, cfg.faceUpCount);
  const buildingSupply = {};
  ALL_BUILDINGS.forEach(b => { buildingSupply[b.id] = b.qty; });
  const goodsSupply = { corn:10, indigo:11, sugar:11, tobacco:9, coffee:9 };
  const players = names.map((name, i) => ({
    name, index: i, doubloons: cfg.startDoubloons, vp: 0,
    plantations: [{ type: cfg.startingPlantation(i), colonist: false }],
    buildings: [], goods: { corn:0, indigo:0, sugar:0, tobacco:0, coffee:0 }, usedWharf: false,
  }));
  const roles = cfg.roles;
  return {
    players, numPlayers: n, governor: 0, currentRoleSelector: 0,
    roles, rolesAvailable: roles.map(r => r.id), roleCoins: {},
    phase: 'role_selection', currentRole: null,
    currentPlayerInPhase: 0, roleSelector: 0,
    vpPool: cfg.vpPool, colonistSupply: cfg.colonistPool - n, colonistShip: n,
    plantationDeck: deck, faceUpPlantations, quarrySupply: QUARRY_COUNT,
    buildingSupply, goodsSupply,
    ships: cfg.shipSizes.map(size => ({ size, goods: [], type: null })),
    tradingHouse: [], round: 1, gameOver: false,
    rolesChosenThisRound: [], rolePickerMap: {}, phaseData: {}, log: [],
  };
}

function hasOccupiedBuilding(player, buildingId) {
  return player.buildings.some(b => b.id === buildingId && b.colonists > 0);
}
function countOccupiedQuarries(player) {
  return player.plantations.filter(p => p.type === 'quarry' && p.colonist).length;
}
function getCitySpacesUsed(player) {
  return player.buildings.reduce((sum, b) => sum + (BUILDING_MAP[b.id].type === 'large' ? 2 : 1), 0);
}
function getProductionCapacity(player, goodType) {
  if (goodType === 'corn') return player.plantations.filter(p => p.type === 'corn' && p.colonist).length;
  const occ = player.plantations.filter(p => p.type === goodType && p.colonist).length;
  let slots = 0;
  player.buildings.forEach(b => { if (BUILDING_MAP[b.id].produces === goodType) slots += b.colonists; });
  return Math.min(occ, slots);
}
function getTradeableGoods(state, pi) {
  const player = state.players[pi]; const th = state.tradingHouse;
  const hasOffice = hasOccupiedBuilding(player, 'office');
  return GOODS.filter(g => player.goods[g] > 0 && (hasOffice || !th.includes(g)));
}
function getShippableOptions(state, pi) {
  const player = state.players[pi]; const opts = [];
  for (const good of GOODS) {
    if (player.goods[good] <= 0) continue;
    for (let si = 0; si < state.ships.length; si++) {
      const ship = state.ships[si];
      const space = ship.size - ship.goods.length;
      if (space <= 0) continue;
      if (ship.type === null || ship.type === good) {
        const other = state.ships.some((s, idx) => idx !== si && s.type === good);
        if (!other || ship.type === good) {
          opts.push({ good, shipIndex: si, amount: Math.min(player.goods[good], space) });
        }
      }
    }
  }
  if (hasOccupiedBuilding(player, 'wharf') && !player.usedWharf) {
    for (const good of GOODS) {
      if (player.goods[good] > 0) opts.push({ good, shipIndex: -1, amount: player.goods[good], wharf: true });
    }
  }
  return opts;
}
function mustShip(state, pi) { return getShippableOptions(state, pi).length > 0; }

// ===== SVG Icons =====
function CoinIcon({size=14}) {
  return <svg width={size} height={size} viewBox="0 0 16 16"><circle cx="8" cy="8" r="7" fill="#d4a017" stroke="#9a7410" strokeWidth="1.5"/><text x="8" y="11.5" textAnchor="middle" fontSize="9" fill="#6a4a00" fontWeight="700">$</text></svg>;
}
function VPIcon({size=14}) {
  return <svg width={size} height={size} viewBox="0 0 16 16"><polygon points="8,1 10.5,5.5 15,6.5 12,10 12.5,15 8,12.5 3.5,15 4,10 1,6.5 5.5,5.5" fill="#7a4a8a" stroke="#5a3060" strokeWidth="1"/></svg>;
}
function ColonistIcon({size=14}) {
  return <svg width={size} height={size} viewBox="0 0 16 16"><circle cx="8" cy="5" r="3" fill="#d4a017"/><path d="M3,15 Q3,9 8,9 Q13,9 13,15" fill="#d4a017"/></svg>;
}

// ==================== MAIN APP ====================
function App() {
  const [screen, setScreen] = useState('home');
  const [numPlayers, setNumPlayers] = useState(4);
  const [names, setNames] = useState(['Player 1','Player 2','Player 3','Player 4']);
  const [game, setGame] = useState(null);
  const [notification, setNotification] = useState(null);

  function changePlayerCount(n) {
    setNumPlayers(n);
    setNames(prev => {
      const next = [];
      for (let i = 0; i < n; i++) next.push(prev[i] || `Player ${i+1}`);
      return next;
    });
  }
  function startGame() {
    const activeNames = names.slice(0, numPlayers);
    const state = createInitialState(activeNames);
    state.roles.forEach(r => { state.roleCoins[r.id] = 0; });
    setGame(state); setScreen('game');
  }
  function notify(msg) { setNotification(msg); setTimeout(() => setNotification(null), 3000); }

  if (screen === 'home') return <HomeScreen names={names} setNames={setNames} numPlayers={numPlayers} onChangePlayerCount={changePlayerCount} startGame={startGame} />;
  if (screen === 'game' && game) {
    if (game.gameOver) return <EndGameScreen game={game} onRestart={() => { setScreen('home'); setGame(null); }} />;
    return (<div><GameScreen game={game} setGame={setGame} notify={notify} />{notification && <div className="notif">{notification}</div>}</div>);
  }
  return null;
}

// ==================== HOME SCREEN ====================
function HomeScreen({ names, setNames, numPlayers, onChangePlayerCount, startGame }) {
  const cfg = getGameConfig(numPlayers);
  return (
    <div className="home">
      <div className="home-card">
        <div className="home-title">Puerto Rico</div>
        <div className="home-sub">A Game of Colonial Development</div>
        <div style={{display:'flex',justifyContent:'center',gap:8,marginBottom:20}}>
          {[3,4,5].map(n => (
            <button key={n} className={`btn btn-sm ${n===numPlayers ? 'btn-gold' : 'btn-ghost'}`}
              onClick={() => onChangePlayerCount(n)} style={{minWidth:60}}>
              {n} Players
            </button>
          ))}
        </div>
        <div className="home-inputs">
          {Array.from({length:numPlayers}).map((_, i) => (
            <div key={i} className="home-row">
              <div className="home-dot" style={{background:pc(i)}}></div>
              <input className="home-input" value={names[i]||''} onChange={e => {
                const n = [...names]; n[i] = e.target.value; setNames(n);
              }} placeholder={`Player ${i+1}`} />
              <span style={{fontSize:'0.65rem',color:'var(--text-muted)',width:40,textAlign:'right'}}>
                {cfg.startingPlantation(i) === 'indigo' ? 'Ind' : 'Corn'}
              </span>
            </div>
          ))}
        </div>
        <div style={{fontSize:'0.7rem',color:'var(--text-dim)',marginBottom:16,lineHeight:1.6,textAlign:'left',padding:'0 4px'}}>
          <span style={{color:'var(--gold)',fontWeight:600}}>Setup:</span> {cfg.startDoubloons} doubloons each &middot; {cfg.vpPool} VP &middot; Ships {cfg.shipSizes.join('/')}<br/>
          {cfg.colonistPool + numPlayers} colonists ({numPlayers} on ship) &middot; {cfg.roles.length} roles &middot; {cfg.faceUpCount} plantations
        </div>
        <button className="btn btn-gold" onClick={startGame} disabled={names.slice(0,numPlayers).some(n => !n || !n.trim())} style={{width:'100%'}}>
          Start Game
        </button>
      </div>
    </div>
  );
}

// ==================== GAME SCREEN ====================
function GameScreen({ game, setGame, notify }) {
  const [modal, setModal] = useState(null);
  const [logOpen, setLogOpen] = useState(false);
  const [prevState, setPrevState] = useState(null);
  const [expandedBoards, setExpandedBoards] = useState(new Set());

  function updateGame(updater) {
    setGame(prev => {
      const next = deepClone(prev);
      const oldActing = prev.phaseData?.actingPlayer ?? prev.currentRoleSelector;
      updater(next);
      const newActing = next.phaseData?.actingPlayer ?? next.currentRoleSelector;
      // Set pending interstitial only if acting player changed AND not first turn AND not automatic phases
      if (oldActing !== newActing && next.round > 1 && next.currentRole !== 'prospector' && next.currentRole !== 'prospector2') {
        const phaseName = next.phase === 'role_selection' ? 'Choose a Role' :
          next.phase === 'role_phase' ? (next.currentRole ? (next.currentRole.charAt(0).toUpperCase() + next.currentRole.slice(1)) : 'Role Phase') :
          next.phase === 'mayor_assignment' ? 'Assign Colonists' : 'Phase';
        next.pendingInterstitial = { playerIndex: newActing, phaseName };
      }
      setPrevState(deepClone(prev));
      return next;
    });
  }
  function addLog(state, msg) { state.log.push(msg); if (state.log.length > 100) state.log.shift(); }

  function checkEndGame(state) {
    if (state.vpPool <= 0) { state.gameOver = true; return; }
    if (state.colonistSupply <= 0 && state.colonistShip <= 0) { state.gameOver = true; return; }
    for (const p of state.players) { if (getCitySpacesUsed(p) >= CITY_SPACES) { state.gameOver = true; return; } }
  }

  function advancePlayer(state) {
    let next = (state.currentPlayerInPhase + 1) % state.numPlayers;
    if (next === 0) { endRolePhase(state); return; }
    state.currentPlayerInPhase = next;
    state.phaseData.actingPlayer = (state.roleSelector + next) % state.numPlayers;
  }

  function startRolePhase(state, roleId) {
    state.currentRole = roleId; state.currentPlayerInPhase = 0;
    state.phaseData = { actingPlayer: state.roleSelector }; state.phase = 'role_phase';
    if (roleId === 'prospector' || roleId === 'prospector2') {
      state.players[state.roleSelector].doubloons += 1;
      addLog(state, `${state.players[state.roleSelector].name} chose Prospector and gains 1 doubloon.`);
      endRolePhase(state); return;
    }
    if (roleId === 'craftsman') { doCraftsmanProduction(state); return; }
    if (roleId === 'mayor') { doMayorDistribution(state); return; }
    addLog(state, `${state.players[state.roleSelector].name} chose ${state.roles.find(r=>r.id===roleId).name}.`);
  }

  function endRolePhase(state) {
    if (state.currentRole === 'captain') doCaptainCleanup(state);
    state.currentRole = null; state.phase = 'role_selection'; state.phaseData = {};
    state.players.forEach(p => p.usedWharf = false);
    state.currentRoleSelector = (state.currentRoleSelector + 1) % state.numPlayers;
    if (state.rolesChosenThisRound.length >= state.numPlayers) endRound(state);
    checkEndGame(state);
  }

  function endRound(state) {
    state.roles.forEach(r => { if (!state.rolesChosenThisRound.includes(r.id)) state.roleCoins[r.id] = (state.roleCoins[r.id]||0) + 1; });
    state.rolesChosenThisRound = []; state.rolePickerMap = {}; state.rolesAvailable = state.roles.map(r => r.id);
    state.governor = (state.governor + 1) % state.numPlayers; state.currentRoleSelector = state.governor; state.round++;
    addLog(state, `--- Round ${state.round}. Governor: ${state.players[state.governor].name} ---`);
    checkEndGame(state);
  }

  // ===== SETTLER =====
  function selectPlantation(plantIdx) {
    updateGame(state => {
      const pi = state.phaseData.actingPlayer; const player = state.players[pi];
      if (player.plantations.length >= ISLAND_SPACES) return;
      let tile;
      if (plantIdx === -1) {
        if (pi !== state.roleSelector && !hasOccupiedBuilding(player, 'construction_hut')) return;
        if (state.quarrySupply <= 0) return;
        tile = 'quarry'; state.quarrySupply--;
      } else { tile = state.faceUpPlantations[plantIdx]; state.faceUpPlantations.splice(plantIdx, 1); }
      const np = { type: tile, colonist: false };
      if (hasOccupiedBuilding(player, 'hospice') && state.colonistSupply > 0) { np.colonist = true; state.colonistSupply--; }
      player.plantations.push(np);
      addLog(state, `${player.name} takes ${tile} plantation.`);
      if (hasOccupiedBuilding(player, 'hacienda') && state.plantationDeck.length > 0 && player.plantations.length < ISLAND_SPACES) {
        const extra = state.plantationDeck.pop(); const ep = { type: extra, colonist: false };
        if (hasOccupiedBuilding(player, 'hospice') && state.colonistSupply > 0) { ep.colonist = true; state.colonistSupply--; }
        player.plantations.push(ep);
        addLog(state, `${player.name} gains extra ${extra} (Hacienda).`);
      }
      advancePlayer(state);
      if (state.phase === 'role_selection') { state.faceUpPlantations = []; const c = Math.min(state.numPlayers+1, state.plantationDeck.length); for(let i=0;i<c;i++) state.faceUpPlantations.push(state.plantationDeck.pop()); }
    });
  }
  function skipSettler() {
    updateGame(state => {
      addLog(state, `${state.players[state.phaseData.actingPlayer].name} skips settling.`);
      advancePlayer(state);
      if (state.phase === 'role_selection') { state.faceUpPlantations = []; const c = Math.min(state.numPlayers+1, state.plantationDeck.length); for(let i=0;i<c;i++) state.faceUpPlantations.push(state.plantationDeck.pop()); }
    });
  }

  // ===== MAYOR =====
  function doMayorDistribution(state) {
    const ship = state.colonistShip; let dist = Array(state.numPlayers).fill(0); let rem = ship; let idx = 0;
    while (rem > 0) { dist[(state.roleSelector + idx) % state.numPlayers]++; rem--; idx++; }
    if (state.colonistSupply > 0) { dist[state.roleSelector]++; state.colonistSupply--; }
    state.players.forEach((p, i) => { if (!p.unassignedColonists) p.unassignedColonists = 0; p.unassignedColonists += dist[i]; });
    state.colonistShip = 0;
    addLog(state, `${state.players[state.roleSelector].name} chose Mayor. Colonists distributed.`);
    state.phase = 'mayor_assignment'; state.currentPlayerInPhase = 0; state.phaseData = { actingPlayer: state.roleSelector };
  }
  function confirmMayorAssignment() {
    updateGame(state => {
      const pi = state.phaseData.actingPlayer; const player = state.players[pi];
      if (player.unassignedColonists > 0) { state.colonistSupply += player.unassignedColonists; player.unassignedColonists = 0; }
      addLog(state, `${player.name} finished assigning colonists.`);
      let next = (state.currentPlayerInPhase + 1) % state.numPlayers;
      if (next === 0) {
        // refill colonist ship
        let empty = 0; state.players.forEach(p => p.buildings.forEach(b => { empty += (BUILDING_MAP[b.id].slots - b.colonists); }));
        const toPlace = Math.max(empty, state.numPlayers); const actual = Math.min(toPlace, state.colonistSupply);
        state.colonistShip = actual; state.colonistSupply -= actual;
        state.phase = 'role_selection'; state.currentRole = null; state.phaseData = {};
        state.players.forEach(p => p.usedWharf = false);
        state.currentRoleSelector = (state.currentRoleSelector + 1) % state.numPlayers;
        if (state.rolesChosenThisRound.length >= state.numPlayers) endRound(state);
        checkEndGame(state);
      } else {
        state.currentPlayerInPhase = next;
        state.phaseData.actingPlayer = (state.roleSelector + next) % state.numPlayers;
      }
    });
  }
  function toggleColonist(target, idx) {
    updateGame(state => {
      const pi = state.phaseData.actingPlayer; const player = state.players[pi];
      if (target === 'plantation') {
        const p = player.plantations[idx];
        if (p.colonist) { p.colonist = false; player.unassignedColonists = (player.unassignedColonists||0) + 1; }
        else if ((player.unassignedColonists||0) > 0) { p.colonist = true; player.unassignedColonists--; }
      } else {
        const b = player.buildings[idx]; const def = BUILDING_MAP[b.id];
        if (b.colonists > 0) { b.colonists--; player.unassignedColonists = (player.unassignedColonists||0) + 1; }
        else if ((player.unassignedColonists||0) > 0 && b.colonists < def.slots) { b.colonists++; player.unassignedColonists--; }
      }
    });
  }

  // ===== BUILDER =====
  function buildBuilding(buildingId) {
    updateGame(state => {
      const pi = state.phaseData.actingPlayer; const player = state.players[pi];
      const def = BUILDING_MAP[buildingId]; const isRS = (pi === state.roleSelector);
      if ((state.buildingSupply[buildingId]||0) <= 0) return;
      if (player.buildings.some(b => b.id === buildingId)) return;
      const needed = def.type === 'large' ? 2 : 1;
      if (getCitySpacesUsed(player) + needed > CITY_SPACES) return;
      let cost = def.cost - Math.min(countOccupiedQuarries(player), def.column);
      if (isRS) cost--; cost = Math.max(0, cost);
      if (player.doubloons < cost) return;
      player.doubloons -= cost; state.buildingSupply[buildingId]--;
      const nb = { id: buildingId, colonists: 0 };
      if (hasOccupiedBuilding(player, 'university') && state.colonistSupply > 0) { nb.colonists = 1; state.colonistSupply--; }
      player.buildings.push(nb);
      addLog(state, `${player.name} builds ${def.name} for ${cost} doubloons.`);
      advancePlayer(state);
    });
  }
  function skipBuilder() { updateGame(state => { addLog(state, `${state.players[state.phaseData.actingPlayer].name} skips building.`); advancePlayer(state); }); }

  // ===== CRAFTSMAN =====
  function doCraftsmanProduction(state) {
    addLog(state, `${state.players[state.roleSelector].name} chose Craftsman.`);
    const produced = state.players.map(player => {
      const pp = {};
      GOODS.forEach(good => { const cap = getProductionCapacity(player, good); const amt = Math.min(cap, state.goodsSupply[good]);
        if (amt > 0) { player.goods[good] += amt; state.goodsSupply[good] -= amt; pp[good] = amt; } });
      return pp;
    });
    state.players.forEach((p, i) => {
      const items = Object.entries(produced[i]).filter(([,v])=>v>0).map(([k,v])=>`${v} ${k}`);
      if (items.length) addLog(state, `${p.name} produces: ${items.join(', ')}.`);
    });
    state.players.forEach((player, i) => {
      if (hasOccupiedBuilding(player, 'factory')) {
        const types = Object.values(produced[i]).filter(v=>v>0).length;
        const bonus = [0,0,1,2,3,5][types]||0;
        if (bonus > 0) { player.doubloons += bonus; addLog(state, `${player.name} earns ${bonus} from Factory.`); }
      }
    });
    const sp = produced[state.roleSelector];
    const tp = Object.keys(sp).filter(k => sp[k] > 0);
    if (tp.length > 0) { state.phase = 'craftsman_privilege'; state.phaseData = { actingPlayer: state.roleSelector, typesProduced: tp }; }
    else endRolePhase(state);
  }
  function chooseCraftsmanBonus(good) {
    updateGame(state => {
      if (state.goodsSupply[good] > 0) { state.players[state.roleSelector].goods[good]++; state.goodsSupply[good]--;
        addLog(state, `${state.players[state.roleSelector].name} takes 1 extra ${good} (privilege).`); }
      endRolePhase(state);
    });
  }

  // ===== TRADER =====
  function tradeGood(good) {
    updateGame(state => {
      const pi = state.phaseData.actingPlayer; const player = state.players[pi]; const isRS = (pi === state.roleSelector);
      if (state.tradingHouse.length >= TRADING_HOUSE_SIZE) return;
      if (player.goods[good] <= 0) return;
      if (!hasOccupiedBuilding(player, 'office') && state.tradingHouse.includes(good)) return;
      let price = GOOD_TRADE_PRICES[good];
      if (isRS) price++; if (hasOccupiedBuilding(player, 'small_market')) price++; if (hasOccupiedBuilding(player, 'large_market')) price += 2;
      player.goods[good]--; state.goodsSupply[good]++; state.tradingHouse.push(good); player.doubloons += price;
      addLog(state, `${player.name} sells ${good} for ${price} doubloons.`);
      advancePlayer(state);
    });
  }
  function skipTrader() { updateGame(state => { addLog(state, `${state.players[state.phaseData.actingPlayer].name} does not trade.`); advancePlayer(state); }); }

  // ===== CAPTAIN =====
  function shipGood(good, shipIndex) {
    updateGame(state => {
      const pi = state.phaseData.actingPlayer; const player = state.players[pi]; const isRS = (pi === state.roleSelector);
      if (shipIndex === -1) {
        if (!hasOccupiedBuilding(player, 'wharf') || player.usedWharf) return;
        const amount = player.goods[good]; if (amount <= 0) return;
        let vp = amount; if (hasOccupiedBuilding(player, 'harbor')) vp++;
        if (isRS && !state.phaseData.privilegeUsed) { vp++; state.phaseData.privilegeUsed = true; }
        const av = Math.min(vp, state.vpPool); player.vp += av; state.vpPool -= av;
        player.goods[good] = 0; state.goodsSupply[good] += amount; player.usedWharf = true;
        addLog(state, `${player.name} ships ${amount} ${good} via Wharf for ${av} VP.`);
      } else {
        const ship = state.ships[shipIndex]; const space = ship.size - ship.goods.length;
        if (space <= 0 || (ship.type && ship.type !== good)) return;
        if (!ship.type && state.ships.some((s, idx) => idx !== shipIndex && s.type === good)) return;
        const amount = Math.min(player.goods[good], space);
        ship.type = good; for (let i=0;i<amount;i++) ship.goods.push(good); player.goods[good] -= amount;
        let vp = amount; if (hasOccupiedBuilding(player, 'harbor')) vp++;
        if (isRS && !state.phaseData.privilegeUsed) { vp++; state.phaseData.privilegeUsed = true; }
        const av = Math.min(vp, state.vpPool); player.vp += av; state.vpPool -= av;
        addLog(state, `${player.name} ships ${amount} ${good} for ${av} VP.`);
      }
      if (mustShip(state, pi)) return;
      advancePlayer(state);
      if (state.phase === 'role_selection') { state.ships.forEach(s => { if (s.goods.length >= s.size) { state.goodsSupply[s.type] += s.goods.length; s.goods = []; s.type = null; } }); }
    });
  }
  function skipCaptain() {
    updateGame(state => {
      const pi = state.phaseData.actingPlayer; if (mustShip(state, pi)) return;
      addLog(state, `${state.players[pi].name} done shipping.`); advancePlayer(state);
      if (state.phase === 'role_selection') { state.ships.forEach(s => { if (s.goods.length >= s.size) { state.goodsSupply[s.type] += s.goods.length; s.goods = []; s.type = null; } }); }
    });
  }
  function doCaptainCleanup(state) {
    state.players.forEach(player => {
      let keepTypes = 0;
      if (hasOccupiedBuilding(player, 'small_warehouse')) keepTypes += 1;
      if (hasOccupiedBuilding(player, 'large_warehouse')) keepTypes += 2;
      const typesWithGoods = GOODS.filter(g => player.goods[g] > 0).sort((a,b) => GOOD_TRADE_PRICES[b] - GOOD_TRADE_PRICES[a]);
      const warehousedTypes = new Set(typesWithGoods.slice(0, keepTypes));
      const nonWarehousedTypes = typesWithGoods.filter(g => !warehousedTypes.has(g));
      let keptOne = false;
      nonWarehousedTypes.forEach(good => {
        if (!keptOne) { const d = player.goods[good] - 1; if (d > 0) { state.goodsSupply[good] += d; player.goods[good] = 1; } keptOne = true; }
        else { state.goodsSupply[good] += player.goods[good]; player.goods[good] = 0; }
      });
      const disc = nonWarehousedTypes.filter(g => player.goods[g] === 0);
      if (disc.length > 0) addLog(state, `${player.name} discards goods.`);
    });
  }

  // ===== ROLE SELECTION =====
  function selectRole(roleId) {
    updateGame(state => {
      if (!state.rolesAvailable.includes(roleId) || state.rolesChosenThisRound.includes(roleId)) return;
      const pi = state.currentRoleSelector; const coins = state.roleCoins[roleId] || 0;
      state.players[pi].doubloons += coins; state.roleCoins[roleId] = 0;
      state.rolesAvailable = state.rolesAvailable.filter(r => r !== roleId);
      state.rolesChosenThisRound.push(roleId); state.rolePickerMap[roleId] = pi; state.roleSelector = pi;
      if (roleId === 'trader' && state.tradingHouse.length >= TRADING_HOUSE_SIZE) {
        state.tradingHouse.forEach(g => state.goodsSupply[g]++); state.tradingHouse = [];
        addLog(state, 'Trading house emptied (was full).');
      }
      startRolePhase(state, roleId);
      // Show interstitial for next role selector in next round (if transitioning to role_selection)
      if (state.phase === 'role_selection' && state.round > 1) {
        const nextSelector = state.currentRoleSelector;
        state.pendingInterstitial = { playerIndex: nextSelector, phaseName: 'Choose a Role' };
      }
    });
  }

  // ==================== RENDER ====================
  const phase = game.phase;
  const actingPlayer = game.phaseData.actingPlayer !== undefined ? game.phaseData.actingPlayer : game.currentRoleSelector;
  const lastLogEntry = game.log.length > 0 ? game.log[game.log.length - 1] : null;
  const secondLastLogEntry = game.log.length > 1 ? game.log[game.log.length - 2] : null;

  function dismissInterstitial() {
    setGame(prev => {
      const next = deepClone(prev);
      next.pendingInterstitial = null;
      return next;
    });
    setPrevState(null);
    setExpandedBoards(new Set());
  }

  function undoLastAction() {
    if (prevState) {
      setGame(prevState);
      setPrevState(null);
    }
  }

  return (
    <div className="game">
      {/* INTERSTITIAL SCREEN */}
      {game.pendingInterstitial && (
        <div className="interstitial-bg">
          <div className="interstitial-box">
            <div className="interstitial-player" style={{color:pc(game.pendingInterstitial.playerIndex)}}>
              {game.players[game.pendingInterstitial.playerIndex].name}
            </div>
            <div style={{fontSize:'1.15rem', color:'var(--gold)', marginBottom:4}}>Your Turn</div>
            <div className="interstitial-phase">{game.pendingInterstitial.phaseName}</div>
            <button className="btn btn-gold" onClick={dismissInterstitial} style={{marginTop:20}}>I'm Ready</button>
          </div>
        </div>
      )}

      {/* TOP BAR */}
      <div className="topbar">
        <div className="topbar-stats">
          <div className="stat-chip"><span style={{fontWeight:600}}>Round {game.round}</span></div>
          <div className="stat-chip" style={{borderColor:pc(game.governor)+'44'}}>
            <span style={{color:pc(game.governor), fontWeight:600}}>{game.players[game.governor].name}</span>
            <span style={{fontSize:'0.7rem',color:'var(--text-muted)'}}>Governor</span>
          </div>
          <div className="stat-chip"><VPIcon size={12}/> <span>{game.vpPool}</span></div>
          <div className="stat-chip"><ColonistIcon size={12}/> <span>{game.colonistSupply} + {game.colonistShip} ship</span></div>
          <div className="stat-chip" style={{color:'var(--quarry)'}}>Q: {game.quarrySupply}</div>
          {game.rolesChosenThisRound.length > 0 && (
            <div className="stat-chip" style={{gap:6}}>
              {game.rolesChosenThisRound.map((roleId, i) => {
                const role = game.roles.find(r => r.id === roleId);
                const pickerIdx = game.rolePickerMap[roleId];
                return <span key={i} style={{fontSize:'0.72rem'}}>{ROLE_ICONS[roleId]} <span style={{color: pickerIdx !== undefined ? pc(pickerIdx) : 'var(--text-dim)', fontWeight:600}}>{game.players[pickerIdx]?.name?.split(' ')[0] || role.name}</span></span>;
              })}
            </div>
          )}
        </div>
        <div style={{display:'flex',gap:6}}>
          <button className="btn btn-sm btn-ghost" onClick={undoLastAction} disabled={!prevState}>Undo</button>
          <button className="btn btn-sm btn-ghost" onClick={() => setLogOpen(!logOpen)}>{logOpen ? 'Hide' : 'Show'} Log</button>
          <button className="btn btn-sm btn-ghost" onClick={() => setModal('market')}>Buildings</button>
        </div>
      </div>

      <div className="main">
        {/* LEFT SIDEBAR: Players */}
        <div className="sidebar-left">
          {game.players.map((p, i) => (
            <PlayerPanel key={i} player={p} active={i === actingPlayer} governor={i === game.governor} />
          ))}
        </div>

        {/* CENTER */}
        <div className="center-col">
          <div className="action-area">
            {/* TURN BANNER */}
            <div className="turn-banner" style={{borderLeftColor:pc(actingPlayer), backgroundColor:pc(actingPlayer)+'15'}}>
              <span style={{color:pc(actingPlayer)}}>{game.players[actingPlayer].name}</span>'s Turn —
              <span style={{color:'var(--text-dim)'}}>
                {phase === 'role_selection' ? 'Choose a Role' :
                 phase === 'role_phase' ? (game.currentRole ? game.roles.find(r=>r.id===game.currentRole)?.name + ' Phase' : 'Role Phase') :
                 phase === 'craftsman_privilege' ? 'Craftsman Privilege' :
                 phase === 'mayor_assignment' ? 'Assign Colonists' : phase}
              </span>
            </div>

            {/* LAST ACTION BAR */}
            {lastLogEntry && (
              <div className="last-action-bar">
                <strong>Last:</strong> {lastLogEntry}
                {secondLastLogEntry && <div style={{marginTop:4}}><strong>Before:</strong> {secondLastLogEntry}</div>}
              </div>
            )}

            {phase === 'role_selection' && <RolePanel game={game} onSelect={selectRole} />}
            {phase === 'role_phase' && game.currentRole === 'settler' && <SettlerAct game={game} onSelect={selectPlantation} onSkip={skipSettler} />}
            {phase === 'role_phase' && game.currentRole === 'builder' && <BuilderAct game={game} onBuild={buildBuilding} onSkip={skipBuilder} />}
            {phase === 'role_phase' && game.currentRole === 'trader' && <TraderAct game={game} onTrade={tradeGood} onSkip={skipTrader} />}
            {phase === 'role_phase' && game.currentRole === 'captain' && <CaptainAct game={game} onShip={shipGood} onSkip={skipCaptain} />}
            {phase === 'craftsman_privilege' && <CraftsmanAct game={game} onChoose={chooseCraftsmanBonus} />}
            {phase === 'mayor_assignment' && <MayorAct game={game} onToggle={toggleColonist} onConfirm={confirmMayorAssignment} />}
          </div>

          <div className="board-area">
            {logOpen && (
              <div className="log-box">
                {game.log.slice(-25).reverse().map((msg, i) => <div key={i}>{msg}</div>)}
              </div>
            )}
            {game.players.map((p, i) => {
              const isExpanded = i === actingPlayer || expandedBoards.has(i);
              return isExpanded ? (
                <PlayerBoard key={i} player={p} active={i === actingPlayer} />
              ) : (
                <CollapsedPlayerBoard key={i} player={p} active={i === actingPlayer} onExpand={() => {
                  const newSet = new Set(expandedBoards);
                  newSet.add(i);
                  setExpandedBoards(newSet);
                }} />
              );
            })}
          </div>
        </div>

        {/* RIGHT SIDEBAR: Board State */}
        <div className="sidebar-right">
          <div>
            <div className="slabel">Cargo Ships</div>
            {game.ships.map((ship, i) => <ShipCard key={i} ship={ship} />)}
          </div>
          <div>
            <div className="slabel">Trading House</div>
            <THCard tradingHouse={game.tradingHouse} />
          </div>
          <div>
            <div className="slabel">Goods Supply</div>
            {GOODS.map(g => (
              <div key={g} className="gs-row">
                <span className={`barrel ${barrelClass(g)}`} style={{width:16,height:16,fontSize:'0.5rem',borderRadius:3}}>{g[0].toUpperCase()}</span>
                <span style={{flex:1}}>{GOOD_LABELS[g]}</span>
                <span style={{fontWeight:600,color:'var(--text-dim)'}}>{game.goodsSupply[g]}</span>
              </div>
            ))}
          </div>
          <div>
            <div className="slabel">Available Plantations</div>
            <div style={{display:'flex',gap:4,flexWrap:'wrap',margin:'4px 0'}}>
              {game.faceUpPlantations.map((type, i) => (
                <div key={i} className={`tile tile-sm ${tileClass(type)}`} style={{cursor:'default'}} title={GOOD_LABELS[type]}>
                  <span className="tile-icon">{TILE_ICONS[type]}</span>
                </div>
              ))}
              {game.quarrySupply > 0 && (
                <div className="tile tile-sm t-quarry" style={{cursor:'default'}} title={`Quarries: ${game.quarrySupply}`}>
                  <span className="tile-icon">{TILE_ICONS.quarry}</span>
                </div>
              )}
            </div>
            <div style={{fontSize:'0.68rem',color:'var(--text-muted)',marginTop:2}}>
              {game.quarrySupply} quarries &middot; {game.plantationDeck.length} in deck
            </div>
          </div>
        </div>
      </div>

      {modal === 'market' && <MarketModal game={game} onClose={() => setModal(null)} />}
    </div>
  );
}

// ==================== PLAYER PANEL (sidebar) ====================
function PlayerPanel({ player, active, governor }) {
  const totalGoods = GOODS.reduce((s, g) => s + player.goods[g], 0);
  return (
    <div className={`pp ${active ? 'active' : ''}`}>
      <div className="pp-header">
        <div className="pp-name" style={{color:pc(player.index)}}>
          {governor && <span className="pp-crown">&#9813;</span>}
          {player.name}
        </div>
        <div className="pp-money"><CoinIcon size={12}/> {player.doubloons}</div>
      </div>
      <div className="pp-stats">
        <span style={{display:'flex',alignItems:'center',gap:2}}><VPIcon size={10}/> {player.vp}</span>
        <span>{player.plantations.length} tiles</span>
        <span>{player.buildings.length} bldgs</span>
      </div>
      <div className="pp-goods">
        {GOODS.map(g => player.goods[g] > 0 && (
          <div key={g} className={`barrel ${barrelClass(g)}`} style={{width:18,height:18,fontSize:'0.55rem'}}>
            {player.goods[g] > 1 && <span className="barrel-count">{player.goods[g]}</span>}
            {g[0].toUpperCase()}
          </div>
        ))}
        {totalGoods === 0 && <span style={{fontSize:'0.7rem',color:'var(--text-muted)'}}>No goods</span>}
      </div>
      <div className="pp-tiles">
        {player.plantations.map((p, i) => (
          <div key={i} className={`tile tile-sm ${tileClass(p.type)} ${p.colonist ? 'tile-occ' : ''}`} title={`${p.type}${p.colonist?' (occupied)':''}`}>
            <span className="tile-icon">{TILE_ICONS[p.type]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ==================== COLLAPSED PLAYER BOARD ====================
function CollapsedPlayerBoard({ player, active, onExpand }) {
  const totalGoods = GOODS.reduce((s, g) => s + player.goods[g], 0);
  return (
    <div className="pboard" style={{cursor:'pointer', background:pc(player.index)+'08', border:'2px solid '+pc(player.index)+'44'}} onClick={onExpand}>
      <div className="pboard-head">
        <div className="pboard-name" style={{color:pc(player.index)}}>{player.name}</div>
        <div className="pboard-res">
          <span className="pboard-res-item"><CoinIcon size={11}/> {player.doubloons}</span>
          <span className="pboard-res-item"><VPIcon size={11}/> {player.vp}</span>
          <span className="pboard-res-item">{player.plantations.length}T</span>
          <span className="pboard-res-item">{player.buildings.length}B</span>
          <span className="pboard-res-item" style={{color:'var(--text-muted)'}}>G:{totalGoods}</span>
          <span style={{marginLeft:8, color:'var(--text-muted)', fontSize:'0.65rem'}}>click to expand ▼</span>
        </div>
      </div>
    </div>
  );
}

// ==================== PLAYER BOARD (detailed) ====================
function PlayerBoard({ player, active }) {
  return (
    <div className={`pboard ${active ? 'pb-active' : ''}`}>
      <div className="pboard-head">
        <div className="pboard-name" style={{color:pc(player.index)}}>{player.name}</div>
        <div className="pboard-res">
          <span className="pboard-res-item"><CoinIcon size={11}/> {player.doubloons}</span>
          <span className="pboard-res-item"><VPIcon size={11}/> {player.vp}</span>
          {GOODS.filter(g => player.goods[g] > 0).map(g => (
            <span key={g} className="pboard-res-item">
              <span className={`barrel ${barrelClass(g)}`} style={{width:14,height:14,fontSize:'0.45rem',borderRadius:2}}>{g[0].toUpperCase()}</span>
              {player.goods[g]}
            </span>
          ))}
        </div>
      </div>
      <div style={{display:'flex', gap:16, flexWrap:'wrap'}}>
        <div style={{flex:'1 1 200px'}}>
          <div className="slabel">Island ({player.plantations.length}/{ISLAND_SPACES})</div>
          <div className="island-row">
            {player.plantations.map((p, i) => (
              <div key={i} className={`tile ${tileClass(p.type)} ${p.colonist ? 'tile-occ' : ''}`}
                title={`${p.type}${p.colonist?' (occupied)':''}`}>
                <span className="tile-icon">{TILE_ICONS[p.type]}</span>
                <span className="tile-label">{TILE_SHORT[p.type]}</span>
              </div>
            ))}
            {Array(Math.max(0, ISLAND_SPACES - player.plantations.length)).fill(0).map((_, i) => (
              <div key={`e${i}`} className="tile t-empty"><span style={{fontSize:'0.7rem'}}>-</span></div>
            ))}
          </div>
        </div>
        <div style={{flex:'2 1 320px'}}>
          <div className="slabel">City ({getCitySpacesUsed(player)}/{CITY_SPACES})</div>
          <CityGrid buildings={player.buildings} />
        </div>
      </div>
    </div>
  );
}

// ==================== CITY GRID (4x3 like physical board) ====================
function CityGrid({ buildings }) {
  // Build a 4-col x 3-row grid. Large buildings span 2 rows.
  // Fill columns left to right, placing buildings into the first available slot.
  const grid = Array.from({length:4}, () => [null, null, null]); // grid[col][row]
  const placed = [];
  buildings.forEach(b => {
    const def = BUILDING_MAP[b.id];
    const isLarge = def.type === 'large';
    for (let col = 0; col < 4; col++) {
      if (isLarge) {
        // Need 2 consecutive rows in this column
        for (let row = 0; row < 2; row++) {
          if (!grid[col][row] && !grid[col][row+1]) {
            grid[col][row] = { b, def, span: true };
            grid[col][row+1] = 'skip';
            placed.push({col, row, b, def, span:true});
            return;
          }
        }
      } else {
        for (let row = 0; row < 3; row++) {
          if (!grid[col][row]) {
            grid[col][row] = { b, def, span: false };
            placed.push({col, row, b, def, span:false});
            return;
          }
        }
      }
    }
  });
  // Render as CSS grid
  const cells = [];
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 4; col++) {
      const cell = grid[col][row];
      if (cell === 'skip') continue;
      const key = `${col}-${row}`;
      if (cell && cell.b) {
        const {b, def, span} = cell;
        const colorClass = def.type === 'production' ? 'bldg-prod' : def.type === 'large' ? 'bldg-large' : 'bldg-violet';
        const borderColor = def.type === 'production' ? 'var(--green)' : def.type === 'large' ? 'var(--orange)' : 'var(--violet)';
        const bgColor = def.type === 'production' ? 'var(--green-dark)' : def.type === 'large' ? 'var(--orange-dark)' : 'var(--violet-dark)';
        cells.push(
          <div key={key} className={`city-cell city-cell-filled ${span ? 'city-cell-large' : ''}`}
            style={{gridColumn:col+1, gridRow: span ? `${row+1} / ${row+3}` : row+1}}>
            <div className="city-bldg" style={{borderColor, background:bgColor}} title={def.desc || (def.produces ? `Produces ${def.produces}` : '')}>
              <div className="bldg-name">{def.name}</div>
              <div className="bldg-dots">
                {Array(def.slots).fill(0).map((_, si) => <span key={si} className={`cdot ${si < b.colonists ? 'cdot-on' : ''}`}></span>)}
              </div>
            </div>
          </div>
        );
      } else {
        cells.push(
          <div key={key} className="city-cell" style={{gridColumn:col+1, gridRow:row+1}}>
            <span style={{fontSize:'0.55rem'}}>empty</span>
          </div>
        );
      }
    }
  }
  return <div className="city-grid">{cells}</div>;
}

// ==================== SHIP / TRADING HOUSE ====================
function ShipCard({ ship }) {
  return (
    <div className="ship-card" style={{marginBottom:6}}>
      <div className="ship-label">
        <span>{ship.size}-cargo</span>
        {ship.type && <span className={`barrel ${barrelClass(ship.type)}`} style={{width:14,height:14,fontSize:'0.45rem',borderRadius:2}}>{ship.type[0].toUpperCase()}</span>}
      </div>
      <div className="ship-hold">
        {Array(ship.size).fill(0).map((_, i) => (
          <div key={i} className={`ship-slot ${i < ship.goods.length ? 'ship-slot-full' : ''}`}>
            {i < ship.goods.length && <span className={`barrel ${barrelClass(ship.goods[i])}`} style={{width:18,height:18,fontSize:'0.5rem',borderRadius:3}}>{ship.goods[i][0].toUpperCase()}</span>}
          </div>
        ))}
      </div>
    </div>
  );
}

function THCard({ tradingHouse }) {
  return (
    <div className="th-card">
      <div className="th-label">4 slots {tradingHouse.length === 4 && '(Full!)'}</div>
      <div className="th-slots">
        {Array(TRADING_HOUSE_SIZE).fill(0).map((_, i) => (
          <div key={i} className={`th-slot ${i < tradingHouse.length ? 'th-slot-full' : ''}`}>
            {i < tradingHouse.length && <span className={`barrel ${barrelClass(tradingHouse[i])}`} style={{width:22,height:22,fontSize:'0.6rem',borderRadius:4}}>{tradingHouse[i][0].toUpperCase()}</span>}
          </div>
        ))}
      </div>
    </div>
  );
}

// ==================== ACTION PANELS ====================
function RolePanel({ game, onSelect }) {
  const player = game.players[game.currentRoleSelector];
  return (
    <div className="act">
      <div className="act-header">
        <div className="act-phase">Choose a Role</div>
        <div className="act-player" style={{color:pc(player.index)}}>{player.name}</div>
      </div>
      <div className="roles">
        {game.roles.map(role => {
          const taken = game.rolesChosenThisRound.includes(role.id);
          const coins = game.roleCoins[role.id] || 0;
          return (
            <div key={role.id} className={`role ${taken ? 'role-gone' : ''}`} onClick={() => !taken && onSelect(role.id)}>
              <div className="role-icon">{ROLE_ICONS[role.id]}</div>
              <div className="role-name">{role.name}</div>
              {coins > 0 && <div className="role-coins">+{coins} <CoinIcon size={10}/></div>}
              <div className="role-desc">{role.desc}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SettlerAct({ game, onSelect, onSkip }) {
  const pi = game.phaseData.actingPlayer; const player = game.players[pi];
  const isRS = (pi === game.roleSelector);
  const canQuarry = isRS || hasOccupiedBuilding(player, 'construction_hut');
  const full = player.plantations.length >= ISLAND_SPACES;
  return (
    <div className="act">
      <div className="act-header">
        <div className="act-phase">{ROLE_ICONS.settler} Settler</div>
        <div className="act-player" style={{color:pc(pi)}}>{player.name}'s turn</div>
      </div>
      {isRS && <div className="act-priv">&#9733; Privilege: May take a quarry instead</div>}
      {full ? (
        <div><div className="act-hint">Island is full!</div><button className="btn btn-sm btn-ghost" onClick={onSkip}>Skip</button></div>
      ) : (
        <div>
          <div className="act-hint">Select a plantation tile:</div>
          <div style={{display:'flex', gap:8, flexWrap:'wrap', margin:'8px 0'}}>
            {game.faceUpPlantations.map((type, i) => (
              <div key={i} className={`tile tile-lg ${tileClass(type)}`} onClick={() => onSelect(i)}>
                <span className="tile-icon">{TILE_ICONS[type]}</span>
                <span className="tile-label">{GOOD_LABELS[type] || type}</span>
              </div>
            ))}
            {canQuarry && game.quarrySupply > 0 && (
              <div className="tile tile-lg t-quarry" onClick={() => onSelect(-1)}>
                <span className="tile-icon">{TILE_ICONS.quarry}</span>
                <span className="tile-label">Quarry</span>
              </div>
            )}
          </div>
          <button className="btn btn-sm btn-ghost" onClick={onSkip} style={{marginTop:4}}>Skip</button>
        </div>
      )}
    </div>
  );
}

function BuilderAct({ game, onBuild, onSkip }) {
  const pi = game.phaseData.actingPlayer; const player = game.players[pi];
  const isRS = (pi === game.roleSelector);
  const quarries = countOccupiedQuarries(player);
  const spaceLeft = CITY_SPACES - getCitySpacesUsed(player);

  const columns = [
    { label: 'Column I', cost: '1-3', buildings: ALL_BUILDINGS.filter(b => b.column === 1) },
    { label: 'Column II', cost: '4-6', buildings: ALL_BUILDINGS.filter(b => b.column === 2) },
    { label: 'Column III', cost: '7-9', buildings: ALL_BUILDINGS.filter(b => b.column === 3) },
    { label: 'Column IV', cost: '10', buildings: ALL_BUILDINGS.filter(b => b.column === 4) },
  ];

  return (
    <div className="act">
      <div className="act-header">
        <div className="act-phase">{ROLE_ICONS.builder} Builder</div>
        <div className="act-player" style={{color:pc(pi)}}>{player.name}'s turn</div>
      </div>
      {isRS && <div className="act-priv">&#9733; Privilege: -1 cost on building</div>}
      <div style={{display:'flex', gap:12, alignItems:'center', marginBottom:10, flexWrap:'wrap'}}>
        <span style={{display:'flex',alignItems:'center',gap:4,fontSize:'0.82rem',fontWeight:600}}><CoinIcon size={13}/> {player.doubloons}</span>
        <span style={{fontSize:'0.78rem',color:'var(--text-dim)'}}>Quarry discount: <strong style={{color:'var(--text)'}}>{quarries}</strong></span>
        <span style={{fontSize:'0.78rem',color:'var(--text-dim)'}}>City space: <strong style={{color:'var(--text)'}}>{spaceLeft}</strong></span>
      </div>
      <div className="builder-board">
        {columns.map((col, ci) => (
          <div key={ci} className="builder-col">
            <div className="builder-col-header">{col.label}</div>
            {col.buildings.map(def => {
              const supply = game.buildingSupply[def.id] || 0;
              const alreadyOwned = player.buildings.some(b => b.id === def.id);
              const spaceFit = (def.type === 'large' ? 2 : 1) <= spaceLeft;
              const gone = supply <= 0 || alreadyOwned;
              let cost = def.cost - Math.min(quarries, def.column);
              if (isRS) cost--; cost = Math.max(0, cost);
              const canAfford = player.doubloons >= cost && spaceFit && !gone;
              const tileStyle = def.type === 'production' ? 'builder-tile-prod'
                              : def.type === 'large' ? 'builder-tile-large' : 'builder-tile-violet';
              return (
                <div key={def.id}
                  className={`builder-tile ${tileStyle} ${gone ? 'builder-tile-gone' : ''} ${!canAfford && !gone ? 'builder-tile-dim' : ''}`}
                  onClick={() => canAfford && onBuild(def.id)}
                  title={alreadyOwned ? 'Already built' : supply <= 0 ? 'Sold out' : !spaceFit ? 'No city space' : ''}>
                  <div className="builder-tile-name">{def.name}</div>
                  <div className="builder-tile-desc">{def.desc || `Produces ${def.produces}`}</div>
                  <div className="builder-tile-row">
                    <div className="builder-tile-cost">
                      <CoinIcon size={10}/> {cost}
                      {cost !== def.cost && <span className="builder-tile-cost-was">{def.cost}</span>}
                    </div>
                    <div className="builder-tile-vp"><VPIcon size={9}/> {def.vp}</div>
                  </div>
                  <div className="builder-tile-dots">
                    {Array(def.slots).fill(0).map((_,i) => <span key={i} className="cdot"></span>)}
                  </div>
                  {!gone && <div className="builder-tile-qty">{supply}x</div>}
                </div>
              );
            })}
          </div>
        ))}
      </div>
      <button className="btn btn-sm btn-ghost" onClick={onSkip} style={{marginTop:10}}>Skip Building</button>
    </div>
  );
}

function TraderAct({ game, onTrade, onSkip }) {
  const pi = game.phaseData.actingPlayer; const player = game.players[pi];
  const isRS = (pi === game.roleSelector);
  const tradeables = getTradeableGoods(game, pi);
  const thFull = game.tradingHouse.length >= TRADING_HOUSE_SIZE;
  return (
    <div className="act">
      <div className="act-header">
        <div className="act-phase">{ROLE_ICONS.trader} Trader</div>
        <div className="act-player" style={{color:pc(pi)}}>{player.name}'s turn</div>
      </div>
      {isRS && <div className="act-priv">&#9733; Privilege: +1 doubloon on sale</div>}
      <div style={{marginBottom:10}}><THCard tradingHouse={game.tradingHouse} /></div>
      {thFull ? <div className="act-hint">Trading house is full!</div>
       : tradeables.length === 0 ? <div className="act-hint">No goods to trade (or duplicates in trading house).</div>
       : (
        <div style={{display:'flex', gap:6, flexWrap:'wrap', margin:'8px 0'}}>
          {tradeables.map(good => {
            let price = GOOD_TRADE_PRICES[good];
            if (isRS) price++; if (hasOccupiedBuilding(player, 'small_market')) price++; if (hasOccupiedBuilding(player, 'large_market')) price += 2;
            return (
              <button key={good} className="btn btn-sm btn-green" onClick={() => onTrade(good)}>
                <span className={`barrel ${barrelClass(good)}`} style={{width:16,height:16,fontSize:'0.5rem',borderRadius:3,marginRight:4}}>{good[0].toUpperCase()}</span>
                Sell {GOOD_LABELS[good]} &rarr; {price} <CoinIcon size={10}/>
              </button>
            );
          })}
        </div>
      )}
      <button className="btn btn-sm btn-ghost" onClick={onSkip} style={{marginTop:6}}>Skip</button>
    </div>
  );
}

function CaptainAct({ game, onShip, onSkip }) {
  const pi = game.phaseData.actingPlayer; const player = game.players[pi];
  const isRS = (pi === game.roleSelector); const options = getShippableOptions(game, pi);
  const must = options.length > 0;
  return (
    <div className="act">
      <div className="act-header">
        <div className="act-phase">{ROLE_ICONS.captain} Captain</div>
        <div className="act-player" style={{color:pc(pi)}}>{player.name}'s turn</div>
      </div>
      {isRS && !game.phaseData.privilegeUsed && <div className="act-priv">&#9733; Privilege: +1 VP on first shipment</div>}
      <div style={{display:'flex', gap:8, marginBottom:8}}>
        {game.ships.map((ship, i) => <ShipCard key={i} ship={ship} />)}
      </div>
      <div className="act-hint" style={{marginBottom:6}}>
        Your goods: {GOODS.filter(g=>player.goods[g]>0).map(g => (
          <span key={g} style={{marginRight:6}}>
            <span className={`barrel ${barrelClass(g)}`} style={{width:16,height:16,fontSize:'0.45rem',borderRadius:3}}>{g[0].toUpperCase()}</span>
            <span style={{marginLeft:2}}>{player.goods[g]}</span>
          </span>
        ))}
        {GOODS.every(g => player.goods[g] === 0) && 'none'}
      </div>
      {must ? (
        <div>
          <div style={{fontSize:'0.78rem', color:'var(--gold)', marginBottom:6, fontWeight:600}}>You must ship goods!</div>
          <div className="cap-opts">
            {options.map((opt, i) => (
              <div key={i} className="cap-opt" onClick={() => onShip(opt.good, opt.shipIndex)}>
                <span className={`barrel ${barrelClass(opt.good)}`} style={{width:18,height:18,fontSize:'0.5rem',borderRadius:3,marginRight:4}}>{opt.good[0].toUpperCase()}</span>
                {opt.amount} {GOOD_LABELS[opt.good]} &rarr; {opt.wharf ? 'Wharf' : `${game.ships[opt.shipIndex].size}-ship`}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div>
          <div className="act-hint">No goods to ship.</div>
          <button className="btn btn-sm btn-ghost" onClick={onSkip}>Done</button>
        </div>
      )}
    </div>
  );
}

function CraftsmanAct({ game, onChoose }) {
  const pi = game.roleSelector; const player = game.players[pi];
  return (
    <div className="act">
      <div className="act-header">
        <div className="act-phase">{ROLE_ICONS.craftsman} Craftsman Privilege</div>
        <div className="act-player" style={{color:pc(pi)}}>{player.name}</div>
      </div>
      <div className="act-hint">Choose 1 extra good of a type you produced:</div>
      <div style={{display:'flex', gap:8, margin:'10px 0'}}>
        {game.phaseData.typesProduced.map(good => game.goodsSupply[good] > 0 && (
          <button key={good} className="btn btn-sm btn-green" onClick={() => onChoose(good)}>
            <span className={`barrel ${barrelClass(good)}`} style={{width:18,height:18,fontSize:'0.55rem',borderRadius:3,marginRight:4}}>{good[0].toUpperCase()}</span>
            +1 {GOOD_LABELS[good]}
          </button>
        ))}
      </div>
    </div>
  );
}

function MayorAct({ game, onToggle, onConfirm }) {
  const pi = game.phaseData.actingPlayer; const player = game.players[pi];
  const unassigned = player.unassignedColonists || 0;
  return (
    <div className="act">
      <div className="act-header">
        <div className="act-phase">{ROLE_ICONS.mayor} Mayor</div>
        <div className="act-player" style={{color:pc(pi)}}>{player.name}: Assign Colonists</div>
      </div>
      <div style={{marginBottom:10}}>
        <span className="unassigned-badge"><ColonistIcon size={14}/> {unassigned} unassigned</span>
      </div>
      <div className="act-hint" style={{marginBottom:8}}>Click tiles/buildings to add or remove colonists.</div>
      <div className="mayor-grid">
        <div className="mayor-col">
          <h4>Plantations</h4>
          <div style={{display:'flex', gap:4, flexWrap:'wrap'}}>
            {player.plantations.map((p, i) => (
              <div key={i} className={`tile ${tileClass(p.type)} ${p.colonist ? 'tile-occ' : ''}`}
                style={{cursor:'pointer'}} onClick={() => onToggle('plantation', i)}>
                <span className="tile-icon">{TILE_ICONS[p.type]}</span>
                <span className="tile-label">{TILE_SHORT[p.type]}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="mayor-col">
          <h4>Buildings</h4>
          <div className="city-list">
            {player.buildings.map((b, i) => {
              const def = BUILDING_MAP[b.id];
              return (
                <div key={i} className={`bldg ${bldgClass(def)} bldg-clickable`} onClick={() => onToggle('building', i)}>
                  <div className="bldg-info"><div className="bldg-name">{def.name}</div></div>
                  <div className="bldg-dots">
                    {Array(def.slots).fill(0).map((_, si) => <span key={si} className={`cdot ${si < b.colonists ? 'cdot-on' : ''}`}></span>)}
                  </div>
                </div>
              );
            })}
            {player.buildings.length === 0 && <div style={{fontSize:'0.75rem',color:'var(--text-muted)'}}>No buildings</div>}
          </div>
        </div>
      </div>
      <button className="btn btn-sm btn-green" onClick={onConfirm} style={{marginTop:12}}>
        Confirm {unassigned > 0 ? `(${unassigned} returned to supply)` : ''}
      </button>
    </div>
  );
}

// ==================== MODALS ====================
function MarketModal({ game, onClose }) {
  return (
    <div className="modal-bg" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <h2>Building Market</h2>
        <table>
          <thead><tr><th>Building</th><th>Cost</th><th>VP</th><th>Slots</th><th>Left</th><th>Ability</th></tr></thead>
          <tbody>
            {ALL_BUILDINGS.map(b => (
              <tr key={b.id} style={{opacity:(game.buildingSupply[b.id]||0)>0?1:0.25}}>
                <td style={{fontWeight:600}}>{b.name}</td>
                <td>{b.cost}</td><td>{b.vp}</td><td>{b.slots}</td>
                <td>{game.buildingSupply[b.id]||0}</td>
                <td style={{fontSize:'0.72rem',color:'var(--text-dim)'}}>{b.desc||(b.produces?`Produces ${b.produces}`:'')}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <button className="btn btn-sm btn-ghost" onClick={onClose} style={{marginTop:12}}>Close</button>
      </div>
    </div>
  );
}

// ==================== END GAME ====================
function EndGameScreen({ game, onRestart }) {
  const scores = game.players.map(player => {
    let buildingVP = 0, bonusVP = 0;
    player.buildings.forEach(b => {
      const def = BUILDING_MAP[b.id]; buildingVP += def.vp;
      if (b.colonists > 0) {
        if (b.id === 'guild_hall') player.buildings.forEach(ob => { const od = BUILDING_MAP[ob.id]; if (od.type === 'production') bonusVP += (od.slots === 1 ? 1 : 2); });
        else if (b.id === 'residence') { const t = player.plantations.length; bonusVP += t <= 9 ? 4 : t === 10 ? 5 : t === 11 ? 6 : 7; }
        else if (b.id === 'fortress') { let c = 0; player.plantations.forEach(p => { if (p.colonist) c++; }); player.buildings.forEach(b2 => c += b2.colonists); bonusVP += Math.floor(c / 3); }
        else if (b.id === 'customs_house') bonusVP += Math.floor(player.vp / 4);
        else if (b.id === 'city_hall') player.buildings.forEach(ob => { const od = BUILDING_MAP[ob.id]; if (od.type === 'violet' || od.type === 'large') bonusVP++; });
      }
    });
    return { name: player.name, index: player.index, chipVP: player.vp, buildingVP, bonusVP,
      total: player.vp + buildingVP + bonusVP, doubloons: player.doubloons,
      goods: GOODS.reduce((s,g) => s + player.goods[g], 0) };
  });
  scores.sort((a, b) => b.total - a.total || (b.doubloons + b.goods) - (a.doubloons + a.goods));
  return (
    <div className="endgame">
      <h1>Game Over</h1>
      <h2 style={{color:pc(scores[0].index)}}>{scores[0].name} Wins!</h2>
      <div className="end-table">
        <table>
          <thead><tr><th>#</th><th>Player</th><th>VP Chips</th><th>Building</th><th>Bonus</th><th>Total</th><th>Tiebreak</th></tr></thead>
          <tbody>
            {scores.map((s, i) => (
              <tr key={s.index} className={i === 0 ? 'end-winner' : ''}>
                <td>{i+1}</td>
                <td style={{color:pc(s.index), fontWeight:700}}>{s.name}</td>
                <td>{s.chipVP}</td><td>{s.buildingVP}</td><td>{s.bonusVP}</td>
                <td style={{fontWeight:700, fontSize:'1.1rem', color:'var(--gold)'}}>{s.total}</td>
                <td style={{color:'var(--text-dim)'}}>{s.doubloons + s.goods}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button className="btn btn-gold" onClick={onRestart}>Play Again</button>
    </div>
  );
}

ReactDOM.render(<App />, document.getElementById('root'));
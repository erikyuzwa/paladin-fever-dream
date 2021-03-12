// "Temple of Anguish 2: Return to the Sanctum" for 7DRL 2021

var g = new rote.Game({
  id: 'display',
  keyboard: 'multi-move',
  // haveSplash: true,
  data: {
    monsters: 'data/monsters.json',
    items: 'data/items.json',
    props: 'data/props.json',
    levels: 'data/levels.json',
    abilities: 'data/abilities.json',
    playlist: 'data/playlist.json'
  },
  customEffects: {
    gameOver: gameOver,
  }
});

function gameOver() {
  g.print(`
		The machine begins crushing the sunstone, causing an explosion! OH NO!
		The ground begins to quake, worse and worse.
		Considering the disaster this will caused aobve, you assume that the pale, old dwarf must have lied to you.
		Your quest may be fulfilled, but what devasation will befall this land?`,
    'plot'
  );
  g.print('GAME OVER');

}

g.addHook('afterTeleportLevel', (data, game) => {
  if (!data.levelIndex) { return; }
  if (game.hero.xp < data.levelIndex) {
    game.hero.xp += 1;
    game.hero.score += (10 * data.levelIndex);
    // game.hero.gainRandomAbility(g.data.abilities);
    game.hero.gainRandomPoolMax();
    game.print('Ding! You gain experience.', 'tip')
  }
});

function createPlayerCharacter(level) {
  const { x, y } = level.findRandomFreeCell();
  g.createHero({
    x, y, name: 'Paladin', sightRange: 8,
    color: '#df2',
    hp: 12, mp: 10, ap: 2, bp: 2, ep: 2,
    faction: 'human'
  });

  //TODO submit patch to rote-js for armor / defense
  //g.hero.def = 0;

  g.hero.inventory.add( new rote.Item({ name: 'Spell Book', character: "⌓" }) );
  g.hero.gainRandomAbility(g.data.abilities);
  g.hero.gainRandomAbility(g.data.abilities);
  console.log('hero', g.hero);
}

function setupMachinery(level) {
  // level.findPropsByType('extractor');
  // level.findPropsByType('extractorSwitch');
}

function getAbilityHtml(hero, index) {
  const ability = hero.getAbilityByIndex(index);
  if (!ability) {
    return `<li class="none"></li>`;
  }
  const costs = Object.keys(ability.readyCost);
  let costsHtml = '';
  costs.forEach((costKey) => {
    const max = ability.readyCost[costKey];
    const fill = (ability.isReadied) ? max : 0;
    costsHtml += getPoolHtml(costKey, fill, max, 0);
  });
  return `
	<li title="${ability.description}" class=${ability.isReadied ? 'ready' : ''}>
		<span class="number">${index + 1}</span>
		<span>${ability.name}</span>
		${costsHtml}
		<div class="description">
			${rote.Actor.getAbilityDescriptionHtml(ability)}
		</div>
	</li>`;
}

function getPoolHtml(key, a, b, c) {
  return `<span class="pool ${key}-pool">${rote.Display.getPoolSquares(a, b, c)}</span>`
}

function runGame () {
  const seed = rote.random.makeSeed();
  // Connect to browser DOM for display
  g.createDisplay({
    width: 40,
    height: 20,
    fontSize: 20,
    fontFamily: "Fix15MonoBold" // alternatives: "AppleII" or "White Rabbit"
  });
  g.display.drawInterface = function(game, hero) {
    console.log('hero', hero);
    const level = game.getActiveLevel();
    const intElt = document.getElementById('interface');
    const deadHtml = hero.dead() ? `<div class="dead">DEAD</div>` : '';
    const used = hero.getAbilityReadiedAmounts();
    intElt.innerHTML = (`
			<ul class="stats">
			<li><span>${hero.name}</span></li>
			<li><span title="${level.description}">Floor: ${game.activeLevelIndex + 1} / ${game.levels.length}</span>
				<!-- <span class="score">Score: ${hero.score}</span> -->
			</li>
			<li>Weapon Damage: ${hero.getWeaponDamage()}</li>
			<!-- TODO submit to rote-js <li>Defense Rating: </li> -->
			<li class="hp"><span title="hit points">HP:</span> ${getPoolHtml('hp', hero.hp, hero.hpMax, used.hp)}</li>
			<li class="mp"><span title="mana points">MP:</span> ${getPoolHtml('mp', hero.mp, hero.mpMax, used.mp)}</li>
			<!-- <li class="ap"><span title="attack points">AP:</span> ${getPoolHtml('ap', hero.ap, hero.apMax, used.ap)}</li> -->
			<!-- <li class="bp"><span title="balance points">BP:</span> ${getPoolHtml('bp', hero.bp, hero.bpMax, used.bp)}</li> -->
			<!-- <li class="ep"><span title="endurance points">EP:</span> ${getPoolHtml('ep', hero.ep, hero.epMax, used.ep)}</li> -->
			</ul>
			${deadHtml}
			<ul class="abilities">
			${getAbilityHtml(hero, 0)}
			${getAbilityHtml(hero, 1)}
			${getAbilityHtml(hero, 2)}
			${getAbilityHtml(hero, 3)}
			${getAbilityHtml(hero, 4)}
			</ul>
			<div class="seed">Seed: ${seed}</div>
		`);
  };
  g.display.drawDamage = function(isDamaged = false) {
    const displayElt = document.getElementById('display');
    if (isDamaged) {
      displayElt.classList.add('damaged');
    } else {
      displayElt.classList.remove('damaged');
    }
  };
  // Build the game world
  g.createLevels([
    'town',
    { levelTypeKey: 'dungeon', repeat: 2 },
    'torture',
    'temple',
  ], seed);
  const bottomLevel = g.levels[g.levels.length - 1];
  setupMachinery(bottomLevel);
  const topLevel = g.levels[0];
  // Create pcs, npcs, items
  // rote.random.setSeed();
  createPlayerCharacter(topLevel);

  // "highlight" some parts of the town
  const sunstone = topLevel.items.find((item) => { return item.type === 'sunstone'; });
  topLevel.discoverCircle(sunstone.x, sunstone.y, 5);
  const stairs = topLevel.props.find((prop) => { return prop.type === 'stairsDown'; });
  topLevel.discoverCircle(stairs.x, stairs.y, 3);
  // Start the game
  setTimeout(() => {
    g.print('Paladin!', 'plot');
  }, 1000);
  setTimeout(() => {
    //g.print('A mysterious, pale dwarf tells you there is a powerful sunstone on this floor that is damaged and needs to be taken to the bottom floor for safety.', 'plot');
    g.print('Thank heavens ye have arrived!', 'plot');
  }, 3000);
  //setTimeout(() => {
    //g.print('He offers to pay you a large sum of gold when your quest is complete. ...If you survive.', 'plot', 100);
    //g.print('A mysterious Elf tells you there is a corrupted, but powerful Amethyst on this floor that needs to be taken to the Temple for cleansing.', 'plot', 100);
 // }, 5000);
  // g.print('> Move with your favorite movement keys, and use things with Enter. <', 'tip', 200);
  g.start();
}

g.ready(runGame);

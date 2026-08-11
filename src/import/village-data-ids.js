export const HOME_BUILDING_IDS=Object.freeze({
  1000000:"army_camp",1000001:"town_hall",1000002:"elixir_collector",1000003:"elixir_storage",1000004:"gold_mine",1000005:"gold_storage",
  1000006:"barracks",1000007:"laboratory",1000008:"cannon",1000009:"archer_tower",1000010:"wall",1000011:"wizard_tower",1000012:"air_defense",
  1000013:"mortar",1000014:"clan_castle",1000015:"builder_hut",1000019:"hidden_tesla",1000020:"spell_factory",1000021:"x_bow",1000023:"dark_elixir_drill",
  1000024:"dark_elixir_storage",1000026:"dark_barracks",1000028:"air_sweeper",1000029:"dark_spell_factory",1000032:"bomb_tower",1000070:"blacksmith",
  1000071:"hero_hall",1000093:"helper_hut",
});

export const HOME_TRAP_IDS=Object.freeze({
  12000000:"bomb",12000001:"spring_trap",12000002:"giant_bomb",12000005:"air_bomb",12000006:"seeking_air_mine",12000008:"skeleton_trap",
});

export const HOME_UNIT_IDS=Object.freeze({
  4000000:"barbarian",4000001:"archer",4000002:"goblin",4000003:"giant",4000004:"wall_breaker",4000005:"balloon",4000006:"wizard",4000007:"healer",
  4000008:"dragon",4000009:"pekka",4000010:"minion",4000011:"hog_rider",4000012:"valkyrie",4000013:"golem",4000015:"witch",4000017:"lava_hound",
  4000023:"baby_dragon",
});

export const HOME_SPELL_IDS=Object.freeze({
  26000000:"lightning_spell",26000001:"healing_spell",26000002:"rage_spell",26000003:"jump_spell",26000005:"freeze_spell",26000009:"poison_spell",
  26000010:"earthquake_spell",26000011:"haste_spell",26000017:"skeleton_spell",
});

export const HOME_HERO_IDS=Object.freeze({
  28000000:"barbarian_king",28000001:"archer_queen",28000006:"minion_prince",
});

export const LABELS=Object.freeze({
  town_hall:"Town Hall",army_camp:"Army Camp",barracks:"Barracks",laboratory:"Laboratory",spell_factory:"Spell Factory",dark_barracks:"Dark Barracks",
  dark_spell_factory:"Dark Spell Factory",hero_hall:"Hero Hall",clan_castle:"Clan Castle",blacksmith:"Blacksmith",helper_hut:"Helper Hut",builder_hut:"Builder Hut",
  gold_storage:"Gold Storage",elixir_storage:"Elixir Storage",dark_elixir_storage:"Dark Elixir Storage",gold_mine:"Gold Mine",elixir_collector:"Elixir Collector",
  dark_elixir_drill:"Dark Elixir Drill",cannon:"Cannon",archer_tower:"Archer Tower",mortar:"Mortar",air_defense:"Air Defense",wizard_tower:"Wizard Tower",
  air_sweeper:"Air Sweeper",hidden_tesla:"Hidden Tesla",bomb_tower:"Bomb Tower",x_bow:"X-Bow",wall:"Wall",
  barbarian:"Barbarian",archer:"Archer",goblin:"Goblin",giant:"Giant",wall_breaker:"Wall Breaker",balloon:"Balloon",wizard:"Wizard",healer:"Healer",
  dragon:"Dragon",pekka:"P.E.K.K.A",minion:"Minion",hog_rider:"Hog Rider",valkyrie:"Valkyrie",golem:"Golem",witch:"Witch",lava_hound:"Lava Hound",baby_dragon:"Baby Dragon",
  lightning_spell:"Lightning Spell",healing_spell:"Healing Spell",rage_spell:"Rage Spell",jump_spell:"Jump Spell",freeze_spell:"Freeze Spell",poison_spell:"Poison Spell",
  earthquake_spell:"Earthquake Spell",haste_spell:"Haste Spell",skeleton_spell:"Skeleton Spell",barbarian_king:"Barbarian King",archer_queen:"Archer Queen",minion_prince:"Minion Prince",
  bomb:"Bomb",spring_trap:"Spring Trap",giant_bomb:"Giant Bomb",air_bomb:"Air Bomb",seeking_air_mine:"Seeking Air Mine",skeleton_trap:"Skeleton Trap",
});

export function labelFor(id){ return LABELS[id]||id.replaceAll("_"," ").replace(/\b\w/g,m=>m.toUpperCase()); }

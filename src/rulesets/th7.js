export const TH7_RULESET = {
  id: "coc-home-village-th7-2026-08-10",
  game: "Clash of Clans",
  village: "home",
  townHall: 7,
  gridSize: 44,
  status: "legality-v1",
  checkedAt: "2026-08-10",
  notes: [
    "This ruleset establishes legal TH7 inventory, footprints, and level ceilings.",
    "Combat statistics are intentionally separate and will only be added with field-level provenance.",
    "Builder Hut count is variable from 2 to 5. Hero Banner is a placeable defensive marker and is not counted as a building by Clash.",
  ],
  provenance: {
    inventory: "Clash of Clans Wiki — Town Hall",
    heroHall: "Clash of Clans Wiki — Hero Hall",
    heroBanner: "Clash of Clans Wiki — Hero Banner",
    builderHut: "Clash of Clans Wiki — Builder's Hut",
    sourceClass: "secondary-current",
  },
  entities: {
    town_hall:          { label:"Town Hall",            category:"building", minCount:1, maxCount:1, maxLevel:7, footprint:[4,4], glyph:"TH" },

    cannon:             { label:"Cannon",               category:"defense",  minCount:0, maxCount:5, maxLevel:8, footprint:[3,3], glyph:"C" },
    archer_tower:       { label:"Archer Tower",         category:"defense",  minCount:0, maxCount:4, maxLevel:8, footprint:[3,3], glyph:"AT" },
    mortar:             { label:"Mortar",               category:"defense",  minCount:0, maxCount:3, maxLevel:5, footprint:[3,3], glyph:"M" },
    air_defense:        { label:"Air Defense",          category:"defense",  minCount:0, maxCount:3, maxLevel:5, footprint:[3,3], glyph:"AD" },
    wizard_tower:       { label:"Wizard Tower",         category:"defense",  minCount:0, maxCount:2, maxLevel:4, footprint:[3,3], glyph:"WT" },
    air_sweeper:        { label:"Air Sweeper",          category:"defense",  minCount:0, maxCount:1, maxLevel:3, footprint:[2,2], glyph:"AS" },
    hidden_tesla:       { label:"Hidden Tesla",         category:"defense",  minCount:0, maxCount:2, maxLevel:3, footprint:[2,2], glyph:"HT" },

    wall:               { label:"Wall",                 category:"wall",     minCount:0, maxCount:175, maxLevel:7, footprint:[1,1], glyph:"" },

    bomb:               { label:"Bomb",                 category:"trap",     minCount:0, maxCount:6, maxLevel:4, footprint:[1,1], glyph:"B" },
    spring_trap:        { label:"Spring Trap",          category:"trap",     minCount:0, maxCount:4, maxLevel:2, footprint:[1,1], glyph:"SP" },
    air_bomb:           { label:"Air Bomb",             category:"trap",     minCount:0, maxCount:2, maxLevel:3, footprint:[1,1], glyph:"AB" },
    giant_bomb:         { label:"Giant Bomb",           category:"trap",     minCount:0, maxCount:2, maxLevel:2, footprint:[2,2], glyph:"GB" },
    seeking_air_mine:   { label:"Seeking Air Mine",     category:"trap",     minCount:0, maxCount:1, maxLevel:1, footprint:[1,1], glyph:"SAM" },

    gold_mine:          { label:"Gold Mine",            category:"resource", minCount:0, maxCount:6, maxLevel:11, footprint:[3,3], glyph:"GM" },
    elixir_collector:   { label:"Elixir Collector",     category:"resource", minCount:0, maxCount:6, maxLevel:11, footprint:[3,3], glyph:"EC" },
    dark_elixir_drill:  { label:"Dark Elixir Drill",    category:"resource", minCount:0, maxCount:1, maxLevel:3, footprint:[3,3], glyph:"DD" },
    gold_storage:       { label:"Gold Storage",         category:"resource", minCount:0, maxCount:2, maxLevel:11, footprint:[3,3], glyph:"GS" },
    elixir_storage:     { label:"Elixir Storage",       category:"resource", minCount:0, maxCount:2, maxLevel:11, footprint:[3,3], glyph:"ES" },
    dark_elixir_storage:{ label:"Dark Elixir Storage",  category:"resource", minCount:0, maxCount:1, maxLevel:2, footprint:[3,3], glyph:"DS" },
    clan_castle:        { label:"Clan Castle",          category:"support",  minCount:0, maxCount:1, maxLevel:3, footprint:[3,3], glyph:"CC" },

    army_camp:          { label:"Army Camp",            category:"army",     minCount:0, maxCount:4, maxLevel:6, footprint:[4,4], glyph:"AC" },
    barracks:           { label:"Barracks",             category:"army",     minCount:0, maxCount:1, maxLevel:9, footprint:[3,3], glyph:"BR" },
    laboratory:         { label:"Laboratory",           category:"army",     minCount:0, maxCount:1, maxLevel:5, footprint:[3,3], glyph:"LAB" },
    spell_factory:      { label:"Spell Factory",        category:"army",     minCount:0, maxCount:1, maxLevel:3, footprint:[3,3], glyph:"SF" },
    dark_barracks:      { label:"Dark Barracks",        category:"army",     minCount:0, maxCount:1, maxLevel:2, footprint:[3,3], glyph:"DB" },
    hero_hall:          { label:"Hero Hall",            category:"army",     minCount:0, maxCount:1, maxLevel:1, footprint:[4,4], glyph:"HH" },

    builder_hut:        { label:"Builder's Hut",        category:"other",    minCount:2, maxCount:5, maxLevel:1, footprint:[2,2], glyph:"BH" },
    hero_banner:        { label:"Hero Banner",          category:"marker",   minCount:0, maxCount:1, maxLevel:1, footprint:[2,2], glyph:"HB", countsAsBuilding:false },
  },
  maxima: {
    buildingsIncludingFiveBuilderHuts: 54,
    walls: 175,
    traps: 15,
    heroBanners: 1,
  },
};

export const TH7_ENTITY_TYPES = Object.freeze(Object.keys(TH7_RULESET.entities));

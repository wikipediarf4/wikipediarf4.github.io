// ====== BUSCAR TROFEO ======
let FISH_DB = [
  {n:"Siluro Albino",img:"https://en.rf4-stat.ru/images/rf4game/w_catfish_a.png",t:"100.000 kg",r:"200.000 kg",maps:[{"n": "Akhtuba River", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/ahtuba_83.webp"}]},
  {n:"Barbo Albino",img:"https://en.rf4-stat.ru/images/rf4game/alb_barbel.png",t:"8.000 kg",r:"12.000 kg",maps:[{"n": "Bear Lake", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/bearish_83.webp"}]},
  {n:"Solla Americana",img:"https://en.rf4-stat.ru/images/rf4game/hippoglos_p.png",t:"4.000 kg",r:"5.000 kg",maps:[{"n": "Norwegian Sea", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/sea_83.webp"}]},
  {n:"Silurus Amur",img:"https://en.rf4-stat.ru/images/rf4game/a_catfish.png",t:"5.000 kg",r:"7.000 kg",maps:[{"n": "Lower Tunguska River", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/tunguska_83.webp"}]},
  {n:"Trucha Ártica",img:"https://en.rf4-stat.ru/images/rf4game/a_char.png",t:"11.000 kg",r:"16.000 kg",maps:[{"n": "Kuori Lake", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/quori_83.webp"}, {"n": "Lower Tunguska River", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/tunguska_83.webp"}, {"n": "Yama River", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/pit_83.webp"}]},
  {n:"Tímalo Siberiano",img:"https://en.rf4-stat.ru/images/rf4game/zs_grayling.png",t:"2.000 kg",r:"2.500 kg",maps:[{"n": "Belaya River", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/white_83.webp"}, {"n": "Lower Tunguska River", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/tunguska_83.webp"}]},
  {n:"Omul Ártico",img:"https://en.rf4-stat.ru/images/rf4game/a_omul.png",t:"3.000 kg",r:"4.000 kg",maps:[{"n": "Lower Tunguska River", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/tunguska_83.webp"}]},
  {n:"Artic Skate",img:"https://en.rf4-stat.ru/images/rf4game/ambl_h.png",t:"8.000 kg",r:"10.000 kg",maps:[{"n": "Norwegian Sea", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/sea_83.webp"}]},
  {n:"Eperlano Asiático",img:"https://en.rf4-stat.ru/images/rf4game/a_smelt.png",t:"270 g",r:"320 g",maps:[{"n": "Lower Tunguska River", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/tunguska_83.webp"}, {"n": "Yama River", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/pit_83.webp"}]},
  {n:"Aspio",img:"https://en.rf4-stat.ru/images/rf4game/asp.png",t:"8.000 kg",r:"13.000 kg",maps:[{"n": "Winding Rivulet", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/bindweed_83.webp"}, {"n": "Belaya River", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/white_83.webp"}, {"n": "Volkhov River", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/volhov_83.webp"}, {"n": "Seversky Donets River", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/don_83.webp"}, {"n": "Sura River", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/sura_83.webp"}, {"n": "Akhtuba River", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/ahtuba_83.webp"}]},
  {n:"Salmón del Atlántico",img:"https://en.rf4-stat.ru/images/rf4game/a_salmon.png",t:"30.000 kg",r:"40.000 kg",maps:[{"n": "Volkhov River", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/volhov_83.webp"}, {"n": "Ladoga Lake", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/ladoga_83.webp"}, {"n": "Ladoga archipelago", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/archip_83.webp"}]},
  {n:"Atún Rojo",img:"https://en.rf4-stat.ru/images/rf4game/thynnus_t.png",t:"250 kg",r:"400 kg",maps:[{"n": "Norwegian Sea", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/sea_83.webp"}]},
  {n:"Bacalao del Atlántico",img:"https://en.rf4-stat.ru/images/rf4game/atl_cod.png",t:"50 kg",r:"65 kg",maps:[{"n": "Norwegian Sea", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/sea_83.webp"}]},
  {n:"Himantolophus Groelandicus",img:"https://en.rf4-stat.ru/images/rf4game/himant_g.png",t:"7 kg",r:"10 kg",maps:[{"n": "Norwegian Sea", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/sea_83.webp"}]},
  {n:"Fletán del Atlántico",img:"https://en.rf4-stat.ru/images/rf4game/halibut_w.png",t:"150 kg",r:"220 kg",maps:[{"n": "Norwegian Sea", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/sea_83.webp"}]},
  {n:"Arenque del Atlántico",img:"https://en.rf4-stat.ru/images/rf4game/atl_herring.png",t:"800 g",r:"1 kg",maps:[{"n": "Norwegian Sea", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/sea_83.webp"}]},
  {n:"Caballa Atlántica",img:"https://en.rf4-stat.ru/images/rf4game/makrel.png",t:"2 kg",r:"2.800 kg",maps:[{"n": "Norwegian Sea", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/sea_83.webp"}]},
  {n:"Chancharro",img:"https://en.rf4-stat.ru/images/rf4game/sebastes_n.png",t:"9 kg",r:"11 kg",maps:[{"n": "Norwegian Sea", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/sea_83.webp"}]},
  {n:"Saurio del Atlántico",img:"https://en.rf4-stat.ru/images/rf4game/s_saurus.png",t:"600 g",r:"750 g",maps:[{"n": "Norwegian Sea", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/sea_83.webp"}]},
  {n:"Pez Lobo del Atlántico",img:"https://en.rf4-stat.ru/images/rf4game/p_zubatka.png",t:"14.500 kg",r:"19 kg",maps:[{"n": "Norwegian Sea", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/sea_83.webp"}]},
  {n:"Atlantic Wreckfish",img:"https://en.rf4-stat.ru/images/rf4game/polyprion.png",t:"60 kg",r:"75 kg",maps:[{"n": "Norwegian Sea", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/sea_83.webp"}]},
  {n:"Omul Baikal",img:"https://en.rf4-stat.ru/images/rf4game/b_omul.png",t:"6 kg",r:"7 kg",maps:[{"n": "Ladoga archipelago", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/archip_83.webp"}, {"n": "Lower Tunguska River", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/tunguska_83.webp"}]},
  {n:"Esturión del Báltico",img:"https://en.rf4-stat.ru/images/rf4game/osetr_balt.png",t:"200 kg",r:"300 kg",maps:[{"n": "Ladoga Lake", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/ladoga_83.webp"}, {"n": "Ladoga archipelago", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/archip_83.webp"}]},
  {n:"Tiburón Peregrino",img:"https://en.rf4-stat.ru/images/rf4game/cetorhinus_m.png",t:"1.300 kg",r:"2.500 kg",maps:[{"n": "Norwegian Sea", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/sea_83.webp"}]},
  {n:"Esturión Bastardo",img:"https://en.rf4-stat.ru/images/rf4game/osetr_ship.png",t:"50 kg",r:"70 kg",maps:[{"n": "Akhtuba River", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/ahtuba_83.webp"}]},
  {n:"Gallineta Nórdica",img:"https://en.rf4-stat.ru/images/rf4game/sebastes_n.png",t:"5.500 kg",r:"7 kg",maps:[{"n": "Norwegian Sea", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/sea_83.webp"}]},
  {n:"Salmón Blanco",img:"https://en.rf4-stat.ru/images/rf4game/wfish.png",t:"15 kg",r:"25 kg",maps:[{"n": "Akhtuba River", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/ahtuba_83.webp"}]},
  {n:"Beluga",img:"https://en.rf4-stat.ru/images/rf4game/beluga.png",t:"500 kg",r:"1.000 kg",maps:[{"n": "Akhtuba River", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/ahtuba_83.webp"}]},
  {n:"Carpa de Cabeza Grande",img:"https://en.rf4-stat.ru/images/rf4game/bh_carp.png",t:"30 kg",r:"45 kg",maps:[{"n": "Sura River", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/sura_83.webp"}, {"n": "Akhtuba River", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/ahtuba_83.webp"}]},
  {n:"Búfalo Negro",img:"https://en.rf4-stat.ru/images/rf4game/bl_buffalo.png",t:"15 kg",r:"20 kg",maps:[{"n": "Akhtuba River", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/ahtuba_83.webp"}]},
  {n:"Carpa Negra",img:"https://en.rf4-stat.ru/images/rf4game/b_carp.png",t:"28 kg",r:"40 kg",maps:[{"n": "Old Burg Lake", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/prison_83.webp"}, {"n": "Bear Lake", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/bearish_83.webp"}]},
  {n:"Beluga del Mar Negro",img:"https://en.rf4-stat.ru/images/rf4game/ch_beluga.png",t:"500 kg",r:"1.000 kg",maps:[{"n": "Seversky Donets River", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/don_83.webp"}]},
  {n:"Kutum del Mar Negro",img:"https://en.rf4-stat.ru/images/rf4game/vyrezub.png",t:"5.500 kg",r:"7.500 kg",maps:[{"n": "Seversky Donets River", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/don_83.webp"}]},
  {n:"Shemaya del Mar Negro",img:"https://en.rf4-stat.ru/images/rf4game/shemaya_cha.png",t:"500 g",r:"700 g",maps:[{"n": "Seversky Donets River", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/don_83.webp"}]},
  {n:"Rufo Negro",img:"https://en.rf4-stat.ru/images/rf4game/centroloph_n.png",t:"24 kg",r:"29 kg",maps:[{"n": "Norwegian Sea", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/sea_83.webp"}]},
  {n:"Coregono Negro",img:"https://en.rf4-stat.ru/images/rf4game/sig_black.png",t:"3.500 kg",r:"5 kg",maps:[{"n": "Ladoga archipelago", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/archip_83.webp"}]},
  {n:"Alosa Caspia",img:"https://en.rf4-stat.ru/images/rf4game/c_herring.png",t:"250 g",r:"340 g",maps:[{"n": "Akhtuba River", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/ahtuba_83.webp"}]},
  {n:"Alburno",img:"https://en.rf4-stat.ru/images/rf4game/c_bleak.png",t:"110 g",r:"160 g",maps:[{"n": "Mosquito Lake", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/mosquito_83.webp"}, {"n": "Winding Rivulet", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/bindweed_83.webp"}, {"n": "Old Burg Lake", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/prison_83.webp"}, {"n": "Bear Lake", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/bearish_83.webp"}, {"n": "Belaya River", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/white_83.webp"}, {"n": "Volkhov River", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/volhov_83.webp"}, {"n": "Seversky Donets River", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/don_83.webp"}, {"n": "Sura River", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/sura_83.webp"}, {"n": "Ladoga Lake", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/ladoga_83.webp"}, {"n": "Akhtuba River", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/ahtuba_83.webp"}, {"n": "Lower Tunguska River", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/tunguska_83.webp"}, {"n": "Yama River", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/pit_83.webp"}]},
  {n:"Zope",img:"https://en.rf4-stat.ru/images/rf4game/b_bream.png",t:"750 g",r:"1.100 kg",maps:[{"n": "Winding Rivulet", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/bindweed_83.webp"}, {"n": "Volkhov River", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/volhov_83.webp"}, {"n": "Sura River", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/sura_83.webp"}, {"n": "Ladoga Lake", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/ladoga_83.webp"}, {"n": "Akhtuba River", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/ahtuba_83.webp"}, {"n": "Seversky Donets River", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/don_83.webp"}]},
  {n:"Maruca Azul",img:"https://en.rf4-stat.ru/images/rf4game/molva.png",t:"25 kg",r:"35 kg",maps:[{"n": "Norwegian Sea", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/sea_83.webp"}]},
  {n:"Bacaladilla",img:"https://en.rf4-stat.ru/images/rf4game/poutassou.png",t:"900 g",r:"1.200 kg",maps:[{"n": "Norwegian Sea", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/sea_83.webp"}]},
  {n:"Lenok de Hocico Romo",img:"https://en.rf4-stat.ru/images/rf4game/lenok_t.png",t:"7.500 kg",r:"9 kg",maps:[{"n": "Yama River", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/pit_83.webp"}]},
  {n:"Arenque Brazhnikov",img:"https://en.rf4-stat.ru/images/rf4game/b_herring.png",t:"700 g",r:"1 kg",maps:[{"n": "Akhtuba River", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/ahtuba_83.webp"}]},
  {n:"Brema",img:"https://en.rf4-stat.ru/images/rf4game/bream.png",t:"4.400 kg",r:"7 kg",maps:[{"n": "Mosquito Lake", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/mosquito_83.webp"}, {"n": "Winding Rivulet", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/bindweed_83.webp"}, {"n": "Old Burg Lake", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/prison_83.webp"}, {"n": "Belaya River", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/white_83.webp"}, {"n": "Volkhov River", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/volhov_83.webp"}, {"n": "Seversky Donets River", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/don_83.webp"}, {"n": "Sura River", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/sura_83.webp"}, {"n": "Ladoga Lake", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/ladoga_83.webp"}, {"n": "Akhtuba River", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/ahtuba_83.webp"}, {"n": "Lower Tunguska River", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/tunguska_83.webp"}, {"n": "Ladoga archipelago", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/archip_83.webp"}]},
  {n:"Coregonus Nasus",img:"https://en.rf4-stat.ru/images/rf4game/chir.png",t:"7 kg",r:"10 kg",maps:[{"n": "Lower Tunguska River", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/tunguska_83.webp"}]},
  {n:"Trucha Marrón",img:"https://en.rf4-stat.ru/images/rf4game/riv_brown_trout.png",t:"3 kg",r:"5 kg",maps:[{"n": "Belaya River", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/white_83.webp"}, {"n": "Kuori Lake", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/quori_83.webp"}, {"n": "Lower Tunguska River", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/tunguska_83.webp"}]},
  {n:"Búfalo",img:"https://en.rf4-stat.ru/images/rf4game/buffalo.png",t:"15 kg",r:"20 kg",maps:[{"n": "Akhtuba River", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/ahtuba_83.webp"}]},
  {n:"Lota",img:"https://en.rf4-stat.ru/images/rf4game/burbot.png",t:"9 kg",r:"14 kg",maps:[{"n": "Winding Rivulet", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/bindweed_83.webp"}, {"n": "Old Burg Lake", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/prison_83.webp"}, {"n": "Belaya River", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/white_83.webp"}, {"n": "Kuori Lake", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/quori_83.webp"}, {"n": "Volkhov River", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/volhov_83.webp"}, {"n": "Seversky Donets River", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/don_83.webp"}, {"n": "Sura River", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/sura_83.webp"}, {"n": "Ladoga Lake", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/ladoga_83.webp"}, {"n": "Akhtuba River", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/ahtuba_83.webp"}, {"n": "Lower Tunguska River", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/tunguska_83.webp"}, {"n": "Ladoga archipelago", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/archip_83.webp"}, {"n": "Yama River", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/pit_83.webp"}]},
  {n:"C2 SuperFreak",img:"https://en.rf4-stat.ru/images/rf4game/s_freaks.png",t:"30 kg",r:"40 kg",maps:[{"n": "Copper lake", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/copper_83.webp"}]},
  {n:"Salmón de Mar Negro",img:"https://en.rf4-stat.ru/images/rf4game/k_salmon.png",t:"30 kg",r:"50 kg",maps:[{"n": "Akhtuba River", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/ahtuba_83.webp"}]},
  {n:"Kutum del Caspio",img:"https://en.rf4-stat.ru/images/rf4game/kutum.png",t:"5 kg",r:"7 kg",maps:[{"n": "Akhtuba River", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/ahtuba_83.webp"}]},
  {n:"Lamprea del Caspio",img:"https://en.rf4-stat.ru/images/rf4game/c_lamprey.png",t:"150 g",r:"200 g",maps:[{"n": "Akhtuba River", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/ahtuba_83.webp"}]},
  {n:"Rutilus Caspicus",img:"https://en.rf4-stat.ru/images/rf4game/vobla.png",t:"500 g",r:"800 g",maps:[{"n": "Akhtuba River", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/ahtuba_83.webp"}]},
  {n:"Siluro",img:"https://en.rf4-stat.ru/images/rf4game/w_catfish.png",t:"100 kg",r:"200 kg",maps:[{"n": "Mosquito Lake", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/mosquito_83.webp"}, {"n": "Winding Rivulet", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/bindweed_83.webp"}, {"n": "Old Burg Lake", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/prison_83.webp"}, {"n": "Belaya River", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/white_83.webp"}, {"n": "Volkhov River", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/volhov_83.webp"}, {"n": "Seversky Donets River", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/don_83.webp"}, {"n": "Sura River", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/sura_83.webp"}, {"n": "Akhtuba River", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/ahtuba_83.webp"}]},
  {n:"Salvelino de Arroyo",img:"https://en.rf4-stat.ru/images/rf4game/salvel_l.png",t:"5 kg",r:"7.600 kg",maps:[{"n": "Kuori Lake", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/quori_83.webp"}, {"n": "Ladoga Lake", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/ladoga_83.webp"}, {"n": "Ladoga archipelago", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/archip_83.webp"}]},
  {n:"Rotan",img:"https://en.rf4-stat.ru/images/rf4game/a.sleeper.png",t:"400 g",r:"700 g",maps:[{"n": "Mosquito Lake", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/mosquito_83.webp"}, {"n": "Winding Rivulet", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/bindweed_83.webp"}, {"n": "Old Burg Lake", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/prison_83.webp"}, {"n": "Bear Lake", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/bearish_83.webp"}, {"n": "Lower Tunguska River", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/tunguska_83.webp"}]},
  {n:"Salmón Real",img:"https://en.rf4-stat.ru/images/rf4game/chavycha.png",t:"40 kg",r:"60 kg",maps:[{"n": "Yama River", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/pit_83.webp"}]},
  {n:"Cachuelo",img:"https://en.rf4-stat.ru/images/rf4game/e.chub.png",t:"4 kg",r:"7 kg",maps:[{"n": "Mosquito Lake", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/mosquito_83.webp"}, {"n": "Winding Rivulet", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/bindweed_83.webp"}, {"n": "Old Burg Lake", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/prison_83.webp"}, {"n": "Belaya River", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/white_83.webp"}, {"n": "Volkhov River", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/volhov_83.webp"}, {"n": "Seversky Donets River", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/don_83.webp"}, {"n": "Sura River", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/sura_83.webp"}, {"n": "Ladoga Lake", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/ladoga_83.webp"}, {"n": "Akhtuba River", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/ahtuba_83.webp"}, {"n": "Ladoga archipelago", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/archip_83.webp"}]},
  {n:"Salmón Keta",img:"https://en.rf4-stat.ru/images/rf4game/keta.png",t:"8 kg",r:"10 kg",maps:[{"n": "Yama River", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/pit_83.webp"}]},
  {n:"Clupeonella",img:"https://en.rf4-stat.ru/images/rf4game/tiulka.png",t:"24 g",r:"28 g",maps:[{"n": "Seversky Donets River", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/don_83.webp"}]},
  {n:"Salmón Plateado",img:"https://en.rf4-stat.ru/images/rf4game/kijuch.png",t:"5.500 kg",r:"7 kg",maps:[{"n": "Yama River", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/pit_83.webp"}]},
  {n:"Barbo Común",img:"https://en.rf4-stat.ru/images/rf4game/c_barbel.png",t:"8 kg",r:"12 kg",maps:[{"n": "Bear Lake", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/bearish_83.webp"}, {"n": "The Amber Lake", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/amber_83.webp"}, {"n": "Copper lake", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/copper_83.webp"}]},
  {n:"Carpa Común",img:"https://en.rf4-stat.ru/images/rf4game/carp.png",t:"20 kg",r:"30 kg",maps:[{"n": "Mosquito Lake", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/mosquito_83.webp"}, {"n": "Winding Rivulet", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/bindweed_83.webp"}, {"n": "Old Burg Lake", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/prison_83.webp"}, {"n": "Belaya River", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/white_83.webp"}, {"n": "Volkhov River", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/volhov_83.webp"}, {"n": "Seversky Donets River", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/don_83.webp"}, {"n": "Sura River", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/sura_83.webp"}, {"n": "Ladoga Lake", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/ladoga_83.webp"}, {"n": "Akhtuba River", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/ahtuba_83.webp"}, {"n": "The Amber Lake", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/amber_83.webp"}, {"n": "Lower Tunguska River", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/tunguska_83.webp"}]},
  {n:"Carpa Fantasma Común",img:"https://en.rf4-stat.ru/images/rf4game/carp_ghost.png",t:"20 kg",r:"30 kg",maps:[{"n": "The Amber Lake", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/amber_83.webp"}]},
  {n:"Piscardo Común",img:"https://en.rf4-stat.ru/images/rf4game/golyan.png",t:"100 g",r:"160 g",maps:[{"n": "Kuori Lake", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/quori_83.webp"}, {"n": "Ladoga Lake", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/ladoga_83.webp"}, {"n": "Ladoga archipelago", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/archip_83.webp"}]},
  {n:"Rutilo",img:"https://en.rf4-stat.ru/images/rf4game/c.roach.png",t:"1.200 kg",r:"2 kg",maps:[{"n": "Mosquito Lake", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/mosquito_83.webp"}, {"n": "Winding Rivulet", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/bindweed_83.webp"}, {"n": "Old Burg Lake", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/prison_83.webp"}, {"n": "Belaya River", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/white_83.webp"}, {"n": "Volkhov River", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/volhov_83.webp"}, {"n": "Seversky Donets River", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/don_83.webp"}, {"n": "Sura River", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/sura_83.webp"}, {"n": "Ladoga Lake", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/ladoga_83.webp"}, {"n": "Akhtuba River", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/ahtuba_83.webp"}, {"n": "Lower Tunguska River", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/tunguska_83.webp"}, {"n": "Ladoga archipelago", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/archip_83.webp"}]},
  {n:"Carpa Común Albino",img:"https://en.rf4-stat.ru/images/rf4game/carp_albino.png",t:"20 kg",r:"30 kg",maps:[{"n": "The Amber Lake", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/amber_83.webp"}]},
  {n:"Maruca Común",img:"https://en.rf4-stat.ru/images/rf4game/m_molva.png",t:"30 kg",r:"40 kg",maps:[{"n": "Norwegian Sea", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/sea_83.webp"}]},
  {n:"Congrio",img:"https://en.rf4-stat.ru/images/rf4game/conger.png",t:"60 kg",r:"75 kg",maps:[{"n": "Norwegian Sea", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/sea_83.webp"}]},
  {n:"Carpa Cruciana",img:"https://en.rf4-stat.ru/images/rf4game/c.carp.png",t:"1.800 kg",r:"2.900 kg",maps:[{"n": "Mosquito Lake", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/mosquito_83.webp"}, {"n": "Winding Rivulet", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/bindweed_83.webp"}, {"n": "Old Burg Lake", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/prison_83.webp"}, {"n": "Belaya River", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/white_83.webp"}, {"n": "Volkhov River", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/volhov_83.webp"}, {"n": "Seversky Donets River", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/don_83.webp"}, {"n": "Sura River", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/sura_83.webp"}, {"n": "Ladoga Lake", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/ladoga_83.webp"}, {"n": "Akhtuba River", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/ahtuba_83.webp"}, {"n": "The Amber Lake", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/amber_83.webp"}, {"n": "Lower Tunguska River", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/tunguska_83.webp"}, {"n": "Ladoga archipelago", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/archip_83.webp"}]},
  {n:"Cusk",img:"https://en.rf4-stat.ru/images/rf4game/menek.png",t:"18 kg",r:"24 kg",maps:[{"n": "Norwegian Sea", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/sea_83.webp"}]},
  {n:"Alburno Shemaya",img:"https://en.rf4-stat.ru/images/rf4game/dace.png",t:"250 g",r:"390 g",maps:[{"n": "Winding Rivulet", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/bindweed_83.webp"}, {"n": "Belaya River", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/white_83.webp"}, {"n": "Volkhov River", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/volhov_83.webp"}, {"n": "Seversky Donets River", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/don_83.webp"}, {"n": "Sura River", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/sura_83.webp"}, {"n": "Akhtuba River", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/ahtuba_83.webp"}, {"n": "Lower Tunguska River", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/tunguska_83.webp"}, {"n": "Yama River", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/pit_83.webp"}]},
  {n:"Carpa Cuero Dinks",img:"https://en.rf4-stat.ru/images/rf4game/din_n_carp.png",t:"35 kg",r:"45 kg",maps:[{"n": "Copper lake", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/copper_83.webp"}]},
  {n:"Carpa Espejo Dinks",img:"https://en.rf4-stat.ru/images/rf4game/din_l_carp.png",t:"35 kg",r:"45 kg",maps:[{"n": "Copper lake", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/copper_83.webp"}]},
  {n:"Trucha Dolly Varden",img:"https://en.rf4-stat.ru/images/rf4game/malma.png",t:"7.500 kg",r:"10 kg",maps:[{"n": "Yama River", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/pit_83.webp"}]},
  {n:"Acerina Donet",img:"https://en.rf4-stat.ru/images/rf4game/ruffe_n.png",t:"250 g",r:"350 g",maps:[{"n": "Winding Rivulet", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/bindweed_83.webp"}, {"n": "Seversky Donets River", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/don_83.webp"}]},
  {n:"Salvelino Dryagin",img:"https://en.rf4-stat.ru/images/rf4game/dr_char.png",t:"10 kg",r:"14 kg",maps:[{"n": "Lower Tunguska River", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/tunguska_83.webp"}]},
  {n:"Tímalo de Siberia Oriental",img:"https://en.rf4-stat.ru/images/rf4game/os_grayling.png",t:"2 kg",r:"2.500 kg",maps:[{"n": "Lower Tunguska River", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/tunguska_83.webp"}, {"n": "Yama River", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/pit_83.webp"}]},
  {n:"Esturión de Siberia Oriental",img:"https://en.rf4-stat.ru/images/rf4game/zs_sturgeon.png",t:"100 kg",r:"150 kg",maps:[{"n": "Lower Tunguska River", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/tunguska_83.webp"}]},
  {n:"Brema Oriental",img:"https://en.rf4-stat.ru/images/rf4game/e_bream.png",t:"4.400 kg",r:"7 kg",maps:[{"n": "Akhtuba River", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/ahtuba_83.webp"}, {"n": "Lower Tunguska River", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/tunguska_83.webp"}]},
  {n:"Cangrejo de Mar",img:"https://en.rf4-stat.ru/images/rf4game/ed_crab.png",t:"1.800 kg",r:"2.200 kg",maps:[{"n": "Norwegian Sea", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/sea_83.webp"}]},
  {n:"Anguila",img:"https://en.rf4-stat.ru/images/rf4game/eel.png",t:"4 kg",r:"7.500 kg",maps:[{"n": "Old Burg Lake", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/prison_83.webp"}, {"n": "Volkhov River", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/volhov_83.webp"}, {"n": "Sura River", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/sura_83.webp"}, {"n": "Ladoga Lake", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/ladoga_83.webp"}, {"n": "Ladoga archipelago", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/archip_83.webp"}, {"n": "Seversky Donets River", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/don_83.webp"}]},
  {n:"Lycodes Esmarkii",img:"https://en.rf4-stat.ru/images/rf4game/lycodes_e.png",t:"2.500 kg",r:"3.300 kg",maps:[{"n": "Norwegian Sea", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/sea_83.webp"}]},
  {n:"Pez Pescador",img:"https://en.rf4-stat.ru/images/rf4game/lophius_p.png",t:"35 kg",r:"45 kg",maps:[{"n": "Norwegian Sea", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/sea_83.webp"}]},
  {n:"Quimera Europea",img:"https://en.rf4-stat.ru/images/rf4game/chimaera.png",t:"1.500 kg",r:"—",maps:[{"n": "Norwegian Sea", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/sea_83.webp"}]},
  {n:"Merluza Europea",img:"https://en.rf4-stat.ru/images/rf4game/merluza.png",t:"9 kg",r:"12 kg",maps:[{"n": "Norwegian Sea", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/sea_83.webp"}]},
  {n:"Platija Europea",img:"https://en.rf4-stat.ru/images/rf4game/sea_kambala.png",t:"4.500 kg",r:"5.500 kg",maps:[{"n": "Norwegian Sea", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/sea_83.webp"}]},
  {n:"Calamar Común",img:"https://en.rf4-stat.ru/images/rf4game/c_squid.png",t:"2 kg",r:"2.400 kg",maps:[{"n": "Norwegian Sea", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/sea_83.webp"}]},
  {n:"F1",img:"https://en.rf4-stat.ru/images/rf4game/karasekarp.png",t:"3 kg",r:"4 kg",maps:[{"n": "Copper lake", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/copper_83.webp"}]},
  {n:"Lamprea de Arroyo del Lejano Oriente",img:"https://en.rf4-stat.ru/images/rf4game/fe_lamprey.png",t:"40 g",r:"—",maps:[{"n": "Yama River", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/pit_83.webp"}]},
  {n:"Carpa Espejo Enmarcado Fantasma",img:"https://en.rf4-stat.ru/images/rf4game/r_carp_ghost.png",t:"25 kg",r:"40 kg",maps:[{"n": "The Amber Lake", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/amber_83.webp"}]},
  {n:"Carpa Espejo Enmarcado Albino",img:"https://en.rf4-stat.ru/images/rf4game/r_carp_albino.png",t:"25 kg",r:"40 kg",maps:[{"n": "The Amber Lake", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/amber_83.webp"}]},
  {n:"Carpa Espejo Enmarcado",img:"https://en.rf4-stat.ru/images/rf4game/r_carp.png",t:"25 kg",r:"40 kg",maps:[{"n": "The Amber Lake", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/amber_83.webp"}]},
  {n:"Cangrejo de Río",img:"https://en.rf4-stat.ru/images/rf4game/crawfish.png",t:"200 g",r:"330 g",maps:[{"n": "Winding Rivulet", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/bindweed_83.webp"}, {"n": "Belaya River", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/white_83.webp"}, {"n": "Volkhov River", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/volhov_83.webp"}, {"n": "Seversky Donets River", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/don_83.webp"}, {"n": "Sura River", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/sura_83.webp"}, {"n": "Ladoga Lake", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/ladoga_83.webp"}]},
  {n:"Tiburón Serpiente",img:"https://en.rf4-stat.ru/images/rf4game/c_anguineus.png",t:"50 kg",r:"70 kg",maps:[{"n": "Norwegian Sea", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/sea_83.webp"}]},
  {n:"Rana",img:"https://en.rf4-stat.ru/images/rf4game/frog.png",t:"190 g",r:"250 g",maps:[{"n": "Mosquito Lake", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/mosquito_83.webp"}, {"n": "Winding Rivulet", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/bindweed_83.webp"}, {"n": "Old Burg Lake", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/prison_83.webp"}, {"n": "Belaya River", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/white_83.webp"}, {"n": "Volkhov River", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/volhov_83.webp"}, {"n": "Seversky Donets River", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/don_83.webp"}, {"n": "Sura River", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/sura_83.webp"}, {"n": "Ladoga Lake", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/ladoga_83.webp"}, {"n": "Akhtuba River", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/ahtuba_83.webp"}, {"n": "The Amber Lake", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/amber_83.webp"}, {"n": "Ladoga archipelago", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/archip_83.webp"}]},
  {n:"Carpa Gibel",img:"https://en.rf4-stat.ru/images/rf4game/crucian.png",t:"1.900 kg",r:"3.200 kg",maps:[{"n": "Mosquito Lake", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/mosquito_83.webp"}, {"n": "Winding Rivulet", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/bindweed_83.webp"}, {"n": "Old Burg Lake", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/prison_83.webp"}, {"n": "Belaya River", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/white_83.webp"}, {"n": "Volkhov River", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/volhov_83.webp"}, {"n": "Seversky Donets River", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/don_83.webp"}, {"n": "Sura River", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/sura_83.webp"}, {"n": "Ladoga Lake", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/ladoga_83.webp"}, {"n": "Akhtuba River", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/ahtuba_83.webp"}, {"n": "The Amber Lake", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/amber_83.webp"}, {"n": "Lower Tunguska River", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/tunguska_83.webp"}, {"n": "Ladoga archipelago", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/archip_83.webp"}]},
  {n:"Tenca Oro",img:"https://en.rf4-stat.ru/images/rf4game/g_tench.png",t:"4 kg",r:"6 kg",maps:[{"n": "Mosquito Lake", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/mosquito_83.webp"}, {"n": "Bear Lake", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/bearish_83.webp"}]},
  {n:"Carpa Herbívora",img:"https://en.rf4-stat.ru/images/rf4game/g_carp.png",t:"28 kg",r:"40 kg",maps:[{"n": "Old Burg Lake", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/prison_83.webp"}, {"n": "Seversky Donets River", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/don_83.webp"}, {"n": "The Amber Lake", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/amber_83.webp"}, {"n": "Akhtuba River", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/ahtuba_83.webp"}, {"n": "Sura River", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/sura_83.webp"}]},
  {n:"Salvelino Gris",img:"https://en.rf4-stat.ru/images/rf4game/palia_kr.png",t:"3 kg",r:"4.500 kg",maps:[{"n": "Ladoga Lake", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/ladoga_83.webp"}, {"n": "Ladoga archipelago", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/archip_83.webp"}]},
  {n:"Tímalo",img:"https://en.rf4-stat.ru/images/rf4game/a_grayling.png",t:"3.200 kg",r:"5.500 kg",maps:[{"n": "Belaya River", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/white_83.webp"}, {"n": "Kuori Lake", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/quori_83.webp"}, {"n": "Ladoga Lake", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/ladoga_83.webp"}, {"n": "Ladoga archipelago", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/archip_83.webp"}]},
  {n:"Fletán Negro",img:"https://en.rf4-stat.ru/images/rf4game/halibut_b.png",t:"25 kg",r:"32 kg",maps:[{"n": "Norwegian Sea", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/sea_83.webp"}]},
  {n:"Tiburón de Groenlandia",img:"https://en.rf4-stat.ru/images/rf4game/somniosus_m.png",t:"600 kg",r:"900 kg",maps:[{"n": "Norwegian Sea", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/sea_83.webp"}]},
  {n:"Gobio",img:"https://en.rf4-stat.ru/images/rf4game/gudgeon.png",t:"100 g",r:"160 g",maps:[{"n": "Winding Rivulet", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/bindweed_83.webp"}, {"n": "Belaya River", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/white_83.webp"}, {"n": "Volkhov River", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/volhov_83.webp"}, {"n": "Seversky Donets River", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/don_83.webp"}, {"n": "Sura River", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/sura_83.webp"}, {"n": "Akhtuba River", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/ahtuba_83.webp"}]},
  {n:"Eglefino",img:"https://en.rf4-stat.ru/images/rf4game/piksha.png",t:"11 kg",r:"13 kg",maps:[{"n": "Norwegian Sea", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/sea_83.webp"}]},
  {n:"Hi Utsuri",img:"https://en.rf4-stat.ru/images/rf4game/hi_utsri.png",t:"25 kg",r:"35 kg",maps:[{"n": "Copper lake", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/copper_83.webp"}]},
  {n:"Coregonus de Pidschian",img:"https://en.rf4-stat.ru/images/rf4game/sig_p.png",t:"4.500 kg",r:"6 kg",maps:[{"n": "Belaya River", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/white_83.webp"}, {"n": "Lower Tunguska River", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/tunguska_83.webp"}]},
  {n:"Vieira Islandesa",img:"https://en.rf4-stat.ru/images/rf4game/chlamys_isl.png",t:"350 g",r:"450 g",maps:[{"n": "Norwegian Sea", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/sea_83.webp"}]},
  {n:"Ide",img:"https://en.rf4-stat.ru/images/rf4game/s.orfe.png",t:"4 kg",r:"6.500 kg",maps:[{"n": "Mosquito Lake", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/mosquito_83.webp"}, {"n": "Winding Rivulet", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/bindweed_83.webp"}, {"n": "Old Burg Lake", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/prison_83.webp"}, {"n": "Belaya River", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/white_83.webp"}, {"n": "Volkhov River", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/volhov_83.webp"}, {"n": "Seversky Donets River", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/don_83.webp"}, {"n": "Sura River", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/sura_83.webp"}, {"n": "Ladoga Lake", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/ladoga_83.webp"}, {"n": "Akhtuba River", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/ahtuba_83.webp"}, {"n": "Lower Tunguska River", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/tunguska_83.webp"}, {"n": "Ladoga archipelago", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/archip_83.webp"}, {"n": "Yama River", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/pit_83.webp"}]},
  {n:"Kaluga",img:"https://en.rf4-stat.ru/images/rf4game/kaluga.png",t:"500 kg",r:"1.000 kg",maps:[{"n": "Yama River", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/pit_83.webp"}]},
  {n:"Trucha Arcoíris de Kamchatka",img:"https://en.rf4-stat.ru/images/rf4game/mikija.png",t:"8 kg",r:"10 kg",maps:[{"n": "Yama River", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/pit_83.webp"}]},
  {n:"Arenque de Kessler",img:"https://en.rf4-stat.ru/images/rf4game/k_herring.png",t:"1.200 kg",r:"1.700 kg",maps:[{"n": "Akhtuba River", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/ahtuba_83.webp"}]},
  {n:"Kohaku",img:"https://en.rf4-stat.ru/images/rf4game/kohaku.png",t:"25 kg",r:"35 kg",maps:[{"n": "Copper lake", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/copper_83.webp"}]},
  {n:"Salvelino Kuori",img:"https://en.rf4-stat.ru/images/rf4game/chartus_kuoriius.png",t:"22 kg",r:"30 kg",maps:[{"n": "Kuori Lake", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/quori_83.webp"}]},
  {n:"Pescado Blanco Kuori",img:"https://en.rf4-stat.ru/images/rf4game/sig_kuor.png",t:"3.500 kg",r:"5 kg",maps:[{"n": "Kuori Lake", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/quori_83.webp"}]},
  {n:"Tenca de Kvolsdorfsky",img:"https://en.rf4-stat.ru/images/rf4game/kw_tench.png",t:"4 kg",r:"6 kg",maps:[{"n": "Copper lake", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/copper_83.webp"}]},
  {n:"Pescado Blanco del Lago Ladoga",img:"https://en.rf4-stat.ru/images/rf4game/sig_o_l.png",t:"3 kg",r:"4 kg",maps:[{"n": "Ladoga archipelago", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/archip_83.webp"}]},
  {n:"Salmón Ladoga",img:"https://en.rf4-stat.ru/images/rf4game/l_salmon.png",t:"14 kg",r:"20 kg",maps:[{"n": "Volkhov River", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/volhov_83.webp"}, {"n": "Ladoga Lake", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/ladoga_83.webp"}, {"n": "Ladoga archipelago", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/archip_83.webp"}]},
  {n:"Esturión de Ladoga",img:"https://en.rf4-stat.ru/images/rf4game/l_sturgeon.png",t:"60 kg",r:"—",maps:[{"n": "Ladoga archipelago", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/archip_83.webp"}]},
  {n:"Piscardo del Lago",img:"https://en.rf4-stat.ru/images/rf4game/l_minnow.png",t:"100 g",r:"160 g",maps:[{"n": "Lower Tunguska River", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/tunguska_83.webp"}]},
  {n:"Reo",img:"https://en.rf4-stat.ru/images/rf4game/gc_smelt.png",t:"10 kg",r:"15 kg",maps:[{"n": "Kuori Lake", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/quori_83.webp"}, {"n": "Ladoga Lake", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/ladoga_83.webp"}, {"n": "Ladoga archipelago", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/archip_83.webp"}]},
  {n:"Carpa de Cuero",img:"https://en.rf4-stat.ru/images/rf4game/n_carp.png",t:"30 kg",r:"45 kg",maps:[{"n": "Bear Lake", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/bearish_83.webp"}, {"n": "The Amber Lake", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/amber_83.webp"}, {"n": "Copper lake", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/copper_83.webp"}]},
  {n:"El Char de Levanidov",img:"https://en.rf4-stat.ru/images/rf4game/golets_lev.png",t:"1.600 kg",r:"2.100 kg",maps:[{"n": "Yama River", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/pit_83.webp"}]},
  {n:"Carpa Espejo Fantasma",img:"https://en.rf4-stat.ru/images/rf4game/l_carp_ghost.png",t:"25 kg",r:"40 kg",maps:[{"n": "The Amber Lake", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/amber_83.webp"}]},
  {n:"Carpa Espejo Albino",img:"https://en.rf4-stat.ru/images/rf4game/l_carp_albino.png",t:"25 kg",r:"40 kg",maps:[{"n": "The Amber Lake", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/amber_83.webp"}]},
  {n:"Carpa Linear",img:"https://en.rf4-stat.ru/images/rf4game/l_carp.png",t:"25 kg",r:"40 kg",maps:[{"n": "The Amber Lake", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/amber_83.webp"}]},
  {n:"Musgurnus Fosilis",img:"https://en.rf4-stat.ru/images/rf4game/vjun.png",t:"200 g",r:"250 g",maps:[{"n": "Mosquito Lake", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/mosquito_83.webp"}, {"n": "Akhtuba River", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/ahtuba_83.webp"}]},
  {n:"Longear Eelpout",img:"https://en.rf4-stat.ru/images/rf4game/lycodes_s.png",t:"1.200 kg",r:"1.500 kg",maps:[{"n": "Norwegian Sea", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/sea_83.webp"}]},
  {n:"Longhead Dab",img:"https://en.rf4-stat.ru/images/rf4game/lh_kambala.png",t:"3 kg",r:"4 kg",maps:[{"n": "Norwegian Sea", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/sea_83.webp"}]},
  {n:"Costatumus",img:"https://en.rf4-stat.ru/images/rf4game/chukuchan.png",t:"1.800 kg",r:"2.200 kg",maps:[{"n": "Yama River", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/pit_83.webp"}]},
  {n:"Ludoga Whitefish",img:"https://en.rf4-stat.ru/images/rf4game/sig_ludoga.png",t:"3 kg",r:"5 kg",maps:[{"n": "Ladoga Lake", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/ladoga_83.webp"}, {"n": "Ladoga archipelago", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/archip_83.webp"}]},
  {n:"Lumpo",img:"https://en.rf4-stat.ru/images/rf4game/pinagor.png",t:"6 kg",r:"7.500 kg",maps:[{"n": "Norwegian Sea", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/sea_83.webp"}]},
  {n:"Mameshibori Goshiki",img:"https://en.rf4-stat.ru/images/rf4game/m_goshiki.png",t:"25 kg",r:"35 kg",maps:[{"n": "Copper lake", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/copper_83.webp"}]},
  {n:"Masu",img:"https://en.rf4-stat.ru/images/rf4game/onkor_m.png",t:"6.500 kg",r:"8 kg",maps:[{"n": "Yama River", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/pit_83.webp"}]},
  {n:"Masu Sedentario",img:"https://en.rf4-stat.ru/images/rf4game/onkor_mg.png",t:"5 kg",r:"6.500 kg",maps:[{"n": "Yama River", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/pit_83.webp"}]},
  {n:"Carpa Espejo Albino",img:"https://en.rf4-stat.ru/images/rf4game/m_carp_albino.png",t:"25 kg",r:"40 kg",maps:[{"n": "The Amber Lake", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/amber_83.webp"}]},
  {n:"Carpa Espejo",img:"https://en.rf4-stat.ru/images/rf4game/m_carp.png",t:"25 kg",r:"40 kg",maps:[{"n": "Mosquito Lake", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/mosquito_83.webp"}, {"n": "Bear Lake", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/bearish_83.webp"}, {"n": "The Amber Lake", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/amber_83.webp"}, {"n": "Copper lake", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/copper_83.webp"}]},
  {n:"Carpa Fantasma Espejo",img:"https://en.rf4-stat.ru/images/rf4game/m_carp_ghost.png",t:"25 kg",r:"40 kg",maps:[{"n": "The Amber Lake", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/amber_83.webp"}]},
  {n:"Mongolia Redfin",img:"https://en.rf4-stat.ru/images/rf4game/chan_m.png",t:"2.500 kg",r:"3.200 kg",maps:[{"n": "Yama River", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/pit_83.webp"}]},
  {n:"Muksun",img:"https://en.rf4-stat.ru/images/rf4game/w_muksun.png",t:"6 kg",r:"9 kg",maps:[]},
  {n:"Mejillón de Mar",img:"https://en.rf4-stat.ru/images/rf4game/mytilus_ed.png",t:"130 g",r:"150 g",maps:[{"n": "Norwegian Sea", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/sea_83.webp"}]},
  {n:"Narumi Asagi",img:"https://en.rf4-stat.ru/images/rf4game/n_asagi.png",t:"25 kg",r:"35 kg",maps:[{"n": "Copper lake", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/copper_83.webp"}]},
  {n:"Pez Narizón",img:"https://en.rf4-stat.ru/images/rf4game/c_nase.png",t:"800 g",r:"1.200 kg",maps:[{"n": "Winding Rivulet", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/bindweed_83.webp"}, {"n": "Belaya River", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/white_83.webp"}, {"n": "Volkhov River", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/volhov_83.webp"}, {"n": "Seversky Donets River", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/don_83.webp"}, {"n": "Sura River", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/sura_83.webp"}, {"n": "Akhtuba River", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/ahtuba_83.webp"}]},
  {n:"Neiva",img:"https://en.rf4-stat.ru/images/rf4game/neiva.png",t:"1.400 kg",r:"1.700 kg",maps:[{"n": "Yama River", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/pit_83.webp"}]},
  {n:"Nelma",img:"https://en.rf4-stat.ru/images/rf4game/nelma.png",t:"25 kg",r:"30 kg",maps:[{"n": "Lower Tunguska River", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/tunguska_83.webp"}]},
  {n:"Espinoso de Nueve Espinas",img:"https://en.rf4-stat.ru/images/rf4game/stickleback_ninesp.png",t:"70 g",r:"90 g",maps:[{"n": "Yama River", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/pit_83.webp"}]},
  {n:"Pez Lobo del Norte",img:"https://en.rf4-stat.ru/images/rf4game/d_zubatka.png",t:"13 kg",r:"17 kg",maps:[{"n": "Norwegian Sea", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/sea_83.webp"}]},
  {n:"Opa",img:"https://en.rf4-stat.ru/images/rf4game/lampris_g.png",t:"140 kg",r:"200 kg",maps:[{"n": "Norwegian Sea", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/sea_83.webp"}]},
  {n:"Orenji Ogon",img:"https://en.rf4-stat.ru/images/rf4game/w_orenji_ogon.png",t:"25 kg",r:"35 kg",maps:[]},
  {n:"Ostra",img:"https://en.rf4-stat.ru/images/rf4game/ostrea_ed.png",t:"300 g",r:"370 g",maps:[{"n": "Norwegian Sea", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/sea_83.webp"}]},
  {n:"Peled",img:"https://en.rf4-stat.ru/images/rf4game/peled.png",t:"3 kg",r:"4 kg",maps:[{"n": "Kuori Lake", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/quori_83.webp"}, {"n": "Lower Tunguska River", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/tunguska_83.webp"}]},
  {n:"Perca de Río",img:"https://en.rf4-stat.ru/images/rf4game/perch.png",t:"1.600 kg",r:"2.700 kg",maps:[{"n": "Mosquito Lake", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/mosquito_83.webp"}, {"n": "Winding Rivulet", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/bindweed_83.webp"}, {"n": "Old Burg Lake", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/prison_83.webp"}, {"n": "Belaya River", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/white_83.webp"}, {"n": "Volkhov River", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/volhov_83.webp"}, {"n": "Seversky Donets River", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/don_83.webp"}, {"n": "Sura River", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/sura_83.webp"}, {"n": "Ladoga Lake", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/ladoga_83.webp"}, {"n": "Akhtuba River", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/ahtuba_83.webp"}, {"n": "The Amber Lake", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/amber_83.webp"}, {"n": "Lower Tunguska River", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/tunguska_83.webp"}, {"n": "Yama River", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/pit_83.webp"}, {"n": "Ladoga archipelago", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/archip_83.webp"}]},
  {n:"Esturión Persa",img:"https://en.rf4-stat.ru/images/rf4game/p_sturgeon.png",t:"100 kg",r:"150 kg",maps:[{"n": "Akhtuba River", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/ahtuba_83.webp"}]},
  {n:"Lucio",img:"https://en.rf4-stat.ru/images/rf4game/n.pike.png",t:"12 kg",r:"20 kg",maps:[{"n": "Mosquito Lake", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/mosquito_83.webp"}, {"n": "Winding Rivulet", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/bindweed_83.webp"}, {"n": "Old Burg Lake", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/prison_83.webp"}, {"n": "Belaya River", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/white_83.webp"}, {"n": "Volkhov River", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/volhov_83.webp"}, {"n": "Seversky Donets River", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/don_83.webp"}, {"n": "Sura River", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/sura_83.webp"}, {"n": "Ladoga Lake", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/ladoga_83.webp"}, {"n": "Akhtuba River", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/ahtuba_83.webp"}, {"n": "Lower Tunguska River", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/tunguska_83.webp"}, {"n": "Yama River", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/pit_83.webp"}, {"n": "Ladoga archipelago", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/archip_83.webp"}]},
  {n:"Salmón Rosado",img:"https://en.rf4-stat.ru/images/rf4game/gorbusha.png",t:"3 kg",r:"4 kg",maps:[{"n": "Lower Tunguska River", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/tunguska_83.webp"}, {"n": "Yama River", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/pit_83.webp"}]},
  {n:"Abadejo",img:"https://en.rf4-stat.ru/images/rf4game/pollachius.png",t:"11 kg",r:"14 kg",maps:[{"n": "Norwegian Sea", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/sea_83.webp"}]},
  {n:"Sábalo Póntico",img:"https://en.rf4-stat.ru/images/rf4game/cha_herring.png",t:"650 g",r:"900 g",maps:[{"n": "Seversky Donets River", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/don_83.webp"}]},
  {n:"Majarro Sardinero",img:"https://en.rf4-stat.ru/images/rf4game/lamna_n.png",t:"140 kg",r:"200 kg",maps:[{"n": "Norwegian Sea", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/sea_83.webp"}]},
  {n:"Perca del Sol",img:"https://en.rf4-stat.ru/images/rf4game/pumps_sunfish.png",t:"450 g",r:"600 g",maps:[{"n": "Seversky Donets River", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/don_83.webp"}]},
  {n:"Trucha Arcoíris",img:"https://en.rf4-stat.ru/images/rf4game/riv_rb_trout.png",t:"10 kg",r:"13 kg",maps:[{"n": "Kuori Lake", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/quori_83.webp"}]},
  {n:"Salvelino Rojo",img:"https://en.rf4-stat.ru/images/rf4game/palia_lud.png",t:"5 kg",r:"7.600 kg",maps:[{"n": "Ladoga Lake", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/ladoga_83.webp"}, {"n": "Ladoga archipelago", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/archip_83.webp"}]},
  {n:"Carpa Común Oro",img:"https://en.rf4-stat.ru/images/rf4game/carp_red.png",t:"20 kg",r:"30 kg",maps:[{"n": "The Amber Lake", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/amber_83.webp"}]},
  {n:"Cangrejo Real Rojo",img:"https://en.rf4-stat.ru/images/rf4game/rk_crab.png",t:"7.500 kg",r:"9 kg",maps:[{"n": "Norwegian Sea", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/sea_83.webp"}]},
  {n:"Ripus",img:"https://en.rf4-stat.ru/images/rf4game/ripus.png",t:"1.200 kg",r:"1.700 kg",maps:[{"n": "Ladoga Lake", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/ladoga_83.webp"}, {"n": "Ladoga archipelago", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/archip_83.webp"}]},
  {n:"Mejillón de Río",img:"https://en.rf4-stat.ru/images/rf4game/freshwater_mussel.png",t:"190 g",r:"280 g",maps:[{"n": "Winding Rivulet", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/bindweed_83.webp"}, {"n": "Belaya River", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/white_83.webp"}, {"n": "Bear Lake", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/bearish_83.webp"}, {"n": "Volkhov River", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/volhov_83.webp"}, {"n": "Seversky Donets River", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/don_83.webp"}, {"n": "Sura River", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/sura_83.webp"}]},
  {n:"Granadero de Cabeza Dura",img:"https://en.rf4-stat.ru/images/rf4game/macrourus_b.png",t:"3 kg",r:"—",maps:[{"n": "Norwegian Sea", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/sea_83.webp"}]},
  {n:"Round Whitefish",img:"https://en.rf4-stat.ru/images/rf4game/valyok.png",t:"1.200 kg",r:"1.600 kg",maps:[{"n": "Lower Tunguska River", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/tunguska_83.webp"}, {"n": "Yama River", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/pit_83.webp"}]},
  {n:"Gardi",img:"https://en.rf4-stat.ru/images/rf4game/rudd.png",t:"1.500 kg",r:"2 kg",maps:[{"n": "Seversky Donets River", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/don_83.webp"}, {"n": "Sura River", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/sura_83.webp"}, {"n": "Akhtuba River", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/ahtuba_83.webp"}]},
  {n:"Acerina",img:"https://en.rf4-stat.ru/images/rf4game/ruffe.png",t:"140 g",r:"220 g",maps:[{"n": "Mosquito Lake", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/mosquito_83.webp"}, {"n": "Winding Rivulet", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/bindweed_83.webp"}, {"n": "Old Burg Lake", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/prison_83.webp"}, {"n": "Belaya River", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/white_83.webp"}, {"n": "Volkhov River", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/volhov_83.webp"}, {"n": "Seversky Donets River", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/don_83.webp"}, {"n": "Sura River", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/sura_83.webp"}, {"n": "Ladoga Lake", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/ladoga_83.webp"}, {"n": "Akhtuba River", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/ahtuba_83.webp"}, {"n": "Lower Tunguska River", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/tunguska_83.webp"}, {"n": "Ladoga archipelago", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/archip_83.webp"}, {"n": "Yama River", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/pit_83.webp"}]},
  {n:"Esturión Ruso",img:"https://en.rf4-stat.ru/images/rf4game/r_sturgeon.png",t:"50 kg",r:"100 kg",maps:[{"n": "Seversky Donets River", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/don_83.webp"}, {"n": "Sura River", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/sura_83.webp"}, {"n": "Akhtuba River", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/ahtuba_83.webp"}]},
  {n:"Carbonero",img:"https://en.rf4-stat.ru/images/rf4game/coalfish.png",t:"19 kg",r:"25 kg",maps:[{"n": "Norwegian Sea", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/sea_83.webp"}]},
  {n:"Sardina",img:"https://en.rf4-stat.ru/images/rf4game/sardina_p.png",t:"180 g",r:"240 g",maps:[{"n": "Norwegian Sea", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/sea_83.webp"}]},
  {n:"Carpa de Cuero Albino",img:"https://en.rf4-stat.ru/images/rf4game/n_carp_albino.png",t:"30 kg",r:"45 kg",maps:[{"n": "The Amber Lake", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/amber_83.webp"}]},
  {n:"Carpa de Cuero Fantasma",img:"https://en.rf4-stat.ru/images/rf4game/n_carp_ghost.png",t:"30 kg",r:"45 kg",maps:[{"n": "The Amber Lake", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/amber_83.webp"}]},
  {n:"Trucha de Sevan",img:"https://en.rf4-stat.ru/images/rf4game/sevan_trout.png",t:"9 kg",r:"15 kg",maps:[{"n": "Kuori Lake", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/quori_83.webp"}]},
  {n:"Lenok de Hocico Agudo",img:"https://en.rf4-stat.ru/images/rf4game/lenok_o.png",t:"5.500 kg",r:"7 kg",maps:[{"n": "Lower Tunguska River", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/tunguska_83.webp"}, {"n": "Yama River", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/pit_83.webp"}]},
  {n:"Shemaya",img:"https://en.rf4-stat.ru/images/rf4game/shemaya.png",t:"600 g",r:"900 g",maps:[{"n": "Akhtuba River", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/ahtuba_83.webp"}]},
  {n:"Caspian Barbel",img:"https://en.rf4-stat.ru/images/rf4game/sh_barbel.png",t:"13 kg",r:"18 kg",maps:[{"n": "Akhtuba River", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/ahtuba_83.webp"}]},
  {n:"Myoxocephalus Scorpius",img:"https://en.rf4-stat.ru/images/rf4game/m_scorpius.png",t:"3 kg",r:"4 kg",maps:[{"n": "Norwegian Sea", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/sea_83.webp"}]},
  {n:"Barbula Toni",img:"https://en.rf4-stat.ru/images/rf4game/barb_toni.png",t:"60 g",r:"80 g",maps:[{"n": "Lower Tunguska River", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/tunguska_83.webp"}, {"n": "Yama River", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/pit_83.webp"}]},
  {n:"Leusisco Siberiano",img:"https://en.rf4-stat.ru/images/rf4game/syb_gudgeon.png",t:"250 g",r:"390 g",maps:[{"n": "Lower Tunguska River", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/tunguska_83.webp"}]},
  {n:"Gobio Siberiano",img:"https://en.rf4-stat.ru/images/rf4game/syb_gudgeon.png",t:"150 g",r:"200 g",maps:[{"n": "Lower Tunguska River", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/tunguska_83.webp"}]},
  {n:"Lamprea Siberiana",img:"https://en.rf4-stat.ru/images/rf4game/s_lamprey.png",t:"40 g",r:"—",maps:[{"n": "Lower Tunguska River", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/tunguska_83.webp"}]},
  {n:"Rutilo Siberiano",img:"https://en.rf4-stat.ru/images/rf4game/syb_roach.png",t:"600 g",r:"700 g",maps:[{"n": "Lower Tunguska River", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/tunguska_83.webp"}]},
  {n:"Sardina Siberiana Cisco",img:"https://en.rf4-stat.ru/images/rf4game/syb_vendace.png",t:"800 g",r:"1.100 kg",maps:[{"n": "Lower Tunguska River", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/tunguska_83.webp"}]},
  {n:"Cavilat Siberiano",img:"https://en.rf4-stat.ru/images/rf4game/bullhead_syb.png",t:"45 g",r:"55 g",maps:[{"n": "Lower Tunguska River", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/tunguska_83.webp"}]},
  {n:"Esterlete Siberiano",img:"https://en.rf4-stat.ru/images/rf4game/syb_sterlet.png",t:"9 kg",r:"14 kg",maps:[{"n": "Lower Tunguska River", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/tunguska_83.webp"}]},
  {n:"Pelecus",img:"https://en.rf4-stat.ru/images/rf4game/sabrefish.png",t:"1.500 kg",r:"2 kg",maps:[{"n": "Seversky Donets River", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/don_83.webp"}, {"n": "Sura River", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/sura_83.webp"}, {"n": "Akhtuba River", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/ahtuba_83.webp"}]},
  {n:"Carpa Plateada",img:"https://en.rf4-stat.ru/images/rf4game/s_carp.png",t:"25 kg",r:"40 kg",maps:[{"n": "Sura River", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/sura_83.webp"}, {"n": "Akhtuba River", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/ahtuba_83.webp"}]},
  {n:"Espinoso Sureño de Nueve Espinas",img:"https://en.rf4-stat.ru/images/rf4game/stickleback_ss.png",t:"70 g",r:"90 g",maps:[{"n": "Akhtuba River", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/ahtuba_83.webp"}]},
  {n:"Galineta Pequeña",img:"https://en.rf4-stat.ru/images/rf4game/red_fish.png",t:"3 kg",r:"4 kg",maps:[{"n": "Norwegian Sea", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/sea_83.webp"}]},
  {n:"Eperlano",img:"https://en.rf4-stat.ru/images/rf4game/e_smelt.png",t:"130 g",r:"200 g",maps:[{"n": "Ladoga Lake", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/ladoga_83.webp"}, {"n": "Ladoga archipelago", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/archip_83.webp"}]},
  {n:"Salmón Rojo",img:"https://en.rf4-stat.ru/images/rf4game/nerka.png",t:"4.500 kg",r:"6 kg",maps:[{"n": "Yama River", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/pit_83.webp"}]},
  {n:"Mielga",img:"https://en.rf4-stat.ru/images/rf4game/katran.png",t:"7 kg",r:"10 kg",maps:[{"n": "Norwegian Sea", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/sea_83.webp"}]},
  {n:"Pez Lobo Manchado",img:"https://en.rf4-stat.ru/images/rf4game/m_zubatka.png",t:"17 kg",r:"22 kg",maps:[{"n": "Norwegian Sea", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/sea_83.webp"}]},
  {n:"Carpa Espejo Oro",img:"https://en.rf4-stat.ru/images/rf4game/m_carp_red.png",t:"25 kg",r:"40 kg",maps:[{"n": "The Amber Lake", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/amber_83.webp"}]},
  {n:"Esturión Estrellado",img:"https://en.rf4-stat.ru/images/rf4game/st_sturgeon.png",t:"50 kg",r:"70 kg",maps:[{"n": "Akhtuba River", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/ahtuba_83.webp"}]},
  {n:"Esterlete",img:"https://en.rf4-stat.ru/images/rf4game/sterlet.png",t:"9 kg",r:"14 kg",maps:[{"n": "Belaya River", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/white_83.webp"}, {"n": "Sura River", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/sura_83.webp"}, {"n": "Akhtuba River", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/ahtuba_83.webp"}]},
  {n:"Pescado Blanco Svir",img:"https://en.rf4-stat.ru/images/rf4game/sv_sig.png",t:"3.500 kg",r:"5 kg",maps:[{"n": "Ladoga archipelago", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/archip_83.webp"}]},
  {n:"Pez Espada",img:"https://en.rf4-stat.ru/images/rf4game/x_gladius.png",t:"300 kg",r:"450 kg",maps:[{"n": "Norwegian Sea", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/sea_83.webp"}]},
  {n:"Taiman",img:"https://en.rf4-stat.ru/images/rf4game/taimen.png",t:"50 kg",r:"80 kg",maps:[{"n": "Belaya River", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/white_83.webp"}, {"n": "Lower Tunguska River", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/tunguska_83.webp"}]},
  {n:"Rutilo Hackelli (Taran)",img:"https://en.rf4-stat.ru/images/rf4game/taran.png",t:"1.300 kg",r:"1.800 kg",maps:[{"n": "Seversky Donets River", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/don_83.webp"}]},
  {n:"Tenca",img:"https://en.rf4-stat.ru/images/rf4game/tench.png",t:"4 kg",r:"6 kg",maps:[{"n": "Mosquito Lake", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/mosquito_83.webp"}, {"n": "Winding Rivulet", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/bindweed_83.webp"}, {"n": "Old Burg Lake", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/prison_83.webp"}, {"n": "Bear Lake", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/bearish_83.webp"}, {"n": "Belaya River", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/white_83.webp"}, {"n": "Volkhov River", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/volhov_83.webp"}, {"n": "Seversky Donets River", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/don_83.webp"}, {"n": "Sura River", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/sura_83.webp"}]},
  {n:"Raya Espinosa",img:"https://en.rf4-stat.ru/images/rf4game/ambl_r.png",t:"11 kg",r:"14 kg",maps:[{"n": "Norwegian Sea", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/sea_83.webp"}]},
  {n:"Lamprea del Pacífico",img:"https://en.rf4-stat.ru/images/rf4game/trid_lamprey.png",t:"—",r:"—",maps:[{"n": "Yama River", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/pit_83.webp"}]},
  {n:"Espinoso de Tres Espinas",img:"https://en.rf4-stat.ru/images/rf4game/stickleback_threesp.png",t:"70 g",r:"90 g",maps:[{"n": "Ladoga Lake", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/ladoga_83.webp"}, {"n": "Ladoga archipelago", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/archip_83.webp"}, {"n": "Lower Tunguska River", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/tunguska_83.webp"}]},
  {n:"Tugun",img:"https://en.rf4-stat.ru/images/rf4game/tugun.png",t:"60 g",r:"70 g",maps:[{"n": "Lower Tunguska River", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/tunguska_83.webp"}]},
  {n:"Rodaballo",img:"https://en.rf4-stat.ru/images/rf4game/turbot.png",t:"14 kg",r:"18 kg",maps:[{"n": "Norwegian Sea", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/sea_83.webp"}]},
  {n:"Ugui",img:"https://en.rf4-stat.ru/images/rf4game/trib_h.png",t:"1.200 kg",r:"1.500 kg",maps:[{"n": "Yama River", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/pit_83.webp"}]},
  {n:"Lamprea Ucraniana",img:"https://en.rf4-stat.ru/images/rf4game/u_lamprey.png",t:"70 g",r:"—",maps:[{"n": "Seversky Donets River", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/don_83.webp"}]},
  {n:"Pescado Blanco de Valaam",img:"https://en.rf4-stat.ru/images/rf4game/sig_valaam.png",t:"1.500 kg",r:"2.500 kg",maps:[{"n": "Ladoga Lake", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/ladoga_83.webp"}, {"n": "Ladoga archipelago", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/archip_83.webp"}]},
  {n:"Vendace",img:"https://en.rf4-stat.ru/images/rf4game/vendace.png",t:"500 g",r:"800 g",maps:[{"n": "Kuori Lake", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/quori_83.webp"}, {"n": "Volkhov River", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/volhov_83.webp"}, {"n": "Ladoga Lake", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/ladoga_83.webp"}, {"n": "Ladoga archipelago", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/archip_83.webp"}]},
  {n:"Vimba o Zarte",img:"https://en.rf4-stat.ru/images/rf4game/v_bream.png",t:"1.500 kg",r:"2.400 kg",maps:[{"n": "Volkhov River", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/volhov_83.webp"}, {"n": "Sura River", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/sura_83.webp"}, {"n": "Ladoga Lake", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/ladoga_83.webp"}, {"n": "Ladoga archipelago", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/archip_83.webp"}]},
  {n:"Viviparous Eelpout",img:"https://en.rf4-stat.ru/images/rf4game/zoarces_v.png",t:"900 g",r:"1.300 kg",maps:[{"n": "Norwegian Sea", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/sea_83.webp"}]},
  {n:"Sander Volgensis",img:"https://en.rf4-stat.ru/images/rf4game/barsch.png",t:"1.400 kg",r:"2.200 kg",maps:[{"n": "Winding Rivulet", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/bindweed_83.webp"}, {"n": "Seversky Donets River", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/don_83.webp"}, {"n": "Sura River", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/sura_83.webp"}]},
  {n:"Pescado Blanco de Volkhov",img:"https://en.rf4-stat.ru/images/rf4game/sig.png",t:"4 kg",r:"7 kg",maps:[{"n": "Ladoga Lake", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/ladoga_83.webp"}, {"n": "Ladoga archipelago", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/archip_83.webp"}]},
  {n:"Pescado Blanco Vuoksa",img:"https://en.rf4-stat.ru/images/rf4game/sig_vouksa.png",t:"3 kg",r:"5 kg",maps:[{"n": "Ladoga Lake", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/ladoga_83.webp"}, {"n": "Ladoga archipelago", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/archip_83.webp"}]},
  {n:"Brema Blanca",img:"https://en.rf4-stat.ru/images/rf4game/s.bream.png",t:"800 g",r:"1.200 kg",maps:[{"n": "Mosquito Lake", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/mosquito_83.webp"}, {"n": "Winding Rivulet", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/bindweed_83.webp"}, {"n": "Old Burg Lake", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/prison_83.webp"}, {"n": "Belaya River", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/white_83.webp"}, {"n": "Volkhov River", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/volhov_83.webp"}, {"n": "Seversky Donets River", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/don_83.webp"}, {"n": "Sura River", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/sura_83.webp"}, {"n": "Ladoga Lake", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/ladoga_83.webp"}, {"n": "Akhtuba River", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/ahtuba_83.webp"}, {"n": "Lower Tunguska River", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/tunguska_83.webp"}, {"n": "Ladoga archipelago", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/archip_83.webp"}]},
  {n:"Bellaurus Zapa",img:"https://en.rf4-stat.ru/images/rf4game/wa_bream.png",t:"600 g",r:"900 g",maps:[{"n": "Winding Rivulet", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/bindweed_83.webp"}, {"n": "Belaya River", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/white_83.webp"}, {"n": "Volkhov River", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/volhov_83.webp"}, {"n": "Seversky Donets River", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/don_83.webp"}, {"n": "Sura River", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/sura_83.webp"}, {"n": "Akhtuba River", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/ahtuba_83.webp"}]},
  {n:"Char Japonés",img:"https://en.rf4-stat.ru/images/rf4game/kunja.png",t:"10 kg",r:"14 kg",maps:[{"n": "Yama River", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/pit_83.webp"}]},
  {n:"Merlan",img:"https://en.rf4-stat.ru/images/rf4game/merlang.png",t:"3 kg",r:"4 kg",maps:[{"n": "Norwegian Sea", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/sea_83.webp"}]},
  {n:"Carpa Silvestre",img:"https://en.rf4-stat.ru/images/rf4game/common_carp.png",t:"25 kg",r:"35 kg",maps:[{"n": "Seversky Donets River", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/don_83.webp"}, {"n": "Sura River", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/sura_83.webp"}, {"n": "Akhtuba River", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/ahtuba_83.webp"}]},
  {n:"Yotsushiro",img:"https://en.rf4-stat.ru/images/rf4game/yotsushiro.png",t:"25 kg",r:"35 kg",maps:[{"n": "Copper lake", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/copper_83.webp"}]},
  {n:"Sander (Lucioperca)",img:"https://en.rf4-stat.ru/images/rf4game/e.pikeperch.png",t:"8 kg",r:"12 kg",maps:[{"n": "Winding Rivulet", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/bindweed_83.webp"}, {"n": "Belaya River", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/white_83.webp"}, {"n": "Volkhov River", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/volhov_83.webp"}, {"n": "Seversky Donets River", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/don_83.webp"}, {"n": "Sura River", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/sura_83.webp"}, {"n": "Akhtuba River", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/ahtuba_83.webp"}, {"n": "Lower Tunguska River", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/tunguska_83.webp"}]},
  {n:"Mejillón Cebra",img:"https://en.rf4-stat.ru/images/rf4game/dreissena.png",t:"150 g",r:"210 g",maps:[{"n": "Winding Rivulet", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/bindweed_83.webp"}, {"n": "Volkhov River", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/volhov_83.webp"}, {"n": "Seversky Donets River", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/don_83.webp"}, {"n": "Sura River", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/sura_83.webp"}, {"n": "Akhtuba River", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/ahtuba_83.webp"}]},
  {n:"Lubina Negra",img:"https://en.rf4-stat.ru/images/rf4game/lm_b_bass.png",t:"6 kg",r:"7.500 kg",maps:[]},
  {n:"Sábalo de Molleja",img:"https://en.rf4-stat.ru/images/rf4game/tiulka.png",t:"1.100 kg",r:"1.600 kg",maps:[]},
  {n:"Bagre de Cabeza Plana",img:"https://en.rf4-stat.ru/images/rf4game/fhcatfish.png",t:"30 kg",r:"45 kg",maps:[]},
  {n:"Bagre de Canal",img:"https://en.rf4-stat.ru/images/rf4game/fhcatfish.png",t:"14 kg",r:"20 kg",maps:[]},
  {n:"Pavón",img:"https://en.rf4-stat.ru/images/rf4game/bp_bass.png",t:"4 kg",r:"5.500 kg",maps:[]},
  {n:"Pez Agallas Azules",img:"https://en.rf4-stat.ru/images/rf4game/b_gill.png",t:"1.200 kg",r:"1.700 kg",maps:[]},
  {n:"Black Crappie",img:"https://en.rf4-stat.ru/images/rf4game/black_crappie.png",t:"1.600 kg",r:"2.200 kg",maps:[]},
  {n:"Butterfly Peacock Bass",img:"https://en.rf4-stat.ru/images/rf4game/bp_bass.png",t:"4 kg",r:"5.500 kg",maps:[]},
  {n:"Freshwater Drum",img:"https://en.rf4-stat.ru/images/rf4game/fwdrum.png",t:"13.500 kg",r:"19 kg",maps:[]},
  {n:"Gizzard Shad",img:"https://en.rf4-stat.ru/images/rf4game/tiulka.png",t:"1.100 kg",r:"1.600 kg",maps:[]},
  {n:"Hybrid Striped Bass",img:"https://en.rf4-stat.ru/images/rf4game/wh_bass.png",t:"8 kg",r:"10 kg",maps:[]},
  {n:"Largemouth Bass",img:"https://en.rf4-stat.ru/images/rf4game/lm_b_bass.png",t:"6 kg",r:"7.500 kg",maps:[]},
  {n:"Redear Sunfish",img:"https://en.rf4-stat.ru/images/rf4game/resfish.png",t:"1.700 kg",r:"2.300 kg",maps:[]},
  {n:"Smallmouth Bass",img:"https://en.rf4-stat.ru/images/rf4game/sm_bass.png",t:"3 kg",r:"4 kg",maps:[]},
  {n:"Spotted Gar",img:"https://en.rf4-stat.ru/images/rf4game/n.pike.png",t:"3 kg",r:"—",maps:[]},
  {n:"Spotted Bass",img:"https://en.rf4-stat.ru/images/rf4game/sp_bass.png",t:"3 kg",r:"4.500 kg",maps:[]},
  {n:"Striped Bass (Striper)",img:"https://en.rf4-stat.ru/images/rf4game/lm_b_bass.png",t:"30 kg",r:"45 kg",maps:[]},
  {n:"Walleye",img:"https://en.rf4-stat.ru/images/rf4game/walleye.png",t:"7 kg",r:"9 kg",maps:[]},
  {n:"Warmouth",img:"https://en.rf4-stat.ru/images/rf4game/warm.png",t:"650 g",r:"850 g",maps:[]},
  {n:"White Bass",img:"https://en.rf4-stat.ru/images/rf4game/wh_bass.png",t:"1.700 kg",r:"2.500 kg",maps:[]},
  {n:"White Crappie",img:"https://en.rf4-stat.ru/images/rf4game/white_crappie.png",t:"1.350 kg",r:"2 kg",maps:[]},
    {n:"Carpa Herbívora Albina",img:"https://en.rf4-stat.ru/images/rf4game/g_carp_albino.png",t:"28 kg",r:"40 kg",maps:[]},
  {n:"Orenji",img:"https://en.rf4h.ru/templates/rf4m/fish/V90JXd1TrvE9Bw_128.webp",t:"25 kg",r:"35 kg",maps:[{"n": "Copper lake", "i": "https://en.rf4h.ru/templates/rf4m/maps/img/copper_83.webp"}]},
]
window.FISH_DB = FISH_DB;


let _trofChip = '';
let _trofMap = '';
function _mapImg(f){
  if(!f.maps||!f.maps.length) return '';
  return f.maps.map(function(m){
    return '<img src="'+m.i+'" title="'+m.n+'" style="width:32px;height:22px;object-fit:cover;border-radius:3px;opacity:.85;margin-left:2px;" onerror="this.style.display=\'none\'">';
  }).join('');
}
function renderTrofeos(data) {
  const list = document.getElementById('trofeoList');
  const noRes = document.getElementById('trofeoNoResults');
  const cnt = document.getElementById('fishCount');
  if(!list) return;
  if(cnt) cnt.textContent = data.length;
  if(!data.length) { list.innerHTML=''; if(noRes) noRes.style.display='block'; return; }
  if(noRes) noRes.style.display='none';
  const base = 'https://en.rf4-stat.ru/images/rf4game/';
  const proxy = 'https://wsrv.nl/?url=';
  const troff = 'https://en.rf4-stat.ru/images/troff.png';
  const troffs = 'https://en.rf4-stat.ru/images/troff_super.png';
  list.innerHTML = data.map((f,i) => {
    const bg = i%2===0 ? 'background:var(--bg2);' : 'background:var(--card);';
    const isNA = v => v==='—';
    const rawImg = f.img.startsWith('http') ? f.img : base+f.img+'.png';
    const imgSrc = proxy + encodeURIComponent(rawImg);
    return `<div class="trof-row" style="${bg}">
      <img class="trof-fish-img" src="${imgSrc}" onerror="this.style.display='none'" alt="${f.n}" loading="lazy">
      <div class="trof-name" style="display:flex;align-items:center;gap:8px;">${f.n}${_mapImg(f)}</div>
      <img class="trof-icon" src="${troff}" alt="trofeo">
      <div class="trof-weight${isNA(f.t)?' na':''}">${f.t}</div>
      <div class="trof-weight rare${isNA(f.r)?' na':''}" style="display:flex;align-items:center;justify-content:center;gap:5px;">
        ${!isNA(f.r)?`<img src="${troffs}" style="width:18px;height:18px;object-fit:contain;" alt="raro">`:''}
        ${f.r}
      </div>
    </div>`;
  }).join('');
}
function _norm(s){ return (s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,''); }
function filterTrofeos(q) {
  const kw = _norm(q).trim();
  let data = FISH_DB;
  if(_trofChip) data = data.filter(f => _norm(f.n).includes(_trofChip));
  if(_trofMap) data = data.filter(f => f.maps && f.maps.some(m => m.n === _trofMap));
  if(kw) data = data.filter(f => _norm(f.n).includes(kw));
  renderTrofeos(data);
}
function filterTrofeosByMap(mapName) {
  _trofMap = mapName;
  filterTrofeos(document.getElementById('trofeoSearch')?.value||'');
}
function setTrofChip(el, kw) {
  document.querySelectorAll('.trof-chip').forEach(c=>c.classList.remove('on'));
  el.classList.add('on');
  _trofChip = kw;
  filterTrofeos(document.getElementById('trofeoSearch')?.value||'');
}
window.filterTrofeos = filterTrofeos;
window.filterTrofeosByMap = filterTrofeosByMap;
window.setTrofChip = setTrofChip;
// ===== FEED DE TROFEOS APROBADOS =====
// Cuando un trofeo se aprueba en la wiki, se escribe ahí con status:'aprobado'
// Este listener escucha en tiempo real y muestra las tarjetas en el feed


// ===== RANKING SEMANAL =====
const EXCLUDED_FROM_RANKING = ['ruizgustavo12'];
const EXCLUDED_EMAILS_RANKING = ['synxyes@gmail.com'];

function getRankWeekRange(){
  // Reset: domingo a las 16:00 hora Uruguay (UTC-3 = 19:00 UTC)
  // La semana va desde el domingo anterior 16:00 UY hasta el próximo domingo 15:59:59 UY
  const now = new Date();
  // Convertir "ahora" a hora UY (UTC-3)
  const nowUY = new Date(now.getTime() - 3 * 60 * 60 * 1000);
  const dayUY = nowUY.getUTCDay(); // 0=dom, 1=lun ... 6=sab
  const hourUY = nowUY.getUTCHours();
  // Calcular cuántos días atrás fue el último domingo 16:00 UY
  let daysBack;
  if(dayUY === 0 && hourUY >= 16){
    daysBack = 0; // hoy domingo después de las 16h → semana nueva
  } else if(dayUY === 0){
    daysBack = 7; // hoy domingo antes de las 16h → semana anterior
  } else {
    daysBack = dayUY; // lunes=1...sábado=6 días atrás hasta el domingo
  }
  // Inicio de semana: último domingo a las 16:00 UY = 19:00 UTC
  const start = new Date(now);
  start.setUTCDate(now.getUTCDate() - daysBack);
  start.setUTCHours(19, 0, 0, 0); // 16:00 UY = 19:00 UTC
  // Fin de semana: próximo domingo a las 15:59:59 UY = 18:59:59 UTC
  const end = new Date(start);
  end.setUTCDate(start.getUTCDate() + 7);
  end.setUTCMilliseconds(end.getUTCMilliseconds() - 1);
  return { mon: start, sun: end };
}

async function loadRankingSemanal(){
  const { mon, sun } = getRankWeekRange();
  const label = document.getElementById('rankWeekLabel');
  if(label) label.textContent = `Semana ${mon.toLocaleDateString('es',{day:'numeric',month:'short',timeZone:'America/Montevideo'})} — ${sun.toLocaleDateString('es',{day:'numeric',month:'short',year:'numeric',timeZone:'America/Montevideo'})}`;
  const activeTab = document.querySelector('.rank-tab.rank-on');
  const mode = activeTab ? (activeTab.getAttribute('data-mode')||'trofeos') : 'trofeos';
  renderRanking(mode, mon, sun);
}

async function renderRanking(mode, mon, sun){
  const podiumEl = document.getElementById('rankPodium');
  const listEl   = document.getElementById('rankList');
  if(!podiumEl||!listEl) return;
  podiumEl.innerHTML='<div style="text-align:center;color:var(--muted);font-size:.82rem;padding:40px 0;">Cargando...</div>';
  listEl.innerHTML='';
  try{
    const usersSnap = await getDocs(collection(db,'users'));
    const users = {};
    usersSnap.docs.forEach(d=>{ users[d.id]=d.data(); });
    const isExcluded = uid => {
      const u=users[uid]; if(!u) return false;
      return EXCLUDED_FROM_RANKING.includes(u.nick)
          || EXCLUDED_FROM_RANKING.includes(u.nickLower)
          || EXCLUDED_EMAILS_RANKING.includes(u.email)
          || u.role==='admin';
    };
    const getT = x => x?.toDate ? x.toDate() : (x?.toMillis ? new Date(x.toMillis()) : new Date(x||0));
    const inWeek = t => t>=mon && t<=sun;
    const tsVal = x => x?.toMillis ? x.toMillis() : (typeof x==="number" ? x : (x?.seconds ? x.seconds*1000 : 0));

    // Siempre cargar trofeos de la semana (los necesitamos para todos los modos)
    const trofSnap = await getDocs(query(collection(db,'trofeosPendientes'), where('status','==','approved'), limit(500)));
    const trofDocs = trofSnap.docs.map(d=>({id:d.id,...d.data()})).filter(d=>{
      const uid=d.userId||d.uid;
      return uid && !isExcluded(uid) && inWeek(getT(d.createdAt));
    });

    // Último trofeo por usuario (para mostrar imagen en podio)
    const lastTrofeo = {};
    trofDocs.sort((a,b)=>tsVal(b.createdAt)-tsVal(a.createdAt)).forEach(d=>{
      const uid=d.userId||d.uid;
      if(!lastTrofeo[uid]) lastTrofeo[uid]=d;
    });

    let ranking=[];
    if(mode==='trofeos'||mode==='peso'){
      const counts={}, weights={};
      trofDocs.forEach(d=>{
        const uid=d.userId||d.uid;
        counts[uid]=(counts[uid]||0)+1;
        weights[uid]=(weights[uid]||0)+parseFloat(d.weight||d.peso||0);
      });
      if(mode==='trofeos') ranking=Object.entries(counts).map(([uid,val])=>({uid,val,label:`${val} trofeo${val!==1?'s':''}`}));
      else ranking=Object.entries(weights).map(([uid,val])=>({uid,val,label:`${val.toFixed(3)} kg`}));
    } else {
      // Posts: contar posts normales + trofeos publicados en la semana
      const snap=await getDocs(query(collection(db,'posts'),orderBy('createdAt','desc'),limit(500)));
      const counts={};
      // Posts normales
      snap.docs.forEach(d=>{
        const data=d.data(); const uid=data.uid||data.userId;
        if(!uid||isExcluded(uid)||!inWeek(getT(data.createdAt))) return;
        counts[uid]=(counts[uid]||0)+1;
      });
      // Sumar trofeos publicados en la semana
      trofDocs.forEach(d=>{
        const uid=d.userId||d.uid;
        counts[uid]=(counts[uid]||0)+1;
      });
      ranking=Object.entries(counts).map(([uid,val])=>({uid,val,label:`${val} publicación${val!==1?'es':''}`}));
    }
    ranking.sort((a,b)=>b.val-a.val);
    if(!ranking.length){
      podiumEl.innerHTML='<div style="text-align:center;color:var(--muted);font-size:.82rem;padding:40px 0;">Sin actividad esta semana. ¡Sé el primero! 🎣</div>';
      return;
    }
    const medals=['🥇','🥈','🥉'];
    const heights=['110px','85px','65px'];
    const top3=ranking.slice(0,3);
    const podiumOrder=[1,0,2];
    podiumEl.innerHTML=`<div style="display:flex;align-items:flex-end;justify-content:center;gap:8px;width:100%;">`+
      podiumOrder.map(i=>{
        if(!top3[i]) return '';
        const u=users[top3[i].uid]||{};
        const nick=esc(u.nick||u.displayName||'?');
        const av=u.photoURL||u.avatar||u.av||'';
        const isFirst=i===0;
        // Imagen del último trofeo del usuario
        const lt=lastTrofeo[top3[i].uid];
        const trofImg=lt?(lt.images?.[0]||lt.imageUrl||lt.img||''):'';
        const trofFish=lt?esc(lt.fish||lt.especie||''):'';
        const trofWeight=lt?(lt.weight||lt.peso?fmtKg(lt.weight||lt.peso):''):'';
        return `<div style="display:flex;flex-direction:column;align-items:center;gap:4px;flex:1;max-width:160px;">
          <div style="font-size:${isFirst?'1.6rem':'1.2rem'};">${medals[i]}</div>
          <div onclick="openUserProfile('${top3[i].uid}')" style="cursor:pointer;width:${isFirst?'52px':'42px'};height:${isFirst?'52px':'42px'};border-radius:50%;border:2px solid ${isFirst?'var(--gold)':'var(--border)'};overflow:hidden;background:var(--bg4);display:flex;align-items:center;justify-content:center;font-weight:800;font-size:${isFirst?'1.1rem':'.9rem'};color:var(--accent);">
            ${av?`<img src="${av}" style="width:100%;height:100%;object-fit:cover;">`:(nick[0]||'?').toUpperCase()}
          </div>
          <div style="font-size:${isFirst?'.82rem':'.75rem'};font-weight:700;color:var(--text);text-align:center;word-break:break-word;">${nick}</div>
          <div style="font-size:.7rem;color:var(--accent);font-weight:700;">${top3[i].label}</div>
          ${trofImg?`<div style="width:100%;border-radius:var(--rs);overflow:hidden;border:1px solid rgba(255,215,0,.3);margin-top:2px;cursor:pointer;" onclick="openImgLightbox('${trofImg}',['${trofImg}'],'')">
            <img src="${trofImg}" style="width:100%;height:${isFirst?'90px':'70px'};object-fit:cover;display:block;" loading="lazy">
            ${trofFish?`<div style="background:rgba(0,0,0,.7);padding:3px 6px;font-size:.62rem;font-weight:700;color:var(--gold);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${trofFish}${trofWeight?' · '+trofWeight:''}</div>`:''}
          </div>`:''}
          <div style="width:100%;height:${heights[i]};background:${isFirst?'rgba(212,160,23,.2)':'rgba(46,196,182,.1)'};border:1px solid ${isFirst?'rgba(212,160,23,.35)':'var(--border)'};border-bottom:none;border-radius:var(--rs) var(--rs) 0 0;"></div>
        </div>`;
      }).join('')+`</div>`;
    listEl.innerHTML=ranking.map((r,i)=>{
      const u=users[r.uid]||{};
      const nick=esc(u.nick||u.displayName||'?');
      const av=u.photoURL||u.avatar||u.av||'';
      const lt=lastTrofeo[r.uid];
      const trofImg=lt?(lt.images?.[0]||lt.imageUrl||lt.img||''):'';
      const isTop=i<3;
      return `<div onclick="openUserProfile('${r.uid}')" style="display:flex;align-items:center;gap:12px;background:${isTop?'rgba(46,196,182,.06)':'var(--bg3)'};border:1px solid ${isTop?'rgba(46,196,182,.2)':'var(--border)'};border-radius:var(--r);padding:10px 14px;cursor:pointer;transition:background .15s;">
        <span style="font-size:1rem;font-weight:800;color:${i<3?'var(--gold)':'var(--muted)'};min-width:28px;text-align:center;">${i<3?medals[i]:i+1}</span>
        <div style="width:36px;height:36px;border-radius:50%;overflow:hidden;background:var(--bg4);border:1px solid var(--border);display:flex;align-items:center;justify-content:center;font-weight:700;font-size:.85rem;color:var(--accent);flex-shrink:0;">
          ${av?`<img src="${av}" style="width:100%;height:100%;object-fit:cover;">`:(nick[0]||'?').toUpperCase()}
        </div>
        <div style="flex:1;"><div style="font-size:.85rem;font-weight:700;color:var(--text);">${nick}</div></div>
        ${trofImg?`<img src="${trofImg}" style="width:40px;height:40px;object-fit:cover;border-radius:6px;border:1px solid rgba(255,215,0,.3);" loading="lazy">`:''}
        <div style="font-size:.82rem;font-weight:800;color:var(--accent);">${r.label}</div>
      </div>`;
    }).join('');
  }catch(e){
    console.error('Ranking error:',e);
    podiumEl.innerHTML=`<div style="color:var(--red);font-size:.78rem;padding:20px;">Error al cargar ranking: ${e.message}</div>`;
  }
}
window.loadRankingSemanal=loadRankingSemanal;
window.switchRankTab=function(btn,mode){
  document.querySelectorAll('.rank-tab').forEach(b=>{
    b.classList.remove('rank-on');
    b.style.background='var(--bg3)'; b.style.borderColor='var(--border)'; b.style.color='var(--muted)';
  });
  btn.classList.add('rank-on');
  btn.style.background='rgba(46,196,182,.1)'; btn.style.borderColor='rgba(46,196,182,.3)'; btn.style.color='var(--accent)';
  btn.setAttribute('data-mode',mode);
  const {mon,sun}=getRankWeekRange();
  renderRanking(mode,mon,sun);
};

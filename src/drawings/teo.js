// Teo Lind, authored key drawings. Each contour is placed by hand and stored as
// a smooth cubic. Walk and sit keys reuse a held head drawing and redraw the body.

import { smoothClosed, smoothOpen } from "../curves.js";

const SKIN = ["#EBC3A0", "#C48B68"];
const HAIR = ["#9A4E2C", "#6B3218"];
const SHIRT = ["#8E9092", "#5A5C60"];
const PANTS = ["#66704A", "#3E4A2C"];
const SHOE = ["#7A5233", "#4A301C"];

function move(pts, dx, dy) {
  return pts.map(([x, y]) => [x + dx, y + dy]);
}

function bend(pts, dx) {
  const last = Math.max(1, pts.length - 1);
  return pts.map(([x, y], i) => {
    const t = Math.sin((i / last) * Math.PI);
    return [x + dx * t, y];
  });
}

function ink(id, pts, fill, stroke, extra = {}) {
  const open = extra.open === true;
  return {
    id,
    type: "path",
    path: open ? smoothOpen(pts) : smoothClosed(pts),
    fill: open ? "none" : fill,
    stroke,
    strokeWidth: 0,
    line: extra.line || (open ? "interior" : "contour"),
    shadow: !open && extra.shadow !== false,
    ...(extra.role ? { role: extra.role } : {}),
  };
}

function sheet({ view, pose, feet, crown, chin, shapes }) {
  const footY = Math.max(...feet.map((foot) => foot[1]));
  return {
    character: "teo",
    view,
    pose,
    width: 560,
    height: footY + 4,
    feet,
    crown,
    chin,
    shapes,
  };
}

const frontHead = [
  [270, 62], [312, 78], [340, 116], [346, 160], [326, 200], [294, 226], [270, 234],
  [246, 226], [214, 200], [194, 160], [200, 116], [228, 78],
];
const frontHair = [
  [224, 146], [196, 124], [188, 86], [214, 50], [258, 36], [308, 46], [342, 78],
  [356, 118], [340, 154], [310, 136], [274, 148], [240, 132],
];
const frontBeard = [
  [226, 204], [214, 226], [236, 248], [270, 260], [304, 248], [326, 226], [314, 204], [270, 216],
];
const frontEyeL = [[214, 158], [230, 146], [250, 146], [262, 160], [246, 174], [226, 172]];
const frontEyeR = [[278, 160], [292, 146], [314, 148], [326, 162], [310, 176], [290, 174]];
const frontPupilL = [[232, 154], [242, 150], [250, 158], [242, 166]];
const frontPupilR = [[296, 156], [306, 152], [314, 160], [306, 168]];

function frontStand() {
  return sheet({
    view: "front",
    pose: "stand",
    crown: 36,
    chin: 234,
    feet: [[214, 812], [332, 812]],
    shapes: [
      ink("earL", [[186, 148], [170, 166], [176, 196], [198, 190], [200, 164]], SKIN[0], SKIN[1]),
      ink("earR", [[354, 150], [370, 168], [364, 198], [342, 192], [340, 166]], SKIN[0], SKIN[1]),
      ink("sleeveL", [[176, 276], [150, 304], [136, 360], [128, 430], [160, 442], [172, 372], [190, 312], [210, 274]], SHIRT[0], SHIRT[1]),
      ink("sleeveR", [[364, 278], [390, 308], [404, 364], [408, 432], [376, 446], [368, 376], [350, 316], [332, 276]], SHIRT[0], SHIRT[1]),
      ink("pantsL", [[214, 456], [246, 478], [250, 560], [244, 690], [236, 778], [186, 776], [178, 688], [174, 548], [188, 466]], PANTS[0], PANTS[1]),
      ink("pantsR", [[326, 458], [294, 480], [292, 562], [298, 692], [306, 778], [356, 776], [364, 690], [366, 550], [352, 468]], PANTS[0], PANTS[1]),
      ink("shoeL", [[180, 770], [166, 794], [176, 816], [246, 818], [254, 794], [238, 768]], SHOE[0], SHOE[1]),
      ink("shoeR", [[360, 770], [374, 794], [364, 816], [294, 818], [286, 794], [302, 768]], SHOE[0], SHOE[1]),
      ink("shirt", [[168, 278], [206, 254], [270, 246], [334, 254], [372, 278], [364, 360], [340, 448], [300, 470], [240, 474], [200, 448], [176, 360]], SHIRT[0], SHIRT[1]),
      ink("handL", [[134, 424], [116, 444], [104, 472], [112, 498], [128, 488], [132, 510], [150, 498], [152, 516], [168, 502], [162, 476], [180, 488], [170, 454], [154, 428]], SKIN[0], SKIN[1], { role: "hand", shadow: false }),
      ink("handR", [[402, 426], [420, 446], [432, 474], [422, 500], [406, 490], [404, 512], [386, 500], [384, 518], [368, 504], [374, 478], [356, 490], [366, 456], [382, 430]], SKIN[0], SKIN[1], { role: "hand", shadow: false }),
      ink("neck", [[242, 224], [270, 218], [298, 224], [310, 250], [302, 278], [238, 278], [230, 250]], SKIN[0], SKIN[1], { shadow: false }),
      ink("head", frontHead, SKIN[0], SKIN[1], { role: "head", shadow: false }),
      ink("hair", frontHair, HAIR[0], HAIR[1], { role: "hair" }),
      ink("beard", frontBeard, HAIR[0], HAIR[1], { shadow: false }),
      ink("eyeL", frontEyeL, "#F7F3EA", SKIN[1], { role: "eye", shadow: false }),
      ink("eyeR", frontEyeR, "#F7F3EA", SKIN[1], { role: "eye", shadow: false }),
      ink("pupilL", frontPupilL, "#241C22", "#241C22", { role: "pupil", shadow: false }),
      ink("pupilR", frontPupilR, "#241C22", "#241C22", { role: "pupil", shadow: false }),
      ink("browL", [[208, 140], [230, 130], [256, 138]], "none", HAIR[1], { open: true, line: "interior" }),
      ink("browR", [[284, 138], [308, 128], [334, 140]], "none", HAIR[1], { open: true, line: "interior" }),
      ink("nose", [[286, 168], [300, 188], [282, 198]], "none", SKIN[1], { open: true, line: "interior" }),
      ink("mouth", [[240, 198], [270, 206], [300, 198]], "none", "#6B3A32", { open: true, line: "mouth" }),
      ink("jaw", [[210, 186], [238, 214], [270, 226], [302, 214], [330, 186]], "none", SKIN[1], { open: true, line: "detail" }),
      ink("fold", [[250, 300], [270, 360], [258, 430]], "none", SHIRT[1], { open: true, line: "interior" }),
    ],
  });
}

const quarterHead = [
  [250, 64], [292, 74], [326, 108], [344, 150], [338, 178], [322, 204],
  [296, 224], [266, 218], [236, 194], [214, 158], [208, 116], [224, 82],
];
const quarterHair = [
  [214, 156], [190, 128], [196, 84], [230, 48], [280, 36], [324, 58], [352, 98],
  [366, 142], [348, 168], [318, 146], [276, 156], [240, 140],
];
const quarterBeard = [
  [252, 198], [240, 222], [262, 246], [298, 258], [330, 236], [342, 208], [300, 214],
];

function quarterBody(shift = {}) {
  const y = shift.y || 0;
  const armF = shift.armF || 0;
  const armB = shift.armB || 0;
  const legF = shift.legF || [0, 0, 0, 0];
  const legB = shift.legB || [0, 0, 0, 0];
  const lean = shift.lean || 0;
  const near = (pts) => move(pts, lean, y);
  return [
    ink("sleeveB", near(bend([[188, 286], [166, 318], [156, 380], [150, 448], [178, 456], [188, 390], [206, 324], [224, 284]], armB)), SHIRT[0], SHIRT[1]),
    ink("pantsB", near([[230, 470], [252, 492], [246 + legB[0], 590 + legB[1]], [236 + legB[2], 730 + legB[3]], [196 + legB[2], 728 + legB[3]], [188, 600], [196, 500], [214, 474]]), PANTS[0], PANTS[1]),
    ink("shoeB", near(move([[190, 724], [176, 748], [186, 770], [244, 772], [252, 750], [236, 722]], legB[2], legB[3])), SHOE[0], SHOE[1]),
    ink("sleeveF", near(bend([[332, 292], [356, 324], [372, 390], [380, 456], [352, 468], [340, 400], [322, 332], [304, 292]], armF)), SHIRT[0], SHIRT[1]),
    ink("pantsF", near([[300, 468], [276, 490], [286 + legF[0], 588 + legF[1]], [300 + legF[2], 734 + legF[3]], [348 + legF[2], 736 + legF[3]], [356, 600], [348, 500], [328, 472]]), PANTS[0], PANTS[1]),
    ink("shoeF", near(move([[292, 726], [280, 750], [292, 774], [360, 776], [370, 752], [352, 724]], legF[2], legF[3])), SHOE[0], SHOE[1]),
    ink("shirt", near([[196, 286], [236, 262], [286, 254], [334, 266], [360, 294], [352, 370], [328, 456], [286, 478], [236, 470], [208, 430], [190, 350]]), SHIRT[0], SHIRT[1]),
    ink("handB", near(move([[156, 446], [140, 468], [132, 500], [146, 524], [164, 512], [170, 532], [190, 516], [196, 488], [212, 500], [200, 468], [182, 448]], armB, 0)), SKIN[0], SKIN[1], { role: "hand", shadow: false }),
    ink("handF", near(move([[372, 452], [392, 474], [404, 506], [390, 530], [370, 516], [364, 536], [344, 520], [338, 492], [322, 506], [334, 474], [356, 452]], armF, 0)), SKIN[0], SKIN[1], { role: "hand", shadow: false }),
    ink("neck", near([[246, 214], [286, 208], [318, 220], [328, 250], [316, 282], [236, 278], [230, 246]]), SKIN[0], SKIN[1]),
    ink("head", near(quarterHead), SKIN[0], SKIN[1], { role: "head", shadow: false }),
    ink("hair", near(quarterHair), HAIR[0], HAIR[1], { role: "hair" }),
    ink("beard", near(quarterBeard), HAIR[0], HAIR[1], { shadow: false }),
    ink("eyeB", near([[236, 150], [250, 140], [266, 142], [272, 156], [258, 166], [242, 164]]), "#F7F3EA", SKIN[1], { role: "eye", shadow: false }),
    ink("eyeF", near([[292, 146], [312, 134], [334, 138], [342, 156], [322, 170], [300, 166]]), "#F7F3EA", SKIN[1], { role: "eye", shadow: false }),
    ink("pupilB", near([[250, 148], [258, 146], [264, 154], [256, 160]]), "#241C22", "#241C22", { shadow: false }),
    ink("pupilF", near([[314, 146], [324, 142], [332, 152], [322, 160]]), "#241C22", "#241C22", { shadow: false }),
    ink("browB", near([[234, 136], [254, 128], [270, 136]]), "none", HAIR[1], { open: true, line: "interior" }),
    ink("browF", near([[296, 130], [318, 120], [340, 132]]), "none", HAIR[1], { open: true, line: "interior" }),
    ink("nose", near([[316, 166], [326, 176], [314, 186]]), "none", SKIN[1], { open: true, line: "interior" }),
    ink("mouth", near([[284, 198], [306, 206], [322, 196]]), "none", "#6B3A32", { open: true, line: "mouth" }),
    ink("jaw", near([[232, 184], [262, 210], [296, 216], [318, 194]]), "none", SKIN[1], { open: true, line: "detail" }),
    ink("fold", near([[268, 310], [286, 370], [274, 448]]), "none", SHIRT[1], { open: true, line: "interior" }),
  ];
}

function quarter(pose, shift, feet) {
  return sheet({
    view: "threeQuarter",
    pose,
    crown: 36 + (shift.y || 0),
    chin: 226 + (shift.y || 0),
    feet,
    shapes: quarterBody(shift),
  });
}

const profileHead = [
  [236, 70], [268, 78], [292, 112], [300, 142], [328, 168], [304, 184], [292, 196],
  [300, 210], [276, 228], [246, 220], [214, 190], [196, 146], [204, 96], [220, 74],
];
const profileHair = [
  [210, 168], [184, 140], [180, 96], [206, 52], [252, 38], [292, 58], [310, 96],
  [296, 132], [268, 118], [236, 132],
];
const profileBeard = [
  [268, 196], [258, 220], [276, 246], [304, 236], [318, 214], [300, 200], [280, 208],
];

function profileStand() {
  return sheet({
    view: "profile",
    pose: "stand",
    crown: 38,
    chin: 228,
    feet: [[286, 812]],
    shapes: [
      ink("sleeveB", [[248, 286], [228, 318], [214, 390], [206, 458], [232, 468], [242, 400], [254, 330], [268, 292]], SHIRT[0], SHIRT[1]),
      ink("pantsB", [[236, 470], [258, 488], [252, 620], [246, 760], [214, 758], [208, 620], [216, 500], [228, 472]], PANTS[0], PANTS[1]),
      ink("shoeB", [[208, 752], [198, 776], [210, 800], [268, 802], [276, 776], [258, 750]], SHOE[0], SHOE[1]),
      ink("pantsF", [[268, 466], [292, 484], [304, 600], [312, 762], [358, 764], [362, 610], [348, 500], [324, 468]], PANTS[0], PANTS[1]),
      ink("shoeF", [[306, 754], [298, 778], [312, 802], [372, 804], [382, 778], [360, 752]], SHOE[0], SHOE[1]),
      ink("shirt", [[220, 292], [250, 268], [292, 262], [324, 286], [332, 360], [318, 450], [286, 474], [246, 462], [224, 400], [210, 330]], SHIRT[0], SHIRT[1]),
      ink("sleeveF", [[318, 294], [344, 326], [362, 390], [372, 456], [344, 468], [330, 400], [312, 332], [294, 296]], SHIRT[0], SHIRT[1]),
      ink("handF", [[364, 450], [384, 472], [396, 504], [382, 528], [362, 514], [356, 534], [336, 518], [330, 490], [314, 504], [326, 472], [348, 452]], SKIN[0], SKIN[1], { role: "hand" }),
      ink("neck", [[250, 216], [292, 214], [304, 248], [292, 282], [236, 276], [232, 244]], SKIN[0], SKIN[1]),
      ink("head", profileHead, SKIN[0], SKIN[1], { role: "head", shadow: false }),
      ink("hair", profileHair, HAIR[0], HAIR[1], { role: "hair" }),
      ink("beard", profileBeard, HAIR[0], HAIR[1], { shadow: false }),
      ink("eyeF", [[268, 132], [286, 122], [302, 132], [286, 146]], "#F7F3EA", SKIN[1], { role: "eye", shadow: false }),
      ink("pupilF", [[284, 128], [294, 126], [298, 136], [288, 140]], "#241C22", "#241C22", { shadow: false }),
      ink("browF", [[266, 116], [286, 108], [304, 118]], "none", HAIR[1], { open: true, line: "interior" }),
      ink("mouth", [[292, 196], [308, 204], [318, 196]], "none", "#6B3A32", { open: true, line: "mouth" }),
      ink("jaw", [[250, 188], [276, 216], [304, 200]], "none", SKIN[1], { open: true, line: "detail" }),
    ],
  });
}

function sitDrawing() {
  const upper = quarterBody({ y: 120, lean: -12, armF: 18, armB: -14 }).filter((shape) => !/pants|shoe/.test(shape.id));
  const legs = [
    ink("pantsB", [[250, 560], [280, 575], [330, 590], [348, 630], [340, 760], [300, 762], [292, 640], [270, 600], [246, 580]], PANTS[0], PANTS[1]),
    ink("shoeB", [[296, 754], [286, 776], [300, 800], [352, 802], [360, 776], [340, 752]], SHOE[0], SHOE[1]),
    ink("pantsF", [[300, 552], [350, 568], [410, 578], [436, 620], [448, 760], [400, 768], [388, 640], [360, 600], [310, 574]], PANTS[0], PANTS[1]),
    ink("shoeF", [[396, 756], [388, 780], [404, 804], [468, 806], [478, 778], [452, 754]], SHOE[0], SHOE[1]),
  ];
  return sheet({
    view: "threeQuarter",
    pose: "sit",
    crown: 156,
    chin: 346,
    feet: [[340, 802], [468, 806]],
    shapes: [...legs, ...upper],
  });
}

export const TEO_SHEET = [
  frontStand(),
  quarter("stand", {}, [[236, 812], [360, 812]]),
  quarter("contactL", { armF: 28, armB: -36, legF: [18, 10, 46, 0], legB: [-10, 20, -34, 8] }, [[202, 812], [406, 812]]),
  quarter("down", { y: 16, armF: 8, armB: -8, legF: [8, 36, 16, 0], legB: [-6, 28, -8, 0] }, [[228, 812], [368, 812]]),
  quarter("pass", { y: -10, armF: -6, armB: 6, legF: [0, 8, 4, -18], legB: [0, 4, -6, 0] }, [[230, 794], [346, 812]]),
  quarter("contactR", { armF: -34, armB: 30, legF: [-8, 16, -30, 6], legB: [16, 8, 42, 0] }, [[206, 812], [402, 812]]),
  quarter("anticipate", { y: -6, lean: -10, armF: -12, armB: 10 }, [[226, 806], [350, 806]]),
  sitDrawing(),
  profileStand(),
];

export const TEO_CHAIR = [
  ink("backL", [[230, 520], [248, 518], [236, 300], [218, 304]], "#8B5A34", "#5C3A22", { shadow: false }),
  ink("backR", [[330, 508], [348, 504], [336, 292], [318, 296]], "#8B5A34", "#5C3A22", { shadow: false }),
  ink("slat", [[228, 360], [332, 348], [334, 370], [230, 382]], "#A56B3E", "#5C3A22", { shadow: false }),
  ink("seat", [[210, 545], [390, 528], [382, 566], [204, 584]], "#C4844A", "#6B4024", { shadow: false }),
  ink("legL", [[214, 572], [236, 570], [220, 800], [198, 798]], "#8B5A34", "#5C3A22", { shadow: false }),
  ink("legR", [[360, 556], [382, 552], [396, 802], [374, 804]], "#8B5A34", "#5C3A22", { shadow: false }),
];

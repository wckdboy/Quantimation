import json, sys
sys.path.insert(0,'.')
from colour import *
INK='#221D26'
chars={
 'dot':{'name':'Dot Lind','parts':{
   'skin':('#8A5B3A','#6B432B',None),'hair':('#211C24','#151218','#3A3342'),'blazer':('#4A6385','#35496A',None),
   'shirt':('#EDE3CC','#CDBE9E',None),'trousers':('#3B3E46','#2A2C33',None),'shoes':('#1F1E23','#151418','#3C3B44'),
   'tablet':('#2C3038','#1E2127','#6F7B8C'),'mouthCavity':('#3B252B',None,None),'teeth':('#F1E9D3','#D6CCB2',None),'tongue':('#C27373','#9E5A5C',None)}},
 'teo':{'name':'Teo Lind','parts':{
   'skin':('#EBC3A0','#CC9E7E',None),'freckles':('#C98B66',None,None),'hair':('#9A4E2C','#783A1F',None),'beard':('#9A4E2C','#783A1F',None),
   'shirt':('#8E9092','#707274',None),'overalls':('#66704A','#4C5536',None),'hardware':('#B9A46A','#948349','#E2D3A0'),
   'boots':('#7A5233','#5B3C24',None),'mouthCavity':('#3B252B',None,None),'teeth':('#F1E9D3','#D6CCB2',None),'tongue':('#C27373','#9E5A5C',None)}},
 'gloam':{'name':'Gloam','parts':{
   'skin':('#8AB3A2','#6B9282',None),'vest':('#7A5A44','#5D4332',None),'mouthCavity':('#33282E',None,None),'tongue':('#B97C82','#946066',None)}},
}
shared={'ink':INK,'sclera':'#F4F0E4','scleraShadow':None,'pupil':INK,'lidLine':INK}
out={'version':1,'units':'Widths are screen px at 1920x1080. Stage units (the repo 1280x720 stage) = px / 1.5.',
 'frameRate':24,'drawingRate':{'default':'twos','twosHz':12,'onesHz':24},
 'line':{
  'ink':INK,
  'classes':{
   'contour':{'px':4.0,'stage':2.667,'colour':'ink','taper':None,'wobblePx':0.7,'weightModulation':0.15},
   'eye':{'px':3.5,'stage':2.333,'colour':'ink','taper':None,'wobblePx':0.9,'weightModulation':0.10},
   'interior':{'px':2.75,'stage':1.833,'colour':'ink','taper':[0.30,0.45],'wobblePx':0.6,'weightModulation':0.0},
   'mouth':{'px':3.0,'stage':2.0,'colour':'ink','taper':[0.5,0.5],'wobblePx':0.4,'weightModulation':0.0},
   'detail':{'px':2.0,'stage':1.333,'colour':'localShadowDarken','taper':[0.25,0.25],'wobblePx':0.5,'weightModulation':0.0},
   'prop':{'px':3.25,'stage':2.167,'colour':'ink','taper':None,'wobblePx':0.6,'weightModulation':0.10},
   'bg':{'px':2.5,'stage':1.667,'colour':'localDarken','taper':None,'wobblePx':0.5,'weightModulation':0.0},
   'bgDetail':{'px':1.5,'stage':1.0,'colour':'localDarken','taper':[0.4,0.4],'wobblePx':0.4,'weightModulation':0.0},
   'bgFar':{'px':1.0,'stage':0.667,'colour':'localDarkenFar','taper':None,'wobblePx':0.0,'weightModulation':0.0},
   'fx':{'px':0.0,'stage':0.0,'colour':'none','taper':None,'wobblePx':0.8,'weightModulation':0.0},
   'none':{'px':0.0,'stage':0.0,'colour':'none'}},
  'taper':{'startWidth':0.30,'startRamp':0.18,'endRamp':0.22,'endWidth':0.45,'curve':'smoothstep','tJunctionEnd':'full'},
  'wobble':{'octaves':[{'wavelengthPx':90,'weight':0.7},{'wavelengthPx':32,'weight':0.3}],'resamplePx':3,'cornerAngleDeg':35,'cornerFalloffPx':6,
            'seed':'fnv1a(assetId + "/" + shapeId + "/" + variantName + "/" + view)','timeVarying':False},
  'boil':{'default':False,'allowed':['fx','movingHoldOptIn'],'fx':{'amplitudePx':0.8,'seeds':3,'holdFrames':2},'smokeFx':{'amplitudePx':0.8,'seeds':3,'holdFrames':3},
          'movingHold':{'amplitudePx':0.35,'seeds':3,'holdFrames':3,'minHoldFrames':48},
          'never':['speaking close-up','camera move in progress','pupils','backgrounds','props at rest']},
  'screenSpace':{'compensate':True,'growClamp':[0.8,1.25],'minPx':1.25},
  'colourRules':{'localDarken':{'oklchLightness':0.55,'chroma':0.9},'localDarkenFar':{'oklchLightness':0.75,'chroma':0.8},'localShadowDarken':{'ofShadow':True,'oklchLightness':0.75,'chroma':1.0}}},
 'eyes':{'scleraWidthOfHead':{'dot':0.32,'teo':0.36,'gloam':0.30},'scleraWidthMeasuredAgainst':'head width (skull, excluding hair and ears)','scleraAspectHW':{'dot':1.0,'teo':1.06,'gloam':1.0},
         'innerGapOfHead':[-0.02,0.0],'eyeLineFromSkullTop':{'dot':0.42,'teo':0.40,'gloam':0.45},
         'pupilDiameterOfSclera':0.11,'pupilMinPx':4,'pupilMaxTravelOfRadius':0.30,'pupilDivergenceMaxOfSclera':0.04,
         'scaredPupilScale':0.6,'highlight':False,
         'lids':{'open':0.0,'deadpan':0.45,'smug':0.50,'smugTiltDeg':8,'annoyed':0.30,'annoyedTiltDeg':-12,'sadTiltDeg':14,'blink':1.0}},
 'shared':shared,'characters':{},'scenes':{}}
for cid,c in chars.items():
    parts={}
    for k,(b,s,h) in c['parts'].items():
        d={'base':b}
        if s: d['shadow']=s
        if h: d['highlight']=h
        d['detailLine']=darken_line(s or b,0.75,1.0)
        parts[k]=d
    out['characters'][cid]={'name':c['name'],'parts':parts}
scenes={
 'kitchen_day':{'type':'day','lightAngleDeg':135,'shadowTint':'#C6BAD6','characterGrade':'#FFFFFF','rim':None,
   'bg':{'sky':'#BFDCE6','wall':'#E0D3B4','tile':'#CDBF8E','cabinet':'#8FA383','counter':'#E8DCC0','floorA':'#CBD0B0','floorB':'#E3DDC4','wood':'#8A6446','metal':'#A7ABA6','fridge':'#A2AA9F','accent':'#4FA39A'}},
 'garage_lab':{'type':'day','lightAngleDeg':20,'shadowTint':'#BFB4C8','characterGrade':'#FFF3E4','rim':None,
   'bg':{'wall':'#D2BF9C','concrete':'#9A948C','wood':'#9C6C46','shelf':'#6F6B67','pegboard':'#A57C52','fridge':'#9DAA95','doorMetal':'#80858A','skyOutside':'#C8B7D2','lawn':'#7FA068','porthole':'#A6E8B0','cord':'#D27A3E'},
   'emissive':{'porthole':'#A6E8B0','lamp':'#F6E3B0'}},
 'market_neon':{'type':'alienNeon','lightAngleDeg':90,'shadowTint':'#8E86B2','characterGrade':'#B9B4D4','rim':{'amber':'#FFC46B','cyan':'#7FE6E0','widthPx':2.5},
   'bg':{'sky':'#1F2542','domeFrame':'#2E303A','floorA':'#3A3A41','floorB':'#46434B','awningCoral':'#8E5550','awningPlum':'#58435C','awningTeal':'#2F5A5A','crate':'#5A4431','planet':'#C4BDD3','produceBlue':'#4E6A8A','producePale':'#B9C2B4'},
   'emissive':{'jarAmber':'#FFC46B','jarCyan':'#7FE6E0','stars':'#E9E4F5'}},
 'exterior_night':{'type':'night','lightAngleDeg':120,'shadowTint':'#8F8DB9','characterGrade':'#B6BAD9','rim':{'moon':'#AFC2FF','widthPx':2.0},
   'bg':{'sky':'#232C4A','houses':'#4A4E66','lawn':'#34483F','road':'#3A3D4C','windowLit':'#F2D58F'}},
}
for sid,s in scenes.items():
    s=dict(s); s['bgLine']={k:darken_line(v) for k,v in s['bg'].items()}
    s['contactShadow']=darken_line(s['bg'].get('floorA',s['bg'].get('concrete',s['bg'].get('lawn','#808080'))),0.75,0.9)
    # graded character colours for leads (multiply grade), plus shadows multiplied by tint when hand-picked absent
    g={}
    for cid,c in out['characters'].items():
        g[cid]={k:{'base':multiply(v['base'],s['characterGrade']),**({'shadow':multiply(v['shadow'],s['characterGrade'])} if 'shadow' in v else {'shadow':multiply(multiply(v['base'],s['shadowTint']),s['characterGrade'])})} for k,v in c['parts'].items()}
    s['gradedCharacters']=g
    bgL=[round(lstar(v),1) for v in s['bg'].values()]
    s['bgLstarRange']=[min(bgL),max(bgL)]
    out['scenes'][sid]=s
out['valueRules']={'characterVsBgMinDeltaLstar':12,'deltaMeasuredAs':'mean L* of character silhouette vs mean L* of bg pixels in the silhouette bbox grown 50%','accentExceptionMaxFrameArea':0.03,'bgChromaMaxOklch':0.08,'characterChromaMaxOklch':0.15,'emissiveOnlyAbove':0.12,
  'dayBgLstar':[35,85],'nightBgLstar':[10,45]}
json.dump(out,open('../palettes.json','w'),indent=2)
# report chroma/value
for sid,s in out['scenes'].items():
    print(sid,s['bgLstarRange'], 'maxC bg',round(max(oklch(v)[1] for v in s['bg'].values()),3))
for cid,c in out['characters'].items():
    print(cid,{k:(round(lstar(v['base'])),round(oklch(v['base'])[1],3)) for k,v in c['parts'].items()})
print('dot skin in neon',out['scenes']['market_neon']['gradedCharacters']['dot']['skin'], round(lstar(out['scenes']['market_neon']['gradedCharacters']['dot']['skin']['base'])))

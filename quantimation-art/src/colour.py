import math
def hex2rgb(h): h=h.lstrip('#'); return tuple(int(h[i:i+2],16)/255 for i in (0,2,4))
def rgb2hex(c): return '#'+''.join('%02x'%max(0,min(255,round(v*255))) for v in c)
def _lin(v): return v/12.92 if v<=0.04045 else ((v+0.055)/1.055)**2.4
def _gam(v): return 12.92*v if v<=0.0031308 else 1.055*v**(1/2.4)-0.055
def to_oklab(h):
    r,g,b=[_lin(v) for v in hex2rgb(h)]
    l=0.4122214708*r+0.5363325363*g+0.0514459929*b; m=0.2119034982*r+0.6806995451*g+0.1073969566*b; s=0.0883024619*r+0.2817188376*g+0.6299787005*b
    l,m,s=[math.copysign(abs(x)**(1/3),x) for x in (l,m,s)]
    return (0.2104542553*l+0.7936177850*m-0.0040720468*s, 1.9779984951*l-2.4285922050*m+0.4505937099*s, 0.0259040371*l+0.7827717662*m-0.8086757660*s)
def from_oklab(L,a,b):
    l=(L+0.3963377774*a+0.2158037573*b)**3; m=(L-0.1055613458*a-0.0638541728*b)**3; s=(L-0.0894841775*a-1.2914855480*b)**3
    r=4.0767416621*l-3.3077115913*m+0.2309699292*s; g=-1.2684380046*l+2.6097574011*m-0.3413193965*s; bb=-0.0041960863*l-0.7034186147*m+1.7076147010*s
    return rgb2hex([_gam(max(0,min(1,v))) for v in (r,g,bb)])
def oklch(h):
    L,a,b=to_oklab(h); return L, math.hypot(a,b), math.degrees(math.atan2(b,a))%360
def from_oklch(L,C,H): return from_oklab(L,C*math.cos(math.radians(H)),C*math.sin(math.radians(H)))
def darken_line(h,lk=0.55,ck=0.9):
    L,C,H=oklch(h); return from_oklch(L*lk,C*ck,H)
def multiply(h,t): return rgb2hex([x*y for x,y in zip(hex2rgb(h),hex2rgb(t))])
def mix(h1,h2,k): return rgb2hex([x+(y-x)*k for x,y in zip(hex2rgb(h1),hex2rgb(h2))])
def lstar(h):
    r,g,b=[_lin(v) for v in hex2rgb(h)]; Y=0.2126*r+0.7152*g+0.0722*b
    return 116*Y**(1/3)-16 if Y>0.008856 else 903.3*Y

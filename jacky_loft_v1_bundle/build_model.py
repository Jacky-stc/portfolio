"""Reference-inspired loft revision 0.5.1. Offline mesh construction and glTF export.
Coordinates in this builder: X right, Y rear, Z up. Export: glTF Y up.
Requires Python 3, numpy and Pillow. Does not download external assets.
"""
from pathlib import Path
import json, math, struct, io, copy
import numpy as np
from PIL import Image, ImageDraw, ImageFont

OUT = Path(__file__).resolve().parent
OUT.mkdir(exist_ok=True)
MATS=[]; OBJECTS=[]; GROUPS={}; LIGHTS=[]; TEXTURES=[]
rng=np.random.default_rng(17)

def mat(name, color, rough=.7, metal=0, emission=None, strength=1, alpha=1):
    m={'name':name,'pbrMetallicRoughness':{'baseColorFactor':[*color,alpha], 'metallicFactor':metal,'roughnessFactor':rough}}
    if emission:
        m['emissiveFactor']=list(emission)
        m['extensions']={'KHR_materials_emissive_strength':{'emissiveStrength':strength}}
    if alpha<1: m.update(alphaMode='BLEND',doubleSided=True)
    MATS.append(m); return len(MATS)-1

wall=mat('Warm_ivory_plaster',(.65,.61,.50))
edge=mat('Floor_edge',(.37,.25,.135))
oak=mat('Oak',(.40,.25,.12))
walnut=mat('Walnut',(.18,.10,.05))
black=mat('Charcoal_metal',(.023,.028,.025),.4,.65)
sofa=mat('Flax_linen_upholstery',(.34,.32,.30),.92)
pillow=mat('Linen_cushion',(.72,.71,.61),.94)
ochre=mat('Mustard_cushion',(.61,.36,.055),.9)
screen=mat('TV_glass',(.008,.013,.017),.17,.1)
ceramic=mat('Warm_ceramic',(.62,.62,.52),.35)
soil=mat('Soil',(.05,.035,.02))
leaf=mat('Leaf_green',(.16,.28,.067),.83)
leaf2=mat('Leaf_light',(.29,.40,.10),.8)
MATS[leaf]['doubleSided']=True
MATS[leaf2]['doubleSided']=True
glass=mat('Smoked_guard_glass',(.28,.32,.27),.12,0,alpha=.24)
windowglass=mat('Dark_smoked_window_glass',(.16,.19,.20),.12)
MATS[windowglass]['extensions']={'KHR_materials_transmission':{'transmissionFactor':.78},'KHR_materials_ior':{'ior':1.5}}
platformmat=mat('Warm_grey_platform',(.58,.57,.52),.90)
teal=mat('Teal_book',(.045,.24,.25))
paper=mat('Book_pages',(.66,.63,.48))
coral=mat('Terracotta',(.47,.17,.095))
bookyellow=mat('Book_ochre',(.61,.36,.055))
plankm=[mat('Oak_tone_%02d'%i,tuple(np.array([.42,.28,.15])*(.88+i*.028))) for i in range(9)]

def linen_textures():
    # Seamless plain weave: 32 warp/weft threads across an 8 cm tile.
    # Local millimetre-scale relief and thread irregularity, all embedded in GLB.
    N=512;T=32; yy,xx=np.mgrid[:N,:N]/N*T
    ix=np.floor(xx).astype(int);iy=np.floor(yy).astype(int)
    warp=(ix+iy)%2==0
    wr=np.random.default_rng(26)
    slubx=wr.uniform(.88,1.12,T);sluby=wr.uniform(.88,1.12,T)
    # Open, uneven plain weave with visible spaces between warp and weft.
    tx=np.clip(np.sin(np.pi*(xx%1))-.18,0,1)**.50
    ty=np.clip(np.sin(np.pi*(yy%1))-.18,0,1)**.50
    height=np.where(warp,tx*(.70+.30*ty),ty*(.70+.30*tx))
    height*=np.where(warp,slubx[ix%T],sluby[iy%T])
    fine=.5+.5*np.cos(2*np.pi*np.where(warp,xx*3,yy*3))
    height+=.035*fine+.025*np.sin(xx*2*np.pi/T*7)*np.cos(yy*2*np.pi/T*5)
    color=np.clip(.59+.35*height+.025*np.where(warp,slubx[ix%T],sluby[iy%T]),0,1)
    color=np.repeat(color[:,:,None],3,axis=2)
    dx=(np.roll(height,-1,1)-np.roll(height,1,1))*.75
    dy=(np.roll(height,-1,0)-np.roll(height,1,0))*.75
    normal=np.stack([-dx,-dy,np.ones_like(dx)],axis=2);normal/=np.linalg.norm(normal,axis=2,keepdims=True)
    rough=np.clip(.89+.07*(1-height),.8,1)
    mr=np.stack([np.ones_like(rough),rough,np.zeros_like(rough)],axis=2)
    for name,arr in [('linen_basecolor',color),('linen_normal',normal*.5+.5),('linen_roughness',mr)]:
        pixels=np.uint8(np.clip(arr*255,0,255));im=Image.fromarray(pixels);bio=io.BytesIO();im.save(bio,format='PNG')
        TEXTURES.append({'name':name,'bytes':bio.getvalue(),'pixels':pixels})
    for mi in [sofa,pillow,ochre]:
        MATS[mi]['pbrMetallicRoughness']['baseColorTexture']={'index':0}
        MATS[mi]['pbrMetallicRoughness']['metallicRoughnessTexture']={'index':2}
        MATS[mi]['pbrMetallicRoughness']['roughnessFactor']=1
        MATS[mi]['normalTexture']={'index':1,'scale':.55}
        MATS[mi].setdefault('extensions',{})['KHR_materials_sheen']={'sheenColorFactor':[.12,.11,.09],'sheenRoughnessFactor':.8}
linen_textures()
MATS[sofa]['extensions']['KHR_materials_sheen']['sheenColorFactor']=[.12,.11,.09]

# Broad curved colour regions traced from the supplied MVA-style reference.
# There are no cube-face bands, square patches, brand lettering or stars.
BALL_CENTER=np.array([-1.90,.31,.154+.19]);BALL_RADIUS=.19
BALL_PHASE=-math.pi-.96
volleyball=mat('MIKASA_yellow_blue_leather',(1,1,1),.68)
def volleyball_textures():
    W,H=1024,512;vv,uu=np.mgrid[:H,:W]/np.array([H,W])[:,None,None]
    theta=vv*np.pi;phi=uu*2*np.pi+BALL_PHASE
    xyz=np.stack([np.sin(theta)*np.cos(phi),np.sin(theta)*np.sin(phi),np.cos(theta)],axis=2)
    label_theta=.36*np.pi;az=-.96
    forward=np.array([np.sin(label_theta)*np.cos(az),np.sin(label_theta)*np.sin(az),np.cos(label_theta)])
    right=np.array([-np.sin(az),np.cos(az),0]);up=np.cross(forward,right)
    q=xyz@np.array([right,up,forward]).T
    # Orthographic control points from the visible front; hidden hemisphere
    # continues the same large colour regions. This is not a factory UV map.
    patches=[
      [(111,171),(151,128),(208,96),(277,78),(348,80),(417,101),(477,143),(514,198),(522,249),(507,296),(480,323),(456,334),(426,300),(391,269),(350,251),(306,246),(256,247),(212,251),(169,245),(138,230),(121,208)],
      [(78,330),(93,300),(111,287),(132,321),(163,350),(203,367),(247,369),(286,365),(331,372),(377,389),(414,411),(444,434),(424,471),(409,509),(380,558),(321,568),(255,560),(192,535),(138,492),(100,435),(81,378)],
      [(560,377),(549,414),(528,455),(498,492),(467,521),(437,539),(458,503),(482,462),(509,423),(536,395)]
    ]
    px=319+246*q[:,:,0];py=323-246*q[:,:,1]
    yellow=np.zeros((H,W),dtype=bool)
    seam=np.full((H,W),1000.,dtype=np.float32)
    def smooth_closed(points):
        p=np.asarray(points,dtype=float);curve=[]
        for j in range(len(p)):
            a,b,c,d=p[(j-1)%len(p)],p[j],p[(j+1)%len(p)],p[(j+2)%len(p)]
            for t in np.linspace(0,1,5,endpoint=False):
                curve.append(.5*((2*b)+(-a+c)*t+(2*a-5*b+4*c-d)*t*t+(-a+3*b-3*c+d)*t*t*t))
        return curve
    for points in patches:
        points=smooth_closed(points);inside=np.zeros((H,W),dtype=bool)
        for a,b in zip(points,points[1:]+points[:1]):
            cross=(a[1]>py)!=(b[1]>py)
            inside ^= cross & (px<(b[0]-a[0])*(py-a[1])/(b[1]-a[1]+1e-12)+a[0])
            ab=b-a;tt=np.clip(((px-a[0])*ab[0]+(py-a[1])*ab[1])/(np.dot(ab,ab)+1e-9),0,1)
            dist=np.sqrt((px-a[0]-tt*ab[0])**2+(py-a[1]-tt*ab[1])**2)
            seam=np.minimum(seam,dist)
        yellow|=inside
    blue=~yellow
    col=np.where(blue[:,:,None],np.array([15.,43.,142.]),np.array([249.,206.,5.]))
    col*=1-.20*np.exp(-seam[:,:,None]*2.2)
    dx=((uu*84+(np.floor(vv*42)%2)*.5)%1)-.5;dy=(vv*42%1)-.5
    dimple=np.exp(-(dx*dx+dy*dy)*35)
    col*=1-.045*dimple[:,:,None]
    im=Image.fromarray(np.uint8(np.clip(col,0,255)))
    # Fine curved meridional joints form an eight-sector panel construction.
    longitude=np.arctan2(q[:,:,1],q[:,:,0]);latitude=np.arccos(np.clip(q[:,:,2],-1,1))
    sweep=longitude+.56*np.sin(2*latitude)
    joint=np.abs(np.sin(sweep*4))*np.sin(latitude)
    height=1-.20*dimple-.16*np.exp(-seam*2.2)-.11*np.exp(-joint*160)
    nx=-(np.roll(height,-1,1)-np.roll(height,1,1))*.72
    ny=-(np.roll(height,-1,0)-np.roll(height,1,0))*.72
    normal=np.stack([nx,ny,np.ones_like(nx)],axis=2);normal/=np.linalg.norm(normal,axis=2,keepdims=True)
    rough=np.stack([np.ones((H,W)),.64+.13*dimple,np.zeros((H,W))],axis=2)
    start=len(TEXTURES)
    for name,pixels in [('mikasa_basecolor',np.asarray(im)),('mikasa_normal',np.uint8((normal*.5+.5)*255)),('mikasa_roughness',np.uint8(rough*255))]:
        bio=io.BytesIO();Image.fromarray(pixels).save(bio,format='PNG')
        TEXTURES.append({'name':name,'bytes':bio.getvalue(),'pixels':pixels})
    pbr=MATS[volleyball]['pbrMetallicRoughness'];pbr['baseColorTexture']={'index':start};pbr['metallicRoughnessTexture']={'index':start+2};pbr['roughnessFactor']=1
    MATS[volleyball]['normalTexture']={'index':start+1,'scale':.7}
volleyball_textures()

def obj(name, vertices, faces, material, group='Architecture', normals=None, uv=None):
    v=np.array(vertices,dtype=np.float32); f=np.array(faces,dtype=np.uint32)
    if normals is None:
        # Flat surface normals, separate corners for reliable glTF shading.
        tri=v[f]; n=np.cross(tri[:,1]-tri[:,0],tri[:,2]-tri[:,0]); n/=np.maximum(np.linalg.norm(n,axis=1)[:,None],1e-10)
        v=tri.reshape(-1,3); normals=np.repeat(n,3,axis=0); f=np.arange(len(v),dtype=np.uint32).reshape(-1,3)
    record=dict(name=name,v=v,n=np.asarray(normals,dtype=np.float32),f=f,mat=material,group=group)
    if uv is not None:record['uv']=np.asarray(uv,dtype=np.float32)
    OBJECTS.append(record)
    GROUPS.setdefault(group,[]).append(len(OBJECTS)-1)

def box(name, center, size, material, group='Architecture', bevel=0, rot=0, pitch=0):
    c=np.array(center); h=np.array(size)/2
    v=[]; n=[]; f=[];uv=[]
    # Rounded boxes are actual mesh geometry, not renderer-only modifiers.
    b=min(bevel,float(min(h))*.9)
    for axis in range(3):
        a=(axis+1)%3; d=(axis+2)%3
        for sign in [-1,1]:
            aa=sorted(set([-h[a],-h[a]+b,-h[a]+b*.293,h[a]-b,h[a]-b*.293,h[a]])) if b else [-h[a],h[a]]
            dd=sorted(set([-h[d],-h[d]+b,-h[d]+b*.293,h[d]-b,h[d]-b*.293,h[d]])) if b else [-h[d],h[d]]
            start=len(v)
            for u in aa:
                for w in dd:
                    p=np.zeros(3); p[axis]=sign*h[axis]; p[a]=u;p[d]=w
                    if b:
                        q=np.clip(p,-h+b,h-b); norm=p-q; norm/=np.linalg.norm(norm); p=q+b*norm
                    else: norm=np.zeros(3);norm[axis]=sign
                    uv.append([p[a]/.08,p[d]/.08])
                    if pitch:
                        cs=math.cos(pitch);sn=math.sin(pitch)
                        p[1:]=[cs*p[1]-sn*p[2],sn*p[1]+cs*p[2]]
                        norm[1:]=[cs*norm[1]-sn*norm[2],sn*norm[1]+cs*norm[2]]
                    if rot:
                        cs=math.cos(rot);sn=math.sin(rot)
                        p[:2]=[cs*p[0]-sn*p[1],sn*p[0]+cs*p[1]]
                        norm[:2]=[cs*norm[0]-sn*norm[1],sn*norm[0]+cs*norm[1]]
                    v.append(c+p); n.append(norm)
            for i in range(len(aa)-1):
                for j in range(len(dd)-1):
                    k=start+i*len(dd)+j; ids=[k,k+len(dd),k+len(dd)+1,k+1]
                    if sign<0: ids=ids[::-1]
                    f.extend([[ids[0],ids[1],ids[2]],[ids[0],ids[2],ids[3]]])
    obj(name,v,f,material,group,n,uv if material in [sofa,pillow,ochre] else None)

def sphere(name,c,scale,material,group='Furniture',seg=16,rings=10,textured=False,phase=0):
    v=[];n=[];f=[];uv=[];scale=np.array(scale)
    for j in range(rings+1):
        t=math.pi*j/rings
        for i in range(seg+1):
            p=2*math.pi*i/seg+phase; q=np.array([math.sin(t)*math.cos(p),math.sin(t)*math.sin(p),math.cos(t)])
            v.append(np.array(c)+q*scale); nn=q/scale;n.append(nn/np.linalg.norm(nn))
            uv.append([i/seg,j/rings])
    for j in range(rings):
        for i in range(seg):
            k=j*(seg+1)+i
            f.extend([[k,k+1,k+seg+2],[k,k+seg+2,k+seg+1]])
    # Parametric order above points inward; reverse all triangles.
    obj(name,v,[x[::-1] for x in f],material,group,n,uv if textured else None)

def rod(name,a,b,r,material,group='Furniture',r2=None,seg=12):
    a=np.array(a);b=np.array(b);w=b-a;w=w/np.linalg.norm(w)
    u=np.cross(w,[0,0,1] if abs(w[2])<.95 else [0,1,0]);u/=np.linalg.norm(u);v=np.cross(w,u)
    verts=[];faces=[]
    for c,rr in [(a,r),(b,r if r2 is None else r2)]:
        for i in range(seg):
            t=2*math.pi*i/seg;verts.append(c+rr*(u*math.cos(t)+v*math.sin(t)))
    verts.extend([a,b])
    for i in range(seg):
        j=(i+1)%seg
        faces.extend([[i,j,seg+j],[i,seg+j,seg+i],[2*seg,j,i],[2*seg+1,seg+i,seg+j]])
    obj(name,verts,faces,material,group)

def triangulate(poly):
    p=np.array(poly); ids=list(range(len(p)));out=[]
    cross=lambda a,b: a[0]*b[1]-a[1]*b[0]
    area=sum(cross(p[i],p[(i+1)%len(p)]) for i in range(len(p)))
    if area<0: ids.reverse()
    while len(ids)>3:
        found=False
        for k in range(len(ids)):
            a,b,c=ids[k-1],ids[k],ids[(k+1)%len(ids)]
            if cross(p[b]-p[a],p[c]-p[b])<=1e-9: continue
            inside=False
            for d in ids:
                if d in (a,b,c): continue
                if min(cross(p[b]-p[a],p[d]-p[a]),cross(p[c]-p[b],p[d]-p[b]),cross(p[a]-p[c],p[d]-p[c]))>=-1e-9:inside=True;break
            if inside:continue
            out.append([a,b,c]);ids.pop(k);found=True;break
        if not found:raise ValueError('Polygon cannot be triangulated')
    out.append(ids);return out

def slab(name,poly,z,thick,material,group='Architecture'):
    N=len(poly);verts=[(x,y,z-thick) for x,y in poly]+[(x,y,z) for x,y in poly];faces=[]
    for a,b,c in triangulate(poly):faces.extend([[c,b,a],[a+N,b+N,c+N]])
    for i in range(N):
        j=(i+1)%N;faces.extend([[i,j,j+N],[i,j+N,i+N]])
    obj(name,verts,faces,material,group)

def add_light(group,name,pos,color,intensity,range_=5):
    LIGHTS.append(dict(group=group,name=name,pos=list(pos),color=list(color),intensity=intensity,range=range_))

def rounded_footprint():
    p=[(-3.96,-3.6),(3.25,-3.6)]
    p += [(3.25+.75*math.cos(t),-2.85+.75*math.sin(t)) for t in np.linspace(-math.pi/2,0,13)[1:]]
    return p+[(4,3.45),(-3.96,3.45)]

FLOOR=.14; DECK=3.22; BASE_BOTTOM=-.16; PLATFORM=.52
foot=rounded_footprint()
slab('Ground_rounded_plinth',foot,FLOOR,.30,edge)
# A floor made of thin plank strips, consolidated to one mesh per material below.
def inside_floor(x,y):
    return not (x>3.25 and y<-2.85 and (x-3.25)**2+(y+2.85)**2>.75**2)
for i,x in enumerate(np.arange(-3.95,4,.18)):
    for j,y in enumerate(np.arange(-3.6-(i%3)*.47,3.5,1.42)):
        lo=max(y,-3.59);hi=min(y+1.412,3.44)
        if hi<=lo:continue
        # Clip front ends to rounded perimeter.
        xr=min(x+.172,3.99)
        if xr>3.25:lo=max(lo,-2.85-math.sqrt(max(0,.75**2-(xr-3.25)**2)))
        if hi>lo:box('Ground_plank_%d_%d'%(i,j),((x+xr)/2,(lo+hi)/2,FLOOR+.007),(xr-x,hi-lo,.014),plankm[int(rng.integers(9))],'Floorboards')

# Cutaway walls: left wall and rear wall with a tall two-storey window.
box('Left_wall',(-4.04,.005,2.245),(.16,7.21,4.81),wall)
box('Rear_wall_left',(-2.98,3.53,2.245),(1.96,.16,4.81),wall)
box('Rear_wall_right',(2.17,3.53,2.245),(3.66,.16,4.81),wall)
box('Window_sill_wall',(-.83,3.53,.26),(2.34,.16,.84),wall)
for x in [-2.0,-.83,.34]:box('Window_mullion_'+str(x),(x,3.50,2.665),(.075,.16,3.97),oak)
box('Window_sill',(-.83,3.43,.72),(2.45,.32,.10),oak)
box('Window_transom',(-.83,3.50,DECK),(2.36,.17,.10),oak)
for name,x in [('Left',-1.415),('Right',-.245)]:
    box('Window_Glass_'+name,(x,3.505,2.705),(1.090,.012,3.86),windowglass,'Windows')
# Full-width platform fills the back corner, including the space below stairs.
# The lower course fills the SAME footprint. An inset cut in the upper course
# exposes its top as a tread; no independent step projects into the room.
rear_footprint=[(-3.96,1.35),(4,1.35),(4,3.45),(-3.96,3.45)]
notched_platform=[(-3.96,1.35),(-1.71,1.35),(-1.71,1.75),(-.29,1.75),(-.29,1.35),(4,1.35),(4,3.45),(-3.96,3.45)]
slab('Rear_platform_lower_course',rear_footprint,.33,.33-FLOOR,platformmat,'Rear_platform')
slab('Rear_raised_platform',notched_platform,PLATFORM,PLATFORM-.33,platformmat,'Rear_platform')

# L deck with a concave quarter-circle opening and a rectangular stairwell notch.
arc=[(.72+1.75*math.cos(t),-.75+1.75*math.sin(t)) for t in np.linspace(math.pi/2,math.pi,25)]
deckpoly=[(-3.95,-2.05),(-1.03,-2.05),(-1.03,-.75)]+list(reversed(arc))[1:]+[(4,1.0),(4,3.44),(-3.95,3.44),(-3.95,2.87),(-2.54,2.87),(-2.54,-.92),(-3.95,-.92)]
slab('Mezzanine_curved_deck',deckpoly,DECK,.19,oak)
# Surface boards clipped by a simple polygon against each narrow strip.
def clip(poly,axis,value,greater):
    out=[]
    for a,b in zip(poly,poly[1:]+poly[:1]):
        ia=(a[axis]>=value) if greater else (a[axis]<=value);ib=(b[axis]>=value) if greater else (b[axis]<=value)
        if ia:out.append(a)
        if ia!=ib:
            t=(value-a[axis])/(b[axis]-a[axis]);out.append(tuple(a[k]+t*(b[k]-a[k]) for k in range(2)))
    return out
# Clip each already-triangulated deck face to planks (handles concavity safely).
dt=triangulate(deckpoly)
for i,x in enumerate(np.arange(-3.95,4,.18)):
    for j,y in enumerate(np.arange(-2.1-(i%3)*.47,3.46,1.42)):
        pts=[];faces=[]
        for tri in dt:
            pp=[deckpoly[k] for k in tri]
            for ax,val,gt in [(0,x,True),(0,x+.172,False),(1,y,True),(1,y+1.412,False)]:
                if pp:pp=clip(pp,ax,val,gt)
            if len(pp)>=3:
                s=len(pts);pts.extend([(a,b,DECK+.008) for a,b in pp]);faces.extend([[s,s+k,s+k+1] for k in range(1,len(pp)-1)])
        if faces:obj('Deck_plank_%d_%d'%(i,j),pts,faces,plankm[int(rng.integers(9))],'Floorboards')

# Three lower treads running left to a landing; ten upper treads running rearward.
rise=(DECK-FLOOR)/15
for i in range(4):
    x=-1.54-i*.36;top=FLOOR+(i+1)*rise
    box('Stair_lower_%02d'%i,(x,-1.38,(FLOOR+top)/2),(.365,1.0,top-FLOOR),oak,'Staircase')
box('Stair_turn_landing',(-3.35,-1.38,FLOOR+rise*2),(1.24,1.0,rise*4),oak,'Staircase')
for i in range(11):
    y=-.72+i*.326;top=FLOOR+(i+5)*rise
    box('Stair_upper_%02d'%i,(-3.26,y,top-rise/2),(1.27,.330,rise),oak,'Staircase')
# Diagonal supporting ramp leaves the space below the upper flight open.
rv=[]
for x in [-3.895,-2.625]:
    rv.extend([(x,-.885,.70),(x,2.705,2.96),(x,2.705,3.22),(x,-.885,.961)])
obj('Stair_diagonal_support',rv,[[0,2,1],[0,3,2],[4,5,6],[4,6,7],[0,1,5],[0,5,4],[1,2,6],[1,6,5],[2,3,7],[2,7,6],[3,0,4],[3,4,7]],oak,'Staircase')
box('Stair_top_landing',(-3.26,2.79,DECK-.10),(1.27,.17,.20),oak,'Staircase')
# Glass guards, slim posts on inner stair edge; leave access at upper landing.
for y in [-.9,2.76]:rod('Upper_guard_post_'+str(y),(-2.48,y,DECK),(-2.48,y,DECK+.82),.023,black,'Staircase')
box('Upper_guard_glass',(-2.48,.93,DECK+.40),(.025,3.64,.76),glass,'Staircase')
rod('Upper_guard_rail',(-2.48,-.90,DECK+.82),(-2.48,2.76,DECK+.82),.022,walnut,'Staircase')
# Glass alongside lower flight, viewed through the cutaway.
obj('Sloping_guard_glass',[(-2.55,-.82,FLOOR+.90),(-2.55,2.62,DECK-.04),(-2.55,2.62,DECK+.75),(-2.55,-.82,FLOOR+1.69)],[[0,1,2],[0,2,3]],glass,'Staircase')

# Sofa faces toward front (-Y), chaise on viewer's left.
sg='Sofa'
for x in [.30,2.94]:
    for y in [-.15,1.01]:rod('Sofa_foot',(x,y,FLOOR),(x,y,FLOOR+.16),.055,walnut,sg)
box('Sofa_base',(1.65,.42,.40),(3.30,1.40,.38),sofa,sg,.12)
box('Sofa_back',(1.65,1.00,.94),(3.30,.32,.95),sofa,sg,.13)
for i in range(3):
    x=.57+i*1.02
    box('Sofa_seat_%02d'%i,(x,.30,.68),(.99,1.05,.28),sofa,sg,.10)
    box('Sofa_back_cushion_%02d'%i,(x,.82,1.04),(.99,.30,.66),sofa,sg,.11)
box('Sofa_right_arm',(3.21,.35,.72),(.25,1.37,.63),sofa,sg,.10)
box('Chaise_base',(.57,-.74,.42),(1.12,1.18,.38),sofa,sg,.12)
box('Chaise_cushion',(.57,-.76,.68),(1.12,1.18,.28),sofa,sg,.12)
box('Mustard_pillow',(.74,.49,1.055),(.50,.20,.50),ochre,sg,.080,rot=-.08,pitch=-.10)
box('Ivory_pillow',(.38,.15,.907),(.42,.35,.18),pillow,sg,.075,rot=.10)

def table(name,x,y,z,w,d,h,material=walnut,group='Furniture'):
    box(name+'_top',(x,y,z+h),(w,d,.075),material,group,.025)
    for xx in [-w/2+.055,w/2-.055]:
        for yy in [-d/2+.055,d/2-.055]:
            box(name+'_leg',(x+xx,y+yy,z+h/2),(.035,.035,h),black,group)
    for yy in [-d/2+.055,d/2-.055]:box(name+'_lower_rail',(x,y+yy,z+.07),(w-.07,.027,.027),black,group)

table('Coffee_table',1.80,-1.65,FLOOR,1.43,.80,.48,walnut)
box('Coffee_book',(1.79,-1.56,.70),(.25,.30,.042),teal,'Decor',.009,rot=.14)
box('Remote',(1.29,-1.73,.68),(.105,.27,.025),black,'Decor',.009,rot=-.23)
for k in range(3):sphere('Remote_button',(1.28,-1.80+k*.055,.697),(.015,.015,.006),ceramic,'Decor',8,4)

# Television screen oriented toward sofa: main view sees the dark rear as reference.
box('TV_console',(1.12,-2.89,.38),(1.86,.39,.36),walnut,'TV',.045)
for x in [.34,1.9]:rod('TV_console_foot',(x,-2.89,FLOOR),(x,-2.89,.25),.026,black,'TV')
box('TV_frame',(1.12,-2.90,1.16),(2.04,.105,1.17),black,'TV',.024)
box('TV_screen',(1.12,-2.837,1.16),(1.95,.012,1.08),screen,'TV',.008)
for x in [.68,1.56]:rod('TV_stand',(x,-2.9,.61),(x,-2.9,.77),.035,black,'TV')

# Low open bookshelf beside stair foot.
bg='Bookshelf';bx=-3.03;by=-2.58
box('Bookshelf_back',(bx,by+.22,.78),(1.55,.045,1.26),walnut,bg)
for x in [bx-.78,bx+.78]:box('Bookshelf_side',(x,by,.78),(.075,.51,1.29),walnut,bg)
for z in [.18,.59,1.00,1.42]:box('Bookshelf_shelf',(bx,by,z),(1.60,.54,.065),walnut,bg)
for x in [bx-.27,bx+.27]:box('Bookshelf_divider',(x,by,.80),(.045,.46,1.17),walnut,bg)
for row in range(3):
    for col in range(3):
        for k in range(4):
            h=float(rng.uniform(.19,.32));x=bx-.65+col*.52+k*.09
            box('Book_%d_%d_%d'%(row,col,k),(x,by-.065,.23+row*.41+h/2),(.06,.25,h),[teal,bookyellow,coral,leaf,ceramic][int(rng.integers(5))],bg,.004)

# One continuous open zigzag: four boards, alternating wood ends, no backs.
# Lower feet stand on the raised platform; the upper board meets the deck soffit.
sh='Staggered_shelf'
sx=2.27;sy=2.24;sw=1.92;sd=.67;bt=.075
levels=[1.05,1.71,2.37,DECK-.19-bt/2]
for j,z in enumerate(levels):box('Shelf_board_%02d'%j,(sx,sy,z),(sw,sd,bt),oak,sh)
for j in range(3):
    lo=levels[j]+bt/2;hi=levels[j+1]-bt/2;left=j%2==0
    end=sx+(-sw/2+bt/2 if left else sw/2-bt/2)
    box('Shelf_alternating_end_%02d'%j,(end,sy,(lo+hi)/2),(bt,sd,hi-lo),oak,sh)
    other=sx+(sw/2-.10 if left else -sw/2+.10)
    for k,yy in enumerate([sy-sd/2+.055,sy+sd/2-.055]):
        box('Shelf_open_post_%02d_%d'%(j,k),(other,yy,(lo+hi)/2),(.029,.029,hi-lo),black,sh)
for j,x in enumerate([sx-.45,sx+.79]):
    for k,y in enumerate([sy-sd/2+.055,sy+sd/2-.055]):
        box('Shelf_platform_foot_%d_%d'%(j,k),(x,y,(PLATFORM+levels[0]-bt/2)/2),(.036,.036,levels[0]-bt/2-PLATFORM),black,sh)

# Upstairs bench and nesting tables.
table('Upstairs_bench',-3.08,-1.65,DECK,1.30,.53,.40,walnut,'Upstairs_furniture')
box('Upstairs_bench_lower',(-3.08,-1.65,DECK+.16),(1.16,.45,.045),walnut,'Upstairs_furniture')
table('Upstairs_table',2.17,2.66,DECK,.85,.77,.77,walnut,'Upstairs_furniture')
table('Upstairs_side_table',3.10,2.68,DECK,.58,.57,.50,walnut,'Upstairs_furniture')

def plant(name,x,y,z,size=1,tall=False):
    g='Plants';r=.22*size;h=.39*size
    if tall:
        h=.47*size
        vv=[(x+dx*rr,y+dy*rr,zz) for rr,zz in [(r*.74,z),(r,z+h)] for dx,dy in [(-1,-1),(1,-1),(1,1),(-1,1)]]
        obj(name+'_pot',vv,[[0,2,1],[0,3,2],[0,1,5],[0,5,4],[1,2,6],[1,6,5],[2,3,7],[2,7,6],[3,0,4],[3,4,7]],ceramic,g)
        box(name+'_soil',(x,y,z+h-.02),(r*1.85,r*1.85,.02),soil,g)
    else:
        rod(name+'_pot',(x,y,z),(x,y,z+h),r*.72,ceramic,g,r2=r,seg=12)
        rod(name+'_soil',(x,y,z+h-.025),(x,y,z+h-.017),r*.89,soil,g,seg=12)
    for i in range(9 if tall else 12):
        a=i*2.399;rr=(.08 if tall else .16)*size
        start=np.array([x+rr*math.cos(a),y+rr*math.sin(a),z+h])
        height=float(rng.uniform(.62,1.13) if tall else rng.uniform(.13,.31))*size
        end=start+np.array([math.cos(a)*(.12 if tall else .19)*size,math.sin(a)*(.12 if tall else .19)*size,height])
        mid=(start+end)/2
        side=np.array([-math.sin(a),math.cos(a),0])*(.045 if tall else .105)*size
        verts=[start,mid+side,end,mid-side,mid+np.array([0,0,.045*size])]
        obj(name+'_leaf_%02d'%i,verts,[[0,1,4],[1,2,4],[2,3,4],[3,0,4]],leaf if i%2 else leaf2,g)

plant('Floor_succulent',-1.86,-2.42,FLOOR,.95)
plant('Tall_sansevieria',3.64,1.96,PLATFORM,.97,True)
plant('Coffee_succulent',2.21,-1.63,.67,.28)
sphere('MIKASA_Volleyball',BALL_CENTER,[BALL_RADIUS]*3,volleyball,'Volleyball',64,32,True,BALL_PHASE)

# Each independently switchable lamp owns unique emissive materials and light nodes.
for i,(x,y,z) in enumerate([(-.12,.00,2.29),(.52,.53,2.72),(1.12,-.15,2.10)],1):
    g='Lamp_Pendant_%02d'%i;e=mat(g+'_emission',(.80,.70,.48),.45,emission=(1,.83,.56),strength=1.25)
    rod(g+'_cable',(x,y,z+.22),(x,y,4.62),.014,black,g,seg=8)
    rod(g+'_cap',(x,y,z+.12),(x,y,z+.24),.13,black,g,r2=.09,seg=16)
    sphere(g+'_globe',(x,y,z),(.235,.235,.235),e,g,24,14)
    add_light(g,g+'_light',(x,y,z-.25),(1,.83,.56),14,4.5)

g='Lamp_Table_Cylinder';e=mat(g+'_emission',(.85,.38,.12),.4,emission=(1,.38,.10),strength=1.1)
x,y,z=-3.15,-1.65,DECK+.45
rod(g+'_base',(x,y,z),(x,y,z+.10),.115,black,g)
rod(g+'_diffuser',(x,y,z+.10),(x,y,z+.37),.10,e,g,seg=20)
rod(g+'_cap',(x,y,z+.37),(x,y,z+.405),.105,black,g)
add_light(g,g+'_light',(x,y,z+.26),(1,.38,.10),7,3)
g='Lamp_Table_Orb';e=mat(g+'_emission',(1,.7,.48),.32,emission=(1,.39,.20),strength=3)
x,y,z=3.10,2.68,DECK+.55
rod(g+'_base',(x,y,z),(x,y,z+.085),.13,black,g)
sphere(g+'_globe',(x,y,z+.23),(.17,.17,.18),e,g,20,12)
add_light(g,g+'_light',(x,y,z+.27),(1,.43,.24),14,3)
g='Lamp_Shelf';e=mat(g+'_emission',(.94,1,.86),.3,emission=(.82,1,.70),strength=3)
lamp_shelf_z=levels[1]+bt/2+.215
box(g+'_body',(2.50,2.18,lamp_shelf_z),(.16,.16,.43),black,g,.025)
box(g+'_diffuser',(2.50,2.091,lamp_shelf_z),(.095,.014,.35),e,g,.012)
add_light(g,g+'_light',(2.50,2.00,lamp_shelf_z),(.85,1,.75),12,2.5)
g='Lamp_Stair_LED';e=mat(g+'_emission',(1,.88,.64),.4,emission=(1,.78,.44),strength=3)
for i in range(11):
    y=-.72+i*.326;z=FLOOR+(i+5)*rise+.015
    box('Stair_LED_tread_%02d'%i,(-3.85,y,z),(.018,.31,.014),e,g)
for i in range(4):
    x=-1.54-i*.36;z=FLOOR+(i+1)*rise+.014
    box('Stair_LED_lower_%02d'%i,(x,-.895,z),(.35,.014,.014),e,g)
for i in [1,5,9]:add_light(g,'Stair_LED_light_%02d'%i,(-3.80,-.72+i*.326,FLOOR+(i+5)*rise+.12),(1,.79,.49),2,1.1)

# Shelf long axis must run front-to-back, PERPENDICULAR to the sofa's X axis.
# Transform its complete assembly, including feet and lamp, as one rigid unit.
shelf_pivot=np.array([sx,sy]);shelf_destination=np.array([3.0,2.35])
for o in OBJECTS:
    if o['group'] in ['Staggered_shelf','Lamp_Shelf']:
        xy=o['v'][:,:2]-shelf_pivot
        o['v'][:,:2]=np.column_stack([-xy[:,1],xy[:,0]])+shelf_destination
        nn=o['n'][:,:2].copy();o['n'][:,:2]=np.column_stack([-nn[:,1],nn[:,0]])
for light in LIGHTS:
    if light['group']=='Lamp_Shelf':
        dx,dy=np.array(light['pos'][:2])-shelf_pivot
        light['pos'][:2]=[float(shelf_destination[0]-dy),float(shelf_destination[1]+dx)]

# Merge static floorboards by material, preserving independently controlled lamps.
for material in plankm:
    parts=[o for o in OBJECTS if o['group']=='Floorboards' and o['mat']==material]
    if not parts:continue
    vv=[];nn=[];ff=[];off=0
    for o in parts:vv.append(o['v']);nn.append(o['n']);ff.append(o['f']+off);off+=len(o['v'])
    OBJECTS[:]=[o for o in OBJECTS if not(o['group']=='Floorboards' and o['mat']==material)]
    OBJECTS.append(dict(name=MATS[material]['name']+'_boards',v=np.concatenate(vv),n=np.concatenate(nn),f=np.concatenate(ff),mat=material,group='Floorboards'))

def optimize_for_export():
    """Merge per semantic group and PBR state, retaining one primitive per mesh.
    Colours become linear vertex colours; glass and emissive ownership stay separate.
    Per-source index ranges retain traceability without retaining draw calls.
    """
    exportmats=[];matkeys={};batches={};input_vertices=sum(len(o['v']) for o in OBJECTS)
    sourceids={id(o):i for i,o in enumerate(OBJECTS)}
    for o in OBJECTS:
        original=MATS[o['mat']];material=copy.deepcopy(original)
        transmission=material.get('extensions',{}).get('KHR_materials_transmission',{}).get('transmissionFactor',0)
        transparent=material.get('alphaMode','OPAQUE')!='OPAQUE' or transmission>0
        emissive='emissiveFactor' in material
        palette=not transparent and not emissive
        color=material['pbrMetallicRoughness']['baseColorFactor'][:3]
        if palette:material['pbrMetallicRoughness']['baseColorFactor']=[1,1,1,1]
        keydef=copy.deepcopy(material);keydef.pop('name',None)
        key=json.dumps(keydef,sort_keys=True,separators=(',',':'))
        if emissive:key+='|owner='+o['group']
        if key not in matkeys:
            matkeys[key]=len(exportmats)
            if palette:material['name']='Palette_PBR_%02d'%len(exportmats)
            exportmats.append(material)
        mi=matkeys[key]
        key=(o['group'],mi,transparent and o['name'], 'uv' in o,palette)
        batches.setdefault(key,[]).append(o)
    output=[]
    for (group,mi,separate,hasuv,palette),parts in batches.items():
        vs=[];ns=[];uvs=[];cs=[];fs=[];sourceparts=[];voff=0;ioff=0
        for o in parts:
            count=len(o['v']);indexcount=o['f'].size
            vs.append(o['v']);ns.append(o['n']);fs.append(o['f']+voff)
            if hasuv:uvs.append(o['uv'])
            if palette:cs.append(np.tile(MATS[o['mat']]['pbrMetallicRoughness']['baseColorFactor'][:3],(count,1)))
            sourceparts.append({'name':o['name'],'sourceIndex':sourceids[id(o)],'indexOffset':ioff,'indexCount':indexcount,'sourceMaterial':o['mat']})
            voff+=count;ioff+=indexcount
        v=np.concatenate(vs);n=np.concatenate(ns);f=np.concatenate(fs)
        columns=[v,n]
        if hasuv:columns.append(np.concatenate(uvs))
        if palette:columns.append(np.concatenate(cs))
        packed=np.ascontiguousarray(np.concatenate(columns,axis=1),dtype=np.float32)
        unique,remap=np.unique(packed,axis=0,return_inverse=True)
        name=parts[0]['name'] if len(parts)==1 else '%s_Merged_%02d'%(group,len(output))
        rec={'name':name,'group':group,'mat':mi,'v':unique[:,:3],'n':unique[:,3:6],
             'f':remap[f].astype(np.uint32),'parts':sourceparts}
        cursor=6
        if hasuv:rec['uv']=unique[:,cursor:cursor+2];cursor+=2
        if palette:rec['color']=unique[:,cursor:cursor+3]
        output.append(rec)
    report={'version':'0.5.1','baseline_v04_meshes':239,'baseline_v04_materials':36,
            'revision_unmerged_meshes':len(OBJECTS),'optimized_meshes':len(output),
            'unmerged_materials':len(MATS),'optimized_materials':len(exportmats),
            'unmerged_vertices':input_vertices,'optimized_vertices':sum(len(o['v']) for o in output),
            'triangles_before':sum(len(o['f']) for o in OBJECTS),'triangles_after':sum(len(o['f']) for o in output),
            'main_pass_primitives_before':len(OBJECTS),'main_pass_primitives_after':len(output),
            'scope':'Asset primitive counts, not a measured browser frame draw-call or FPS count',
            'preserved_groups':sorted(set(o['group'] for o in OBJECTS)),
            'glass_meshes_separate':True,'emissive_materials_separate_per_lamp':True,
            'strategy':'Per-group/PBR merge, vertex colour palette, material dedup, exact attribute vertex dedup, 16-bit indices when possible'}
    return output,exportmats,report

def export_glb(path):
    objects,materials,report=optimize_for_export()
    doc={'asset':{'version':'2.0','generator':'Jacky Loft revision 0.5.1 / optimized reference reconstruction'},'scene':0,'scenes':[{'name':'Jacky_Loft_v1','nodes':[0]}],
         'nodes':[{'name':'Jacky_Loft_v1','children':[],'extras':{'version':'0.5.1','units':'meters','source':'Reconstructed from user reference screenshots; estimated proportions','upAxis':'Y'}}],
         'meshes':[],'materials':materials,'accessors':[],'bufferViews':[],
         'extensionsUsed':['KHR_lights_punctual','KHR_materials_emissive_strength','KHR_materials_transmission','KHR_materials_ior','KHR_materials_sheen'],
         'extensions':{'KHR_lights_punctual':{'lights':[]}}}
    binary=bytearray();groupids={}
    def access(arr,typ,ctype):
        nonlocal binary
        binary+=b'\0'*((-len(binary))%4);offset=len(binary);binary+=arr.tobytes()
        vi=len(doc['bufferViews']);doc['bufferViews'].append({'buffer':0,'byteOffset':offset,'byteLength':arr.nbytes})
        ac={'bufferView':vi,'componentType':ctype,'count':len(arr),'type':typ}
        if typ=='VEC3':ac.update(min=arr.min(axis=0).tolist(),max=arr.max(axis=0).tolist())
        ai=len(doc['accessors']);doc['accessors'].append(ac);return ai
    def group(name):
        if name not in groupids:
            node={'name':name,'children':[]}
            if name.startswith('Lamp_'):node['extras']={'controllable':True,'defaultOn':True,'lightGroup':name}
            idx=len(doc['nodes']);doc['nodes'].append(node);doc['nodes'][0]['children'].append(idx);groupids[name]=idx
        return groupids[name]
    conv=lambda v:np.ascontiguousarray(v[:,[0,2,1]]*np.array([1,1,-1],dtype=np.float32),dtype='<f4')
    for o in objects:
        p=access(conv(o['v']),'VEC3',5126);n=access(conv(o['n']),'VEC3',5126)
        short=len(o['v'])<65536
        ix=access(np.asarray(o['f'].reshape(-1),dtype='<u2' if short else '<u4'),'SCALAR',5123 if short else 5125)
        attrs={'POSITION':p,'NORMAL':n}
        if 'uv' in o:attrs['TEXCOORD_0']=access(np.ascontiguousarray(o['uv'],dtype='<f4'),'VEC2',5126)
        if 'color' in o:attrs['COLOR_0']=access(np.ascontiguousarray(o['color'],dtype='<f4'),'VEC3',5126)
        mi=len(doc['meshes']);doc['meshes'].append({'name':o['name'],'extras':{'sourceParts':o['parts']},'primitives':[{'attributes':attrs,'indices':ix,'material':o['mat']}]})
        gi=group(o['group']);ni=len(doc['nodes']);doc['nodes'].append({'name':o['name'],'mesh':mi});doc['nodes'][gi]['children'].append(ni)
    # Stable non-rendering anchors for future HTML/raycast interaction adapters.
    for name,pos in [('Bookshelf',(-3.03,-2.58,1.67)),('TV',(1.12,-2.90,1.90))]:
        x,y,z=pos;ni=len(doc['nodes']);doc['nodes'].append({'name':'Hotspot_'+name,'translation':[x,z,-y],'extras':{'target':name,'type':'hotspot'}})
        doc['nodes'][group(name)]['children'].append(ni)
    for l in LIGHTS:
        li=len(doc['extensions']['KHR_lights_punctual']['lights'])
        doc['extensions']['KHR_lights_punctual']['lights'].append({'name':l['name'],'type':'point','color':l['color'],'intensity':l['intensity'],'range':l['range']})
        gi=group(l['group']);x,y,z=l['pos'];ni=len(doc['nodes']);doc['nodes'].append({'name':l['name'],'translation':[x,z,-y],'extensions':{'KHR_lights_punctual':{'light':li}}});doc['nodes'][gi]['children'].append(ni)
    doc['images']=[];doc['textures']=[]
    doc['samplers']=[{'magFilter':9729,'minFilter':9987,'wrapS':10497,'wrapT':10497}]
    for tex in TEXTURES:
        binary+=b'\0'*((-len(binary))%4);offset=len(binary);binary+=tex['bytes']
        vi=len(doc['bufferViews']);doc['bufferViews'].append({'buffer':0,'byteOffset':offset,'byteLength':len(tex['bytes'])})
        ti=len(doc['images']);doc['images'].append({'name':tex['name'],'bufferView':vi,'mimeType':'image/png'})
        doc['textures'].append({'name':tex['name'],'source':ti,'sampler':0})
    doc['buffers']=[{'byteLength':len(binary)}]
    js=json.dumps(doc,separators=(',',':')).encode();js+=b' '*((-len(js))%4);binary+=b'\0'*((-len(binary))%4)
    data=struct.pack('<4sII',b'glTF',2,12+8+len(js)+8+len(binary))+struct.pack('<I4s',len(js),b'JSON')+js+struct.pack('<I4s',len(binary),b'BIN\0')+binary
    path.write_bytes(data)
    report['bytes']=len(data)
    (OUT/'optimization_report.json').write_text(json.dumps(report,indent=2))
    return doc

if __name__=='__main__':
    for tex in TEXTURES:(OUT/(tex['name']+'.png')).write_bytes(tex['bytes'])
    d=export_glb(OUT/'jacky_loft_v1.glb')
    stats={'version':'0.5.1','mesh_objects':len(d['meshes']),'primitives':sum(len(mm['primitives']) for mm in d['meshes']),'triangles':sum(len(o['f']) for o in OBJECTS),'materials':len(d['materials']),'light_groups':sorted({l['group'] for l in LIGHTS}),'point_lights':len(LIGHTS),'bytes':(OUT/'jacky_loft_v1.glb').stat().st_size}
    (OUT/'model_stats.json').write_text(json.dumps(stats,indent=2))
    print(json.dumps(stats,indent=2))

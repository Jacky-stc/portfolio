"""Offline orthographic preview of the exact generated mesh. No AI imagery.
Preview lighting is illustrative, not a claim of matching Three.js rendering.
"""
import sys, math
from pathlib import Path
import numpy as np
from PIL import Image
from scipy.ndimage import gaussian_filter, maximum_filter, map_coordinates
import build_model as m

def basis(eye,target):
    f=np.array(eye,dtype=float)-target;f/=np.linalg.norm(f)
    r=np.cross([0,0,1],f);r/=np.linalg.norm(r);u=np.cross(f,r)
    return np.array([r,u,f])

def project(v,B,size,scale,center):
    q=(v-center)@B.T
    q[:,0]=q[:,0]*scale+size/2;q[:,1]=size/2-q[:,1]*scale
    return q

def raster(q,tri,zbuf,channels=None,values=None):
    H,W=zbuf.shape
    for ids in tri:
        t=q[ids];x=t[:,0];y=t[:,1]
        x0=max(0,int(np.floor(min(x))));x1=min(W-1,int(np.ceil(max(x))))
        y0=max(0,int(np.floor(min(y))));y1=min(H-1,int(np.ceil(max(y))))
        if x1<x0 or y1<y0:continue
        den=(y[1]-y[2])*(x[0]-x[2])+(x[2]-x[1])*(y[0]-y[2])
        if abs(den)<1e-8:continue
        xx,yy=np.meshgrid(np.arange(x0,x1+1)+.5,np.arange(y0,y1+1)+.5)
        a=((y[1]-y[2])*(xx-x[2])+(x[2]-x[1])*(yy-y[2]))/den
        b=((y[2]-y[0])*(xx-x[2])+(x[0]-x[2])*(yy-y[2]))/den;c=1-a-b
        z=a*t[0,2]+b*t[1,2]+c*t[2,2]
        view=zbuf[y0:y1+1,x0:x1+1];ok=(a>=-1e-6)&(b>=-1e-6)&(c>=-1e-6)&(z>view)
        if not ok.any():continue
        view[ok]=z[ok]
        if channels is not None:
            vals=values[ids]
            vv=a[ok,None]*vals[0]+b[ok,None]*vals[1]+c[ok,None]*vals[2]
            channels[y0:y1+1,x0:x1+1][ok]=vv

def render(mode='day',view='hero'):
    S=1050
    camera={'hero':([10,-14,11],[0,0,1.95],S/11.9),'top':([.2,-9,20],[0,0,1.7],S/10.8),'front':([1,-17,7],[0,0,2.15],S/10.4),
            'shelf':([10,-4,4.8],[3.0,2.20,1.67],S/3.8),
            'platform':([-.9,-8,2.6],[-1,1.55,.55],S/3.4),
            'volleyball':([-.20,-2.30,1.65],m.BALL_CENTER,S/.80),
            'window':([-.83,16,6.5],[-.83,3.5,2.65],S/5.2),
            'seam':([-10,-12,3.8],[-3.55,-2.8,.20],S/2.8),
            'linen':([4.8,-1.6,3.5],[.84,.35,.91],S/2.7)}
    eye,target,scale=camera[view];center=np.array(target);B=basis(eye,center)
    zb=np.full((S,S),-1e6,dtype=np.float32);gb=np.zeros((S,S,15),dtype=np.float32)
    # render-only presentation surface, excluded from the exported GLB
    ground={'v':np.array([[-100,-100,-.18],[100,-100,-.18],[100,100,-.18],[-100,100,-.18]],dtype=float),'n':np.tile([0,0,1.],(4,1)),'f':np.array([[0,1,2],[0,2,3]]),'mat':-1}
    opaque=[o for o in m.OBJECTS if o['mat'] not in [m.glass,m.windowglass]]
    for o in [ground]+opaque:
        material=m.MATS[o['mat']] if o['mat']>=0 else {'pbrMetallicRoughness':{'baseColorFactor':[.13,.15,.15,1]}}
        color=material['pbrMetallicRoughness']['baseColorFactor'][:3]
        emission=np.array(material.get('emissiveFactor',[0,0,0]),dtype=float)*material.get('extensions',{}).get('KHR_materials_emissive_strength',{}).get('emissiveStrength',1)
        if mode=='day':emission*=.025
        vals=np.concatenate([o['v'],o['n'],np.tile(color,(len(o['v']),1)),np.tile(emission,(len(o['v']),1)),np.full((len(o['v']),1),o['mat']+2),o.get('uv',np.zeros((len(o['v']),2)))],axis=1)
        raster(project(o['v'],B,S,scale,center),o['f'],zb,gb,vals)
    print('geometry',mode,view,flush=True)
    world=gb[:,:,:3];normal=gb[:,:,3:6];normal/=np.maximum(np.linalg.norm(normal,axis=2,keepdims=True),1e-6)
    albedo=gb[:,:,6:9];em=gb[:,:,9:12]
    # Sample the same embedded base-colour and tangent-space normal maps as GLB.
    cloth=np.isin(np.rint(gb[:,:,12]).astype(int),[m.sofa+2,m.pillow+2,m.ochre+2])
    if cloth.any():
        uv=gb[:,:,13:15];coords=np.stack([(uv[:,:,1]%1)*512,(uv[:,:,0]%1)*512])
        colorimg=m.TEXTURES[0]['pixels']/255.
        normimg=m.TEXTURES[1]['pixels']/255.*2-1
        sigma=1.3 if view=='linen' else 3.0
        colorimg=gaussian_filter(colorimg,(sigma,sigma,0),mode='wrap')
        normimg=gaussian_filter(normimg,(sigma,sigma,0),mode='wrap')
        sampled=np.stack([map_coordinates(colorimg[:,:,i],coords,order=1,mode='grid-wrap') for i in range(3)],axis=2)
        sampled=np.where(sampled<=.04045,sampled/12.92,((sampled+.055)/1.055)**2.4)
        albedo[cloth]*=sampled[cloth]
        bump=np.stack([map_coordinates(normimg[:,:,i],coords,order=1,mode='grid-wrap') for i in range(2)],axis=2)*.55
        axis=np.argmax(abs(normal),axis=2)
        for ax in range(3):
            mask=cloth&(axis==ax);a=(ax+1)%3;d=(ax+2)%3
            normal[:,:,a][mask]+=bump[:,:,0][mask]
            normal[:,:,d][mask]+=bump[:,:,1][mask]
        normal/=np.maximum(np.linalg.norm(normal,axis=2,keepdims=True),1e-6)
    ball=np.rint(gb[:,:,12]).astype(int)==m.volleyball+2
    if ball.any():
        uv=gb[:,:,13:15];coords=np.stack([(uv[:,:,1]%1)*512,(uv[:,:,0]%1)*1024])
        ci=m.TEXTURES[3]['pixels']/255.
        ci=gaussian_filter(ci,(.5,.5,0),mode='wrap')
        sampled=np.stack([map_coordinates(ci[:,:,i],coords,order=1,mode='grid-wrap') for i in range(3)],axis=2)
        sampled=np.where(sampled<=.04045,sampled/12.92,((sampled+.055)/1.055)**2.4)
        albedo[ball]*=sampled[ball]
        ni=m.TEXTURES[4]['pixels']/255.*2-1
        bump=np.stack([map_coordinates(ni[:,:,i],coords,order=1,mode='grid-wrap') for i in range(2)],axis=2)*.7
        nb=normal[ball];tu=np.column_stack([-nb[:,1],nb[:,0],np.zeros(len(nb))])
        tu/=np.maximum(np.linalg.norm(tu,axis=1,keepdims=True),1e-6)
        tv=-np.cross(nb,tu);normal[ball]+=tu*bump[ball,0,None]+tv*bump[ball,1,None]
        normal/=np.maximum(np.linalg.norm(normal,axis=2,keepdims=True),1e-6)
    sun=np.array([-2.,-1.,8.]);sun/=np.linalg.norm(sun)
    SB=basis(sun*20,np.zeros(3));SS=1500;shadow=np.full((SS,SS),-1e6,dtype=np.float32);sscale=SS/12.8
    for o in opaque:raster(project(o['v'],SB,SS,sscale,np.zeros(3)),o['f'],shadow)
    sp=project(world.reshape(-1,3),SB,SS,sscale,np.zeros(3)).reshape(S,S,3)
    sx=np.clip(sp[:,:,0].astype(int),1,SS-2);sy=np.clip(sp[:,:,1].astype(int),1,SS-2)
    visibility=np.zeros((S,S))
    for dx,dy in [(0,0),(-1,-1),(1,1),(-1,1),(1,-1)]:visibility+=(sp[:,:,2]+.035>=shadow[sy+dy,sx+dx])/5
    visibility=gaussian_filter(visibility,.7)
    hemi=np.maximum(normal[:,:,2:3],0)
    lighting=(.24+.19*hemi)*np.array([1.,.97,.88]) if mode=='day' else (.06+.08*hemi)*np.array([.70,.86,1.])
    nd=np.maximum(normal@sun,0)
    lighting=lighting+(nd*visibility)[:,:,None]*np.array([1.1,.92,.66])*(1.5 if mode=='day' else .15)
    # Large front studio fill, to make this first model review readable.
    fill=np.array([.5,-.8,.4]);fill/=np.linalg.norm(fill)
    lighting+=np.maximum(normal@fill,0)[:,:,None]*np.array([.20,.23,.26])*(1 if mode=='day' else .35)
    if mode=='night':
        for l in m.LIGHTS:
            delta=np.array(l['pos'])-world;dist2=np.sum(delta*delta,axis=2);dist=np.sqrt(dist2)
            direction=delta/np.maximum(dist[:,:,None],.01)
            nd=np.maximum(np.sum(normal*direction,axis=2),0)
            attenuation=np.maximum(1-(dist/l['range'])**4,0)**2/np.maximum(dist2,.09)
            lighting+=(nd*attenuation*l['intensity']*.035)[:,:,None]*np.array(l['color'])
    # Small screen-space crevice shading; geometry-derived, not baked into asset.
    ao=np.zeros((S,S))
    for dx,dy in [(-4,0),(4,0),(0,4),(0,-4),(-9,-9),(9,9),(-9,9),(9,-9)]:
        other=np.roll(np.roll(world,dx,axis=1),dy,axis=0);delta=other-world;d=np.linalg.norm(delta,axis=2)
        occ=np.maximum(np.sum(delta*normal,axis=2)/np.maximum(d,.001)-.12,0)*np.exp(-d*7)
        ao+=occ/8
    ao=gaussian_filter(np.clip(1-ao*2.3,.47,1),.8)
    rgb=albedo*lighting*ao[:,:,None]+em*.65
    bloom=gaussian_filter(np.maximum(rgb-1,0),sigma=(6,6,0))*.22
    rgb+=bloom
    rgb=(rgb*(2.51*rgb+.03))/(rgb*(2.43*rgb+.59)+.14)
    rgb=np.clip(rgb,0,1)**(1/2.2)
    # Tint the actual guard meshes over opaque depth without occluding interior.
    for o in m.OBJECTS:
        if o['mat'] not in [m.glass,m.windowglass]:continue
        tg=np.zeros((S,S,1),dtype=np.float32);zz=zb.copy()
        raster(project(o['v'],B,S,scale,center),o['f'],zz,tg,np.ones((len(o['v']),1)))
        a=tg*(.60 if o['mat']==m.windowglass else .13)
        rgb=rgb*(1-a)+np.array([.12,.15,.17] if o['mat']==m.windowglass else [.50,.60,.58])*a
    Image.fromarray(np.uint8(rgb*255)).save(m.OUT/f'preview_{mode}_{view}.png')
    print('saved',mode,view,flush=True)

if __name__=='__main__':render(*(sys.argv[1:] or ['day','hero']))

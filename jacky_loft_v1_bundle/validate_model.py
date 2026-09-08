"""Structural checks of the written GLB, not an external conformance validator."""
from pathlib import Path
import ast, json, struct, io
import numpy as np
from PIL import Image
import build_model as source

p=Path(__file__).resolve().parent
data=(p/'jacky_loft_v1.glb').read_bytes()
magic,version,total=struct.unpack_from('<4sII',data)
assert magic==b'glTF' and version==2 and total==len(data)
jslen,jstype=struct.unpack_from('<I4s',data,12)
assert jstype==b'JSON'
d=json.loads(data[20:20+jslen])
off=20+jslen;blen,btype=struct.unpack_from('<I4s',data,off)
assert btype==b'BIN\0' and off+8+blen==len(data)
binary=data[off+8:];assert d['buffers'][0]['byteLength']<=len(binary)
counts={'SCALAR':1,'VEC2':2,'VEC3':3}
def accessor(i):
    ac=d['accessors'][i];view=d['bufferViews'][ac['bufferView']]
    start=view.get('byteOffset',0)+ac.get('byteOffset',0)
    typ={5126:'<f4',5125:'<u4',5123:'<u2'}[ac['componentType']]
    n=ac['count']*counts[ac['type']]
    assert start+n*np.dtype(typ).itemsize<=view.get('byteOffset',0)+view['byteLength']<=len(binary)
    a=np.frombuffer(binary,dtype=typ,count=n,offset=start).reshape(ac['count'],counts[ac['type']])
    assert np.isfinite(a).all()
    return a
triangles=0;pos=[];meshes={};source_materials={};effective_colors={};verified_parts=set()
for mesh in d['meshes']:
    for pr in mesh['primitives']:
        v=accessor(pr['attributes']['POSITION']);n=accessor(pr['attributes']['NORMAL']);f=accessor(pr['indices'])
        assert len(v)==len(n) and len(f)%3==0 and f.max()<len(v)
        assert np.max(np.abs(np.linalg.norm(n,axis=1)-1))<1e-4
        assert 0<=pr['material']<len(d['materials'])
        material=d['materials'][pr['material']]
        if 'baseColorTexture' in material['pbrMetallicRoughness']:
            uv=accessor(pr['attributes']['TEXCOORD_0']);assert len(uv)==len(v)
        # Convert back to building axes for concrete geometry regressions below.
        building_v=v[:,[0,2,1]]*np.array([1,-1,1])
        building_n=n[:,[0,2,1]]*np.array([1,-1,1])
        f=f.reshape(-1)
        for part in mesh['extras']['sourceParts']:
            ids=f[part['indexOffset']:part['indexOffset']+part['indexCount']]
            points=building_v[ids]
            original=source.OBJECTS[part['sourceIndex']]
            assert original['name']==part['name']
            assert np.array_equal(points,original['v'][original['f'].reshape(-1)])
            assert np.array_equal(building_n[ids],original['n'][original['f'].reshape(-1)])
            if 'uv' in original:
                assert np.array_equal(accessor(pr['attributes']['TEXCOORD_0'])[ids],original['uv'][original['f'].reshape(-1)])
            vc=accessor(pr['attributes']['COLOR_0'])[ids] if 'COLOR_0' in pr['attributes'] else np.ones((len(ids),3))
            effective=vc*np.array(material['pbrMetallicRoughness']['baseColorFactor'][:3])
            assert np.allclose(effective,source.MATS[original['mat']]['pbrMetallicRoughness']['baseColorFactor'][:3],atol=1e-7)
            verified_parts.add(part['sourceIndex'])
            meshes[part['name']]=points
            source_materials[part['name']]=material
            effective_colors[part['name']]=effective[0]
        triangles+=len(f)//3;pos.append(v)
seen=set()
def visit(i):
    assert i not in seen;seen.add(i)
    node=d['nodes'][i]
    for j in node.get('children',[]):assert 0<=j<len(d['nodes']);visit(j)
visit(0);assert len(seen)==len(d['nodes'])
groups=[n for n in d['nodes'] if n.get('extras',{}).get('controllable')]
assert len(groups)==7
lamps=d['extensions']['KHR_lights_punctual']['lights'];assert len(lamps)==9
group_materials=[]
for g in groups:
    materials=set();light_count=0
    for ni in g['children']:
        n=d['nodes'][ni]
        if 'mesh' in n:
            for pr in d['meshes'][n['mesh']]['primitives']:
                if 'emissiveFactor' in d['materials'][pr['material']]:materials.add(pr['material'])
        if 'KHR_lights_punctual' in n.get('extensions',{}):light_count+=1
    assert materials and light_count>=1
    for old in group_materials:assert not(old & materials)
    group_materials.append(materials)
for path in p.glob('*.py'):ast.parse(path.read_text())
def bounds(name):
    a=meshes[name];return a.min(axis=0),a.max(axis=0)
def bottom(name):return bounds(name)[0][2]
def top(name):return bounds(name)[1][2]
fixchecks=[]
# 1. Actual vertical support and no rear boards, no shelf/planter overlap.
feet=[n for n in meshes if n.startswith('Shelf_platform_foot_')]
assert len(feet)==4
for n in feet:
    assert abs(bottom(n)-top('Rear_raised_platform'))<1e-5
    assert abs(top(n)-bottom('Shelf_board_00'))<1e-5
assert not any(n.startswith('Shelf_') and '_back' in n for n in meshes)
assert abs(top('Shelf_board_03')-bottom('Mezzanine_curved_deck'))<1e-5
shelfmax=max(bounds(n)[1][0] for n in meshes if n.startswith('Shelf_'))
assert bounds('Tall_sansevieria_pot')[0][0]>shelfmax+.05
assert abs(bottom('Tall_sansevieria_pot')-top('Rear_raised_platform'))<1e-5
slo,shi=bounds('Shelf_board_00');clo,chi=bounds('Sofa_back')
assert (shi-slo)[1]>(shi-slo)[0]*2
assert (chi-clo)[0]>(chi-clo)[1]*2
assert slo[1]>chi[1]+.15
fixchecks.append('Shelf long axis perpendicular to sofa, grounded feet, deck connection and planter clearance')
# 2. Floorboards stop inside wall planes; all wall/base bottoms align.
for n in ['Left_wall','Rear_wall_left','Rear_wall_right','Window_sill_wall']:
    assert abs(bottom(n)-bottom('Ground_rounded_plinth'))<1e-5
for n in meshes:
    if n.endswith('_boards'):
        lo,hi=bounds(n)
        assert lo[0]>=bounds('Left_wall')[1][0]+.009
        assert hi[1]<=bounds('Rear_wall_right')[0][1]-.009
assert 'Left_skirting' not in meshes and 'Rear_skirting' not in meshes
fixchecks.append('Floor inside walls, unwanted skirting removed, wall and plinth bottoms equal')
# 3. Recessed tread within full-width platform rather than a projecting block.
assert 'Rear_access_step' not in meshes
assert abs(top('Rear_platform_lower_course')-.33)<1e-5
assert abs(bottom('Rear_platform_lower_course')-.14)<1e-5
assert abs(top('Rear_raised_platform')-.52)<1e-5
assert bounds('Rear_raised_platform')[0][1]>bounds('Sofa_back')[1][1]+.10
for name in ['Rear_raised_platform','Rear_platform_lower_course']:
    lo,hi=bounds(name)
    assert abs(lo[0]-bounds('Left_wall')[1][0])<1e-5
    assert abs(hi[1]-bounds('Rear_wall_left')[0][1])<1e-5
    assert abs(lo[1]-1.35)<1e-5 and abs(hi[0]-4)<1e-5
def top_surface_covers(name,x,y):
    v=meshes[name];zmax=v[:,2].max();point=np.array([x,y])
    cross=lambda a,b:a[0]*b[1]-a[1]*b[0]
    for tri in v.reshape(-1,3,3):
        if not np.allclose(tri[:,2],zmax,atol=1e-5):continue
        signs=[cross(tri[(i+1)%3,:2]-tri[i,:2],point-tri[i,:2]) for i in range(3)]
        if min(signs)>=-1e-7 or max(signs)<=1e-7:return True
    return False
assert top_surface_covers('Rear_platform_lower_course',-1,1.55)
assert not top_surface_covers('Rear_raised_platform',-1,1.55)
for x,y in [(-1.8,1.55),(-.2,1.55),(-1,1.85),(-3.9,3.4)]:
    assert top_surface_covers('Rear_raised_platform',x,y)
fixchecks.append('Full back corner covered; recessed entry exposes lower course; no projecting step')
# 4. Header removed; two distinct dark glass meshes retain sorting boundaries.
panes=[n for n in meshes if n.startswith('Window_Glass_')];assert len(panes)==2
assert 'Window_top_header' not in meshes
for n in panes:
    lo,hi=bounds(n)
    assert hi[2]<=top('Rear_wall_right') and lo[2]>=top('Window_sill')-1e-5
    material=source_materials[n]
    assert .7<material['extensions']['KHR_materials_transmission']['transmissionFactor']<.9
    assert max(material['pbrMetallicRoughness']['baseColorFactor'][:3])<.25
    glassmesh=next(mm for mm in d['meshes'] if mm['name']==n)
    assert len(glassmesh['extras']['sourceParts'])==1
fixchecks.append('Window header removed; two independently sorted dark transmission-glass panes')
# 5. Pillows contained by left seat footprint and supported by its top.
seatlo,seathi=bounds('Sofa_seat_00')
for n in ['Ivory_pillow','Mustard_pillow']:
    lo,hi=bounds(n)
    assert lo[0]>=seatlo[0] and hi[0]<=seathi[0]
    assert lo[1]>=seatlo[1] and hi[1]<=seathi[1]
    assert abs(lo[2]-seathi[2])<.016
for image in d['images']:
    v=d['bufferViews'][image['bufferView']];start=v['byteOffset']
    raw=binary[start:start+v['byteLength']]
    with Image.open(io.BytesIO(raw)) as im:
        assert im.size==((1024,512) if image['name'].startswith('mikasa_') else (512,512));im.verify()
assert len(d['images'])==6
linen=source_materials['Sofa_back']
assert 'normalTexture' in linen and 'metallicRoughnessTexture' in linen['pbrMetallicRoughness']
fixchecks.append('Both pillows inside seat; supported bottoms; embedded linen base/normal/roughness and UVs')
color=effective_colors['Sofa_back']
assert max(color)-min(color)<.05 and .25<min(color)<.4
assert not any(n.startswith('Cactus_') for n in meshes)
assert 'MIKASA_Volleyball' in meshes
lo,hi=bounds('MIKASA_Volleyball');assert abs(lo[2]-.154)<1e-5
assert np.allclose((lo+hi)/2,[-1.90,.31,.344],atol=.001)
ballmat=source_materials['MIKASA_Volleyball']
assert ballmat['pbrMetallicRoughness']['baseColorTexture']['index']==3 and ballmat['normalTexture']['index']==4
assert not np.any(np.all(source.TEXTURES[3]['pixels']>220,axis=2))
fixchecks.append('Grey linen sofa; curved yellow-blue volleyball without white lettering; grounded at prior position')
assert len(verified_parts)==len(source.OBJECTS)
assert len(d['meshes'])<70 and all(len(mm['primitives'])==1 for mm in d['meshes'])
for groupname in ['Bookshelf','TV']:
    group=next(nn for nn in d['nodes'] if nn['name']==groupname)
    for child in group['children']:
        if 'mesh' in d['nodes'][child]:
            for part in d['meshes'][d['nodes'][child]['mesh']]['extras']['sourceParts']:
                assert source.OBJECTS[part['sourceIndex']]['group']==groupname
    assert any(d['nodes'][i]['name']=='Hotspot_'+groupname for i in group['children'])
for light in lamps:
    if light['name'].startswith('Lamp_Pendant'):assert light['intensity']==14
    if light['name']=='Lamp_Table_Cylinder_light':assert light['intensity']==7 and light['color'][0]>light['color'][2]*5
fixchecks.append('Every source triangle/normal/UV/effective colour preserved after merge; Bookshelf/TV/hotspots and seven lamp groups retained; softened warm lights')
positions=np.concatenate(pos)
result={'status':'passed','checks':['GLB headers and chunk bounds','All mesh indices in bounds','Finite vertices and unit normals','Complete non-cyclic node hierarchy','7 independent lamp groups with non-shared emissive materials','9 punctual lights','Python source syntax'],
        'version':d['nodes'][0]['extras']['version'],'revision_checks':fixchecks,'mesh_count':len(d['meshes']),'triangles':triangles,'bounds_gltf_y_up':{'min':positions.min(axis=0).tolist(),'max':positions.max(axis=0).tolist()},
        'not_tested':['Blender runtime import','Three.js browser rendering','Mobile performance','External Khronos conformance validator']}
(p/'validation.json').write_text(json.dumps(result,indent=2))
print(json.dumps(result,indent=2))

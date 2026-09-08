"""Run from Blender's Scripting workspace after opening this file.
Imports GLB into a NEW scene, adds a review camera/studio and saves a .blend.
The existing scene is not cleared. The generated .blend is not supplied pre-run.
"""
from pathlib import Path
from datetime import datetime
import bpy
from mathutils import Vector

# If necessary, replace None with an absolute path, e.g. r'C:\models\jacky_loft_v1.glb'
MODEL_PATH = None

def source_folder():
    if '__file__' in globals():
        return Path(__file__).resolve().parent
    space = getattr(bpy.context, 'space_data', None)
    text = getattr(space, 'text', None)
    if text and text.filepath:
        return Path(bpy.path.abspath(text.filepath)).parent
    raise RuntimeError('Set MODEL_PATH to the full path of jacky_loft_v1.glb, or open this saved script in Blender.')

path = Path(MODEL_PATH) if MODEL_PATH else source_folder() / 'jacky_loft_v1.glb'
if not path.is_file():
    raise FileNotFoundError(str(path))

scene = bpy.data.scenes.new('Jacky Loft v1 Review')
if bpy.context.window:
    bpy.context.window.scene = scene
else:
    raise RuntimeError('Run this import helper in the Blender user interface.')
bpy.ops.import_scene.gltf(filepath=str(path))

# glTF importer transforms the Y-up file into Blender's Z-up scene.
studio=bpy.data.collections.new('REVIEW_STUDIO_not_part_of_model')
scene.collection.children.link(studio)
def aim(obj, target):
    obj.rotation_euler=(Vector(target)-obj.location).to_track_quat('-Z','Y').to_euler()
def area(name,pos,power,size,color):
    data=bpy.data.lights.new(name,'AREA');data.energy=power;data.shape='DISK';data.size=size;data.color=color
    obj=bpy.data.objects.new(name,data);studio.objects.link(obj);obj.location=pos;aim(obj,(0,0,1.7));return obj

area('Review_key',(1,-5,10),1500,7,(1,.89,.73))
area('Review_fill',(-3,-4,5),650,6,(.78,.86,1))
area('Review_rear',(0,5,7),1100,4,(1,.81,.55))
world=bpy.data.worlds.new('Review_world');world.use_nodes=True
world.node_tree.nodes['Background'].inputs['Color'].default_value=(.12,.15,.19,1)
world.node_tree.nodes['Background'].inputs['Strength'].default_value=.45
scene.world=world
data=bpy.data.cameras.new('Review_camera');camera=bpy.data.objects.new('Review_camera',data);studio.objects.link(camera)
camera.location=(10,-14,11);aim(camera,(0,0,2.35));data.type='ORTHO';data.ortho_scale=11.9;scene.camera=camera
scene.render.engine='CYCLES';scene.cycles.samples=48
scene.render.resolution_x=1200;scene.render.resolution_y=1200;scene.render.resolution_percentage=100
scene.render.image_settings.file_format='PNG'
for screen in bpy.data.screens:
    for ar in screen.areas:
        if ar.type=='VIEW_3D':
            ar.spaces.active.clip_end=1000
            ar.spaces.active.region_3d.view_distance=14
            ar.spaces.active.region_3d.view_location=(0,0,2.3)
destination=path.with_suffix('.blend')
if destination.exists():
    destination=path.with_name('jacky_loft_v1_'+datetime.now().strftime('%Y%m%d_%H%M%S')+'.blend')
bpy.ops.wm.save_as_mainfile(filepath=str(destination))
print('Saved model review scene:', destination)

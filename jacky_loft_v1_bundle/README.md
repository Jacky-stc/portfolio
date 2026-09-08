# Jacky Loft — 修正版 v0.5.1

這是依提供的多角度截圖重新建立的場景，不是從 Needle 網站擷取的原始模型。
尺寸、不可見細節及部分結構為推估；適合先確認布局、比例與互動方向。

檔名延續 `jacky_loft_v1.glb`，根節點的版本資料已更新為 `0.5.1`。
請以新下載的檔案取代網站資產；在既有 Blender 場景手動匯入時，避免同時保留重疊的舊模型。

## 本次修正

1. 沙發布面改成參考圖的暖灰色亞麻，增加經緯交織與纖維間隙，使用色彩、法線、粗糙度貼圖及柔和 sheen。米白與芥末黃抱枕維持原色。
2. 排球重新描繪照片中的寬幅黃藍曲線，移除 MIKASA 字樣，保留細凹點與接縫。可見面的輪廓依照片重建，背面依連續曲面推估，並非原廠完整展開圖。照片外觀更接近八片式 MVA200；八片結構可參考 [Kuraray 當年產品資料](https://www.kuraray.com/global-en/news/2008/0625/)。球體仍為單一網格，拼片細節使用貼圖與法線表現；裝飾比例直徑約 38 cm，位置沿用原仙人掌中心。
3. 移除大窗最上方的木框，保留側框、中柱與窗台；兩片玻璃改為煙灰色，transmission 0.78、IOR 1.5、roughness 0.12。
4. 三盞主吊燈改為奶油米黃，點光強度 14、emissive strength 1.25；二樓左側筒燈改橘色，點光強度 7、emissive strength 1.1。
5. 在 GLB 輸出階段合併同群組、相容 PBR 材質的網格；材質去重，顏色差異改存 vertex color，去除完全相同的頂點屬性，適用時改用 16-bit 索引。
6. 將書櫃與電視的 hotspot 錨點恢復到物件上緣，避免網格合併後白點、白線與提示文字下移。

## 網格最佳化

| 項目 | 前版 v0.4 | 本版 v0.5 |
| --- | ---: | ---: |
| Mesh / primitive | 239 | 44 |
| 材質 | 36 | 18 |
| 三角形 | 32,018 | 32,006 |
| GLB 位元組 | 2,006,908 | 1,811,688 |

本次造型修改後、合併前有 238 個 mesh；合併後為 44 個，三角形仍為 32,006，沒有簡化或刪除表面。表中三角形差異來自移除窗戶頂框。
primitive 數量不是瀏覽器實測的 draw calls：透明、透光、陰影等額外 pass 仍可能增加繪製次數。尚未量測網站 FPS。

`Bookshelf`、`TV` 與七組燈具父節點名稱保留，沒有跨互動群組合併；原有其他語意群組也保留。新增 `Hotspot_Bookshelf`、`Hotspot_TV` 空節點供定位使用。兩片窗戶玻璃各自保留網格；各燈具的發光材質不共用。
合併後的子網格名稱會改為 `*_Merged_*`，互動應綁定父群組；若既有程式直接找原本零件名稱，需改查父群組。原零件對應記錄於 mesh 的 `extras.sourceParts`。
這次沒有修改 Windows 專案的 `LoftScene.jsx`；可繼續使用既有按需渲染與 hover 邏輯。

## 保留的前版修正

1. 層架整組旋轉 90 度，長軸沿房間前後方向，與沙發長軸垂直。層板、側板、支柱與燈具一起轉向；四根底柱接到平台，頂端接夾層底面，與盆栽保留間距。
2. 移除書櫃旁及後方平台上的兩條木製踢腳板。保留上一輪牆地修正：木板停在牆內側，外牆、窗下牆與底座最低點一致。
3. 平台延伸至左牆與後牆轉角，填滿後方空間，包含上段樓梯下方。上層平台前緣挖出 1.42 m 寬、0.40 m 深的凹口，露出下層頂面作為第一階；沒有凸出平台前緣的獨立踏階。高度仍為 0.33／0.52 m，從地板形成兩段約 19 cm 高差。
4. 兩片全高玻璃維持獨立；窗戶上框與玻璃材質以本版設定為準。
5. 兩個抱枕移回左側座墊內並貼近座面；沙發及抱枕加入 UV、亞麻織紋色彩、法線與粗糙度貼圖，並加入柔和纖維 sheen。

## 檔案

- `jacky_loft_v1.glb`：主要模型；可匯入 Blender、載入 Three.js。
- `preview_day_hero.png`、`preview_night_hero.png`、`preview_day_top.png`：由同一份實際網格產生的預覽。
- `preview_day_shelf.png`、`preview_day_platform.png`、`preview_day_window.png`、`preview_day_seam.png`、`preview_day_linen.png`：層架、內凹踏階、窗戶、接縫與布料的局部檢查畫面。
- `preview_day_volleyball.png`：排球曲線配色及表面近照。
- `linen_basecolor.png`、`linen_normal.png`、`linen_roughness.png`：512 × 512 無縫程序織紋；全部已內嵌 GLB，不需要另外放到網站。
- `mikasa_basecolor.png`、`mikasa_normal.png`、`mikasa_roughness.png`：1024 × 512 排球 PBR 貼圖，全部內嵌 GLB。
- `import_into_blender.py`：在 Blender 新增場景、匯入模型、加入檢視相機及燈光並儲存 .blend。
- `lamp-controls.js`：Three.js 燈具控制函式。
- `build_model.py`：可重建 GLB 的原始程式，需要 Python、NumPy、Pillow。
- `render_preview.py`：離線預覽程式，另需要 SciPy、Pillow。
- `model_stats.json`、`optimization_report.json`、`validation.json`：模型統計、最佳化明細與結構檢查。

## Blender 開啟方式

最簡單：File → Import → glTF 2.0，選取 `jacky_loft_v1.glb`，再另存為 .blend。

需要相機與檢視燈光時：解壓縮全部檔案到同一個資料夾，在 Blender 的 Scripting 頁面開啟
`import_into_blender.py`，按 Run Script。必要時修改腳本上方 MODEL_PATH。
腳本建立新場景，不清除既有場景；若同名 .blend 已存在，會另存時間戳記檔案。

本環境沒有可執行的 Blender，因此未提供已執行驗證的原生 .blend；匯入腳本做過語法檢查，未在 Blender 執行。

## Three.js 載入

```js
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { setLamp, setAllLamps } from './lamp-controls.js';

const gltf = await new GLTFLoader().loadAsync('/models/jacky_loft_v1.glb?v=0.5.1');
scene.add(gltf.scene);
// GLB 不含攝影棚光源；請在自己的場景加入環境光與相機。
scene.add(new THREE.HemisphereLight(0xdce9ff, 0x594536, 1.2));
camera.position.set(10, 11, 14); // glTF 是 Y-up
camera.lookAt(0, 2.35, 0);
setAllLamps(gltf.scene, true);
setLamp(gltf.scene, 'Lamp_Pendant_01', false);
```

模型以公尺估計，寬約 8.2、高約 4.8（含底座）、深約 7.2；GLB 為 Y-up。
正面在 +Z 方向，模型腳本的 +Y（後方）對應 GLB 的 -Z。

## 燈光分組

| 節點名稱 | 對應燈具 |
| --- | --- |
| Lamp_Pendant_01 | 第一盞吊燈 |
| Lamp_Pendant_02 | 第二盞吊燈 |
| Lamp_Pendant_03 | 第三盞吊燈 |
| Lamp_Table_Cylinder | 二樓左側筒燈 |
| Lamp_Table_Orb | 二樓右側球燈 |
| Lamp_Shelf | 一樓層架燈 |
| Lamp_Stair_LED | 樓梯燈帶（含三個輔助點光源） |

使用標準 `KHR_lights_punctual` 與 `KHR_materials_emissive_strength`。
玻璃另用 `KHR_materials_transmission`／`KHR_materials_ior`，亞麻用 `KHR_materials_sheen`；需要支援這些擴充的 glTF 匯入器。
每組有獨立發光材質；關閉時應同時關閉點光源與 emissiveIntensity，已由控制函式處理。
模型內燈具預設全開。日間預覽將自發光降低，夜間則全開。

## 此版本的範圍與限制

- 有弧形夾層、樓梯洞、轉折樓梯、半透明護欄、窗框、主要家具與簡化植物。
- 家具為低至中等面數的圓角幾何；地板使用交錯板條與多色木材，尚無木紋貼圖。沙發亞麻為程序生成的 PBR 貼圖。
- 窗口已有兩片透光玻璃。層架依本輪特寫重建；整體尺寸仍是推估。
- 燈光預覽是離線簡化照明，並非 Blender／Three.js 實際畫面，也沒有把光影烘焙進材質。
- GLB 不包含背景地面、攝影棚燈光、相機或個人網站 UI。
- 未進行瀏覽器／手機效能測試；32,006 個三角形、44 個網格、約 1.81 MB。GLB 未使用 Draco 或 Meshopt；可直接由標準 GLTFLoader 載入，不需額外幾何解碼器。
- 9 個點光源預設不要求陰影。不要替每個點光源全部開啟即時陰影；Bloom 也需由網站另行加入。
- 織紋為程序生成，未下載第三方材質。預覽會讀取相同織紋，但玻璃只作簡化透明疊色，實際反射／折射依 Blender 或 Three.js 的環境與設定而不同。

## 已完成的檢查

`validation.json` 記錄 GLB 實際輸出檔的結構檢查，以及幾何／材質回歸檢查：
層架與沙發軸向垂直、支柱接地、盆栽間距、地板邊界、共同底面、後方轉角覆蓋、踏階內凹面、木條移除、雙扇玻璃框、抱枕範圍與貼圖內嵌。
並檢查 UV 數量、法線、網格索引、節點階層與燈具分組。
本輪另檢查灰色材質數值、窗戶頂框移除與深色玻璃、原仙人掌節點完整移除、排球位置與接地高度，以及六張 PBR 貼圖都已內嵌。
逐一比對合併前後每個三角形的頂點、法線、UV 與實際色彩；另確認書櫃、電視、hotspot、獨立燈具群組與暖色低亮度設定。
這些檢查不等同 Blender 實機或瀏覽器的動態畫面測試；目前仍未在這些環境執行驗證。

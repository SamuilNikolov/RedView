// Cesium initialization and visualization setup
// Replace 'YOUR_CESIUM_ION_TOKEN' with your actual Cesium Ion access token
Cesium.Ion.defaultAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiIzNWM5ZWNmMS01ZmY4LTQ1YzMtYTExZi04M2M5NWUxYTQ4OWIiLCJpZCI6MzQxMjE0LCJpYXQiOjE3NTc4NTg3NTd9.nI85622ZVrA2th4n6-QQiILEcaPpKSrkRKSAbDysk-U';

// Set default ellipsoid to Mars for all coordinate conversions
Cesium.Ellipsoid.default = Cesium.Ellipsoid.MARS;

const marsEllipsoid = Cesium.Ellipsoid.MARS;

// Initialize viewer with Mars-specific settings (disable globe for global tileset)
const viewer = new Cesium.Viewer('cesiumContainer', {
    globe: false,               // Disable globe to avoid interference with Mars tileset
    baseLayerPicker: false,     // Hide base layer picker for clean Mars view
    geocoder: false,
    homeButton: false,
    sceneModePicker: false,     // 2D/Columbus View not supported for global Mars tileset
    selectionIndicator: false,
    navigationHelpButton: false,
    animation: false,
    timeline: false,
    fullscreenButton: false,
    vrButton: false
});

// Fix stuttering: Enable continuous rendering for smoother zoom/rotate
viewer.scene.requestRenderMode = false;

// Fix camera clipping: Prevent camera from going below surface
viewer.scene.screenSpaceCameraController.enableCollisionDetection = true;

// Set camera to Jezero Crater (Perseverance landing site)
viewer.camera.setView({
    destination: Cesium.Cartesian3.fromDegrees(77.45, 18.44, 5000.0, marsEllipsoid), // lon, lat, height
    orientation: {
        heading: 0.0,
        pitch: -0.5 * Math.PI / 2.0,
        roll: 0.0
    }
});

// Load Mars 3D Tileset asynchronously with readiness check
const assetId = 3644333; // Correct Cesium Ion Mars tileset asset ID
Cesium.Cesium3DTileset.fromIonAssetId(assetId)
    .then(tileset => {
        const tilesetPrimitive = viewer.scene.primitives.add(tileset);
        // Wait for tileset to be ready before zooming
        return tileset.readyPromise.then(() => tilesetPrimitive);
    })
    .then(tileset => {
        viewer.zoomTo(tileset);
    })
    .catch(error => {
        console.error('Failed to load Mars tileset:', error);
        // Fallback: Simple red Mars sphere (enable globe for fallback)
        viewer.globe = new Cesium.Globe(marsEllipsoid);
        viewer.scene.globe.baseColor = Cesium.Color.RED.withAlpha(0.5);
        viewer.scene.globe.show = true;
    });

// Fetch and process Perseverance waypoint data
fetch('https://mars.nasa.gov/mmgis-maps/M20/Layers/json/M20_waypoints.json')
    .then(response => {
        if (!response.ok) {
            throw new Error('API fetch failed');
        }
        return response.json();
    })
    .then(data => {
        // Extract and sort waypoints by sol
        let waypoints = data.features
            .map(feature => ({
                sol: feature.properties.sol,
                lon: feature.properties.lon,
                lat: feature.properties.lat,
                elev: feature.properties.elev_geoid || 0  // Use elev_geoid for height above ellipsoid
            }))
            .sort((a, b) => a.sol - b.sol);

        if (waypoints.length === 0) {
            throw new Error('No waypoints found');
        }

        // Build positions array for polyline
        let positions = [];
        waypoints.forEach(waypoint => {
            positions.push(Cesium.Cartesian3.fromDegrees(waypoint.lon, waypoint.lat, waypoint.elev, marsEllipsoid));

            // Add yellow marker entity with sol label (absolute height, no clamp needed)
            viewer.entities.add({
                position: positions[positions.length - 1],
                point: {
                    color: Cesium.Color.YELLOW,
                    pixelSize: 10,
                    outlineColor: Cesium.Color.BLACK,
                    outlineWidth: 2,
                    heightReference: Cesium.HeightReference.NONE  // Use absolute height
                },
                label: {
                    text: `Sol ${waypoint.sol}`,
                    font: '14pt monospace',
                    style: Cesium.LabelStyle.FILL_AND_OUTLINE,
                    outlineWidth: 2,
                    verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
                    pixelOffset: new Cesium.Cartesian2(0, -10),
                    heightReference: Cesium.HeightReference.NONE
                }
            });
        });

        // Add red polyline connecting all positions (arcType for curved lines on globe)
        viewer.entities.add({
            polyline: {
                positions: positions,
                width: 3,
                material: Cesium.Color.RED,
                arcType: Cesium.ArcType.GEODESIC,  // Follow planet curvature
                clampToGround: false
            }
        });

        // Zoom to entities if needed
        viewer.zoomTo(viewer.entities);
    })
    .catch(error => {
        console.error('Error fetching or processing data:', error);
        // Fallback: Alert user or log; no visualization
        viewer.entities.add({
            label: {
                text: 'Data fetch failed - Check console',
                font: '20pt monospace',
                fillColor: Cesium.Color.RED,
                showBackground: true,
                scale: 1.5,
                verticalOrigin: Cesium.VerticalOrigin.CENTER,
                horizontalOrigin: Cesium.HorizontalOrigin.CENTER
            }
        });
    });
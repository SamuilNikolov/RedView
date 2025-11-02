from flask import Flask, request, jsonify
from PIL import Image
import torch
from transformers import AutoImageProcessor, AutoModelForDepthEstimation
import numpy as np
import io
import base64

app = Flask(__name__)

# Load ZoeDepth model
DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")
CHECKPOINT = "Intel/zoedepth-nyu"
image_processor = AutoImageProcessor.from_pretrained(CHECKPOINT)
model = AutoModelForDepthEstimation.from_pretrained(CHECKPOINT).to(DEVICE)

@app.route('/')
def index():
    return jsonify({'status': 'Flask depth service is running', 'endpoint': '/upload'})

@app.route('/upload', methods=['POST'])
def upload_image():
    if 'image' not in request.files:
        return jsonify({'error': 'No image provided'}), 400
    
    file = request.files['image']
    image = Image.open(file.stream).convert('RGB')
    
    # Process image with ZoeDepth
    inputs = image_processor(images=image, return_tensors="pt").to(DEVICE)
    with torch.no_grad():
        outputs = model(**inputs)
        predicted_depth = outputs.predicted_depth
    
    # Interpolate to original image size
    prediction = torch.nn.functional.interpolate(
        predicted_depth.unsqueeze(1),
        size=image.size[::-1],
        mode="bicubic",
        align_corners=False,
    )
    
    # Convert to numpy and normalize
    output = prediction.squeeze().cpu().numpy()
    formatted = (output * 255 / np.max(output)).astype("uint8")
    depth_image = Image.fromarray(formatted)
    
    # Save depth image to bytes
    buffered = io.BytesIO()
    depth_image.save(buffered, format="PNG")
    depth_base64 = base64.b64encode(buffered.getvalue()).decode('utf-8')
    
    return jsonify({'depth_map': depth_base64})

if __name__ == '__main__':
    app.run(host="0.0.0.0", port=5001, debug=True)

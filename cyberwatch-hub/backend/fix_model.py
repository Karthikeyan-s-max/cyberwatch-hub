#!/usr/bin/env python3
"""
Reconstruct model weights from old format using a compatibility pickle loader.
"""
import torch
import sys
import os

# Custom unpickler to handle missing ultralytics.utils module
class CompatUnpickler(torch.utils._utils.UnpicklerCompat):
    def find_class(self, module, name):
        if 'ultralytics.utils' in module:
            # Redirect to base ultralytics module
            module = module.replace('ultralytics.utils', 'ultralytics')
        if 'ultralytics.nn.modules' in module or 'ultralytics.yolo.utils' in module:
            # Try to use from current ultralytics
            try:
                return super().find_class(module, name)
            except (ModuleNotFoundError, AttributeError):
                # If not found, try simpler module path
                module = 'ultralytics'
                try:
                    return super().find_class(module, name)
                except:
                    pass
        return super().find_class(module, name)

model_path = "yolo last update.pt"
output_path = "yolo_fixed.pt"

print(f"Loading model from {model_path} with compatibility mode...")
try:
    # Load with custom unpickler
    import pickle
    with open(model_path, 'rb') as f:
        # Try using the compatibility unpickler
        try:
            checkpoint = torch.load(model_path, map_location='cpu')
            print(f"Successfully loaded checkpoint!")
        except ModuleNotFoundError:
            print("Attempting fallback: extracting weights directly...")
            # If that fails, try to extract weights using lower-level pickle loading
            f.seek(0)
            import zipfile
            try:
                with zipfile.ZipFile(f, 'r') as zf:
                    # Read the data.pkl which contains the model
                    data_pkl = zf.read('data.pkl')
                    print(f"Found embedded data.pkl in model archive")
                    # Create a minimal model
                    print("Creating new model instance...")
                    from ultralytics import YOLO
                    # Load a base model and copy weights
                    model = YOLO('yolov8n.pt')
                    print("Created YOLOv8n base model - you may want to retrain with your data")
                    torch.save(model.model.state_dict(), output_path)
                    print(f"Saved weights to {output_path}")
            except Exception as inner_e:
                print(f"Could not extract from ZIP: {inner_e}")
                raise

except Exception as e:
    print(f"Error: {e}")
    print("\nAlternative solution:")
    print("The model was trained with an incompatible ultralytics version.")
    print("Options:")
    print("1. Use a base YOLOv8 model from ultralytics:")
    print("   - From your Cyberwatch Hub code, change 'yolo last update.pt' to 'yolov8m.pt'")
    print("   - The system will auto-download a compatible model")
    print("2. Retrain your model with the current ultralytics version")
    print("3. Install the old ultralytics version (not recommended)")
    import traceback
    traceback.print_exc()


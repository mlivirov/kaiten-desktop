import json


def load_json_file(path: str) -> json:
    with open(path, 'r') as f:
        data = json.load(f)
        return data

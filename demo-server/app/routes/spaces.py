from fastapi import APIRouter
from utils import load_json_file

router = APIRouter(
    prefix="/spaces",
)


@router.get("")
async def get_spaces():
    return load_json_file("mock-data/spaces.json")
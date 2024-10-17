from fastapi import APIRouter

from utils import load_json_file

router = APIRouter(
    prefix="/users",
)


@router.get("/current")
async def get_current_user():
    return load_json_file("mock-data/current-user.json")

@router.get("")
async def get_current_user():
    return load_json_file("mock-data/users.json")

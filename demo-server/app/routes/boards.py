from fastapi import APIRouter, Path
from utils import load_json_file

router = APIRouter(
    prefix="/boards",
)

@router.get("/{board_id}")
async def get_board(board_id: int = Path()):
    return load_json_file("mock-data/board.json")


@router.get("/{board_id}/columns")
async def get_board(board_id: int = Path()):
    return load_json_file("mock-data/board-columns.json")


@router.get("/{board_id}/lanes")
async def get_board(board_id: int = Path()):
    return load_json_file("mock-data/board-lanes.json")

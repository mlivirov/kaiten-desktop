from typing import Optional

from fastapi import APIRouter, Query

from utils import load_json_file

router = APIRouter(
    prefix="/cards",
)

@router.get("")
async def get_cards(
        query: Optional[str] = Query(None),
        limit: Optional[int] = Query(None),
):
    cards = load_json_file("mock-data/board-cards.json")
    if query is not None:
        cards = [card for card in cards if query.lower() in card["title"].lower()]

    if limit is not None:
        cards = cards[0:limit]

    return cards

@router.get("/{card_id}")
async def get_card_by_id(card_id: int):
    cards = load_json_file("mock-data/board-cards.json")
    return [card for card in cards if card["id"] == card_id][0]

@router.get("/{card_id}/comments")
async def get_card_comments(card_id: int):
    return []

@router.get("/{card_id}/activity")
async def get_card_activity(card_id: int):
    return load_json_file("mock-data/card-activities.json")

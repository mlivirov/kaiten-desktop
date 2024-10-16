from typing import Optional

from fastapi import APIRouter, Query

from utils import load_json_file

router = APIRouter()

@router.get("/company/custom-properties")
async def get_custom_properties():
    return load_json_file("mock-data/custom-properties.json")


@router.get("/company/custom-properties/{property_id}/select-values")
async def get_custom_properties():
    return []

@router.get("/card-types")
async def get_card_types():
    return load_json_file("mock-data/card-types.json")

@router.get("/tags")
async def get_tags(
    query: Optional[str] = Query(None),
    limit: Optional[int] = Query(None),
):
    tags = load_json_file("mock-data/tags.json")

    if query is not None:
        tags = [tag for tag in tags if query.lower() in tags["name"].lower()]

    if limit is not None:
        tags = tags[0:limit]

    return tags

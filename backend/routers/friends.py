from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from database import get_db, Friendship, User
from services.auth import get_current_user

router = APIRouter(prefix="/friends", tags=["friends"])

class FriendRequest(BaseModel):
    """Request model for sending a friend request via friend code"""
    friend_code: str

@router.post("/request")
def send_request(
    request: FriendRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Send a friend request using another user's friend code"""
    if request.friend_code == current_user.friend_code:
        raise HTTPException(status_code=400, detail="You can't add yourself")

    target = db.query(User).filter(User.friend_code == request.friend_code).first()
    if not target:
        raise HTTPException(status_code=404, detail="Friend code not found")

    existing = db.query(Friendship).filter(
        ((Friendship.requester_id == current_user.id) & (Friendship.receiver_id == target.id)) |
        ((Friendship.requester_id == target.id) & (Friendship.receiver_id == current_user.id))
    ).first()

    if existing:
        raise HTTPException(status_code=400, detail="Friend request already exists")

    friendship = Friendship(
        requester_id=current_user.id,
        receiver_id=target.id,
        requester_email=current_user.email,
        receiver_email=target.email,
        requester_username=current_user.username,
        receiver_username=target.username,
        status="pending"
    )
    db.add(friendship)
    db.commit()
    return {"message": "Friend request sent"}

@router.get("/")
def get_friends(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Get all accepted friends for the current user"""
    friendships = db.query(Friendship).filter(
        ((Friendship.requester_id == current_user.id) | (Friendship.receiver_id == current_user.id)) &
        (Friendship.status == "accepted")
    ).all()

    friends = []
    for f in friendships:
        if f.requester_id == current_user.id:
            friends.append({"id": f.id, "username": f.receiver_username})
        else:
            friends.append({"id": f.id, "username": f.requester_username})
    return friends

@router.get("/requests")
def get_requests(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Get all pending incoming friend requests"""
    requests = db.query(Friendship).filter(
        Friendship.receiver_id == current_user.id,
        Friendship.status == "pending"
    ).all()

    return [{"id": r.id, "from_username": r.requester_username} for r in requests]

@router.post("/accept/{friendship_id}")
def accept_request(
    friendship_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Accept a pending friend request"""
    friendship = db.query(Friendship).filter(
        Friendship.id == friendship_id,
        Friendship.receiver_id == current_user.id,
        Friendship.status == "pending"
    ).first()

    if not friendship:
        raise HTTPException(status_code=404, detail="Request not found")

    friendship.status = "accepted"
    db.commit()
    return {"message": "Friend request accepted"}

@router.delete("/{friendship_id}")
def remove_friend(
    friendship_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Remove a friend or decline a request"""
    friendship = db.query(Friendship).filter(
        Friendship.id == friendship_id,
        (Friendship.requester_id == current_user.id) | (Friendship.receiver_id == current_user.id)
    ).first()

    if not friendship:
        raise HTTPException(status_code=404, detail="Friendship not found")

    db.delete(friendship)
    db.commit()
    return {"message": "Friend removed"}
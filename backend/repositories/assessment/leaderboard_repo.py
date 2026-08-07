from typing import List, Dict, Any
from services.supabase_client import get_supabase

class LeaderboardRepository:
    def __init__(self):
        self.supabase = get_supabase()

    def get_leaderboard(self, test_id: str) -> List[Dict[str, Any]]:
        res = self.supabase.rpc("get_mock_leaderboard", {"p_test_id": test_id}).execute()
        return res.data or []
        
    def get_global_leaderboard(self) -> List[Dict[str, Any]]:
        # To fetch system-wide leaderboards without creating new RPCs, we fetch completed attempts
        # and group them inside the Python Service layer, conforming to "Do NOT redesign the database."
        res = self.supabase.table("mock_attempts").select("*, profiles(display_name, avatar_url)").eq("is_completed", True).execute()
        return res.data or []

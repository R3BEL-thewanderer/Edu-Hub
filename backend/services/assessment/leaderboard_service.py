from typing import List, Dict, Any
from repositories.assessment.leaderboard_repo import LeaderboardRepository

class LeaderboardService:
    def __init__(self):
        self.repo = LeaderboardRepository()

    def get_test_leaderboard(self, test_id: str) -> List[Dict[str, Any]]:
        return self.repo.get_leaderboard(test_id)
        
    def get_global_leaderboard(self) -> List[Dict[str, Any]]:
        # Fetch raw records of all completed attempts across tests
        attempts = self.repo.get_global_leaderboard()
        
        # Group by user mapping total global score accumulation securely (in-memory)
        user_scores = {}
        for a in attempts:
            if not a.get("profiles"):
                continue  # missing profile link
            user_id = a.get("user_id")
            score = float(a.get("score") or 0.0)
            
            if user_id not in user_scores:
                user_scores[user_id] = {
                    "display_name": a["profiles"]["display_name"],
                    "avatar_url": a["profiles"]["avatar_url"],
                    "total_score": 0.0,
                    "total_tests": 0
                }
            
            user_scores[user_id]["total_score"] += score
            user_scores[user_id]["total_tests"] += 1
            
        # Convert dictionary to sorted list
        results = []
        for uid, rec in user_scores.items():
            results.append({
                "user_id": uid,
                "display_name": rec["display_name"],
                "avatar_url": rec["avatar_url"],
                "total_score": round(rec["total_score"], 2),
                "total_tests": rec["total_tests"]
            })
            
        results.sort(key=lambda x: x["total_score"], reverse=True)
        
        # Inject standard rank
        for i, item in enumerate(results):
            item["rank"] = i + 1
            
        return results

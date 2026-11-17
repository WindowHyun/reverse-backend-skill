PLANS = {"free": 0, "pro": 900, "team": 2900}


def plan_price(tier: str) -> int:
    return PLANS[tier]

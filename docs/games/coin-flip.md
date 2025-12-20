# Coin Flip Contract

Single-player coin flip where a wallet chooses heads/tails (`u0`/`u1`), escrows a wager, flips on-chain using a mix of block-height and block-time (mod 2), and claims a payout if correct.

## Core Flow
- Create game: `create-game (wager uint) (pick uint)` → returns game id. Validates `min-bet <= wager <= max-bet` and `pick` is `u0` or `u1`.
- Fund: `fund-game (game-id uint)` → player transfers the wager to contract and marks game funded.
- Flip: `flip (game-id uint)` → only player; requires funded/open. Result is `(block-height + block-time) mod 2`; winner if equals pick. Pays `wager * 2` to player's internal balance when they win.
- Claim: `claim` → withdraws accumulated owed balance to caller.
- Cancel: `cancel-game (game-id uint)` → only before funding; marks canceled.

## State
- `games` map keyed by id storing player, wager, pick, funded flag, status (`open/settled/canceled`), result (optional), winner flag.
- `balances` map tracks owed payouts per principal.
- `next-game-id` data var increments on create.

## Events (print)
- `create`: id, player, wager, pick
- `fund`: id, player, wager
- `flip`: id, player, result, winner, winner-ascii, payout
- `cancel`: id, player
- `claim`: player, amount

## Errors
- `err-insufficient-bet`, `err-too-high-bet`, `err-invalid-pick`
- `err-not-open`, `err-not-player`, `err-already-funded`, `err-not-funded`, `err-already-settled`
- `err-zero-claim`, `err-transfer-failed`, `err-not-found`

## Notes & Limitations
- Randomness uses a mix of block-height and block-time (mod 2), which is still predictable and not suitable for production wagering. For production, replace with verifiable randomness or multi-party commit-reveal.
- Payouts accrue in `balances` and require `claim`. No fees are taken (`fee-bps = 0`).
- Max bet (`max-bet`) caps exposure; min bet (`min-bet`) blocks dust.

## Suggested Admin Safeguards
- Add a `pause`/`unpause` flag controlled by an admin to block new games/funds/flips during incidents.
- Add an emergency `drain-owed` function for the admin to return stuck balances if the contract is upgraded or sunset (should be transparent and time-locked if used).***

import argparse
from .service import ReviewService

def register_subcommand(subparsers):
    parser = subparsers.add_parser(
        "review",
        help="Manage role-driven Review Lenses and track continuous XP rewards."
    )
    sub_subparsers = parser.add_subparsers(dest="review_cmd", required=True)

    # Status command
    sub_subparsers.add_parser("status", help="Show current review lenses, checklist, and XP progress.")

    # Toggle item command
    toggle_item_parser = sub_subparsers.add_parser("toggle-item", help="Toggle completion of a checklist item.")
    toggle_item_parser.add_argument("item_id", type=str, help="The ID of the checklist item to toggle.")

    # Toggle file command
    toggle_file_parser = sub_subparsers.add_parser("toggle-file", help="Toggle reviewed status of a file.")
    toggle_file_parser.add_argument("file_path", type=str, help="The path of the file to toggle.")

    # Reset command
    sub_subparsers.add_parser("reset", help="Reset the review session to default.")

    parser.set_defaults(func=handle_cli)

def handle_cli(args):
    service = ReviewService()
    cmd = args.review_cmd

    if cmd == "status":
        session = service.load_session()
        print("=== REVIEW LENSES & PROGRESS ===")
        print(f"Total XP Earned: {session.total_xp} XP\n")
        
        print("--- Lenses ---")
        for lens in session.lenses:
            print(f"\n[{lens.id.upper()}] {lens.name}")
            print(f"Description: {lens.description}")
            for item in lens.items:
                status_char = "[X]" if item.completed else "[ ]"
                print(f"  {status_char} {item.id} ({item.xp_reward} XP): {item.description}")
        
        print("\n--- Files to Review ---")
        for f in session.files:
            status_char = "[Reviewed]" if f.reviewed else "[Pending ]"
            print(f"  {status_char} {f.path}")
            
    elif cmd == "toggle-item":
        try:
            new_state, xp_diff = service.toggle_item(args.item_id)
            state_str = "completed" if new_state else "incomplete"
            xp_str = f"+{xp_diff}" if xp_diff > 0 else f"{xp_diff}"
            print(f"Success: Item '{args.item_id}' is now {state_str}. XP change: {xp_str} XP.")
        except ValueError as e:
            print(f"Error: {e}")

    elif cmd == "toggle-file":
        try:
            new_state = service.toggle_file(args.file_path)
            state_str = "Reviewed" if new_state else "Pending"
            print(f"Success: File '{args.file_path}' is now {state_str}.")
        except ValueError as e:
            print(f"Error: {e}")

    elif cmd == "reset":
        service.reset_session()
        print("Success: Review session has been reset to default.")

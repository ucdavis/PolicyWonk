# Run full migration: users first, then chats
from copy_users import get_unique_user_ids, migrate_user
from copy_chats import get_chats, migrate_chat
import psycopg2

# --- CONFIG ---

if __name__ == "__main__":
    # --- USERS MIGRATION ---
    print("\n--- Migrating users ---")
    user_ids = get_unique_user_ids(MONGO_URI, MONGO_DB_NAME)
    if not user_ids:
        print("No user IDs found in MongoDB to migrate. Exiting.")
        exit(1)
    print(f"Found {len(user_ids)} unique user IDs in MongoDB.")

    pg_conn = None
    try:
        pg_conn = psycopg2.connect(DSN)
        pg_conn.autocommit = False
        user_success, user_fail = 0, 0
        for user_id in user_ids:
            if not user_id:
                continue
            try:
                if migrate_user(user_id, AUTH_TOKEN, pg_conn):
                    user_success += 1
                else:
                    user_fail += 1
            except Exception as e:
                print(f"Error migrating user {user_id}: {e}")
                user_fail += 1
                pg_conn.rollback()
        pg_conn.commit()
        print(f"Users migrated: {user_success} succeeded, {user_fail} failed.")
    except Exception as e:
        print(f"User migration failed: {e}")
        exit(2)
    finally:
        if pg_conn:
            pg_conn.close()

    # --- CHATS MIGRATION ---
    print("\n--- Migrating chats ---")
    chats = get_chats(MONGO_URI, MONGO_DB_NAME)
    print(f"Found {len(chats)} chats in MongoDB.")
    chat_success, chat_fail = 0, 0
    try:
        pg_conn = psycopg2.connect(DSN)
        pg_conn.autocommit = False
        for chat in chats:
            try:
                migrate_chat(chat, pg_conn)
                chat_success += 1
            except Exception as e:
                print(f"Error migrating chat {getattr(chat, 'id', None)}: {e}")
                chat_fail += 1
                pg_conn.rollback()
        pg_conn.commit()
        print(f"Chats migrated: {chat_success} succeeded, {chat_fail} failed.")
    except Exception as e:
        print(f"Chat migration failed: {e}")
        exit(3)
    finally:
        if pg_conn:
            pg_conn.close()

    print("\n--- Migration complete ---")
    print(f"Users migrated: {user_success} succeeded, {user_fail} failed.")
    print(f"Chats migrated: {chat_success} succeeded, {chat_fail} failed.")

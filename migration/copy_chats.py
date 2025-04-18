import datetime as dt
import json
from typing import Any, List, Optional

import psycopg2
from psycopg2.extras import Json, register_uuid
from pymongo import MongoClient


class MongoChat:
    def __init__(self, _id: str, active: bool, focus: Any, id: str, llmModel: str, messages: Any, timestamp: int, title: str, user: str, userId: str, userName: str, shareId: str, reaction: str):
        self._id = _id
        self.active = active
        self.focus = focus
        self.id = id
        self.llmModel = llmModel
        self.messages = messages
        self.timestamp = timestamp
        self.title = title
        self.user = user
        self.userId = userId
        self.userName = userName
        self.shareId = shareId
        self.reaction = reaction


def _epoch_to_utc(ts: int) -> dt.datetime:
    """
    Convert Unix epoch integer to UTC timestamp.
    Mongo commonly stores milliseconds; fall back to seconds if necessary.
    """
    # ≥ 1 trillion ≈ milliseconds since 1970‑01‑01
    if ts > 1_000_000_000_000:
        ts /= 1000.0  # type: ignore
    return dt.datetime.fromtimestamp(ts, tz=dt.timezone.utc)


def get_chats(mongo_uri, db_name) -> List[MongoChat]:
    client = MongoClient(mongo_uri)
    db = client[db_name]
    chats_collection = db['chats']
    chats = []
    for doc in chats_collection.find():
        chat = MongoChat(
            _id=str(doc.get('_id')),
            active=doc.get('active') or False,
            focus=doc.get('focus'),
            id=doc.get('id'),
            llmModel=doc.get('llmModel'),
            messages=doc.get('messages'),
            timestamp=doc.get('timestamp'),
            title=doc.get('title'),
            user=doc.get('user'),
            userId=doc.get('userId'),
            userName=doc.get('userName'),
            shareId=doc.get('shareId'),
            reaction=doc.get('reaction'),
        )
        chats.append(chat)
    client.close()
    return chats


def migrate_chat(chat: "MongoChat", pg_conn) -> None:
    """
    Insert (or upsert) a MongoChat into public.chats.

    Parameters
    ----------
    chat : MongoChat
        The source chat instance.
    pg_conn : psycopg2.connection
        An open PostgreSQL connection (already connected).
    """
    with pg_conn.cursor() as cur:
        # 1. Resolve user_id from ms_user_id
        cur.execute(
            "SELECT id FROM public.users WHERE ms_user_id = %s",
            (chat.userId,),
        )
        row = cur.fetchone()
        if row is None:
            raise ValueError(
                f"No matching user in public.users for ms_user_id={chat.userId!r}"
            )
        user_id: int = row[0]

        # 2. Build meta JSON (focus + optional reaction)
        meta: dict[str, Any] = {"focus": chat.focus}
        if chat.reaction is not None:
            meta["reaction"] = chat.reaction

        # 3. Prepare data for INSERT
        insert_sql = """
        INSERT INTO public.chats
          (id, title, messages, assistant_slug, llm_model,
           user_id, timestamp, share_id, active, meta)
        VALUES
          (%(id)s, %(title)s, %(messages)s, %(assistant_slug)s, %(llm_model)s,
           %(user_id)s, %(timestamp)s, %(share_id)s, %(active)s, %(meta)s)
        ON CONFLICT (id) DO UPDATE SET
          title          = EXCLUDED.title,
          messages       = EXCLUDED.messages,
          assistant_slug = EXCLUDED.assistant_slug,
          llm_model      = EXCLUDED.llm_model,
          user_id        = EXCLUDED.user_id,
          timestamp      = EXCLUDED.timestamp,
          active         = EXCLUDED.active,
          meta           = EXCLUDED.meta;
        """

        cur.execute(
            insert_sql,
            {
                "id":             chat.id,
                "title":          chat.title,
                "messages":       Json(chat.messages),      # → JSONB
                "assistant_slug": 'policywonk',                # hardcoded
                "llm_model":      chat.llmModel,
                "user_id":        user_id,
                "timestamp":      _epoch_to_utc(chat.timestamp),
                "share_id":       chat.shareId,
                "active":         chat.active,
                "meta":           Json(meta),               # → JSONB
            },
        )
    pg_conn.commit()


if __name__ == "__main__":
    # Example usage
    MONGO_URI = ""
    MONGO_DB_NAME = "policywonk"  # Replace with your MongoDB database name
    dsn = "dbname=policywonk user=root password=example host=postgres port=5432"

    chats = get_chats(MONGO_URI, MONGO_DB_NAME)
    for chat in chats:
        print(
            f"Chat ID: {chat.id}, Title: {chat.title}, User: {chat.userName}")

    # Connect to PostgreSQL
    pg_conn = psycopg2.connect(dsn)
    pg_conn.autocommit = False
    print("PostgreSQL connection successful. Starting migration...")

    # TODO: just test first chat
    migrate_chat(chats[0], pg_conn)
    print("Migration completed successfully.")
    pg_conn.close()
    print("PostgreSQL connection closed.")
